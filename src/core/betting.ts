import { PRE_MATCH_BET_CUTOFF } from './constants';
import { BetMarketType, LiveBet, MatchLiveStats } from './types';

export interface OddsCalculation {
  odds1: number;
  odds2: number;
  prob1: number; // 0 to 100
  prob2: number; // 0 to 100
}

export interface MarketOption {
  selection: string;
  label: string;
  odds: number;
}

export interface BetMarketInfo {
  type: BetMarketType;
  title: string;
  description: string;
  targetLine?: number;
  options: MarketOption[];
}

/**
 * Calcola le quote Pre-Match fisse basate sulla differenza Elo di partenza.
 */
export function calculatePreMatchOdds(elo1: number, elo2: number): OddsCalculation {
  // Probabilità logistica Elo
  const p1 = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
  const p2 = 1 - p1;

  // Applicazione margine del 5% del banco
  const rawOdds1 = 0.95 / p1;
  const rawOdds2 = 0.95 / p2;

  // Clamping ragionevole per il pre-match (min 1.08x, max 7.50x)
  const odds1 = Math.round(Math.min(7.5, Math.max(1.08, rawOdds1)) * 100) / 100;
  const odds2 = Math.round(Math.min(7.5, Math.max(1.08, rawOdds2)) * 100) / 100;

  return {
    odds1,
    odds2,
    prob1: Math.round(p1 * 100),
    prob2: Math.round(p2 * 100),
  };
}

/**
 * Calcola le quote Live In-Game dinamiche in tempo reale.
 * Utilizza induzione all'indietro (Dynamic Programming) calcolando la probabilità esatta
 * di rimonta e vittoria da (score1, score2) fino a targetPoints tenendo conto dei vantaggi (deuce).
 */
export function calculateLiveDynamicOdds(
  p1Elo: number,
  p2Elo: number,
  score1: number,
  score2: number,
  targetPoints: 11 | 21 = 11
): OddsCalculation {
  // Se la partita è già conclusa
  if (score1 >= targetPoints && score1 - score2 >= 2) {
    return { odds1: 1.01, odds2: 50.0, prob1: 100, prob2: 0 };
  }
  if (score2 >= targetPoints && score2 - score1 >= 2) {
    return { odds1: 50.0, odds2: 1.01, prob1: 0, prob2: 100 };
  }

  // Probabilità base per singolo punto basata sull'Elo (con clamp tra 0.20 e 0.80 per mantenere sempre viva la contesa)
  const rawPointProb = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
  const p = Math.min(0.8, Math.max(0.2, rawPointProb));
  const q = 1 - p;

  // Limite massimo di punteggio per la griglia DP
  const maxScore = Math.max(targetPoints + 4, Math.max(score1, score2) + 6);
  const dp: number[][] = Array.from({ length: maxScore + 1 }, () =>
    new Array(maxScore + 1).fill(-1)
  );

  // Probabilità di vittoria di P1 partendo da deuce (parità k-k con k >= targetPoints - 1)
  // Per vincere servono 2 punti consecutivi: p^2 / (p^2 + q^2)
  const deuceProb = (p * p) / (p * p + q * q);

  // Risoluzione per programmazione dinamica a ritroso
  for (let total = maxScore * 2; total >= score1 + score2; total--) {
    for (let i = 0; i <= maxScore; i++) {
      const j = total - i;
      if (j < 0 || j > maxScore) continue;

      // Condizioni terminali
      if (i >= targetPoints && i - j >= 2) {
        dp[i][j] = 1.0;
      } else if (j >= targetPoints && j - i >= 2) {
        dp[i][j] = 0.0;
      } else if (i >= targetPoints - 1 && j >= targetPoints - 1 && i === j) {
        dp[i][j] = deuceProb;
      } else {
        const nextI = i + 1 <= maxScore ? dp[i + 1][j] : 1.0;
        const nextJ = j + 1 <= maxScore ? dp[i][j + 1] : 0.0;
        dp[i][j] = p * nextI + q * nextJ;
      }
    }
  }

  let winProb1 = dp[score1][score2];
  if (winProb1 < 0) winProb1 = p; // Fallback di sicurezza
  winProb1 = Math.min(0.995, Math.max(0.005, winProb1));
  const winProb2 = 1 - winProb1;

  // Calcolo quote con spread (margine del 4%)
  const margin = 0.96;
  const raw1 = margin / winProb1;
  const raw2 = margin / winProb2;

  // In live dinamico, le quote possono schizzare fino a 50.00x per rimonte leggendarie!
  const odds1 = Math.round(Math.min(50.0, Math.max(1.02, raw1)) * 100) / 100;
  const odds2 = Math.round(Math.min(50.0, Math.max(1.02, raw2)) * 100) / 100;

  return {
    odds1,
    odds2,
    prob1: Math.round(winProb1 * 100),
    prob2: Math.round(winProb2 * 100),
  };
}

