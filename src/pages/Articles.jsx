import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../services/articles.js';
import { isSanityConfigured } from '../services/sanityClient.js';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticles()
      .then((result) => setArticles(result))
      .catch((err) => setError(err.message || 'Failed to load articles'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="container page-section">
      <header className="section-header">
        <span className="eyebrow">Articles</span>
        <h1>Latest football stories</h1>
        <p>Published from your Sanity CMS feed.</p>
      </header>

      {loading && <p>Loading articles…</p>}
      {!loading && !isSanityConfigured && (
        <p className="info-message">
          Sanity is not configured. Showing sample articles until VITE_SANITY_PROJECT_ID is added.
        </p>
      )}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="article-list">
          {articles.length === 0 ? (
            <p>No articles available yet.</p>
          ) : (
            articles.map((article) => (
              <article key={article.id} className="article-card">
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <Link className="card-link" to={`/articles/${article.slug}`}>Read article</Link>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
