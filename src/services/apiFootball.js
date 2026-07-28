// src/services/apiFootball.js
// Live data layer — wraps API-Football v3 via Vite proxy
// Vite proxy config required (see vite.config.js snippet below)

const BASE = '/api-football';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(Object.values(json.errors)[0]);
  }
  return json.response;
}

// ── FIFA Rankings ─────────────────────────────────────────────────────────
// Returns Map<apiTeamId, rank> so teams.js can merge by apiFootballId
export async function fetchFIFARankings() {
  // API-Football uses league=1 for FIFA World Rankings
  const data = await apiFetch('/standings?league=1&season=2024');
  const standings = data?.[0]?.league?.standings?.[0] ?? [];
  const map = new Map();
  standings.forEach(s => map.set(s.team.id, s.rank));
  return map; // Map<apiTeamId, rank>
}

// ── Team Fixtures ─────────────────────────────────────────────────────────
export async function fetchTeamFixtures(apiFootballId, { next = 5, last = 5 } = {}) {
  const [upcoming, recent] = await Promise.allSettled([
    apiFetch(`/fixtures?team=${apiFootballId}&next=${next}`),
    apiFetch(`/fixtures?team=${apiFootballId}&last=${last}`),
  ]);
  return {
    upcoming: upcoming.status === 'fulfilled' ? normaliseFixtures(upcoming.value) : [],
    recent:   recent.status === 'fulfilled'   ? normaliseFixtures(recent.value)   : [],
  };
}

function normaliseFixtures(raw = []) {
  return raw.map(f => ({
    id:         f.fixture.id,
    date:       f.fixture.date,
    venue:      f.fixture.venue?.name ?? null,
    status:     f.fixture.status?.short ?? 'NS',
    statusLong: f.fixture.status?.long  ?? 'Not Started',
    elapsed:    f.fixture.status?.elapsed ?? null,
    league: {
      id:    f.league.id,
      name:  f.league.name,
      logo:  f.league.logo,
      round: f.league.round,
    },
    home: {
      id:     f.teams.home.id,
      name:   f.teams.home.name,
      logo:   f.teams.home.logo,
      winner: f.teams.home.winner,
    },
    away: {
      id:     f.teams.away.id,
      name:   f.teams.away.name,
      logo:   f.teams.away.logo,
      winner: f.teams.away.winner,
    },
    score: {
      home: f.goals.home,
      away: f.goals.away,
    },
  }));
}

// ── Player Stats ──────────────────────────────────────────────────────────
// Returns live 2025/26 season stats merged over mock bio
export async function fetchPlayerStats(apiFootballPlayerId, season = 2025) {
  const data = await apiFetch(`/players?id=${apiFootballPlayerId}&season=${season}`);
  const entry = data?.[0];
  if (!entry) return null;

  // Sum across all clubs/leagues that season
  const totals = (entry.statistics ?? []).reduce((acc, s) => {
    acc.appearances  += s.games?.appearences ?? 0; // API typo: appearences
    acc.goals        += s.goals?.total       ?? 0;
    acc.assists      += s.goals?.assists      ?? 0;
    acc.yellowCards  += s.cards?.yellow       ?? 0;
    acc.redCards     += s.cards?.red          ?? 0;
    acc.minutesPlayed += s.games?.minutes     ?? 0;
    return acc;
  }, { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 });

  return {
    photo: entry.player.photo ?? null,
    stats: totals,
  };
}