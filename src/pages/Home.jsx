import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { fetchTeams } from '../services/teams.js';
import { getLiveFixtures, getFixturesByDate } from '../api/football.js';
import { getFlagUrl } from '../data/flagCodes.js';

const QUICK_STATS = [
  { value: 48, label: 'Teams', suffix: '' },
  { value: 104, label: 'Matches', suffix: '' },
  { value: 700, label: 'Players', suffix: '+' },
  { value: 6, label: 'Confederations', suffix: '' },
];

// ── Hooks ───────────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const animRef = useRef(null);
  useEffect(() => {
    const el = document.getElementById(`counter-${target}`);
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) animRef.current = requestAnimationFrame(tick);
      }
      animRef.current = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [target, duration]);
  return count;
}

// ── Small components ─────────────────────────────────────────────────────────
function StatCounter({ value, label, suffix }) {
  const count = useCountUp(value);
  return (
    <div className="stat-card" id={`counter-${value}`}>
      <span className="stat-value">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function FormBadge({ result }) {
  const cls = result === 'W' ? 'form-w' : result === 'D' ? 'form-d' : 'form-l';
  return <span className={`form-badge ${cls}`}>{result}</span>;
}

function Countdown({ dateStr }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    function calc() {
      const diff = new Date(dateStr) - new Date();
      if (diff <= 0) { setTime('Live'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTime(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`);
    }
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [dateStr]);
  return <span className="countdown-badge">{time}</span>;
}

// ── Fixture strip card (works with raw API shape) ─────────────────────────
function FixtureStripCard({ game }) {
  const kickoff = new Date(game.fixture.date);
  const dateStr = kickoff.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const round = game.league?.round ?? '';
  const isLive = ['LIVE','1H','2H','HT','ET','P','BT','INT'].includes(game.fixture?.status?.short);
  const hasFlagsHome = !!(game.teams?.home?.logo);
  const hasFlagsAway = !!(game.teams?.away?.logo);

  return (
    <div className={`fixture-strip-card ${isLive ? 'fixture-strip-card--live' : ''}`}>
      <span className="fixture-group-tag">{round || 'Match'}</span>
      <div className="fixture-matchup">
        <div className="fixture-team-col">
          {hasFlagsHome
            ? <img src={game.teams.home.logo} alt={game.teams.home.name} className="fixture-strip-logo" onError={e => { e.target.style.display = 'none'; }} />
            : <span className="fixture-flag">{game.teams.home.name[0]}</span>
          }
          <span className="fixture-team-name">{game.teams.home.name}</span>
        </div>
        <div className="fixture-vs-col">
          {isLive
            ? <span className="fixture-live-badge">LIVE</span>
            : <span className="fixture-vs">VS</span>
          }
          {!isLive && <Countdown dateStr={game.fixture.date} />}
        </div>
        <div className="fixture-team-col fixture-team-col--away">
          {hasFlagsAway
            ? <img src={game.teams.away.logo} alt={game.teams.away.name} className="fixture-strip-logo" onError={e => { e.target.style.display = 'none'; }} />
            : <span className="fixture-flag">{game.teams.away.name[0]}</span>
          }
          <span className="fixture-team-name">{game.teams.away.name}</span>
        </div>
      </div>
      <div className="fixture-meta">
        <span>📅 {dateStr} · {timeStr}</span>
        {game.fixture.venue?.name && <span>🏟 {game.fixture.venue.name}</span>}
      </div>
    </div>
  );
}

// ── Featured team card ────────────────────────────────────────────────────
function FeaturedTeamCard({ team }) {
  const flagUrl = getFlagUrl(team.slug, 80);
  const form = Array.isArray(team.form) ? team.form : (team.form?.split('') ?? []);
  return (
    <div className="team-feature-card">
      <div className="team-card-flag">
        {flagUrl
          ? <img src={flagUrl} alt={team.name} className="team-flag-img" onError={e => { e.target.style.display = 'none'; }} />
          : <span>{team.flag ?? team.name[0]}</span>
        }
      </div>
      <div className="team-card-info">
        <h3 className="team-card-name">{team.name}</h3>
        <p className="team-card-meta">FIFA #{team.ranking} · {team.coach}</p>
        <div className="team-card-form">
          {form.slice(-5).map((r, i) => <FormBadge key={i} result={r} />)}
        </div>
      </div>
      <Link to={`/teams/${team.slug}`} className="team-card-btn">Squad →</Link>
    </div>
  );
}

const LIVE_SHORT_SET = new Set(['LIVE','1H','2H','HT','ET','P','BT','INT']);

// ── Pick 4 matches to feature: live first, then soonest upcoming ──────────
function pickFeaturedMatches(live, today) {
  const now = Date.now();
  const liveNow = live.slice(0, 4);
  if (liveNow.length >= 4) return liveNow;

  const upcoming = today
    .filter(m => { const s = m.fixture?.status?.short ?? ''; return s === 'NS' || s === 'TBD'; })
    .filter(m => new Date(m.fixture.date).getTime() > now)
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

  return [...liveNow, ...upcoming].slice(0, 4);
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [featuredTeams, setFeaturedTeams] = useState([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState([]);
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    fetchTeams()
      .then(teams => {
        const sorted = [...teams].sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
        setFeaturedTeams(sorted.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setTeamsLoading(false));
  }, []);

  useEffect(() => {
    const todayStr = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

    Promise.all([
      getLiveFixtures().catch(() => []),
      getFixturesByDate(todayStr).catch(() => []),
    ])
      .then(([live, today]) => {
        setUpcomingFixtures(pickFeaturedMatches(live, today));
      })
      .finally(() => setFixturesLoading(false));
  }, []);

  return (
    <div className="home-page">

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg-layer" aria-hidden="true" />
        <div className="container hero-content">
          <span className="hero-eyebrow">FIFA World Cup 2026™</span>
          <h1 className="hero-title">The World's Game,<br />One Platform.</h1>
          <p className="hero-sub">
            Live fixtures · Team rankings · Player stats · Match predictions
          </p>
          <div className="hero-tags">
            <span>🇺🇸 USA</span><span>🇨🇦 Canada</span><span>🇲🇽 Mexico</span>
            <span>48 Teams · 104 Matches · 16 Venues</span>
          </div>
          <div className="hero-ctas">
            <Link to="/teams" className="btn-primary">Explore Teams</Link>
            <Link to="/fixtures" className="btn-outline">View Fixtures</Link>
          </div>
        </div>
        <div className="hero-scroll-hint" aria-hidden="true"><span>↓</span></div>
      </section>

      {/* ── Quick Stats ── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {QUICK_STATS.map(s => (
              <StatCounter key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Fixtures ── */}
      <section className="home-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Live &amp; Upcoming</span>
              <h2 className="section-title">Featured Matches</h2>
            </div>
            <Link to="/fixtures" className="section-link">All fixtures →</Link>
          </div>

          {fixturesLoading && (
            <div className="fixtures-strip">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="fixture-strip-card fixture-strip-card--skeleton">
                  <div className="home-skeleton-line" style={{ width: '40%', height: '14px' }} />
                  <div className="home-skeleton-line" style={{ width: '100%', height: '60px', margin: '0.75rem 0' }} />
                  <div className="home-skeleton-line" style={{ width: '70%', height: '12px' }} />
                </div>
              ))}
            </div>
          )}

          {!fixturesLoading && upcomingFixtures.length > 0 && (
            <div className="fixtures-strip">
              {upcomingFixtures.map(f => (
                <FixtureStripCard key={f.fixture.id} game={f} />
              ))}
            </div>
          )}

          {!fixturesLoading && upcomingFixtures.length === 0 && (
            <div className="fixtures-strip">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No upcoming fixtures available — check the <Link to="/fixtures" style={{ color: 'var(--blue)' }}>full schedule</Link>.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Teams ── */}
      <section className="home-section home-section--dark">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Nations</span>
              <h2 className="section-title">Featured Teams</h2>
            </div>
            <Link to="/teams" className="section-link">All teams →</Link>
          </div>

          {teamsLoading && (
            <div className="teams-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="team-feature-card team-feature-card--skeleton">
                  <div className="home-skeleton-line home-skeleton-line--dark" style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className="home-skeleton-line home-skeleton-line--dark" style={{ width: '60%', height: '16px' }} />
                    <div className="home-skeleton-line home-skeleton-line--dark" style={{ width: '80%', height: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!teamsLoading && (
            <div className="teams-grid">
              {featuredTeams.map(team => (
                <FeaturedTeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Explore Features ── */}
      <section className="home-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Platform</span>
              <h2 className="section-title">Everything in One Place</h2>
            </div>
          </div>
          <div className="features-grid">
            {[
              { icon: '📰', title: 'News', desc: 'CMS-powered football stories from Sanity.', to: '/articles', cta: 'Read news' },
              { icon: '📅', title: 'Calendar', desc: 'Full World Cup schedule by matchday.', to: '/calendar', cta: 'View calendar' },
              { icon: '🔍', title: 'Search', desc: 'Find teams, players and fixtures fast.', to: '/search', cta: 'Search now' },
              { icon: '⚔️', title: 'Compare', desc: 'Head-to-head team comparison tool.', to: '/compare', cta: 'Compare teams' },
              { icon: '🎯', title: 'Predictions', desc: 'Forecast scores and earn fan points.', to: '/predictions', cta: 'Predict now' },
              { icon: '🏆', title: 'Leaderboard', desc: 'Top fan predictors ranked by points.', to: '/leaderboard', cta: 'See rankings' },
            ].map(f => (
              <Link key={f.title} to={f.to} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <span className="feature-cta">{f.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
