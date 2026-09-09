import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { STARTING_COINS } from '../core/constants';
import { MysteryBoxOutcome, SHOP_ITEMS } from '../core/shop';
import { ShopItem } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

export const ShopScreen: React.FC = () => {
  const {
    associatedPlayer,
    purchaseShopItem,
    equipPlayerItem,
    claimBailout,
  } = useElo();

  const [mysteryModal, setMysteryModal] = useState<MysteryBoxOutcome | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const playerCoins = associatedPlayer?.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;
  const userInventory = associatedPlayer?.inventory || [];
  const equippedTitle = associatedPlayer?.equippedTitle;
  const equippedBorder = associatedPlayer?.equippedBorder;
  const hasInsurance = !!associatedPlayer?.hasBetInsurance;

  const handleBuy = async (item: ShopItem) => {
    soundEffects.playButtonTap();
    if (!associatedPlayer) {
      const msg = 'Devi collegare il tuo profilo giocatore per acquistare al Bazar!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Accesso Richiesto', msg);
      return;
    }

    if (playerCoins < item.price) {
      const msg = `LUL Coins insufficienti! Ti mancano ${item.price - playerCoins} 🪙`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Saldo Insufficiente', msg);
      return;
    }

    setBuyingId(item.id);
    try {
      const res = await purchaseShopItem(item.id);
      if (!res.success) {
        const msg = res.error || 'Errore durante l\'acquisto.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Errore', msg);
      } else {
        if (res.mysteryOutcome) {
          setMysteryModal(res.mysteryOutcome);
        } else {
          const msg = `🎉 Hai acquistato con successo "${item.name}"!`;
          Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Acquisto Completato', msg);
        }
      }
    } finally {
      setBuyingId(null);
    }
  };

  const handleToggleEquip = async (type: 'title' | 'border', idOrName: string) => {
    soundEffects.playButtonTap();
    if (type === 'title') {
      const isCurrentlyEquipped = equippedTitle === idOrName;
      await equipPlayerItem('title', isCurrentlyEquipped ? null : idOrName);
    } else {
      const isCurrentlyEquipped = equippedBorder === idOrName;
      await equipPlayerItem('border', isCurrentlyEquipped ? null : idOrName);
    }
  };

  const handleClaimBailout = async () => {
    soundEffects.playButtonTap();
    const res = await claimBailout();
    if (!res.success) {
      const msg = res.error || 'Impossibile richiedere il sussidio ora.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sussidio di Povertà', msg);
    } else {
      const msg = '🎉 Sussidio accreditato! Hai ricevuto 50 LUL Coins!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Bailout Concesso! 💸', msg);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Banner */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletIcon}>🪙</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletTitle}>Il Tuo Portafoglio LUL</Text>
            <Text style={styles.walletAmount}>{playerCoins} LUL Coins</Text>
          </View>
          {playerCoins === 0 && (
            <TouchableOpacity onPress={handleClaimBailout} style={styles.bailoutBtn} activeOpacity={0.8}>
              <Text style={styles.bailoutBtnText}>💸 Sussidio (+50)</Text>
            </TouchableOpacity>
          )}
        </View>

        {hasInsurance && (
          <View style={styles.insuranceActiveBadge}>
            <Text style={styles.insuranceActiveText}>
              🛡️ Assicurazione Scommessa Attiva: rimborso 50% garantito sulla prossima bet persa!
            </Text>
          </View>
        )}
      </View>

      {/* SEZIONE 1: TITOLI ONORARI */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎯 Titoli Onorari Esclusivi</Text>
          <Text style={styles.sectionSubtitle}>Sfoggiati sotto il tuo nome su card e podio</Text>
        </View>

        <View style={styles.itemsGrid}>
          {SHOP_ITEMS.filter((i) => i.category === 'title').map((item) => {
            const isOwned = userInventory.includes(item.id);
            const isEquipped = equippedTitle === item.name;

            return (
              <View key={item.id} style={[styles.shopCard, isEquipped && styles.shopCardEquipped]}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardItemIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardItemName, { color: item.previewColor || Colors.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardItemPrice}>🪙 {item.price} LUL</Text>
                  </View>
                </View>

                <Text style={styles.cardItemDesc}>{item.description}</Text>

                <View style={styles.cardActions}>
                  {isOwned ? (
                    <TouchableOpacity
                      onPress={() => handleToggleEquip('title', item.name)}
                      style={[styles.actionBtn, isEquipped ? styles.actionBtnEquipped : styles.actionBtnEquip]}
                    >
                      <Text style={[styles.actionBtnText, isEquipped ? styles.actionBtnTextEquipped : styles.actionBtnTextEquip]}>
                        {isEquipped ? '✓ In Uso' : 'Equipaggia'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleBuy(item)}
                      disabled={buyingId === item.id}
                      style={[styles.actionBtn, styles.actionBtnBuy, playerCoins < item.price && styles.actionBtnDisabled]}
                    >
                      <Text style={styles.actionBtnTextBuy}>
                        {buyingId === item.id ? '...' : `Sblocca (${item.price} 🪙)`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* SEZIONE 2: AURE & CORNICI NEON */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>✨ Aure & Cornici Neon per la Card</Text>
          <Text style={styles.sectionSubtitle}>Fai brillare la tua card nella classifica generale</Text>
        </View>

        <View style={styles.itemsGrid}>
          {SHOP_ITEMS.filter((i) => i.category === 'border').map((item) => {
            const isOwned = userInventory.includes(item.id);
            const isEquipped = equippedBorder === item.id;

            return (
              <View key={item.id} style={[styles.shopCard, isEquipped && { borderColor: item.previewColor, borderWidth: 2 }]}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardItemIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardItemName, { color: item.previewColor || Colors.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardItemPrice}>🪙 {item.price} LUL</Text>
                  </View>
                </View>

                <Text style={styles.cardItemDesc}>{item.description}</Text>

                <View style={styles.cardActions}>
                  {isOwned ? (
                    <TouchableOpacity
                      onPress={() => handleToggleEquip('border', item.id)}
                      style={[styles.actionBtn, isEquipped ? styles.actionBtnEquipped : styles.actionBtnEquip]}
                    >
                      <Text style={[styles.actionBtnText, isEquipped ? styles.actionBtnTextEquipped : styles.actionBtnTextEquip]}>
                        {isEquipped ? '✓ Attiva' : 'Equipaggia'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleBuy(item)}
                      disabled={buyingId === item.id}
                      style={[styles.actionBtn, styles.actionBtnBuy, playerCoins < item.price && styles.actionBtnDisabled]}
                    >
                      <Text style={styles.actionBtnTextBuy}>
                        {buyingId === item.id ? '...' : `Sblocca (${item.price} 🪙)`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* SEZIONE 3: PERK & CONSUMABILI */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎁 Consumabili & Mistero</Text>
          <Text style={styles.sectionSubtitle}>Assicurazioni salva-bet e scatole misteriose da sbancare</Text>
        </View>

        <View style={styles.itemsGrid}>
          {SHOP_ITEMS.filter((i) => i.category === 'perk' || i.category === 'mystery').map((item) => (
            <View key={item.id} style={styles.shopCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardItemIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardItemName, { color: item.previewColor || Colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardItemPrice}>🪙 {item.price} LUL</Text>
                </View>
              </View>

              <Text style={styles.cardItemDesc}>{item.description}</Text>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleBuy(item)}
                  disabled={buyingId === item.id || (item.id === 'perk_insurance' && hasInsurance)}
                  style={[
                    styles.actionBtn,
                    styles.actionBtnBuy,
                    (playerCoins < item.price || (item.id === 'perk_insurance' && hasInsurance)) && styles.actionBtnDisabled,
                  ]}
                >
                  <Text style={styles.actionBtnTextBuy}>
                    {item.id === 'perk_insurance' && hasInsurance
                      ? '🛡️ Già Attiva'
                      : buyingId === item.id
                      ? '...'
                      : `Acquista (${item.price} 🪙)`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Mystery Box Celebration Modal */}
      {mysteryModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setMysteryModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.mysteryModalCard}>
              <Text style={styles.mysteryModalIcon}>{mysteryModal.isJackpot ? '🎰' : '📦'}</Text>
              <Text style={styles.mysteryModalTitle}>
                {mysteryModal.isJackpot ? 'JACKPOT CLAMOROSO!' : 'Pacco Sorpresa Aperto!'}
              </Text>
              <Text style={styles.mysteryModalMsg}>{mysteryModal.message}</Text>
              <View style={styles.mysteryPrizePill}>
                <Text style={styles.mysteryPrizeText}>+{mysteryModal.coins} 🪙</Text>
              </View>
              {mysteryModal.badge && (
                <View style={styles.mysteryBadgePill}>
                  <Text style={styles.mysteryBadgeText}>Badge Sbloccato: {mysteryModal.badge}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setMysteryModal(null)}
                style={styles.mysteryCloseBtn}
              >
                <Text style={styles.mysteryCloseBtnText}>Raccogli & Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  walletCard: {
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.35)',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIcon: {
    fontSize: 34,
  },
  walletTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  walletAmount: {
    color: '#FACC15',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  bailoutBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bailoutBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  insuranceActiveBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  insuranceActiveText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionBlock: {
    marginBottom: 22,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  itemsGrid: {
    gap: 10,
  },
  shopCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shopCardEquipped: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cardItemIcon: {
    fontSize: 26,
  },
  cardItemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardItemPrice: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
  },
  cardItemDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnBuy: {
    backgroundColor: '#FACC15',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnTextBuy: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  actionBtnEquip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionBtnTextEquip: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnEquipped: {
    backgroundColor: '#38BDF8',
  },
  actionBtnTextEquipped: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mysteryModalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FACC15',
    width: '100%',
    maxWidth: 360,
  },
  mysteryModalIcon: {
    fontSize: 54,
    marginBottom: 10,
  },
  mysteryModalTitle: {
    color: '#FDE047',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  mysteryModalMsg: {
    color: Colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  mysteryPrizePill: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    marginBottom: 10,
  },
  mysteryPrizeText: {
    color: '#FDE047',
    fontSize: 18,
    fontWeight: '900',
  },
  mysteryBadgePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  mysteryBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  mysteryCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  mysteryCloseBtnText: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '900',
  },
});
