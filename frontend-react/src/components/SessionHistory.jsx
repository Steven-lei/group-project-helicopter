export default function SessionHistory({ results = [] }) {
  if (!results.length) return null;

  return (
    <div className="card">
      <h3 className="section-title">Session History</h3>
      <div className="history-list">
        {results.map((item) => {
          const completed = (item.tasks || []).filter((task) => task.completed).length;
          const total = (item.tasks || []).length;

          return (
            <div className="history-item" key={`${item.analysisId}-${item.createdAt}`}>
              <div>
                <strong>Turn {item.turnIndex}</strong>
                <p className="muted history-topic">{item.topicText}</p>
                <p className="muted small-text">Tasks completed: {completed}/{total}</p>
              </div>
              <div className="history-score">
                <div>{item.sentimentScore}</div>
                <small>{item.sentimentLabel}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
