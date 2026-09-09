import { Player } from './types';

export const DEFAULT_K_FACTOR = 32;
export const DEFAULT_INITIAL_ELO = 1200;

// Traguardi Elo ravvicinati (passi di 25 punti)
export const ELO_THRESHOLDS = [1225, 1250, 1275, 1300, 1325, 1350, 1375, 1400, 1450, 1500];

// Economia LUL Coins & Riunione Bet
export const STARTING_COINS = 200;
export const MATCH_WIN_COINS = 15;
export const MATCH_LOSS_COINS = 10;
export const BAILOUT_AMOUNT = 50;
export const BAILOUT_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 ore
export const PRE_MATCH_BET_CUTOFF = 6; // Chiusura Pre-Match Bet al 6° punto totale

export const REACTION_EMOJIS = ['🔥', '😭', '💩', '🏓', '👑', '🤡', '🍿'];

export const SCORE_PRESETS_11 = [
  { p1: 11, p2: 9, label: '11 - 9' },
  { p1: 11, p2: 8, label: '11 - 8' },
  { p1: 11, p2: 7, label: '11 - 7' },
  { p1: 11, p2: 5, label: '11 - 5' },
  { p1: 11, p2: 3, label: '11 - 3' },
  { p1: 11, p2: 0, label: '11 - 0 (Cappotto)' },
];

export const SCORE_PRESETS_21 = [
  { p1: 21, p2: 19, label: '21 - 19' },
  { p1: 21, p2: 18, label: '21 - 18' },
  { p1: 21, p2: 15, label: '21 - 15' },
  { p1: 21, p2: 12, label: '21 - 12' },
  { p1: 21, p2: 10, label: '21 - 10' },
  { p1: 21, p2: 5, label: '21 - 5' },
];

export const SCORE_PRESETS_SETS = [
  { p1: 2, p2: 1, label: '2 - 1 Set' },
  { p1: 3, p2: 0, label: '3 - 0 Set' },
  { p1: 3, p2: 1, label: '3 - 1 Set' },
  { p1: 3, p2: 2, label: '3 - 2 Set' },
];

export const AVAILABLE_TAGS = [
  '⚡ Re della Schiacciata',
  '🛡️ Il Muro Umano',
  '😭 Scuse Infinite',
  '🌪️ Topspin Fantasma',
  '🐈 Gatto di Marmo',
  '🐢 Velocità Lumaca',
  '🎲 Fa Solo Spigoli',
  '🔥 Macchina da Punti',
  '🧤 Mano di Burro',
  '👑 Campione del Mondo (autoproclamato)',
  '🍕 Gioca Solo per la Pizza',
  '🎯 Cecchino Mancato',
  '💥 Smash nel Soffitto',
  '🧘 Maestro Zen',
];

export const AVAILABLE_EMOJIS = [
  '🏓', '🦁', '🦍', '🥷', '🤡', '⚡', '🔥', '🚀',
  '🤖', '👾', '👑', '🧙‍♂️', '😎', '💀', '🪵', '🦖'
];

export const SAD_LOSER_EXCUSES = [
  '"Oggi il tavolo pendeva clamorosamente a sinistra!"',
  '"La pallina non rimbalzava, era palesemente sgonfia!"',
  '"C\'era un riflesso del neon direttamente nei miei occhi."',
  '"Ho la racchetta con la gomma consumata dal 2012."',
  '"Mi tirava il bicipite femorale destro."',
  '"Non stavo giocando seriamente, stavo solo provando dei colpi."',
  '"La corrente d\'aria della porta mi deviava i top spin."',
  '"Hai fatto almeno 8 retine e 5 spigoli fasulli!"',
  '"Ho mangiato troppo pesante prima di giocare."',
  '"La mia racchetta vibra in modo strano."'
];

// Modificatori Ambientali (Condivisi da entrambi i giocatori)
export interface EnvironmentalModifier {
  id: string;
  label: string;
  icon: string;
  multiplier: number;
  description: string;
}

