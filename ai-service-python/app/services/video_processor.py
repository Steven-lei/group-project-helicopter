from __future__ import annotations

from functools import lru_cache

import cv2
import numpy as np


@lru_cache(maxsize=1)
def _load_face_cascade() -> cv2.CascadeClassifier:
    return cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')


@lru_cache(maxsize=1)
def _load_smile_cascade() -> cv2.CascadeClassifier:
    return cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')


def extract_video_features(video_path: str) -> dict:
    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        raise RuntimeError('Could not open uploaded video')

    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
    duration_sec = frame_count / fps if fps > 0 else 0.0

    brightness_values: list[float] = []
    motion_values: list[float] = []
    edge_density_values: list[float] = []
    face_area_ratios: list[float] = []

    sampled = 0
    face_detected_count = 0
    smile_detected_count = 0
    previous_gray = None

    target_samples = min(max(frame_count, 1), 24)
    step = max(frame_count // target_samples, 1) if frame_count > 0 else 1

    face_cascade = _load_face_cascade()
    smile_cascade = _load_smile_cascade()

    current_index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break

        if current_index % step != 0:
            current_index += 1
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness_values.append(float(gray.mean()))

        edges = cv2.Canny(gray, 100, 200)
        edge_density_values.append(float(np.count_nonzero(edges) / max(edges.size, 1)))

        if previous_gray is not None:
            diff = cv2.absdiff(gray, previous_gray)
            motion_values.append(float(diff.mean()))
        previous_gray = gray

        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
        if len(faces) > 0:
            face_detected_count += 1
            x, y, w, h = max(faces, key=lambda item: item[2] * item[3])
            frame_area = frame.shape[0] * frame.shape[1]
            face_area_ratios.append(float((w * h) / max(frame_area, 1)))

            roi_gray = gray[y:y + h, x:x + w]
            if roi_gray.size > 0:
                smiles = smile_cascade.detectMultiScale(
                    roi_gray,
                    scaleFactor=1.7,
                    minNeighbors=22,
                    minSize=(20, 20),
                )
                if len(smiles) > 0:
                    smile_detected_count += 1

        sampled += 1
        current_index += 1
        if sampled >= target_samples:
            break

    capture.release()

    avg_brightness = float(np.mean(brightness_values)) if brightness_values else 110.0
    avg_motion = float(np.mean(motion_values)) if motion_values else 5.0
    avg_edge_density = float(np.mean(edge_density_values)) if edge_density_values else 0.08
    avg_face_area_ratio = float(np.mean(face_area_ratios)) if face_area_ratios else 0.0
    face_presence_ratio = face_detected_count / max(sampled, 1)
    smile_frame_ratio = smile_detected_count / max(sampled, 1)

    return {
        'brightness': round(avg_brightness, 2),
        'motion': round(avg_motion, 2),
        'durationSec': round(duration_sec, 2),
        'frameSampleCount': sampled,
        'edgeDensity': round(avg_edge_density, 4),
        'facePresenceRatio': round(face_presence_ratio, 4),
        'avgFaceAreaRatio': round(avg_face_area_ratio, 4),
        'smileFrameRatio': round(smile_frame_ratio, 4),
    }
