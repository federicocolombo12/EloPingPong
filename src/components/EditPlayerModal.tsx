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
import { AVAILABLE_EMOJIS, AVAILABLE_TAGS } from '../core/constants';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';
import { GifPickerModal } from './GifPickerModal';
import { useElo } from '../context/EloContext';

interface EditPlayerModalProps {
  player: Player | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Player>) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const TAG_QUICK_EMOJIS = ['🏷️', '🎯', '🚀', '💣', '🧱', '⚡', '🍕', '🍺', '👑', '🌪️', '🎪', '💩', '🔥', '🏓'];

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  player,
  visible,
  onClose,
  onSave,
}) => {
  const { customTags, addCustomTag, removeCustomTag, isAdmin, associatedPlayer } = useElo();

  const isOwner = associatedPlayer?.id === player?.id;
  const canEdit = isOwner || isAdmin;

  if (!player || !canEdit) return null;

  const [name, setName] = useState(player.name);
  const [avatar, setAvatar] = useState(player.avatar);
  const [color, setColor] = useState(player.color || '#3B82F6');
  const [catchphrase, setCatchphrase] = useState(player.catchphrase || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(player.tags || []);
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedTagEmoji, setSelectedTagEmoji] = useState('🏷️');
  const [celebrationGif, setCelebrationGif] = useState(player.celebrationGifUrl || '');
  const [profileBanner, setProfileBanner] = useState(player.profileBanner || '');
  const [gifPickerTarget, setGifPickerTarget] = useState<'celebration' | 'banner' | null>(null);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setAvatar(player.avatar);
      setColor(player.color || '#3B82F6');
      setCatchphrase(player.catchphrase || '');
      setSelectedTags(player.tags || []);
      setCelebrationGif(player.celebrationGifUrl || '');
      setProfileBanner(player.profileBanner || '');
    }
  }, [player]);

  const toggleTag = (tagStr: string) => {
    if (selectedTags.includes(tagStr)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagStr));
    } else {
      setSelectedTags([...selectedTags, tagStr]);
    }
  };

  const handleAddNewTag = async () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    const fullTag = `${selectedTagEmoji} ${trimmed}`;
    
    // Add to shared customTags pool
    await addCustomTag(selectedTagEmoji, trimmed);
    
    // Also select it for this player
    if (!selectedTags.includes(fullTag)) {
      setSelectedTags([...selectedTags, fullTag]);
    }
    setCustomTagInput('');
  };

  const handleDeleteCustomTag = async (tagId: string, fullTagStr: string) => {
    await removeCustomTag(tagId);
    setSelectedTags((prev) => prev.filter((t) => t !== fullTagStr));
  };

  const handleSave = () => {
    if (!player) return;
    onSave(player.id, {
      name: name.trim() || player.name,
      avatar,
      color,
      catchphrase: catchphrase.trim(),
      tags: Array.from(new Set(selectedTags)),
      celebrationGifUrl: celebrationGif.trim(),
      profileBanner: profileBanner.trim(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Modifica Profilo di {player.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Nome */}
            <Text style={styles.label}>Nome Giocatore</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Es. Alberto"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Avatar Emoji */}
            <Text style={styles.label}>Avatar Emoji</Text>
            <View style={styles.emojiRow}>
              {AVAILABLE_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setAvatar(e)}
                  style={[styles.emojiBtn, avatar === e && styles.emojiBtnSelected]}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Colore del Giocatore */}
            <Text style={styles.label}>Colore Distintivo</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    color === c && styles.colorCircleSelected,
                  ]}
                />
              ))}
            </View>

            {/* Catchphrase */}
            <Text style={styles.label}>Catchphrase / Frase Celebre</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={catchphrase}
              onChangeText={setCatchphrase}
              placeholder="Es. Non guardo il punteggio, guardo lo stile!"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={2}
            />

            {/* GIF DI CELEBRAZIONE PER LE SOGLIE ELO */}
            <Text style={styles.label}>GIF di Trionfo (spawna a tutto schermo alle soglie Elo!)</Text>
            <View style={styles.gifConfigRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={celebrationGif}
                onChangeText={setCelebrationGif}
                placeholder="Link GIF celebrazione (URL)..."
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity
                onPress={() => setGifPickerTarget('celebration')}
                style={styles.pickGifBtn}
              >
                <Text style={styles.pickGifBtnText}>🎬 Scegli GIF</Text>
              </TouchableOpacity>
            </View>
            {celebrationGif ? (
              <View style={styles.previewBox}>
                <Image source={{ uri: celebrationGif }} style={styles.previewImage} />
                <Text style={styles.previewCaption}>Anteprima animazione record</Text>
              </View>
            ) : null}

            {/* SFONDO / BANNER DEL PROFILO */}
            <Text style={styles.label}>Sfondo / Banner del Profilo</Text>
            <View style={styles.gifConfigRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={profileBanner}
                onChangeText={setProfileBanner}
                placeholder="Link immagine o GIF per sfondo (URL)..."
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity
                onPress={() => setGifPickerTarget('banner')}
                style={styles.pickGifBtn}
              >
                <Text style={styles.pickGifBtnText}>🖼️ Scegli</Text>
              </TouchableOpacity>
            </View>

            {profileBanner.trim() ? (
              <View style={[styles.previewBox, { marginTop: 8 }]}>
                <Image
                  source={{ uri: profileBanner.trim() }}
                  style={[styles.previewImage, { height: 90 }]}
                  resizeMode="cover"
                />
                <View style={styles.bannerPreviewBottomRow}>
                  <Text style={styles.previewCaption}>Anteprima testata del profilo</Text>
                  <TouchableOpacity
                    onPress={() => setProfileBanner('')}
                    style={styles.removeBannerBtn}
                  >
                    <Text style={styles.removeBannerBtnText}>✕ Rimuovi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* TAG ATTUALMENTE SUL PROFILO CON RIMOZIONE IMMEDIATA */}
            <View style={styles.activeTagsHeaderRow}>
              <Text style={styles.label}>🏷️ Tag Attualmente sul Profilo</Text>
              {selectedTags.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSelectedTags([])}
                  style={styles.clearAllTagsBtn}
                >
                  <Text style={styles.clearAllTagsBtnText}>Rimuovi tutti</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedTags.length === 0 ? (
              <View style={styles.emptyTagsNotice}>
                <Text style={styles.emptyTagsText}>Nessun tag assegnato. Selezionalo qui sotto!</Text>
              </View>
            ) : (
              <View style={styles.activeTagsContainer}>
                {Array.from(new Set(selectedTags)).map((tag, idx) => (
                  <TouchableOpacity
                    key={`${tag}_${idx}`}
                    onPress={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                    style={styles.activeTagPill}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activeTagPillText}>{tag}</Text>
                    <View style={styles.activeTagRemoveBadge}>
                      <Text style={styles.activeTagRemoveText}>✕</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Tag / Badge Personali */}
            <Text style={styles.label}>Scegli tra i Titoli Ufficiali</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                  >
                    <Text style={[styles.tagPillText, isSelected && styles.tagPillTextSelected]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tag Personalizzati della Lega */}
            <Text style={styles.label}>Tag Personalizzati della Lega</Text>
            {customTags.length === 0 ? (
              <Text style={styles.emptyTagsText}>Nessun tag personalizzato creato.</Text>
            ) : (
              <View style={styles.tagsContainer}>
                {customTags.map((cTag) => {
                  const fullStr = `${cTag.emoji} ${cTag.text}`;
                  const isSelected = selectedTags.includes(fullStr);
                  return (
                    <View
                      key={cTag.id}
                      style={[styles.customTagPillWrapper, isSelected && styles.customTagPillWrapperSelected]}
                    >
                      <TouchableOpacity
                        onPress={() => toggleTag(fullStr)}
                        style={styles.customTagPillBtn}
                      >
                        <Text style={[styles.tagPillText, isSelected && styles.tagPillTextSelected]}>
                          {fullStr}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteCustomTag(cTag.id, fullStr)}
                        style={styles.deleteTagBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.deleteTagBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Crea & Aggiungi Nuovo Tag alla Lega */}
            <Text style={styles.label}>Crea Nuovo Tag con Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagEmojiScroll}>
              {TAG_QUICK_EMOJIS.map((em) => (
                <TouchableOpacity
                  key={em}
                  onPress={() => setSelectedTagEmoji(em)}
                  style={[
                    styles.tagEmojiBtn,
                    selectedTagEmoji === em && styles.tagEmojiBtnSelected,
                  ]}
                >
                  <Text style={styles.tagEmojiText}>{em}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.customTagRow}>
              <View style={styles.tagEmojiPrefix}>
                <Text style={styles.tagEmojiPrefixText}>{selectedTagEmoji}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                placeholder="Es. Sfonda Retine, Mano di Gesso..."
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={handleAddNewTag} style={styles.addTagBtn}>
                <Text style={styles.addTagBtnText}>+ Aggiungi Tag</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Salva Modifiche</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal Selettore GIF */}
      <GifPickerModal
        visible={gifPickerTarget !== null}
        onClose={() => setGifPickerTarget(null)}
        onSelectGif={(url) => {
          if (gifPickerTarget === 'celebration') {
            setCelebrationGif(url);
          } else if (gifPickerTarget === 'banner') {
            setProfileBanner(url);
          }
        }}
        title={gifPickerTarget === 'celebration' ? 'Scegli GIF di Celebrazione' : 'Scegli Sfondo / Banner'}
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
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  gifConfigRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  pickGifBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  pickGifBtnText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
  previewBox: {
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: 120,
  },
  previewCaption: {
    color: Colors.textMuted,
    fontSize: 10,
    paddingVertical: 4,
  },
  bannerPreviewBottomRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  removeBannerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  removeBannerBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiBtnSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: Colors.primary,
  },
  emojiText: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagPillSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.primary,
  },
  tagPillText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tagPillTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyTagsText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  activeTagsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clearAllTagsBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearAllTagsBtnText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyTagsNotice: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: 6,
  },
  activeTagPillText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeTagRemoveBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTagRemoveText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '900',
  },
  customTagPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  customTagPillWrapperSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.primary,
  },
  customTagPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteTagBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTagBtnText: {
    color: Colors.loss,
    fontSize: 10,
    fontWeight: '900',
  },
  tagEmojiScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagEmojiBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagEmojiBtnSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  tagEmojiText: {
    fontSize: 16,
  },
  tagEmojiPrefix: {
    width: 38,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagEmojiPrefixText: {
    fontSize: 18,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addTagBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addTagBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: '900',
  },
});
