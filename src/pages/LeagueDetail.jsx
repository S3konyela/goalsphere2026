import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeagueByCode, getLeagueStandings, getLeagueMatches } from '../api/leagues.js';

function formatDate(utcDate) {
  return new Date(utcDate).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function StandingsTable({ rows }) {
  if (rows.length === 0) {
    return (
      <div className="fx-empty">
        <span className="fx-empty-icon">📊</span>
        <h3>No standings yet</h3>
        <p>The table will populate once the season gets underway.</p>
      </div>
    );
  }

  return (
    <div className="lg-table-wrap">
      <table className="lg-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="lg-table-team-col">Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.team.id}>
              <td>{row.position}</td>
              <td className="lg-table-team-col">
                <span className="lg-team-cell">
                  {row.team.crest && <img src={row.team.crest} alt="" className="lg-team-crest" />}
                  {row.team.name}
                </span>
              </td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.draw}</td>
              <td>{row.lost}</td>
              <td>{row.goalsFor}</td>
              <td>{row.goalsAgainst}</td>
              <td>{row.goalDifference}</td>
              <td><strong>{row.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ match }) {
  const finished = match.status === 'FINISHED';
  return (
    <div className="lg-match-row">
      <span className="lg-match-date">{formatDate(match.utcDate)}</span>
      <span className="lg-match-team lg-match-team--home">{match.homeTeam.name}</span>
      {finished ? (
        <span className="lg-match-score">
          {match.score.fullTime.home} - {match.score.fullTime.away}
        </span>
      ) : (
        <span className="lg-match-vs">vs</span>
      )}
      <span className="lg-match-team lg-match-team--away">{match.awayTeam.name}</span>
    </div>
  );
}

function MatchList({ matches, emptyLabel }) {
  if (matches.length === 0) {
    return <p className="lg-empty-note">{emptyLabel}</p>;
  }
  return (
    <div className="lg-match-list">
      {matches.map(m => <MatchRow key={m.id} match={m} />)}
    </div>
  );
}

export default function LeagueDetail() {
  const { code } = useParams();
  const league = getLeagueByCode(code || '');
  const [tab, setTab] = useState('standings');
  const [standings, setStandings] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!league) return;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      getLeagueStandings(league.code),
      getLeagueMatches(league.code, 'SCHEDULED'),
      getLeagueMatches(league.code, 'FINISHED'),
    ]).then(([standingsRes, scheduledRes, finishedRes]) => {
      setStandings(standingsRes.status === 'fulfilled' ? standingsRes.value : []);
      setUpcoming(scheduledRes.status === 'fulfilled' ? scheduledRes.value.slice(0, 10) : []);
      setResults(finishedRes.status === 'fulfilled' ? finishedRes.value.slice(-10).reverse() : []);
      if (standingsRes.status === 'rejected' && scheduledRes.status === 'rejected') {
        setError('Failed to load league data');
      }
      setLoading(false);
    });
  }, [league]);

  if (!league) {
    return (
      <div className="container lg-content">
        <div className="fx-empty">
          <span className="fx-empty-icon">🔍</span>
          <h3>League not found</h3>
          <p><Link to="/leagues">Back to leagues</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-page">
      <div className="lg-page-header">
        <div className="container">
          <span className="section-eyebrow">{league.country}</span>
          <h1 className="lg-page-title">{league.name}</h1>
        </div>
      </div>

      <div className="lg-filter-bar">
        <div className="container cal-round-tabs" role="group" aria-label="View">
          <button
            type="button"
            className={`cal-round-btn ${tab === 'standings' ? 'cal-round-btn--active' : ''}`}
            onClick={() => setTab('standings')}
          >
            Standings
          </button>
          <button
            type="button"
            className={`cal-round-btn ${tab === 'fixtures' ? 'cal-round-btn--active' : ''}`}
            onClick={() => setTab('fixtures')}
          >
            Fixtures &amp; Results
          </button>
        </div>
      </div>

      <div className="container lg-content">
        {error && (
          <div className="fx-error">
            <span>⚠️</span>
            <div><strong>Could not load league data</strong><p>{error}</p></div>
          </div>
        )}

        {loading && <p className="lg-empty-note">Loading…</p>}

        {!loading && !error && tab === 'standings' && <StandingsTable rows={standings} />}

        {!loading && !error && tab === 'fixtures' && (
          <div className="lg-fixtures-grid">
            <section>
              <h2 className="lg-section-title">Upcoming</h2>
              <MatchList matches={upcoming} emptyLabel="No upcoming fixtures yet." />
            </section>
            <section>
              <h2 className="lg-section-title">Recent Results</h2>
              <MatchList matches={results} emptyLabel="No results yet." />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
