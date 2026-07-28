import { useEffect, useMemo, useState } from 'react';
import { fetchTeamBySlug, fetchTeams } from '../services/teams.js';
import { getFlagUrl } from '../data/flagCodes.js';
import { getH2H } from '../api/football.js';

function FormBadge({ result }) {
  const cls = result === 'W' ? 'form-w' : result === 'D' ? 'form-d' : 'form-l';
  return <span className={`form-badge ${cls}`}>{result}</span>;
}

function StatBar({ valA, valB, label }) {
  const total = (valA ?? 0) + (valB ?? 0);
  const pctA = total > 0 ? ((valA ?? 0) / total) * 100 : 50;
  return (
    <div className="cmp-stat-row">
      <span className="cmp-stat-val cmp-stat-val--a">{valA ?? 0}</span>
      <div className="cmp-stat-mid">
        <span className="cmp-stat-label">{label}</span>
        <div className="cmp-stat-bar">
          <div className="cmp-stat-fill cmp-stat-fill--a" style={{ width: `${pctA}%` }} />
          <div className="cmp-stat-fill cmp-stat-fill--b" style={{ width: `${100 - pctA}%` }} />
        </div>
      </div>
      <span className="cmp-stat-val cmp-stat-val--b">{valB ?? 0}</span>
    </div>
  );
}

function TeamHeader({ data, side }) {
  const flagUrl = getFlagUrl(data.slug, 80);
  const form = Array.isArray(data.form) ? data.form : (data.form?.split('') ?? []);
  return (
    <div className={`cmp-team-col cmp-team-col--${side}`}>
      <div className="cmp-team-flag-wrap">
        {flagUrl
          ? <img src={flagUrl} alt={data.name} className="cmp-flag-img" onError={e => { e.target.style.display = 'none'; }} />
          : <span className="cmp-flag-fallback">{data.name[0]}</span>
        }
      </div>
      <h2 className="cmp-team-name">{data.name}</h2>
      <div className="cmp-team-rank">FIFA #{data.ranking ?? '—'}</div>
      {data.coach && <div className="cmp-team-coach">{data.coach}</div>}
      {form.length > 0 && (
        <div className="cmp-form-row">
          {form.slice(-5).map((r, i) => <FormBadge key={i} result={r} />)}
        </div>
      )}
    </div>
  );
}

function getForm(data) {
  if (!data?.form) return [];
  return Array.isArray(data.form) ? data.form : data.form.split('');
}

