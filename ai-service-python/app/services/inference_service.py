
from __future__ import annotations

import os
import tempfile
import time
import uuid
from pathlib import Path

from fastapi import UploadFile

from .gfmamba_service import GFMambaService

_GFMAMBA = GFMambaService()


async def infer_sentiment_from_video(video: UploadFile, topic_text: str = '', transcript: str = '') -> dict:
    started = time.perf_counter()
    suffix = Path(video.filename or 'video.webm').suffix or '.webm'

    with tempfile.TemporaryDirectory() as tmp_dir:
        temp_path = os.path.join(tmp_dir, f'{uuid.uuid4().hex}{suffix}')
        with open(temp_path, 'wb') as out:
            content = await video.read()
            out.write(content)

        result = _GFMAMBA.predict(temp_path, topic_text=topic_text, transcript=transcript)
        processing_time_ms = int((time.perf_counter() - started) * 1000)
        return {
            **result,
            'processing_time_ms': processing_time_ms,
            'model_family': 'GFMamba',
            'service_mode': _GFMAMBA.runtime,
        }
