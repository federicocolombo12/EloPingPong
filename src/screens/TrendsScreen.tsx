import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { WinLossChart } from '../components/WinLossChart';
import { useElo } from '../context/EloContext';
import { STARTING_COINS } from '../core/constants';
import { calculateSpecialTrophies } from '../core/trophies';
import { Colors } from '../theme/colors';

export const TrendsScreen: React.FC = () => {
  const { players, matches } = useElo();
  const specialTrophies = calculateSpecialTrophies(players, matches);

  // Calcola il giocatore più caldo (On Fire) e quello in difficoltà (In Caduta)
  const playerStats = players.map((p) => {
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

  const onFire = [...playerStats].sort((a, b) => b.recentWins - a.recentWins)[0];
  const inTrouble = [...playerStats].sort((a, b) => a.recentWins - b.recentWins)[0];

  // Statistiche speciali sui Modificatori
  const getModifierLeader = (filterFn: (m: any, playerId: string) => boolean) => {
    let bestPlayer = null;
    let maxWins = 0;

    for (const p of players) {
      const winsWithMod = matches.filter(
        (m) => m.winnerId === p.id && filterFn(m, p.id)
      ).length;
      if (winsWithMod > maxWins) {
        maxWins = winsWithMod;
        bestPlayer = p;
      }
    }
    return bestPlayer ? { player: bestPlayer, wins: maxWins } : null;
  };

  const windLeader = getModifierLeader((m) => m.environmentalModifiers?.includes('wind'));
  const beerLeader = getModifierLeader(
    (m, pId) =>
      m.environmentalModifiers?.includes('beer') ||
      (m.player1Id === pId && m.player1Modifiers?.includes('beer_in_hand')) ||
      (m.player2Id === pId && m.player2Modifiers?.includes('beer_in_hand'))
  );
  const borrowedRacketLeader = getModifierLeader(
    (m, pId) =>
      (m.player1Id === pId && m.player1Modifiers?.includes('borrowed_racket')) ||
      (m.player2Id === pId && m.player2Modifiers?.includes('borrowed_racket'))
  );

  // Statistiche Live Scoring (Spigoli, Retine, Schiacciate, Errori al Servizio, Difese, Ace, Stile)
  const liveStatsByPlayer = players.map((p) => {
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
          luckPoints += m.stats.player1LuckPoints ?? ((m.stats.player1Edges || 0) + (m.stats.player1Nets || 0));
          stylePoints += m.stats.player1StylePoints || 0;
          smashes += m.stats.player1Smashes || 0;
          aces += m.stats.player1Aces || 0;
          defenses += m.stats.player1Defenses || 0;
          serveErrors += m.stats.player1ServeErrors || 0;
          liveMatches += 1;
        } else if (m.player2Id === p.id) {
          edges += m.stats.player2Edges || 0;
          nets += m.stats.player2Nets || 0;
          luckPoints += m.stats.player2LuckPoints ?? ((m.stats.player2Edges || 0) + (m.stats.player2Nets || 0));
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
    };
  });

  const totalLiveMatches = matches.filter((m) => !!m.stats).length;

  // Classifiche
  const luckyRanking = [...liveStatsByPlayer].sort((a, b) => b.luckPoints - a.luckPoints);
  const defenseRanking = [...liveStatsByPlayer].sort((a, b) => b.defenses - a.defenses);
  const aceRanking = [...liveStatsByPlayer].sort((a, b) => b.aces - a.aces);
  const styleRanking = [...liveStatsByPlayer].sort((a, b) => b.stylePoints - a.stylePoints);
  const smashRanking = [...liveStatsByPlayer].sort((a, b) => b.smashes - a.smashes);
  const mostFaultsRanking = [...liveStatsByPlayer].sort((a, b) => b.serveErrors - a.serveErrors);
  const bestServer = [...liveStatsByPlayer]
    .filter((s) => s.liveMatches > 0)
    .sort((a, b) => a.serveErrors / a.liveMatches - b.serveErrors / b.liveMatches)[0];

  const mostLuckyPlayer = luckyRanking[0]?.luckPoints > 0 ? luckyRanking[0] : null;
  const smashKingPlayer = smashRanking[0]?.smashes > 0 ? smashRanking[0] : null;
  const mostFaultyPlayer = mostFaultsRanking[0]?.serveErrors > 0 ? mostFaultsRanking[0] : null;

  // Classifica Wall Street / Ricchezza & Scommesse
  const wallStreetRanking = [...players]
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Intestazione */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerIcon}>📈</Text>
          <Text style={styles.headerTitle}>TREND & STATISTICHE</Text>
          <Text style={styles.headerIcon}>📉</Text>
        </View>
        <Text style={styles.headerSub}>
          Forma recente, trofei meme, fortuna con retine/spigoli e precisione!
        </Text>
      </View>

      {/* Snapshot Rapido: Chi è On Fire vs Chi affonda */}
      {matches.length >= 2 && (
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
              <Text style={styles.spotlightTitle}>IN CRISI NERA</Text>
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
              Quando giochi, usa la modalità "🏓 Segnapunti Live" per segnare spigoli, net, schiacciate ed errori in tempo reale e sbloccare queste classifiche!
            </Text>
          </View>
        ) : (
          <>
            {/* Trofei Speciali & Meme Awards */}
            <Text style={styles.specialTrophiesSectionTitle}>🏆 Trofei Speciali & Titoli Meme</Text>
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
              <Text style={styles.tableTitle}>🍀 Classifica "Punti Fortuna" (Net + Spigoli)</Text>
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
                      🎲 {item.edges} • 🕸️ {item.nets}
                    </Text>
                  </View>
                  <View style={styles.tableScoreBadge}>
                    <Text style={styles.tableScoreText}>{item.luckPoints} pt</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Classifiche Dettagliate Specialità Live */}
            {/* Riga 1: Difese d'Acciaio & Ace Vincenti */}
            <View style={[styles.splitTablesRow, { marginBottom: 10 }]}>
              {/* Difese */}
              <View style={[styles.miniTableCard, { flex: 1 }]}>
                <Text style={styles.miniTableTitle}>🛡️ Difese d'Acciaio</Text>
                {defenseRanking.map((item, index) => (
                  <View key={item.player.id} style={styles.miniTableRow}>
                    <Text style={styles.miniRank}>{index === 0 && item.defenses > 0 ? '🛡️' : `${index + 1}`}</Text>
                    <Text style={styles.miniName} numberOfLines={1}>
                      {item.player.name}
                    </Text>
                    <Text style={styles.miniValueDefense}>{item.defenses} 🛡️</Text>
                  </View>
                ))}
              </View>

              {/* Ace Vincenti */}
              <View style={[styles.miniTableCard, { flex: 1 }]}>
                <Text style={styles.miniTableTitle}>⚡ Ace Vincenti</Text>
                {aceRanking.map((item, index) => (
                  <View key={item.player.id} style={styles.miniTableRow}>
                    <Text style={styles.miniRank}>{index === 0 && item.aces > 0 ? '⚡' : `${index + 1}`}</Text>
                    <Text style={styles.miniName} numberOfLines={1}>
                      {item.player.name}
                    </Text>
                    <Text style={styles.miniValueAce}>{item.aces} ⚡</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Riga 2: Punti Stile & Schiacciate */}
            <View style={[styles.splitTablesRow, { marginBottom: 10 }]}>
              {/* Punti Stile */}
              <View style={[styles.miniTableCard, { flex: 1 }]}>
                <Text style={styles.miniTableTitle}>✨ Punti Stile</Text>
                {styleRanking.map((item, index) => (
                  <View key={item.player.id} style={styles.miniTableRow}>
                    <Text style={styles.miniRank}>{index === 0 && item.stylePoints > 0 ? '✨' : `${index + 1}`}</Text>
                    <Text style={styles.miniName} numberOfLines={1}>
                      {item.player.name}
                    </Text>
                    <Text style={styles.miniValueStyle}>{item.stylePoints} ✨</Text>
                  </View>
                ))}
              </View>

              {/* Schiacciate */}
              <View style={[styles.miniTableCard, { flex: 1 }]}>
                <Text style={styles.miniTableTitle}>💥 Schiacciate</Text>
                {smashRanking.map((item, index) => (
                  <View key={item.player.id} style={styles.miniTableRow}>
                    <Text style={styles.miniRank}>{index === 0 && item.smashes > 0 ? '👑' : `${index + 1}`}</Text>
                    <Text style={styles.miniName} numberOfLines={1}>
                      {item.player.name}
                    </Text>
                    <Text style={styles.miniValue}>{item.smashes} 💥</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Riga 3: Errori in Battuta */}
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
                    <Text style={styles.miniValueFault}>{item.serveErrors} ❌</Text>
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
          {/* Re del Vento */}
          <View style={styles.trophyItem}>
            <Text style={styles.trophyIcon}>🌪️</Text>
            <Text style={styles.trophyName}>Re del Vento</Text>
            <Text style={styles.trophyHolder}>
              {windLeader
                ? `${windLeader.player.avatar} ${windLeader.player.name} (${windLeader.wins}V)`
                : 'Nessuno ancora'}
            </Text>
          </View>

          {/* Mago Racchetta Prestata */}
          <View style={styles.trophyItem}>
            <Text style={styles.trophyIcon}>🪵</Text>
            <Text style={styles.trophyName}>Mago Racchetta Prestata</Text>
            <Text style={styles.trophyHolder}>
              {borrowedRacketLeader
                ? `${borrowedRacketLeader.player.avatar} ${borrowedRacketLeader.player.name} (${borrowedRacketLeader.wins}V)`
                : 'Nessuno ancora'}
            </Text>
          </View>

          {/* Campione della Birra */}
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

      {/* Grafico e Matrice V/S Completa */}
      <WinLossChart players={players} matches={matches} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingVertical: 14,
    paddingBottom: 40,
  },
  headerBanner: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  spotlightRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  spotlightCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  spotlightCardFire: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  spotlightCardIce: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
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
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  spotlightPlayer: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  spotlightDetail: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  modifierStatsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modStatsTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  trophyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  trophyItem: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  trophyIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  trophyName: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  trophyHolder: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  liveStatsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveStatsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionHeaderIcon: {
    fontSize: 20,
  },
  sectionHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyLiveBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyLiveIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyLiveTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyLiveSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  specialTrophiesSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  specialTrophiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  specialTrophyCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  specialTrophyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  specialTrophyIcon: {
    fontSize: 24,
  },
  specialTrophyTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  specialTrophyMemeSub: {
    color: Colors.textMuted,
    fontSize: 9,
    fontStyle: 'italic',
  },
  specialTrophyWinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  specialTrophyWinnerAvatar: {
    fontSize: 16,
  },
  specialTrophyWinnerName: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  specialTrophyBadgeRow: {
    marginBottom: 6,
  },
  specialTrophyStatBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  specialTrophyDesc: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  tableCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankNum: {
    fontSize: 14,
    width: 28,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  tableAvatar: {
    fontSize: 18,
    marginRight: 8,
  },
  tableName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  tableStatsBreakdown: {
    marginRight: 10,
  },
  tableStatSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tableScoreBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tableScoreText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '900',
  },
  splitTablesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniTableCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  miniTableTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  miniTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  miniRank: {
    fontSize: 12,
    width: 22,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  miniName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  miniValue: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800',
  },
  miniValueDefense: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '800',
  },
  miniValueAce: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '800',
  },
  miniValueStyle: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '800',
  },
  miniValueFault: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
  },
});
