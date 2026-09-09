import {
    DEFAULT_K_FACTOR,
    ELO_THRESHOLDS,
    ENVIRONMENTAL_MODIFIERS,
    PERSONAL_MODIFIERS,
} from './constants';
import { EloCalculationResult, HeadToHeadStats, Match } from './types';

/**
 * Calcola l'aspettativa di vittoria di A contro B:
 * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calcola i nuovi punteggi Elo tenendo conto dei modificatori ambientali e personali (asimmetrici).
 */
export function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  kFactor: number = DEFAULT_K_FACTOR,
  options: {
    isFriendly?: boolean;
    environmentalModifiers?: string[];
    winnerModifiers?: string[];
    loserModifiers?: string[];
    winnerActivityMultiplier?: number;
  } = {}
): EloCalculationResult {
  const {
    isFriendly = false,
    environmentalModifiers = [],
    winnerModifiers = [],
    loserModifiers = [],
    winnerActivityMultiplier = 1.0,
  } = options;

  // Se amichevole, nessun delta Elo
  if (isFriendly) {
    return {
      winnerEloBefore: winnerElo,
      loserEloBefore: loserElo,
      winnerEloAfter: winnerElo,
      loserEloAfter: loserElo,
      delta: 0,
      winnerDelta: 0,
      loserDelta: 0,
      expectedWinnerWinProb: Math.round(calculateExpectedScore(winnerElo, loserElo) * 100),
    };
  }

  const expectedWinnerScore = calculateExpectedScore(winnerElo, loserElo);
  const baseDelta = kFactor * (1 - expectedWinnerScore);

  // Calcolo moltiplicatore ambientale complessivo
  let envMultiplier = 1.0;
  for (const modId of environmentalModifiers) {
    const mod = ENVIRONMENTAL_MODIFIERS.find((m) => m.id === modId);
    if (mod) {
      envMultiplier *= mod.multiplier;
    }
  }

  // Calcolo moltiplicatore personale per il vincitore
  let winnerMultiplier = 1.0 * winnerActivityMultiplier;
  for (const modId of winnerModifiers) {
    const mod = PERSONAL_MODIFIERS.find((m) => m.id === modId);
    if (mod) {
      winnerMultiplier *= mod.winMult;
    }
  }

  // Calcolo moltiplicatore personale per lo sconfitto
  let loserMultiplier = 1.0;
  for (const modId of loserModifiers) {
    const mod = PERSONAL_MODIFIERS.find((m) => m.id === modId);
    if (mod) {
      loserMultiplier *= mod.lossMult;
    }
  }

  // Delta effettivi
  let winnerDelta = Math.round(baseDelta * envMultiplier * winnerMultiplier);
  let loserDelta = Math.round(baseDelta * envMultiplier * loserMultiplier);

  // Se i moltiplicatori azzerano (es. friendly), resta 0, altrimenti minimo 1 punto
  if (envMultiplier > 0) {
    if (winnerDelta < 1) winnerDelta = 1;
    if (loserDelta < 1) loserDelta = 1;
  } else {
    winnerDelta = 0;
    loserDelta = 0;
  }

  const winnerEloAfter = winnerElo + winnerDelta;
  const loserEloAfter = Math.max(100, loserElo - loserDelta);

  return {
    winnerEloBefore: winnerElo,
    loserEloBefore: loserElo,
    winnerEloAfter,
    loserEloAfter,
    delta: winnerDelta,
    winnerDelta,
    loserDelta,
    expectedWinnerWinProb: Math.round(expectedWinnerScore * 100),
  };
}

/**
 * Controlla se una variazione di Elo ha fatto superare una soglia importante (es. 1250, 1300, 1350...)
 */
export function checkThresholdCrossed(
  oldElo: number,
  newElo: number,
  lastKnownThreshold?: number
): number | null {
  if (newElo <= oldElo) return null;

  // Ordine decrescente per trovare la soglia più alta superata
  const sortedThresholds = [...ELO_THRESHOLDS].sort((a, b) => b - a);

  for (const threshold of sortedThresholds) {
    if (newElo >= threshold && oldElo < threshold) {
      if (!lastKnownThreshold || threshold > lastKnownThreshold) {
        return threshold;
      }
    }
  }

  return null;
}

