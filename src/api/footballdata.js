import axios from 'axios';

const api = axios.create({
  baseURL: '/api-fd',
});

const STAGE_MAP = {
  LAST_32: 'ROUND_OF_32',
  LAST_16: 'ROUND_OF_16',
};

function normaliseStage(stage) {
  return STAGE_MAP[stage] || stage || 'GROUP_STAGE';
}

function normalise(item) {
  return {
    id: item.id,
    utcDate: item.utcDate,
    status: item.status === 'TIMED' ? 'SCHEDULED' : item.status,
    matchday: item.matchday ?? null,
    stage: normaliseStage(item.stage),
    group: item.group || null,
    venue: item.venue || null,
    homeTeam: { id: item.homeTeam?.id, name: item.homeTeam?.name || 'TBD' },
    awayTeam: { id: item.awayTeam?.id, name: item.awayTeam?.name || 'TBD' },
    score: {
      fullTime: {
        home: item.score?.fullTime?.home ?? null,
        away: item.score?.fullTime?.away ?? null,
      },
      halfTime: {
        home: item.score?.halfTime?.home ?? null,
        away: item.score?.halfTime?.away ?? null,
      },
    },
  };
}

export async function getWCMatches() {
  const response = await api.get('/competitions/WC/matches');
  return (response.data.matches || []).map(normalise);
}
