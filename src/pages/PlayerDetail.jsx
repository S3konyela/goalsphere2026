import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPlayerById } from '../services/players.js';
import { getFlagUrl, getPlayerPhotoUrl } from '../data/flagCodes.js';
import { API_FOOTBALL_PLAYER_IDS } from '../data/apiFootballIds.js';

const POSITION_LABELS = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };
const POSITION_COLORS = { GK: '#f59e0b', DEF: '#2563eb', MID: '#16a34a', FWD: '#dc2626' };

function StatCard({ icon, label, value }) {
  return (
    <div className="pd-stat-card">
      <span className="pd-stat-icon">{icon}</span>
      <span className="pd-stat-value">{value ?? '—'}</span>
      <span className="pd-stat-label">{label}</span>
    </div>
  );
}

export default function PlayerDetail() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoErr, setPhotoErr] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPlayerById(id)
      .then(setPlayer)
      .catch(err => setError(err.message || 'Failed to load player'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="pd-page">
      <div className="pd-skeleton-hero" />
      <div className="container pd-content">
        {[...Array(3)].map((_, i) => <div key={i} className="pd-skeleton-line" style={{ width: `${80 - i * 15}%` }} />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="pd-page">
      <div className="container pd-content" style={{ paddingTop: '3rem' }}>
        <div className="fx-error"><span>⚠️</span><div><strong>Could not load player</strong><p>{error}</p></div></div>
        <Link to="/players" className="pd-back-link" style={{ marginTop: '1rem', display: 'inline-block' }}>← Back to Players</Link>
      </div>
    </div>
  );

  if (!player) return (
    <div className="pd-page">
      <div className="container pd-content" style={{ paddingTop: '3rem' }}>
        <div className="fx-empty"><span className="fx-empty-icon">⚽</span><h3>Player not found</h3></div>
        <Link to="/players" className="pd-back-link">← Back to Players</Link>
      </div>
    </div>
  );

  const posColor = POSITION_COLORS[player.position] || '#2563eb';
  const posLabel = POSITION_LABELS[player.position] || player.position;
  const apiId = API_FOOTBALL_PLAYER_IDS[Number(id)];
  const photoUrl = player.photo || (apiId ? getPlayerPhotoUrl(apiId) : null);
  const flagUrl = getFlagUrl(player.teamSlug, 40);

  return (
    <div className="pd-page">
      <div className="pd-hero">
        <div className="pd-hero-bg" />
        <div className="container pd-hero-inner">
          <Link to="/players" className="pd-back-link">← All Players</Link>

          <div className="pd-hero-main">
            <div className="pd-avatar-wrap">
              <div className="pd-avatar">
                {photoUrl && !photoErr
                  ? <img src={photoUrl} alt={player.name} className="pd-photo" onError={() => setPhotoErr(true)} />
                  : <span className="pd-avatar-initial">{player.name?.[0]}</span>
                }
              </div>
              <span className="pd-shirt-num">#{player.shirtNumber}</span>
            </div>

            <div className="pd-hero-info">
              <div className="pd-hero-badges">
                <span className="pd-pos-badge" style={{ background: posColor }}>{posLabel}</span>
                <span className="pd-nat-badge">
                  {flagUrl
                    ? <img src={flagUrl} alt={player.teamName} style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} onError={e => e.target.style.display='none'} />
                    : player.teamFlag
                  }
                  {player.teamName}
                </span>
              </div>

              <h1 className="pd-hero-name">{player.name}</h1>

              <div className="pd-hero-meta">
                <span className="pd-meta-item">🏟️ {player.club}</span>
                <span className="pd-meta-item">🌍 {player.nationality}</span>
                {player.age && <span className="pd-meta-item">🎂 Age {player.age}</span>}
              </div>

              <div className="pd-quick-stats">
                <div className="pd-quick-stat">
                  <span className="pd-quick-val">{player.stats?.goals ?? 0}</span>
                  <span className="pd-quick-lbl">Goals</span>
                </div>
                <div className="pd-quick-stat">
                  <span className="pd-quick-val">{player.stats?.assists ?? 0}</span>
                  <span className="pd-quick-lbl">Assists</span>
                </div>
                <div className="pd-quick-stat">
                  <span className="pd-quick-val">{player.stats?.appearances ?? 0}</span>
                  <span className="pd-quick-lbl">Caps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pd-content">
        <div className="pd-stats-grid">
          <StatCard icon="⚽" label="Goals" value={player.stats?.goals} />
          <StatCard icon="🎯" label="Assists" value={player.stats?.assists} />
          <StatCard icon="🏅" label="Caps" value={player.stats?.appearances} />
          <StatCard icon="🟨" label="Yellow Cards" value={player.stats?.yellowCards} />
          <StatCard icon="🟥" label="Red Cards" value={player.stats?.redCards} />
          <StatCard icon="⏱️" label="Minutes" value={player.stats?.minutesPlayed?.toLocaleString()} />
        </div>

        {player.bio && (
          <div className="pd-bio-section">
            <h2 className="pd-section-title">Player Profile</h2>
            <p className="pd-bio-text">{player.bio}</p>
          </div>
        )}

        <div className="pd-team-section">
          <h2 className="pd-section-title">National Team</h2>
          <Link to={`/teams/${player.teamSlug}`} className="pd-team-link">
            {flagUrl
              ? <img src={flagUrl} alt={player.teamName} className="pd-team-link-flag-img" onError={e => e.target.style.display='none'} />
              : <span className="pd-team-link-flag">{player.teamFlag}</span>
            }
            <div className="pd-team-link-info">
              <span className="pd-team-link-name">{player.teamName}</span>
              <span className="pd-team-link-sub">View full squad and team details</span>
            </div>
            <span className="pd-team-link-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}