import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getFixturesByDate, getLiveFixtures } from '../api/football.js';

// ── Date helpers ──────────────────────────────────────────────────────────
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getFilterDates(filter) {
  const today = new Date();
  if (filter === 'today') return [toISODate(today)];
  if (filter === 'tomorrow') {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return [toISODate(t)];
  }
  if (filter === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return toISODate(d);
    });
  }
  return [toISODate(today)];
}

// ── Status helpers ────────────────────────────────────────────────────────
const LIVE_SHORT = new Set(['LIVE','1H','2H','HT','ET','P','BT','INT']);
const FT_SHORT   = new Set(['FT','AET','PEN','AWD','WO']);

function getStatusInfo(fixture) {
  const s = fixture?.status?.short ?? 'NS';
  if (LIVE_SHORT.has(s)) {
    return { label: fixture.status.elapsed ? `${fixture.status.elapsed}'` : 'Live', type: 'live' };
  }
  if (FT_SHORT.has(s))   return { label: 'Full Time',  type: 'ft' };
  if (s === 'PST')       return { label: 'Postponed',  type: 'pst' };
  if (s === 'CANC')      return { label: 'Cancelled',  type: 'canc' };
  if (s === 'SUSP')      return { label: 'Suspended',  type: 'pst' };
  return { label: fixture?.status?.long ?? 'Scheduled', type: 'ns' };
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="fx-card fx-card--skeleton">
      <div className="fx-skeleton-top" />
      <div className="fx-skeleton-body">
        <div className="fx-skeleton-line" style={{ width: '60%' }} />
        <div className="fx-skeleton-line" style={{ width: '40%', marginTop: '6px' }} />
      </div>
    </div>
  );
}

