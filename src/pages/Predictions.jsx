import { useEffect, useState } from 'react';
import { getFixturesByDate } from '../api/football.js';
import { createPrediction, fetchPredictions } from '../services/predictions.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';

// Use local calendar date, not UTC — avoids off-by-one in non-UTC timezones
function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const NS_STATUSES   = new Set(['NS', 'TBD']);
const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE']);

function SkeletonPrediction() {
  return (
    <div className="pred-item pred-item--skeleton">
      <div className="pred-skeleton-match" />
      <div className="pred-skeleton-score" />
      <div className="pred-skeleton-meta" />
    </div>
  );
}

export default function Predictions() {
  const [dateTab, setDateTab]             = useState('today');
  const [fixtures, setFixtures]           = useState([]);   // only NS/TBD — selectable
  const [totalForDate, setTotalForDate]   = useState(0);    // all fixtures returned for the date
  const [fxError, setFxError]             = useState(null);
  const [fixturesLoading, setFxLoading]  = useState(false);
  const [predictions, setPredictions]     = useState([]);
  const [matchId, setMatchId]             = useState('');
  const [homeScore, setHomeScore]         = useState('');
  const [awayScore, setAwayScore]         = useState('');
  const [userName, setUserName]           = useState('');
  const [status, setStatus]               = useState({ type: '', msg: '' });
  const [submitting, setSubmitting]       = useState(false);
  const [loadingPreds, setLoadingPreds]   = useState(true);

  // Fetch fixtures whenever the date tab changes
  useEffect(() => {
    setFxLoading(true);
    setMatchId('');
    setTotalForDate(0);
    setFxError(null);
    const date = offsetDate(dateTab === 'today' ? 0 : 1);
    console.log('[Predictions] fetching', date);
    getFixturesByDate(date)
      .then(raw => {
        console.log('[Predictions] got', raw.length, 'fixtures, statuses:',
          [...new Set(raw.map(f => f.fixture?.status?.short))]);
        setTotalForDate(raw.length);
        setFixtures(raw.filter(f => NS_STATUSES.has(f.fixture?.status?.short)));
      })
      .catch(err => {
        console.error('[Predictions] fetch failed:', err);
        setFxError(err?.response?.data?.message || err?.message || 'Failed to load fixtures');
        setFixtures([]);
        setTotalForDate(0);
      })
      .finally(() => setFxLoading(false));
  }, [dateTab]);

  // Load existing predictions once on mount
  useEffect(() => {
    fetchPredictions()
      .then(setPredictions)
      .catch(() => {})
      .finally(() => setLoadingPreds(false));
  }, []);

  const selectedFixture = fixtures.find(f => String(f.fixture.id) === matchId);
  const homeName = selectedFixture?.teams?.home?.name ?? 'Home';
  const awayName = selectedFixture?.teams?.away?.name ?? 'Away';

  // Group fixtures by league name for <optgroup>
  const grouped = {};
  fixtures.forEach(f => {
    const key = f.league?.name ?? 'Other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!matchId || !userName.trim()) {
      setStatus({ type: 'error', msg: 'Please enter your name and select a match.' });
      return;
    }
    setSubmitting(true);
    setStatus({ type: '', msg: '' });
    try {
      await createPrediction({
        user_name:   userName.trim(),
        match_id:    String(selectedFixture.fixture.id),
        match_label: `${homeName} vs ${awayName}`,
        home_score:  Number(homeScore) || 0,
        away_score:  Number(awayScore) || 0,
      });
      setStatus({ type: 'success', msg: 'Prediction saved! Good luck.' });
      setHomeScore('');
      setAwayScore('');
      setMatchId('');
      fetchPredictions().then(setPredictions).catch(() => {});
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Unable to submit prediction.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pred-page">
      <div className="pred-page-header">
        <div className="container">
          <span className="section-eyebrow">Predictions</span>
          <h1 className="pred-page-title">Make a Prediction</h1>
          <p className="pred-page-sub">Forecast scores for any match and earn fan points on the leaderboard.</p>
        </div>
      </div>

      <div className="container pred-content">
        {!isSupabaseConfigured && (
          <div className="info-message">
            Demo mode — connect Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) to save real predictions.
          </div>
        )}

        <div className="pred-layout">
          {/* ── Form ──────────────────────────────────────────── */}
          <div className="pred-form-card">
            <h2 className="pred-form-title">Your forecast</h2>
            <form onSubmit={handleSubmit} className="pred-form">

              <div className="pred-field">
                <label className="pred-label">Your name</label>
                <input
                  className="pred-input"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Fan name"
                  disabled={!isSupabaseConfigured}
                />
              </div>

              {/* Date tabs */}
              <div className="pred-date-tabs">
                <button
                  type="button"
                  className={`pred-date-tab ${dateTab === 'today' ? 'pred-date-tab--active' : ''}`}
                  onClick={() => setDateTab('today')}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`pred-date-tab ${dateTab === 'tomorrow' ? 'pred-date-tab--active' : ''}`}
                  onClick={() => setDateTab('tomorrow')}
                >
                  Tomorrow
                </button>
              </div>

              {fxError && (
                <div className="pred-status pred-status--error" style={{ marginBottom: '.75rem' }}>
                  ⚠ {fxError}
                </div>
              )}

              <div className="pred-field">
                <label className="pred-label">Select match</label>
                <select
                  className="pred-select"
                  value={matchId}
                  onChange={e => setMatchId(e.target.value)}
                  disabled={!isSupabaseConfigured || fixturesLoading || fixtures.length === 0}
                >
                  <option value="">
                    {fixturesLoading
                      ? 'Loading matches…'
                      : fixtures.length === 0
                        ? totalForDate > 0
                          ? 'All matches today have already started'
                          : 'No matches scheduled for this date'
                        : 'Choose a match'}
                  </option>
                  {Object.entries(grouped).map(([league, fxs]) => (
                    <optgroup key={league} label={league}>
                      {fxs.map(f => {
                        const time = new Date(f.fixture.date).toLocaleTimeString([], {
                          hour: '2-digit', minute: '2-digit',
                        });
                        return (
                          <option key={f.fixture.id} value={String(f.fixture.id)}>
                            {f.teams.home.name} vs {f.teams.away.name} · {time}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
                {!fixturesLoading && fixtures.length === 0 && totalForDate > 0 && (
                  <p className="pred-hint">
                    {totalForDate} match{totalForDate !== 1 ? 'es' : ''} played today — switch to Tomorrow to predict upcoming fixtures.
                  </p>
                )}
              </div>

              {/* Score picker */}
              <div className="pred-field">
                <label className="pred-label">Predicted score</label>
                <div className="pred-score-row">
                  <div className="pred-score-side">
                    <span className="pred-score-team">{homeName}</span>
                    <input
                      className="pred-score-input"
                      type="number"
                      min="0"
                      max="20"
                      value={homeScore}
                      onChange={e => setHomeScore(e.target.value)}
                      disabled={!isSupabaseConfigured}
                      placeholder="0"
                    />
                  </div>
                  <span className="pred-score-dash">–</span>
                  <div className="pred-score-side pred-score-side--away">
                    <span className="pred-score-team">{awayName}</span>
                    <input
                      className="pred-score-input"
                      type="number"
                      min="0"
                      max="20"
                      value={awayScore}
                      onChange={e => setAwayScore(e.target.value)}
                      disabled={!isSupabaseConfigured}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <button
                className="pred-submit"
                type="submit"
                disabled={!isSupabaseConfigured || !matchId || submitting}
              >
                {submitting ? 'Saving…' : 'Save prediction'}
              </button>

              {status.msg && (
                <div className={`pred-status pred-status--${status.type}`}>
                  {status.type === 'success' ? '✓' : '⚠'} {status.msg}
                </div>
              )}
            </form>
          </div>

          {/* ── Recent predictions list ────────────────────────── */}
          <div className="pred-list-card">
            <h2 className="pred-form-title">Recent predictions</h2>

            {loadingPreds && (
              <div className="pred-list">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonPrediction key={i} />)}
              </div>
            )}

            {!loadingPreds && predictions.length === 0 && (
              <div className="fx-empty" style={{ padding: '3rem 1rem' }}>
                <span className="fx-empty-icon">🎯</span>
                <h3>No predictions yet</h3>
                <p>Submit your first forecast above.</p>
              </div>
            )}

            {!loadingPreds && predictions.length > 0 && (
              <div className="pred-list">
                {predictions.map(p => (
                  <div key={p.id} className="pred-item">
                    <div className="pred-item-match">{p.match_label}</div>
                    <div className="pred-item-score">{p.home_score} – {p.away_score}</div>
                    <div className="pred-item-meta">
                      <span className="pred-item-user">{p.user_name}</span>
                      {p.points > 0 && <span className="pred-item-pts">+{p.points} pts</span>}
                      <span className="pred-item-date">
                        {new Date(p.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
