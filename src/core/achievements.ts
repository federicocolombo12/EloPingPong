import { Player, Match } from './types';
import { SHOP_ITEMS } from './shop';

export type AchievementTierLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface AchievementTier {
  level: AchievementTierLevel;
  name: string; // 'Legno' | 'Bronzo' | 'Argento' | 'Oro' | 'Diamante' | 'Gear 5'
  badge: string;
  color: string;
  target: number;
  rewardCoins: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  category: 'stats' | 'clutch' | 'streaks' | 'gambling' | 'wealth';
  description: string;
  icon: string;
  tiers: AchievementTier[];
  getValue: (player: Player, matches: Match[]) => number;
}

export const TIER_NAMES: Record<AchievementTierLevel, { name: string; badge: string; color: string }> = {
  1: { name: 'Legno', badge: '🪵', color: '#A0522D' },
  2: { name: 'Bronzo', badge: '🥉', color: '#CD7F32' },
  3: { name: 'Argento', badge: '🥈', color: '#C0C0C0' },
  4: { name: 'Oro', badge: '🥇', color: '#FFD700' },
  5: { name: 'Diamante', badge: '💎', color: '#00E5FF' },
  6: { name: 'Gear 5', badge: '☀️', color: '#FF4500' },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'smash_king',
    name: 'Re dello Smash',
    category: 'stats',
    description: 'Schiacciate vincenti registrate nelle partite live',
    icon: '💥',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 5, rewardCoins: 15 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 20, rewardCoins: 30 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 50, rewardCoins: 60 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 100, rewardCoins: 120 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 200, rewardCoins: 250 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 500, rewardCoins: 500 },
    ],
    getValue: (player, matches) => {
      let count = 0;
      for (const m of matches) {
        if (!m.stats) continue;
        if (m.player1Id === player.id) count += m.stats.player1Smashes || 0;
        else if (m.player2Id === player.id) count += m.stats.player2Smashes || 0;
      }
      return count;
    },
  },
  {
    id: 'ace_master',
    name: 'Cecchino del Servizio',
    category: 'stats',
    description: 'Ace fulminanti realizzati su battuta avversaria',
    icon: '🎯',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 3, rewardCoins: 15 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 10, rewardCoins: 30 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 25, rewardCoins: 60 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 50, rewardCoins: 120 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 100, rewardCoins: 250 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 250, rewardCoins: 500 },
    ],
    getValue: (player, matches) => {
      let count = 0;
      for (const m of matches) {
        if (!m.stats) continue;
        if (m.player1Id === player.id) count += m.stats.player1Aces || 0;
        else if (m.player2Id === player.id) count += m.stats.player2Aces || 0;
      }
      return count;
    },
  },
  {
    id: 'iron_wall',
    name: "Muro d'Acciaio",
    category: 'stats',
    description: 'Punti strappati con difese e chop miracolosi',
    icon: '🧱',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 5, rewardCoins: 15 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 20, rewardCoins: 30 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 50, rewardCoins: 60 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 100, rewardCoins: 120 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 200, rewardCoins: 250 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 500, rewardCoins: 500 },
    ],
    getValue: (player, matches) => {
      let count = 0;
      for (const m of matches) {
        if (!m.stats) continue;
        if (m.player1Id === player.id) count += m.stats.player1Defenses || 0;
        else if (m.player2Id === player.id) count += m.stats.player2Defenses || 0;
      }
      return count;
    },
  },
  {
    id: 'clutch_god',
    name: 'Sangue Freddo',
    category: 'clutch',
    description: 'Match point annullati con successo in situazioni critiche',
    icon: '🥶',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 1, rewardCoins: 20 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 5, rewardCoins: 40 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 15, rewardCoins: 80 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 30, rewardCoins: 150 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 60, rewardCoins: 300 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 150, rewardCoins: 600 },
    ],
    getValue: (player, matches) => {
      let count = 0;
      for (const m of matches) {
        if (!m.stats) continue;
        if (m.player1Id === player.id) count += m.stats.player1MatchPointsSaved || 0;
        else if (m.player2Id === player.id) count += m.stats.player2MatchPointsSaved || 0;
      }
      return count;
    },
  },
  {
    id: 'win_streak',
    name: 'Inarrestabile',
    category: 'streaks',
    description: 'Miglior serie storica di vittorie consecutive',
    icon: '🔥',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 3, rewardCoins: 25 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 5, rewardCoins: 50 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 8, rewardCoins: 100 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 12, rewardCoins: 200 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 18, rewardCoins: 400 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 25, rewardCoins: 800 },
    ],
    getValue: (player, matches) => {
      // Calcola max streak storica
      const playerMatches = matches
        .filter(m => !m.isFriendly && (m.player1Id === player.id || m.player2Id === player.id))
        .sort((a, b) => a.timestamp - b.timestamp);

      let maxStreak = player.currentStreak > 0 ? player.currentStreak : 0;
      let cur = 0;
      for (const m of playerMatches) {
        if (m.winnerId === player.id) {
          cur++;
          if (cur > maxStreak) maxStreak = cur;
        } else {
          cur = 0;
        }
      }
      return maxStreak;
    },
  },
  {
    id: 'match_veteran',
    name: 'Leggenda del Tavolo',
    category: 'stats',
    description: 'Totale vittorie conquistate nella carriera Elo',
    icon: '👑',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 5, rewardCoins: 20 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 15, rewardCoins: 40 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 35, rewardCoins: 80 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 75, rewardCoins: 160 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 150, rewardCoins: 320 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 300, rewardCoins: 640 },
    ],
    getValue: (player) => player.wins || 0,
  },
  {
    id: 'bookmaker_slayer',
    name: 'Lupo di Wall Street',
    category: 'gambling',
    description: 'Scommesse vinte sul mercato delle scommesse live',
    icon: '📈',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 3, rewardCoins: 20 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 10, rewardCoins: 40 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 25, rewardCoins: 80 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 60, rewardCoins: 160 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 120, rewardCoins: 320 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 250, rewardCoins: 640 },
    ],
    getValue: (player) => player.betsWon || 0,
  },
  {
    id: 'tycoon',
    name: 'Magnate delle Monete',
    category: 'wealth',
    description: 'Patrimonio di LUL Coins accumulato nel portafoglio',
    icon: '💰',
    tiers: [
      { level: 1, name: 'Legno', badge: '🪵', color: '#A0522D', target: 300, rewardCoins: 30 },
      { level: 2, name: 'Bronzo', badge: '🥉', color: '#CD7F32', target: 600, rewardCoins: 60 },
      { level: 3, name: 'Argento', badge: '🥈', color: '#C0C0C0', target: 1200, rewardCoins: 120 },
      { level: 4, name: 'Oro', badge: '🥇', color: '#FFD700', target: 2500, rewardCoins: 250 },
      { level: 5, name: 'Diamante', badge: '💎', color: '#00E5FF', target: 5000, rewardCoins: 500 },
      { level: 6, name: 'Gear 5', badge: '☀️', color: '#FF4500', target: 10000, rewardCoins: 1000 },
    ],
    getValue: (player) => player.coins || 0,
  },
];

