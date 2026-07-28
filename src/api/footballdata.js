import axios from 'axios';

const api = axios.create({
  baseURL: '/api-kickoff/api/v1',
});

const LEAGUE = 1;
const SEASON = 2026;

function normalise(item) {
  const statusMap = {
    'NS':  'SCHEDULED', 'TBD': 'SCHEDULED',
    '1H':  'IN_PLAY',   '2H':  'IN_PLAY',
    'HT':  'PAUSED',    'BT':  'PAUSED',   'INT': 'PAUSED',
    'ET':  'IN_PLAY',   'P':   'IN_PLAY',  'LIVE': 'IN_PLAY',
    'FT':  'FINISHED',  'AET': 'FINISHED', 'PEN': 'FINISHED',
    'AWD': 'FINISHED',  'WO':  'FINISHED',
    'PST': 'POSTPONED', 'SUSP':'POSTPONED',
    'CANC':'CANCELLED', 'ABD': 'CANCELLED',
  };

  return {
    id:       item.id,
    utcDate:  item.date,
    status:   statusMap[item.statusShort] || 'SCHEDULED',
    matchday: null,
    stage:    'GROUP_STAGE',
    group:    null,
    venue:    item.venue?.name || null,
    homeTeam: { id: item.homeTeam?.id, name: item.homeTeam?.name || 'TBD' },
    awayTeam: { id: item.awayTeam?.id, name: item.awayTeam?.name || 'TBD' },
    score: {
      fullTime: {
        home: item.goalsHome ?? null,
        away: item.goalsAway ?? null,
      },
      halfTime: {
        home: item.scoreHalfHome ?? null,
        away: item.scoreHalfAway ?? null,
      },
    },
  };
}

export async function getWCMatches() {
  const response = await api.get('/fixtures', {
    params: { league: LEAGUE, season: SEASON },
  });
  return (response.data.response || []).map(normalise);
}

export async function getWCMatchesByRound(round) {
  const response = await api.get('/fixtures', {
    params: { league: LEAGUE, season: SEASON, round },
  });
  return (response.data.response || []).map(normalise);
}

export async function getWCStandings() {
  const response = await api.get('/standings', {
    params: { league: LEAGUE, season: SEASON },
  });
  return response.data.response || [];
}

export async function getWCTeams() {
  const response = await api.get('/teams', {
    params: { league: LEAGUE, season: SEASON },
  });
  return response.data.response || [];
}

export async function getWCScorers() {
  const response = await api.get('/topscorers', {
    params: { league: LEAGUE, season: SEASON },
  });
  return response.data.response || [];
}

export async function getMatch(id) {
  const response = await api.get('/fixtures', { params: { id } });
  const item = response.data.response?.[0];
  return item ? normalise(item) : null;
}