/**
 * Restituisce il badge/titolo onorario permanente per la soglia Elo più alta raggiunta
 */
export function getPlayerActiveMilestone(
  elo: number
): { threshold: number; title: string; badge: string; color: string } | null {
  const sortedThresholds = [...ELO_THRESHOLDS].sort((a, b) => b - a);
  for (const threshold of sortedThresholds) {
    if (elo >= threshold) {
      if (threshold >= 1500) return { threshold, title: 'Leggenda', badge: '👑 1500+', color: '#F59E0B' };
      if (threshold >= 1450) return { threshold, title: 'Diamante', badge: '💎 1450+', color: '#38BDF8' };
      if (threshold >= 1400) return { threshold, title: 'Maestro', badge: '🌟 1400+', color: '#A855F7' };
      if (threshold >= 1375) return { threshold, title: 'Fuoriclasse', badge: '🔥 1375+', color: '#EF4444' };
      if (threshold >= 1350) return { threshold, title: 'Veterano', badge: '⚡ 1350+', color: '#F97316' };
      if (threshold >= 1325) return { threshold, title: 'Esperto', badge: '🏆 1325+', color: '#EAB308' };
      if (threshold >= 1300) return { threshold, title: 'Specialista', badge: '🎖️ 1300+', color: '#10B981' };
      if (threshold >= 1275) return { threshold, title: 'Combattente', badge: '⚔️ 1275+', color: '#06B6D4' };
      if (threshold >= 1250) return { threshold, title: 'Guardiano', badge: '🛡️ 1250+', color: '#3B82F6' };
      if (threshold >= 1225) return { threshold, title: 'Promessa', badge: '🌱 1225+', color: '#84CC16' };
    }
  }
  return null;
}

/**
 * Calcola la percentuale di vittoria
 */
export function getWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * Restituisce una rappresentazione visiva della striscia attuale
 */
export function getStreakDisplay(streak: number): { text: string; emoji: string; type: 'hot' | 'cold' | 'neutral' } {
  if (streak > 0) {
    const emoji = streak >= 3 ? '🔥' : '✨';
    return { text: `${streak}W`, emoji, type: 'hot' };
  } else if (streak < 0) {
    const abs = Math.abs(streak);
    const emoji = abs >= 3 ? '💩' : '❄️';
    return { text: `${abs}L`, emoji, type: 'cold' };
  }
  return { text: '-', emoji: '➖', type: 'neutral' };
}

/**
 * Calcola le statistiche testa a testa tra due giocatori
 */
export function calculateHeadToHead(
  player1Id: string,
  player2Id: string,
  matches: Match[]
): HeadToHeadStats {
  const directMatches = matches.filter(
    (m) =>
      (m.player1Id === player1Id && m.player2Id === player2Id) ||
      (m.player1Id === player2Id && m.player2Id === player1Id)
  );

  let p1Wins = 0;
  let p2Wins = 0;

  for (const m of directMatches) {
    if (m.winnerId === player1Id) {
      p1Wins++;
    } else if (m.winnerId === player2Id) {
      p2Wins++;
    }
  }

  const total = p1Wins + p2Wins;
  const p1Rate = total > 0 ? Math.round((p1Wins / total) * 100) : 50;

  return {
    player1Id,
    player2Id,
    player1Wins: p1Wins,
    player2Wins: p2Wins,
    totalMatches: total,
    player1WinRate: p1Rate,
    lastMatches: directMatches.slice(0, 5),
  };
}

/**
 * Ricalcola la serie attuale di vittorie/sconfitte dallo storico delle partite
 */
