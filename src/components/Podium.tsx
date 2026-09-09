import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';

interface PodiumProps {
  top3: Player[];
  onSelectPlayer?: (player: Player) => void;
}

export const Podium: React.FC<PodiumProps> = ({ top3 }) => {
  if (top3.length < 3) return null;

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <View style={styles.container}>
      {/* 2° Posto (Sinistra) */}
      <View style={[styles.column, styles.columnSecond]}>
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarText}>{second.avatar}</Text>
          <View style={[styles.rankBadge, { backgroundColor: Colors.silver }]}>
            <Text style={styles.rankBadgeText}>2</Text>
          </View>
        </View>
        <Text style={styles.playerName} numberOfLines={1}>
          {second.name}
        </Text>
        <Text style={styles.playerElo}>{second.elo} ELO</Text>

        <View style={[styles.pedestal, styles.pedestalSecond]}>
          <Text style={styles.pedestalLabel}>🥈 2°</Text>
          <Text style={styles.pedestalSub}>{second.wins}V - {second.losses}P</Text>
        </View>
      </View>

      {/* 1° Posto (Centro - Più alto e dorato) */}
      <View style={[styles.column, styles.columnFirst]}>
        <View style={styles.crownContainer}>
          <Text style={styles.crownText}>👑</Text>
        </View>
        <View style={[styles.avatarBubble, styles.avatarBubbleFirst]}>
          <Text style={styles.avatarTextFirst}>{first.avatar}</Text>
          <View style={[styles.rankBadge, { backgroundColor: Colors.gold }]}>
            <Text style={styles.rankBadgeText}>1</Text>
          </View>
        </View>
        <Text style={[styles.playerName, styles.playerNameFirst]} numberOfLines={1}>
          {first.name}
        </Text>
        <View style={styles.eloBadgeFirst}>
          <Text style={styles.playerEloFirst}>{first.elo} ELO</Text>
        </View>

        {first.catchphrase ? (
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText} numberOfLines={2}>
              "{first.catchphrase}"
            </Text>
          </View>
        ) : null}

        <View style={[styles.pedestal, styles.pedestalFirst]}>
          <Text style={styles.pedestalLabelFirst}>🥇 1° RE</Text>
          <Text style={styles.pedestalSubFirst}>{first.wins}V - {first.losses}P</Text>
        </View>
      </View>

      {/* 3° Posto (Destra) */}
      <View style={[styles.column, styles.columnThird]}>
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarText}>{third.avatar}</Text>
          <View style={[styles.rankBadge, { backgroundColor: Colors.bronze }]}>
            <Text style={styles.rankBadgeText}>3</Text>
          </View>
        </View>
        <Text style={styles.playerName} numberOfLines={1}>
          {third.name}
        </Text>
        <Text style={styles.playerElo}>{third.elo} ELO</Text>

        <View style={[styles.pedestal, styles.pedestalThird]}>
          <Text style={styles.pedestalLabel}>🥉 3°</Text>
          <Text style={styles.pedestalSub}>{third.wins}V - {third.losses}P</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    marginVertical: 12,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 110,
  },
  columnFirst: {
    zIndex: 3,
  },
  columnSecond: {
    zIndex: 2,
    marginRight: -4,
  },
  columnThird: {
    zIndex: 1,
    marginLeft: -4,
  },
  crownContainer: {
    marginBottom: -8,
    zIndex: 10,
  },
  crownText: {
    fontSize: 26,
  },
  avatarBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarBubbleFirst: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: Colors.gold,
    backgroundColor: '#1E2538',
  },
  avatarText: {
    fontSize: 30,
  },
  avatarTextFirst: {
    fontSize: 38,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  rankBadgeText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  playerName: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
    textAlign: 'center',
  },
  playerNameFirst: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FDE047',
  },
  playerElo: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  eloBadgeFirst: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginBottom: 6,
  },
  playerEloFirst: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  speechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 6,
    maxWidth: 106,
  },
  speechBubbleText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  pedestal: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  pedestalFirst: {
    height: 105,
    backgroundColor: '#2A2312',
    borderColor: Colors.gold,
  },
  pedestalSecond: {
    height: 80,
    backgroundColor: '#1E2530',
    borderColor: Colors.silver,
  },
  pedestalThird: {
    height: 65,
    backgroundColor: '#261F1A',
    borderColor: Colors.bronze,
  },
  pedestalLabel: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 13,
  },
  pedestalLabelFirst: {
    color: Colors.gold,
    fontWeight: '900',
    fontSize: 15,
  },
  pedestalSub: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  pedestalSubFirst: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
