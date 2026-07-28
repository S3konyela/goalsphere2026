import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchPlayers } from '../services/players.js';
import { getFlagUrl, getPlayerPhotoUrl } from '../data/flagCodes.js';
import { API_FOOTBALL_PLAYER_IDS } from '../data/apiFootballIds.js';

const POSITIONS = ['All', 'GK', 'DEF', 'MID', 'FWD'];
const CONFEDERATIONS = ['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
const POSITION_LABELS = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };
const POSITION_COLORS = { GK: '#f59e0b', DEF: '#2563eb', MID: '#16a34a', FWD: '#dc2626' };

function SkeletonCard() {
  return (
    <div className="pl-card pl-card--skeleton">
      <div className="pl-skeleton-avatar" />
      <div className="pl-skeleton-body">
        <div className="pl-skeleton-line" style={{ width: '65%', height: '16px' }} />
        <div className="pl-skeleton-line" style={{ width: '45%', height: '12px', marginTop: '6px' }} />
      </div>
    </div>
  );
}

function PlayerCard({ player }) {
  const posColor = POSITION_COLORS[player.position] || '#2563eb';
  const apiId = API_FOOTBALL_PLAYER_IDS[player.id];
  const photoUrl = apiId ? getPlayerPhotoUrl(apiId) : null;
  const flagUrl = getFlagUrl(player.teamSlug, 40);
  const [photoErr, setPhotoErr] = useState(false);

  return (
    <article className="pl-card">
      <div className="pl-card-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="pl-avatar">
          {photoUrl && !photoErr
            ? <img
                src={photoUrl}
                alt={player.name}
                className="pl-photo"
                onError={() => setPhotoErr(true)}
              />
            : <span className="pl-avatar-initial">{player.name?.[0]}</span>
          }
        </div>
        <span className="pl-pos-badge" style={{ background: posColor }}>
          {player.position}
        </span>
        {flagUrl
          ? <img src={flagUrl} alt={player.teamName} className="pl-flag-img" onError={e => e.target.style.display='none'} />
          : <span className="pl-flag">{player.teamFlag}</span>
        }
      </div>

      <div className="pl-card-body">
        <h3 className="pl-player-name">{player.name}</h3>
        <p className="pl-player-team">{player.teamName}</p>
        <div className="pl-meta">
          <span className="pl-club-tag">🏟️ {player.club}</span>
        </div>
        <div className="pl-stats-row">
          <div className="pl-mini-stat">
            <span className="pl-mini-val">{player.stats?.goals ?? 0}</span>
            <span className="pl-mini-lbl">Goals</span>
          </div>
          <div className="pl-mini-stat">
            <span className="pl-mini-val">{player.stats?.assists ?? 0}</span>
            <span className="pl-mini-lbl">Assists</span>
          </div>
          <div className="pl-mini-stat">
            <span className="pl-mini-val">{player.stats?.appearances ?? 0}</span>
            <span className="pl-mini-lbl">Caps</span>
          </div>
        </div>
      </div>

      <div className="pl-card-foot">
        <Link to={`/players/${player.id}`} className="pl-view-btn">View Profile →</Link>
      </div>
    </article>
  );
}

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('All');
  const [confederation, setConfederation] = useState('All');
  const [sortBy, setSortBy] = useState('goals');

  useEffect(() => {
    fetchPlayers()
      .then(setPlayers)
      .catch(err => setError(err.message || 'Failed to load players'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...players];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.club?.toLowerCase().includes(q) ||
        p.teamName?.toLowerCase().includes(q) ||
        p.nationality?.toLowerCase().includes(q)
      );
    }
    if (position !== 'All') result = result.filter(p => p.position === position);
    if (confederation !== 'All') result = result.filter(p => p.confederation === confederation);
    if (sortBy === 'goals') result.sort((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0));
    else if (sortBy === 'assists') result.sort((a, b) => (b.stats?.assists ?? 0) - (a.stats?.assists ?? 0));
    else if (sortBy === 'caps') result.sort((a, b) => (b.stats?.appearances ?? 0) - (a.stats?.appearances ?? 0));
    else if (sortBy === 'name') result.sort((a, b) => a.name?.localeCompare(b.name));
    return result;
  }, [players, search, position, confederation, sortBy]);

  return (
    <div className="pl-page">
      <div className="pl-page-header">
        <div className="container">
          <span className="section-eyebrow">Players</span>
          <h1 className="pl-page-title">World Cup Stars</h1>
          <p className="pl-page-sub">
            {players.length > 0
              ? `${players.length} elite players across ${new Set(players.map(p => p.teamSlug)).size} nations`
              : 'The world\'s best footballers'}
          </p>
          <div className="tm-search-wrap">
            <span className="tm-search-icon">🔍</span>
            <input
              type="text"
              className="tm-search-input"
              placeholder="Search players, clubs, nations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="tm-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>
      </div>

      <div className="pl-filter-bar">
        <div className="container pl-filter-inner">
          <div className="pl-pos-tabs">
            {POSITIONS.map(pos => (
              <button
                key={pos}
                className={`pl-pos-btn ${position === pos ? 'pl-pos-btn--active' : ''}`}
                onClick={() => setPosition(pos)}
                style={position === pos && pos !== 'All' ? { background: POSITION_COLORS[pos], borderColor: POSITION_COLORS[pos] } : {}}
              >
                {pos === 'All' ? 'All Positions' : POSITION_LABELS[pos]}
              </button>
            ))}
          </div>
          <div className="pl-filter-right">
            <select className="tm-sort-select" value={confederation} onChange={e => setConfederation(e.target.value)}>
              {CONFEDERATIONS.map(c => <option key={c} value={c}>{c === 'All' ? 'All Confederations' : c}</option>)}
            </select>
            <div className="tm-sort-wrap">
              <label className="tm-sort-label">Sort</label>
              <select className="tm-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="goals">Top Scorers</option>
                <option value="assists">Top Assists</option>
                <option value="caps">Most Caps</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container pl-content">
        {!loading && !error && (
          <p className="tm-results-count">
            {filtered.length === players.length ? `${filtered.length} players` : `${filtered.length} of ${players.length} players`}
            {position !== 'All' && ` · ${POSITION_LABELS[position]}s`}
          </p>
        )}

        {error && <div className="fx-error"><span>⚠️</span><div><strong>Could not load players</strong><p>{error}</p></div></div>}

        {loading && <div className="pl-grid">{Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="fx-empty">
            <span className="fx-empty-icon">⚽</span>
            <h3>No players found</h3>
            <p>{search ? `No results for "${search}"` : 'No players match the current filters.'}</p>
            {(search || position !== 'All' || confederation !== 'All') && (
              <button className="tm-reset-btn" onClick={() => { setSearch(''); setPosition('All'); setConfederation('All'); }}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="pl-grid">
            {filtered.map(player => <PlayerCard key={player.id} player={player} />)}
          </div>
        )}
      </div>
    </div>
  );
}