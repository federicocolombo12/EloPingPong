import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { WinLossChart } from '../components/WinLossChart';
import { useElo } from '../context/EloContext';
import { STARTING_COINS } from '../core/constants';
import { getPlayerActiveMilestone, getStreakDisplay, getWinRate } from '../core/elo';
import { calculateSpecialTrophies, getPlayerTrophies } from '../core/trophies';
import { Match, Player } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

type SubTab = 'globale' | 'personali' | 'storico';
type HistoryFilter = 'all' | '3days' | '7days' | 'mine';

interface StatsScreenProps {
  initialPlayerId?: string;
  onNavigateToNewMatch?: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  initialPlayerId,
  onNavigateToNewMatch,
}) => {
  const {
    players,
    matches,
    associatedPlayer,
    undoLastMatch,
    setActiveCommentsMatch,
    addReaction,
  } = useElo();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('globale');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    initialPlayerId || associatedPlayer?.id || players[0]?.id || ''
  );
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  // Se initialPlayerId cambia dall'esterno, passa a 'personali' e seleziona il player
  useEffect(() => {
    if (initialPlayerId) {
      setSelectedPlayerId(initialPlayerId);
      setActiveSubTab('personali');
    }
  }, [initialPlayerId]);

  // Player attualmente selezionato per l'analisi personale
  const activePlayer = useMemo(() => {
    return players.find((p) => p.id === selectedPlayerId) || players[0] || null;
  }, [players, selectedPlayerId]);

  // ==========================================
  // LOGICA SUB-TAB 1: GLOBALE
  // ==========================================
  const specialTrophies = useMemo(() => calculateSpecialTrophies(players, matches), [players, matches]);

  const playerFormStats = useMemo(() => {
    return players.map((p) => {
      const pMatches = matches.filter((m) => m.player1Id === p.id || m.player2Id === p.id);
      const last5 = pMatches.slice(0, 5);
      const recentWins = last5.filter((m) => m.winnerId === p.id).length;
      return {
        player: p,
        recentWins,
        recentMatchesCount: last5.length,
        currentStreak: p.currentStreak,
      };
    });
  }, [players, matches]);

  const onFire = useMemo(
    () => [...playerFormStats].sort((a, b) => b.recentWins - a.recentWins)[0],
    [playerFormStats]
  );
  const inTrouble = useMemo(
    () => [...playerFormStats].sort((a, b) => a.recentWins - b.recentWins)[0],
    [playerFormStats]
  );

  const getModifierLeader = (filterFn: (m: Match, playerId: string) => boolean) => {
    let bestPlayer = null;
    let maxWins = 0;
    for (const p of players) {
      const winsWithMod = matches.filter((m) => m.winnerId === p.id && filterFn(m, p.id)).length;
      if (winsWithMod > maxWins) {
        maxWins = winsWithMod;
        bestPlayer = p;
      }
    }
    return bestPlayer ? { player: bestPlayer, wins: maxWins } : null;
  };

  const windLeader = useMemo(
    () => getModifierLeader((m) => !!m.environmentalModifiers?.includes('wind')),
    [players, matches]
  );
  const beerLeader = useMemo(
    () =>
      getModifierLeader(
        (m, pId) =>
          !!m.environmentalModifiers?.includes('beer') ||
          (m.player1Id === pId && !!m.player1Modifiers?.includes('beer_in_hand')) ||
          (m.player2Id === pId && !!m.player2Modifiers?.includes('beer_in_hand'))
      ),
    [players, matches]
  );
  const borrowedRacketLeader = useMemo(
    () =>
      getModifierLeader(
        (m, pId) =>
          (m.player1Id === pId && !!m.player1Modifiers?.includes('borrowed_racket')) ||
          (m.player2Id === pId && !!m.player2Modifiers?.includes('borrowed_racket'))
      ),
    [players, matches]
  );

  const liveStatsByPlayer = useMemo(() => {
    return players.map((p) => {
      let edges = 0;
      let nets = 0;
      let luckPoints = 0;
      let stylePoints = 0;
      let smashes = 0;
      let aces = 0;
      let defenses = 0;
      let serveErrors = 0;
      let liveMatches = 0;

      matches.forEach((m) => {
        if (m.stats) {
          if (m.player1Id === p.id) {
            edges += m.stats.player1Edges || 0;
            nets += m.stats.player1Nets || 0;
            luckPoints +=
              m.stats.player1LuckPoints ?? ((m.stats.player1Edges || 0) + (m.stats.player1Nets || 0));
            stylePoints += m.stats.player1StylePoints || 0;
            smashes += m.stats.player1Smashes || 0;
            aces += m.stats.player1Aces || 0;
            defenses += m.stats.player1Defenses || 0;
            serveErrors += m.stats.player1ServeErrors || 0;
            liveMatches += 1;
          } else if (m.player2Id === p.id) {
            edges += m.stats.player2Edges || 0;
            nets += m.stats.player2Nets || 0;
            luckPoints +=
              m.stats.player2LuckPoints ?? ((m.stats.player2Edges || 0) + (m.stats.player2Nets || 0));
            stylePoints += m.stats.player2StylePoints || 0;
            smashes += m.stats.player2Smashes || 0;
            aces += m.stats.player2Aces || 0;
            defenses += m.stats.player2Defenses || 0;
            serveErrors += m.stats.player2ServeErrors || 0;
            liveMatches += 1;
          }
        }
      });

      if (luckPoints === 0 && (edges > 0 || nets > 0)) {
        luckPoints = edges + nets;
      }

      const avgLuck = liveMatches > 0 ? luckPoints / liveMatches : 0;
      const avgStyle = liveMatches > 0 ? stylePoints / liveMatches : 0;
      const avgSmash = liveMatches > 0 ? smashes / liveMatches : 0;
      const avgAce = liveMatches > 0 ? aces / liveMatches : 0;
      const avgDefense = liveMatches > 0 ? defenses / liveMatches : 0;
      const avgFaults = liveMatches > 0 ? serveErrors / liveMatches : 0;

      return {
        player: p,
        edges,
        nets,
        luckPoints,
        stylePoints,
        smashes,
        aces,
        defenses,
        serveErrors,
        liveMatches,
        avgLuck,
        avgStyle,
        avgSmash,
        avgAce,
        avgDefense,
        avgFaults,
      };
    });
  }, [players, matches]);

  const totalLiveMatches = useMemo(() => matches.filter((m) => !!m.stats).length, [matches]);

  const luckyRanking = useMemo(
    () =>
      [...liveStatsByPlayer]
        .filter((a) => a.liveMatches > 0)
        .sort((a, b) => b.avgLuck - a.avgLuck || b.luckPoints - a.luckPoints),
    [liveStatsByPlayer]
  );
  const defenseRanking = useMemo(
    () =>
      [...liveStatsByPlayer]
        .filter((a) => a.liveMatches > 0)
        .sort((a, b) => b.avgDefense - a.avgDefense || b.defenses - a.defenses),
    [liveStatsByPlayer]
  );
  const aceRanking = useMemo(
    () =>
      [...liveStatsByPlayer]
        .filter((a) => a.liveMatches > 0)
        .sort((a, b) => b.avgAce - a.avgAce || b.aces - a.aces),
    [liveStatsByPlayer]
  );
  const styleRanking = useMemo(
    () =>
      [...liveStatsByPlayer]
        .filter((a) => a.liveMatches > 0)
        .sort((a, b) => b.avgStyle - a.avgStyle || b.stylePoints - a.stylePoints),
    [liveStatsByPlayer]
  );
  const smashRanking = useMemo(
    () =>
      [...liveStatsByPlayer]
        .filter((a) => a.liveMatches > 0)
        .sort((a, b) => b.avgSmash - a.avgSmash || b.smashes - a.smashes),
    [liveStatsByPlayer]
  );
  const mostFaultsRanking = useMemo(
    () =>
      [...liveStatsByPlayer]
        .filter((a) => a.liveMatches > 0)
        .sort((a, b) => b.avgFaults - a.avgFaults || b.serveErrors - a.serveErrors),
    [liveStatsByPlayer]
  );

  const wallStreetRanking = useMemo(() => {
    return [...players]
      .map((p) => {
        const coins = p.coins !== undefined ? p.coins : STARTING_COINS;
        const betsWon = p.betsWon || 0;
        const betsLost = p.betsLost || 0;
        const totalBets = betsWon + betsLost;
        const winRate = totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0;
        const coinsWon = p.coinsWonOnBets || 0;

        let investorStatus = { label: '🪙 Scommettitore', color: '#94A3B8' };
        if (coins >= 400) {
          investorStatus = { label: '🎩 Magnate', color: '#FACC15' };
        } else if (coins >= 250) {
          investorStatus = { label: '💼 Broker', color: '#38BDF8' };
        } else if (coins <= 30) {
          investorStatus = { label: '📉 Bancarotta', color: '#EF4444' };
        }

        return {
          player: p,
          coins,
          betsWon,
          betsLost,
          totalBets,
          winRate,
          coinsWon,
          investorStatus,
        };
      })
      .sort((a, b) => b.coins - a.coins || b.coinsWon - a.coinsWon);
  }, [players]);

  // ==========================================
  // LOGICA SUB-TAB 2: PERSONALI (ANALISI DETTAGLIATA)
  // ==========================================
  const personalAnalysis = useMemo(() => {
    if (!activePlayer) return null;

    const p = activePlayer;
    const pMatches = matches.filter((m) => m.player1Id === p.id || m.player2Id === p.id);
    const totalMatches = pMatches.length;
    const wins = p.wins;
    const losses = p.losses;
    const winRate = getWinRate(wins, losses);
    const streak = getStreakDisplay(p.currentStreak);
    const milestone = getPlayerActiveMilestone(p.elo);
    const coins = p.coins !== undefined ? p.coins : STARTING_COINS;
    const trophies = getPlayerTrophies(p.id, players, matches);

    // Live Stats personali
    let edges = 0;
    let nets = 0;
    let luckPoints = 0;
    let stylePoints = 0;
    let smashes = 0;
    let aces = 0;
    let defenses = 0;
    let serveErrors = 0;
    let liveCount = 0;

    // Conceded stats (da avversari)
    let acesConceded = 0;
    let smashesConceded = 0;

    pMatches.forEach((m) => {
      if (m.stats) {
        liveCount += 1;
        if (m.player1Id === p.id) {
          edges += m.stats.player1Edges || 0;
          nets += m.stats.player1Nets || 0;
          luckPoints +=
            m.stats.player1LuckPoints ?? ((m.stats.player1Edges || 0) + (m.stats.player1Nets || 0));
          stylePoints += m.stats.player1StylePoints || 0;
          smashes += m.stats.player1Smashes || 0;
          aces += m.stats.player1Aces || 0;
          defenses += m.stats.player1Defenses || 0;
          serveErrors += m.stats.player1ServeErrors || 0;
          acesConceded += m.stats.player2Aces || 0;
          smashesConceded += m.stats.player2Smashes || 0;
        } else {
          edges += m.stats.player2Edges || 0;
          nets += m.stats.player2Nets || 0;
          luckPoints +=
            m.stats.player2LuckPoints ?? ((m.stats.player2Edges || 0) + (m.stats.player2Nets || 0));
          stylePoints += m.stats.player2StylePoints || 0;
          smashes += m.stats.player2Smashes || 0;
          aces += m.stats.player2Aces || 0;
          defenses += m.stats.player2Defenses || 0;
          serveErrors += m.stats.player2ServeErrors || 0;
          acesConceded += m.stats.player1Aces || 0;
          smashesConceded += m.stats.player1Smashes || 0;
        }
      }
    });

    if (luckPoints === 0 && (edges > 0 || nets > 0)) {
      luckPoints = edges + nets;
    }

    // Matchup con altri giocatori (Testa a Testa)
    const opponents = players.filter((other) => other.id !== p.id);
    const matchups = opponents.map((opp) => {
      const oppMatches = pMatches.filter(
        (m) => (m.player1Id === opp.id && m.player2Id === p.id) || (m.player2Id === opp.id && m.player1Id === p.id)
      );
      const wonAgainst = oppMatches.filter((m) => m.winnerId === p.id).length;
      const lostAgainst = oppMatches.length - wonAgainst;
      const rate = oppMatches.length > 0 ? Math.round((wonAgainst / oppMatches.length) * 100) : 0;
      return {
        opponent: opp,
        total: oppMatches.length,
        won: wonAgainst,
        lost: lostAgainst,
        winRate: rate,
      };
    });

    // Bestia Nera (avversario con più vittorie su p o peggior % con almeno 1 partita)
    const playedMatchups = matchups.filter((m) => m.total > 0);
    const nemesis = [...playedMatchups].sort((a, b) => b.lost - a.lost || a.winRate - b.winRate)[0] || null;
    const favoriteVictim = [...playedMatchups].sort((a, b) => b.won - a.won || b.winRate - a.winRate)[0] || null;

    // Consigli del Coach AI
    const coachTips: { icon: string; title: string; text: string; type: 'strength' | 'weakness' | 'tip' }[] = [];

    if (liveCount > 0 && serveErrors / liveCount >= 1.5) {
      coachTips.push({
        icon: '⚠️',
        title: 'Attenzione al Servizio',
        text: `Commetti circa ${(serveErrors / liveCount).toFixed(1)} falli a partita. Punta sulla sicurezza piuttosto che forzare sempre l'ace!`,
        type: 'weakness',
      });
    }

    if (liveCount > 0 && stylePoints / liveCount >= 2.0) {
      coachTips.push({
        icon: '✨',
        title: 'Pura Magia & Stile',
        text: 'I tuoi punti di classe mandano in tilt gli avversari. Continua a cercare giocate spettacolari per demoralizzarli!',
        type: 'strength',
      });
    }

    if (liveCount > 0 && smashes / liveCount >= 2.0) {
      coachTips.push({
        icon: '💥',
        title: 'Schiacciatore Letale',
        text: 'Quando ti alzano la palla non perdoni. Cerca palleggi profondi per forzare l\'avversario ad alzare pallonetti facili.',
        type: 'strength',
      });
    }

    if (liveCount > 0 && defenses / liveCount >= 1.5) {
      coachTips.push({
        icon: '🛡️',
        title: 'Muro di Gomma',
        text: 'Ottima tenuta difensiva. Sfianca i rivali con scambi prolungati, l\'errore prima o poi arriva.',
        type: 'strength',
      });
    }

    if (nemesis && nemesis.lost >= 2) {
      coachTips.push({
        icon: '👿',
        title: `Contromisura per ${nemesis.opponent.name}`,
        text: `È la tua bestia nera (${nemesis.lost} sconfitte). Prova a variare ritmo e fargli toccare meno il suo colpo forte.`,
        type: 'tip',
      });
    }

    if (coachTips.length === 0) {
      coachTips.push({
        icon: '🏓',
        title: 'Continua a Giocare',
        text: 'Gioca più partite live per permettere all\'algoritmo di analizzare dettagliatamente il tuo stile!',
        type: 'tip',
      });
    }

    return {
      player: p,
      totalMatches,
      wins,
      losses,
      winRate,
      streak,
      milestone,
      coins,
      trophies,
      liveCount,
      edges,
      nets,
      luckPoints,
      stylePoints,
      smashes,
      aces,
      defenses,
      serveErrors,
      acesConceded,
      smashesConceded,
      matchups,
      nemesis: nemesis && nemesis.total > 0 ? nemesis : null,
      favoriteVictim: favoriteVictim && favoriteVictim.total > 0 && favoriteVictim.won > 0 ? favoriteVictim : null,
      coachTips,
    };
  }, [activePlayer, players, matches]);

  // ==========================================
  // LOGICA SUB-TAB 3: STORICO PARTITE
  // ==========================================
  const handleUndo = () => {
    const confirmMessage =
      'Sei sicuro di voler annullare l\'ultimo match? I punti Elo, le monete e le scommesse verranno ripristinati esattamente com\'erano prima.';

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        undoLastMatch();
      }
    } else {
      Alert.alert('Annulla Ultimo Match', confirmMessage, [
        { text: 'No, tieni', style: 'cancel' },
        {
          text: 'Sì, annulla',
          style: 'destructive',
          onPress: () => undoLastMatch(),
        },
      ]);
    }
  };

  const handleQuickReact = (matchId: string, emoji: string) => {
    if (associatedPlayer) {
      addReaction(matchId, emoji, associatedPlayer.id);
    } else if (players.length > 0) {
      addReaction(matchId, emoji, players[0].id);
    }
  };

  const filteredMatches = useMemo(() => {
    const now = Date.now();
    return matches.filter((m) => {
      if (historyFilter === '3days') {
        const diff = now - m.timestamp;
        return diff <= 3 * 24 * 60 * 60 * 1000;
      }
      if (historyFilter === '7days') {
        const diff = now - m.timestamp;
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      if (historyFilter === 'mine') {
        const targetId = associatedPlayer?.id || activePlayer?.id;
        if (!targetId) return true;
        return m.player1Id === targetId || m.player2Id === targetId;
      }
      return true;
    });
  }, [matches, historyFilter, associatedPlayer, activePlayer]);

  return (
    <View style={styles.screen}>
      {/* 3-WAY SUB-TAB SELECTOR */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'globale' && styles.subTabItemActive]}
          onPress={() => {
            soundEffects.playButtonTap();
            setActiveSubTab('globale');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, activeSubTab === 'globale' && styles.subTabTextActive]}>
            🌐 Globale
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'personali' && styles.subTabItemActive]}
          onPress={() => {
            soundEffects.playButtonTap();
            setActiveSubTab('personali');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, activeSubTab === 'personali' && styles.subTabTextActive]}>
            👤 Personali
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'storico' && styles.subTabItemActive]}
          onPress={() => {
            soundEffects.playButtonTap();
            setActiveSubTab('storico');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, activeSubTab === 'storico' && styles.subTabTextActive]}>
            📜 Storico ({matches.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* 1. SEZIONE GLOBALE */}
        {/* ========================================================= */}
        {activeSubTab === 'globale' && (
          <View>
            {/* Snapshot Rapido: Chi è On Fire vs Chi affonda */}
            {matches.length >= 2 && onFire && inTrouble && (
              <View style={styles.spotlightRow}>
                {/* Card On Fire */}
                <View style={[styles.spotlightCard, styles.spotlightCardFire]}>
                  <View style={styles.spotlightHeader}>
                    <Text style={styles.spotlightEmoji}>🔥</Text>
                    <Text style={styles.spotlightTitle}>ON FIRE</Text>
                  </View>
                  <Text style={styles.spotlightPlayer}>
                    {onFire.player.avatar} {onFire.player.name}
                  </Text>
                  <Text style={styles.spotlightDetail}>
                    {onFire.recentWins} vittorie negli ultimi {onFire.recentMatchesCount} match!
                  </Text>
                </View>

                {/* Card In Crisi */}
                <View style={[styles.spotlightCard, styles.spotlightCardIce]}>
                  <View style={styles.spotlightHeader}>
                    <Text style={styles.spotlightEmoji}>🥶</Text>
                    <Text style={styles.spotlightTitle}>IN CRISI</Text>
                  </View>
                  <Text style={styles.spotlightPlayer}>
                    {inTrouble.player.avatar} {inTrouble.player.name}
                  </Text>
                  <Text style={styles.spotlightDetail}>
                    {inTrouble.recentMatchesCount - inTrouble.recentWins} sconfitte negli ultimi{' '}
                    {inTrouble.recentMatchesCount} match...
                  </Text>
                </View>
              </View>
            )}

            {/* SEZIONE STATISTICHE SEGNAPUNTI LIVE */}
            <View style={styles.liveStatsCard}>
              <View style={styles.liveStatsHeaderRow}>
                <Text style={styles.sectionHeaderIcon}>🏓</Text>
                <Text style={styles.sectionHeaderTitle}>Statistiche Live Game</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>{totalLiveMatches} match live</Text>
                </View>
              </View>

              {totalLiveMatches === 0 ? (
                <View style={styles.emptyLiveBox}>
                  <Text style={styles.emptyLiveIcon}>🎲</Text>
                  <Text style={styles.emptyLiveTitle}>Nessun match con Segnapunti Live</Text>
                  <Text style={styles.emptyLiveSub}>
                    Usa la modalità "🏓 Segnapunti Live" per segnare spigoli, net, schiacciate ed errori
                    in tempo reale e sbloccare queste classifiche!
                  </Text>
                </View>
              ) : (
                <>
                  {/* Trofei Speciali & Meme Awards */}
                  <Text style={styles.specialTrophiesSectionTitle}>
                    🏆 Trofei Speciali & Meme Awards
                  </Text>
                  <View style={styles.specialTrophiesGrid}>
                    {specialTrophies.map((trophy) => (
                      <View key={trophy.id} style={styles.specialTrophyCard}>
                        <View style={styles.specialTrophyHeader}>
                          <Text style={styles.specialTrophyIcon}>{trophy.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.specialTrophyTitle}>{trophy.title}</Text>
                            <Text style={styles.specialTrophyMemeSub}>{trophy.memeSubtitle}</Text>
                          </View>
                        </View>

                        <View style={styles.specialTrophyWinnerRow}>
                          <Text style={styles.specialTrophyWinnerAvatar}>
                            {trophy.winnerPlayerAvatar || '👤'}
                          </Text>
                          <Text style={styles.specialTrophyWinnerName} numberOfLines={1}>
                            {trophy.winnerPlayerName || 'Non ancora assegnato'}
                          </Text>
                        </View>

                        <View style={styles.specialTrophyBadgeRow}>
                          <Text style={styles.specialTrophyStatBadge}>{trophy.statValue}</Text>
                        </View>

                        <Text style={styles.specialTrophyDesc}>{trophy.description}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Classifica Dettagliata Fortuna (Spigoli + Net) */}
                  <View style={styles.tableCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.tableTitle}>🍀 Classifica "Punti Fortuna" (Net + Spigoli)</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>Media per match live</Text>
                    </View>
                    {luckyRanking.map((item, index) => (
                      <View key={item.player.id} style={styles.tableRow}>
                        <Text style={styles.rankNum}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                        </Text>
                        <Text style={styles.tableAvatar}>{item.player.avatar}</Text>
                        <Text style={styles.tableName} numberOfLines={1}>
                          {item.player.name}
                        </Text>
                        <View style={styles.tableStatsBreakdown}>
                          <Text style={styles.tableStatSub}>
                            🎲 {item.edges} • 🕸️ {item.nets} ({item.liveMatches} live)
                          </Text>
                        </View>
                        <View style={styles.tableScoreBadge}>
                          <Text style={styles.tableScoreText}>
                            {item.liveMatches > 0 ? `${item.avgLuck.toFixed(1)}/m` : '0/m'}
                          </Text>
                          <Text style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center' }}>
                            ({item.luckPoints} tot)
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Classifiche Dettagliate Specialità Live */}
                  <View style={[styles.splitTablesRow, { marginBottom: 10 }]}>
                    {/* Difese */}
                    <View style={[styles.miniTableCard, { flex: 1 }]}>
                      <Text style={styles.miniTableTitle}>🛡️ Difese d'Acciaio</Text>
                      {defenseRanking.map((item, index) => (
                        <View key={item.player.id} style={styles.miniTableRow}>
                          <Text style={styles.miniRank}>
                            {index === 0 && item.defenses > 0 ? '🛡️' : `${index + 1}`}
                          </Text>
                          <Text style={styles.miniName} numberOfLines={1}>
                            {item.player.name}
                          </Text>
                          <Text style={styles.miniValueDefense}>
                            {item.liveMatches > 0 ? `${item.avgDefense.toFixed(1)}/m (${item.defenses})` : '0 🛡️'}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Ace Vincenti */}
                    <View style={[styles.miniTableCard, { flex: 1 }]}>
                      <Text style={styles.miniTableTitle}>⚡ Ace Vincenti</Text>
                      {aceRanking.map((item, index) => (
                        <View key={item.player.id} style={styles.miniTableRow}>
                          <Text style={styles.miniRank}>
                            {index === 0 && item.aces > 0 ? '⚡' : `${index + 1}`}
                          </Text>
                          <Text style={styles.miniName} numberOfLines={1}>
                            {item.player.name}
                          </Text>
                          <Text style={styles.miniValueAce}>
                            {item.liveMatches > 0 ? `${item.avgAce.toFixed(1)}/m (${item.aces})` : '0 ⚡'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.splitTablesRow, { marginBottom: 10 }]}>
                    {/* Punti Stile */}
                    <View style={[styles.miniTableCard, { flex: 1 }]}>
                      <Text style={styles.miniTableTitle}>✨ Punti Stile</Text>
                      {styleRanking.map((item, index) => (
                        <View key={item.player.id} style={styles.miniTableRow}>
                          <Text style={styles.miniRank}>
                            {index === 0 && item.stylePoints > 0 ? '✨' : `${index + 1}`}
                          </Text>
                          <Text style={styles.miniName} numberOfLines={1}>
                            {item.player.name}
                          </Text>
                          <Text style={styles.miniValueStyle}>
                            {item.liveMatches > 0 ? `${item.avgStyle.toFixed(1)}/m (${item.stylePoints})` : '0 ✨'}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Schiacciate */}
                    <View style={[styles.miniTableCard, { flex: 1 }]}>
                      <Text style={styles.miniTableTitle}>💥 Schiacciate</Text>
                      {smashRanking.map((item, index) => (
                        <View key={item.player.id} style={styles.miniTableRow}>
                          <Text style={styles.miniRank}>
                            {index === 0 && item.smashes > 0 ? '👑' : `${index + 1}`}
                          </Text>
                          <Text style={styles.miniName} numberOfLines={1}>
                            {item.player.name}
                          </Text>
                          <Text style={styles.miniValue}>
                            {item.liveMatches > 0 ? `${item.avgSmash.toFixed(1)}/m (${item.smashes})` : '0 💥'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.splitTablesRow, { marginBottom: 10 }]}>
                    <View style={[styles.miniTableCard, { flex: 1 }]}>
                      <Text style={styles.miniTableTitle}>❌ Errori al Servizio</Text>
                      {mostFaultsRanking.map((item, index) => (
                        <View key={item.player.id} style={styles.miniTableRow}>
                          <Text style={styles.miniRank}>
                            {index === 0 && item.serveErrors > 0 ? '🔨' : `${index + 1}`}
                          </Text>
                          <Text style={styles.miniName} numberOfLines={1}>
                            {item.player.name}
                          </Text>
                          <Text style={styles.miniValueFault}>
                            {item.liveMatches > 0 ? `${item.avgFaults.toFixed(1)}/m (${item.serveErrors})` : '0 ❌'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* SEZIONE WALL STREET ARENA & SCOMMESSE */}
            <View
              style={[
                styles.tableCard,
                {
                  marginHorizontal: 16,
                  marginTop: 14,
                  borderColor: 'rgba(250, 204, 21, 0.25)',
                  backgroundColor: 'rgba(250, 204, 21, 0.04)',
                },
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>🏛️</Text>
                  <Text style={[styles.tableTitle, { marginBottom: 0, color: '#FDE047' }]}>
                    Wall Street Arena • I Più Ricchi
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: 'rgba(250, 204, 21, 0.15)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(250, 204, 21, 0.3)',
                  }}
                >
                  <Text style={{ color: '#FDE047', fontSize: 10, fontWeight: '800' }}>
                    LUL Coins 🪙
                  </Text>
                </View>
              </View>

              {wallStreetRanking.map((item, index) => (
                <View key={item.player.id} style={styles.tableRow}>
                  <Text style={styles.rankNum}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                  </Text>
                  <Text style={styles.tableAvatar}>{item.player.avatar}</Text>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.tableName} numberOfLines={1}>
                        {item.player.name}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          borderRadius: 4,
                          backgroundColor: `${item.investorStatus.color}22`,
                          borderWidth: 1,
                          borderColor: `${item.investorStatus.color}44`,
                        }}
                      >
                        <Text
                          style={{
                            color: item.investorStatus.color,
                            fontSize: 9,
                            fontWeight: '800',
                          }}
                        >
                          {item.investorStatus.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: Colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                      Bet: {item.betsWon}V/{item.betsLost}P ({item.winRate}%) • Guadagno:{' '}
                      {item.coinsWon >= 0 ? `+${item.coinsWon}` : item.coinsWon} 🪙
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tableScoreBadge,
                      {
                        backgroundColor: 'rgba(250, 204, 21, 0.15)',
                        borderColor: 'rgba(250, 204, 21, 0.4)',
                      },
                    ]}
                  >
                    <Text style={[styles.tableScoreText, { color: '#FACC15' }]}>🪙 {item.coins}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* SEZIONE TROFEI SPECIALI MODIFICATORI */}
            <View style={styles.modifierStatsCard}>
              <Text style={styles.modStatsTitle}>🏅 Trofei Speciali Modificatori</Text>
              <View style={styles.trophyGrid}>
                <View style={styles.trophyItem}>
                  <Text style={styles.trophyIcon}>🌪️</Text>
                  <Text style={styles.trophyName}>Re del Vento</Text>
                  <Text style={styles.trophyHolder}>
                    {windLeader
                      ? `${windLeader.player.avatar} ${windLeader.player.name} (${windLeader.wins}V)`
                      : 'Nessuno ancora'}
                  </Text>
                </View>

                <View style={styles.trophyItem}>
                  <Text style={styles.trophyIcon}>🪵</Text>
                  <Text style={styles.trophyName}>Mago Racchetta Prestata</Text>
                  <Text style={styles.trophyHolder}>
                    {borrowedRacketLeader
                      ? `${borrowedRacketLeader.player.avatar} ${borrowedRacketLeader.player.name} (${borrowedRacketLeader.wins}V)`
                      : 'Nessuno ancora'}
                  </Text>
                </View>

                <View style={styles.trophyItem}>
                  <Text style={styles.trophyIcon}>🍺</Text>
                  <Text style={styles.trophyName}>Campione della Birra</Text>
                  <Text style={styles.trophyHolder}>
                    {beerLeader
                      ? `${beerLeader.player.avatar} ${beerLeader.player.name} (${beerLeader.wins}V)`
                      : 'Nessuno ancora'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Matrice Scontri Diretti */}
            <WinLossChart players={players} matches={matches} />
          </View>
        )}

        {/* ========================================================= */}
        {/* 2. SEZIONE PERSONALI (COACH & ANALISI GIOCATORE) */}
        {/* ========================================================= */}
        {activeSubTab === 'personali' && (
          <View style={styles.personalContainer}>
            {/* HORIZONTAL PLAYER SELECTOR */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playerSelectorList}
            >
              {players.map((p) => {
                const isSelected = p.id === selectedPlayerId;
                const isMe = p.id === associatedPlayer?.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      soundEffects.playButtonTap();
                      setSelectedPlayerId(p.id);
                    }}
                    style={[
                      styles.playerChip,
                      isSelected && styles.playerChipActive,
                      isSelected && { borderColor: p.color || Colors.primary },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.playerChipAvatar}>{p.avatar}</Text>
                    <Text
                      style={[
                        styles.playerChipName,
                        isSelected && { color: p.color || Colors.primary, fontWeight: '900' },
                      ]}
                      numberOfLines={1}
                    >
                      {p.name} {isMe ? '👤' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {personalAnalysis ? (
              <View style={styles.personalCard}>
                {/* Header Profilo & Elo */}
                <View
                  style={[
                    styles.personalHeader,
                    { borderColor: personalAnalysis.player.color || Colors.primary },
                  ]}
                >
                  <View style={styles.personalHeaderTop}>
                    <View
                      style={[
                        styles.personalAvatarCircle,
                        { borderColor: personalAnalysis.player.color || Colors.primary },
                      ]}
                    >
                      <Text style={styles.personalAvatar}>{personalAnalysis.player.avatar}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[
                            styles.personalName,
                            { color: personalAnalysis.player.color || Colors.primary },
                          ]}
                        >
                          {personalAnalysis.player.name}
                        </Text>
                        {personalAnalysis.milestone && (
                          <View
                            style={[
                              styles.milestonePill,
                              {
                                borderColor: personalAnalysis.milestone.color,
                                backgroundColor: `${personalAnalysis.milestone.color}15`,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: personalAnalysis.milestone.color,
                                fontSize: 9,
                                fontWeight: '800',
                              }}
                            >
                              {personalAnalysis.milestone.badge}
                            </Text>
                          </View>
                        )}
                      </View>

                      {personalAnalysis.player.equippedTitle && (
                        <View style={styles.equippedTitlePill}>
                          <Text style={styles.equippedTitleText}>
                            {personalAnalysis.player.equippedTitle}
                          </Text>
                        </View>
                      )}

                      <Text style={styles.personalSub}>
                        {personalAnalysis.wins}V - {personalAnalysis.losses}P • {personalAnalysis.winRate}% Win Rate
                      </Text>
                    </View>

                    <View style={styles.personalEloBox}>
                      <Text style={styles.personalEloValue}>{personalAnalysis.player.elo}</Text>
                      <Text style={styles.personalEloLabel}>PUNTI ELO</Text>
                    </View>
                  </View>

                  {/* Badge Striscia & Coins */}
                  <View style={styles.personalBadgesRow}>
                    <View style={styles.personalBadgeItem}>
                      <Text style={styles.personalBadgeLabel}>Striscia:</Text>
                      <Text style={styles.personalBadgeValue}>
                        {personalAnalysis.streak.emoji} {personalAnalysis.streak.text}
                      </Text>
                    </View>

                    <View style={styles.personalBadgeItem}>
                      <Text style={styles.personalBadgeLabel}>Portafoglio:</Text>
                      <Text style={[styles.personalBadgeValue, { color: '#FACC15' }]}>
                        🪙 {personalAnalysis.coins} LUL
                      </Text>
                    </View>
                  </View>
                </View>

                {/* CONSIGLI DEL COACH AI */}
                <View style={styles.coachSection}>
                  <Text style={styles.coachSectionTitle}>🧠 Consigli del Coach AI</Text>
                  {personalAnalysis.coachTips.map((tip, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.coachTipCard,
                        tip.type === 'strength' && styles.coachTipStrength,
                        tip.type === 'weakness' && styles.coachTipWeakness,
                      ]}
                    >
                      <Text style={styles.coachTipIcon}>{tip.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.coachTipTitle}>{tip.title}</Text>
                        <Text style={styles.coachTipText}>{tip.text}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* PUNTI DI FORZA & SPECIALITÀ (SUPERPOTERI) */}
                <View style={styles.metricSection}>
                  <Text style={styles.metricSectionTitle}>⚡ Superpoteri & Punti di Forza</Text>
                  <View style={styles.metricGrid}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricIcon}>✨</Text>
                      <Text style={styles.metricValue}>{personalAnalysis.stylePoints}</Text>
                      <Text style={styles.metricLabel}>Punti Stile</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricIcon}>💥</Text>
                      <Text style={styles.metricValue}>{personalAnalysis.smashes}</Text>
                      <Text style={styles.metricLabel}>Schiacciate</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricIcon}>⚡</Text>
                      <Text style={styles.metricValue}>{personalAnalysis.aces}</Text>
                      <Text style={styles.metricLabel}>Ace Vincenti</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricIcon}>🛡️</Text>
                      <Text style={styles.metricValue}>{personalAnalysis.defenses}</Text>
                      <Text style={styles.metricLabel}>Difese</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricIcon}>🍀</Text>
                      <Text style={styles.metricValue}>{personalAnalysis.luckPoints}</Text>
                      <Text style={styles.metricLabel}>Net & Spigoli</Text>
                    </View>
                  </View>
                </View>

                {/* PUNTI CRITICI & VULNERABILITÀ */}
                <View style={styles.metricSection}>
                  <Text style={styles.metricSectionTitle}>⚠️ Aree da Migliorare & Vulnerabilità</Text>
                  <View style={styles.metricGrid}>
                    <View style={[styles.metricBox, styles.metricBoxWarning]}>
                      <Text style={styles.metricIcon}>❌</Text>
                      <Text style={[styles.metricValue, { color: '#EF4444' }]}>
                        {personalAnalysis.serveErrors}
                      </Text>
                      <Text style={styles.metricLabel}>Falli al Servizio</Text>
                    </View>
                    <View style={[styles.metricBox, styles.metricBoxWarning]}>
                      <Text style={styles.metricIcon}>⚡</Text>
                      <Text style={[styles.metricValue, { color: '#F97316' }]}>
                        {personalAnalysis.acesConceded}
                      </Text>
                      <Text style={styles.metricLabel}>Ace Subiti</Text>
                    </View>
                    <View style={[styles.metricBox, styles.metricBoxWarning]}>
                      <Text style={styles.metricIcon}>💥</Text>
                      <Text style={[styles.metricValue, { color: '#F43F5E' }]}>
                        {personalAnalysis.smashesConceded}
                      </Text>
                      <Text style={styles.metricLabel}>Smash Subiti</Text>
                    </View>
                  </View>
                </View>

                {/* TESTA A TESTA & RIVALITÀ */}
                <View style={styles.rivalrySection}>
                  <Text style={styles.rivalrySectionTitle}>⚔️ Rivalità & Bestie Nere</Text>
                  <View style={styles.rivalryHighlightsRow}>
                    {personalAnalysis.nemesis ? (
                      <View style={[styles.rivalryHighlightCard, styles.rivalryNemesis]}>
                        <Text style={styles.rivalryHighlightEmoji}>👿</Text>
                        <Text style={styles.rivalryHighlightTitle}>Bestia Nera</Text>
                        <Text style={styles.rivalryHighlightPlayer}>
                          {personalAnalysis.nemesis.opponent.avatar}{' '}
                          {personalAnalysis.nemesis.opponent.name}
                        </Text>
                        <Text style={styles.rivalryHighlightDetail}>
                          {personalAnalysis.nemesis.won}V - {personalAnalysis.nemesis.lost}P (
                          {personalAnalysis.nemesis.winRate}%)
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.rivalryHighlightCard}>
                        <Text style={styles.rivalryHighlightEmoji}>🤝</Text>
                        <Text style={styles.rivalryHighlightTitle}>Nessuna Bestia Nera</Text>
                        <Text style={styles.rivalryHighlightDetail}>Nessun rivale ti domina!</Text>
                      </View>
                    )}

                    {personalAnalysis.favoriteVictim ? (
                      <View style={[styles.rivalryHighlightCard, styles.rivalryVictim]}>
                        <Text style={styles.rivalryHighlightEmoji}>🎯</Text>
                        <Text style={styles.rivalryHighlightTitle}>Vittima Preferita</Text>
                        <Text style={styles.rivalryHighlightPlayer}>
                          {personalAnalysis.favoriteVictim.opponent.avatar}{' '}
                          {personalAnalysis.favoriteVictim.opponent.name}
                        </Text>
                        <Text style={styles.rivalryHighlightDetail}>
                          {personalAnalysis.favoriteVictim.won}V -{' '}
                          {personalAnalysis.favoriteVictim.lost}P (
                          {personalAnalysis.favoriteVictim.winRate}%)
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.rivalryHighlightCard}>
                        <Text style={styles.rivalryHighlightEmoji}>⚔️</Text>
                        <Text style={styles.rivalryHighlightTitle}>Nessuna Vittima</Text>
                        <Text style={styles.rivalryHighlightDetail}>Equilibrio perfetto!</Text>
                      </View>
                    )}
                  </View>

                  {/* Tabella Scontri con tutti */}
                  <View style={styles.matchupTable}>
                    <Text style={styles.matchupTableTitle}>Tutti gli Scontri Diretti:</Text>
                    {personalAnalysis.matchups.map((m) => (
                      <View key={m.opponent.id} style={styles.matchupTableRow}>
                        <Text style={styles.matchupAvatar}>{m.opponent.avatar}</Text>
                        <Text style={styles.matchupName} numberOfLines={1}>
                          {m.opponent.name}
                        </Text>
                        <Text style={styles.matchupRecord}>
                          {m.won}V - {m.lost}P ({m.total} match)
                        </Text>
                        <View
                          style={[
                            styles.matchupWinBadge,
                            {
                              backgroundColor:
                                m.total === 0
                                  ? 'rgba(255,255,255,0.06)'
                                  : m.winRate >= 50
                                  ? 'rgba(52, 211, 153, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color:
                                m.total === 0
                                  ? Colors.textMuted
                                  : m.winRate >= 50
                                  ? '#34D399'
                                  : '#EF4444',
                              fontSize: 10,
                              fontWeight: '800',
                            }}
                          >
                            {m.total === 0 ? '-' : `${m.winRate}%`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* ========================================================= */}
        {/* 3. SEZIONE STORICO PARTITE */}
        {/* ========================================================= */}
        {activeSubTab === 'storico' && (
          <View>
            {/* Filtri Orizzontali */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyFiltersRow}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  historyFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => {
                  soundEffects.playButtonTap();
                  setHistoryFilter('all');
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    historyFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  Tutte ({matches.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  historyFilter === '3days' && styles.filterChipActive,
                ]}
                onPress={() => {
                  soundEffects.playButtonTap();
                  setHistoryFilter('3days');
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    historyFilter === '3days' && styles.filterChipTextActive,
                  ]}
                >
                  Ultimi 3 giorni
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  historyFilter === '7days' && styles.filterChipActive,
                ]}
                onPress={() => {
                  soundEffects.playButtonTap();
                  setHistoryFilter('7days');
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    historyFilter === '7days' && styles.filterChipTextActive,
                  ]}
                >
                  Questa settimana
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  historyFilter === 'mine' && styles.filterChipActive,
                ]}
                onPress={() => {
                  soundEffects.playButtonTap();
                  setHistoryFilter('mine');
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    historyFilter === 'mine' && styles.filterChipTextActive,
                  ]}
                >
                  Solo le mie
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Lista Match */}
            {filteredMatches.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🏓</Text>
                <Text style={styles.emptyTitle}>Nessuna partita trovata!</Text>
                <Text style={styles.emptyText}>
                  {historyFilter === 'all'
                    ? 'Nessuna partita ancora giocata. Vai su Match per registrare la prima sfida!'
                    : 'Nessun match corrisponde al filtro selezionato.'}
                </Text>
              </View>
            ) : (
              filteredMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={players}
                  isLatest={index === 0 && historyFilter === 'all'}
                  onUndo={index === 0 && historyFilter === 'all' ? handleUndo : undefined}
                  onOpenComments={(m) => setActiveCommentsMatch(m)}
                  onQuickReact={handleQuickReact}
                />
              ))
            )}

            {filteredMatches.length > 0 && historyFilter === 'all' && (
              <View style={styles.footerNote}>
                <Text style={styles.footerNoteText}>
                  💡 Puoi annullare solo l'ultimo match registrato per garantire la coerenza dell'Elo.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 12,
    paddingBottom: 40,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 22, 35, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subTabItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  subTabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  subTabTextActive: {
    color: '#FDE047',
    fontWeight: '900',
  },
  spotlightRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  spotlightCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  spotlightCardFire: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  spotlightCardIce: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  spotlightEmoji: {
    fontSize: 14,
  },
  spotlightTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  spotlightPlayer: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  spotlightDetail: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  liveStatsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveStatsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  sectionHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  liveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveBadgeText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyLiveBox: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  emptyLiveIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyLiveTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyLiveSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  specialTrophiesSectionTitle: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 4,
  },
  specialTrophiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  specialTrophyCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  specialTrophyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  specialTrophyIcon: {
    fontSize: 18,
  },
  specialTrophyTitle: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  specialTrophyMemeSub: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  specialTrophyWinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  specialTrophyWinnerAvatar: {
    fontSize: 12,
  },
  specialTrophyWinnerName: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  specialTrophyBadgeRow: {
    marginBottom: 4,
  },
  specialTrophyStatBadge: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
  },
  specialTrophyDesc: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 12,
  },
  tableCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tableTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  rankNum: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    width: 24,
  },
  tableAvatar: {
    fontSize: 16,
    marginRight: 8,
  },
  tableName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  tableStatsBreakdown: {
    flex: 1,
    paddingHorizontal: 8,
  },
  tableStatSub: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  tableScoreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tableScoreText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  splitTablesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniTableCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  miniTableTitle: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  miniTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 4,
  },
  miniRank: {
    fontSize: 10,
    color: Colors.textMuted,
    width: 14,
  },
  miniName: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  miniValue: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  miniValueDefense: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  miniValueAce: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '800',
  },
  miniValueStyle: {
    color: '#A855F7',
    fontSize: 10,
    fontWeight: '800',
  },
  miniValueFault: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: '800',
  },
  modifierStatsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modStatsTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  trophyGrid: {
    gap: 8,
  },
  trophyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  trophyIcon: {
    fontSize: 18,
  },
  trophyName: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  trophyHolder: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
  },
  // SUB-TAB PERSONALI STYLES
  personalContainer: {
    paddingHorizontal: 16,
  },
  playerSelectorList: {
    gap: 8,
    paddingBottom: 12,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  playerChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  playerChipAvatar: {
    fontSize: 16,
  },
  playerChipName: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  personalCard: {
    gap: 12,
  },
  personalHeader: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  personalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  personalAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  personalAvatar: {
    fontSize: 26,
  },
  personalName: {
    fontSize: 16,
    fontWeight: '900',
  },
  milestonePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  equippedTitlePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  equippedTitleText: {
    color: '#FDE047',
    fontSize: 9,
    fontWeight: '800',
  },
  personalSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  personalEloBox: {
    alignItems: 'flex-end',
  },
  personalEloValue: {
    color: '#FDE047',
    fontSize: 22,
    fontWeight: '900',
  },
  personalEloLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personalBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  personalBadgeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  personalBadgeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  personalBadgeValue: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  coachSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 8,
  },
  coachSectionTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  coachTipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  coachTipStrength: {
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  coachTipWeakness: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  coachTipIcon: {
    fontSize: 18,
  },
  coachTipTitle: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  coachTipText: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  metricSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricBoxWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  metricIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  rivalrySection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  rivalrySectionTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  rivalryHighlightsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rivalryHighlightCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  rivalryNemesis: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rivalryVictim: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  rivalryHighlightEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  rivalryHighlightTitle: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rivalryHighlightPlayer: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 2,
  },
  rivalryHighlightDetail: {
    color: Colors.textSecondary,
    fontSize: 9,
  },
  matchupTable: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
    gap: 6,
  },
  matchupTableTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  matchupTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 6,
  },
  matchupAvatar: {
    fontSize: 14,
  },
  matchupName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  matchupRecord: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  matchupWinBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  // SUB-TAB STORICO STYLES
  historyFiltersRow: {
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FDE047',
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerNote: {
    marginTop: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerNoteText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
