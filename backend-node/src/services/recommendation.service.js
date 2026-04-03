function buildTask(taskId, title, points, reminderMinutes) {
  return {
    taskId,
    title,
    points,
    reminderMinutes,
    completed: false,
    completedAt: null
  };
}

export function generateTasks(score) {
  if (score <= 30) {
    return [
      buildTask('calm-music', 'Listen to calm music for 10 minutes', 8, 10),
      buildTask('short-walk', 'Take a short walk outside', 12, 20),
      buildTask('water-rest', 'Drink some water and have a short rest', 6, 15)
    ];
  }

  if (score <= 60) {
    return [
      buildTask('stretch', 'Stretch your body for 5 minutes', 7, 15),
      buildTask('light-video', 'Watch a light and relaxing video', 5, 20),
      buildTask('talk-friend', 'Talk to a friend for a few minutes', 10, 30)
    ];
  }

  return [
    buildTask('positive-streak', 'Keep your positive streak today', 5, 30),
    buildTask('happy-note', 'Write down one happy moment', 6, 25),
    buildTask('small-challenge', 'Try a small challenge and reward yourself', 10, 35)
  ];
}

export function mapPetMood(score) {
  if (score <= 25) return 'sleepy';
  if (score <= 45) return 'sad';
  if (score <= 70) return 'neutral';
  if (score <= 85) return 'happy';
  return 'excited';
}

export function generatePetReply(score) {
  if (score <= 30) {
    return 'Thanks for sharing. You seem a little tired today. Let us do one gentle task together.';
  }

  if (score <= 60) {
    return 'Thank you. Your mood seems fairly balanced right now. A small task could still help you feel even better.';
  }

  return 'You sound pretty positive today. That is lovely to hear. Keep the good energy going!';
}

export function generateTaskCelebration(taskTitle, nextMood) {
  if (nextMood === 'excited') {
    return `Yay! You completed "${taskTitle}" and I am super excited now!`;
  }

  if (nextMood === 'happy') {
    return `Nice work! Completing "${taskTitle}" made me feel much happier.`;
  }

  return `Well done! You checked off "${taskTitle}" and raised our mood a little.`;
}

export function summarizeSession(results) {
  if (!results.length) {
    return 'No analysis results were recorded in this session.';
  }

  const avg = Math.round(
    results.reduce((sum, item) => sum + item.sentimentScore, 0) / results.length
  );

  const completedTasks = results.flatMap((item) => item.tasks || []).filter((task) => task.completed).length;

  if (avg <= 30) {
    return `This session suggests the user may need more rest and calming activities. ${completedTasks} wellbeing tasks were completed.`;
  }

  if (avg <= 60) {
    return `This session suggests a fairly balanced emotional state overall. ${completedTasks} wellbeing tasks were completed.`;
  }

  return `This session suggests a generally positive emotional state. ${completedTasks} wellbeing tasks were completed.`;
}
