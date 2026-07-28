import axios from 'axios';

const api = axios.create({
  baseURL: '/api-football',
});

const LEAGUE = 1;      // FIFA World Cup
const SEASON = 2022;   // Qatar 2022 — API-Football has no 2026 fixtures yet

// ── normalise API-Football fixture → shape Calendar.jsx expects ───────────────
function normalise(item) {
  const { fixture, league, teams, goals, score } = item;

  // Map API-Football status short codes to football-data.org style strings
  const statusMap = {
    'NS':  'SCHEDULED',
    'TBD': 'SCHEDULED',
    '1H':  'IN_PLAY',
    'HT':  'PAUSED',
    '2H':  'IN_PLAY',
    'ET':  'IN_PLAY',
    'BT':  'PAUSED',
    'P':   'IN_PLAY',
    'SUSP':'POSTPONED',
    'INT': 'PAUSED',
    'FT':  'FINISHED',
    'AET': 'FINISHED',
    'PEN': 'FINISHED',
    'PST': 'POSTPONED',
    'CANC':'CANCELLED',
    'ABD': 'CANCELLED',
    'AWD': 'FINISHED',
    'WO':  'FINISHED',
    'LIVE':'IN_PLAY',
  };

  // Map round string to stage code
  function roundToStage(round) {
    if (!round) return 'GROUP_STAGE';
    const r = round.toUpperCase();
    if (r.includes('GROUP')) return 'GROUP_STAGE';
    if (r.includes('ROUND OF 32') || r.includes('3RD ROUND')) return 'ROUND_OF_32';
    if (r.includes('ROUND OF 16') || r.includes('2ND ROUND')) return 'ROUND_OF_16';
    if (r.includes('QUARTER')) return 'QUARTER_FINALS';
    if (r.includes('SEMI')) return 'SEMI_FINALS';
    if (r.includes('FINAL')) return 'FINAL';
    return 'GROUP_STAGE';
  }

  // Extract group letter from round string e.g. "Group Stage - 1" or "Group A"
  function extractGroup(round) {
    if (!round) return null;
    const match = round.match(/Group\s+([A-L])/i);
    return match ? `GROUP_${match[1].toUpperCase()}` : null;
  }

  const statusShort = fixture?.status?.short || 'NS';
  const stage = roundToStage(league?.round);
  const group = extractGroup(league?.round);

  return {
    id:        fixture.id,
    utcDate:   fixture.date,
    status:    statusMap[statusShort] || 'SCHEDULED',
    matchday:  league?.round?.match(/\d+/)?.[0] || null,
    stage,
    group,
    venue:     fixture.venue?.name || null,
    homeTeam:  { id: teams.home.id, name: teams.home.name },
    awayTeam:  { id: teams.away.id, name: teams.away.name },
    score: {
      fullTime: {
        home: goals?.home ?? null,
        away: goals?.away ?? null,
      },
      halfTime: {
        home: score?.halftime?.home ?? null,
        away: score?.halftime?.away ?? null,
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

// Raw shape for Fixtures.jsx — preserves fixture/teams/goals/league structure
export async function getWCMatchesRaw() {
  const response = await api.get('/fixtures', {
    params: { league: LEAGUE, season: SEASON },
  });
  return response.data.response || [];
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
  return response.data.response?.[0]?.league?.standings || [];
}

export async function getWCTeams() {
  const response = await api.get('/teams', {
    params: { league: LEAGUE, season: SEASON },
  });
  return (response.data.response || []).map(t => t.team);
}

export async function getWCScorers() {
  const response = await api.get('/players/topscorers', {
    params: { league: LEAGUE, season: SEASON },
  });
  return response.data.response || [];
}

export async function getMatch(id) {
  const response = await api.get('/fixtures', {
    params: { id },
  });
  const item = response.data.response?.[0];
  return item ? normalise(item) : null;
}

// Returns the raw fixture object (preserves fixture/teams/goals/league shape)
export async function getMatchRaw(id) {
  const response = await api.get('/fixtures', { params: { id } });
  return response.data.response?.[0] ?? null;
}

export async function getFixtureEvents(id) {
  const response = await api.get('/fixtures/events', { params: { fixture: id } });
  return response.data.response || [];
}

export async function getFixtureStats(id) {
  const response = await api.get('/fixtures/statistics', { params: { fixture: id } });
  return response.data.response || [];
}

export async function getH2H(idA, idB, last = 5) {
  const response = await api.get('/fixtures/headtohead', {
    params: { h2h: `${idA}-${idB}`, last },
  });
  return response.data.response || [];
}

// ── Live & date-based endpoints (multi-league) ────────────────────────────────

export async function getLiveFixtures() {
  const response = await api.get('/fixtures', { params: { live: 'all' } });
  return response.data.response || [];
}

export async function getFixturesByDate(date) {
  // date: 'YYYY-MM-DD'
  const response = await api.get('/fixtures', { params: { date } });
  return response.data.response || [];
}

// Last N finished results for a team — used for live form ratings
export async function getTeamRecentFixtures(teamId, last = 5) {
  const response = await api.get('/fixtures', { params: { team: teamId, last } });
  return response.data.response || [];
}