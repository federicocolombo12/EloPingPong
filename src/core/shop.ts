import { ShopItem } from './types';

export const SHOP_ITEMS: ShopItem[] = [
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
    id: 'border_violet',
    name: '🟣 Cyberpunk Violet',
    description: 'Aura viola elettrico neon con riflessi magnetici.',
    price: 200,
    category: 'border',
    icon: '🟣',
    previewColor: '#A855F7',
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
    id: 'border_gold',
    name: '🟡 Placcato Oro 24K',
    description: 'La cornice dorata più prestigiosa dell\'Arena: solo per veri campioni.',
    price: 450,
    category: 'border',
    icon: '🟡',
    previewColor: '#FACC15',
  },

  // Perk & Consumabili
  {
    id: 'perk_insurance',
    name: '🛡️ Assicurazione Scommessa',
    description: 'Consumabile: se la tua prossima scommessa perde, ricevi un rimborso del 50%!',
    price: 50,
    category: 'perk',
    icon: '🛡️',
    previewColor: '#38BDF8',
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
    case 'border_violet':
      return {
        borderColor: '#A855F7',
        borderWidth: 2,
        shadowColor: '#A855F7',
        shadowOpacity: 0.7,
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