export const ENVIRONMENTAL_MODIFIERS: EnvironmentalModifier[] = [
  {
    id: 'friendly',
    label: '🤝 Amichevole',
    icon: '🤝',
    multiplier: 0.0,
    description: 'Partita senza punti Elo in palio',
  },
  {
    id: 'wind',
    label: '🌪️ Vento / Corrente',
    icon: '🌪️',
    multiplier: 0.6,
    description: 'Raffiche di vento o corrente della porta (Elo x0.6)',
  },
  {
    id: 'beer',
    label: '🍺 Birra sul Tavolo',
    icon: '🍺',
    multiplier: 0.5,
    description: 'Partita da bar goliardica (Elo x0.5)',
  },
  {
    id: 'food',
    label: '🍕 Post-Pranzo Pesante',
    icon: '🍕',
    multiplier: 0.7,
    description: 'Digestione lenta e palpebre calanti (Elo x0.7)',
  },
  {
    id: 'dark',
    label: '🌙 Scarsa Luce',
    icon: '🌙',
    multiplier: 0.8,
    description: 'Visibilità ridotta e ombre cinesi (Elo x0.8)',
  },
  {
    id: 'derby',
    label: '🔥 Derby Infuocato',
    icon: '🔥',
    multiplier: 1.5,
    description: 'Scontro titanico con posta in palio aumentata (Elo x1.5)',
  },
];

// Modificatori Personali (Asimmetrici per ciascun giocatore)
export interface PersonalModifier {
  id: string;
  label: string;
  icon: string;
  winMult: number; // Bonus se vince con questo handicap
  lossMult: number; // Sconto se perde con questo handicap
  description: string;
}

export const PERSONAL_MODIFIERS: PersonalModifier[] = [
  {
    id: 'own_racket',
    label: '🏓 Racchetta Personale',
    icon: '🏓',
    winMult: 1.0,
    lossMult: 1.0,
    description: 'Attrezzatura ufficiale di fiducia',
  },
  {
    id: 'borrowed_racket',
    label: '🪵 Racchetta Prestata',
    icon: '🪵',
    winMult: 1.3, // Impresa: +30% punti se vince!
    lossMult: 0.7, // Sconfitta attutita: -30% perdita
    description: 'Gomma consumata e manico sconosciuto',
  },
  {
    id: 'beer_in_hand',
    label: '🍻 Birra in Mano',
    icon: '🍻',
    winMult: 1.25,
    lossMult: 0.75,
    description: 'Gioca reggendo il bicchiere pieno',
  },
  {
    id: 'injured',
    label: '🩹 Acciaccato / Schiena',
    icon: '🩹',
    winMult: 1.2,
    lossMult: 0.8,
    description: 'Dolori articolari e scuse preventive',
  },
];

