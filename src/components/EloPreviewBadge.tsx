import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { calculateEloChange } from '../core/elo';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';

interface EloPreviewBadgeProps {
  player1: Player;
  player2: Player;
  score1: number;
  score2: number;
  isFriendly?: boolean;
  environmentalModifiers?: string[];
  player1Modifiers?: string[];
  player2Modifiers?: string[];
}

export const EloPreviewBadge: React.FC<EloPreviewBadgeProps> = ({
  player1,
  player2,
  score1,
  score2,
  isFriendly = false,
  environmentalModifiers = [],
  player1Modifiers = [],
  player2Modifiers = [],
}) => {
  // Scenario P1 vince (P1 è winner, P2 è loser)
  const ifP1Wins = calculateEloChange(player1.elo, player2.elo, undefined, {
    isFriendly,
    environmentalModifiers,
    winnerModifiers: player1Modifiers,
    loserModifiers: player2Modifiers,
  });

  // Scenario P2 vince (P2 è winner, P1 è loser)
  const ifP2Wins = calculateEloChange(player2.elo, player1.elo, undefined, {
    isFriendly,
    environmentalModifiers,
    winnerModifiers: player2Modifiers,
    loserModifiers: player1Modifiers,
  });

  const isP1Leading = score1 > score2;
  const isP2Leading = score2 > score1;
  const hasScores = score1 > 0 || score2 > 0;

  if (isFriendly) {
    return (
      <View style={[styles.container, styles.friendlyContainer]}>
        <Text style={styles.friendlyTitle}>🤝 MODALITÀ AMICHEVOLE ATTIVA</Text>
        <Text style={styles.friendlyDesc}>
          Nessun punto Elo verrà scambiato. Giocate in totale relax (o per vantarvi dopo)!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>⚡ ANTEPRIMA PUNTI ELO (CON MODIFICATORI)</Text>

      <View style={styles.previewGrid}>
        {/* Scenario: Vince Giocatore 1 */}
        <View
          style={[
            styles.scenarioBox,
            isP1Leading && styles.scenarioBoxActive,
            { borderColor: player1.color || Colors.primary },
          ]}
        >
          <Text style={styles.scenarioTitle} numberOfLines={1}>
            Se vince {player1.avatar} {player1.name}:
          </Text>
          <View style={styles.deltaRow}>
            <Text style={styles.gainText}>+{ifP1Wins.winnerDelta} Punti</Text>
            <Text style={styles.newEloText}>
              ({player1.elo} → {ifP1Wins.winnerEloAfter})
            </Text>
          </View>
          <Text style={styles.loserSubText}>
            {player2.name} perde -{ifP1Wins.loserDelta} ({ifP1Wins.loserEloAfter})
          </Text>
        </View>

        {/* Scenario: Vince Giocatore 2 */}
        <View
          style={[
            styles.scenarioBox,
            isP2Leading && styles.scenarioBoxActive,
            { borderColor: player2.color || Colors.secondary },
          ]}
        >
          <Text style={styles.scenarioTitle} numberOfLines={1}>
            Se vince {player2.avatar} {player2.name}:
          </Text>
          <View style={styles.deltaRow}>
            <Text style={styles.gainText}>+{ifP2Wins.winnerDelta} Punti</Text>
            <Text style={styles.newEloText}>
              ({player2.elo} → {ifP2Wins.winnerEloAfter})
            </Text>
          </View>
          <Text style={styles.loserSubText}>
            {player1.name} perde -{ifP2Wins.loserDelta} ({ifP2Wins.loserEloAfter})
          </Text>
        </View>
      </View>

      {hasScores && (
        <View style={styles.currentOutcomeBanner}>
          <Text style={styles.currentOutcomeText}>
            {isP1Leading
              ? `🎯 Risultato attuale: ${player1.name} guadagna +${ifP1Wins.winnerDelta}, ${player2.name} perde -${ifP1Wins.loserDelta}!`
              : isP2Leading
              ? `🎯 Risultato attuale: ${player2.name} guadagna +${ifP2Wins.winnerDelta}, ${player1.name} perde -${ifP2Wins.loserDelta}!`
              : 'Pareggio momentaneo (a ping pong serve un vincitore!)'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  friendlyContainer: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
  },
  friendlyTitle: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  friendlyDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  headerTitle: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  previewGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  scenarioBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  scenarioBoxActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
  },
  scenarioTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  gainText: {
    color: Colors.win,
    fontSize: 15,
    fontWeight: '900',
  },
  newEloText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  loserSubText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '500',
  },
  currentOutcomeBanner: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  currentOutcomeText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