export function recalculateStreak(playerId: string, matches: Match[]): number {
  const playerMatches = matches.filter((m) => m.player1Id === playerId || m.player2Id === playerId);
  if (playerMatches.length === 0) return 0;

  const firstIsWin = playerMatches[0].winnerId === playerId;
  let streak = 0;

  for (const m of playerMatches) {
    const isWin = m.winnerId === playerId;
    if (isWin === firstIsWin) {
      streak++;
    } else {
      break;
    }
  }

  return firstIsWin ? streak : -streak;
}

/**
 * Calcola i punti ATP guadagnati da ciascun giocatore per la Race della stagione
 */
export function calculateRacePointsForMatch(
  score1: number,
  score2: number,
  isFriendly: boolean = false
): { p1RacePoints: number; p2RacePoints: number } {
  if (isFriendly) {
    return score1 > score2
      ? { p1RacePoints: 15, p2RacePoints: 5 }
      : { p1RacePoints: 5, p2RacePoints: 15 };
  }

  const isP1Winner = score1 > score2;
  const winnerScore = isP1Winner ? score1 : score2;
  const loserScore = isP1Winner ? score2 : score1;

  // Vittoria schiacciante (cappotto es. 3-0 o 2-0): 50 pt al vincitore, 10 pt allo sconfitto
  // Vittoria combattuta (es. 3-1, 3-2): 40 pt al vincitore, 15 pt allo sconfitto
  const isSweep = loserScore === 0;
  const isClose = (winnerScore - loserScore) <= 1 || loserScore >= 2;

  let winnerPoints = 35;
  let loserPoints = 10;

  if (isSweep) {
    winnerPoints = 50;
    loserPoints = 10;
  } else if (isClose) {
    winnerPoints = 40;
    loserPoints = 15;
  }

  return isP1Winner
    ? { p1RacePoints: winnerPoints, p2RacePoints: loserPoints }
    : { p1RacePoints: loserPoints, p2RacePoints: winnerPoints };
}

/**
 * Calcola il decadimento Elo da inattività (stile Ranking Tennis)
 * Se non si gioca da più di 7 giorni, perde 5 punti a settimana oltre il 7° giorno (fino al pavimento di 1200).
 */
export function calculateInactivityDecay(
  currentElo: number,
  lastMatchTimestamp?: number,
  nowTimestamp: number = Date.now()
): {
  decayPoints: number;
  newElo: number;
  daysInactive: number;
  isDecaying: boolean;
} {
  if (!lastMatchTimestamp || currentElo <= 1200) {
    return { decayPoints: 0, newElo: currentElo, daysInactive: 0, isDecaying: false };
  }

  const msInactive = nowTimestamp - lastMatchTimestamp;
  const daysInactive = Math.floor(msInactive / (1000 * 60 * 60 * 24));

  if (daysInactive <= 7) {
    return { decayPoints: 0, newElo: currentElo, daysInactive, isDecaying: false };
  }

  // Oltre 7 giorni di fermo: 5 punti per ogni settimana completa di ritardo
  const excessDays = daysInactive - 7;
  const weeksOverdue = Math.floor(excessDays / 7) + 1;
  const maxAllowedDecay = currentElo - 1200;
  const decayPoints = Math.min(maxAllowedDecay, weeksOverdue * 5);

  return {
    decayPoints,
    newElo: currentElo - decayPoints,
    daysInactive,
    isDecaying: decayPoints > 0,
  };
}

/**
 * Calcola se il giocatore è in "Ritmo Partita" (almeno 3 match negli ultimi 5 giorni)
 */
export function calculateActivityBonus(
  matches: Match[],
  playerId: string,
  nowTimestamp: number = Date.now()
): { multiplier: number; isHotRhythm: boolean; recentMatchesCount: number } {
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  const recent = matches.filter(
    (m) =>
      (m.player1Id === playerId || m.player2Id === playerId) &&
      nowTimestamp - m.timestamp <= fiveDaysMs
  );

  if (recent.length >= 3) {
    return { multiplier: 1.15, isHotRhythm: true, recentMatchesCount: recent.length };
  }
  return { multiplier: 1.0, isHotRhythm: false, recentMatchesCount: recent.length };
}

