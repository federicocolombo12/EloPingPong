import { Match, Player, SpecialTrophy, SpecialTrophyId } from './types';

export interface PlayerStatsAggregate {
  playerId: string;
  player: Player;
  edges: number;
  nets: number;
  luckPoints: number;
  stylePoints: number;
  smashes: number;
  serveErrors: number;
  aces: number;
  defenses: number;
  matchPointsSaved: number;
  pointsOnServe: number;
  ballContestsWon: number;
  ballContestsLost: number;
  totalServes: number;
  serveSuccessRate: number; // in %
  liveMatchesCount: number;
}

/**
 * Aggrega tutte le statistiche live dettagliate per ciascun giocatore
 */
export function aggregatePlayerStats(
  players: Player[],
  matches: Match[]
): Record<string, PlayerStatsAggregate> {
  const result: Record<string, PlayerStatsAggregate> = {};

  for (const p of players) {
    result[p.id] = {
      playerId: p.id,
      player: p,
      edges: 0,
      nets: 0,
      luckPoints: 0,
      stylePoints: 0,
      smashes: 0,
      serveErrors: 0,
      aces: 0,
      defenses: 0,
      matchPointsSaved: 0,
      pointsOnServe: 0,
      ballContestsWon: 0,
      ballContestsLost: 0,
      totalServes: 0,
      serveSuccessRate: 100,
      liveMatchesCount: 0,
    };
  }

  for (const m of matches) {
    if (!m.stats) continue;

    const p1Stats = result[m.player1Id];
    const p2Stats = result[m.player2Id];

    // Calcolo battute stimate o reali
    const totalPoints = m.score1 + m.score2;
    const estP1Serves = m.stats.player1TotalServes ?? Math.ceil(totalPoints / 2);
    const estP2Serves = m.stats.player2TotalServes ?? Math.floor(totalPoints / 2);

    if (p1Stats) {
      p1Stats.edges += m.stats.player1Edges || 0;
      p1Stats.nets += m.stats.player1Nets || 0;
      p1Stats.luckPoints += m.stats.player1LuckPoints ?? ((m.stats.player1Edges || 0) + (m.stats.player1Nets || 0));
      p1Stats.stylePoints += m.stats.player1StylePoints || 0;
      p1Stats.smashes += m.stats.player1Smashes || 0;
      p1Stats.serveErrors += m.stats.player1ServeErrors || 0;
      p1Stats.aces += m.stats.player1Aces || 0;
      p1Stats.defenses += m.stats.player1Defenses || 0;
      p1Stats.matchPointsSaved += m.stats.player1MatchPointsSaved || 0;
      p1Stats.pointsOnServe += m.stats.player1PointsOnServe || 0;
      if (m.stats.ballContestWinner === 1) {
        p1Stats.ballContestsWon += 1;
      } else if (m.stats.ballContestWinner === 2) {
        p1Stats.ballContestsLost += 1;
      }
      p1Stats.totalServes += estP1Serves;
      p1Stats.liveMatchesCount += 1;
    }

    if (p2Stats) {
      p2Stats.edges += m.stats.player2Edges || 0;
      p2Stats.nets += m.stats.player2Nets || 0;
      p2Stats.luckPoints += m.stats.player2LuckPoints ?? ((m.stats.player2Edges || 0) + (m.stats.player2Nets || 0));
      p2Stats.stylePoints += m.stats.player2StylePoints || 0;
      p2Stats.smashes += m.stats.player2Smashes || 0;
      p2Stats.serveErrors += m.stats.player2ServeErrors || 0;
      p2Stats.aces += m.stats.player2Aces || 0;
      p2Stats.defenses += m.stats.player2Defenses || 0;
      p2Stats.matchPointsSaved += m.stats.player2MatchPointsSaved || 0;
      p2Stats.pointsOnServe += m.stats.player2PointsOnServe || 0;
      if (m.stats.ballContestWinner === 2) {
        p2Stats.ballContestsWon += 1;
      } else if (m.stats.ballContestWinner === 1) {
        p2Stats.ballContestsLost += 1;
      }
      p2Stats.totalServes += estP2Serves;
      p2Stats.liveMatchesCount += 1;
    }
  }

  // Calcola le percentuali finali
  for (const pId of Object.keys(result)) {
    const agg = result[pId];
    if (agg.luckPoints === 0 && (agg.edges > 0 || agg.nets > 0)) {
      agg.luckPoints = agg.edges + agg.nets;
    }
    if (agg.totalServes > 0) {
      // Se abbiamo conteggio accurato dei punti vinti su servizio usiamo quello, altrimenti stima battute valide
      const pointsWonOnServe =
        agg.pointsOnServe > 0
          ? agg.pointsOnServe
          : Math.max(0, agg.totalServes - agg.serveErrors);
      agg.serveSuccessRate =
        Math.round((pointsWonOnServe / agg.totalServes) * 1000) / 10;
    } else {
      agg.serveSuccessRate = 100;
    }
  }

  return result;
}