export interface PlayerAchievementStatus {
  achievement: AchievementDef;
  currentValue: number;
  claimedLevel: number;
  highestReachedTier: AchievementTier | null;
  nextTier: AchievementTier | null;
  claimableTiers: AchievementTier[];
  totalClaimableCoins: number;
}

export function calculatePlayerAchievements(
  player: Player,
  matches: Match[]
): PlayerAchievementStatus[] {
  const claimedMap = player.claimedAchievements || {};

  return ACHIEVEMENTS.map(ach => {
    const currentValue = ach.getValue(player, matches);
    const claimedLevel = claimedMap[ach.id] || 0;

    // Tiers reached based on currentValue
    const reachedTiers = ach.tiers.filter(t => currentValue >= t.target);
    const highestReachedTier = reachedTiers.length > 0 ? reachedTiers[reachedTiers.length - 1] : null;

    // Next tier to unlock
    const nextTier = ach.tiers.find(t => currentValue < t.target) || null;

    // Tiers reached but not yet claimed
    const claimableTiers = reachedTiers.filter(t => t.level > claimedLevel);
    const totalClaimableCoins = claimableTiers.reduce((acc, t) => acc + t.rewardCoins, 0);

    return {
      achievement: ach,
      currentValue,
      claimedLevel,
      highestReachedTier,
      nextTier,
      claimableTiers,
      totalClaimableCoins,
    };
  });
}

/**
 * Restituisce l'elenco dei soli riconoscimenti/tag legittimi che il giocatore possiede:
 * - Titoli acquistati nello shop
 * - Trofei acquistati nello shop
 * - Achievement effettivamente raggiunti e riscattati (con badge tier)
 * - Tag personalizzati coniati con il gettone
 */
export function getValidPlayerRecognitions(player: Player): string[] {
  const valid: string[] = [];

  // 1. Titoli acquistati nello shop (categoria title)
  SHOP_ITEMS.filter((it) => it.category === 'title' && player.inventory?.includes(it.id)).forEach((it) => {
    valid.push(it.name);
  });

  // 2. Trofei acquistati nello shop (categoria trophy)
  SHOP_ITEMS.filter((it) => it.category === 'trophy' && (player.trophyShowcase?.includes(it.id) || player.inventory?.includes(it.id))).forEach((it) => {
    valid.push(it.trophyBadge || it.name);
  });

  // Badge speciali vinti (es. Pacco Sorpresa)
  if (player.inventory?.includes('badge_box')) {
    valid.push('📦 Spacchettatore Seriale');
  }

  // 3. Achievement effettivamente riscattati dal giocatore (con badge di livello)
  if (player.claimedAchievements) {
    Object.entries(player.claimedAchievements).forEach(([achId, tierLevel]) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === achId);
      const tier = ach?.tiers.find((t) => t.level === tierLevel);
      if (ach && tier) {
        valid.push(`${tier.badge} ${ach.name} (${tier.name})`);
      }
    });
  }

  // 4. Tag personalizzati coniati con il gettone del Bazar
  if (player.coinedTags && Array.isArray(player.coinedTags)) {
    valid.push(...player.coinedTags);
  }

  return valid;
}

/**
 * Pulisce i tag di un giocatore rimuovendo categoricamente qualsiasi tag
 * autoassegnato che non sia stato legittimamente guadagnato o acquistato.
 */
export function sanitizePlayerTags(player: Player): string[] {
  if (!player.tags || !Array.isArray(player.tags) || player.tags.length === 0) {
    return [];
  }
  const valid = getValidPlayerRecognitions(player);
  return player.tags.filter((t) => valid.includes(t));
}

