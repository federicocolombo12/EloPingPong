import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { MatchBackupRecord } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

interface MatchBackupVaultModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MatchBackupVaultModal: React.FC<MatchBackupVaultModalProps> = ({
  visible,
  onClose,
}) => {
  const { getMatchBackups, players } = useElo();
  const [backups, setBackups] = useState<MatchBackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const records = await getMatchBackups();
      records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setBackups(records);
    } catch (err) {
      console.error('Errore caricamento backup:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadBackups();
    }
  }, [visible]);

  const filtered = backups.filter((b) => {
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const getPlayer = (id?: string) => {
    if (!id) return null;
    return players.find((p) => p.id === id);
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'Data sconosciuta';
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>🛡️</Text>
              <View>
                <Text style={styles.modalTitle}>Vault Backup Partite</Text>
                <Text style={styles.modalSub}>
                  Archivio immutabile partite ({backups.length} registrate)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                soundEffects.playButtonTap();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Bar & Refresh */}
          <View style={styles.filterRow}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  setFilter('all');
                }}
                style={[styles.tab, filter === 'all' && styles.tabActive]}
              >
                <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
                  Tutte ({backups.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  setFilter('completed');
                }}
                style={[styles.tab, filter === 'completed' && styles.tabActive]}
              >
                <Text style={[styles.tabText, filter === 'completed' && styles.tabTextActive]}>
                  ✅ Concluse ({backups.filter((b) => b.status === 'completed').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  setFilter('cancelled');
                }}
                style={[styles.tab, filter === 'cancelled' && styles.tabActive]}
              >
                <Text style={[styles.tabText, filter === 'cancelled' && styles.tabTextActive]}>
                  🚫 Annullate ({backups.filter((b) => b.status === 'cancelled').length})
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                soundEffects.playButtonTap();
                loadBackups();
              }}
              style={styles.refreshBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.refreshBtnText}>🔄 Aggiorna</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Caricamento archivio di sicurezza...</Text>
            </View>
          ) : (
            <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
              {filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>📦</Text>
                  <Text style={styles.emptyText}>Nessun record di backup trovato.</Text>
                </View>
              ) : (
                filtered.map((item) => {
                  const isCompleted = item.status === 'completed';
                  const p1 = getPlayer(item.player1Id);
                  const p2 = getPlayer(item.player2Id);
                  const p1Name = p1?.name || item.player1Id || 'Giocatore 1';
                  const p2Name = p2?.name || item.player2Id || 'Giocatore 2';
                  const betsCount = item.bets ? Object.keys(item.bets).length : 0;
                  const commentsCount = item.comments?.length || 0;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.backupCard,
                        isCompleted ? styles.cardCompleted : styles.cardCancelled,
                      ]}
                    >
                      {/* Top Row: Date & Status Badge */}
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardDateText}>{formatDate(item.createdAt)}</Text>
                        <View
                          style={[
                            styles.badge,
                            isCompleted ? styles.badgeCompleted : styles.badgeCancelled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isCompleted ? styles.badgeTextCompleted : styles.badgeTextCancelled,
                            ]}
                          >
                            {isCompleted ? '✅ COMPLETATA' : '🚫 ANNULLATA'}
                          </Text>
                        </View>
                      </View>

                      {/* Versus & Score Row */}
                      <View style={styles.versusRow}>
                        <View style={styles.playerBlock}>
                          <Text style={styles.playerAvatar}>{p1?.avatar || '🏓'}</Text>
                          <Text
                            style={[styles.playerName, { color: p1?.color || Colors.primary }]}
                            numberOfLines={1}
                          >
                            {p1Name}
                          </Text>
                        </View>

                        <View style={styles.scoreContainer}>
                          <Text style={styles.scoreText}>
                            {item.score1} - {item.score2}
                          </Text>
                          <Text style={styles.targetText}>Al {item.targetPoints || 11}</Text>
                        </View>

                        <View style={styles.playerBlock}>
                          <Text style={styles.playerAvatar}>{p2?.avatar || '🏓'}</Text>
                          <Text
                            style={[styles.playerName, { color: p2?.color || '#10B981' }]}
                            numberOfLines={1}
                          >
                            {p2Name}
                          </Text>
                        </View>
                      </View>

                      {/* Info Pills */}
                      <View style={styles.metaRow}>
                        {isCompleted && item.eloChange !== undefined && (
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              📈 Elo: ±{item.eloChange} pt
                            </Text>
                          </View>
                        )}
                        {item.refereePlayerName ? (
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              👮 Arbitro: {item.refereePlayerName}
                            </Text>
                          </View>
                        ) : null}
                        {betsCount > 0 && (
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              🪙 {betsCount} scommess{betsCount === 1 ? 'a' : 'e'}
                            </Text>
                          </View>
                        )}
                        {commentsCount > 0 && (
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              💬 {commentsCount} comment{commentsCount === 1 ? 'o' : 'i'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Special Stats if present */}
                      {item.stats && (
                        <View style={styles.statsSummary}>
                          <Text style={styles.statsSummaryText}>
                            💥 Smash: {(item.stats.player1Smashes || 0) + (item.stats.player2Smashes || 0)} • ⚡ Ace: {(item.stats.player1Aces || 0) + (item.stats.player2Aces || 0)} • 🍀 Culo: {(item.stats.player1LuckPoints || 0) + (item.stats.player2LuckPoints || 0)}
                          </Text>
                        </View>
                      )}

                      {/* ID reference */}
                      <Text style={styles.idText} numberOfLines={1}>
                        Match ID: {item.matchId}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#0F1623',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#374151',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    fontSize: 28,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  modalSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#60A5FA',
    fontWeight: '900',
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  refreshBtnText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  backupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  cardCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  cardCancelled: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardDateText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badgeTextCompleted: {
    color: '#34D399',
  },
  badgeTextCancelled: {
    color: '#F87171',
  },
  versusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  playerBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  playerAvatar: {
    fontSize: 24,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  scoreText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  targetText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  metaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaPillText: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  statsSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statsSummaryText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  idText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 6,
  },
});
