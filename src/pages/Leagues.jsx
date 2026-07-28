import { Link } from 'react-router-dom';
import { LEAGUES } from '../api/leagues.js';

export default function Leagues() {
  return (
    <div className="lg-page">
      <div className="lg-page-header">
        <div className="container">
          <span className="section-eyebrow">Top 5 European Leagues</span>
          <h1 className="lg-page-title">Leagues</h1>
          <p className="lg-page-sub">
            Standings and fixtures for Europe&apos;s top five leagues — 2026-27 season kicks off August 21.
          </p>
        </div>
      </div>

      <div className="container lg-content">
        <div className="lg-grid">
          {LEAGUES.map(league => (
            <Link key={league.code} to={`/leagues/${league.code}`} className="lg-card">
              <span className="lg-card-country">{league.country}</span>
              <span className="lg-card-name">{league.name}</span>
              <span className="lg-card-cta">View standings &amp; fixtures &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
