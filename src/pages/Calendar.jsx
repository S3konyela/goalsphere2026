import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getWCMatches } from '../api/footballdata.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function getStatusInfo(status) {
  if (status === 'IN_PLAY' || status === 'PAUSED') return { label: 'Live', type: 'live' };
  if (status === 'FINISHED') return { label: 'Full Time', type: 'ft' };
  if (status === 'POSTPONED') return { label: 'Postponed', type: 'pst' };
  if (status === 'CANCELLED') return { label: 'Cancelled', type: 'canc' };
  if (status === 'TIMED' || status === 'SCHEDULED') return { label: 'Upcoming', type: 'ns' };
  return { label: status || 'Scheduled', type: 'ns' };
}

const TEAM_CODE_MAP = {
  'Mexico': 'MEX', 'Ecuador': 'ECU', 'USA': 'USA', 'United States': 'USA',
  'Canada': 'CAN', 'Brazil': 'BRA', 'Croatia': 'CRO', 'Argentina': 'ARG',
  'Saudi Arabia': 'KSA', 'England': 'ENG', 'Serbia': 'SRB', 'France': 'FRA',
  'New Zealand': 'NZL', 'Spain': 'ESP', 'Nigeria': 'NGA', 'Germany': 'GER',
  'Japan': 'JPN', 'Portugal': 'POR', 'Senegal': 'SEN', 'Netherlands': 'NED',
  'Peru': 'PER', 'South Africa': 'RSA', 'Morocco': 'MAR', 'Italy': 'ITA',
  'Chile': 'CHI', 'Colombia': 'COL', 'Ivory Coast': 'CIV', 'Australia': 'AUS',
  'Ukraine': 'UKR', 'Uruguay': 'URU', 'South Korea': 'KOR', 'Poland': 'POL',
  'Austria': 'AUT', 'Denmark': 'DEN', 'Tunisia': 'TUN', 'Belgium': 'BEL',
  'Algeria': 'ALG', 'Qatar': 'QAT', 'Switzerland': 'SUI', 'Cameroon': 'CMR',
};

