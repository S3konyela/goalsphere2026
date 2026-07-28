import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchRaw, getFixtureEvents, getFixtureStats, getTeamRecentFixtures } from '../api/football.js';
import { detectVenueMode, getPrediction, computeRatingFromFixtures } from '../engine/predictionEngine.js';

// Session-level cache: teamId → computed rating
// Module-level so it persists across MatchPreview navigations
const teamFormCache = new Map();

async function fetchLiveRating(teamId, teamName) {
  if (teamFormCache.has(teamId)) return teamFormCache.get(teamId);
  const fixtures = await getTeamRecentFixtures(teamId, 5);
  const rating   = computeRatingFromFixtures(fixtures, teamId, teamName);
  teamFormCache.set(teamId, rating);
  return rating;
}

// ── Helpers ───────────────────────────────────────────────────────────────
const LIVE_SHORT = new Set(['LIVE','1H','2H','HT','ET','P','BT','INT']);
const FT_SHORT   = new Set(['FT','AET','PEN','AWD','WO']);

function formatCountdown(targetDate) {
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return d > 0 ? `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`
               : `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

function statVal(raw) {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'string') return parseInt(raw, 10) || 0;
  return Number(raw) || 0;
}

function StatBar({ label, valA, valB }) {
  const total = valA + valB;
  const pctA = total > 0 ? (valA / total) * 100 : 50;
  const pctB = 100 - pctA;
  return (
    <div className="mp-stat-row">
      <span className="mp-stat-num">{valA}</span>
      <div className="mp-stat-mid">
        <span className="mp-stat-label">{label}</span>
        <div className="mp-stat-bar">
          <div className="mp-stat-fill mp-stat-fill--a" style={{ width: `${pctA}%` }} />
          <div className="mp-stat-fill mp-stat-fill--b" style={{ width: `${pctB}%` }} />
        </div>
      </div>
      <span className="mp-stat-num mp-stat-num--b">{valB}</span>
    </div>
  );
}

function PossessionBar({ valA, valB }) {
  // possession comes as "59%" strings
  const nA = parseInt(valA, 10) || 50;
  const nB = parseInt(valB, 10) || 50;
  return (
    <div className="mp-stat-row">
      <span className="mp-stat-num">{valA ?? `${nA}%`}</span>
      <div className="mp-stat-mid">
        <span className="mp-stat-label">Ball Possession</span>
        <div className="mp-stat-bar">
          <div className="mp-stat-fill mp-stat-fill--a" style={{ width: `${nA}%` }} />
          <div className="mp-stat-fill mp-stat-fill--b" style={{ width: `${nB}%` }} />
        </div>
      </div>
      <span className="mp-stat-num mp-stat-num--b">{valB ?? `${nB}%`}</span>
    </div>
  );
}

function EventIcon({ type, detail }) {
  if (type === 'Goal') {
    if (detail === 'Own Goal') return '⚽🔴';
    if (detail === 'Penalty') return '⚽🎯';
    return '⚽';
  }
  if (type === 'Card') {
    return detail === 'Red Card' ? '🟥' : '🟨';
  }
  if (type === 'subst') return '🔄';
  if (type === 'Var') return '📺';
  return '•';
}

function EventRow({ event, homeId }) {
  const isHome = event.team?.id === homeId;
  const isGoal = event.type === 'Goal';
  const isSub = event.type === 'subst';
  return (
    <div className={`mp-event ${isGoal ? 'mp-event--goal' : ''} ${isSub ? 'mp-event--sub' : ''}`}>
      <span className={`mp-event-side ${isHome ? 'mp-event-side--home' : 'mp-event-side--away'}`} />
      <span className="mp-event-min">{event.time?.elapsed ?? '?'}'</span>
      <span className="mp-event-icon"><EventIcon type={event.type} detail={event.detail} /></span>
      <div className="mp-event-detail">
        <span className="mp-event-player">{event.player?.name ?? '—'}</span>
        {event.assist?.name && (
          <span className="mp-event-assist">assist: {event.assist.name}</span>
        )}
        {isSub && event.assist?.name && (
          <span className="mp-event-assist">→ {event.assist.name}</span>
        )}
        {event.detail && !isSub && (
          <span className="mp-event-type">{event.detail}</span>
        )}
      </div>
      <span className="mp-event-team">{event.team?.name ?? ''}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function MatchPreview() {
  const { id } = useParams();
  const [fixture, setFixture]     = useState(null);
  const [events, setEvents]       = useState([]);
  const [stats, setStats]         = useState([]);
  const [pageStatus, setStatus]   = useState('loading');
  const [countdown, setCountdown] = useState('');
  const [liveRatings, setLiveRatings]  = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    Promise.all([
      getMatchRaw(id),
      getFixtureEvents(id).catch(() => []),
      getFixtureStats(id).catch(() => []),
    ])
      .then(([raw, evs, sts]) => {
        if (cancelled) return;
        if (!raw) { setStatus('notfound'); return; }
        setFixture(raw);
        setEvents(evs.sort((a, b) => (a.time?.elapsed ?? 0) - (b.time?.elapsed ?? 0)));
        setStats(sts);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [id]);

  // Countdown ticker for upcoming matches
  useEffect(() => {
    if (!fixture) return;
    const s = fixture.fixture?.status?.short ?? '';
    if (LIVE_SHORT.has(s) || FT_SHORT.has(s)) return;

    function tick() {
      const cd = formatCountdown(fixture.fixture.date);
      setCountdown(cd ?? 'Kick-off passed');
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [fixture]);

  // Fetch live form data for upcoming matches (2 API calls, cached by teamId)
  useEffect(() => {
    if (!fixture) return;
    const s = fixture.fixture?.status?.short ?? '';
    if (LIVE_SHORT.has(s) || FT_SHORT.has(s)) return;

    setLiveRatings(null);
    Promise.all([
      fetchLiveRating(fixture.teams.home.id, fixture.teams.home.name),
      fetchLiveRating(fixture.teams.away.id, fixture.teams.away.name),
    ])
      .then(([home, away]) => setLiveRatings({ home, away }))
      .catch(() => {}); // falls back to static ratings on error
  }, [fixture]);

  // ── Loading / error states ─────────────────────────────────────────────
  if (pageStatus === 'loading') {
    return (
      <div className="mp-page">
        <div className="mp-loading">
          <div className="mp-skeleton-header" />
          <div className="mp-skeleton-body" />
        </div>
      </div>
    );
  }

  if (pageStatus === 'notfound' || !fixture) {
    return (
      <div className="mp-page">
        <div className="container mp-error">
          <span>⚠️</span>
          <div>
            <strong>Match not found</strong>
            <p>The fixture ID {id} could not be loaded.</p>
            <Link to="/fixtures" className="mp-back-link">← Back to Fixtures</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────
  const { fixture: fx, teams, goals, league } = fixture;
  const statusShort = fx?.status?.short ?? 'NS';
  const isLive = LIVE_SHORT.has(statusShort);
  const isFT   = FT_SHORT.has(statusShort);
  const elapsed = fx?.status?.elapsed;

  // Build stat lookup: teamId → { statType → value }
  const statLookup = {};
  stats.forEach(t => {
    statLookup[t.team.id] = {};
    t.statistics.forEach(s => {
      statLookup[t.team.id][s.type] = s.value;
    });
  });
  const sA = statLookup[teams.home.id] ?? {};
  const sB = statLookup[teams.away.id] ?? {};
  const hasStats = Object.keys(sA).length > 0;

  const homeId = teams.home.id;
  const goals_h = goals?.home ?? null;
  const goals_a = goals?.away ?? null;
  const hasScore = goals_h !== null;

  // AI prediction — only shown for upcoming (not started) matches
  // Uses live form ratings once fetched; falls back to static ratings immediately
  const venueMode  = detectVenueMode(fixture);
  const prediction = (!isLive && !isFT)
    ? getPrediction(teams.home.name, teams.away.name, {
        venueMode,
        homeRating: liveRatings?.home,
        awayRating: liveRatings?.away,
      })
    : null;

  const kickoff = new Date(fx.date);
  const dateStr = kickoff.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const goalEvents = events.filter(e => e.type === 'Goal');

  return (
    <div className="mp-page">

      {/* ── Match Header ─────────────────────────────────────────────── */}
      <div className="mp-header">
        <div className="container">
          {/* League breadcrumb */}
          <div className="mp-league-row">
            {league.logo && <img src={league.logo} alt={league.name} className="mp-league-logo" />}
            <span className="mp-league-name">{league.name}</span>
            {league.round && <span className="mp-round">{league.round}</span>}
          </div>

          {/* Teams + Score */}
          <div className="mp-scoreboard">
            <div className="mp-team mp-team--home">
              <img src={teams.home.logo} alt={teams.home.name} className="mp-team-logo"
                onError={e => { e.target.style.display = 'none'; }} />
              <span className="mp-team-name">{teams.home.name}</span>
              {teams.home.winner && <span className="mp-winner-badge">Winner</span>}
            </div>

            <div className="mp-score-center">
              {hasScore ? (
                <div className="mp-score-display">
                  <span className="mp-score-num">{goals_h}</span>
                  <span className="mp-score-sep">–</span>
                  <span className="mp-score-num">{goals_a}</span>
                </div>
              ) : (
                <div className="mp-score-display mp-score-display--upcoming">
                  <span className="mp-vs-text">VS</span>
                </div>
              )}
              <div className="mp-status-row">
                {isLive ? (
                  <span className="mp-status-badge mp-status-badge--live">
                    <span className="mp-live-dot" />
                    {elapsed ? `${elapsed}'` : 'Live'}
                  </span>
                ) : isFT ? (
                  <span className="mp-status-badge mp-status-badge--ft">{fx.status.long}</span>
                ) : (
                  <span className="mp-status-badge mp-status-badge--ns">{fx.status.long}</span>
                )}
              </div>
              {!isLive && !isFT && countdown && (
                <div className="mp-countdown">{countdown}</div>
              )}
            </div>

            <div className="mp-team mp-team--away">
              <img src={teams.away.logo} alt={teams.away.name} className="mp-team-logo"
                onError={e => { e.target.style.display = 'none'; }} />
              <span className="mp-team-name">{teams.away.name}</span>
              {teams.away.winner && <span className="mp-winner-badge">Winner</span>}
            </div>
          </div>

          {/* Meta row */}
          <div className="mp-meta-row">
            <span>📅 {dateStr} · {timeStr}</span>
            {fx.venue?.name && <span>🏟 {fx.venue.name}, {fx.venue.city}</span>}
            {fx.referee && <span>👤 {fx.referee}</span>}
          </div>
        </div>
      </div>

      <div className="container mp-body">
        <div className="mp-cols">

          {/* ── Left column: Goalscorers + Timeline ────────────────── */}
          <div className="mp-col-main">

            {/* Goalscorers summary */}
            {goalEvents.length > 0 && (
              <div className="mp-section">
                <h3 className="mp-section-title">Goals</h3>
                <div className="mp-goals-summary">
                  <div className="mp-goals-col">
                    {goalEvents.filter(e => e.team?.id === homeId).map((e, i) => (
                      <span key={i} className="mp-goal-entry">
                        {e.player?.name}
                        {e.detail === 'Own Goal' ? ' (OG)' : e.detail === 'Penalty' ? ' (P)' : ''}
                        <em>{e.time?.elapsed}'</em>
                      </span>
                    ))}
                  </div>
                  <div className="mp-goals-sep" />
                  <div className="mp-goals-col mp-goals-col--away">
                    {goalEvents.filter(e => e.team?.id !== homeId).map((e, i) => (
                      <span key={i} className="mp-goal-entry mp-goal-entry--away">
                        <em>{e.time?.elapsed}'</em>
                        {e.player?.name}
                        {e.detail === 'Own Goal' ? ' (OG)' : e.detail === 'Penalty' ? ' (P)' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Full timeline */}
            {events.length > 0 && (
              <div className="mp-section">
                <h3 className="mp-section-title">Match Timeline</h3>
                <div className="mp-events">
                  {events.map((ev, i) => (
                    <EventRow key={i} event={ev} homeId={homeId} />
                  ))}
                </div>
              </div>
            )}

            {!events.length && (isFT || isLive) && (
              <div className="mp-section">
                <div className="fx-empty" style={{ padding: '2rem 0' }}>
                  <span className="fx-empty-icon">📋</span>
                  <p>No event data available for this match.</p>
                </div>
              </div>
            )}

            {!events.length && !isFT && !isLive && (
              <div className="mp-section">
                <div className="fx-empty" style={{ padding: '2rem 0' }}>
                  <span className="fx-empty-icon">⏳</span>
                  <h3>Match not started</h3>
                  <p>Events and stats will appear here once the match kicks off.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: Stats ─────────────────────────────────── */}
          <div className="mp-col-side">
            {hasStats ? (
              <div className="mp-section">
                <h3 className="mp-section-title">Match Stats</h3>
                <div className="mp-stats-teams">
                  <span className="mp-stats-team-label">{teams.home.name}</span>
                  <span className="mp-stats-team-label mp-stats-team-label--b">{teams.away.name}</span>
                </div>
                <div className="mp-stats-list">
                  <PossessionBar
                    valA={sA['Ball Possession']}
                    valB={sB['Ball Possession']}
                  />
                  <StatBar label="Shots on Target"
                    valA={statVal(sA['Shots on Goal'])} valB={statVal(sB['Shots on Goal'])} />
                  <StatBar label="Total Shots"
                    valA={statVal(sA['Total Shots'])} valB={statVal(sB['Total Shots'])} />
                  <StatBar label="Corners"
                    valA={statVal(sA['Corner Kicks'])} valB={statVal(sB['Corner Kicks'])} />
                  <StatBar label="Fouls"
                    valA={statVal(sA['Fouls'])} valB={statVal(sB['Fouls'])} />
                  <StatBar label="Yellow Cards"
                    valA={statVal(sA['Yellow Cards'])} valB={statVal(sB['Yellow Cards'])} />
                  <StatBar label="Offsides"
                    valA={statVal(sA['Offsides'])} valB={statVal(sB['Offsides'])} />
                  {(sA['Passes %'] || sB['Passes %']) && (
                    <PossessionBar
                      valA={sA['Passes %']}
                      valB={sB['Passes %']}
                    />
                  )}
                </div>
              </div>
            ) : (isFT || isLive) ? (
              <div className="mp-section">
                <div className="fx-empty" style={{ padding: '2rem 0' }}>
                  <span className="fx-empty-icon">📊</span>
                  <p>Stats not available for this match.</p>
                </div>
              </div>
            ) : null}

            {/* AI prediction for upcoming matches */}
            {prediction ? (
              <div className="mp-section mp-ai-pred-card">
                <div className="mp-ai-pred-header">
                  <span className="mp-ai-pred-icon">🤖</span>
                  <h4 className="mp-ai-pred-title">AI Prediction</h4>
                </div>
                <div className="mp-ai-pred-score">
                  <span className="mp-ai-pred-num">{prediction.predicted.home}</span>
                  <span className="mp-ai-pred-sep">–</span>
                  <span className="mp-ai-pred-num">{prediction.predicted.away}</span>
                </div>
                <p className="mp-ai-pred-xg">
                  xG {prediction.lambda.home} – {prediction.lambda.away}
                  {prediction.venueMode === 'neutral' && ' · neutral venue'}
                  {' · '}
                  {prediction.dataSource === 'live'
                    ? `last ${liveRatings.home.games ?? 5} games`
                    : !liveRatings ? 'loading form…' : 'historical ratings'}
                </p>
                <div className="mp-ai-prob-bar">
                  <div
                    className="mp-ai-prob-seg mp-ai-prob-seg--home"
                    style={{ width: `${prediction.probabilities.homeWin}%` }}
                    title={`${teams.home.name} win ${prediction.probabilities.homeWin}%`}
                  >
                    {prediction.probabilities.homeWin > 15 && `${prediction.probabilities.homeWin}%`}
                  </div>
                  <div
                    className="mp-ai-prob-seg mp-ai-prob-seg--draw"
                    style={{ width: `${prediction.probabilities.draw}%` }}
                    title={`Draw ${prediction.probabilities.draw}%`}
                  >
                    {prediction.probabilities.draw > 10 && `${prediction.probabilities.draw}%`}
                  </div>
                  <div
                    className="mp-ai-prob-seg mp-ai-prob-seg--away"
                    style={{ width: `${prediction.probabilities.awayWin}%` }}
                    title={`${teams.away.name} win ${prediction.probabilities.awayWin}%`}
                  >
                    {prediction.probabilities.awayWin > 15 && `${prediction.probabilities.awayWin}%`}
                  </div>
                </div>
                <div className="mp-ai-prob-labels">
                  <span>{teams.home.name}</span>
                  <span>Draw</span>
                  <span>{teams.away.name}</span>
                </div>
                <div className="mp-predict-icon" style={{ marginTop: '1.25rem' }}>🎯</div>
                <p className="mp-predict-sub">Have a different view? Make your own call.</p>
                <Link to="/predictions" className="mp-predict-btn">Go to Predictions</Link>
              </div>
            ) : (
              <div className="mp-section mp-predict-card">
                <div className="mp-predict-icon">🎯</div>
                <h4 className="mp-predict-title">Predict this match</h4>
                <p className="mp-predict-sub">Forecast the score and earn fan points.</p>
                <Link to="/predictions" className="mp-predict-btn">Go to Predictions</Link>
              </div>
            )}
          </div>
        </div>

        <div className="mp-back-row">
          <Link to="/fixtures" className="mp-back-link">← Back to Fixtures</Link>
        </div>
      </div>
    </div>
  );
}
