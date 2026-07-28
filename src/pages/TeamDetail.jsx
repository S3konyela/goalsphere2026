import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTeamBySlug } from '../services/teams.js';
import { useTeamFixtures } from '../hooks/useTeamFixtures.js';

const POSITION_ORDER  = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const POSITION_LABELS = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };

const STATUS_CLASS = {
  LIVE: 'fx-status--live', '1H': 'fx-status--live', '2H': 'fx-status--live',
  HT:   'fx-status--live', ET:  'fx-status--live',  P:   'fx-status--live',
  FT:   'fx-status--ft',   AET: 'fx-status--ft',    PEN: 'fx-status--ft',
  NS:   'fx-status--ns',   TBD: 'fx-status--ns',
  PST:  'fx-status--pst',  CANC:'fx-status--pst',   SUSP:'fx-status--pst',
};

const LIVE_STATUSES = new Set(['LIVE','1H','2H','HT','ET','P']);

function FormBadge({ result }) {
  const cls = result === 'W' ? 'form-w' : result === 'D' ? 'form-d' : 'form-l';
  return <span className={`form-badge ${cls}`}>{result}</span>;
}

function StatBox({ label, value }) {
  return (
    <div className="td-stat-box">
      <span className="td-stat-value">{value}</span>
      <span className="td-stat-label">{label}</span>
    </div>
  );
}

// ── Fixture card (live + upcoming + recent) ───────────────────────────────
function FixtureCard({ fixture }) {
  const isLive    = LIVE_STATUSES.has(fixture.status);
  const isFinished = ['FT','AET','PEN'].includes(fixture.status);
  const kickoff   = new Date(fixture.date);
  const timeStr   = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr   = kickoff.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className={`td-fx-card ${isLive ? 'td-fx-card--live' : ''}`}>
      {/* Top row: league + status */}
      <div className="td-fx-top">
        <div className="td-fx-league">
          {fixture.league.logo && (
            <img src={fixture.league.logo} alt="" className="td-fx-league-logo" />
          )}
          <span className="td-fx-league-name">{fixture.league.name}</span>
          <span className="td-fx-round">{fixture.league.round}</span>
        </div>
        <span className={`fx-status-badge ${STATUS_CLASS[fixture.status] ?? 'fx-status--ns'}`}>
          {isLive && <span className="fx-live-dot" />}
          {isLive ? `${fixture.elapsed}'` : fixture.status}
        </span>
      </div>

      {/* Matchup */}
      <div className="td-fx-matchup">
        <div className="td-fx-team">
          {fixture.home.logo
            ? <img src={fixture.home.logo} alt={fixture.home.name} className="td-fx-logo" />
            : <div className="td-fx-logo-placeholder">{fixture.home.name[0]}</div>
          }
          <span className="td-fx-team-name">{fixture.home.name}</span>
        </div>

        <div className="td-fx-score-block">
          {isFinished || isLive ? (
            <span className="td-fx-score">
              {fixture.score.home ?? 0} – {fixture.score.away ?? 0}
            </span>
          ) : (
            <>
              <span className="td-fx-time">{timeStr}</span>
              <span className="td-fx-date">{dateStr}</span>
            </>
          )}
        </div>

        <div className="td-fx-team td-fx-team--away">
          {fixture.away.logo
            ? <img src={fixture.away.logo} alt={fixture.away.name} className="td-fx-logo" />
            : <div className="td-fx-logo-placeholder">{fixture.away.name[0]}</div>
          }
          <span className="td-fx-team-name">{fixture.away.name}</span>
        </div>
      </div>

      {/* Venue */}
      {fixture.venue && (
        <p className="td-fx-venue">📍 {fixture.venue}</p>
      )}
    </div>
  );
}