function getTeamCode(name) {
  if (!name || name === 'TBD') return 'TBD';
  if (TEAM_CODE_MAP[name]) return TEAM_CODE_MAP[name];

  const parts = name
    .replace(/[^A-Za-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();

  return parts
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

const STAGES = ['All', 'GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
const STAGE_LABELS = {
  'All': 'All Rounds',
  'GROUP_STAGE': 'Group Stage',
  'ROUND_OF_32': 'Round of 32',
  'ROUND_OF_16': 'Round of 16',
  'QUARTER_FINALS': 'Quarter-finals',
  'SEMI_FINALS': 'Semi-finals',
  'FINAL': 'Final',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonMatch() {
  return (
    <div className="cal-match-row cal-match-row--skeleton">
      <div className="cal-skeleton-tag" />
      <div className="cal-skeleton-body">
        <div className="cal-skeleton-team" />
        <div className="cal-skeleton-score" />
        <div className="cal-skeleton-team" />
      </div>
      <div className="cal-skeleton-venue" />
    </div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────
function MatchCard({ match }) {
  const { label, type } = getStatusInfo(match.status);
  const isLive = type === 'live';
  const kickoff = new Date(match.utcDate);
  const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hasScore = match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const stageText = match.group
    ? `Group ${match.group.replace('GROUP_', '')}`
    : STAGE_LABELS[match.stage] || 'FIFA World Cup 2026';
  const matchdayText = match.matchday ? `Matchday ${match.matchday}` : 'Tournament match';
  const homeCode = getTeamCode(match.homeTeam?.name);
  const awayCode = getTeamCode(match.awayTeam?.name);

  return (
    <article className={`cal-match-row ${isLive ? 'cal-match-row--live' : ''}`}>
      <div className="cal-match-top">
        <span className="cal-league-tag">
          <span>{stageText}</span>
          <span className="cal-tag-dot" aria-hidden="true" />
          <span>{matchdayText}</span>
        </span>
        <span className={`cal-status-badge cal-status--${type}`}>
          {isLive && <span className="fx-live-dot" aria-hidden="true" />}
          {label}
        </span>
      </div>

      <div className="cal-match-body">
        <div className="cal-team cal-team--home">
          <span className="cal-team-code">{homeCode}</span>
          <span className="cal-team-name">{match.homeTeam?.name || 'TBD'}</span>
        </div>

        <div className="cal-score-block">
          {hasScore ? (
            <span className="cal-score">
              <span>{match.score?.fullTime?.home ?? 0}</span>
              <span className="cal-score-sep">-</span>
              <span>{match.score?.fullTime?.away ?? 0}</span>
            </span>
          ) : (
            <>
              <span className="cal-vs">VS</span>
              <span className="cal-time">{timeStr}</span>
            </>
          )}
        </div>

        <div className="cal-team cal-team--away">
          <span className="cal-team-code">{awayCode}</span>
          <span className="cal-team-name">{match.awayTeam?.name || 'TBD'}</span>
        </div>
      </div>

      <div className="cal-match-foot">
        <span className="cal-venue">
          <span className="cal-venue-label">Venue</span>
          {match.venue || 'Venue TBC'}
        </span>
        <Link to={`/fixtures/${match.id}`} className="cal-preview-link">
          Preview <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Calendar() {
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const wcStart = new Date(2026, 5, 11);
    return today >= wcStart ? today : wcStart;
  });
  const [stageFilter, setStageFilter] = useState('All');

  const fetchMatches = useCallback(() => {
    setLoading(true);
    setError(null);
    getWCMatches()
      .then(setAllMatches)
      .catch(err => setError(err.message || 'Failed to load fixtures'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => toISO(addDays(weekStart, i))),
    [weekStart]
  );

  const weekLabel = useMemo(() => {
    const start = new Date(weekDates[0] + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const end = new Date(weekDates[6] + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} – ${end}`;
  }, [weekDates]);

  const filtered = useMemo(() => {
    return allMatches.filter(m => {
      const dateStr = toISO(new Date(m.utcDate));
      const inWeek = weekDates.includes(dateStr);
      const inStage = stageFilter === 'All' || m.stage === stageFilter;
      return inWeek && inStage;
    });
  }, [allMatches, weekDates, stageFilter]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(m => {
      const dateStr = toISO(new Date(m.utcDate));
      g[dateStr] = g[dateStr] || [];
      g[dateStr].push(m);
    });
    return g;
  }, [filtered]);

  const sortedDays = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const selectedStageLabel = STAGE_LABELS[stageFilter];

  const liveCount = allMatches.filter(m =>
    m.status === 'IN_PLAY' || m.status === 'PAUSED'
  ).length;

  const wcStart = new Date(2026, 5, 11);

  return (
    <div className="cal-page">

      <div className="cal-page-header">
        <div className="container">
          <div className="cal-header-inner">
            <div className="cal-title-group">
              <span className="section-eyebrow">FIFA World Cup 2026</span>
              <h1 className="cal-page-title">
                Match Calendar
                {liveCount > 0 && (
                  <span className="fx-live-count">{liveCount} Live</span>
                )}
              </h1>
              <p className="cal-page-sub">
                Full tournament schedule - USA, Canada & Mexico - {allMatches.length} matches loaded
              </p>
            </div>

            <div className="cal-control-panel" aria-label="Calendar controls">
              <div className="cal-week-nav">
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={() => setWeekStart(w => addDays(w, -7))}
                  aria-label="Show previous week"
                >
                  <span aria-hidden="true">&larr;</span>
                  Prev
                </button>
                <div className="cal-week-label">
                  <span>Showing</span>
                  <strong>{weekLabel}</strong>
                </div>
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={() => setWeekStart(w => addDays(w, 7))}
                  aria-label="Show next week"
                >
                  Next
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>

              <div className="cal-action-row">
                <button
                  type="button"
                  className="cal-nav-btn cal-nav-btn--today"
                  onClick={() => setWeekStart(wcStart)}
                >
                  Opening Week
                </button>
                <button
                  type="button"
                  className="cal-refresh-btn"
                  onClick={fetchMatches}
                  disabled={loading}
                >
                  <span aria-hidden="true">{loading ? '...' : '↻'}</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cal-filter-bar">
        <div className="container cal-filter-inner">
          <div className="cal-filter-meta">
            <span>{filtered.length} matches</span>
            <strong>{selectedStageLabel}</strong>
          </div>
          <div className="cal-round-tabs" role="group" aria-label="Filter matches by round">
            {STAGES.map(s => (
              <button
                key={s}
                type="button"
                className={`cal-round-btn ${stageFilter === s ? 'cal-round-btn--active' : ''}`}
                onClick={() => setStageFilter(s)}
                aria-pressed={stageFilter === s}
              >
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container cal-content">

        {error && (
          <div className="fx-error">
            <span>⚠️</span>
            <div>
              <strong>Could not load fixtures</strong>
              <p>{error}</p>
              <button className="tm-reset-btn" onClick={fetchMatches} style={{ marginTop: '0.75rem' }}>
                Try again
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="cal-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <section key={i} className="cal-day-block">
                <div className="cal-skeleton-day-label" />
                <div className="cal-day-matches">
                  {Array.from({ length: 2 }).map((_, j) => <SkeletonMatch key={j} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && !error && sortedDays.length === 0 && (
          <div className="fx-empty">
            <span className="fx-empty-icon">📅</span>
            <h3>No fixtures this week</h3>
            <p>No World Cup matches scheduled for this period.</p>
            <button className="tm-reset-btn" onClick={() => setWeekStart(wcStart)}>
              Jump to opening week
            </button>
          </div>
        )}

        {!loading && !error && sortedDays.length > 0 && (
          <div className="cal-list">
            {sortedDays.map(day => (
              <section key={day} className="cal-day-block">
                <h2 className="cal-day-label">{formatDayLabel(day)}</h2>
                <div className="cal-day-matches">
                  {grouped[day].map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
