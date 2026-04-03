import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';

const DEMO_MAX_REMINDER_MS = 25000;

export default function TaskRecommendationList({
  analysisId,
  tasks = [],
  currentMoodScore = 50,
  onTaskCompleted,
  onReminder,
  onError
}) {
  const [busyTaskId, setBusyTaskId] = useState('');
  const timersRef = useRef([]);

  const incompleteTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);

  useEffect(() => {
    timersRef.current.forEach((timer) => clearInterval(timer));
    timersRef.current = [];

    incompleteTasks.forEach((task) => {
      const interval = Math.min(task.reminderMinutes * 60 * 1000, DEMO_MAX_REMINDER_MS);
      const timer = setInterval(() => {
        onReminder?.(task);

        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('MoodPal reminder', {
              body: `Time to try: ${task.title}`
            });
          }
        }
      }, interval);

      timersRef.current.push(timer);
    });

    return () => {
      timersRef.current.forEach((timer) => clearInterval(timer));
      timersRef.current = [];
    };
  }, [incompleteTasks, onReminder]);

  async function requestNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  async function completeTask(task) {
    if (!analysisId || task.completed || busyTaskId) return;

    try {
      setBusyTaskId(task.taskId);
      const response = await api.patch(`/analyze/${analysisId}/tasks/${task.taskId}/complete`);
      onTaskCompleted?.(response.data.data);
    } catch (error) {
      onError?.(error.response?.data?.message || error.message || 'Failed to complete task');
    } finally {
      setBusyTaskId('');
    }
  }

  if (!tasks.length) return null;

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <div className="card">
      <div className="card-header compact-header">
        <div>
          <h3 className="section-title">Recommended Tasks</h3>
          <p className="muted small-text">Tick off tasks to raise your pet's mood score.</p>
        </div>
        <button className="ghost-btn" type="button" onClick={requestNotifications}>
          Enable reminders
        </button>
      </div>

      <div className="task-progress-row">
        <strong>{completedCount}/{tasks.length} completed</strong>
        <span className="muted small-text">Mood score now: {currentMoodScore}</span>
      </div>

      <div className="task-checklist">
        {tasks.map((task) => (
          <label className={`task-item ${task.completed ? 'completed' : ''}`} key={task.taskId}>
            <input
              type="checkbox"
              checked={task.completed}
              disabled={task.completed || busyTaskId === task.taskId}
              onChange={() => completeTask(task)}
            />
            <div className="task-main">
              <div className="task-title-row">
                <strong>{task.title}</strong>
                <span className="points-pill">+{task.points}</span>
              </div>
              <div className="task-meta-row">
                <span>Reminder every {task.reminderMinutes} min</span>
                <span>{task.completed ? 'Checked in' : 'Pending'}</span>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
