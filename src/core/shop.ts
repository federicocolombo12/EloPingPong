import { ShopItem } from './types';

export const SHOP_ITEMS: ShopItem[] = [
  // Bacheca & Trofei D'Élite
  {
    id: 'trophy_champion_ring',
    name: '💍 Anello del Campione',
    description: 'Prestigioso anello con incisione d\'oro per dominatori del tavolo.',
    price: 200,
    category: 'trophy',
    icon: '💍',
    trophyBadge: '💍 Anello del Campione',
    previewColor: '#F59E0B',
  },
  {
    id: 'trophy_diamond_paddle',
    name: '💎 Racchetta di Diamante',
    description: 'Telaio forgiato in carbonio e cristalli purissimi indistruttibili.',
    price: 350,
    category: 'trophy',
    icon: '💎',
    trophyBadge: '💎 Racchetta di Diamante',
    previewColor: '#00E5FF',
  },
  {
    id: 'trophy_goat_statue',
    name: '🐐 Statua del G.O.A.T.',
    description: 'Per chi siede nell\'Olimpo del ping pong senza alcun rivale.',
    price: 500,
    category: 'trophy',
    icon: '🐐',
    trophyBadge: '🐐 Il G.O.A.T.',
    previewColor: '#EAB308',
  },
  {
    id: 'trophy_golden_table',
    name: '🏛️ Monumento al Campione',
    description: 'Monumento eterno eretto al centro della piazza per celebrare una leggenda.',
    price: 800,
    category: 'trophy',
    icon: '🏛️',
    trophyBadge: '🏛️ Monumento Eterno',
    previewColor: '#FFD700',
  },

  // Inni Sonori di Vittoria
  {
    id: 'sound_ff7_fanfare',
    name: '🎮 FFVII Victory Fanfare',
    description: 'L\'iconico jingle di vittoria di Final Fantasy VII che suona ad ogni tuo trionfo!',
    price: 120,
    category: 'sound',
    icon: '🎮',
    soundPreviewId: 'sound_ff7_fanfare',
    previewColor: '#00E5FF',
  },
  {
    id: 'sound_rock',
    name: '🎸 Heavy Rock Riff',
    description: 'Chitarra elettrica ruggente a tutto volume per festeggiare con pura energia metal!',
    price: 150,
    category: 'sound',
    icon: '🎸',
    soundPreviewId: 'sound_rock',
    previewColor: '#EF4444',
  },
  {
    id: 'sound_techno',
    name: '⚡ Cyber Rave Drop',
    description: 'Cassa dritta a 140 BPM e synth bass futuristico per far tremare la sala.',
    price: 180,
    category: 'sound',
    icon: '⚡',
    soundPreviewId: 'sound_techno',
    previewColor: '#A855F7',
  },
  {
    id: 'sound_stadium',
    name: '🏟️ Boato dello Stadio',
    description: 'Cori da stadio, applausi della curva e trombetta da finale europea.',
    price: 140,
    category: 'sound',
    icon: '🏟️',
    soundPreviewId: 'sound_stadium',
    previewColor: '#38BDF8',
  },

  // Titoli Onorari
  {
    id: 'title_sniper',
    name: '🎯 Il Cecchino',
    description: 'Precisione chirurgica negli angoli più insidiosi del tavolo.',
    price: 120,
    category: 'title',
    icon: '🎯',
    previewColor: '#38BDF8',
  },
  {
    id: 'title_wall',
    name: '🧱 Muro di Gomma',
    description: 'Ogni pallina torna indietro. Nessuna speranza di sfondare.',
    price: 150,
    category: 'title',
    icon: '🧱',
    previewColor: '#94A3B8',
  },
  {
    id: 'title_spin',
    name: '🌪️ Top Spin Nucleare',
    description: 'Effetti e rotazioni che sfidano le leggi della meccanica.',
    price: 200,
    category: 'title',
    icon: '🌪️',
    previewColor: '#F97316',
  },
  {
    id: 'title_style',
    name: '✨ Pura Classe',
    description: 'Non conta solo fare punto, conta farlo con stile ed eleganza.',
    price: 250,
    category: 'title',
    icon: '✨',
    previewColor: '#C084FC',
  },
  {
    id: 'title_lucky',
    name: '🍀 Baciato dal Culo',
    description: 'Spigoli beffardi e netti millimetrici: la sorte è sempre dalla tua parte.',
    price: 180,
    category: 'title',
    icon: '🍀',
    previewColor: '#34D399',
  },
  {
    id: 'title_godfather',
    name: '👑 Il Padrino',
    description: 'Comanda al tavolo con carisma, rispetto e autorevolezza suprema.',
    price: 350,
    category: 'title',
    icon: '👑',
    previewColor: '#FACC15',
  },
  {
    id: 'title_wolf',
    name: '🐺 Lupo di Wall Street',
    description: 'Scommettitore d\'élite: fiuto innato per le quote pazze e le rimonte impossibili.',
    price: 500,
    category: 'title',
    icon: '🐺',
    previewColor: '#F59E0B',
  },

  // Aure e Cornici Neon per la Card
  {
    id: 'border_matrix',
    name: '🟢 Neon Matrix',
    description: 'Bordo verde fosforescente pulsante per un look hacker futuristico.',
    price: 100,
    category: 'border',
    icon: '🟢',
    previewColor: '#10B981',
  },
  {
    id: 'border_ice',
    name: '🧊 Brivido Glaciale',
    description: 'Bagliore azzurro artico e cristalli di ghiaccio sul perimetro.',
    price: 180,
    category: 'border',
    icon: '🧊',
    previewColor: '#00F0FF',
  },
  {
    id: 'border_violet',
    name: '🟣 Cyberpunk Violet',
    description: 'Aura viola elettrico neon con riflessi magnetici.',
    price: 200,
    category: 'border',
    icon: '🟣',
    previewColor: '#A855F7',
  },
  {
    id: 'border_lightning',
    name: '⚡ Scossa Elettrica',
    description: 'Scariche dorate ad alta tensione che circondano il profilo.',
    price: 220,
    category: 'border',
    icon: '⚡',
    previewColor: '#EAB308',
  },
  {
    id: 'border_fire',
    name: '🔥 Fiamma Viva',
    description: 'Bordo rosso ardente e bagliore di fuoco: perennemente On Fire.',
    price: 300,
    category: 'border',
    icon: '🔥',
    previewColor: '#EF4444',
  },
  {
    id: 'border_rainbow',
    name: '🌈 Prisma Olografico',
    description: 'Riflessi iridescenti multidimensionali che cambiano colore.',
    price: 320,
    category: 'border',
    icon: '🌈',
    previewColor: '#EC4899',
  },
  {
    id: 'border_gold',
    name: '🟡 Placcato Oro 24K',
    description: 'La cornice dorata più prestigiosa dell\'Arena: solo per veri campioni.',
    price: 450,
    category: 'border',
    icon: '🟡',
    previewColor: '#FACC15',
  },

  // Perk & Consumabili Tattici
  {
    id: 'perk_bet_booster',
    name: '⚡ Booster Quota 2x',
    description: 'Consumabile: raddoppia il profitto netto della tua prossima scommessa vincente!',
    price: 60,
    category: 'perk',
    icon: '⚡',
    previewColor: '#F59E0B',
  },
  {
    id: 'perk_deuce_insurance',
    name: '🛡️ Assicurazione Vantaggi',
    description: 'Consumabile: rimborso del 100% se la tua scommessa sul vincente perde ai vantaggi!',
    price: 40,
    category: 'perk',
    icon: '🛡️',
    previewColor: '#06B6D4',
  },
  {
    id: 'perk_insurance',
    name: '🛡️ Assicurazione Standard',
    description: 'Consumabile: se la tua prossima scommessa perde, ricevi un rimborso del 50%!',
    price: 50,
    category: 'perk',
    icon: '🛡️',
    previewColor: '#38BDF8',
  },
  {
    id: 'perk_custom_nickname',
    name: '🏷️ Conio Soprannome',
    description: 'Permette di coniare e mostrare un soprannome speciale personalizzato sul profilo!',
    price: 50,
    category: 'perk',
    icon: '🏷️',
    previewColor: '#8B5CF6',
  },
  {
    id: 'mystery_box',
    name: '🎁 Pacco Sorpresa',
    description: 'Tenta la fortuna! Vinci da 25 a 250 LUL Coins o il meme badge "📦 Spacchettatore".',
    price: 75,
    category: 'mystery',
    icon: '🎁',
    previewColor: '#EC4899',
  },
];

