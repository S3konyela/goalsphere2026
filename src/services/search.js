import { fetchArticles } from './articles.js';
import { fetchPlayers } from './players.js';
import { fetchTeams } from './teams.js';
import { getWCMatches } from '../api/football.js';

export async function searchSite(query) {
  const normalized = query.trim().toLowerCase();
  const [articles, teams, players, fixtures] = await Promise.all([
    fetchArticles().catch(() => []),
    fetchTeams().catch(() => []),
    fetchPlayers().catch(() => []),
    getWCMatches().catch(() => []),
  ]);

  const matchesText = (value) => value?.toLowerCase().includes(normalized);

  return {
    articles: articles.filter((article) =>
      matchesText(article.title) || matchesText(article.excerpt) || matchesText(article.slug)
    ),
    teams: teams.filter((team) =>
      matchesText(team.name) || matchesText(team.country) || matchesText(team.slug)
    ),
    players: players.filter((player) =>
      matchesText(player.name) || matchesText(player.club) || matchesText(player.country) || matchesText(player.position)
    ),
    fixtures: fixtures.filter((fixture) =>
      matchesText(fixture.teams.home.name) || matchesText(fixture.teams.away.name) || matchesText(fixture.league.name)
    ),
  };
}