export default function Compare() {
  const [teams, setTeams] = useState([]);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [teamAData, setTeamAData] = useState(null);
  const [teamBData, setTeamBData] = useState(null);
  const [h2h, setH2h] = useState([]);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(err => setError(err.message || 'Failed to load teams'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!teamA) { setTeamAData(null); return; }
    fetchTeamBySlug(teamA).then(setTeamAData).catch(() => setTeamAData(null));
  }, [teamA]);

  useEffect(() => {
    if (!teamB) { setTeamBData(null); return; }
    fetchTeamBySlug(teamB).then(setTeamBData).catch(() => setTeamBData(null));
  }, [teamB]);

  // Fetch H2H when both teams have API Football IDs
  useEffect(() => {
    const idA = teamAData?.apiFootballId;
    const idB = teamBData?.apiFootballId;
    if (!idA || !idB) { setH2h([]); return; }
    setH2hLoading(true);
    getH2H(idA, idB, 5)
      .then(setH2h)
      .catch(() => setH2h([]))
      .finally(() => setH2hLoading(false));
  }, [teamAData, teamBData]);

  const formA = getForm(teamAData);
  const formB = getForm(teamBData);

  const statsA = useMemo(() => ({
    wins: formA.filter(r => r === 'W').length,
    draws: formA.filter(r => r === 'D').length,
    losses: formA.filter(r => r === 'L').length,
    goals: teamAData?.stats?.goalsFor ?? 0,
    played: teamAData?.stats?.played ?? 0,
  }), [teamAData, formA]);

  const statsB = useMemo(() => ({
    wins: formB.filter(r => r === 'W').length,
    draws: formB.filter(r => r === 'D').length,
    losses: formB.filter(r => r === 'L').length,
    goals: teamBData?.stats?.goalsFor ?? 0,
    played: teamBData?.stats?.played ?? 0,
  }), [teamBData, formB]);

  const ready = teamAData && teamBData;

  return (
    <div className="cmp-page">
      <div className="cmp-page-header">
        <div className="container">
          <span className="section-eyebrow">Head to Head</span>
          <h1 className="cmp-page-title">Team Comparison</h1>
          <p className="cmp-page-sub">Compare rankings, form, coaches, and squads side by side.</p>
        </div>
      </div>

      <div className="container cmp-content">
        {error && (
          <div className="fx-error">
            <span>⚠️</span>
            <div><strong>Could not load teams</strong><p>{error}</p></div>
          </div>
        )}

        {/* Team selectors */}
        {!loading && !error && (
          <div className="cmp-selectors">
            <div className="cmp-selector">
              <label className="cmp-selector-label">Team A</label>
              <select className="cmp-selector-select" value={teamA} onChange={e => setTeamA(e.target.value)}>
                <option value="">Choose a team</option>
                {teams.map(t => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="cmp-vs-badge">VS</div>
            <div className="cmp-selector">
              <label className="cmp-selector-label">Team B</label>
              <select className="cmp-selector-select" value={teamB} onChange={e => setTeamB(e.target.value)}>
                <option value="">Choose a team</option>
                {teams.map(t => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loading && (
          <div className="cmp-selectors">
            <div className="cmp-skeleton-select" />
            <div className="cmp-vs-badge">VS</div>
            <div className="cmp-skeleton-select" />
          </div>
        )}

        {/* Comparison results */}
        {ready && (
          <>
            {/* Side-by-side team headers */}
            <div className="cmp-panel">
              <TeamHeader data={teamAData} side="a" />
              <div className="cmp-panel-divider"><span>VS</span></div>
              <TeamHeader data={teamBData} side="b" />
            </div>

            {/* Stat comparison bars */}
            <div className="cmp-section">
              <h3 className="cmp-section-title">Recent Form (last 5 matches)</h3>
              <div className="cmp-stat-rows">
                <StatBar valA={statsA.wins} valB={statsB.wins} label="Wins" />
                <StatBar valA={statsA.draws} valB={statsB.draws} label="Draws" />
                <StatBar valA={statsA.losses} valB={statsB.losses} label="Losses" />
              </div>
            </div>

            {/* Overall stats */}
            {(statsA.played > 0 || statsB.played > 0) && (
              <div className="cmp-section">
                <h3 className="cmp-section-title">Overall Stats</h3>
                <div className="cmp-stat-rows">
                  <StatBar valA={statsA.goals} valB={statsB.goals} label="Goals Scored" />
                  <StatBar valA={statsA.played} valB={statsB.played} label="Matches Played" />
                  <StatBar
                    valA={Math.max(0, 210 - (teamAData.ranking ?? 210))}
                    valB={Math.max(0, 210 - (teamBData.ranking ?? 210))}
                    label="FIFA Ranking Score"
                  />
                </div>
              </div>
            )}

            {/* Key players */}
            {(teamAData.squad?.length > 0 || teamBData.squad?.length > 0) && (
              <div className="cmp-section">
                <h3 className="cmp-section-title">Key Players</h3>
                <div className="cmp-players-grid">
                  <div className="cmp-player-col">
                    <div className="cmp-player-col-label">{teamAData.name}</div>
                    {(teamAData.squad ?? []).slice(0, 4).map(p => (
                      <div key={p.id} className="cmp-player-row">
                        <div className="cmp-player-avatar cmp-player-avatar--a">{p.name[0]}</div>
                        <div className="cmp-player-info">
                          <span className="cmp-player-name">{p.name}</span>
                          <span className="cmp-player-pos">{p.position}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="cmp-player-col cmp-player-col--b">
                    <div className="cmp-player-col-label">{teamBData.name}</div>
                    {(teamBData.squad ?? []).slice(0, 4).map(p => (
                      <div key={p.id} className="cmp-player-row cmp-player-row--b">
                        <div className="cmp-player-info cmp-player-info--b">
                          <span className="cmp-player-name">{p.name}</span>
                          <span className="cmp-player-pos">{p.position}</span>
                        </div>
                        <div className="cmp-player-avatar cmp-player-avatar--b">{p.name[0]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* World Cup history */}
            {(teamAData.previousPerformance || teamBData.previousPerformance) && (
              <div className="cmp-section">
                <h3 className="cmp-section-title">World Cup History</h3>
                <div className="cmp-history-grid">
                  {teamAData.previousPerformance && (
                    <div className="cmp-history-card cmp-history-card--a">
                      <span className="cmp-history-team">{teamAData.name}</span>
                      <p className="cmp-history-text">{teamAData.previousPerformance}</p>
                    </div>
                  )}
                  {teamBData.previousPerformance && (
                    <div className="cmp-history-card cmp-history-card--b">
                      <span className="cmp-history-team">{teamBData.name}</span>
                      <p className="cmp-history-text">{teamBData.previousPerformance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Head-to-head recent meetings */}
            {(teamAData.apiFootballId && teamBData.apiFootballId) && (
              <div className="cmp-section">
                <h3 className="cmp-section-title">Recent Meetings</h3>
                {h2hLoading && (
                  <div className="cmp-h2h-list">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="cmp-h2h-row cmp-h2h-row--skeleton" />
                    ))}
                  </div>
                )}
                {!h2hLoading && h2h.length === 0 && (
                  <div className="fx-empty" style={{ padding: '1.5rem 0' }}>
                    <span className="fx-empty-icon">🤝</span>
                    <p>No head-to-head data found for this matchup.</p>
                  </div>
                )}
                {!h2hLoading && h2h.length > 0 && (
                  <div className="cmp-h2h-list">
                    {h2h.map(m => {
                      const d = new Date(m.fixture.date);
                      const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
                      const homeWin = m.teams.home.winner;
                      const awayWin = m.teams.away.winner;
                      return (
                        <div key={m.fixture.id} className="cmp-h2h-row">
                          <span className="cmp-h2h-date">{dateStr}</span>
                          <span className="cmp-h2h-comp">{m.league.name}</span>
                          <div className="cmp-h2h-match">
                            <span className={`cmp-h2h-team ${homeWin ? 'cmp-h2h-team--win' : ''}`}>{m.teams.home.name}</span>
                            <span className="cmp-h2h-score">
                              {m.goals.home} – {m.goals.away}
                            </span>
                            <span className={`cmp-h2h-team cmp-h2h-team--away ${awayWin ? 'cmp-h2h-team--win' : ''}`}>{m.teams.away.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && !ready && (
          <div className="cmp-placeholder">
            <div className="cmp-placeholder-icon">⚔️</div>
            <h3>Select two teams to compare</h3>
            <p>Choose Team A and Team B above to see a full head-to-head breakdown.</p>
          </div>
        )}
      </div>
    </div>
  );
}