/**
 * Calcola tutte le quote dei mercati live disponibili per il match corrente
 */
export function calculateAllLiveMarkets(
  p1Name: string,
  p2Name: string,
  p1Elo: number,
  p2Elo: number,
  score1: number,
  score2: number,
  targetPoints: 11 | 21 = 11,
  stats?: MatchLiveStats
): BetMarketInfo[] {
  const winnerOdds = calculateLiveDynamicOdds(p1Elo, p2Elo, score1, score2, targetPoints);
  const totalPoints = score1 + score2;
  const targetLine = targetPoints === 21 ? 38.5 : 18.5;
  const maxScore = Math.max(score1, score2);
  const diff = Math.abs(score1 - score2);

  // 1. Mercato Vincitore
  const winnerMarket: BetMarketInfo = {
    type: 'match_winner',
    title: '🏆 Esito Finale (1X2)',
    description: 'Chi vincerà la partita?',
    options: [
      { selection: '1', label: p1Name, odds: winnerOdds.odds1 },
      { selection: '2', label: p2Name, odds: winnerOdds.odds2 },
    ],
  };

  // 2. Under/Over Punti Totali (Linea 18.5 o 38.5)
  let probOver = 0.5;
  if (totalPoints >= targetLine) {
    probOver = 0.96;
  } else if (maxScore >= targetPoints - 1) {
    if (diff <= 1) probOver = 0.92;
    else probOver = 0.08;
  } else {
    // Maggiore equilibrio -> maggiore probabilità di match lungo
    const closeness = Math.max(0, 1 - diff / (targetPoints * 0.7));
    probOver = 0.35 + closeness * 0.35;
  }
  probOver = Math.min(0.95, Math.max(0.05, probOver));
  const oddsOver = Math.round(Math.min(25.0, Math.max(1.05, 0.94 / probOver)) * 100) / 100;
  const oddsUnder = Math.round(Math.min(25.0, Math.max(1.05, 0.94 / (1 - probOver))) * 100) / 100;

  const totalPointsMarket: BetMarketInfo = {
    type: 'total_points',
    title: `🔢 Punti Totali (${targetLine})`,
    description: `Verranno segnati più o meno di ${targetLine} punti?`,
    targetLine,
    options: [
      { selection: 'over', label: `Over ${targetLine}`, odds: oddsOver },
      { selection: 'under', label: `Under ${targetLine}`, odds: oddsUnder },
    ],
  };

  // 3. Totale Smash (Linea 2.5)
  const smashLine = 2.5;
  const currentSmashes = (stats?.player1Smashes || 0) + (stats?.player2Smashes || 0);
  let probSmashOver = 0.45;
  if (currentSmashes > smashLine) {
    probSmashOver = 0.96;
  } else {
    const smashesNeeded = smashLine - currentSmashes;
    const remainingFraction = Math.max(0.05, 1 - totalPoints / (targetPoints * 1.8));
    probSmashOver = Math.min(0.92, Math.max(0.06, (0.45 / smashesNeeded) * remainingFraction));
  }
  const oddsSmashOver = Math.round(Math.min(20.0, Math.max(1.05, 0.93 / probSmashOver)) * 100) / 100;
  const oddsSmashUnder = Math.round(Math.min(20.0, Math.max(1.05, 0.93 / (1 - probSmashOver))) * 100) / 100;

  const smashesMarket: BetMarketInfo = {
    type: 'total_smashes',
    title: `💥 Botto di Smash (${smashLine})`,
    description: `Totale schiacciate vincenti nel match (Attuali: ${currentSmashes})`,
    targetLine: smashLine,
    options: [
      { selection: 'over', label: `Over ${smashLine} Smash`, odds: oddsSmashOver },
      { selection: 'under', label: `Under ${smashLine} Smash`, odds: oddsSmashUnder },
    ],
  };

  // 4. Fattore Culo (Spigoli + Retine, Linea 1.5)
  const luckLine = 1.5;
  const currentLuck =
    (stats?.player1Edges || 0) +
    (stats?.player2Edges || 0) +
    (stats?.player1Nets || 0) +
    (stats?.player2Nets || 0);
  let probLuckOver = 0.52;
  if (currentLuck > luckLine) {
    probLuckOver = 0.96;
  } else {
    const remainingFraction = Math.max(0.05, 1 - totalPoints / (targetPoints * 1.8));
    probLuckOver = Math.min(0.9, Math.max(0.08, 0.48 * remainingFraction));
  }
  const oddsLuckOver = Math.round(Math.min(20.0, Math.max(1.05, 0.93 / probLuckOver)) * 100) / 100;
  const oddsLuckUnder = Math.round(Math.min(20.0, Math.max(1.05, 0.93 / (1 - probLuckOver))) * 100) / 100;

  const luckMarket: BetMarketInfo = {
    type: 'luck_points',
    title: `🍀 Fattore Culo (${luckLine})`,
    description: `Retine + spigoli deviati nel match (Attuali: ${currentLuck})`,
    targetLine: luckLine,
    options: [
      { selection: 'over', label: `Over ${luckLine} Punti Culo`, odds: oddsLuckOver },
      { selection: 'under', label: `Under ${luckLine} Punti Culo`, odds: oddsLuckUnder },
    ],
  };

  // 5. Vantaggi (Deuce a 10-10 o 20-20)
  const deuceTarget = targetPoints - 1;
  let probDeuce = 0.18;
  if (score1 >= deuceTarget && score2 >= deuceTarget) {
    probDeuce = 0.98;
  } else if (maxScore >= targetPoints && diff >= 2) {
    probDeuce = 0.01;
  } else {
    const scoreCloseness = Math.max(0, 1 - diff / 5);
    const progress = Math.min(1, totalPoints / (deuceTarget * 2));
    probDeuce = Math.min(0.85, Math.max(0.04, 0.15 + scoreCloseness * 0.35 * progress));
  }
  const oddsDeuceYes = Math.round(Math.min(30.0, Math.max(1.04, 0.93 / probDeuce)) * 100) / 100;
  const oddsDeuceNo = Math.round(Math.min(30.0, Math.max(1.04, 0.93 / (1 - probDeuce))) * 100) / 100;

  const deuceMarket: BetMarketInfo = {
    type: 'deuce_happens',
    title: '⚡ Vantaggi ai Titoli di Coda',
    description: `La partita arriverà sul ${deuceTarget}-${deuceTarget}?`,
    options: [
      { selection: 'yes', label: 'Sì, si va ai Vantaggi', odds: oddsDeuceYes },
      { selection: 'no', label: 'No vantaggi', odds: oddsDeuceNo },
    ],
  };

  return [winnerMarket, totalPointsMarket, smashesMarket, luckMarket, deuceMarket];
}

