import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchTeams } from '../services/teams.js';
import { getFlagUrl } from '../data/flagCodes.js';

const CONFEDERATIONS = ['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

function SkeletonCard() {
  return (
    <div className="tm-card tm-card--skeleton">
      <div className="tm-skeleton-flag" />
      <div className="tm-skeleton-body">
        <div className="tm-skeleton-line" style={{ width: '60%', height: '18px' }} />
        <div className="tm-skeleton-line" style={{ width: '40%', height: '13px', marginTop: '8px' }} />
        <div className="tm-skeleton-line" style={{ width: '80%', height: '13px', marginTop: '6px' }} />
      </div>
    </div>
  );
}

function FormBadge({ result }) {
  const cls = result === 'W' ? 'form-w' : result === 'D' ? 'form-d' : 'form-l';
  return <span className={`form-badge ${cls}`}>{result}</span>;
}

function TeamCard({ team }) {
  const form = team.form
    ? (Array.isArray(team.form) ? team.form : team.form.split(''))
    : [];
  const flagUrl = getFlagUrl(team.slug, 80);

  return (
    <article className="tm-card">
      <div className="tm-card-header">
        <div className="tm-flag-wrap">
          {flagUrl
            ? <img
                src={flagUrl}
                alt={team.name}
                className="tm-flag-img"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            : null
          }
          <div className="tm-flag-placeholder" style={{ display: flagUrl ? 'none' : 'flex' }}>
            {team.name?.[0]}
          </div>
        </div>
        <div className="tm-rank-badge">#{team.ranking || '—'}</div>
      </div>

      <div className="tm-card-body">
        <h3 className="tm-team-name">{team.name}</h3>
        <p className="tm-team-country">{team.country || team.confederation}</p>

        <div className="tm-meta-row">
          {team.confederation && (
            <span className="tm-conf-tag">{team.confederation}</span>
          )}
          {team.coach && (
            <span className="tm-coach">
              <span className="tm-coach-icon">👤</span>
              {team.coach}
            </span>
          )}
        </div>

        {form.length > 0 && (
          <div className="tm-form-row">
            <span className="tm-form-label">Form</span>
            <div className="tm-form-badges">
              {form.slice(-5).map((r, i) => <FormBadge key={i} result={r} />)}
            </div>
          </div>
        )}
      </div>

      <div className="tm-card-foot">
        <Link to={`/teams/${team.slug}`} className="tm-view-btn">
          View Squad →
        </Link>
      </div>
    </article>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [confederation, setConfederation] = useState('All');
  const [sortBy, setSortBy] = useState('ranking');

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(err => setError(err.message || 'Failed to load teams'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...teams];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.country?.toLowerCase().includes(q) ||
        t.coach?.toLowerCase().includes(q)
      );
    }
    if (confederation !== 'All') result = result.filter(t => t.confederation === confederation);
    if (sortBy === 'ranking') result.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
    else if (sortBy === 'name') result.sort((a, b) => a.name?.localeCompare(b.name));
    return result;
  }, [teams, search, confederation, sortBy]);

  return (
    <div className="tm-page">
      <div className="tm-page-header">
        <div className="container">
          <span className="section-eyebrow">Nations</span>
          <h1 className="tm-page-title">World Cup Teams</h1>
          <p className="tm-page-sub">
            {teams.length > 0
              ? `${teams.length} nations competing at FIFA World Cup 2026`
              : 'National sides with rankings, coaches and squad data'}
          </p>
          <div className="tm-search-wrap">
            <span className="tm-search-icon">🔍</span>
            <input
              type="text"
              className="tm-search-input"
              placeholder="Search teams, countries, coaches…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tm-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="tm-filter-bar">
        <div className="container tm-filter-inner">
          <div className="tm-conf-tabs">
            {CONFEDERATIONS.map(c => (
              <button
                key={c}
                className={`tm-conf-btn ${confederation === c ? 'tm-conf-btn--active' : ''}`}
                onClick={() => setConfederation(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="tm-sort-wrap">
            <label className="tm-sort-label">Sort by</label>
            <select
              className="tm-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="ranking">FIFA Ranking</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container tm-content">
        {!loading && !error && (
          <p className="tm-results-count">
            {filtered.length === teams.length
              ? `${filtered.length} teams`
              : `${filtered.length} of ${teams.length} teams`}
            {confederation !== 'All' && ` · ${confederation}`}
          </p>
        )}

        {error && (
          <div className="fx-error">
            <span>⚠️</span>
            <div><strong>Could not load teams</strong><p>{error}</p></div>
          </div>
        )}

        {loading && (
          <div className="tm-grid">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="fx-empty">
            <span className="fx-empty-icon">🏴</span>
            <h3>No teams found</h3>
            <p>{search ? `No results for "${search}"` : 'No teams available.'}</p>
            {(search || confederation !== 'All') && (
              <button className="tm-reset-btn" onClick={() => { setSearch(''); setConfederation('All'); }}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="tm-grid">
            {filtered.map(team => <TeamCard key={team.id} team={team} />)}
          </div>
        )}
      </div>
    </div>
  );
}