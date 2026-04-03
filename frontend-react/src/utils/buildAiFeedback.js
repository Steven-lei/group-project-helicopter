export function buildAiFeedback(result = {}) {
  const score = Number(result.sentimentScore ?? 0);
  const label = (result.sentimentLabel || '').toLowerCase();
  const transcript = String(result.transcript || '').toLowerCase();

  const has = (words) => words.some((word) => transcript.includes(word));

  const positiveWords = ['happy', 'good', 'great', 'love', 'proud', 'grateful', 'smile', 'calm', 'better', 'relaxed'];
  const lowWords = ['tired', 'stress', 'stressed', 'sad', 'upset', 'worried', 'anxious', 'bad', 'hard', 'difficult', 'bother'];

  if (label === 'low' || score <= 30) {
    if (has(lowWords) && has(positiveWords)) {
      return 'Your response suggests that you may be feeling low right now, though there are still some positive feelings in what you shared.';
    }
    if (has(lowWords)) {
      return 'Your response suggests that you may be feeling a little tired or emotionally low right now.';
    }
    return 'You seem to be in a lower mood at the moment, and a gentle break may help.';
  }

  if (label === 'neutral' || score <= 60) {
    if (has(lowWords) && has(positiveWords)) {
      return 'Your mood seems fairly balanced, with a mix of tired feelings and some positive moments.';
    }
    if (has(positiveWords)) {
      return 'Your mood seems fairly balanced, with some positive feelings in your response.';
    }
    if (has(lowWords)) {
      return 'Your mood seems fairly neutral overall, though you sound a little tired.';
    }
    return 'Your mood seems fairly neutral at the moment.';
  }

  if (has(lowWords) && has(positiveWords)) {
    return 'Your overall response sounds positive, even though you also mentioned a few tiring moments.';
  }

  if (has(positiveWords)) {
    return 'Your response sounds positive and emotionally stable.';
  }

  return 'Your overall response sounds positive.';
}
