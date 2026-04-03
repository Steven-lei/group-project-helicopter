from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from ..services.inference_service import infer_sentiment_from_video

router = APIRouter()


@router.post('/infer')
async def infer(
    video: UploadFile = File(...),
    topicText: str = Form(default=''),
    transcript: str = Form(default=''),
):
    try:
        data = await infer_sentiment_from_video(video=video, topic_text=topicText, transcript=transcript)
        return {'success': True, 'data': data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
