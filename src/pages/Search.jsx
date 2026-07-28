import { useState } from 'react';
import { searchSite } from '../services/search.js';
import { Link } from 'react-router-dom';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await searchSite(trimmed);
      setResults(result);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container page-section">
      <header className="section-header">
        <span className="eyebrow">Search</span>
        <h1>Find teams, players, articles, and fixtures</h1>
        <p>Search the GoalSphere site for previews, team pages, and player profiles.</p>
      </header>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Brazil, Messi, preview, world cup..."
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Searching…</p>}
      {error && <p className="error-message">{error}</p>}

      {results && (
        <div className="search-results">
          <section className="result-group">
            <h2>Articles</h2>
            {results.articles.length === 0 ? <p>No matching articles</p> : results.articles.map((article) => (
              <article key={article.id} className="card result-card">
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <Link className="card-link" to="/articles">Read article</Link>
              </article>
            ))}
          </section>

          <section className="result-group">
            <h2>Teams</h2>
            {results.teams.length === 0 ? <p>No matching teams</p> : results.teams.map((team) => (
              <article key={team.id} className="card result-card">
                <h3>{team.name}</h3>
                <p>{team.country}</p>
                <Link className="card-link" to={`/teams/${team.slug}`}>View team</Link>
              </article>
            ))}
          </section>

          <section className="result-group">
            <h2>Players</h2>
            {results.players.length === 0 ? <p>No matching players</p> : results.players.map((player) => (
              <article key={player.id} className="card result-card">
                <h3>{player.name}</h3>
                <p>{player.position} · {player.club}</p>
                <Link className="card-link" to={`/players/${player.id}`}>View player</Link>
              </article>
            ))}
          </section>

          <section className="result-group">
            <h2>Fixtures</h2>
            {results.fixtures.length === 0 ? <p>No matching fixtures</p> : results.fixtures.map((fixture) => (
              <article key={fixture.fixture.id} className="card result-card">
                <h3>{fixture.teams.home.name} vs {fixture.teams.away.name}</h3>
                <p>{fixture.league.name} · {new Date(fixture.fixture.date).toLocaleString()}</p>
                <Link className="card-link" to={`/fixtures/${fixture.fixture.id}`}>View preview</Link>
              </article>
            ))}
          </section>
        </div>
      )}
    </section>
  );
}
