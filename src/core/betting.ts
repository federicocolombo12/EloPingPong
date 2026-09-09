import { PRE_MATCH_BET_CUTOFF } from './constants';
import { LiveBet } from './types';

export interface OddsCalculation {
  odds1: number;
  odds2: number;
  prob1: number; // 0 to 100
  prob2: number; // 0 to 100
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
 * Risolve tutte le scommesse registrate su un match concluso.
 */
export function resolveMatchBets(
  bets: Record<string, LiveBet> | undefined,
  winner: 1 | 2,
  insurances?: Record<string, boolean>
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

  const updatedBets: Record<string, LiveBet> = {};
  const payouts: Record<string, number> = {};
  const insuranceRefunds: Record<string, number> = {};
  let totalWagered = 0;
  let totalPayout = 0;

  Object.values(bets).forEach((bet) => {
    totalWagered += bet.amount;
    const isWinner = bet.betOnPlayer === winner;

    if (isWinner) {
      const payout = Math.round(bet.amount * bet.odds);
      updatedBets[bet.id] = {
        ...bet,
        status: 'won',
        potentialPayout: payout,
      };
      payouts[bet.bettorId] = (payouts[bet.bettorId] || 0) + payout;
      totalPayout += payout;
    } else {
      const hasInsurance = !!insurances?.[bet.bettorId];
      const refund = hasInsurance ? Math.round(bet.amount * 0.5) : 0;
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
