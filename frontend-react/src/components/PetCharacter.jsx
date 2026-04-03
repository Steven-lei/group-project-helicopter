export default function PetCharacter({ mood = 'neutral', moodScore = 50, isThinking = false, completedTaskPoints = 0 }) {
  const moodMap = {
    sleepy: { label: 'Sleepy', ears: 'pet-ears droop', aura: 'soft' },
    sad: { label: 'A little low', ears: 'pet-ears', aura: 'misty' },
    neutral: { label: 'Calm', ears: 'pet-ears', aura: 'soft' },
    happy: { label: 'Happy', ears: 'pet-ears perk', aura: 'sparkle' },
    excited: { label: 'Excited', ears: 'pet-ears perk', aura: 'sparkle' }
  };

  const current = moodMap[mood] || moodMap.neutral;

  return (
    <div className={`pet-card pet-card-${mood}`}>
      <div className="pet-visual-wrap">
        <div className={`pet-aura ${current.aura}`} />
        <div className={`pet-body ${isThinking ? 'thinking' : ''}`}>
          <div className={current.ears}>
            <span className="ear ear-left" />
            <span className="ear ear-right" />
          </div>
          <div className="pet-face">
            <span className="eye eye-left" />
            <span className="eye eye-right" />
            <span className={`mouth mood-${mood}`} />
            <span className="blush blush-left" />
            <span className="blush blush-right" />
          </div>
          <div className="pet-belly" />
        </div>
        <div className={`floating-icon icon-left ${mood === 'happy' || mood === 'excited' ? 'show' : ''}`}>★</div>
        <div className={`floating-icon icon-right ${completedTaskPoints > 0 ? 'show' : ''}`}>❤</div>
      </div>

      <div>
        <h2 className="section-title">MoodPal</h2>
        <p className="muted">Current pet mood: {current.label}</p>
        <div className="mood-meter">
          <div className="mood-meter-labels">
            <span>Mood score</span>
            <strong>{moodScore}/100</strong>
          </div>
          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${Math.max(0, Math.min(100, moodScore))}%` }} />
          </div>
        </div>
        <p className="muted small-text">Completed task points: {completedTaskPoints}</p>
      </div>
    </div>
  );
}
