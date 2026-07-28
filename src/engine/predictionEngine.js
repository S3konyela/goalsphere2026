// Poisson-based match outcome prediction engine
// Competition-agnostic, venue-aware

// League IDs that always use neutral venues (no home advantage)
const NEUTRAL_VENUE_LEAGUES = new Set([
  1,    // FIFA World Cup
  4,    // UEFA European Championship
  9,    // Copa América
  10,   // UEFA Nations League (finals)
  960,  // AFC Asian Cup
]);

const BASE_GOALS    = 1.3;  // avg goals per team per game at top international/club level
const HOME_ADV      = 1.20; // home team's expected goals multiplied by this when venue = 'home'

// attack: goals scored per game relative to average opponent (1.0 = average)
// defense: inverse of goals conceded — higher means fewer goals allowed (1.0 = average)
const TEAM_RATINGS = {
  // ── National teams ──────────────────────────────────────────────────
  'France':            { attack: 1.75, defense: 1.55 },
  'Brazil':            { attack: 1.65, defense: 1.50 },
  'Argentina':         { attack: 1.65, defense: 1.45 },
  'England':           { attack: 1.55, defense: 1.35 },
  'Spain':             { attack: 1.65, defense: 1.50 },
  'Germany':           { attack: 1.50, defense: 1.35 },
  'Netherlands':       { attack: 1.45, defense: 1.40 },
  'Portugal':          { attack: 1.55, defense: 1.25 },
  'Belgium':           { attack: 1.45, defense: 1.30 },
  'Croatia':           { attack: 1.30, defense: 1.40 },
  'Italy':             { attack: 1.25, defense: 1.55 },
  'Uruguay':           { attack: 1.30, defense: 1.35 },
  'Colombia':          { attack: 1.30, defense: 1.25 },
  'Denmark':           { attack: 1.20, defense: 1.25 },
  'Switzerland':       { attack: 1.15, defense: 1.30 },
  'Austria':           { attack: 1.20, defense: 1.20 },
  'Serbia':            { attack: 1.20, defense: 1.15 },
  'Poland':            { attack: 1.15, defense: 1.15 },
  'Turkey':            { attack: 1.15, defense: 1.10 },
  'Ukraine':           { attack: 1.15, defense: 1.15 },
  'Morocco':           { attack: 1.20, defense: 1.35 },
  'Senegal':           { attack: 1.20, defense: 1.25 },
  'Japan':             { attack: 1.20, defense: 1.20 },
  'South Korea':       { attack: 1.15, defense: 1.15 },
  'United States':     { attack: 1.15, defense: 1.20 },
  'Mexico':            { attack: 1.20, defense: 1.15 },
  'Canada':            { attack: 1.10, defense: 1.15 },
  'Ecuador':           { attack: 1.10, defense: 1.10 },
  'Ghana':             { attack: 1.10, defense: 1.05 },
  "Côte d'Ivoire":     { attack: 1.15, defense: 1.10 },
  'Ivory Coast':       { attack: 1.15, defense: 1.10 },
  'Egypt':             { attack: 1.10, defense: 1.10 },
  'Nigeria':           { attack: 1.15, defense: 1.05 },
  'Algeria':           { attack: 1.05, defense: 1.10 },
  'Cameroon':          { attack: 1.05, defense: 1.00 },
  'Tunisia':           { attack: 1.00, defense: 1.10 },
  'Iran':              { attack: 1.00, defense: 1.15 },
  'Saudi Arabia':      { attack: 1.00, defense: 1.05 },
  'Australia':         { attack: 1.05, defense: 1.05 },
  'Qatar':             { attack: 0.90, defense: 0.95 },
  // ── Club teams — UEFA coefficient–calibrated ─────────────────────
  'Manchester City':       { attack: 1.90, defense: 1.70 },
  'Real Madrid':           { attack: 1.85, defense: 1.65 },
  'Barcelona':             { attack: 1.80, defense: 1.55 },
  'Bayern Munich':         { attack: 1.80, defense: 1.60 },
  'Paris Saint-Germain':   { attack: 1.75, defense: 1.55 },
  'Paris Saint Germain':   { attack: 1.75, defense: 1.55 },
  'Liverpool':             { attack: 1.75, defense: 1.60 },
  'Arsenal':               { attack: 1.65, defense: 1.55 },
  'Chelsea':               { attack: 1.55, defense: 1.50 },
  'Manchester United':     { attack: 1.50, defense: 1.40 },
  'Inter':                 { attack: 1.65, defense: 1.60 },
  'Juventus':              { attack: 1.45, defense: 1.50 },
  'AC Milan':              { attack: 1.55, defense: 1.50 },
  'Atletico Madrid':       { attack: 1.50, defense: 1.65 },
  'Atlético Madrid':       { attack: 1.50, defense: 1.65 },
  'Borussia Dortmund':     { attack: 1.60, defense: 1.40 },
  'Bayer Leverkusen':      { attack: 1.65, defense: 1.55 },
  'Napoli':                { attack: 1.50, defense: 1.45 },
  'Ajax':                  { attack: 1.55, defense: 1.40 },
  'Porto':                 { attack: 1.45, defense: 1.45 },
  'Benfica':               { attack: 1.50, defense: 1.40 },
  'PSV Eindhoven':         { attack: 1.55, defense: 1.45 },
  'Tottenham':             { attack: 1.50, defense: 1.30 },
  'Tottenham Hotspur':     { attack: 1.50, defense: 1.30 },
  'Aston Villa':           { attack: 1.45, defense: 1.35 },
  'Newcastle United':      { attack: 1.45, defense: 1.40 },
  'Roma':                  { attack: 1.45, defense: 1.40 },
  'Lazio':                 { attack: 1.40, defense: 1.35 },
  'Fiorentina':            { attack: 1.35, defense: 1.30 },
  'RB Leipzig':            { attack: 1.55, defense: 1.45 },
  'Sevilla':               { attack: 1.40, defense: 1.40 },
  'Real Sociedad':         { attack: 1.35, defense: 1.35 },
  'Villarreal':            { attack: 1.35, defense: 1.30 },
  'Monaco':                { attack: 1.45, defense: 1.35 },
  'Marseille':             { attack: 1.40, defense: 1.30 },
  'Lyon':                  { attack: 1.35, defense: 1.25 },
};

