export default function TopicCard({ topic }) {
  if (!topic) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="section-title">Today&apos;s Topic</h3>
        <span className="badge">{topic.category}</span>
      </div>
      <p className="topic-text">{topic.topicText}</p>
      <p className="muted">Suggested speaking time: about {topic.suggestedDurationSec || 30} seconds</p>
    </div>
  );
}
