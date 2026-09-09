import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Match, Player } from '../core/types';
import { Colors } from '../theme/colors';

interface WinCelebrationModalProps {
  match: Match | null;
  players: Player[];
  onClose: () => void;
}

export const WinCelebrationModal: React.FC<WinCelebrationModalProps> = ({
  match,
  players,
  onClose,
}) => {
  if (!match) return null;

  const winner = players.find((p) => p.id === match.winnerId);
  const loser = players.find((p) => p.id === match.loserId);

  if (!winner || !loser) return null;

  const winnerScore = match.winnerId === match.player1Id ? match.score1 : match.score2;
  const loserScore = match.winnerId === match.player1Id ? match.score2 : match.score1;

  return (
    <Modal visible={!!match} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Badge Celebrazione */}
          <View style={styles.fireworksRow}>
            <Text style={styles.fireworkEmoji}>✨</Text>
            <Text style={styles.trophyEmoji}>🏆</Text>
            <Text style={styles.fireworkEmoji}>🎉</Text>
          </View>

          <Text style={styles.title}>VITTORIA SCHIACCIANTE!</Text>

          {/* Avatar del vincitore esultante */}
          <View style={[styles.avatarCircle, { borderColor: winner.color || Colors.primary }]}>
            <Text style={styles.avatarEmoji}>{winner.avatar}</Text>
          </View>

          <Text style={styles.winnerName}>{winner.name} TRIONFA!</Text>
          <Text style={styles.scoreText}>
            Punteggio: {winnerScore} - {loserScore}
          </Text>

          {/* Catchphrase del vincitore */}
          {winner.catchphrase ? (
            <View style={styles.quoteBubble}>
              <Text style={styles.quoteLabel}>Il vincitore dichiara al microfono:</Text>
              <Text style={styles.quoteText}>"{winner.catchphrase}"</Text>
            </View>
          ) : null}

          {/* Furto di punti Elo */}
          <View style={styles.eloTransferBox}>
            <Text style={styles.eloGain}>+{match.eloDelta} PUNTI ELO 📈</Text>
            <Text style={styles.eloRobberyText}>
              Scippati direttamente a <Text style={{ fontWeight: '700' }}>{loser.name}</Text> ({loser.avatar})
            </Text>
          </View>

          {/* Tasto per chiudere */}
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Avanti il prossimo! 🏓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  fireworksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  fireworkEmoji: {
    fontSize: 22,
  },
  trophyEmoji: {
    fontSize: 40,
  },
  title: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  winnerName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  scoreText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  quoteBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  quoteLabel: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quoteText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  eloTransferBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 18,
  },
  eloGain: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  eloRobberyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: '900',
  },
});