// ── Fixture card ──────────────────────────────────────────────────────────
function FixtureCard({ game }) {
  const { label, type } = getStatusInfo(game.fixture);
  const isLive     = type === 'live';
  const hasScore   = game.goals.home !== null;
  const kickoff    = new Date(game.fixture.date);
  const timeStr    = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr    = kickoff.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <article className={`fx-card ${isLive ? 'fx-card--live' : ''}`}>

      {/* League + Status */}
      <div className="fx-card-top">
        <div className="fx-league-info">
          {game.league.logo && (
            <img src={game.league.logo} alt={game.league.name} className="fx-league-logo" />
          )}
          <span className="fx-league-name">{game.league.name}</span>
          {game.league.round && (
            <span className="fx-round">{game.league.round}</span>
          )}
        </div>
        <span className={`fx-status-badge fx-status--${type}`}>
          {isLive && <span className="fx-live-dot" aria-hidden="true" />}
          {label}
        </span>
      </div>

      {/* Teams + Score */}
      <div className="fx-matchup">
        <div className="fx-team">
          <img
            src={game.teams.home.logo}
            alt={game.teams.home.name}
            className="fx-team-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span className="fx-team-name">{game.teams.home.name}</span>
        </div>

        <div className="fx-score-block">
          {hasScore ? (
            <>
              <span className="fx-score">{game.goals.home}</span>
              <span className="fx-score-sep">–</span>
              <span className="fx-score">{game.goals.away}</span>
            </>
          ) : (
            <>
              <span className="fx-time-big">{timeStr}</span>
              <span className="fx-date-small">{dateStr}</span>
            </>
          )}
        </div>

        <div className="fx-team fx-team--away">
          <img
            src={game.teams.away.logo}
            alt={game.teams.away.name}
            className="fx-team-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span className="fx-team-name">{game.teams.away.name}</span>
        </div>
      </div>

      {/* Venue + Preview */}
      <div className="fx-card-foot">
        <span className="fx-venue">
          🏟 {game.fixture.venue?.name || 'Venue TBC'}
        </span>
        <Link to={`/fixtures/${game.fixture.id}`} className="fx-preview-link">
          Preview →
        </Link>
      </div>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Fixtures() {
  const [filter, setFilter]         = useState('today');
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [league, setLeague]         = useState('all');
  const [liveCount, setLiveCount]   = useState(0);

  // Per-date cache so switching tabs doesn't re-hit the API
  const cache = useRef(new Map());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLeague('all');

    const dates = getFilterDates(filter);

    // Determine which dates we still need to fetch
    const needed = dates.filter(d => !cache.current.has(d));

    const fetchNeeded = needed.length > 0
      ? Promise.all(needed.map(d =>
          getFixturesByDate(d).then(rows => { cache.current.set(d, rows); })
        ))
      : Promise.resolve();

    fetchNeeded
      .then(() => {
        if (cancelled) return;
        const combined = dates.flatMap(d => cache.current.get(d) ?? []);
        setAllMatches(combined);

        // Update live badge using today's cached data
        const todayKey = toISODate(new Date());
        const todayData = cache.current.get(todayKey) ?? [];
        setLiveCount(todayData.filter(m => LIVE_SHORT.has(m.fixture?.status?.short ?? '')).length);
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to load fixtures');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filter]);

  // Build league options from loaded set
  const leagues = useMemo(() => {
    const unique = new Map();
    allMatches.forEach(m => unique.set(m.league.id, m.league.name));
    return Array.from(unique.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allMatches]);

  // Apply league filter
  const filteredMatches = useMemo(() => {
    if (league === 'all') return allMatches;
    return allMatches.filter(m => String(m.league.id) === league);
  }, [allMatches, league]);

  // Group by league for display — live matches first within each group
  const groupedByLeague = useMemo(() => {
    const groups = new Map();
    filteredMatches.forEach(m => {
      const key = m.league.id;
      if (!groups.has(key)) groups.set(key, { meta: m.league, games: [] });
      groups.get(key).games.push(m);
    });
    const arr = Array.from(groups.values());
    // Sort: leagues with live games bubble up
    arr.sort((a, b) => {
      const aLive = a.games.some(g => LIVE_SHORT.has(g.fixture?.status?.short ?? '')) ? 0 : 1;
      const bLive = b.games.some(g => LIVE_SHORT.has(g.fixture?.status?.short ?? '')) ? 0 : 1;
      return aLive - bLive;
    });
    return arr;
  }, [filteredMatches]);

  return (
    <div className="fx-page">

      {/* Page Header */}
      <div className="fx-page-header">
        <div className="container">
          <div className="fx-header-inner">
            <div>
              <span className="section-eyebrow">Schedule</span>
              <h1 className="fx-page-title">
                Fixtures
                {liveCount > 0 && (
                  <span className="fx-live-count">{liveCount} Live</span>
                )}
              </h1>
              <p className="fx-page-sub">
                Live match schedules across all competitions · API-Football
              </p>
            </div>
          </div>

          {/* Filter bar */}
          <div className="fx-filter-bar">
            <div className="fx-date-tabs">
              {[
                { key: 'today',    label: 'Today' },
                { key: 'tomorrow', label: 'Tomorrow' },
                { key: 'week',     label: 'This Week' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`fx-tab-btn ${filter === key ? 'fx-tab-btn--active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {leagues.length > 0 && (
              <select
                className="fx-league-select"
                value={league}
                onChange={e => setLeague(e.target.value)}
              >
                <option value="all">All Competitions ({allMatches.length})</option>
                {leagues.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container fx-content">

        {error && (
          <div className="fx-error">
            <span>⚠️</span>
            <div>
              <strong>Could not load fixtures</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="fx-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && filteredMatches.length === 0 && (
          <div className="fx-empty">
            <span className="fx-empty-icon">📭</span>
            <h3>No fixtures found</h3>
            <p>
              {allMatches.length === 0
                ? 'No fixture data returned from the API.'
                : 'No matches for this competition on the selected date.'}
            </p>
          </div>
        )}

        {!loading && !error && groupedByLeague.map(({ meta, games }) => (
          <div key={meta.id} className="fx-league-group">
            <div className="fx-league-header">
              {meta.logo && (
                <img src={meta.logo} alt={meta.name} className="fx-league-header-logo" />
              )}
              <span className="fx-league-header-name">{meta.name}</span>
              {meta.country && (
                <span className="fx-round">{meta.country}</span>
              )}
              <span className="fx-league-header-count">
                {games.length} match{games.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="fx-grid">
              {games.map(game => (
                <FixtureCard key={game.fixture.id} game={game} />
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
