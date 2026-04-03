export default function MusicRecommendationList({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="card">
      <div className="card-header compact-header">
        <div>
          <h3 className="section-title">Music Recommendations</h3>
          <p className="muted small-text">
            Chosen based on the current mood score. Open one in a new tab when the user wants a softer or brighter soundtrack.
          </p>
        </div>
      </div>

      <div className="music-grid">
        {items.map((item) => (
          <article className="music-card" key={`${item.source}-${item.id}`}>
            {item.thumbnail ? (
              <img className="music-thumb" src={item.thumbnail} alt={item.title} />
            ) : (
              <div className={`music-thumb music-placeholder ${item.category || 'relaxing'}`}>
                <span>{item.category === 'uplifting' ? '🎵' : item.category === 'calming' ? '🌙' : '✨'}</span>
              </div>
            )}

            <div className="music-content">
              <div className="music-meta-row">
                <span className="mini-pill">{item.category}</span>
                <span className="muted small-text">{item.source === 'youtube-api' ? 'YouTube' : 'MoodPal picks'}</span>
              </div>
              <h4>{item.title}</h4>
              {item.channelTitle ? <p className="music-channel">{item.channelTitle}</p> : null}
              {item.description ? <p className="music-description">{item.description}</p> : null}
              <a className="primary-link" href={item.url} target="_blank" rel="noreferrer">
                Open music
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
