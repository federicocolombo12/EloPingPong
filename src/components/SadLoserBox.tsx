import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SAD_LOSER_EXCUSES } from '../core/constants';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';

interface SadLoserBoxProps {
  loser: Player;
  thirdPlaceElo: number;
}

export const SadLoserBox: React.FC<SadLoserBoxProps> = ({ loser, thirdPlaceElo }) => {
  const [excuseIndex, setExcuseIndex] = useState(0);

  const nextExcuse = () => {
    setExcuseIndex((prev) => (prev + 1) % SAD_LOSER_EXCUSES.length);
  };

  const gap = Math.max(0, thirdPlaceElo - loser.elo);
  const currentExcuse = SAD_LOSER_EXCUSES[excuseIndex];

  return (
    <View style={styles.outerContainer}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <Text style={styles.spoonIcon}>🥄</Text>
            <Text style={styles.titleBadge}>4° POSTO DISPERATO</Text>
            <Text style={styles.tearIcon}>😭</Text>
          </View>
          <Text style={styles.woodenLabel}>Cucchiaio di Legno</Text>
        </View>

        <View style={styles.bodyRow}>
          {/* Avatar triste con nuvoletta di pioggia */}
          <View style={styles.avatarWrapper}>
            <Text style={styles.cloudEmoji}>🌧️</Text>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{loser.avatar}</Text>
              <View style={styles.clownBadge}>
                <Text style={styles.clownEmoji}>🤡</Text>
              </View>
            </View>
          </View>

          {/* Dettagli e disperazione */}
          <View style={styles.infoWrapper}>
            <Text style={styles.playerName}>{loser.name}</Text>
            <Text style={styles.eloText}>
              {loser.elo} ELO <Text style={styles.gapText}>({gap > 0 ? `-${gap} dal podio` : 'fanalino di coda'})</Text>
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={nextExcuse} style={styles.excuseBubble}>
              <Text style={styles.excuseIntro}>La sua scusa ufficiale (tocca per cambiarla):</Text>
              <Text style={styles.excuseText}>{currentExcuse}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.comfortText}>
            Streak: {loser.currentStreak < 0 ? `💩 ${Math.abs(loser.currentStreak)} perse di fila!` : 'Resisti!'}
          </Text>
          <TouchableOpacity onPress={nextExcuse} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>Altra scusa 🔄</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#1c1515', // Gloomy dark reddish-brown
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#7f1d1d', // Dark red border
    borderStyle: 'dashed',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
    paddingBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spoonIcon: {
    fontSize: 16,
  },
  tearIcon: {
    fontSize: 14,
  },
  titleBadge: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  woodenLabel: {
    color: '#D97706',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  cloudEmoji: {
    fontSize: 18,
    marginBottom: -6,
    zIndex: 2,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2b1b1b',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  clownBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 1,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  clownEmoji: {
    fontSize: 12,
  },
  infoWrapper: {
    flex: 1,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  eloText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  gapText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
  },
  excuseBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginTop: 2,
  },
  excuseIntro: {
    color: '#9CA3AF',
    fontSize: 9,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  excuseText: {
    color: '#FECACA',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.15)',
  },
  comfortText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  refreshButtonText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
});
