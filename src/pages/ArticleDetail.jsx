import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchArticleBySlug } from '../services/articles.js';
import { isSanityConfigured } from '../services/sanityClient.js';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    fetchArticleBySlug(slug)
      .then((result) => setArticle(result))
      .catch((err) => setError(err.message || 'Failed to load article'))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <section className="container page-section"> 
      {loading && <p>Loading article…</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && article && (
        <article className="article-detail-card">
          <header className="section-header">
            <span className="eyebrow">Article</span>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            {!isSanityConfigured && (
              <p className="info-message">Sanity is not configured. Displaying fallback article content.</p>
            )}
          </header>

          <div className="article-body">
            {article.body.split('\n\n').map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
            ))}
          </div>

          <div className="section-links">
            <Link className="card-link" to="/articles">Back to articles</Link>
          </div>
        </article>
      )}
    </section>
  );
}
