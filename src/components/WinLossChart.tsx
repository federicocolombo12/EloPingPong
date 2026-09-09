import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Match, Player } from '../core/types';
import { Colors } from '../theme/colors';

interface WinLossChartProps {
  players: Player[];
  matches: Match[];
}

export const WinLossChart: React.FC<WinLossChartProps> = ({ players, matches }) => {
  // Calcolo delle ultime partite per ogni giocatore (fino a 10 match recenti)
  const getPlayerRecentResults = (playerId: string, limit: number = 10) => {
    const playerMatches = matches.filter(
      (m) => m.player1Id === playerId || m.player2Id === playerId
    );
    const recent = playerMatches.slice(0, limit);
    return recent.map((m) => ({
      isWin: m.winnerId === playerId,
      matchId: m.id,
      opponentId: m.player1Id === playerId ? m.player2Id : m.player1Id,
      delta: m.eloDelta,
      score: m.player1Id === playerId ? `${m.score1}-${m.score2}` : `${m.score2}-${m.score1}`,
    }));
  };

  return (
    <View style={styles.container}>
      {/* SEZIONE 1: FORMA RECENTE (PALLINI V / S) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📊</Text>
          <View>
            <Text style={styles.sectionTitle}>Forma Recente (Ultimi 10 match)</Text>
            <Text style={styles.sectionSubtitle}>
              🟢 Vittoria (V) • 🔴 Sconfitta (S) (da sinistra = più recente)
            </Text>
          </View>
        </View>

        {players.map((player) => {
          const results = getPlayerRecentResults(player.id, 10);
          const recentWins = results.filter((r) => r.isWin).length;
          const recentLosses = results.length - recentWins;
          const recentWinRate =
            results.length > 0 ? Math.round((recentWins / results.length) * 100) : 0;

          // Valutazione forma
          let formBadge = { text: 'In Valutazione', color: Colors.textMuted, emoji: '⚖️' };
          if (results.length >= 3) {
            if (recentWinRate >= 70) {
              formBadge = { text: 'ON FIRE!', color: '#10B981', emoji: '🔥' };
            } else if (recentWinRate >= 50) {
              formBadge = { text: 'In Forma', color: '#3B82F6', emoji: '📈' };
            } else if (recentWinRate >= 30) {
              formBadge = { text: 'In Calo', color: '#F59E0B', emoji: '📉' };
            } else {
              formBadge = { text: 'Caduta Libera', color: '#EF4444', emoji: '🕳️' };
            }
          }

          return (
            <View key={player.id} style={styles.playerRow}>
              {/* Info Giocatore */}
              <View style={styles.playerHeaderRow}>
                <View style={styles.playerInfoCol}>
                  <Text style={styles.playerAvatar}>{player.avatar}</Text>
                  <Text style={styles.playerName}>{player.name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${formBadge.color}22` }]}>
                  <Text style={[styles.statusBadgeText, { color: formBadge.color }]}>
                    {formBadge.emoji} {formBadge.text} ({recentWins}V - {recentLosses}P)
                  </Text>
                </View>
              </View>

              {/* Pallini V / S */}
              <View style={styles.dotsRow}>
                {results.length === 0 ? (
                  <Text style={styles.noMatchesText}>Nessuna partita registrata</Text>
                ) : (
                  results.map((res, idx) => (
                    <View
                      key={idx}
                      style={[styles.dot, res.isWin ? styles.dotWin : styles.dotLoss]}
                    >
                      <Text style={styles.dotText}>{res.isWin ? 'V' : 'S'}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Barra di rendimento recente */}
              {results.length > 0 && (
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${recentWinRate}%` }]} />
                  <Text style={styles.barLabel}>{recentWinRate}% Vittorie recenti</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* SEZIONE 2: MATRICE SCONTRI DIRETTI TRA I 4 GIOCATORI */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>⚔️</Text>
          <View>
            <Text style={styles.sectionTitle}>Scontri Diretti (Bilancio H2H)</Text>
            <Text style={styles.sectionSubtitle}>
              Chi batte chi tra i 4 rivali
            </Text>
          </View>
        </View>

        <View style={styles.h2hList}>
          {getPairCombinations(players).map(({ p1, p2 }) => {
            const pairMatches = matches.filter(
              (m) =>
                (m.player1Id === p1.id && m.player2Id === p2.id) ||
                (m.player1Id === p2.id && m.player2Id === p1.id)
            );
            const p1Wins = pairMatches.filter((m) => m.winnerId === p1.id).length;
            const p2Wins = pairMatches.filter((m) => m.winnerId === p2.id).length;
            const total = p1Wins + p2Wins;

            let dominantPlayer = null;
            if (p1Wins > p2Wins) dominantPlayer = p1.name;
            else if (p2Wins > p1Wins) dominantPlayer = p2.name;

            return (
              <View key={`${p1.id}_${p2.id}`} style={styles.h2hRow}>
                <View style={styles.h2hPlayerCol}>
                  <Text style={styles.h2hAvatar}>{p1.avatar}</Text>
                  <Text style={styles.h2hName} numberOfLines={1}>
                    {p1.name}
                  </Text>
                </View>

                <View style={styles.h2hScoreCol}>
                  <View style={styles.h2hScoreBox}>
                    <Text
                      style={[
                        styles.h2hScoreNum,
                        p1Wins > p2Wins && styles.h2hWinnerNum,
                      ]}
                    >
                      {p1Wins}
                    </Text>
                    <Text style={styles.h2hScoreSep}>vs</Text>
                    <Text
                      style={[
                        styles.h2hScoreNum,
                        p2Wins > p1Wins && styles.h2hWinnerNum,
                      ]}
                    >
                      {p2Wins}
                    </Text>
                  </View>
                  <Text style={styles.h2hTotalLabel}>
                    {total === 0
                      ? 'Mai affrontati'
                      : dominantPlayer
                      ? `👑 Domina ${dominantPlayer}`
                      : 'Parità assoluta 🤝'}
                  </Text>
                </View>

                <View style={[styles.h2hPlayerCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.h2hAvatar}>{p2.avatar}</Text>
                  <Text style={styles.h2hName} numberOfLines={1}>
                    {p2.name}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Genera tutte le 6 coppie uniche di 4 giocatori
function getPairCombinations(players: Player[]) {
  const pairs = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push({ p1: players[i], p2: players[j] });
    }
  }
  return pairs;
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  playerRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerAvatar: {
    fontSize: 20,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWin: {
    backgroundColor: Colors.win,
  },
  dotLoss: {
    backgroundColor: Colors.loss,
  },
  dotText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
  },
  noMatchesText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  barContainer: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
  },
  barLabel: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 2,
  },
  h2hList: {
    gap: 10,
  },
  h2hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  h2hPlayerCol: {
    width: 80,
    alignItems: 'flex-start',
  },
  h2hAvatar: {
    fontSize: 20,
    marginBottom: 2,
  },
  h2hName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  h2hScoreCol: {
    alignItems: 'center',
  },
  h2hScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  h2hScoreNum: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '900',
    minWidth: 20,
    textAlign: 'center',
  },
  h2hWinnerNum: {
    color: Colors.primary,
    fontSize: 20,
  },
  h2hScoreSep: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  h2hTotalLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
