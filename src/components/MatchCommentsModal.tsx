import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useElo } from '../context/EloContext';
import {
    ENVIRONMENTAL_MODIFIERS,
    PERSONAL_MODIFIERS,
    REACTION_EMOJIS,
} from '../core/constants';
import { Match, Player } from '../core/types';
import { Colors } from '../theme/colors';
import { GifPickerModal } from './GifPickerModal';

interface MatchCommentsModalProps {
  match: Match | null;
  players: Player[];
  visible: boolean;
  onClose: () => void;
  onAddReaction: (matchId: string, emoji: string, playerId: string) => void;
  onAddComment: (matchId: string, playerId: string, text: string, gifUrl?: string) => void;
}

export const MatchCommentsModal: React.FC<MatchCommentsModalProps> = ({
  match,
  players,
  visible,
  onClose,
  onAddReaction,
  onAddComment,
}) => {
  if (!match) return null;

  const { associatedPlayer } = useElo();
  const [commentText, setCommentText] = useState('');
  const [attachedGif, setAttachedGif] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const isP1Winner = match.winnerId === match.player1Id;

  const handleSendComment = () => {
    if (!associatedPlayer) {
      alert('Seleziona prima il tuo profilo personale (in alto a destra) per commentare!');
      return;
    }
    if (!commentText.trim() && !attachedGif) return;
    onAddComment(match.id, associatedPlayer.id, commentText.trim(), attachedGif || undefined);
    setCommentText('');
    setAttachedGif(null);
  };

  // Calcola etichette modificatori
  const envLabels = (match.environmentalModifiers || [])
    .map((id) => ENVIRONMENTAL_MODIFIERS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  const p1ModLabels = (match.player1Modifiers || [])
    .map((id) => PERSONAL_MODIFIERS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  const p2ModLabels = (match.player2Modifiers || [])
    .map((id) => PERSONAL_MODIFIERS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header con Match Summary */}
          <View style={styles.header}>
            <View style={styles.matchSummary}>
              <Text style={styles.matchVsTitle}>
                {p1?.avatar} {p1?.name}{' '}
                <Text style={styles.scoreText}>
                  {match.score1} - {match.score2}
                </Text>{' '}
                {p2?.avatar} {p2?.name}
              </Text>
              <Text style={styles.deltaBadge}>
                {match.isFriendly
                  ? '🤝 Partita Amichevole (No Elo)'
                  : isP1Winner
                  ? `🏆 ${p1?.name} vince (+${match.winnerEloDelta ?? match.eloDelta} Elo)`
                  : `🏆 ${p2?.name} vince (+${match.winnerEloDelta ?? match.eloDelta} Elo)`}
              </Text>

              {/* Modificatori Badge */}
              {(envLabels.length > 0 || p1ModLabels.length > 0 || p2ModLabels.length > 0) && (
                <View style={styles.modBadgesRow}>
                  {envLabels.map((lbl, i) => (
                    <View key={`env_${i}`} style={styles.modBadgeEnv}>
                      <Text style={styles.modBadgeText}>{lbl}</Text>
                    </View>
                  ))}
                  {p1ModLabels.map((lbl, i) => (
                    <View key={`p1m_${i}`} style={styles.modBadgePersonal}>
                      <Text style={styles.modBadgeText}>{p1?.name}: {lbl}</Text>
                    </View>
                  ))}
                  {p2ModLabels.map((lbl, i) => (
                    <View key={`p2m_${i}`} style={styles.modBadgePersonal}>
                      <Text style={styles.modBadgeText}>{p2?.name}: {lbl}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* BARRA REAZIONI STILE REDDIT */}
          <View style={styles.reactionSection}>
            <Text style={styles.sectionLabel}>Reazioni veloci:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reactionsScroll}>
              {REACTION_EMOJIS.map((emoji) => {
                const reactedPlayerIds = match.reactions?.[emoji] || [];
                const count = reactedPlayerIds.length;
                const hasReacted = !!associatedPlayer && reactedPlayerIds.includes(associatedPlayer.id);

                return (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => {
                      if (!associatedPlayer) {
                        alert('Seleziona prima il tuo profilo personale (in alto a destra) per reagire!');
                        return;
                      }
                      onAddReaction(match.id, emoji, associatedPlayer.id);
                    }}
                    style={[styles.reactionPill, hasReacted && styles.reactionPillActive]}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* THREAD DEI COMMENTI */}
          <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
            {(!match.comments || match.comments.length === 0) ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyText}>Ancora nessun commento o sfottò.</Text>
                <Text style={styles.emptySubText}>Sii il primo a commentare questo match!</Text>
              </View>
            ) : (
              match.comments.map((comment) => {
                const author = players.find((p) => p.id === comment.playerId);
                const authorColor = author?.color || '#3B82F6';
                const timeStr = new Date(comment.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View
                    key={comment.id}
                    style={[
                      styles.commentItem,
                      { borderLeftColor: authorColor, borderLeftWidth: 3.5 },
                    ]}
                  >
                    <View style={styles.commentHeader}>
                      <View style={styles.authorRow}>
                        <View style={[styles.authorAvatarCircle, { borderColor: authorColor }]}>
                          <Text style={styles.authorAvatar}>{author?.avatar || '👤'}</Text>
                        </View>
                        <Text style={[styles.authorName, { color: authorColor }]}>
                          {author?.name || 'Giocatore'}
                        </Text>
                      </View>
                      <Text style={styles.commentTime}>{timeStr}</Text>
                    </View>

                    {comment.text ? (
                      <Text style={styles.commentBodyText}>{comment.text}</Text>
                    ) : null}

                    {comment.gifUrl ? (
                      <View style={styles.commentGifWrapper}>
                        <Image
                          source={{ uri: comment.gifUrl }}
                          style={styles.commentGifImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* GIF ALLEGATA IN ANTEPRIMA */}
          {attachedGif && (
            <View style={styles.gifPreviewRow}>
              <Image source={{ uri: attachedGif }} style={styles.gifThumb} />
              <Text style={styles.gifAttachedLabel}>GIF allegata pronta all'invio</Text>
              <TouchableOpacity onPress={() => setAttachedGif(null)} style={styles.removeGifBtn}>
                <Text style={styles.removeGifText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* IDENTITÀ UTENTE E BARRA DI SCRITTURA */}
          <View style={styles.inputArea}>
            {associatedPlayer ? (
              <View style={styles.authorBadgeRow}>
                <Text style={styles.authorPickerLabel}>Commenti come:</Text>
                <View
                  style={[
                    styles.authorChipLocked,
                    {
                      backgroundColor: `${associatedPlayer.color || '#3B82F6'}20`,
                      borderColor: associatedPlayer.color || '#3B82F6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.authorChipText,
                      { color: associatedPlayer.color || '#3B82F6', fontWeight: '900' },
                    ]}
                  >
                    {associatedPlayer.avatar} {associatedPlayer.name} 🔒
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.authorWarningBox}>
                <Text style={styles.authorWarningText}>
                  ⚠️ Seleziona il tuo profilo dal menu in alto per commentare con la tua identità!
                </Text>
              </View>
            )}

            <View style={styles.composerRow}>
              <TextInput
                style={styles.composerInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Scrivi un commento..."
                placeholderTextColor={Colors.textMuted}
                onSubmitEditing={handleSendComment}
              />
              <TouchableOpacity
                onPress={() => setShowGifPicker(true)}
                style={styles.gifButton}
              >
                <Text style={styles.gifButtonText}>🎬 GIF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendComment}
                style={styles.sendButton}
              >
                <Text style={styles.sendButtonText}>Invia</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Modal Selettore GIF */}
      <GifPickerModal
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={(url) => setAttachedGif(url)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    height: '85%',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  matchSummary: {
    flex: 1,
  },
  matchVsTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  scoreText: {
    color: '#FDE047',
    fontWeight: '900',
    fontSize: 18,
    marginHorizontal: 4,
  },
  deltaBadge: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  modBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  modBadgeEnv: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  modBadgePersonal: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  modBadgeText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  reactionSection: {
    marginVertical: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  reactionsScroll: {
    flexDirection: 'row',
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: Colors.primary,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  commentsList: {
    flex: 1,
    marginVertical: 6,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptySubText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  commentItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  authorAvatar: {
    fontSize: 14,
  },
  authorName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  commentTime: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  commentBodyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  commentGifWrapper: {
    marginTop: 6,
    borderRadius: 10,
    overflow: 'hidden',
    height: 120,
    maxWidth: 220,
  },
  commentGifImage: {
    width: '100%',
    height: '100%',
  },
  gifPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 6,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  gifThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  gifAttachedLabel: {
    flex: 1,
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '700',
  },
  removeGifBtn: {
    padding: 6,
  },
  removeGifText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '900',
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorPickerLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginRight: 6,
  },
  authorChipLocked: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  authorWarningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  authorWarningText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  authorChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authorChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: '#3B82F6',
  },
  authorChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gifButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gifButtonText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendButtonText: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: '900',
  },
});