export interface MysteryBoxOutcome {
  coins: number;
  badge?: string;
  message: string;
  isJackpot: boolean;
}

/**
 * Estrazione casuale dal Pacco Sorpresa.
 */
export function openMysteryBox(): MysteryBoxOutcome {
  const roll = Math.random();
  if (roll < 0.10) {
    // 10% Jackpot 250 Coins + Badge
    return {
      coins: 250,
      badge: '📦 Spacchettatore Seriale',
      message: '🎰 JACKPOT CLAMOROSO! Hai trovato 250 LUL Coins e il badge esclusivo!',
      isJackpot: true,
    };
  } else if (roll < 0.35) {
    // 25% Buon bottino 125 Coins
    return {
      coins: 125,
      message: '🎉 Gran colpo! Il pacco conteneva 125 LUL Coins!',
      isJackpot: false,
    };
  } else if (roll < 0.70) {
    // 35% Pareggio 75 Coins
    return {
      coins: 75,
      message: '👍 Pacco neutro: hai recuperato 75 LUL Coins!',
      isJackpot: false,
    };
  } else {
    // 30% Pacco sfortunato 30 Coins
    return {
      coins: 30,
      message: '📦 Pacco beffa: solo 30 LUL Coins... la fortuna gira!',
      isJackpot: false,
    };
  }
}

