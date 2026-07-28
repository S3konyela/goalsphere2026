// src/services/players.js
// Mock data base + live 2025/26 season stats overlay from API-Football

import { PLAYERS, getPlayerById } from '../data/players.js';
import { API_FOOTBALL_PLAYER_IDS } from '../data/apiFootballIds.js';
import { fetchPlayerStats } from './apiFootball.js';

export async function fetchPlayers() {
  return Promise.resolve(PLAYERS);
}

// ── fetchPlayerById ────────────────────────────────────────────────────────
// Returns mock player + tries to overlay live 2025/26 season stats.
// Falls back to mock stats silently if API is unavailable or player has no API id.
export async function fetchPlayerById(id) {
  const player = getPlayerById(id);
  if (!player) throw new Error(`Player "${id}" not found`);

  const apiId = API_FOOTBALL_PLAYER_IDS[Number(id)] ?? null;
  if (!apiId) return player; // no live ID mapped yet

  try {
    const live = await fetchPlayerStats(apiId, 2025);
    if (!live) return player;
    return {
      ...player,
      photo: live.photo || player.photo,  // prefer live photo
      stats: { ...player.stats, ...live.stats }, // live stats win
      statsLive: true,
    };
  } catch {
    return player; // fall back silently
  }
}