import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getPlayerActiveMilestone, getStreakDisplay, getWinRate } from '../core/elo';
import { STARTING_COINS } from '../core/constants';
import { getBorderCardStyle } from '../core/shop';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';

interface PlayerCardProps {
  player: Player;
  rank: number;
  isCurrentPlayer?: boolean;
  onPress?: () => void;
  showRacePoints?: boolean;
  isHotRhythm?: boolean;
  isDecaying?: boolean;
  daysInactive?: number;
  trophies?: { id: string; title: string; icon: string }[];
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  rank,
  isCurrentPlayer,
  onPress,
  showRacePoints = false,
  isHotRhythm = false,
  isDecaying = false,
  daysInactive = 0,
  trophies = [],
}) => {
  const winRate = getWinRate(player.wins, player.losses);
  const streak = getStreakDisplay(player.currentStreak);
  const pColor = player.color || Colors.primary;

  const getRankBadgeColor = () => {
    switch (rank) {
      case 1:
        return Colors.gold;
      case 2:
        return Colors.silver;
      case 3:
        return Colors.bronze;
      default:
        return '#EF4444';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.card,
        rank === 1 && styles.cardFirst,
        rank === 4 && styles.cardFourth,
        isCurrentPlayer && { borderColor: pColor, borderWidth: 2 },
        getBorderCardStyle(player.equippedBorder),
      ]}
    >
      {/* Sfondo / Banner personalizzato */}
      {player.profileBanner ? (
        <View style={styles.cardBannerWrapper}>
          <Image
            source={{ uri: player.profileBanner }}
            style={styles.cardBannerImage}
            resizeMode="cover"
          />
          <View style={styles.cardBannerOverlay} />
        </View>
      ) : null}

      {/* Badge Tuo Profilo se giocatore associato */}
      {isCurrentPlayer && (
        <View style={[styles.yourProfileBadge, { backgroundColor: pColor }]}>
          <Text style={styles.yourProfileBadgeText}>⭐️ IL TUO PROFILO</Text>
        </View>
      )}

      {/* Badge Taglia Attiva */}
      {player.activeBounty && player.activeBounty.amount > 0 && (
        <View style={styles.bountyBadge}>
          <Text style={styles.bountyBadgeText}>🎯 TAGLIA: {player.activeBounty.amount} 🪙</Text>
        </View>
      )}

      {/* Intestazione Riga: Rank + Avatar + Nome + Elo / Race */}
      <View style={styles.topRow}>
        <View style={styles.playerInfo}>
          {/* Badge Posizione */}
          <View style={[styles.rankCircle, { backgroundColor: getRankBadgeColor() }]}>
            <Text style={styles.rankNumber}>#{rank}</Text>
          </View>

          {/* Avatar Emoji */}
          <View style={[styles.avatarCircle, { borderColor: pColor }]}>
            <Text style={styles.avatarEmoji}>{player.avatar}</Text>
          </View>

          <View style={styles.nameBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, flexWrap: 'wrap' }}>
              <Text style={[styles.playerName, { color: pColor }]} numberOfLines={1} ellipsizeMode="tail">
                {player.name}
              </Text>
              {(() => {
                const milestone = getPlayerActiveMilestone(player.elo);
                if (!milestone) return null;
                return (
                  <View style={[styles.milestoneBadge, { borderColor: milestone.color, backgroundColor: `${milestone.color}18` }]}>
                    <Text style={[styles.milestoneBadgeText, { color: milestone.color }]}>{milestone.badge}</Text>
                  </View>
                );
              })()}
            </View>
            {player.equippedTitle ? (
              <View style={styles.equippedTitleBadge}>
                <Text style={styles.equippedTitleText}>{player.equippedTitle}</Text>
              </View>
            ) : null}
            {player.catchphrase ? (
              <View style={[styles.catchphraseRow, { borderLeftColor: pColor }]}>
                <Text style={styles.catchphraseText} numberOfLines={1}>
                  "{player.catchphrase}"
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Punteggio Elo o ATP Race */}
        <View style={styles.eloBlock}>
          <Text style={[styles.eloNumber, showRacePoints && { color: '#FDE047' }]}>
            {showRacePoints ? player.racePoints || 0 : player.elo}
          </Text>
          <Text style={styles.eloLabel}>{showRacePoints ? 'RACE ATP' : 'PUNTI ELO'}</Text>
          {!showRacePoints && isHotRhythm && (
            <View style={styles.rhythmPill}>
              <Text style={styles.rhythmPillText}>🔥 In ritmo</Text>
            </View>
          )}
          {!showRacePoints && isDecaying && (
            <View style={styles.decayPill}>
              <Text style={styles.decayPillText}>⏳ Inattivo</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sezione Trofei Speciali se posseduti */}
      {trophies && trophies.length > 0 && (
        <View style={styles.trophiesRow}>
          {trophies.map((t) => (
            <View key={t.id} style={styles.trophyBadge}>
              <Text style={styles.trophyBadgeIcon}>{t.icon}</Text>
              <Text style={styles.trophyBadgeName}>{t.title}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sezione Tag comici */}
      {player.tags && player.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {player.tags.map((tag, idx) => (
            <View key={idx} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Barra Statistiche: W/L, Winrate, Streak */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Partite</Text>
          <Text style={styles.statValue}>
            <Text style={{ color: Colors.win }}>{player.wins}V</Text> -{' '}
            <Text style={{ color: Colors.loss }}>{player.losses}P</Text>
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Win Rate</Text>
          <Text style={styles.statValue}>{winRate}%</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Striscia</Text>
          <View style={styles.streakWrapper}>
            <Text style={styles.streakEmoji}>{streak.emoji}</Text>
            <Text
              style={[
                styles.statValue,
                streak.type === 'hot' && { color: '#F59E0B' },
                streak.type === 'cold' && { color: '#EF4444' },
              ]}
            >
              {streak.text}
            </Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>LUL Coins</Text>
          <Text style={[styles.statValue, { color: '#FACC15' }]}>
            🪙 {player.coins !== undefined ? player.coins : STARTING_COINS}
          </Text>
        </View>
      </View>

      {/* Barra di progresso Win Rate */}
      <View style={styles.winRateTrack}>
        <View style={[styles.winRateBar, { width: `${winRate}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  cardFirst: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#172033',
  },
  cardFourth: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankNumber: {
    color: '#000',
    fontWeight: '900',
    fontSize: 11,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  nameBlock: {
    flex: 1,
  },
  yourProfileBadge: {
    position: 'absolute',
    top: 6,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  yourProfileBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  bountyBadge: {
    position: 'absolute',
    top: 6,
    left: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  bountyBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  catchphraseRow: {
    borderLeftWidth: 2.5,
    paddingLeft: 6,
    marginTop: 3,
  },
  catchphraseText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  eloBlock: {
    alignItems: 'flex-end',
  },
  eloNumber: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  eloLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    marginTop: 2,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  streakWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakEmoji: {
    fontSize: 13,
  },
  winRateTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  winRateBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  cardBannerWrapper: {
    height: 48,
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  cardBannerImage: {
    width: '100%',
    height: '100%',
  },
  cardBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  rhythmPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  rhythmPillText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
  },
  decayPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  decayPillText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
  trophiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  trophyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  trophyBadgeIcon: {
    fontSize: 11,
  },
  trophyBadgeName: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
  },
  milestoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  milestoneBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  equippedTitleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 2,
  },
  equippedTitleText: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '800',
  },
});
