
from __future__ import annotations

import importlib
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import cv2
import librosa
import numpy as np
import yaml

try:
    import torch
except Exception:  # noqa: BLE001
    torch = None

from .audio_processor import extract_audio_features as extract_audio_debug_features
from .fusion_service import build_ai_feedback, label_from_score
from .text_processor import extract_text_features
from .video_processor import extract_video_features as extract_video_debug_features


class GFMambaService:
    def __init__(self) -> None:
        self.mode = os.getenv('GFMAMBA_MODE', 'auto').lower()
        self.device = torch.device('cuda' if torch and torch.cuda.is_available() else 'cpu') if torch else 'cpu'
        self.vendor_root = Path(__file__).resolve().parents[2] / 'vendor' / 'gfmamba_repo'
        self.config_path = Path(os.getenv('GFMAMBA_CONFIG_PATH', str(self.vendor_root / 'configs' / 'mosi_train.yaml')))
        self.checkpoint_path = Path(os.getenv('GFMAMBA_CKPT_PATH', str(self.vendor_root / 'ckpt' / 'mosi' / 'best_valid_model_seed_42.pth')))
        self.model = None
        self.tokenizer = None
        self.text_encoder = None
        self.native_error = None
        self.runtime = 'gfmamba-fallback'
        self._ready = False
        self._native_available = False
        self._try_initialize()

    @property
    def ready(self) -> bool:
        return self._ready

    def _try_initialize(self) -> None:
        if self.mode == 'fallback':
            self.runtime = 'gfmamba-fallback'
            self._ready = True
            return

        try:
            self._load_native_runtime()
            self.runtime = 'gfmamba-native'
            self._native_available = True
            self._ready = True
        except Exception as exc:  # noqa: BLE001
            self.native_error = str(exc)
            if self.mode == 'native':
                raise
            self.runtime = 'gfmamba-fallback'
            self._ready = True

    def _load_native_runtime(self) -> None:
        if torch is None:
            raise RuntimeError('PyTorch is not installed. Install torch or use GFMAMBA_MODE=fallback.')
        try:
            from transformers import AutoModel, AutoTokenizer  # type: ignore
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError('transformers is not installed. Install transformers or use GFMAMBA_MODE=fallback.') from exc

        missing = []
        for mod in ('mamba_ssm', 'causal_conv1d_cuda', 'selective_scan_cuda'):
            if importlib.util.find_spec(mod) is None:
                missing.append(mod)
        if missing:
            raise RuntimeError(
                'Missing native GFMamba dependencies: ' + ', '.join(missing) +
                '. Install the compiled CUDA/native packages or use GFMAMBA_MODE=fallback.'
            )

        if not self.vendor_root.exists():
            raise RuntimeError(f'GFMamba vendor source not found: {self.vendor_root}')
        if not self.config_path.exists():
            raise RuntimeError(f'GFMamba config not found: {self.config_path}')
        if not self.checkpoint_path.exists():
            raise RuntimeError(f'GFMamba checkpoint not found: {self.checkpoint_path}')

        vendor_path = str(self.vendor_root)
        if vendor_path not in sys.path:
            sys.path.insert(0, vendor_path)

        from models.GFMamba import GFMamba  # type: ignore

        with open(self.config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        self.model = GFMamba(self.config).to(self.device)
        checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
        if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
            state_dict = checkpoint['model_state_dict']
        elif isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
            state_dict = checkpoint['state_dict']
        else:
            state_dict = checkpoint
        self.model.load_state_dict(state_dict, strict=False)
        self.model.eval()

        self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
        self.text_encoder = AutoModel.from_pretrained('bert-base-uncased').to(self.device)
        self.text_encoder.eval()

    def _pad_or_trim(self, arr: np.ndarray, target_len: int, feature_dim: int) -> np.ndarray:
        arr = np.asarray(arr, dtype=np.float32)
        if arr.ndim != 2:
            arr = np.zeros((target_len, feature_dim), dtype=np.float32)
        if arr.shape[0] > target_len:
            arr = arr[:target_len]
        elif arr.shape[0] < target_len:
            pad = np.zeros((target_len - arr.shape[0], arr.shape[1]), dtype=np.float32)
            arr = np.vstack([arr, pad])
        if arr.shape[1] != feature_dim:
            fixed = np.zeros((target_len, feature_dim), dtype=np.float32)
            width = min(feature_dim, arr.shape[1])
            fixed[:, :width] = arr[:, :width]
            arr = fixed
        return arr.astype(np.float32)

    def _extract_text_tensor(self, transcript: str) -> torch.Tensor:
        text = (transcript or '').strip()
        if not text:
            return torch.zeros(1, 50, 768, device=self.device)
        inputs = self.tokenizer(
            text,
            return_tensors='pt',
            padding=True,
            truncation=True,
            max_length=512,
        ).to(self.device)
        with torch.no_grad():
            outputs = self.text_encoder(**inputs)
            features = outputs.last_hidden_state.squeeze(0).detach().cpu().numpy()
        features = self._pad_or_trim(features, 50, 768)
        return torch.from_numpy(features).unsqueeze(0).to(self.device)

    def _extract_audio_tensor(self, video_path: str) -> torch.Tensor:
        with tempfile.TemporaryDirectory() as tmp_dir:
            wav_path = os.path.join(tmp_dir, 'audio.wav')
            cmd = [
                'ffmpeg', '-y', '-i', video_path,
                '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', wav_path,
            ]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
            if not os.path.exists(wav_path):
                return torch.zeros(1, 50, 20, device=self.device)
            try:
                audio, sr = librosa.load(wav_path, sr=16000)
                mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=20).T
                mfcc = self._pad_or_trim(mfcc, 50, 20)
                return torch.from_numpy(mfcc).unsqueeze(0).to(self.device)
            except Exception:  # noqa: BLE001
                return torch.zeros(1, 50, 20, device=self.device)

    def _extract_video_tensor(self, video_path: str) -> torch.Tensor:
        cap = cv2.VideoCapture(video_path)
        feats: list[list[float]] = []
        try:
            while len(feats) < 50:
                ok, frame = cap.read()
                if not ok:
                    break
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                resized = cv2.resize(gray, (64, 64))
                feats.append([
                    float(np.mean(resized)),
                    float(np.std(resized)),
                    float(np.mean(cv2.Laplacian(resized, cv2.CV_64F))),
                    float(np.mean(cv2.Sobel(resized, cv2.CV_64F, 1, 0))),
                    float(np.mean(cv2.Sobel(resized, cv2.CV_64F, 0, 1))),
                ])
        finally:
            cap.release()
        arr = self._pad_or_trim(np.array(feats, dtype=np.float32), 50, 5)
        return torch.from_numpy(arr).unsqueeze(0).to(self.device)

    def _raw_to_ui(self, raw_score: float) -> float:
        return float(np.clip(np.interp(raw_score, [-3.0, 3.0], [0.0, 100.0]), 0.0, 100.0))

    def _weights_from_attention(self, att_weights: torch.Tensor | None) -> dict[str, float]:
        if att_weights is None or att_weights.numel() < 3:
            return {'script': 0.4, 'audio': 0.3, 'facial': 0.3}
        att = att_weights.detach().float().cpu().reshape(att_weights.shape[0], -1)
        base = att[0, :3].numpy().astype(np.float64)
        # graph_fusion order: audio, facial(video), script(text)
        audio_val, facial_val, script_val = base[0], base[1], base[2]
        vals = np.array([script_val, audio_val, facial_val], dtype=np.float64)
        vals = np.clip(vals, 1e-6, None)
        vals = vals / vals.sum()
        return {
            'script': round(float(vals[0]), 4),
            'audio': round(float(vals[1]), 4),
            'facial': round(float(vals[2]), 4),
        }

    def _confidences(self, transcript: str, debug_audio: dict[str, Any], debug_video: dict[str, Any]) -> dict[str, float]:
        script = 0.35 + min(len((transcript or '').split()) / 30.0, 0.4)
        audio = 0.35 + min(debug_audio.get('speechActivityRatio', 0.0) * 0.45, 0.45)
        facial = 0.35 + min(debug_video.get('facePresenceRatio', 0.0) * 0.45, 0.45)
        return {
            'script': round(float(np.clip(script, 0.12, 0.9)), 2),
            'audio': round(float(np.clip(audio, 0.12, 0.9)), 2),
            'facial': round(float(np.clip(facial, 0.12, 0.9)), 2),
        }

    def _predict_native(self, video_path: str, topic_text: str, transcript: str) -> dict[str, Any]:
        text_tensor = self._extract_text_tensor(transcript)
        audio_tensor = self._extract_audio_tensor(video_path)
        video_tensor = self._extract_video_tensor(video_path)

        zero_text = torch.zeros_like(text_tensor)
        zero_audio = torch.zeros_like(audio_tensor)
        zero_video = torch.zeros_like(video_tensor)

        with torch.no_grad():
            # Important: preserve original repo inference ordering: text, audio(20d), video(5d)
            full_out = self.model(text_tensor, audio_tensor, video_tensor)
            script_out = self.model(text_tensor, zero_audio, zero_video)
            audio_out = self.model(zero_text, audio_tensor, zero_video)
            facial_out = self.model(zero_text, zero_audio, video_tensor)

        full_raw = float(full_out['sentiment_preds'].reshape(-1)[0].detach().cpu())
        script_raw = float(script_out['sentiment_preds'].reshape(-1)[0].detach().cpu())
        audio_raw = float(audio_out['sentiment_preds'].reshape(-1)[0].detach().cpu())
        facial_raw = float(facial_out['sentiment_preds'].reshape(-1)[0].detach().cpu())

        final_score = round(self._raw_to_ui(full_raw), 2)
        script_score = round(self._raw_to_ui(script_raw), 2)
        audio_score = round(self._raw_to_ui(audio_raw), 2)
        facial_score = round(self._raw_to_ui(facial_raw), 2)

        weights = self._weights_from_attention(full_out.get('att_weights'))
        debug_video = extract_video_debug_features(video_path)
        debug_audio = extract_audio_debug_features(video_path)
        text_features = extract_text_features(transcript=transcript, topic_text=topic_text)
        confidences = self._confidences(transcript, debug_audio, debug_video)
        final_conf = round(float(np.clip(
            confidences['script'] * weights['script'] + confidences['audio'] * weights['audio'] + confidences['facial'] * weights['facial'] + 0.05,
            0.2,
            0.95,
        )), 2)

        label = label_from_score(final_score)
        ai_feedback = build_ai_feedback(script_score, audio_score, facial_score, final_score)

        modality_scores = {
            'script': script_score,
            'text': script_score,
            'audio': audio_score,
            'facial': facial_score,
            'video': facial_score,
            'final': final_score,
        }
        modality_confidences = {
            'script': confidences['script'],
            'text': confidences['script'],
            'audio': confidences['audio'],
            'facial': confidences['facial'],
            'video': confidences['facial'],
            'final': final_conf,
        }

        return {
            'runtime': self.runtime,
            'nativeLoaded': True,
            'nativeError': None,
            'scriptScore': script_score,
            'textScore': script_score,
            'audioScore': audio_score,
            'facialScore': facial_score,
            'videoScore': facial_score,
            'finalScore': final_score,
            'sentiment_score': final_score,
            'sentiment_label': label,
            'confidence': final_conf,
            'ai_feedback': ai_feedback,
            'emotion_hint': label,
            'modality_scores': modality_scores,
            'modality_weights': weights,
            'modality_confidences': modality_confidences,
            'video_features': debug_video,
            'audio_features': debug_audio,
            'text_features': {k: v for k, v in text_features.items() if k != 'transcript'},
            'transcript': transcript or '',
            'topicText': topic_text or '',
            'gfmamba_raw_scores': {
                'script': round(script_raw, 4),
                'audio': round(audio_raw, 4),
                'facial': round(facial_raw, 4),
                'final': round(full_raw, 4),
            },
            'multimodal_version': 'gfmamba-native-python-service-v1',
        }

    def _predict_fallback(self, video_path: str, topic_text: str, transcript: str) -> dict[str, Any]:
        from .audio_processor import extract_audio_features
        from .fusion_service import fuse_modalities
        from .video_processor import extract_video_features

        video_features = extract_video_features(video_path)
        audio_features = extract_audio_features(video_path)
        text_features = extract_text_features(transcript=transcript, topic_text=topic_text)
        fused = fuse_modalities(
            video_features=video_features,
            audio_features=audio_features,
            text_features=text_features,
            topic_text=topic_text,
        )
        return {
            **fused,
            'runtime': self.runtime,
            'nativeLoaded': False,
            'nativeError': self.native_error,
            'video_features': video_features,
            'audio_features': audio_features,
            'text_features': {k: v for k, v in text_features.items() if k != 'transcript'},
            'transcript': text_features.get('transcript', ''),
            'topicText': topic_text,
            'multimodal_version': 'gfmamba-fallback-python-service-v1',
        }

    def predict(self, video_path: str, topic_text: str = '', transcript: str = '') -> dict[str, Any]:
        if self._native_available and self.model is not None:
            return self._predict_native(video_path, topic_text, transcript)
        return self._predict_fallback(video_path, topic_text, transcript)
