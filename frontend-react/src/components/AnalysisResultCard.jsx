import { buildAiFeedback } from '../utils/buildAiFeedback';

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(2);
}

function MetricCard({ label, value, tone = 'default', hint }) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {hint ? <span className="metric-hint">{hint}</span> : null}
    </div>
  );
}

function CompactStatRow({ label, value }) {
  return (
    <div className="compact-stat-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AnalysisResultCard({ result }) {
  if (!result) return null;

  const transcript = result.transcript?.trim() || 'No transcript captured.';
  const aiFeedback = result.aiFeedback || buildAiFeedback(result);

  const summaryMetrics = [
    { label: 'Final Score', value: formatNumber(result.finalScore ?? result.sentimentScore), tone: 'highlight', hint: 'Used for pet mood refresh' },
    { label: 'Mood Label', value: result.sentimentLabel || '-', tone: 'label' },
    { label: 'Confidence', value: formatNumber(result.confidence), tone: 'confidence' },
    { label: 'Turn Index', value: result.turnIndex ?? '-' },
    { label: 'Pet Mood', value: result.petMood || '-' },
  ];

  const modalityCards = [
    {
      title: 'Script / Text',
      description: 'Meaning from the transcript itself.',
      primary: { label: 'Script Score', value: formatNumber(result.scriptScore) },
      secondary: { label: 'Text Score', value: formatNumber(result.textScore ?? result.scriptScore) },
      confidence: result.modalityConfidences?.script ?? result.modalityConfidences?.text,
      weight: result.modalityWeights?.script,
    },
    {
      title: 'Audio',
      description: 'Voice energy, tempo, pauses, and pitch variation.',
      primary: { label: 'Audio Score', value: formatNumber(result.audioScore) },
      confidence: result.modalityConfidences?.audio,
      weight: result.modalityWeights?.audio,
    },
    {
      title: 'Facial / Video',
      description: 'Facial presence, smile cues, and video movement.',
      primary: { label: 'Facial Score', value: formatNumber(result.facialScore) },
      secondary: { label: 'Video Score', value: formatNumber(result.videoScore ?? result.facialScore) },
      confidence: result.modalityConfidences?.facial ?? result.modalityConfidences?.video,
      weight: result.modalityWeights?.facial,
    },
  ];

  return (
    <div className="card analysis-card">
      <div className="card-header compact-header">
        <div>
          <h3 className="section-title">Sentiment Analysis</h3>
          <p className="muted small-text">The pet mood and meter use the latest final score from this analysis.</p>
        </div>
        <span className="badge">{result.sentimentLabel || 'unknown'}</span>
      </div>

      <div className="summary-metrics-grid">
        {summaryMetrics.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} hint={item.hint} />
        ))}
      </div>

      <div className="feature-section">
        <h4 className="section-title small-title">Topic</h4>
        <div className="transcript-box">{result.topicText || '-'}</div>
      </div>

      <div className="feature-section">
        <h4 className="section-title small-title">Transcript</h4>
        <div className="transcript-box">{transcript}</div>
      </div>

      <div className="feature-section">
        <h4 className="section-title small-title">Modalities</h4>
        <div className="modality-layout">
          {modalityCards.map((card) => (
            <div className="modality-card" key={card.title}>
              <div className="modality-card-header">
                <h5>{card.title}</h5>
                <p>{card.description}</p>
              </div>
              <div className="modality-main-score">
                <span>{card.primary.label}</span>
                <strong>{card.primary.value}</strong>
              </div>
              {card.secondary ? (
                <div className="modality-secondary-row">
                  <span>{card.secondary.label}</span>
                  <strong>{card.secondary.value}</strong>
                </div>
              ) : null}
              <div className="modality-meta-grid">
                <CompactStatRow label="Weight" value={formatNumber(card.weight)} />
                <CompactStatRow label="Confidence" value={formatNumber(card.confidence)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="feature-section">
        <h4 className="section-title small-title">Final Fusion</h4>
        <div className="fusion-panel">
          <div className="fusion-score-block">
            <span>Final Score</span>
            <strong>{formatNumber(result.finalScore ?? result.sentimentScore)}</strong>
          </div>
          <div className="fusion-stats-grid">
            <CompactStatRow label="Sentiment Score" value={formatNumber(result.sentimentScore)} />
            <CompactStatRow label="Final Weight Mix" value={`${formatNumber(result.modalityWeights?.script)} / ${formatNumber(result.modalityWeights?.audio)} / ${formatNumber(result.modalityWeights?.facial)}`} />
            <CompactStatRow label="Final Confidence" value={formatNumber(result.modalityConfidences?.final ?? result.confidence)} />
            <CompactStatRow label="Pet Mood" value={result.petMood || '-'} />
          </div>
        </div>
      </div>

      <div className="feature-section">
        <h4 className="section-title small-title">AI Feedback</h4>
        <p className="pet-reply">{aiFeedback}</p>
      </div>
    </div>
  );
}
