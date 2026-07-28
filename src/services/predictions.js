import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { getMatchRaw } from '../api/football.js';

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

const fallbackPredictions = [
  {
    id: 'sample-1',
    user_name: 'Alex',
    match_id: '1',
    match_label: 'Brazil vs Germany',
    home_score: 2,
    away_score: 1,
    points: 3,
    created_at: '2026-06-18T12:00:00.000Z',
  },
  {
    id: 'sample-2',
    user_name: 'Jordan',
    match_id: '2',
    match_label: 'France vs Argentina',
    home_score: 1,
    away_score: 1,
    points: 1,
    created_at: '2026-06-18T14:00:00.000Z',
  },
];

const fallbackLeaderboard = [
  { user_name: 'Alex', points: 3 },
  { user_name: 'Jordan', points: 1 },
  { user_name: 'Taylor', points: 0 },
];

export async function fetchPredictions() {
  if (!isSupabaseConfigured) {
    return fallbackPredictions;
  }

  const { data, error } = await supabase.from('predictions').select('id, user_name, match_id, match_label, home_score, away_score, points, created_at').order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function createPrediction(prediction) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to save predictions.');
  }

  const { data, error } = await supabase
    .from('predictions')
    .insert([{ ...prediction, points: 0 }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// ── Auto-scoring ──────────────────────────────────────────────────────────────
// Works for any competition — looks up each fixture's result directly by ID.
// Returns { scored, skipped, errors } summary.
export async function scoreAllPredictions() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data: preds, error } = await supabase
    .from('predictions')
    .select('id, match_id, home_score, away_score, points');
  if (error) throw new Error(error.message);

  const allPreds = preds ?? [];
  if (!allPreds.length) return { scored: 0, skipped: 0, errors: 0 };

  // Fetch each unique fixture's result (parallel, one API call per unique match)
  const uniqueIds = [...new Set(allPreds.map(p => String(p.match_id)))];
  const resultMap = {};
  await Promise.all(
    uniqueIds.map(async id => {
      try {
        const raw = await getMatchRaw(id);
        if (!raw) return;
        if (!FINISHED_STATUSES.has(raw.fixture?.status?.short)) return;
        const h = raw.goals?.home;
        const a = raw.goals?.away;
        if (h === null || h === undefined || a === null || a === undefined) return;
        resultMap[id] = { home: h, away: a };
      } catch { /* fixture unavailable — skip */ }
    })
  );

  let scored = 0, skipped = 0, errors = 0;

  for (const pred of allPreds) {
    const result = resultMap[String(pred.match_id)];
    if (!result) { skipped++; continue; }

    let pts = 0;
    if (pred.home_score === result.home && pred.away_score === result.away) {
      pts = 3; // exact score
    } else {
      const predOutcome = Math.sign(pred.home_score - pred.away_score);
      const realOutcome = Math.sign(result.home - result.away);
      if (predOutcome === realOutcome) pts = 1; // correct result
    }

    if (pts === pred.points) { skipped++; continue; }

    const { error: upErr } = await supabase
      .from('predictions')
      .update({ points: pts })
      .eq('id', pred.id);

    if (upErr) { errors++; } else { scored++; }
  }

  return { scored, skipped, errors };
}

export async function fetchLeaderboard() {
  if (!isSupabaseConfigured) {
    return fallbackLeaderboard;
  }

  const { data, error } = await supabase.from('predictions').select('user_name, points');
  if (error) {
    throw new Error(error.message);
  }

  const totals = {};
  data.forEach((item) => {
    const name = item.user_name || 'Guest';
    totals[name] = (totals[name] || 0) + (item.points || 0);
  });

  return Object.entries(totals)
    .map(([user_name, points]) => ({ user_name, points }))
    .sort((a, b) => b.points - a.points);
}