// Libreria di GIF e Meme Curata
export interface MemeGif {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const DEFAULT_LEAGUE_ID = 'elopingpong_room_1';
export const DEFAULT_LEAGUE_NAME = 'Arena Elo Ping Pong';
export const DEFAULT_LEAGUE_CODE = 'PONG26';

export const GIF_CATEGORIES = [
  { id: 'all', label: '🔥 Tutte / Trend', emoji: '🔥' },
  { id: 'celebration', label: '🏆 Vittoria', emoji: '🏆' },
  { id: 'meme', label: '🤡 Meme & Sfottò', emoji: '🤡' },
  { id: 'pingpong', label: '🏓 Ping Pong', emoji: '🏓' },
  { id: 'rage', label: '🤬 Rage & Tavolo', emoji: '🤬' },
  { id: 'crying', label: '😭 Pianto', emoji: '😭' },
  { id: 'popcorn', label: '🍿 Popcorn', emoji: '🍿' },
  { id: 'dance', label: '🕺 Danza', emoji: '🕺' },
];

export const MEME_GIFS: MemeGif[] = [
  // Vittoria & Celebrazione
  {
    id: 'cr7_siu',
    name: 'CR7 SIUUU',
    url: 'https://media.giphy.com/media/r1IMdmkhUcpUXEYOtY/giphy.gif',
    category: 'celebration',
  },
  {
    id: 'dicaprio_toast',
    name: 'DiCaprio Brindisi',
    url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
    category: 'celebration',
  },
  {
    id: 'kobe_win',
    name: 'Campioni del Mondo',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    category: 'celebration',
  },
  {
    id: 'fire_dance',
    name: 'Ballo di Fuoco',
    url: 'https://media.giphy.com/media/DhstvI3CH03y8/giphy.gif',
    category: 'celebration',
  },
  {
    id: 'trophy_lift',
    name: 'Coppa Alzata',
    url: 'https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy.gif',
    category: 'celebration',
  },
  {
    id: 'freddie_mercury',
    name: 'Freddie Trionfante',
    url: 'https://media.giphy.com/media/f3dRSiajsz8DLmt0KS/giphy.gif',
    category: 'celebration',
  },

  // Meme & Sfottò
  {
    id: 'travolta_confused',
    name: 'Travolta Confuso',
    url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
    category: 'meme',
  },
  {
    id: 'laughing_meme',
    name: 'Risata Incontrollabile',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    category: 'meme',
  },
  {
    id: 'spiderman_point',
    name: 'Spiderman si indicano',
    url: 'https://media.giphy.com/media/l36kUEMsm4JU2uAJa/giphy.gif',
    category: 'meme',
  },
  {
    id: 'clown_meme',
    name: 'Che Clown',
    url: 'https://media.giphy.com/media/x0npYExCGOZeo/giphy.gif',
    category: 'meme',
  },
  {
    id: 'facepalm',
    name: 'Facepalm Epico',
    url: 'https://media.giphy.com/media/3oEjI67Egb8G9jN3Q4/giphy.gif',
    category: 'meme',
  },

  // Ping Pong
  {
    id: 'cat_pingpong',
    name: 'Gatto Ping Pong',
    url: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
    category: 'pingpong',
  },
  {
    id: 'forrest_gump_pingpong',
    name: 'Forrest Gump Imbattibile',
    url: 'https://media.giphy.com/media/e1ITjiYmdEcEmjqrUH/giphy.gif',
    category: 'pingpong',
  },
  {
    id: 'epic_table_tennis',
    name: 'Scambio Epico al Tavolo',
    url: 'https://media.giphy.com/media/11ISwbg5jUhRxG/giphy.gif',
    category: 'pingpong',
  },
  {
    id: 'ping_pong_trick',
    name: 'Colpo Magico',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    category: 'pingpong',
  },

  // Rabbia & Table Flip
  {
    id: 'table_flip',
    name: 'Ribalta il Tavolo',
    url: 'https://media.giphy.com/media/uKT0LEmMCS3Bi/giphy.gif',
    category: 'rage',
  },
  {
    id: 'broken_racket',
    name: 'Racchetta Fracassata',
    url: 'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif',
    category: 'rage',
  },
  {
    id: 'screaming_rage',
    name: 'Urlo di Rabbia',
    url: 'https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif',
    category: 'rage',
  },
  {
    id: 'pc_smash',
    name: 'Distrugge Tutto',
    url: 'https://media.giphy.com/media/l1J9u3TZfpmeDLkD6/giphy.gif',
    category: 'rage',
  },

  // Pianto & Disperazione
  {
    id: 'sad_crying',
    name: 'Pianto Disperato',
    url: 'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif',
    category: 'crying',
  },
  {
    id: 'dawson_crying',
    name: 'Dawson in Lacrime',
    url: 'https://media.giphy.com/media/3ov9jUBdDA5FFFITOU/giphy.gif',
    category: 'crying',
  },
  {
    id: 'cat_crying',
    name: 'Gattino che piange',
    url: 'https://media.giphy.com/media/BEob50RZoLRrgTxJ8Q/giphy.gif',
    category: 'crying',
  },
  {
    id: 'defeat_rain',
    name: 'Sotto la Pioggia',
    url: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
    category: 'crying',
  },

  // Popcorn & Drama
  {
    id: 'popcorn',
    name: 'Michael Jackson Popcorn',
    url: 'https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif',
    category: 'popcorn',
  },
  {
    id: 'tea_sipping',
    name: 'Kermit Beve il Tè',
    url: 'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif',
    category: 'popcorn',
  },
  {
    id: 'homer_hedge',
    name: 'Homer nella Siepe',
    url: 'https://media.giphy.com/media/jUwpNzg9IcyrK/giphy.gif',
    category: 'popcorn',
  },

  // Danza & Festeggiamento
  {
    id: 'carlton_dance',
    name: 'Carlton Dance',
    url: 'https://media.giphy.com/media/pa37AAGzKXoek/giphy.gif',
    category: 'dance',
  },
  {
    id: 'snoop_dance',
    name: 'Snoop Dogg Dance',
    url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif',
    category: 'dance',
  },
  {
    id: 'baby_dance',
    name: 'Bambino Ballerino',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    category: 'dance',
  },
];

export const DEFAULT_CUSTOM_TAGS = [
  { id: 'tag_sniper', emoji: '🎯', text: 'Cecchino del Taglio' },
  { id: 'tag_wall', emoji: '🧱', text: 'Muro di Gomma' },
  { id: 'tag_lucky', emoji: '🍀', text: 'Baciato dalla Dea' },
  { id: 'tag_excuses', emoji: '🤡', text: 'Colpa del Vento' },
  { id: 'tag_smash', emoji: '💥', text: 'Cannoniere' },
];

// I 4 Giocatori Ufficiali di Default
export const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'player-alberto',
    name: 'Alberto',
    avatar: '🦁',
    color: '#3B82F6', // Blue
    elo: 1200,
    initialElo: 1200,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    catchphrase: 'Non guardo il punteggio, guardo lo stile!',
    tags: ['⚡ Re della Schiacciata', '🔥 Macchina da Punti'],
    celebrationGifUrl: 'https://media.giphy.com/media/r1IMdmkhUcpUXEYOtY/giphy.gif', // CR7 SIUUU
    profileBanner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60',
    highestElo: 1200,
    lowestElo: 1200,
    lastCrossedThreshold: 1200,
  },
  {
    id: 'player-gianluca',
    name: 'Gianluca',
    avatar: '🦍',
    color: '#10B981', // Emerald
    elo: 1200,
    initialElo: 1200,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    catchphrase: 'Io non perdo: o vinco o imparo (oggi imparo)!',
    tags: ['🛡️ Il Muro Umano', '🧘 Maestro Zen'],
    celebrationGifUrl: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', // DiCaprio toast
    profileBanner: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
    highestElo: 1200,
    lowestElo: 1200,
    lastCrossedThreshold: 1200,
  },
  {
    id: 'player-federico',
    name: 'Federico',
    avatar: '🥷',
    color: '#F59E0B', // Amber
    elo: 1200,
    initialElo: 1200,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    catchphrase: 'Quella palla ha toccato lo spigolo, l\'ho sentito!',
    tags: ['🎲 Fa Solo Spigoli', '🌪️ Topspin Fantasma'],
    celebrationGifUrl: 'https://media.giphy.com/media/DhstvI3CH03y8/giphy.gif', // Fire dance
    profileBanner: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=60',
    highestElo: 1200,
    lowestElo: 1200,
    lastCrossedThreshold: 1200,
  },
  {
    id: 'player-gabriele',
    name: 'Gabriele',
    avatar: '🤡',
    color: '#EC4899', // Pink
    elo: 1200,
    initialElo: 1200,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    catchphrase: 'La racchetta è rovinata, compratene una nuova!',
    tags: ['😭 Scuse Infinite', '🧤 Mano di Burro'],
    celebrationGifUrl: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif', // Cat pingpong
    profileBanner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60',
    highestElo: 1200,
    lowestElo: 1200,
    lastCrossedThreshold: 1200,
  },
];
