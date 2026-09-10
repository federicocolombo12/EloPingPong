import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { calculatePlayerAchievements, TIER_NAMES } from '../core/achievements';
import { STARTING_COINS } from '../core/constants';
import { getPlayerActiveMilestone, getStreakDisplay, getWinRate } from '../core/elo';
import { getBorderCardStyle, SHOP_ITEMS } from '../core/shop';
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

  const { players, associatedPlayer, claimAchievement, placeBounty } = useElo();
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'bounty'>('profile');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [selectedBountyChip, setSelectedBountyChip] = useState<number>(25);
  const [bountyFeedback, setBountyFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPlacingBounty, setIsPlacingBounty] = useState<boolean>(false);

  // Utilizza l'istanza più aggiornata del player da context se disponibile
  const livePlayer = useMemo(() => {
    return players.find((p) => p.id === player.id) || player;
  }, [players, player]);

  const isMe = associatedPlayer?.id === livePlayer.id;
  const winRate = getWinRate(livePlayer.wins, livePlayer.losses);
  const streak = getStreakDisplay(livePlayer.currentStreak);
  const milestone = getPlayerActiveMilestone(livePlayer.elo);
  const pColor = livePlayer.color || Colors.primary;
  const coins = livePlayer.coins !== undefined ? livePlayer.coins : STARTING_COINS;
  const userCoins = associatedPlayer?.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;
  const systemTrophies = getPlayerTrophies(livePlayer.id, allPlayers, allMatches);

  // Shop trophy items
  const trophyShopItems = useMemo(() => {
    return SHOP_ITEMS.filter((item) => item.category === 'trophy');
  }, []);

  // Calcolo 6-tier achievements
  const achievementStatuses = useMemo(() => {
    return calculatePlayerAchievements(livePlayer, allMatches);
  }, [livePlayer, allMatches]);

  const totalClaimableAcrossAll = useMemo(() => {
    return achievementStatuses.reduce((acc, s) => acc + s.totalClaimableCoins, 0);
  }, [achievementStatuses]);

  // Scontri diretti tra il giocatore ispezionato e l'utente collegato
  const directMatches = useMemo(() => {
    if (!associatedPlayer || associatedPlayer.id === livePlayer.id) return [];
    return allMatches.filter(
      (m) =>
        (m.player1Id === livePlayer.id && m.player2Id === associatedPlayer.id) ||
        (m.player2Id === livePlayer.id && m.player1Id === associatedPlayer.id)
    );
  }, [allMatches, livePlayer.id, associatedPlayer]);

  const myWins = directMatches.filter((m) => m.winnerId === associatedPlayer?.id).length;
  const theirWins = directMatches.filter((m) => m.winnerId === livePlayer.id).length;

  // Ultime 4 partite del giocatore
  const recentMatches = useMemo(() => {
    return allMatches
      .filter((m) => m.player1Id === livePlayer.id || m.player2Id === livePlayer.id)
      .slice(0, 4);
  }, [allMatches, livePlayer.id]);

  const handleClaim = async (achievementId: string) => {
    setClaimingId(achievementId);
    try {
      const res = await claimAchievement(achievementId);
      if (res.success) {
        soundEffects.playCoinSound();
        setClaimFeedback(`+${res.coinsAwarded} 🪙 LUL Coins accreditati al tuo saldo!`);
        setTimeout(() => setClaimFeedback(null), 3500);
      } else {
        Alert.alert('Attenzione', res.error || 'Impossibile riscuotere la ricompensa');
      }
    } catch {
      Alert.alert('Errore', 'Si è verificato un errore imprevisto');
    } finally {
      setClaimingId(null);
    }
  };

  const handlePlaceBounty = async () => {
    if (selectedBountyChip <= 0) return;
    if (selectedBountyChip > userCoins) {
      setBountyFeedback({
        type: 'error',
        text: `Saldo insufficiente (${userCoins} 🪙 disponibili)`,
      });
      setTimeout(() => setBountyFeedback(null), 3000);
      return;
    }

    setIsPlacingBounty(true);
    try {
      const res = await placeBounty(livePlayer.id, selectedBountyChip);
      if (res.success) {
        soundEffects.playCoinSound();
        setBountyFeedback({
          type: 'success',
          text: `🎯 Taglia di ${selectedBountyChip} 🪙 piazzata su ${livePlayer.name}!`,
        });
        setTimeout(() => setBountyFeedback(null), 3500);
      } else {
        setBountyFeedback({
          type: 'error',
          text: res.error || 'Impossibile piazzare la taglia',
        });
        setTimeout(() => setBountyFeedback(null), 3500);
      }
    } catch {
      setBountyFeedback({
        type: 'error',
        text: 'Errore di connessione durante il piazzamento della taglia',
      });
      setTimeout(() => setBountyFeedback(null), 3500);
    } finally {
      setIsPlacingBounty(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Principale */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>Scheda Agente</Text>
              {livePlayer.activeBounty && livePlayer.activeBounty.amount > 0 && (
                <View style={styles.activeBountyPill}>
                  <Text style={styles.activeBountyPillText}>
                    🎯 TAGLIA {livePlayer.activeBounty.amount} 🪙
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sotto-Tabs di navigazione */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
              onPress={() => {
                soundEffects.playButtonTap();
                setActiveTab('profile');
              }}
            >
              <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
                👤 Profilo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'achievements' && styles.tabBtnActive]}
              onPress={() => {
                soundEffects.playButtonTap();
                setActiveTab('achievements');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.tabBtnText, activeTab === 'achievements' && styles.tabBtnTextActive]}>
                  🏆 Trofei & Tier
                </Text>
                {isMe && totalClaimableAcrossAll > 0 && (
                  <View style={styles.claimDotBadge}>
                    <Text style={styles.claimDotBadgeText}>+{totalClaimableAcrossAll}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'bounty' && styles.tabBtnActive]}
              onPress={() => {
                soundEffects.playButtonTap();
                setActiveTab('bounty');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.tabBtnText, activeTab === 'bounty' && styles.tabBtnTextActive]}>
                  🎯 Taglia
                </Text>
                {livePlayer.activeBounty && livePlayer.activeBounty.amount > 0 && (
                  <View style={styles.bountyDotBadge}>
                    <Text style={styles.bountyDotBadgeText}>
                      {livePlayer.activeBounty.amount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* TAB 1: PROFILO & STATS */}
            {activeTab === 'profile' && (
              <>
                <View
                  style={[
                    styles.card,
                    { borderColor: pColor },
                    getBorderCardStyle(livePlayer.equippedBorder),
                  ]}
                >
                  <View style={styles.topRow}>
                    <View style={[styles.avatarCircle, { borderColor: pColor }]}>
                      <Text style={styles.avatarEmoji}>{livePlayer.avatar}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.nameText, { color: pColor }]}>{livePlayer.name}</Text>
                        {milestone && (
                          <View
                            style={[
                              styles.milestoneBadge,
                              { borderColor: milestone.color, backgroundColor: `${milestone.color}15` },
                            ]}
                          >
                            <Text style={[styles.milestoneBadgeText, { color: milestone.color }]}>
                              {milestone.badge}
                            </Text>
                          </View>
                        )}
                      </View>

                      {livePlayer.equippedTitle && (
                        <View style={styles.titleBadge}>
                          <Text style={styles.titleBadgeText}>{livePlayer.equippedTitle}</Text>
                        </View>
                      )}

                      <Text style={styles.recordText}>
                        {livePlayer.wins}V - {livePlayer.losses}P • {winRate}% Win Rate
                      </Text>
                    </View>
                  </View>

                  {livePlayer.catchphrase ? (
                    <View style={[styles.quoteBox, { borderLeftColor: pColor }]}>
                      <Text style={styles.quoteText}>"{livePlayer.catchphrase}"</Text>
                    </View>
                  ) : null}

                  {/* Statistiche Chiave */}
                  <View style={styles.statsBar}>
                    <View style={styles.statCol}>
                      <Text style={styles.statNum}>{livePlayer.elo}</Text>
                      <Text style={styles.statLbl}>ELO ATTUALE</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                      <Text style={styles.statNum}>{livePlayer.highestElo || livePlayer.elo}</Text>
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
                        Race ATP: {livePlayer.racePoints || 0} pt
                      </Text>
                    </View>
                  </View>

                  {/* Performance Scommesse */}
                  <View style={styles.betRow}>
                    <Text style={styles.betLabel}>🎯 Record Scommesse Live:</Text>
                    <Text style={styles.betValue}>
                      {livePlayer.betsWon || 0}V - {livePlayer.betsLost || 0}P • Profitto:{' '}
                      <Text
                        style={{
                          color: (livePlayer.coinsWonOnBets || 0) >= 0 ? '#34D399' : '#EF4444',
                        }}
                      >
                        {(livePlayer.coinsWonOnBets || 0) >= 0 ? '+' : ''}
                        {livePlayer.coinsWonOnBets || 0} 🪙
                      </Text>
                    </Text>
                  </View>

                  {/* Tag comici / Riconoscimenti */}
                  {livePlayer.tags && livePlayer.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {livePlayer.tags.map((tag, idx) => (
                        <View key={idx} style={[styles.tagBadge, { borderColor: `${pColor}40` }]}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* SCONTRI DIRETTI CON L'UTENTE LOGGATO */}
                  {associatedPlayer && associatedPlayer.id !== livePlayer.id && (
                    <View style={styles.directMatchupSection}>
                      <Text style={styles.directMatchupTitle}>
                        ⚔️ Scontri Diretti Con Te ({associatedPlayer.name})
                      </Text>
                      <View style={styles.directScoreBox}>
                        <View style={styles.directScoreCol}>
                          <Text style={styles.directScoreLabel}>TU ({associatedPlayer.name})</Text>
                          <Text style={[styles.directScoreNum, { color: '#38BDF8' }]}>{myWins}</Text>
                        </View>
                        <Text style={styles.directScoreDivider}>vs</Text>
                        <View style={styles.directScoreCol}>
                          <Text style={styles.directScoreLabel}>{livePlayer.name.toUpperCase()}</Text>
                          <Text style={[styles.directScoreNum, { color: pColor }]}>{theirWins}</Text>
                        </View>
                      </View>
                      <Text style={styles.directTotalText}>
                        {directMatches.length === 0
                          ? 'Nessun match disputato tra voi finora.'
                          : `Totale: ${directMatches.length} ${
                              directMatches.length === 1 ? 'partita disputata' : 'partite disputate'
                            }`}
                      </Text>
                    </View>
                  )}

                  {/* ULTIME PARTITE DISPUTATE */}
                  {recentMatches.length > 0 && (
                    <View style={styles.recentMatchesSection}>
                      <Text style={styles.recentMatchesTitle}>📜 Ultime Partite Disputate:</Text>
                      {recentMatches.map((m) => {
                        const isP1 = m.player1Id === livePlayer.id;
                        const opponentId = isP1 ? m.player2Id : m.player1Id;
                        const opponent = allPlayers.find((p) => p.id === opponentId);
                        const myScore = isP1 ? m.score1 : m.score2;
                        const oppScore = isP1 ? m.score2 : m.score1;
                        const won = m.winnerId === livePlayer.id;
                        const dateStr = new Date(m.timestamp).toLocaleDateString([], {
                          day: '2-digit',
                          month: 'short',
                        });

                        return (
                          <View key={m.id} style={styles.recentMatchRow}>
                            <View
                              style={[
                                styles.recentMatchResultBadge,
                                won ? styles.badgeWin : styles.badgeLoss,
                              ]}
                            >
                              <Text style={styles.recentMatchResultText}>{won ? 'V' : 'P'}</Text>
                            </View>
                            <Text style={styles.recentMatchOpponent} numberOfLines={1}>
                              vs {opponent?.avatar || '👤'} {opponent?.name || 'Avversario'}
                            </Text>
                            <Text style={styles.recentMatchScore}>
                              {myScore} - {oppScore}
                            </Text>
                            <Text
                              style={[
                                styles.recentMatchDelta,
                                won ? styles.deltaTextWin : styles.deltaTextLoss,
                              ]}
                            >
                              {m.isFriendly
                                ? '🤝 0'
                                : won
                                ? `+${m.winnerEloDelta ?? m.eloDelta}`
                                : `-${m.loserEloDelta ?? m.eloDelta}`}
                            </Text>
                            <Text style={styles.recentMatchDate}>{dateStr}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Pulsante Analisi Dettagliata */}
                {onViewStats && (
                  <TouchableOpacity
                    onPress={() => {
                      soundEffects.playButtonTap();
                      onClose();
                      onViewStats(livePlayer);
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
                      onEdit(livePlayer);
                    }}
                    style={styles.editProfileBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editProfileBtnText}>✏️ Modifica Dati Profilo</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* TAB 2: TROFEI SHOP & 6-TIER ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <View style={{ gap: 16 }}>
                {claimFeedback && (
                  <View style={styles.toastNotice}>
                    <Text style={styles.toastNoticeText}>{claimFeedback}</Text>
                  </View>
                )}

                {/* Vetrina Trofei d'Élite Acquistabili */}
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>🏛️ Vetrina Trofei d'Élite</Text>
                    <Text style={styles.sectionHeaderSubtitle}>Esclusivi dello Shop</Text>
                  </View>
                  <View style={styles.trophyGrid}>
                    {trophyShopItems.map((trophy) => {
                      const isOwned =
                        (livePlayer.inventory || []).includes(trophy.id) ||
                        (livePlayer.trophyShowcase || []).includes(trophy.id);

                      return (
                        <View
                          key={trophy.id}
                          style={[
                            styles.trophyShowcaseCard,
                            isOwned ? styles.trophyCardOwned : styles.trophyCardLocked,
                          ]}
                        >
                          <Text style={styles.trophyShowcaseIcon}>{trophy.icon}</Text>
                          <Text
                            style={[
                              styles.trophyShowcaseName,
                              { color: isOwned ? '#FDE047' : Colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {trophy.name.replace(/^[^\s]+\s/, '')}
                          </Text>
                          <Text style={styles.trophyShowcaseStatus}>
                            {isOwned ? '✨ POSSEDUTO' : `🔒 ${trophy.price} 🪙`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Trofei di Merito / Sistema */}
                {systemTrophies.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeaderTitle}>🎖️ Riconoscimenti Speciali di Lega</Text>
                    <View style={styles.systemTrophiesList}>
                      {systemTrophies.map((t) => (
                        <View key={t.id} style={styles.systemTrophyCard}>
                          <Text style={styles.systemTrophyIcon}>{t.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.systemTrophyName}>{t.title}</Text>
                            <Text style={styles.systemTrophyDesc}>{t.description}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 8 Obiettivi a 6 Livelli */}
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>🌟 8 Obiettivi di Carriera</Text>
                    <Text style={styles.sectionHeaderSubtitle}>Retroattivi a 6 Livelli</Text>
                  </View>

                  {/* Legenda Tiers */}
                  <View style={styles.tierLegendRow}>
                    <Text style={styles.tierLegendItem}>🪵 Legno</Text>
                    <Text style={styles.tierLegendArrow}>➔</Text>
                    <Text style={styles.tierLegendItem}>🥉 Bronzo</Text>
                    <Text style={styles.tierLegendArrow}>➔</Text>
                    <Text style={styles.tierLegendItem}>🥈 Argento</Text>
                    <Text style={styles.tierLegendArrow}>➔</Text>
                    <Text style={styles.tierLegendItem}>🥇 Oro</Text>
                    <Text style={styles.tierLegendArrow}>➔</Text>
                    <Text style={styles.tierLegendItem}>💎 Diamante</Text>
                    <Text style={styles.tierLegendArrow}>➔</Text>
                    <Text style={[styles.tierLegendItem, { color: '#FF4500' }]}>☀️ Gear 5</Text>
                  </View>

                  <View style={{ gap: 12, marginTop: 10 }}>
                    {achievementStatuses.map((status) => {
                      const ach = status.achievement;
                      const nextTarget = status.nextTier
                        ? status.nextTier.target
                        : (status.highestReachedTier?.target || 1);
                      const progressPct = Math.min(
                        100,
                        Math.max(0, Math.round((status.currentValue / nextTarget) * 100))
                      );

                      return (
                        <View key={ach.id} style={styles.achievementCard}>
                          <View style={styles.achHeaderRow}>
                            <View style={styles.achIconWrap}>
                              <Text style={styles.achIconText}>{ach.icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.achTitleText}>{ach.name}</Text>
                                {status.highestReachedTier && (
                                  <View
                                    style={[
                                      styles.achCurrentTierBadge,
                                      { borderColor: status.highestReachedTier.color },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.achCurrentTierBadgeText,
                                        { color: status.highestReachedTier.color },
                                      ]}
                                    >
                                      {status.highestReachedTier.badge} {status.highestReachedTier.name}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.achDescText}>{ach.description}</Text>
                            </View>
                          </View>

                          {/* Barra di Avanzamento */}
                          <View style={styles.achProgressBox}>
                            <View style={styles.achProgressLabels}>
                              <Text style={styles.achProgressVal}>
                                Progresso: <Text style={{ color: '#FACC15' }}>{status.currentValue}</Text>{' '}
                                {status.nextTier ? `/ ${status.nextTier.target}` : '(MAX)'}
                              </Text>
                              <Text style={styles.achProgressPct}>{progressPct}%</Text>
                            </View>
                            <View style={styles.achProgressBarBg}>
                              <View
                                style={[
                                  styles.achProgressBarFill,
                                  {
                                    width: `${progressPct}%`,
                                    backgroundColor: status.highestReachedTier?.color || '#38BDF8',
                                  },
                                ]}
                              />
                            </View>
                          </View>

                          {/* 6 Livelli Pills */}
                          <View style={styles.tiersGrid}>
                            {ach.tiers.map((t) => {
                              const isReached = status.currentValue >= t.target;
                              const isClaimed = status.claimedLevel >= t.level;

                              return (
                                <View
                                  key={t.level}
                                  style={[
                                    styles.tierPill,
                                    isReached && styles.tierPillReached,
                                    isClaimed && styles.tierPillClaimed,
                                  ]}
                                >
                                  <Text style={styles.tierPillBadge}>{t.badge}</Text>
                                  <Text
                                    style={[
                                      styles.tierPillName,
                                      { color: isReached ? t.color : Colors.textMuted },
                                    ]}
                                  >
                                    {t.name}
                                  </Text>
                                  <Text style={styles.tierPillTarget}>{t.target}</Text>
                                  {isClaimed && <Text style={styles.tierClaimedCheck}>✓</Text>}
                                </View>
                              );
                            })}
                          </View>

                          {/* Pulsante Riscatto se utente collegato e ci sono monete sbloccate */}
                          {isMe && status.totalClaimableCoins > 0 && (
                            <TouchableOpacity
                              style={styles.claimCoinsBtn}
                              onPress={() => handleClaim(ach.id)}
                              disabled={claimingId === ach.id}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.claimCoinsBtnText}>
                                {claimingId === ach.id
                                  ? 'Riscossione in corso...'
                                  : `🎁 Riscatta Ricompensa (+${status.totalClaimableCoins} 🪙)`}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {status.claimedLevel === 6 && (
                            <View style={styles.maxedOutBadge}>
                              <Text style={styles.maxedOutBadgeText}>
                                ☀️ GEAR 5 COMPLETATO & RISCATTATO
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: TAGLIA SULLA TESTA & BOUNTY */}
            {activeTab === 'bounty' && (
              <View style={{ gap: 16 }}>
                {bountyFeedback && (
                  <View
                    style={[
                      styles.toastNotice,
                      {
                        backgroundColor:
                          bountyFeedback.type === 'success'
                            ? 'rgba(52, 211, 153, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                        borderColor:
                          bountyFeedback.type === 'success' ? '#34D399' : '#EF4444',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.toastNoticeText,
                        {
                          color:
                            bountyFeedback.type === 'success' ? '#34D399' : '#EF4444',
                        },
                      ]}
                    >
                      {bountyFeedback.text}
                    </Text>
                  </View>
                )}

                {/* Poster Taglia Attiva */}
                <View style={styles.bountyPosterCard}>
                  <View style={styles.bountyPosterHeader}>
                    <Text style={styles.bountyPosterWanted}>☠️ WANTED DEAD OR ALIVE ☠️</Text>
                    <Text style={styles.bountyPosterName}>{livePlayer.name.toUpperCase()}</Text>
                  </View>

                  <View style={styles.bountyAmountBox}>
                    <Text style={styles.bountyAmountNumber}>
                      🪙 {livePlayer.activeBounty?.amount || 0}
                    </Text>
                    <Text style={styles.bountyAmountLabel}>LUL COINS DI TAGLIA</Text>
                  </View>

                  {livePlayer.activeBounty && livePlayer.activeBounty.amount > 0 ? (
                    <View style={styles.bountyIssuerBox}>
                      <Text style={styles.bountyIssuerText}>
                        Piazzata da: <Text style={{ color: '#38BDF8', fontWeight: '900' }}>{livePlayer.activeBounty.placedByPlayerName}</Text>
                      </Text>
                      <Text style={styles.bountyRuleText}>
                        ⚡ Chiunque sconfiggerà {livePlayer.name} in un match ufficiale live incasserà immediatamente l'intero malloppo!
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.bountyEmptyText}>
                      Nessuna taglia attiva sulla testa di {livePlayer.name}. Per ora passeggia indisturbato...
                    </Text>
                  )}
                </View>

                {/* Sezione Piazza Taglia (se non è se stesso) */}
                {!isMe && associatedPlayer ? (
                  <View style={styles.placeBountySection}>
                    <Text style={styles.placeBountyTitle}>🎯 Alza o Piazza una Taglia</Text>
                    <Text style={styles.placeBountySub}>
                      Pensi che {livePlayer.name} sia troppo comodo? Metti una taglia sulla sua testa: chi riuscirà a batterlo (anche tu!) intascherà il jackpot.
                    </Text>

                    {/* Chips di selezione importo */}
                    <View style={styles.bountyChipsRow}>
                      {[10, 25, 50, 100, 200].map((amount) => {
                        const isSelected = selectedBountyChip === amount;
                        return (
                          <TouchableOpacity
                            key={amount}
                            style={[
                              styles.bountyChip,
                              isSelected && styles.bountyChipActive,
                            ]}
                            onPress={() => {
                              soundEffects.playButtonTap();
                              setSelectedBountyChip(amount);
                            }}
                          >
                            <Text
                              style={[
                                styles.bountyChipText,
                                isSelected && styles.bountyChipTextActive,
                              ]}
                            >
                              +{amount} 🪙
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.walletBountyBar}>
                      <Text style={styles.walletBountyText}>
                        Il tuo saldo: <Text style={{ color: '#FACC15', fontWeight: '900' }}>{userCoins} 🪙</Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.confirmBountyBtn,
                        (selectedBountyChip > userCoins || isPlacingBounty) && styles.btnDisabled,
                      ]}
                      onPress={handlePlaceBounty}
                      disabled={selectedBountyChip > userCoins || isPlacingBounty}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.confirmBountyBtnText}>
                        {isPlacingBounty
                          ? 'Piazzamento in corso...'
                          : `🎯 Metti ${selectedBountyChip} 🪙 sulla sua testa`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : isMe ? (
                  <View style={styles.selfBountyNotice}>
                    <Text style={styles.selfBountyNoticeText}>
                      🛡️ Questa è la tua testa! Non puoi mettere una taglia su te stesso, ma difenditi con onore: se c'è una taglia, ogni avversario darà il 200% per batterti.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.selfBountyNotice}>
                    <Text style={styles.selfBountyNoticeText}>
                      ℹ️ Collega il tuo profilo nelle impostazioni per piazzare taglie sugli avversari.
                    </Text>
                  </View>
                )}
              </View>
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
    maxHeight: '90%',
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
  activeBountyPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  activeBountyPillText: {
    color: '#EF4444',
    fontSize: 10,
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
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
  claimDotBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  claimDotBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  bountyDotBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  bountyDotBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
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
  directMatchupSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  directMatchupTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  directScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    gap: 16,
  },
  directScoreCol: {
    alignItems: 'center',
  },
  directScoreLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  directScoreNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  directScoreDivider: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  directTotalText: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
  recentMatchesSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  recentMatchesTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  recentMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
    gap: 8,
  },
  recentMatchResultBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWin: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  badgeLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  recentMatchResultText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  recentMatchOpponent: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  recentMatchScore: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  recentMatchDelta: {
    fontSize: 11,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
  deltaTextWin: {
    color: '#34D399',
  },
  deltaTextLoss: {
    color: '#EF4444',
  },
  recentMatchDate: {
    color: Colors.textMuted,
    fontSize: 9,
    minWidth: 42,
    textAlign: 'right',
  },
  // Sub-tab 2 Achievements & Trophies
  sectionBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  sectionHeaderSubtitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  trophyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trophyShowcaseCard: {
    width: '48%',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  trophyCardOwned: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  trophyCardLocked: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    opacity: 0.6,
  },
  trophyShowcaseIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  trophyShowcaseName: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  trophyShowcaseStatus: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  systemTrophiesList: {
    gap: 8,
    marginTop: 8,
  },
  systemTrophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  systemTrophyIcon: {
    fontSize: 20,
  },
  systemTrophyName: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
  },
  systemTrophyDesc: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  tierLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 8,
    borderRadius: 8,
  },
  tierLegendItem: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },
  tierLegendArrow: {
    color: Colors.textMuted,
    fontSize: 8,
  },
  achievementCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  achHeaderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  achIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achIconText: {
    fontSize: 20,
  },
  achTitleText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  achCurrentTierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  achCurrentTierBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  achDescText: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  achProgressBox: {
    marginTop: 10,
  },
  achProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  achProgressVal: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  achProgressPct: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  achProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  achProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  tiersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 4,
  },
  tierPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tierPillReached: {
    borderColor: 'rgba(250, 204, 21, 0.3)',
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },
  tierPillClaimed: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  tierPillBadge: {
    fontSize: 11,
  },
  tierPillName: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },
  tierPillTarget: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  tierClaimedCheck: {
    color: '#34D399',
    fontSize: 8,
    fontWeight: '900',
  },
  claimCoinsBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  claimCoinsBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  maxedOutBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 69, 0, 0.12)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4500',
  },
  maxedOutBadgeText: {
    color: '#FF4500',
    fontSize: 9,
    fontWeight: '900',
  },
  toastNotice: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toastNoticeText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
  },
  // Sub-tab 3 Bounty
  bountyPosterCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  bountyPosterHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bountyPosterWanted: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  bountyPosterName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  bountyAmountBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    width: '100%',
  },
  bountyAmountNumber: {
    color: '#FACC15',
    fontSize: 26,
    fontWeight: '900',
  },
  bountyAmountLabel: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 1,
  },
  bountyIssuerBox: {
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  bountyIssuerText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  bountyRuleText: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  bountyEmptyText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  placeBountySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  placeBountyTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  placeBountySub: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  bountyChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bountyChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bountyChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  bountyChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  bountyChipTextActive: {
    color: '#EF4444',
    fontWeight: '900',
  },
  walletBountyBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  walletBountyText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  confirmBountyBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBountyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  selfBountyNotice: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  selfBountyNoticeText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