const DEFAULT_RATING  = { attack: 1.0, defense: 1.0 };
const LIVE_FORM_WEIGHT = 0.70; // blend: 70% real recent form, 30% static prior
const FINISHED_STATUS  = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

function factorial(n) {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function poissonPmf(lambda, k) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

/**
 * Compute a team's attack/defense rating from their last N finished fixtures.
 * Blends the live result with the static prior to smooth small-sample noise.
 *
 * @param {object[]} fixtures  Raw API fixture objects
 * @param {number}   teamId   The team whose perspective to compute from
 * @param {string}   teamName Used to look up static prior if live data is sparse
 */
export function computeRatingFromFixtures(fixtures, teamId, teamName) {
  const finished = fixtures.filter(f => FINISHED_STATUS.has(f.fixture?.status?.short));
  if (!finished.length) return TEAM_RATINGS[teamName] ?? DEFAULT_RATING;

  let totalScored = 0, totalConceded = 0;
  finished.forEach(f => {
    const isHome    = f.teams.home.id === teamId;
    totalScored    += isHome ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
    totalConceded  += isHome ? (f.goals.away ?? 0) : (f.goals.home ?? 0);
  });

  const n = finished.length;
  const avgScored   = totalScored   / n;
  const avgConceded = totalConceded / n;

  const liveRating = {
    attack:  Math.min(3.0, Math.max(0.3, avgScored / BASE_GOALS)),
    defense: avgConceded > 0
      ? Math.min(3.0, Math.max(0.3, BASE_GOALS / avgConceded))
      : 2.5,
  };

  // Blend live form with static prior (regression to the mean with small samples)
  const prior = TEAM_RATINGS[teamName] ?? DEFAULT_RATING;
  return {
    attack:  +(LIVE_FORM_WEIGHT * liveRating.attack  + (1 - LIVE_FORM_WEIGHT) * prior.attack ).toFixed(3),
    defense: +(LIVE_FORM_WEIGHT * liveRating.defense + (1 - LIVE_FORM_WEIGHT) * prior.defense).toFixed(3),
    games:   n,
  };
}

/**
 * Determine venue mode from priority order:
 * 1. Explicit options.venueMode
 * 2. League ID in known neutral-venue set
 * 3. Default to 'home'
 */
export function detectVenueMode(fixture, options = {}) {
  if (options.venueMode) return options.venueMode;
  if (fixture?.league?.id && NEUTRAL_VENUE_LEAGUES.has(Number(fixture.league.id))) {
    return 'neutral';
  }
  return 'home';
}

/**
 * Predict match outcome using Poisson distribution.
 *
 * @param {string} homeTeamName  - Home team name as returned by API
 * @param {string} awayTeamName  - Away team name as returned by API
 * @param {object} options
 * @param {'home'|'away'|'neutral'} [options.venueMode='home']
 * @param {object} [options.homeRating]  - Live-computed rating, overrides static table
 * @param {object} [options.awayRating]  - Live-computed rating, overrides static table
 * @returns {{ predicted, lambda, probabilities, confidence, venueMode, dataSource }}
 */
export function getPrediction(homeTeamName, awayTeamName, options = {}) {
  const venueMode   = options.venueMode ?? 'home';
  const homeRating  = options.homeRating ?? TEAM_RATINGS[homeTeamName] ?? DEFAULT_RATING;
  const awayRating  = options.awayRating ?? TEAM_RATINGS[awayTeamName] ?? DEFAULT_RATING;
  const dataSource  = (options.homeRating && options.awayRating) ? 'live' : 'static';
  const homeAdv     = venueMode === 'home' ? HOME_ADV : 1.0;

  // Expected goals per team
  const lambda_h = BASE_GOALS * homeRating.attack * (1 / awayRating.defense) * homeAdv;
  const lambda_a = BASE_GOALS * awayRating.attack * (1 / homeRating.defense);

  const MAX_GOALS = 7;
  let homeWin = 0, draw = 0, awayWin = 0;
  const scorelines = [];

  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = poissonPmf(lambda_h, h) * poissonPmf(lambda_a, a);
      scorelines.push({ h, a, p });
      if (h > a)      homeWin += p;
      else if (h === a) draw  += p;
      else            awayWin += p;
    }
  }

  scorelines.sort((x, y) => y.p - x.p);
  const best = scorelines[0];

  // Rough confidence: ratio of top scoreline probability over 2nd most likely
  const confidence = scorelines.length > 1
    ? Math.min(100, Math.round((best.p / scorelines[1].p) * 50))
    : 50;

  const total = homeWin + draw + awayWin;
  return {
    predicted: { home: best.h, away: best.a },
    lambda:    { home: +(lambda_h.toFixed(1)), away: +(lambda_a.toFixed(1)) },
    probabilities: {
      homeWin: Math.round((homeWin / total) * 100),
      draw:    Math.round((draw    / total) * 100),
      awayWin: Math.round((awayWin / total) * 100),
    },
    confidence,
    venueMode,
    dataSource,
  };
}
