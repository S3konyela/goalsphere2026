import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container page-section">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist. Return to the homepage to continue.</p>
      <Link className="button-link" to="/">Go to Home</Link>
    </section>
  );
}
