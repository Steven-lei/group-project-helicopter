from __future__ import annotations

from typing import Any

import numpy as np


LOW_LABEL = 'low'
NEUTRAL_LABEL = 'neutral'
POSITIVE_LABEL = 'positive'


def _clip(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return float(np.clip(value, low, high))


def _interp(value: float, src: list[float], dst: list[float]) -> float:
    return float(np.interp(value, src, dst))


def score_video_modality(features: dict[str, Any]) -> tuple[float, float]:
    brightness_score = _interp(features.get('brightness', 110.0), [35, 185], [28, 74])
    motion_value = features.get('motion', 5.0)
    motion_score = 68 - min(abs(motion_value - 9.0) * 2.2, 28)
    face_presence_score = _interp(features.get('facePresenceRatio', 0.0), [0.0, 1.0], [30, 75])
    face_area_score = _interp(features.get('avgFaceAreaRatio', 0.0), [0.0, 0.2], [38, 68])
    smile_score = _interp(features.get('smileFrameRatio', 0.0), [0.0, 0.4], [46, 78])
    duration_score = _interp(features.get('durationSec', 0.0), [5.0, 60.0], [42, 60])

    score = (
        brightness_score * 0.20
        + motion_score * 0.18
        + face_presence_score * 0.24
        + face_area_score * 0.14
        + smile_score * 0.16
        + duration_score * 0.08
    )

    confidence = 0.45 + min(features.get('frameSampleCount', 0) / 30.0, 0.22) + min(features.get('facePresenceRatio', 0.0) * 0.25, 0.25)
    return round(_clip(score), 2), round(float(np.clip(confidence, 0.45, 0.92)), 2)


def score_audio_modality(features: dict[str, Any]) -> tuple[float, float]:
    if not features.get('available'):
        return 50.0, 0.1

    energy_score = _interp(features.get('rmsMean', 0.0), [0.005, 0.08], [38, 70])
    speech_activity_score = _interp(features.get('speechActivityRatio', 0.0), [0.1, 0.9], [35, 72])
    pitch_score = 66 - min(abs(features.get('pitchMean', 0.0) - 180.0) / 3.5, 18)
    pitch_var_score = _interp(features.get('pitchStd', 0.0), [10.0, 70.0], [42, 68])
    tempo_score = 66 - min(abs(features.get('tempo', 0.0) - 110.0) / 4.0, 22)
    silence_penalty = _interp(features.get('silenceRatio', 1.0), [0.0, 1.0], [6, -14])

    score = (
        energy_score * 0.22
        + speech_activity_score * 0.24
        + pitch_score * 0.18
        + pitch_var_score * 0.14
        + tempo_score * 0.12
        + (50 + silence_penalty) * 0.10
    )

    confidence = 0.45 + min(features.get('durationSec', 0.0) / 60.0, 0.20) + min(features.get('speechActivityRatio', 0.0) * 0.25, 0.25)
    return round(_clip(score), 2), round(float(np.clip(confidence, 0.45, 0.9)), 2)


def score_text_modality(features: dict[str, Any], topic_text: str) -> tuple[float, float]:
    if not features.get('available'):
        topic_lower = (topic_text or '').lower()
        base = 50.0
        if any(word in topic_lower for word in ('smile', 'grateful', 'proud', 'love', 'good')):
            base += 6
        if any(word in topic_lower for word in ('tired', 'stress', 'sad', 'help', 'rest', 'bother')):
            base -= 6
        return round(_clip(base), 2), 0.12

    token_count = features.get('tokenCount', 0)
    score = 50.0
    score += features.get('positiveCount', 0) * 7.5
    score -= features.get('negativeCount', 0) * 8.5
    score += features.get('supportCount', 0) * 3.5
    score += features.get('topicAlignment', 0.0) * 6.0
    score -= features.get('intensifierCount', 0) * 1.0 if features.get('negativeCount', 0) > features.get('positiveCount', 0) else 0.0
    score -= features.get('negationCount', 0) * 2.5
    score += min(features.get('lexicalDiversity', 0.0) * 12.0, 8.0)
    if token_count < 5:
        score -= 6.0

    confidence = 0.35 + min(token_count / 30.0, 0.35) + min(features.get('topicAlignment', 0.0) * 0.20, 0.20)
    return round(_clip(score), 2), round(float(np.clip(confidence, 0.35, 0.92)), 2)


def label_from_score(score: float) -> str:
    if score <= 30:
        return LOW_LABEL
    if score <= 60:
        return NEUTRAL_LABEL
    return POSITIVE_LABEL


def emotion_hint_from_score(score: float) -> str:
    if score <= 22:
        return 'very low'
    if score <= 30:
        return 'sad'
    if score <= 45:
        return 'tired'
    if score <= 60:
        return 'calm'
    if score <= 78:
        return 'positive'
    return 'happy'


def build_ai_feedback(script_score: float, audio_score: float, facial_score: float, final_score: float) -> str:
    if final_score <= 30:
        if script_score < 35 and audio_score < 45:
            return 'Your words and voice both suggest that you may be feeling emotionally low right now.'
        if script_score < 35:
            return 'Your transcript suggests a lower mood, even though the other cues are more mixed.'
        return 'Your overall mood appears low at the moment, and a gentle break may help.'

    if final_score <= 60:
        if max(script_score, audio_score, facial_score) - min(script_score, audio_score, facial_score) > 18:
            return 'Your mood seems mixed right now, with some cues appearing more positive than others.'
        return 'Your overall mood seems fairly neutral and balanced at the moment.'

    if script_score > 60 and facial_score > 60:
        return 'Your words and facial cues both suggest a positive and emotionally stable mood.'
    return 'Your overall response sounds positive.'


def fuse_modalities(video_features: dict[str, Any], audio_features: dict[str, Any], text_features: dict[str, Any], topic_text: str) -> dict:
    facial_score, facial_confidence = score_video_modality(video_features)
    audio_score, audio_confidence = score_audio_modality(audio_features)
    script_score, script_confidence = score_text_modality(text_features, topic_text)

    base_weights = {'script': 0.40, 'audio': 0.30, 'facial': 0.30}
    confidences = {'script': script_confidence, 'audio': audio_confidence, 'facial': facial_confidence}
    availability = {
        'script': 1.0 if text_features.get('available') else 0.35,
        'audio': 1.0 if audio_features.get('available') else 0.20,
        'facial': 1.0,
    }
    scores = {'script': script_score, 'audio': audio_score, 'facial': facial_score}

    raw_weights = {
        modality: base_weights[modality] * confidences[modality] * availability[modality]
        for modality in base_weights
    }
    total_weight = sum(raw_weights.values()) or 1.0
    normalized_weights = {modality: round(weight / total_weight, 4) for modality, weight in raw_weights.items()}

    final_score = sum(scores[modality] * normalized_weights[modality] for modality in scores)
    final_confidence = sum(confidences[modality] * normalized_weights[modality] for modality in confidences)
    final_confidence = float(np.clip(final_confidence + 0.06, 0.45, 0.95))

    final_score = round(_clip(final_score), 2)
    label = label_from_score(final_score)
    emotion_hint = emotion_hint_from_score(final_score)
    ai_feedback = build_ai_feedback(script_score, audio_score, facial_score, final_score)

    modality_scores = {
        'script': round(script_score, 2),
        'text': round(script_score, 2),
        'audio': round(audio_score, 2),
        'facial': round(facial_score, 2),
        'video': round(facial_score, 2),
        'final': final_score,
    }
    modality_confidences = {
        'script': round(script_confidence, 2),
        'text': round(script_confidence, 2),
        'audio': round(audio_confidence, 2),
        'facial': round(facial_confidence, 2),
        'video': round(facial_confidence, 2),
        'final': round(final_confidence, 2),
    }

    return {
        'scriptScore': modality_scores['script'],
        'textScore': modality_scores['text'],
        'audioScore': modality_scores['audio'],
        'facialScore': modality_scores['facial'],
        'videoScore': modality_scores['video'],
        'finalScore': modality_scores['final'],
        'sentiment_score': final_score,
        'sentiment_label': label,
        'confidence': round(final_confidence, 2),
        'emotion_hint': emotion_hint,
        'ai_feedback': ai_feedback,
        'modality_scores': modality_scores,
        'modality_confidences': modality_confidences,
        'modality_weights': normalized_weights,
    }
