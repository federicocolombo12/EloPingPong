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

  // Soglia minima di partite live per poter vincere un trofeo per media:
  // Se la lega ha giocatori con almeno 2 partite live, richiediamo >= 2 partite per evitare vincite "one-shot"
  // Altrimenti fallback a 1 se qualcuno ha giocato almeno 1 partita live.
  const maxLiveMatches = Math.max(0, ...list.map((a) => a.liveMatchesCount));
  const minLiveMatches = maxLiveMatches >= 2 ? 2 : (maxLiveMatches >= 1 ? 1 : 0);
  const eligiblePlayers = list.filter((a) => a.liveMatchesCount >= minLiveMatches && a.liveMatchesCount > 0);

  function getBestByAverage(
    metricGetter: (a: PlayerStatsAggregate) => number,
    minCount: number = 1
  ): { best: PlayerStatsAggregate | null; avg: number } {
    let best: PlayerStatsAggregate | null = null;
    let maxAvg = -1;
    let maxTotal = -1;

    // Se ci sono player con la soglia minima di partite, cerchiamo tra loro; altrimenti tra chiunque abbia liveMatchesCount > 0
    const pool = eligiblePlayers.length > 0 ? eligiblePlayers : activePlayers;

    for (const a of pool) {
      const total = metricGetter(a);
      if (total < minCount) continue;
      const avg = a.liveMatchesCount > 0 ? total / a.liveMatchesCount : 0;

      // Se la media è superiore, o a parità di media il totale è superiore
      if (avg > maxAvg || (Math.abs(avg - maxAvg) < 0.0001 && total > maxTotal)) {
        maxAvg = avg;
        maxTotal = total;
        best = a;
      }
    }

    return { best, avg: maxAvg >= 0 ? maxAvg : 0 };
  }

  const trophies: SpecialTrophy[] = [];

  // 1. "Buona la prima" (più alta % prime battute a segno)
  const serverPool = eligiblePlayers.length > 0 ? eligiblePlayers : activePlayers;
  let bestServer = serverPool.length > 0 ? serverPool[0] : null;
  const minServes = serverPool.some((a) => a.totalServes >= 10) ? 10 : 5;
  for (const a of serverPool) {
    if (a.totalServes >= minServes && a.serveSuccessRate > (bestServer?.serveSuccessRate ?? 0)) {
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
    statValue: bestServer ? `${bestServer.serveSuccessRate}% prime a segno (${bestServer.totalServes} serv in ${bestServer.liveMatchesCount} live)` : '---',
    description: 'Assegnato al giocatore con la più alta percentuale di battute valide senza commettere falli.',
  });

  // 2. "Salvato in corner" (media spigoli per partita live)
  const { best: bestEdges, avg: edgesAvg } = getBestByAverage((a) => a.edges);
  const hasEdges = !!bestEdges && bestEdges.edges > 0;
  trophies.push({
    id: 'corner_saver',
    title: 'Salvato in corner',
    icon: '🏓',
    memeSubtitle: 'Mago degli spigoli millimetrici',
    winnerPlayerId: hasEdges ? bestEdges?.playerId : undefined,
    winnerPlayerName: hasEdges ? bestEdges?.player.name : undefined,
    winnerPlayerAvatar: hasEdges ? bestEdges?.player.avatar : undefined,
    statValue: hasEdges ? `${edgesAvg.toFixed(1)}/m (${bestEdges?.edges} in ${bestEdges?.liveMatchesCount} live)` : '0 spigoli',
    description: 'Assegnato al giocatore che ha beffato più volte l\'avversario colpendo lo spigolo del tavolo.',
  });

  // 3. "Culo sfondato" (media punti da spigoli + net per partita live)
  const { best: bestLuck, avg: luckAvg } = getBestByAverage((a) => a.luckPoints);
  const hasLuck = !!bestLuck && bestLuck.luckPoints > 0;
  trophies.push({
    id: 'lucky_bastard',
    title: 'Culo sfondato',
    icon: '🍑',
    memeSubtitle: 'Baciato dalla Dea Bendata',
    winnerPlayerId: hasLuck ? bestLuck?.playerId : undefined,
    winnerPlayerName: hasLuck ? bestLuck?.player.name : undefined,
    winnerPlayerAvatar: hasLuck ? bestLuck?.player.avatar : undefined,
    statValue: hasLuck ? `${luckAvg.toFixed(1)} pt/m (${bestLuck?.luckPoints} pt: ${bestLuck?.edges} spig, ${bestLuck?.nets} net)` : '0 pt fortuna',
    description: 'Assegnato a colui che ha collezionato il record di punti casuali per match tra retine e spigoli.',
  });

  // 4. "Senza mani" (media errori commessi in battuta per partita live)
  const { best: mostFaults, avg: faultsAvg } = getBestByAverage((a) => a.serveErrors);
  const hasFaults = !!mostFaults && mostFaults.serveErrors > 0;
  trophies.push({
    id: 'no_hands',
    title: 'Senza mani',
    icon: '🧤',
    memeSubtitle: 'Babbo Natale del servizio',
    winnerPlayerId: hasFaults ? mostFaults?.playerId : undefined,
    winnerPlayerName: hasFaults ? mostFaults?.player.name : undefined,
    winnerPlayerAvatar: hasFaults ? mostFaults?.player.avatar : undefined,
    statValue: hasFaults ? `${faultsAvg.toFixed(1)} falli/m (${mostFaults?.serveErrors} in ${mostFaults?.liveMatchesCount} live)` : '0 falli',
    description: 'Assegnato a colui che regala più punti agli avversari sbagliando la battuta da solo.',
  });

  // 5. "Re dello smash" (media schiacciate vincenti per partita live)
  const { best: bestSmash, avg: smashAvg } = getBestByAverage((a) => a.smashes);
  const hasSmash = !!bestSmash && bestSmash.smashes > 0;
  trophies.push({
    id: 'smash_king',
    title: 'Re dello smash',
    icon: '💥',
    memeSubtitle: 'Braccio armato della Riunione',
    winnerPlayerId: hasSmash ? bestSmash?.playerId : undefined,
    winnerPlayerName: hasSmash ? bestSmash?.player.name : undefined,
    winnerPlayerAvatar: hasSmash ? bestSmash?.player.avatar : undefined,
    statValue: hasSmash ? `${smashAvg.toFixed(1)}/m (${bestSmash?.smashes} in ${bestSmash?.liveMatchesCount} live)` : '0 smash',
    description: 'Assegnato al giocatore più aggressivo che chiude i punti con bordate imparabili per partita.',
  });

  // 6. "Re dell'Ace" (media ace vincenti per partita live)
  const { best: bestAce, avg: aceAvg } = getBestByAverage((a) => a.aces);
  const hasAces = !!bestAce && bestAce.aces > 0;
  trophies.push({
    id: 'ace_king',
    title: "Re dell'Ace",
    icon: '⚡',
    memeSubtitle: 'Servizi fulminei e imprendibili',
    winnerPlayerId: hasAces ? bestAce?.playerId : undefined,
    winnerPlayerName: hasAces ? bestAce?.player.name : undefined,
    winnerPlayerAvatar: hasAces ? bestAce?.player.avatar : undefined,
    statValue: hasAces ? `${aceAvg.toFixed(1)}/m (${bestAce?.aces} in ${bestAce?.liveMatchesCount} live)` : '0 ace',
    description: 'Assegnato al battitore più letale che mette a segno ace diretti per incontro.',
  });

  // 7. "Cuore d'Acciaio" (media match point salvati per partita live)
  const { best: bestMpSaver, avg: mpAvg } = getBestByAverage((a) => a.matchPointsSaved);
  const hasMpSaved = !!bestMpSaver && bestMpSaver.matchPointsSaved > 0;
  trophies.push({
    id: 'match_point_saver',
    title: "Cuore d'Acciaio",
    icon: '🧱',
    memeSubtitle: 'Nervi saldi a un passo dal baratro',
    winnerPlayerId: hasMpSaved ? bestMpSaver?.playerId : undefined,
    winnerPlayerName: hasMpSaved ? bestMpSaver?.player.name : undefined,
    winnerPlayerAvatar: hasMpSaved ? bestMpSaver?.player.avatar : undefined,
    statValue: hasMpSaved ? `${mpAvg.toFixed(1)}/m (${bestMpSaver?.matchPointsSaved} in ${bestMpSaver?.liveMatchesCount} live)` : '0 MP salvati',
    description: 'Assegnato al maestro delle rimonte impossibili che ha annullato più match point avversari.',
  });

  // 8. "Difesa d'Acciaio" (media punti strappati in difesa per partita live)
  const { best: bestDefense, avg: defAvg } = getBestByAverage((a) => a.defenses);
  const hasDefense = !!bestDefense && bestDefense.defenses > 0;
  trophies.push({
    id: 'iron_defense',
    title: "Difesa d'Acciaio",
    icon: '🛡️',
    memeSubtitle: 'Muro invalicabile della Riunione',
    winnerPlayerId: hasDefense ? bestDefense?.playerId : undefined,
    winnerPlayerName: hasDefense ? bestDefense?.player.name : undefined,
    winnerPlayerAvatar: hasDefense ? bestDefense?.player.avatar : undefined,
    statValue: hasDefense ? `${defAvg.toFixed(1)}/m (${bestDefense?.defenses} in ${bestDefense?.liveMatchesCount} live)` : '0 difese',
    description: 'Assegnato al giocatore capace di recuperi impossibili e difese strenue che ribaltano lo scambio.',
  });

  // 9. "Pura Classe" (media punti stile realizzati per partita live)
  const { best: bestStyle, avg: styleAvg } = getBestByAverage((a) => a.stylePoints);
  const hasStyle = !!bestStyle && bestStyle.stylePoints > 0;
  trophies.push({
    id: 'style_master',
    title: 'Pura Classe',
    icon: '✨',
    memeSubtitle: 'Spettacolo e stile allo stato puro',
    winnerPlayerId: hasStyle ? bestStyle?.playerId : undefined,
    winnerPlayerName: hasStyle ? bestStyle?.player.name : undefined,
    winnerPlayerAvatar: hasStyle ? bestStyle?.player.avatar : undefined,
    statValue: hasStyle ? `${styleAvg.toFixed(1)} pt/m (${bestStyle?.stylePoints} in ${bestStyle?.liveMatchesCount} live)` : '0 pt stile',
    description: 'Assegnato al giocatore che delizia il pubblico con colpi spettacolari di puro stile e classe.',
  });

  // 10. "Mia!" (media contese iniziali vinte per partita live)
  const { best: bestContestWon, avg: contestWonAvg } = getBestByAverage((a) => a.ballContestsWon);
  const hasContestWon = !!bestContestWon && bestContestWon.ballContestsWon > 0;
  trophies.push({
    id: 'ball_contest_master',
    title: 'Mia!',
    icon: '✋',
    memeSubtitle: 'Padrone assoluto della prima palla',
    winnerPlayerId: hasContestWon ? bestContestWon?.playerId : undefined,
    winnerPlayerName: hasContestWon ? bestContestWon?.player.name : undefined,
    winnerPlayerAvatar: hasContestWon ? bestContestWon?.player.avatar : undefined,
    statValue: hasContestWon ? `${contestWonAvg.toFixed(1)}/m (${bestContestWon?.ballContestsWon} in ${bestContestWon?.liveMatchesCount} live)` : '0 contese',
    description: 'Assegnato al giocatore che ha vinto più volte la contesa iniziale conquistando il primo servizio.',
  });

  // 11. "Tua!" (media contese iniziali perse / cedute per partita live)
  const { best: mostContestLost, avg: contestLostAvg } = getBestByAverage((a) => a.ballContestsLost);
  const hasContestLost = !!mostContestLost && mostContestLost.ballContestsLost > 0;
  trophies.push({
    id: 'ball_contest_loser',
    title: 'Tua!',
    icon: '👉',
    memeSubtitle: 'Prendi pure, tanto vinco dopo',
    winnerPlayerId: hasContestLost ? mostContestLost?.playerId : undefined,
    winnerPlayerName: hasContestLost ? mostContestLost?.player.name : undefined,
    winnerPlayerAvatar: hasContestLost ? mostContestLost?.player.avatar : undefined,
    statValue: hasContestLost ? `${contestLostAvg.toFixed(1)}/m (${mostContestLost?.ballContestsLost} in ${mostContestLost?.liveMatchesCount} live)` : '0 contese',
    description: 'Assegnato al giocatore galante (o distratto) che ha perso più volte la contesa iniziale per il servizio.',
  });

  // 12. "Cucchiaio di legno" (ultimo classificato per Elo)
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