export interface WheelSector {
  index: number;
  label: string;
  icon: string;
  color: string;
  coins?: number;
  perkId?: string;
  probability: number;
}

export const WHEEL_SECTORS: WheelSector[] = [
  { index: 0, label: '25 🪙', icon: '🪙', color: '#64748B', coins: 25, probability: 0.30 },
  { index: 1, label: '50 🪙', icon: '💰', color: '#10B981', coins: 50, probability: 0.25 },
  { index: 2, label: '100 🪙', icon: '💵', color: '#3B82F6', coins: 100, probability: 0.18 },
  { index: 3, label: '150 🪙', icon: '💎', color: '#8B5CF6', coins: 150, probability: 0.12 },
  { index: 4, label: 'Booster 2x', icon: '⚡', color: '#F59E0B', perkId: 'perk_bet_booster', probability: 0.08 },
  { index: 5, label: 'Assicuraz.', icon: '🛡️', color: '#06B6D4', perkId: 'perk_insurance', probability: 0.05 },
  { index: 6, label: '500 🪙', icon: '🎰', color: '#EF4444', coins: 500, probability: 0.02 },
];

export interface WheelSpinOutcome {
  sector: WheelSector;
  message: string;
  isJackpot: boolean;
}

export function spinLuckyWheel(): WheelSpinOutcome {
  const roll = Math.random();
  let cumulative = 0;
  for (const sector of WHEEL_SECTORS) {
    cumulative += sector.probability;
    if (roll <= cumulative) {
      const isJackpot = sector.index === 6;
      let msg = `Hai vinto ${sector.label}!`;
      if (isJackpot) {
        msg = `🎰 JACKPOT SUPREMO! 500 LUL Coins vinti alla Ruota!`;
      } else if (sector.perkId) {
        msg = `⚡ Ottimo colpo! Hai ottenuto un ${sector.label}!`;
      }
      return {
        sector,
        message: msg,
        isJackpot,
      };
    }
  }
  // Fallback sul primo settore
  return {
    sector: WHEEL_SECTORS[0],
    message: 'Hai vinto 25 LUL Coins!',
    isJackpot: false,
  };
}

/**
 * Helper per ottenere lo stile del bordo card equipaggiato
 */
export function getBorderCardStyle(borderId?: string) {
  switch (borderId) {
    case 'border_matrix':
      return {
        borderColor: '#10B981',
        borderWidth: 2,
        shadowColor: '#10B981',
        shadowOpacity: 0.6,
        shadowRadius: 8,
      };
    case 'border_ice':
      return {
        borderColor: '#00F0FF',
        borderWidth: 2,
        shadowColor: '#00F0FF',
        shadowOpacity: 0.75,
        shadowRadius: 10,
      };
    case 'border_violet':
      return {
        borderColor: '#A855F7',
        borderWidth: 2,
        shadowColor: '#A855F7',
        shadowOpacity: 0.7,
        shadowRadius: 10,
      };
    case 'border_lightning':
      return {
        borderColor: '#EAB308',
        borderWidth: 2.5,
        shadowColor: '#EAB308',
        shadowOpacity: 0.8,
        shadowRadius: 10,
      };
    case 'border_fire':
      return {
        borderColor: '#EF4444',
        borderWidth: 2.5,
        shadowColor: '#EF4444',
        shadowOpacity: 0.8,
        shadowRadius: 10,
      };
    case 'border_rainbow':
      return {
        borderColor: '#EC4899',
        borderWidth: 2.5,
        shadowColor: '#A855F7',
        shadowOpacity: 0.85,
        shadowRadius: 12,
      };
    case 'border_gold':
      return {
        borderColor: '#FACC15',
        borderWidth: 2.5,
        shadowColor: '#FACC15',
        shadowOpacity: 0.85,
        shadowRadius: 12,
      };
    default:
      return {};
  }
}
