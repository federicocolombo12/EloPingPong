import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    ENVIRONMENTAL_MODIFIERS,
    PERSONAL_MODIFIERS,
    REACTION_EMOJIS,
} from '../core/constants';
import { Match, Player } from '../core/types';
import { Colors } from '../theme/colors';

interface MatchCardProps {
  match: Match;
  players: Player[];
  isLatest: boolean;
  onUndo?: () => void;
  onOpenComments?: (match: Match) => void;
  onQuickReact?: (matchId: string, emoji: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  players,
  isLatest,
  onUndo,
  onOpenComments,
  onQuickReact,
}) => {
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);

  const isP1Winner = match.winnerId === match.player1Id;
  const isP2Winner = match.winnerId === match.player2Id;

  // Formattazione data
  const dateObj = new Date(match.timestamp);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { day: '2-digit', month: 'short' });

  // Modificatori
  const envLabels = (match.environmentalModifiers || [])
    .map((id) => ENVIRONMENTAL_MODIFIERS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  const p1ModLabels = (match.player1Modifiers || [])
    .map((id) => PERSONAL_MODIFIERS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  const p2ModLabels = (match.player2Modifiers || [])
    .map((id) => PERSONAL_MODIFIERS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  const commentsCount = match.comments?.length || 0;

  // Calcolo totale reazioni
  const activeReactions = REACTION_EMOJIS.filter(
    (emoji) => (match.reactions?.[emoji]?.length || 0) > 0
  );

  return (
    <View style={[styles.card, isLatest && styles.cardLatest]}>
      {/* Top Bar: Data + Badge Ultimo Match */}
      <View style={styles.topBar}>
        <Text style={styles.dateText}>
          📅 {formattedDate} alle {formattedTime}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {match.isFriendly && (
            <View style={styles.friendlyBadge}>
              <Text style={styles.friendlyBadgeText}>🤝 AMICHEVOLE</Text>
            </View>
          )}
          {isLatest && (
            <View style={styles.latestBadge}>
              <Text style={styles.latestBadgeText}>ULTIMO MATCH</Text>
            </View>
          )}
        </View>
      </View>

      {/* Scontro: Giocatore 1 vs Giocatore 2 */}
      <View style={styles.matchupRow}>
        {/* Player 1 */}
        <View style={[styles.playerCol, isP1Winner && styles.winnerCol]}>
          <View style={styles.avatarRow}>
            <Text style={styles.avatarText}>{p1?.avatar || '👤'}</Text>
            {isP1Winner && <Text style={styles.winnerCrown}>👑</Text>}
          </View>
          <Text style={[styles.playerName, isP1Winner && styles.winnerName]} numberOfLines={1}>
            {p1?.name || 'Giocatore 1'}
          </Text>
          {match.isFriendly ? (
            <Text style={styles.deltaFriendly}>0 ELO</Text>
          ) : isP1Winner ? (
            <Text style={styles.deltaWin}>+{match.winnerEloDelta ?? match.eloDelta} ELO</Text>
          ) : (
            <Text style={styles.deltaLoss}>-{match.loserEloDelta ?? match.eloDelta} ELO</Text>
          )}
        </View>

        {/* Punteggio Centrale */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBadge}>
            <Text style={[styles.scoreNumber, isP1Winner && styles.scoreWinner]}>
              {match.score1}
            </Text>
            <Text style={styles.scoreDivider}>-</Text>
            <Text style={[styles.scoreNumber, isP2Winner && styles.scoreWinner]}>
              {match.score2}
            </Text>
          </View>
          <Text style={styles.vsLabel}>FINALE</Text>
        </View>

        {/* Player 2 */}
        <View style={[styles.playerCol, isP2Winner && styles.winnerCol]}>
          <View style={styles.avatarRow}>
            <Text style={styles.avatarText}>{p2?.avatar || '👤'}</Text>
            {isP2Winner && <Text style={styles.winnerCrown}>👑</Text>}
          </View>
          <Text style={[styles.playerName, isP2Winner && styles.winnerName]} numberOfLines={1}>
            {p2?.name || 'Giocatore 2'}
          </Text>
          {match.isFriendly ? (
            <Text style={styles.deltaFriendly}>0 ELO</Text>
          ) : isP2Winner ? (
            <Text style={styles.deltaWin}>+{match.winnerEloDelta ?? match.eloDelta} ELO</Text>
          ) : (
            <Text style={styles.deltaLoss}>-{match.loserEloDelta ?? match.eloDelta} ELO</Text>
          )}
        </View>
      </View>

      {/* Badge Modificatori Partita */}
      {(envLabels.length > 0 || p1ModLabels.length > 0 || p2ModLabels.length > 0) && (
        <View style={styles.modRow}>
          {envLabels.map((lbl, idx) => (
            <View key={`env_${idx}`} style={styles.modBadgeEnv}>
              <Text style={styles.modBadgeText}>{lbl}</Text>
            </View>
          ))}
          {p1ModLabels.map((lbl, idx) => (
            <View key={`p1_${idx}`} style={styles.modBadgePersonal}>
              <Text style={styles.modBadgeText}>{p1?.name}: {lbl}</Text>
            </View>
          ))}
          {p2ModLabels.map((lbl, idx) => (
            <View key={`p2_${idx}`} style={styles.modBadgePersonal}>
              <Text style={styles.modBadgeText}>{p2?.name}: {lbl}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Statistiche Live Match se registrate */}
      {match.stats && (
        ((match.stats.player1Edges || 0) > 0 ||
          (match.stats.player2Edges || 0) > 0 ||
          (match.stats.player1Nets || 0) > 0 ||
          (match.stats.player2Nets || 0) > 0 ||
          (match.stats.player1Smashes || 0) > 0 ||
          (match.stats.player2Smashes || 0) > 0 ||
          (match.stats.player1ServeErrors || 0) > 0 ||
          (match.stats.player2ServeErrors || 0) > 0) && (
          <View style={styles.statsSummaryRow}>
            {((match.stats.player1Edges || 0) > 0 || (match.stats.player2Edges || 0) > 0) && (
              <View style={styles.statsPill}>
                <Text style={styles.statsPillText}>
                  🎲 Spigoli: {match.stats.player1Edges || 0}-{match.stats.player2Edges || 0}
                </Text>
              </View>
            )}
            {((match.stats.player1Nets || 0) > 0 || (match.stats.player2Nets || 0) > 0) && (
              <View style={styles.statsPill}>
                <Text style={styles.statsPillText}>
                  🕸️ Net: {match.stats.player1Nets || 0}-{match.stats.player2Nets || 0}
                </Text>
              </View>
            )}
            {((match.stats.player1Smashes || 0) > 0 || (match.stats.player2Smashes || 0) > 0) && (
              <View style={styles.statsPillSmash}>
                <Text style={styles.statsPillTextSmash}>
                  💥 Smash: {match.stats.player1Smashes || 0}-{match.stats.player2Smashes || 0}
                </Text>
              </View>
            )}
            {((match.stats.player1ServeErrors || 0) > 0 || (match.stats.player2ServeErrors || 0) > 0) && (
              <View style={styles.statsPillFault}>
                <Text style={styles.statsPillTextFault}>
                  ❌ Falli: {match.stats.player1ServeErrors || 0}-{match.stats.player2ServeErrors || 0}
                </Text>
              </View>
            )}
          </View>
        )
      )}

      {/* Nota opzionale */}
      {match.note ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>"{match.note}"</Text>
        </View>
      ) : null}

      {/* SCOMMESSE PIAZZATE SUL MATCH */}
      {match.bets && Object.keys(match.bets).length > 0 && (
        <View style={styles.betsContainer}>
          <Text style={styles.betsTitle}>🎲 Riunione Bet:</Text>
          <View style={styles.betsGrid}>
            {Object.values(match.bets).map((bet) => {
              const targetName = bet.betOnPlayer === 1 ? p1?.name : p2?.name;
              const isWon = bet.status === 'won';
              return (
                <View
                  key={bet.id}
                  style={[
                    styles.betItem,
                    isWon ? styles.betItemWon : styles.betItemLost,
                  ]}
                >
                  <Text style={styles.betItemText}>
                    {bet.bettorAvatar} {bet.bettorName}:{' '}
                    <Text style={{ fontWeight: '800' }}>{bet.amount}🪙</Text> su {targetName} ({bet.odds.toFixed(2)}x){' '}
                    ➔ {isWon ? <Text style={styles.betItemWonText}>+{bet.potentialPayout}🪙 🎉</Text> : <Text style={styles.betItemLostText}>Persa 💀</Text>}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* BARRA INTERATTIVA: REAZIONI & COMMENTI (Stile Reddit) */}
      <View style={styles.socialBar}>
        {/* Reazioni attive */}
        <View style={styles.reactionsList}>
          {activeReactions.map((emoji) => {
            const count = match.reactions?.[emoji]?.length || 0;
            return (
              <TouchableOpacity
                key={emoji}
                onPress={() => onQuickReact && onQuickReact(match.id, emoji)}
                style={styles.reactionTag}
              >
                <Text style={styles.reactionTagEmoji}>{emoji}</Text>
                <Text style={styles.reactionTagCount}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottone Commenti / Thread */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onOpenComments && onOpenComments(match)}
          style={styles.commentsBtn}
        >
          <Text style={styles.commentsBtnText}>
            💬 {commentsCount === 0 ? 'Commenta' : `${commentsCount} commenti`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasto Undo per l'ultimo match */}
      {isLatest && onUndo && (
        <TouchableOpacity activeOpacity={0.8} onPress={onUndo} style={styles.undoBtn}>
          <Text style={styles.undoBtnText}>↩️ Annulla questo match (Undo)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLatest: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: '#152132',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  friendlyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  friendlyBadgeText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
  },
  latestBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  latestBadgeText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
  },
  winnerCol: {},
  avatarRow: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 28,
  },
  winnerCrown: {
    position: 'absolute',
    top: -10,
    right: -8,
    fontSize: 14,
  },
  playerName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  winnerName: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  deltaWin: {
    color: Colors.win,
    fontSize: 11,
    fontWeight: '800',
  },
  deltaLoss: {
    color: Colors.loss,
    fontSize: 11,
    fontWeight: '700',
  },
  deltaFriendly: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreNumber: {
    color: Colors.textSecondary,
    fontSize: 20,
    fontWeight: '900',
    minWidth: 24,
    textAlign: 'center',
  },
  scoreWinner: {
    color: '#FDE047',
  },
  scoreDivider: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 4,
  },
  vsLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  modRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  modBadgeEnv: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  modBadgePersonal: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  modBadgeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  statsSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  statsPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statsPillText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  statsPillSmash: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statsPillTextSmash: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
  statsPillFault: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statsPillTextFault: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  noteBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
  },
  noteText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  socialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  reactionsList: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  reactionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  reactionTagEmoji: {
    fontSize: 12,
  },
  reactionTagCount: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  commentsBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  commentsBtnText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  undoBtn: {
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  undoBtnText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  betsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  betsTitle: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  betsGrid: {
    gap: 4,
  },
  betItem: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  betItemWon: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  betItemLost: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  betItemText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  betItemWonText: {
    color: '#34D399',
    fontWeight: '800',
  },
  betItemLostText: {
    color: '#EF4444',
    fontWeight: '800',
  },
});
