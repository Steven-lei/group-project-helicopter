import { useEffect, useMemo, useState } from 'react';
import { api } from './api/client';
import PetCharacter from './components/PetCharacter';
import PetPromptBubble from './components/PetPromptBubble';
import TopicCard from './components/TopicCard';
import CameraRecorder from './components/CameraRecorder';
import AnalysisResultCard from './components/AnalysisResultCard';
import TaskRecommendationList from './components/TaskRecommendationList';
import MusicRecommendationList from './components/MusicRecommendationList';
import SessionHistory from './components/SessionHistory';

const USER_ID = 'user_001';

function mapPetMoodFromScore(score) {
  const value = Number(score ?? 50);
  if (value <= 25) return 'sleepy';
  if (value <= 45) return 'sad';
  if (value <= 70) return 'neutral';
  if (value <= 85) return 'happy';
  return 'excited';
}

export default function App() {
  const [sessionId, setSessionId] = useState('');
  const [topic, setTopic] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [petMood, setPetMood] = useState('neutral');
  const [currentMoodScore, setCurrentMoodScore] = useState(50);
  const [completedTaskPoints, setCompletedTaskPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [turnIndex, setTurnIndex] = useState(1);
  const [sessionSummary, setSessionSummary] = useState('');
  const [petOverlayMessage, setPetOverlayMessage] = useState('');
  const [reminderTaskTitle, setReminderTaskTitle] = useState('');
  const [showTopicMessage, setShowTopicMessage] = useState(true);

  const petMessage = useMemo(() => {
    if (petOverlayMessage) return petOverlayMessage;
    if (showTopicMessage && topic?.petMessage) return topic.petMessage;
    if (result?.petReply) return result.petReply;
    if (topic?.petMessage) return topic.petMessage;
    return 'Hi! I would like to do a quick mood check with you today.';
  }, [petOverlayMessage, result, showTopicMessage, topic]);

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        const sessionResponse = await api.post('/sessions', { userId: USER_ID });
        const sessionData = sessionResponse.data.data;
        const newSessionId = sessionData.sessionId;
        setSessionId(newSessionId);
        setCurrentMoodScore(sessionData.currentMoodScore ?? 50);
        setPetMood(sessionData.petMood ?? mapPetMoodFromScore(sessionData.currentMoodScore ?? 50));
        setShowTopicMessage(true);

        const topicResponse = await api.get('/topics/next', {
          params: { userId: USER_ID, sessionId: newSessionId }
        });
        setTopic(topicResponse.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to initialize app');
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    if (!petOverlayMessage) return undefined;
    const timer = setTimeout(() => {
      setPetOverlayMessage('');
    }, 7000);
    return () => clearTimeout(timer);
  }, [petOverlayMessage]);

  useEffect(() => {
    if (!result) return;
    const latestScore = Number(result.finalScore ?? result.sentimentScore ?? 50);
    setCurrentMoodScore(latestScore);
    setPetMood(mapPetMoodFromScore(latestScore));
  }, [result]);

  async function refreshHistory(currentSessionId) {
    const response = await api.get(`/sessions/${currentSessionId}/results`);
    const payload = response.data.data;
    setHistory(payload.results);
    setCompletedTaskPoints(payload.session.completedTaskPoints);
  }

  async function fetchNextTopic() {
    if (!sessionId) return;
    setSessionSummary('');
    setReminderTaskTitle('');
    setPetOverlayMessage('Let me think of a new topic for you...');
    setShowTopicMessage(true);
    const response = await api.get('/topics/next', {
      params: { userId: USER_ID, sessionId }
    });
    setTopic(response.data.data);
    setTurnIndex((value) => value + 1);
  }

  async function handleRecordingComplete(payload) {
    if (!sessionId || !topic) return;

    const normalizedPayload = payload?.videoBlob ? payload : { videoBlob: payload, transcript: '' };

    try {
      setAnalyzing(true);
      setError('');
      setPetOverlayMessage('I am analyzing your video, voice, and words together...');
      const form = new FormData();
      form.append('video', normalizedPayload.videoBlob, `response-${Date.now()}.webm`);
      form.append('userId', USER_ID);
      form.append('sessionId', sessionId);
      form.append('topicId', topic.topicId);
      form.append('topicText', topic.topicText);
      form.append('turnIndex', String(turnIndex));
      form.append('transcript', normalizedPayload.transcript || '');

      const response = await api.post('/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const nextResult = response.data.data;
      const latestScore = Number(nextResult.finalScore ?? nextResult.sentimentScore ?? 50);

      setResult(nextResult);
      setShowTopicMessage(false);
      setCurrentMoodScore(latestScore);
      setPetMood(mapPetMoodFromScore(latestScore));
      setCompletedTaskPoints(nextResult.completedTaskPoints ?? 0);
      await refreshHistory(sessionId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleTaskCompleted(taskUpdate) {
    setCurrentMoodScore(taskUpdate.currentMoodScore);
    setCompletedTaskPoints(taskUpdate.completedTaskPoints);
    setPetMood(taskUpdate.petMood);
    setPetOverlayMessage(taskUpdate.petReply);
    setShowTopicMessage(false);

    setResult((previous) => {
      if (!previous || previous.analysisId !== taskUpdate.analysisId) return previous;
      return {
        ...previous,
        petMood: taskUpdate.petMood,
        petReply: taskUpdate.petReply,
        currentMoodScore: taskUpdate.currentMoodScore,
        completedTaskPoints: taskUpdate.completedTaskPoints,
        tasks: previous.tasks.map((task) =>
          task.taskId === taskUpdate.task.taskId ? { ...task, ...taskUpdate.task } : task
        )
      };
    });

    await refreshHistory(sessionId);
  }

  function handleReminder(task) {
    setReminderTaskTitle(task.title);
    setPetOverlayMessage(`Reminder time! Try this task when you are ready: ${task.title}`);
  }

  async function endSession() {
    if (!sessionId) return;

    try {
      const response = await api.patch(`/sessions/${sessionId}/end`);
      setSessionSummary(response.data.data.summary);
      setCurrentMoodScore(response.data.data.currentMoodScore ?? currentMoodScore);
      setCompletedTaskPoints(response.data.data.completedTaskPoints ?? completedTaskPoints);
      setPetOverlayMessage('Great job today. I saved your session summary.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to end session');
    }
  }

  return (
    <div className="page-shell">
      <div className="app-card">
        <header className="hero">
          <div>
            <h1>MoodPal Multimodal</h1>
            <p className="muted">
              A desktop-pet prototype with real video, audio, and transcript-based mood analysis.
            </p>
          </div>
          <div className="status-pill">{sessionId ? `Session: ${sessionId}` : 'Loading session...'}</div>
        </header>

        <PetCharacter
          mood={petMood}
          moodScore={currentMoodScore}
          completedTaskPoints={completedTaskPoints}
          isThinking={analyzing}
        />
        <PetPromptBubble message={petMessage} />

        {reminderTaskTitle ? (
          <div className="reminder-banner">
            <strong>Task reminder</strong>
            <span>{reminderTaskTitle}</span>
          </div>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}

        {loading ? (
          <div className="card">Loading application...</div>
        ) : (
          <>
            <TopicCard topic={topic} />
            <CameraRecorder onComplete={handleRecordingComplete} disabled={analyzing || !topic} />

            {analyzing ? <div className="card">Analyzing multimodal response...</div> : null}

            <AnalysisResultCard result={result} />
            <MusicRecommendationList items={result?.musicRecommendations || []} />

            <TaskRecommendationList
              analysisId={result?.analysisId}
              tasks={result?.tasks || []}
              currentMoodScore={currentMoodScore}
              onTaskCompleted={handleTaskCompleted}
              onReminder={handleReminder}
              onError={setError}
            />

            <div className="button-row">
              <button className="secondary-btn" type="button" onClick={fetchNextTopic} disabled={!sessionId || analyzing}>
                Next Topic
              </button>
              <button className="primary-btn" type="button" onClick={endSession} disabled={!sessionId || analyzing}>
                End Session
              </button>
            </div>

            {sessionSummary ? (
              <div className="card">
                <h3 className="section-title">Session Summary</h3>
                <p className="pet-reply">{sessionSummary}</p>
              </div>
            ) : null}

            <SessionHistory results={history} />
          </>
        )}
      </div>
    </div>
  );
}
