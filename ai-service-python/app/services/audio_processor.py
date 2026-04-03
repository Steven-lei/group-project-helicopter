from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
import librosa
import numpy as np


def _extract_audio_to_wav(video_path: str) -> str | None:
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    tmp_dir = tempfile.mkdtemp(prefix='moodpal-audio-')
    wav_path = os.path.join(tmp_dir, f'{Path(video_path).stem}.wav')

    cmd = [
        ffmpeg_exe,
        '-y',
        '-i',
        video_path,
        '-vn',
        '-acodec',
        'pcm_s16le',
        '-ar',
        '16000',
        '-ac',
        '1',
        wav_path,
    ]

    completed = subprocess.run(cmd, capture_output=True, text=True)
    if completed.returncode != 0 or not os.path.exists(wav_path):
        return None
    return wav_path


def extract_audio_features(video_path: str) -> dict:
    wav_path = _extract_audio_to_wav(video_path)
    if not wav_path:
        return {
            'available': False,
            'durationSec': 0.0,
            'rmsMean': 0.0,
            'rmsStd': 0.0,
            'zeroCrossingRate': 0.0,
            'spectralCentroid': 0.0,
            'tempo': 0.0,
            'pitchMean': 0.0,
            'pitchStd': 0.0,
            'silenceRatio': 1.0,
            'speechActivityRatio': 0.0,
        }

    try:
        signal, sr = librosa.load(wav_path, sr=16000, mono=True)
        if signal.size == 0:
            raise RuntimeError('Empty audio')

        duration_sec = float(librosa.get_duration(y=signal, sr=sr))

        rms = librosa.feature.rms(y=signal)[0]
        zcr = librosa.feature.zero_crossing_rate(signal)[0]
        spectral_centroid = librosa.feature.spectral_centroid(y=signal, sr=sr)[0]

        onset_env = librosa.onset.onset_strength(y=signal, sr=sr)
        tempo = float(librosa.feature.tempo(onset_envelope=onset_env, sr=sr)[0]) if onset_env.size else 0.0

        threshold = max(float(np.percentile(rms, 20)), 1e-4)
        silence_ratio = float(np.mean(rms < threshold)) if rms.size else 1.0
        speech_activity_ratio = 1.0 - silence_ratio

        try:
            f0 = librosa.yin(signal, fmin=70, fmax=350, sr=sr)
            voiced_f0 = f0[np.isfinite(f0)]
            pitch_mean = float(np.mean(voiced_f0)) if voiced_f0.size else 0.0
            pitch_std = float(np.std(voiced_f0)) if voiced_f0.size else 0.0
        except Exception:
            pitch_mean = 0.0
            pitch_std = 0.0

        return {
            'available': True,
            'durationSec': round(duration_sec, 2),
            'rmsMean': round(float(np.mean(rms)) if rms.size else 0.0, 4),
            'rmsStd': round(float(np.std(rms)) if rms.size else 0.0, 4),
            'zeroCrossingRate': round(float(np.mean(zcr)) if zcr.size else 0.0, 4),
            'spectralCentroid': round(float(np.mean(spectral_centroid)) if spectral_centroid.size else 0.0, 2),
            'tempo': round(tempo, 2),
            'pitchMean': round(pitch_mean, 2),
            'pitchStd': round(pitch_std, 2),
            'silenceRatio': round(silence_ratio, 4),
            'speechActivityRatio': round(speech_activity_ratio, 4),
        }
    finally:
        try:
            os.remove(wav_path)
            os.rmdir(os.path.dirname(wav_path))
        except Exception:
            pass
