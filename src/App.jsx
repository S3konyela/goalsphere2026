import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Fixtures from './pages/Fixtures.jsx';
import MatchPreview from './pages/MatchPreview.jsx';
import Calendar from './pages/Calendar.jsx';
import Leagues from './pages/Leagues.jsx';
import LeagueDetail from './pages/LeagueDetail.jsx';
import Teams from './pages/Teams.jsx';
import TeamDetail from './pages/TeamDetail.jsx';
import Players from './pages/Players.jsx';
import PlayerDetail from './pages/PlayerDetail.jsx';
import Predictions from './pages/Predictions.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Search from './pages/Search.jsx';
import Compare from './pages/Compare.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="articles" element={<Articles />} />
        <Route path="articles/:slug" element={<ArticleDetail />} />
        <Route path="fixtures" element={<Fixtures />} />
        <Route path="fixtures/:id" element={<MatchPreview />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="leagues" element={<Leagues />} />
        <Route path="leagues/:code" element={<LeagueDetail />} />
        <Route path="teams" element={<Teams />} />
        <Route path="teams/:slug" element={<TeamDetail />} />
        <Route path="players" element={<Players />} />
        <Route path="players/:id" element={<PlayerDetail />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="search" element={<Search />} />
        <Route path="compare" element={<Compare />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