/**
 * Calcola l'assegnazione di tutti i trofei e titoli speciali della Riunione Segreta
 */
export function calculateSpecialTrophies(
  players: Player[],
  matches: Match[]
): SpecialTrophy[] {
  if (players.length === 0) return [];

  const aggregates = aggregatePlayerStats(players, matches);
  const list = Object.values(aggregates);
  const activePlayers = list.filter((a) => a.liveMatchesCount > 0);

  const trophies: SpecialTrophy[] = [];

  // 1. "Buona la prima" (più alta % prime battute a segno)
  let bestServer = activePlayers.length > 0 ? activePlayers[0] : null;
  for (const a of activePlayers) {
    if (a.totalServes >= 10 && a.serveSuccessRate > (bestServer?.serveSuccessRate ?? 0)) {
      bestServer = a;
    }
  }
  trophies.push({
    id: 'first_serve_master',
    title: 'Buona la prima',
    icon: '🎯',
    memeSubtitle: 'Precisione chirurgica in battuta',
    winnerPlayerId: bestServer?.playerId,
    winnerPlayerName: bestServer?.player.name,
    winnerPlayerAvatar: bestServer?.player.avatar,
    statValue: bestServer ? `${bestServer.serveSuccessRate}% prime a segno` : '---',
    description: 'Assegnato al giocatore con la più alta percentuale di battute valide senza commettere falli.',
  });

  // 2. "Salvato in corner" (maggior numero di spigoli)
  let bestEdges = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.edges > (bestEdges?.edges ?? -1)) {
      bestEdges = a;
    }
  }
  const hasEdges = (bestEdges?.edges ?? 0) > 0;
  trophies.push({
    id: 'corner_saver',
    title: 'Salvato in corner',
    icon: '🏓',
    memeSubtitle: 'Mago degli spigoli millimetrici',
    winnerPlayerId: hasEdges ? bestEdges?.playerId : undefined,
    winnerPlayerName: hasEdges ? bestEdges?.player.name : undefined,
    winnerPlayerAvatar: hasEdges ? bestEdges?.player.avatar : undefined,
    statValue: hasEdges ? `${bestEdges?.edges} spigoli vincenti` : '0 spigoli',
    description: 'Assegnato al giocatore che ha beffato più volte l\'avversario colpendo lo spigolo del tavolo.',
  });

  // 3. "Culo sfondato" (più punti da spigoli + net)
  let bestLuck = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.luckPoints > (bestLuck?.luckPoints ?? -1)) {
      bestLuck = a;
    }
  }
  const hasLuck = (bestLuck?.luckPoints ?? 0) > 0;
  trophies.push({
    id: 'lucky_bastard',
    title: 'Culo sfondato',
    icon: '🍑',
    memeSubtitle: 'Baciato dalla Dea Bendata',
    winnerPlayerId: hasLuck ? bestLuck?.playerId : undefined,
    winnerPlayerName: hasLuck ? bestLuck?.player.name : undefined,
    winnerPlayerAvatar: hasLuck ? bestLuck?.player.avatar : undefined,
    statValue: hasLuck ? `${bestLuck?.luckPoints} pt fortuna (${bestLuck?.edges} spigoli, ${bestLuck?.nets} net)` : '0 pt fortuna',
    description: 'Assegnato a colui che ha collezionato il record assoluto di punti casuali tra retine e spigoli.',
  });

  // 4. "Senza mani" (più errori commessi in battuta)
  let mostFaults = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.serveErrors > (mostFaults?.serveErrors ?? -1)) {
      mostFaults = a;
    }
  }
  const hasFaults = (mostFaults?.serveErrors ?? 0) > 0;
  trophies.push({
    id: 'no_hands',
    title: 'Senza mani',
    icon: '🧤',
    memeSubtitle: 'Babbo Natale del servizio',
    winnerPlayerId: hasFaults ? mostFaults?.playerId : undefined,
    winnerPlayerName: hasFaults ? mostFaults?.player.name : undefined,
    winnerPlayerAvatar: hasFaults ? mostFaults?.player.avatar : undefined,
    statValue: hasFaults ? `${mostFaults?.serveErrors} falli al servizio` : '0 falli',
    description: 'Assegnato a colui che regala più punti agli avversari sbagliando la battuta da solo.',
  });

  // 5. "Re dello smash" (maggior numero di schiacciate vincenti)
  let bestSmash = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.smashes > (bestSmash?.smashes ?? -1)) {
      bestSmash = a;
    }
  }
  const hasSmash = (bestSmash?.smashes ?? 0) > 0;
  trophies.push({
    id: 'smash_king',
    title: 'Re dello smash',
    icon: '💥',
    memeSubtitle: 'Braccio armato della Riunione',
    winnerPlayerId: hasSmash ? bestSmash?.playerId : undefined,
    winnerPlayerName: hasSmash ? bestSmash?.player.name : undefined,
    winnerPlayerAvatar: hasSmash ? bestSmash?.player.avatar : undefined,
    statValue: hasSmash ? `${bestSmash?.smashes} schiacciate vincenti` : '0 smash',
    description: 'Assegnato al giocatore più aggressivo che chiude i punti con bordate imparabili.',
  });

  // 6. "Re dell'Ace" (maggior numero di ace vincenti)
  let bestAce = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.aces > (bestAce?.aces ?? -1)) {
      bestAce = a;
    }
  }
  const hasAces = (bestAce?.aces ?? 0) > 0;
  trophies.push({
    id: 'ace_king',
    title: "Re dell'Ace",
    icon: '⚡',
    memeSubtitle: 'Servizi fulminei e imprendibili',
    winnerPlayerId: hasAces ? bestAce?.playerId : undefined,
    winnerPlayerName: hasAces ? bestAce?.player.name : undefined,
    winnerPlayerAvatar: hasAces ? bestAce?.player.avatar : undefined,
    statValue: hasAces ? `${bestAce?.aces} ace vincenti` : '0 ace',
    description: 'Assegnato al battitore più letale che mette a segno ace diretti senza lasciare scampo all\'avversario.',
  });

  // 7. "Cuore d'Acciaio" (maggior numero di match point salvati)
  let bestMpSaver = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.matchPointsSaved > (bestMpSaver?.matchPointsSaved ?? -1)) {
      bestMpSaver = a;
    }
  }
  const hasMpSaved = (bestMpSaver?.matchPointsSaved ?? 0) > 0;
  trophies.push({
    id: 'match_point_saver',
    title: "Cuore d'Acciaio",
    icon: '🧱',
    memeSubtitle: 'Nervi saldi a un passo dal baratro',
    winnerPlayerId: hasMpSaved ? bestMpSaver?.playerId : undefined,
    winnerPlayerName: hasMpSaved ? bestMpSaver?.player.name : undefined,
    winnerPlayerAvatar: hasMpSaved ? bestMpSaver?.player.avatar : undefined,
    statValue: hasMpSaved ? `${bestMpSaver?.matchPointsSaved} match point annullati` : '0 MP salvati',
    description: 'Assegnato al maestro delle rimonte impossibili che ha annullato più match point avversari.',
  });

  // 8. "Difesa d'Acciaio" (più punti strappati in difesa)
  let bestDefense = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.defenses > (bestDefense?.defenses ?? -1)) {
      bestDefense = a;
    }
  }
  const hasDefense = (bestDefense?.defenses ?? 0) > 0;
  trophies.push({
    id: 'iron_defense',
    title: "Difesa d'Acciaio",
    icon: '🛡️',
    memeSubtitle: 'Muro invalicabile della Riunione',
    winnerPlayerId: hasDefense ? bestDefense?.playerId : undefined,
    winnerPlayerName: hasDefense ? bestDefense?.player.name : undefined,
    winnerPlayerAvatar: hasDefense ? bestDefense?.player.avatar : undefined,
    statValue: hasDefense ? `${bestDefense?.defenses} punti in difesa` : '0 difese',
    description: 'Assegnato al giocatore capace di recuperi impossibili e difese strenue che ribaltano lo scambio.',
  });

  // 9. "Pura Classe" (più punti stile realizzati)
  let bestStyle = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.stylePoints > (bestStyle?.stylePoints ?? -1)) {
      bestStyle = a;
    }
  }
  const hasStyle = (bestStyle?.stylePoints ?? 0) > 0;
  trophies.push({
    id: 'style_master',
    title: 'Pura Classe',
    icon: '✨',
    memeSubtitle: 'Spettacolo e stile allo stato puro',
    winnerPlayerId: hasStyle ? bestStyle?.playerId : undefined,
    winnerPlayerName: hasStyle ? bestStyle?.player.name : undefined,
    winnerPlayerAvatar: hasStyle ? bestStyle?.player.avatar : undefined,
    statValue: hasStyle ? `${bestStyle?.stylePoints} pt stile` : '0 pt stile',
    description: 'Assegnato al giocatore che delizia il pubblico con colpi spettacolari di puro stile e classe.',
  });

  // 9. "Mia!" (più contese iniziali vinte)
  let bestContestWon = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.ballContestsWon > (bestContestWon?.ballContestsWon ?? -1)) {
      bestContestWon = a;
    }
  }
  const hasContestWon = (bestContestWon?.ballContestsWon ?? 0) > 0;
  trophies.push({
    id: 'ball_contest_master',
    title: 'Mia!',
    icon: '✋',
    memeSubtitle: 'Padrone assoluto della prima palla',
    winnerPlayerId: hasContestWon ? bestContestWon?.playerId : undefined,
    winnerPlayerName: hasContestWon ? bestContestWon?.player.name : undefined,
    winnerPlayerAvatar: hasContestWon ? bestContestWon?.player.avatar : undefined,
    statValue: hasContestWon ? `${bestContestWon?.ballContestsWon} contese vinte` : '0 contese',
    description: 'Assegnato al giocatore che ha vinto più volte la contesa iniziale "per la palla" conquistando il primo servizio.',
  });

  // 10. "Tua!" (più contese iniziali perse / cedute)
  let mostContestLost = list.length > 0 ? list[0] : null;
  for (const a of list) {
    if (a.ballContestsLost > (mostContestLost?.ballContestsLost ?? -1)) {
      mostContestLost = a;
    }
  }
  const hasContestLost = (mostContestLost?.ballContestsLost ?? 0) > 0;
  trophies.push({
    id: 'ball_contest_loser',
    title: 'Tua!',
    icon: '👉',
    memeSubtitle: 'Prendi pure, tanto vinco dopo',
    winnerPlayerId: hasContestLost ? mostContestLost?.playerId : undefined,
    winnerPlayerName: hasContestLost ? mostContestLost?.player.name : undefined,
    winnerPlayerAvatar: hasContestLost ? mostContestLost?.player.avatar : undefined,
    statValue: hasContestLost ? `${mostContestLost?.ballContestsLost} contese cedute` : '0 contese',
    description: 'Assegnato al giocatore galante (o distratto) che ha perso più volte la contesa iniziale per il servizio.',
  });

  // 11. "Cucchiaio di legno" (ultimo classificato per Elo)
  if (players.length >= 2) {
    const sortedByElo = [...players].sort((a, b) => a.elo - b.elo);
    const lastPlayer = sortedByElo[0];
    trophies.push({
      id: 'wooden_spoon',
      title: 'Cucchiaio di legno',
      icon: '🥄',
      memeSubtitle: 'Fanalino di coda ufficiale',
      winnerPlayerId: lastPlayer.id,
      winnerPlayerName: lastPlayer.name,
      winnerPlayerAvatar: lastPlayer.avatar,
      statValue: `${lastPlayer.elo} ELO`,
      description: 'Assegnato all\'ultimo guerriero della classifica Elo che non molla mai.',
    });
  }

  return trophies;
}

/**
 * Restituisce i trofei attualmente detenuti da uno specifico giocatore
 */
export function getPlayerTrophies(
  playerId: string,
  players: Player[],
  matches: Match[]
): SpecialTrophy[] {
  const allTrophies = calculateSpecialTrophies(players, matches);
  return allTrophies.filter((t) => t.winnerPlayerId === playerId);
}
