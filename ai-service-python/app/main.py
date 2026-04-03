from fastapi import FastAPI
from .routes.inference import router as inference_router

app = FastAPI(title="MoodPal AI Service", version="1.0.0")

app.include_router(inference_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "moodpal-ai", "modelLoaded": True}
