import axios from 'axios';

const api = axios.create({
  baseURL: '/api-fd',
});

export const LEAGUES = [
  { code: 'PL', name: 'Premier League', country: 'England' },
  { code: 'PD', name: 'La Liga', country: 'Spain' },
  { code: 'SA', name: 'Serie A', country: 'Italy' },
  { code: 'BL1', name: 'Bundesliga', country: 'Germany' },
  { code: 'FL1', name: 'Ligue 1', country: 'France' },
];

export function getLeagueByCode(code) {
  return LEAGUES.find(l => l.code === code.toUpperCase());
}

export async function getLeagueStandings(code) {
  const response = await api.get(`/competitions/${code}/standings`);
  const table = response.data.standings?.find(s => s.type === 'TOTAL')?.table || [];
  return table.map(row => ({
    position: row.position,
    team: { id: row.team.id, name: row.team.name, crest: row.team.crest },
    played: row.playedGames,
    won: row.won,
    draw: row.draw,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    form: row.form,
  }));
}

export async function getLeagueMatches(code, status) {
  const response = await api.get(`/competitions/${code}/matches`, {
    params: status ? { status } : undefined,
  });
  return (response.data.matches || []).map(m => ({
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    matchday: m.matchday,
    homeTeam: { id: m.homeTeam?.id, name: m.homeTeam?.name || 'TBD', crest: m.homeTeam?.crest },
    awayTeam: { id: m.awayTeam?.id, name: m.awayTeam?.name || 'TBD', crest: m.awayTeam?.crest },
    score: {
      fullTime: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
    },
  }));
}
