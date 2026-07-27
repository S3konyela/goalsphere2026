import { sanityClient } from '../lib/sanity';

export default async function Home() {
  const query = '*[_type == "article"] | order(publishedAt desc) {title, slug, excerpt, publishedAt}[0...5]';
  const articles = await sanityClient.fetch(query);

  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">GoalSphere 2026</h1>
      <p className="mb-8">Latest articles from Sanity CMS.</p>
      <div className="grid gap-6 sm:grid-cols-2">
        {articles.map((article: any) => (
          <article key={article.slug.current} className="rounded-2xl border p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">{article.title}</h2>
            <p className="text-sm text-slate-600 mb-4">{article.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