function FixturesTab({ apiFootballId, teamName }) {
  const { fixtures, loading, error } = useTeamFixtures(apiFootballId);

  if (!apiFootballId) return (
    <div className="fx-empty">
      <span className="fx-empty-icon">📅</span>
      <h3>Fixtures coming soon</h3>
      <p>Live fixtures for {teamName} will be available once the tournament begins.</p>
    </div>
  );

  if (loading) return (
    <div className="td-fx-skeleton-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="td-fx-card td-fx-card--skeleton">
          <div className="td-skeleton-line" style={{ width: '50%', height: '12px' }} />
          <div className="td-skeleton-line" style={{ width: '100%', height: '40px', marginTop: '12px' }} />
          <div className="td-skeleton-line" style={{ width: '40%', height: '10px', marginTop: '8px' }} />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="fx-error">
      <span>⚠️</span>
      <div><strong>Could not load fixtures</strong><p>{error}</p></div>
    </div>
  );

  const { upcoming, recent } = fixtures;
  const hasData = upcoming.length > 0 || recent.length > 0;

  if (!hasData) return (
    <div className="fx-empty">
      <span className="fx-empty-icon">📅</span>
      <h3>No fixtures found</h3>
      <p>No upcoming or recent fixtures available for {teamName}.</p>
    </div>
  );

  return (
    <div className="td-fx-content">
      {upcoming.length > 0 && (
        <div className="td-fx-section">
          <h2 className="td-fx-section-title">🗓️ Upcoming</h2>
          <div className="td-fx-grid">
            {upcoming.map(f => <FixtureCard key={f.id} fixture={f} />)}
          </div>
        </div>
      )}
      {recent.length > 0 && (
        <div className="td-fx-section">
          <h2 className="td-fx-section-title">🕐 Recent Results</h2>
          <div className="td-fx-grid">
            {recent.map(f => <FixtureCard key={f.id} fixture={f} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function TeamDetail() {
  const { slug } = useParams();
  const [team, setTeam]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('squad');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchTeamBySlug(slug)
      .then(setTeam)
      .catch(err => setError(err.message || 'Failed to load team'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="td-page">
      <div className="td-skeleton-hero" />
      <div className="container td-content">
        <div className="td-skeleton-body">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="td-skeleton-line" style={{ width: `${70 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="td-page">
      <div className="container td-content" style={{ paddingTop: '3rem' }}>
        <div className="fx-error">
          <span>⚠️</span>
          <div><strong>Could not load team</strong><p>{error}</p></div>
        </div>
        <Link to="/teams" className="td-back-link" style={{ marginTop: '1rem', display: 'inline-block' }}>← Back to Teams</Link>
      </div>
    </div>
  );

  if (!team) return (
    <div className="td-page">
      <div className="container td-content" style={{ paddingTop: '3rem' }}>
        <div className="fx-empty">
          <span className="fx-empty-icon">🏴</span>
          <h3>Team not found</h3>
          <Link to="/teams" className="td-back-link">← Back to Teams</Link>
        </div>
      </div>
    </div>
  );

  const form = Array.isArray(team.form) ? team.form : (team.form || '').split('');

  const grouped = (team.squad || []).reduce((acc, p) => {
    const pos = p.position || 'MID';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});

  const sortedPositions = Object.keys(grouped).sort(
    (a, b) => (POSITION_ORDER[a] ?? 9) - (POSITION_ORDER[b] ?? 9)
  );

  const { won = 0, drawn = 0, lost = 0, played = 0,
          goalsFor = 0, goalsAgainst = 0 } = team.stats ?? {};
  const winPct = played ? Math.round((won / played) * 100) : 0;

  const TABS = [
    { key: 'squad',    label: '👥 Squad' },
    { key: 'fixtures', label: '📅 Fixtures' },
    { key: 'info',     label: 'ℹ️ Info' },
    { key: 'stats',    label: '📊 Stats' },
  ];

  return (
    <div className="td-page">

      {/* ── Hero ── */}
      <div className="td-hero">
        <div className="td-hero-bg" />
        <div className="container td-hero-inner">
          <Link to="/teams" className="td-back-link">← All Teams</Link>

          <div className="td-hero-main">
            <div className="td-hero-flag">
              {team.flag
                ? <span className="td-flag-emoji">{team.flag}</span>
                : <div className="td-flag-letter">{team.name?.[0]}</div>
              }
            </div>

            <div className="td-hero-info">
              <div className="td-hero-badges">
                <span className="td-conf-badge">{team.confederation}</span>
                {team.group && <span className="td-group-badge">Group {team.group}</span>}
                <span className="td-rank-badge">
                  #{team.ranking ?? '—'} FIFA
                  {team.rankingLive && <span className="td-live-dot" title="Live ranking">●</span>}
                </span>
              </div>

              <h1 className="td-hero-title">{team.name}</h1>

              <p className="td-hero-coach">
                <span className="td-coach-icon">👤</span>
                {team.coach}
              </p>

              {form.length > 0 && (
                <div className="td-form-row">
                  <span className="td-form-label">Recent form</span>
                  <div className="td-form-badges">
                    {form.slice(-5).map((r, i) => <FormBadge key={i} result={r} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {team.stats && (
        <div className="td-stats-strip">
          <div className="container td-stats-inner">
            <StatBox label="Played"         value={played} />
            <StatBox label="Won"            value={won} />
            <StatBox label="Drawn"          value={drawn} />
            <StatBox label="Lost"           value={lost} />
            <StatBox label="Goals For"      value={goalsFor} />
            <StatBox label="Goals Against"  value={goalsAgainst} />
            <StatBox label="Win Rate"       value={`${winPct}%`} />
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="td-tabs-bar">
        <div className="container td-tabs-inner">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`td-tab-btn ${activeTab === t.key ? 'td-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container td-content">

        {/* Squad */}
        {activeTab === 'squad' && (
          <div className="td-squad">
            {sortedPositions.map(pos => (
              <div key={pos} className="td-squad-group">
                <h2 className="td-squad-pos-label">
                  {POSITION_LABELS[pos] || pos}
                  <span className="td-squad-count">{grouped[pos].length}</span>
                </h2>
                <div className="td-squad-grid">
                  {grouped[pos].map(player => (
                    <Link
                      key={player.id}
                      to={`/players/${player.id}`}
                      className="td-player-row"
                    >
                      <span className="td-player-num">#{player.shirtNumber}</span>
                      <div className="td-player-avatar">{player.name?.[0]}</div>
                      <div className="td-player-info">
                        <span className="td-player-name">{player.name}</span>
                        <span className="td-player-club">{player.club}</span>
                      </div>
                      <span className="td-player-age">Age {player.age}</span>
                      <span className="td-player-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fixtures */}
        {activeTab === 'fixtures' && (
          <FixturesTab
            apiFootballId={team.apiFootballId}
            teamName={team.name}
          />
        )}

        {/* Info */}
        {activeTab === 'info' && (
          <div className="td-info-grid">
            <div className="td-info-card">
              <h3 className="td-info-card-title">🏆 Tournament History</h3>
              <p className="td-info-card-text">{team.previousPerformance || 'No history available.'}</p>
            </div>
            <div className="td-info-card">
              <h3 className="td-info-card-title">👤 Head Coach</h3>
              <p className="td-info-card-text">{team.coach}</p>
            </div>
            <div className="td-info-card">
              <h3 className="td-info-card-title">🏟️ Home Stadium</h3>
              <p className="td-info-card-text">{team.stadium || 'TBC'}</p>
            </div>
            <div className="td-info-card">
              <h3 className="td-info-card-title">🌍 Confederation</h3>
              <p className="td-info-card-text">{team.confederation}</p>
            </div>
            <div className="td-info-card">
              <h3 className="td-info-card-title">📋 Group</h3>
              <p className="td-info-card-text">Group {team.group || '—'}</p>
            </div>
            <div className="td-info-card">
              <h3 className="td-info-card-title">🏅 FIFA Ranking</h3>
              <p className="td-info-card-text">
                #{team.ranking ?? '—'} in the world
                {team.rankingLive && ' (live)'}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {activeTab === 'stats' && team.stats && (
          <div className="td-stats-detail">
            <div className="td-stats-cards">
              {[
                { label: 'Matches Played', value: played, pct: 100, color: 'blue' },
                { label: 'Win Rate', value: `${winPct}%`, pct: winPct, color: 'green' },
                { label: 'Goals Scored', value: goalsFor, pct: Math.min((goalsFor / 40) * 100, 100), color: 'amber' },
                { label: 'Goals Conceded', value: goalsAgainst, pct: Math.min((goalsAgainst / 20) * 100, 100), color: 'red' },
              ].map(({ label, value, pct, color }) => (
                <div key={label} className="td-stats-card">
                  <div className="td-stats-card-label">{label}</div>
                  <div className="td-stats-card-value">{value}</div>
                  <div className="td-stats-bar">
                    <div className={`td-stats-bar-fill td-stats-bar--${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="td-wdl-row">
              <div className="td-wdl-item td-wdl-w">
                <span className="td-wdl-num">{won}</span>
                <span className="td-wdl-lbl">Wins</span>
              </div>
              <div className="td-wdl-item td-wdl-d">
                <span className="td-wdl-num">{drawn}</span>
                <span className="td-wdl-lbl">Draws</span>
              </div>
              <div className="td-wdl-item td-wdl-l">
                <span className="td-wdl-num">{lost}</span>
                <span className="td-wdl-lbl">Losses</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
