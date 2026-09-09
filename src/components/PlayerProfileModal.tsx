import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { STARTING_COINS } from '../core/constants';
import { getPlayerActiveMilestone, getStreakDisplay, getWinRate } from '../core/elo';
import { getBorderCardStyle } from '../core/shop';
import { getPlayerTrophies } from '../core/trophies';
import { Match, Player } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

interface PlayerProfileModalProps {
  player: Player | null;
  visible: boolean;
  onClose: () => void;
  onViewStats?: (player: Player) => void;
  canEdit?: boolean;
  onEdit?: (player: Player) => void;
  allPlayers?: Player[];
  allMatches?: Match[];
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  visible,
  onClose,
  onViewStats,
  canEdit,
  onEdit,
  allPlayers = [],
  allMatches = [],
}) => {
  if (!player) return null;

  const winRate = getWinRate(player.wins, player.losses);
  const streak = getStreakDisplay(player.currentStreak);
  const milestone = getPlayerActiveMilestone(player.elo);
  const pColor = player.color || Colors.primary;
  const coins = player.coins !== undefined ? player.coins : STARTING_COINS;
  const trophies = getPlayerTrophies(player.id, allPlayers, allMatches);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scheda Agente</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Profilo Card */}
            <View
              style={[
                styles.card,
                { borderColor: pColor },
                getBorderCardStyle(player.equippedBorder),
              ]}
            >
              <View style={styles.topRow}>
                <View style={[styles.avatarCircle, { borderColor: pColor }]}>
                  <Text style={styles.avatarEmoji}>{player.avatar}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.nameText, { color: pColor }]}>{player.name}</Text>
                    {milestone && (
                      <View style={[styles.milestoneBadge, { borderColor: milestone.color, backgroundColor: `${milestone.color}15` }]}>
                        <Text style={[styles.milestoneBadgeText, { color: milestone.color }]}>{milestone.badge}</Text>
                      </View>
                    )}
                  </View>

                  {player.equippedTitle && (
                    <View style={styles.titleBadge}>
                      <Text style={styles.titleBadgeText}>{player.equippedTitle}</Text>
                    </View>
                  )}

                  <Text style={styles.recordText}>
                    {player.wins}V - {player.losses}P • {winRate}% Win Rate
                  </Text>
                </View>
              </View>

              {player.catchphrase ? (
                <View style={[styles.quoteBox, { borderLeftColor: pColor }]}>
                  <Text style={styles.quoteText}>"{player.catchphrase}"</Text>
                </View>
              ) : null}

              {/* Statistiche Chiave */}
              <View style={styles.statsBar}>
                <View style={styles.statCol}>
                  <Text style={styles.statNum}>{player.elo}</Text>
                  <Text style={styles.statLbl}>ELO ATTUALE</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statNum}>{player.highestElo || player.elo}</Text>
                  <Text style={styles.statLbl}>MAX ELO</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={[styles.statNum, { color: '#FACC15' }]}>🪙 {coins}</Text>
                  <Text style={styles.statLbl}>LUL COINS</Text>
                </View>
              </View>

              {/* Striscia e ATP Race */}
              <View style={styles.extraStatsRow}>
                <View style={styles.extraBadge}>
                  <Text style={styles.extraBadgeText}>
                    Striscia: {streak.emoji} {streak.text}
                  </Text>
                </View>
                <View style={styles.extraBadge}>
                  <Text style={[styles.extraBadgeText, { color: '#FDE047' }]}>
                    Race ATP: {player.racePoints || 0} pt
                  </Text>
                </View>
              </View>

              {/* Performance Scommesse */}
              <View style={styles.betRow}>
                <Text style={styles.betLabel}>🎯 Record Scommesse:</Text>
                <Text style={styles.betValue}>
                  {player.betsWon || 0}V - {player.betsLost || 0}P • Profitto:{' '}
                  <Text style={{ color: (player.coinsWonOnBets || 0) >= 0 ? '#34D399' : '#EF4444' }}>
                    {(player.coinsWonOnBets || 0) >= 0 ? '+' : ''}{player.coinsWonOnBets || 0} 🪙
                  </Text>
                </Text>
              </View>

              {/* Trofei Speciali */}
              {trophies.length > 0 && (
                <View style={styles.trophiesSection}>
                  <Text style={styles.trophiesTitle}>🏆 Trofei & Riconoscimenti:</Text>
                  <View style={styles.trophiesList}>
                    {trophies.map((t) => (
                      <View key={t.id} style={styles.trophyBadge}>
                        <Text style={styles.trophyIcon}>{t.icon}</Text>
                        <Text style={styles.trophyName}>{t.title}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tag comici */}
              {player.tags && player.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {player.tags.map((tag, idx) => (
                    <View key={idx} style={[styles.tagBadge, { borderColor: `${pColor}40` }]}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Pulsante Analisi Dettagliata */}
            {onViewStats && (
              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  onClose();
                  onViewStats(player);
                }}
                style={styles.viewStatsBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.viewStatsBtnText}>
                  📊 Vedi Analisi Approfondita & Matchup ➔
                </Text>
              </TouchableOpacity>
            )}

            {/* Pulsante Modifica Profilo (se consentito) */}
            {canEdit && onEdit && (
              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  onClose();
                  onEdit(player);
                }}
                style={styles.editProfileBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.editProfileBtnText}>
                  ✏️ Modifica Dati Profilo
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '900',
  },
  milestoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  milestoneBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  titleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  titleBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  recordText: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  quoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginTop: 10,
  },
  quoteText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  statLbl: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  extraStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  extraBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  extraBadgeText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  betRow: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  betLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  betValue: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  trophiesSection: {
    marginTop: 12,
  },
  trophiesTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  trophiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  trophyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  trophyIcon: {
    fontSize: 11,
  },
  trophyName: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  viewStatsBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  viewStatsBtnText: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '900',
  },
  editProfileBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  editProfileBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
});
