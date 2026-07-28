// src/data/flagCodes.js
// ISO 3166-1 alpha-2 country codes for flagcdn.com
// Usage: https://flagcdn.com/w80/{code}.png

export const FLAG_CODES = {
  'france':       'fr',
  'england':      'gb-eng',
  'spain':        'es',
  'germany':      'de',
  'portugal':     'pt',
  'netherlands':  'nl',
  'belgium':      'be',
  'croatia':      'hr',
  'italy':        'it',
  'denmark':      'dk',
  'switzerland':  'ch',
  'austria':      'at',
  'serbia':       'rs',
  'poland':       'pl',
  'turkey':       'tr',
  'ukraine':      'ua',
  'brazil':       'br',
  'argentina':    'ar',
  'uruguay':      'uy',
  'colombia':     'co',
  'ecuador':      'ec',
  'chile':        'cl',
  'venezuela':    've',
  'usa':          'us',
  'mexico':       'mx',
  'canada':       'ca',
  'costa-rica':   'cr',
  'jamaica':      'jm',
  'panama':       'pa',
  'morocco':      'ma',
  'senegal':      'sn',
  'nigeria':      'ng',
  'cameroon':     'cm',
  'ghana':        'gh',
  'ivory-coast':  'ci',
  'egypt':        'eg',
  'algeria':      'dz',
  'south-africa': 'za',
  'japan':        'jp',
  'south-korea':  'kr',
  'iran':         'ir',
  'saudi-arabia': 'sa',
  'australia':    'au',
  'qatar':        'qa',
  'uzbekistan':   'uz',
  'iraq':         'iq',
  'indonesia':    'id',
  'new-zealand':  'nz',
};

export function getFlagUrl(slug, size = 80) {
  const code = FLAG_CODES[slug];
  if (!code) return null;
  return `https://flagcdn.com/w${size}/${code}.png`;
}

export function getPlayerPhotoUrl(apiFootballPlayerId) {
  if (!apiFootballPlayerId) return null;
  return `https://media.api-sports.io/football/players/${apiFootballPlayerId}.png`;
}