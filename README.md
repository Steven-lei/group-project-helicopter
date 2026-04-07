# MoodPal Full New Code

This package is a full refreshed version of the project with these backend response fields added and saved end to end:

- `scriptScore`
- `textScore`
- `audioScore`
- `facialScore`
- `videoScore`
- `finalScore`
- `modalityScores`
- `modalityConfidences`
- `modalityWeights`
- `aiFeedback`

The frontend still keeps the simplified sentiment display:

- Transcript
- Mood Score
- Mood Label
- AI Feedback

So the UI stays clean, but the backend now returns the full modality breakdown for debugging, charts, or future UI expansion.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express + MongoDB
- AI service: Python + FastAPI
- MongoDB via Docker Compose

## Ports

- Frontend: `5173`
- Backend: `5001`
- AI service: `8000`
- MongoDB: `27017`

## Startup

### 1. Start MongoDB

```bash
cd moodpal-full-new-code
docker compose up -d
```

### 2. Start the Python AI service

```bash
cd ai-service-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

### 3. Start the backend

```bash
cd moodpal-full-new-code/backend-node
cp .env.example .env
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:5001/api/health
```

### 4. Seed the database

```bash
cd moodpal-full-new-code/backend-node
npm run seed
```

### 5. Start the frontend

```bash
cd moodpal-full-new-code/frontend-react
cp .env.example .env
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Important API result fields

The main analyze response now includes:

```json
{
  "scriptScore": 54.2,
  "textScore": 54.2,
  "audioScore": 41.8,
  "facialScore": 43.6,
  "videoScore": 43.6,
  "finalScore": 46.3,
  "sentimentScore": 46.3,
  "sentimentLabel": "neutral",
  "confidence": 0.74,
  "aiFeedback": "Your mood seems mixed right now, with some cues appearing more positive than others.",
  "modalityScores": {
    "script": 54.2,
    "text": 54.2,
    "audio": 41.8,
    "facial": 43.6,
    "video": 43.6,
    "final": 46.3
  }
}
```

## MongoDB config

Edit:

`backend-node/.env`

```env
MONGODB_URI=mongodb://localhost:27017/moodpal
AI_SERVICE_URL=http://localhost:8000
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
YOUTUBE_API_KEY=
```

## Notes

- Browser transcript works best in Chrome or Edge.
- If transcript capture is empty, the backend still returns script/text scores based on topic fallback plus other modalities.
- The backend stores all modality scores in `analysis_results`.
