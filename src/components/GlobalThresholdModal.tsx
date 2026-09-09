import React from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';

interface GlobalThresholdModalProps {
  event: {
    player: Player;
    threshold: number;
    gifUrl?: string;
  } | null;
  onClose: () => void;
}

export const GlobalThresholdModal: React.FC<GlobalThresholdModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const { player, threshold, gifUrl } = event;
  const displayGif = gifUrl || player.celebrationGifUrl || 'https://media.giphy.com/media/r1IMdmkhUcpUXEYOtY/giphy.gif';

  return (
    <Modal visible={!!event} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Record */}
          <View style={styles.recordHeader}>
            <Text style={styles.sirenEmoji}>🚨</Text>
            <Text style={styles.recordTitle}>NUOVA SOGLIA ELO RAGGIUNTA!</Text>
            <Text style={styles.sirenEmoji}>🚨</Text>
          </View>

          {/* Nome e Punti della Soglia */}
          <Text style={styles.congratsText}>
            {player.avatar} <Text style={{ color: Colors.gold }}>{player.name}</Text> HA SUPERATO QUOTA
          </Text>
          <View style={styles.thresholdBadge}>
            <Text style={styles.thresholdNumber}>{threshold} PUNTI ELO! 👑</Text>
          </View>
          <Text style={styles.currentEloSub}>
            Punteggio attuale: <Text style={{ color: Colors.primary, fontWeight: '800' }}>{player.elo} ELO</Text>
          </Text>

          {/* GIF di Celebrazione del Giocatore */}
          <View style={styles.gifContainer}>
            <Image
              source={{ uri: displayGif }}
              style={styles.gifImage}
              resizeMode="cover"
            />
          </View>

          {/* Catchphrase */}
          {player.catchphrase ? (
            <View style={styles.quoteBubble}>
              <Text style={styles.quoteLabel}>Parole del Campione:</Text>
              <Text style={styles.quoteText}>"{player.catchphrase}"</Text>
            </View>
          ) : null}

          {/* Tasto Chiudi */}
          <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.confirmBtn}>
            <Text style={styles.confirmBtnText}>Inchinatevi tutti! 🏓🔥</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#131B2A',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sirenEmoji: {
    fontSize: 22,
  },
  recordTitle: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  congratsText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  thresholdBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    marginVertical: 10,
  },
  thresholdNumber: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  currentEloSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  gifContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: '#000',
    marginBottom: 14,
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  quoteBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  quoteLabel: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  quoteText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
