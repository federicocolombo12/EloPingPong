import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GIF_CATEGORIES, MEME_GIFS, MemeGif } from '../core/constants';
import { Colors } from '../theme/colors';

interface GifPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
  title?: string;
}

interface GifItem {
  id: string;
  name: string;
  url: string;
}

export const GifPickerModal: React.FC<GifPickerModalProps> = ({
  visible,
  onClose,
  onSelectGif,
  title = 'Scegli una GIF o Sticker',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineGifs, setOnlineGifs] = useState<GifItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Ricerca live su GIPHY
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setOnlineGifs([]);
      return;
    }

    if (!searchQuery.trim()) {
      setOnlineGifs([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const queryTerm = searchQuery.trim();
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=LIVDSRZPtcardrGeSPIvPdtRiT0HGAS2&q=${encodeURIComponent(
            queryTerm
          )}&limit=24&rating=g`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const mapped: GifItem[] = json.data
              .map((item: any) => ({
                id: item.id,
                name: item.title?.replace(' GIF', '') || 'GIF',
                url: item.images?.fixed_height?.url || item.images?.downsized?.url || item.images?.original?.url,
              }))
              .filter((item: GifItem) => !!item.url);
            setOnlineGifs(mapped);
          }
        }
      } catch (err) {
        console.warn('Errore ricerca online GIF:', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, visible]);

  // Filtra la libreria locale
  const filteredLocalGifs = MEME_GIFS.filter((gif) => {
    const matchesCategory = selectedCategory === 'all' || gif.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      gif.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gif.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Mostra prima i risultati online se cercati, altrimenti la libreria
  const displayGifs: GifItem[] =
    searchQuery.trim().length > 0 && onlineGifs.length > 0
      ? [...onlineGifs, ...filteredLocalGifs]
      : filteredLocalGifs;

  const handleSelectCustom = () => {
    if (customUrl.trim()) {
      onSelectGif(customUrl.trim());
      setCustomUrl('');
      setShowCustomInput(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎬 {title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Barra di Ricerca Stile WhatsApp */}
          <View style={styles.searchBarRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cerca GIF su tutto il web (es. esultanza, ronaldo, fail)..."
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Categorie Orizzontali Stile WhatsApp */}
          {!searchQuery.trim() && (
            <View style={styles.categoriesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                {GIF_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Link Personalizzato (Opzionale) */}
          {showCustomInput ? (
            <View style={styles.customUrlRow}>
              <TextInput
                style={styles.urlInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="Incolla URL diretto della GIF o immagine..."
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={handleSelectCustom} style={styles.urlBtn}>
                <Text style={styles.urlBtnText}>Usa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowCustomInput(true)}
              style={styles.toggleCustomBtn}
            >
              <Text style={styles.toggleCustomText}>🔗 Incolla URL specifico</Text>
            </TouchableOpacity>
          )}

          {/* Indicatore di caricamento ricerca */}
          {searching && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Ricerca GIF in corso...</Text>
            </View>
          )}

          {/* Griglia GIF / Meme a Due Colonne */}
          <ScrollView
            contentContainerStyle={styles.gifGrid}
            showsVerticalScrollIndicator={false}
          >
            {displayGifs.length === 0 && !searching ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyTitle}>Nessuna GIF trovata</Text>
                <Text style={styles.emptySub}>Prova con un altro termine o seleziona una categoria.</Text>
              </View>
            ) : (
              displayGifs.map((gif, idx) => (
                <TouchableOpacity
                  key={`${gif.id}_${idx}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectGif(gif.url);
                    onClose();
                  }}
                  style={styles.gifItem}
                >
                  <Image
                    source={{ uri: gif.url }}
                    style={styles.gifImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.gifName} numberOfLines={1}>
                    {gif.name}
                  </Text>
                </TouchableOpacity>
              ))
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
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '88%',
    height: '84%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
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
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 12,
  },
  categoryLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryLabelActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
  toggleCustomBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  toggleCustomText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  customUrlRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urlBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
  },
  urlBtnText: {
    color: Colors.textDark,
    fontSize: 11,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  loadingText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  gifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  gifItem: {
    width: '48.5%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
    paddingBottom: 4,
  },
  gifImage: {
    width: '100%',
    height: 105,
    backgroundColor: '#111827',
  },
  gifName: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  emptyBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
