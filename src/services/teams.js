// src/services/teams.js
// Mock data base + live FIFA rankings overlay from API-Football

import { TEAMS, getTeamBySlug } from '../data/teams.js';
import { API_FOOTBALL_IDS } from '../data/apiFootballIds.js';
import { fetchFIFARankings } from './apiFootball.js';

// Build reverse map: apiFootballId -> slug
const API_ID_TO_SLUG = Object.fromEntries(
  Object.entries(API_FOOTBALL_IDS).map(([slug, id]) => [id, slug])
);

// Attach apiFootballId to every team at startup
const TEAMS_WITH_API_IDS = TEAMS.map(t => ({
  ...t,
  apiFootballId: API_FOOTBALL_IDS[t.slug] ?? null,
}));

// ── fetchTeams ─────────────────────────────────────────────────────────────
// Returns all 48 teams. Tries to overlay live FIFA rankings; falls back to
// mock rankings silently if the API call fails.
export async function fetchTeams() {
  try {
    const rankMap = await fetchFIFARankings(); // Map<apiTeamId, rank>
    return TEAMS_WITH_API_IDS.map(t => {
      const liveRank = t.apiFootballId ? rankMap.get(t.apiFootballId) : null;
      return liveRank != null ? { ...t, ranking: liveRank, rankingLive: true } : t;
    });
  } catch {
    // API unavailable — return mock data unchanged
    return TEAMS_WITH_API_IDS;
  }
}

// ── fetchTeamBySlug ────────────────────────────────────────────────────────
export async function fetchTeamBySlug(slug) {
  const base = getTeamBySlug(slug);
  if (!base) throw new Error(`Team "${slug}" not found`);
  return {
    ...base,
    apiFootballId: API_FOOTBALL_IDS[slug] ?? null,
  };
}