// src/data/apiFootballIds.js
// Verified API-Football v3 national team IDs
// null = unconfirmed, service will skip live fetch and use mock data

export const API_FOOTBALL_IDS = {
  // UEFA
  'france':       2,
  'england':      10,
  'spain':        9,
  'germany':      25,
  'portugal':     27,
  'netherlands':  1118,
  'belgium':      1,
  'croatia':      3,
  'italy':        768,
  'denmark':      21,
  'switzerland':  15,
  'austria':      775,
  'serbia':       14,
  'poland':       24,
  'turkey':       777,
  'ukraine':      772,
  // CONMEBOL
  'brazil':       6,
  'argentina':    26,
  'uruguay':      17,
  'colombia':     31,
  'ecuador':      730,
  'chile':        7,
  'venezuela':    35,
  // CONCACAF
  'usa':          18,
  'mexico':       16,
  'canada':       769,
  'costa-rica':   32,
  'jamaica':      771,
  'panama':       786,
  // CAF
  'morocco':      744,
  'senegal':      796,
  'nigeria':      34,
  'cameroon':     779,
  'ghana':        778,
  'ivory-coast':  788,
  'egypt':        29,
  'algeria':      776,
  'south-africa': 782,
  // AFC
  'japan':        28,
  'south-korea':  149,
  'iran':         796,
  'saudi-arabia': 785,
  'australia':    25,
  'qatar':        10782,
  'uzbekistan':   null,
  'iraq':         789,
  'indonesia':    null,
  // OFC
  'new-zealand':  783,
};

// API-Football player IDs → maps our mock player IDs to live API player IDs
// Verified via direct squad/profile API queries. null = unverified, shows letter avatar.
export const API_FOOTBALL_PLAYER_IDS = {
  // ── Verified ✓ ────────────────────────────────────────────────────────────
  109:  278,      // Kylian Mbappé        (France WC2022 squad)
  108:  56,       // Antoine Griezmann    (France WC2022 squad) — was 1467=Lacazette
  209:  184,      // Harry Kane           (England WC2022 squad)
  207:  129718,   // Jude Bellingham      (England WC2022 squad) — was 1466=John-Jules
  509:  874,      // Cristiano Ronaldo    (profiles endpoint)
  507:  1485,     // Bruno Fernandes      (profiles endpoint) — was 19218
  603:  290,      // Virgil van Dijk      (Netherlands WC2022 squad) — was 306=Salah
  806:  754,      // Luka Modrić          (Croatia WC2022 squad) — was 496=Hoffmann
  1709: 762,      // Vinícius Jr.         (Brazil WC2022 squad p2) — was 750=Fidalgo
  1701: 280,      // Alisson              (Brazil WC2022 squad p2) — was 1455=Iwobi
  1809: 154,      // Lionel Messi         (profiles endpoint)
  3509: 306,      // Mohamed Salah        (profiles endpoint)

  // ── Unverified — API limit reached, set null to avoid wrong photos ────────
  309:  null,     // Lamine Yamal         (not at WC 2022, need 2024 data)
  306:  null,     // Rodri                (Spain squad query failed)
  408:  null,     // Florian Wirtz        (not at WC 2022, need 2024 data)
  708:  null,     // Kevin De Bruyne      (627=Kyle Walker, real ID unknown)
  901:  null,     // Gianluigi Donnarumma (Italy not at WC 2022, 1923=Jackers)
  1807: null,     // Enzo Fernández       (284034=B.Risso, real ID unknown)
  1909: null,     // Darwin Núñez         (47066=Á.Vázquez, real ID unknown)
  2010: null,     // Luis Díaz            (1095=X.Schlager, real ID unknown)
  2309: null,     // Christian Pulisic    (1228=P.Kovář, real ID unknown)
  2509: null,     // Alphonso Davies      (182459=Al Saqri, real ID unknown)
  2902: null,     // Achraf Hakimi        (47036=F.Tienza, real ID unknown)
  3008: null,     // Sadio Mané           (276=Neymar, real ID unknown)
  3109: null,     // Victor Osimhen       (1485 moved to Bruno Fernandes)
  3811: null,     // Kaoru Mitoma         (unverified)
  3808: null,     // Takefusa Kubo        (was duplicate of Wirtz)
  3906: null,     // Son Heung-min        (2285=A.Rüdiger, real ID unknown)
  4009: null,     // Mehdi Taremi         (18846=Wan-Bissaka, real ID unknown)
  4206: null,     // Aaron Mooy           (2897=Kim Min-Jae, real ID unknown)
};