/**
 * Regola Ferrea Anti-Biscotto:
 * Chi è in campo può scommettere esclusivamente sulla propria vittoria personale.
 * Non può scommettere sull'avversario né sui mercati secondari (under/over, smash, ecc.).
 */
export function validateBetPlacement(
  bettorId: string,
  player1Id: string,
  player2Id: string,
  marketType: BetMarketType = 'match_winner',
  betOnPlayer?: 1 | 2
): { valid: boolean; error?: string } {
  const isPlayerInMatch = bettorId === player1Id || bettorId === player2Id;
  if (isPlayerInMatch) {
    if (marketType !== 'match_winner') {
      return {
        valid: false,
        error: 'Regola Ferrea Anti-Biscotto: Chi gioca può scommettere solo sulla propria vittoria!',
      };
    }
    const mySide = bettorId === player1Id ? 1 : 2;
    if (betOnPlayer !== mySide) {
      return {
        valid: false,
        error: 'Regola Ferrea Anti-Biscotto: Puoi puntare solo sulla tua vittoria personale, non sul tuo avversario!',
      };
    }
  }
  return { valid: true };
}

/**
 * Risolve tutte le scommesse registrate su un match concluso (multi-mercato).
 */
export function resolveMatchBets(
  bets: Record<string, LiveBet> | undefined,
  winner: 1 | 2,
  finalScore1?: number | Record<string, boolean>,
  finalScore2?: number,
  matchStats?: MatchLiveStats,
  insurances?: Record<string, boolean>,
  boosters?: Record<string, boolean>,
  deuceInsurances?: Record<string, boolean>
): {
  updatedBets: Record<string, LiveBet>;
  payouts: Record<string, number>;
  totalWagered: number;
  totalPayout: number;
  insuranceRefunds: Record<string, number>;
} {
  if (!bets || Object.keys(bets).length === 0) {
    return { updatedBets: {}, payouts: {}, totalWagered: 0, totalPayout: 0, insuranceRefunds: {} };
  }

  let effectiveScore1: number | undefined;
  let effectiveInsurances = insurances;
  if (typeof finalScore1 === 'object' && finalScore1 !== null) {
    effectiveInsurances = finalScore1 as Record<string, boolean>;
  } else if (typeof finalScore1 === 'number') {
    effectiveScore1 = finalScore1;
  }

  const updatedBets: Record<string, LiveBet> = {};
  const payouts: Record<string, number> = {};
  const insuranceRefunds: Record<string, number> = {};
  let totalWagered = 0;
  let totalPayout = 0;

  const s1 = effectiveScore1 ?? (winner === 1 ? 11 : 8);
  const s2 = finalScore2 ?? (winner === 2 ? 11 : 8);
  const totalPoints = s1 + s2;
  const totalSmashes = (matchStats?.player1Smashes || 0) + (matchStats?.player2Smashes || 0);
  const totalLuck =
    (matchStats?.player1Edges || 0) +
    (matchStats?.player2Edges || 0) +
    (matchStats?.player1Nets || 0) +
    (matchStats?.player2Nets || 0);
  const target = matchStats?.targetPoints || 11;
  const wentToDeuce = (s1 >= target - 1 && s2 >= target - 1) && (s1 + s2 >= (target - 1) * 2);

  Object.values(bets).forEach((bet) => {
    totalWagered += bet.amount;
    const market = bet.marketType || 'match_winner';
    let isWinner = false;

    if (market === 'match_winner') {
      isWinner = bet.betOnPlayer ? bet.betOnPlayer === winner : bet.selection === String(winner);
    } else if (market === 'total_points') {
      const line = bet.targetLine || (target === 21 ? 38.5 : 18.5);
      isWinner = bet.selection === 'over' ? totalPoints > line : totalPoints < line;
    } else if (market === 'total_smashes') {
      const line = bet.targetLine || 2.5;
      isWinner = bet.selection === 'over' ? totalSmashes > line : totalSmashes < line;
    } else if (market === 'luck_points') {
      const line = bet.targetLine || 1.5;
      isWinner = bet.selection === 'over' ? totalLuck > line : totalLuck < line;
    } else if (market === 'deuce_happens') {
      isWinner = bet.selection === 'yes' ? wentToDeuce : !wentToDeuce;
    }

    if (isWinner) {
      const netProfit = bet.amount * (bet.odds - 1);
      const hasBooster = !!(bet.usedBooster || boosters?.[bet.bettorId]);
      // Con Booster Quota 2x, il profitto netto viene raddoppiato!
      const finalPayout = hasBooster
        ? Math.round(bet.amount + netProfit * 2)
        : Math.round(bet.amount * bet.odds);

      updatedBets[bet.id] = {
        ...bet,
        status: 'won',
        potentialPayout: finalPayout,
        usedBooster: hasBooster,
      };
      payouts[bet.bettorId] = (payouts[bet.bettorId] || 0) + finalPayout;
      totalPayout += finalPayout;
    } else {
      // Verifica coperture assicurative
      let refund = 0;
      const hasDeuceIns = !!deuceInsurances?.[bet.bettorId];
      const hasStandardIns = !!effectiveInsurances?.[bet.bettorId];

      if (market === 'match_winner' && wentToDeuce && hasDeuceIns) {
        // Assicurazione Vantaggi: rimborso 100% dell'importo
        refund = bet.amount;
      } else if (hasStandardIns) {
        // Assicurazione Standard: rimborso 50%
        refund = Math.round(bet.amount * 0.5);
      }

      if (refund > 0) {
        insuranceRefunds[bet.bettorId] = (insuranceRefunds[bet.bettorId] || 0) + refund;
        payouts[bet.bettorId] = (payouts[bet.bettorId] || 0) + refund;
        totalPayout += refund;
      } else if (!payouts[bet.bettorId]) {
        payouts[bet.bettorId] = 0;
      }

      updatedBets[bet.id] = {
        ...bet,
        status: 'lost',
        potentialPayout: refund,
      };
    }
  });

  return {
    updatedBets,
    payouts,
    totalWagered,
    totalPayout,
    insuranceRefunds,
  };
}

