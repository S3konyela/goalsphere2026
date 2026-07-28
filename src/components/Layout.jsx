import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../assets/logo.svg';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/fixtures', label: 'Fixtures' },
    { to: '/leagues', label: 'Leagues' },
    { to: '/teams', label: 'Teams' },
    { to: '/players', label: 'Players' },
    { to: '/predictions', label: 'Predictions' },
    { to: '/articles', label: 'News' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/compare', label: 'Compare' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand logo-brand">
            <img src={Logo} alt="GoalSphere" className="brand-logo" />
            <span className="brand-name">GoalSphere</span>
          </NavLink>

          <nav className="main-nav" aria-label="Primary navigation">
            {navLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}>{label}</NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(s => !s)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button
              className="icon-btn hamburger"
              aria-label="Menu"
              onClick={() => setMenuOpen(s => !s)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen
                  ? <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>
                  : <><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-bar-dropdown">
            <div className="container">
              <form onSubmit={handleSearch} className="search-bar-form">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search teams, players, fixtures…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="search-bar-input"
                />
                <button type="submit" className="search-bar-btn">Search</button>
              </form>
            </div>
          </div>
        )}

        {menuOpen && (
          <nav className="mobile-menu" aria-label="Mobile navigation">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <img src={Logo} alt="GoalSphere" className="footer-logo" />
            <span>GoalSphere</span>
          </div>
          <p className="footer-copy">© 2026 GoalSphere · FIFA World Cup 2026 Hub · Built by Skons Studio</p>
          <div className="footer-links">
            <NavLink to="/fixtures">Fixtures</NavLink>
            <NavLink to="/teams">Teams</NavLink>
            <NavLink to="/players">Players</NavLink>
            <NavLink to="/predictions">Predictions</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}