/**
 * Gestisce l'azzeramento della posizione bilaterale (no Dutching / zero-hedging).
 * Se un giocatore ha già scommesso sul Giocatore 1 e piazza una scommessa sul Giocatore 2,
 * la vecchia scommessa viene annullata e l'importo rimborsato nel portafoglio.
 * Se la nuova bet ha lo stesso importo o intende solo chiudere, la posizione viene azzerata (0 scommesse).
 */
export function handleBilateralBetRule(
  currentBets: Record<string, LiveBet> | undefined,
  bettorId: string,
  newBetOnPlayer: 1 | 2,
  newAmount: number
): {
  updatedBets: Record<string, LiveBet>;
  refundedCoins: number;
  positionZeroed: boolean;
  cancelledBetId?: string;
} {
  if (!currentBets) {
    return { updatedBets: {}, refundedCoins: 0, positionZeroed: false };
  }

  const updatedBets = { ...currentBets };
  let refundedCoins = 0;
  let positionZeroed = false;
  let cancelledBetId: string | undefined;

  // Cerca scommesse pendenti del medesimo scommettitore sul giocatore OPPOSTO
  const oppositePlayer = newBetOnPlayer === 1 ? 2 : 1;
  const existingOppositeBet = Object.values(currentBets).find(
    (b) => b.bettorId === bettorId && b.betOnPlayer === oppositePlayer && b.status === 'pending'
  );

  if (existingOppositeBet) {
    // Rimuove la vecchia scommessa opposta e rimborsa
    refundedCoins = existingOppositeBet.amount;
    cancelledBetId = existingOppositeBet.id;
    delete updatedBets[existingOppositeBet.id];

    // Se l'importo coincide con la scommessa opposta, azzera la posizione
    if (newAmount === existingOppositeBet.amount) {
      positionZeroed = true;
    }
  }

  return {
    updatedBets,
    refundedCoins,
    positionZeroed,
    cancelledBetId,
  };
}

/**
 * Verifica se è possibile piazzare una Pre-Match Bet
 */
export function canPlacePreMatchBet(score1: number, score2: number): boolean {
  return score1 + score2 < PRE_MATCH_BET_CUTOFF;
}

/**
 * Verifica se è possibile piazzare una Live Dynamic Bet
 */
export function canPlaceLiveDynamicBet(isGameOver: boolean): boolean {
  return !isGameOver;
}

