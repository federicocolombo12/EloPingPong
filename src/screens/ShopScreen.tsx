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
import { MysteryBoxOutcome, SHOP_ITEMS, WHEEL_SECTORS, WheelSpinOutcome } from '../core/shop';
import { ShopItem } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

type ShopCategoryTab = 'trophy' | 'title' | 'border' | 'sound' | 'perk' | 'wheel';

const TABS: { id: ShopCategoryTab; label: string; icon: string }[] = [
  { id: 'trophy', label: 'Trofei', icon: '🏆' },
  { id: 'title', label: 'Titoli', icon: '👑' },
  { id: 'border', label: 'Aure', icon: '✨' },
  { id: 'sound', label: 'Inni', icon: '🎵' },
  { id: 'perk', label: 'Perk', icon: '⚡' },
  { id: 'wheel', label: 'Ruota', icon: '🎡' },
];

export const ShopScreen: React.FC = () => {
  const {
    associatedPlayer,
    purchaseShopItem,
    equipPlayerItem,
    claimBailout,
    claimDailyReward,
    spinWheel,
  } = useElo();

  const [activeTab, setActiveTab] = useState<ShopCategoryTab>('trophy');
  const [mysteryModal, setMysteryModal] = useState<MysteryBoxOutcome | null>(null);
  const [wheelModal, setWheelModal] = useState<WheelSpinOutcome | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const playerCoins = associatedPlayer?.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;
  const userInventory = associatedPlayer?.inventory || [];
  const trophyShowcase = associatedPlayer?.trophyShowcase || [];
  const equippedTitle = associatedPlayer?.equippedTitle;
  const equippedBorder = associatedPlayer?.equippedBorder;
  const equippedSound = associatedPlayer?.equippedSound;
  const hasInsurance = !!associatedPlayer?.hasBetInsurance;
  const hasBooster = !!associatedPlayer?.activeBetBooster;
  const hasDeuceInsurance = !!associatedPlayer?.activeDeuceInsurance;

  // Sussidio giornaliero (24h cooldown)
  const lastDailyReward = associatedPlayer?.lastDailyRewardAt || 0;
  const canClaimDaily = !lastDailyReward || Date.now() - lastDailyReward >= 24 * 60 * 60 * 1000;
  const remainingDailyHours = Math.max(
    0,
    Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - lastDailyReward)) / (1000 * 60 * 60))
  );

  // Giro ruota gratis (24h cooldown)
  const lastSpin = associatedPlayer?.lastDailySpinAt || 0;
  const isWheelFree = !lastSpin || Date.now() - lastSpin >= 24 * 60 * 60 * 1000;

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
        const msg = res.error || "Errore durante l'acquisto.";
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

  const handleToggleEquip = async (type: 'title' | 'border' | 'sound', idOrName: string) => {
    soundEffects.playButtonTap();
    if (type === 'title') {
      const isCurrentlyEquipped = equippedTitle === idOrName;
      await equipPlayerItem('title', isCurrentlyEquipped ? null : idOrName);
    } else if (type === 'border') {
      const isCurrentlyEquipped = equippedBorder === idOrName;
      await equipPlayerItem('border', isCurrentlyEquipped ? null : idOrName);
    } else if (type === 'sound') {
      const isCurrentlyEquipped = equippedSound === idOrName;
      await equipPlayerItem('sound', isCurrentlyEquipped ? null : idOrName);
    }
  };

  const handlePreviewSound = (soundId?: string) => {
    soundEffects.playButtonTap();
    soundEffects.playAnthem(soundId);
  };

  const handleClaimDailyReward = async () => {
    soundEffects.playButtonTap();
    const res = await claimDailyReward();
    if (!res.success) {
      const msg = res.error || 'Impossibile riscuotere il sussidio ora.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sussidio Giornaliero', msg);
    }
  };

  const handleClaimBailout = async () => {
    soundEffects.playButtonTap();
    const res = await claimBailout();
    if (!res.success) {
      const msg = res.error || 'Impossibile richiedere il sussidio ora.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sussidio di Emergenza', msg);
    } else {
      const msg = '🎉 Sussidio di emergenza accreditato! Hai ricevuto 50 LUL Coins!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Bailout Concesso! 💸', msg);
    }
  };

  const handleSpinWheel = async () => {
    if (isSpinning) return;
    soundEffects.playButtonTap();
    if (!isWheelFree && playerCoins < 50) {
      const msg = `Saldo insufficiente! Un giro extra costa 50 🪙 (Saldo: ${playerCoins} 🪙)`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Saldo Insufficiente', msg);
      return;
    }

    setIsSpinning(true);
    // Suoni di rotazione ruota
    let ticks = 0;
    const interval = setInterval(() => {
      soundEffects.playWheelTick();
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
      }
    }, 120);

    setTimeout(async () => {
      try {
        const res = await spinWheel();
        if (res.success && res.outcome) {
          setWheelModal(res.outcome);
        } else if (res.error) {
          const msg = res.error;
          Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Ruota della Fortuna', msg);
        }
      } finally {
        setIsSpinning(false);
      }
    }, 1100);
  };

  // Filtraggio item in base alla categoria attiva
  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (activeTab === 'perk') {
      return item.category === 'perk' || item.category === 'mystery';
    }
    return item.category === activeTab;
  });

  return (
    <View style={styles.screen}>
      {/* HEADER PORTAFOGLIO COMPATTO */}
      <View style={styles.walletBar}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletIcon}>🪙</Text>
          <View>
            <Text style={styles.walletLabel}>Saldo LUL</Text>
            <Text style={styles.walletValue}>{playerCoins} 🪙</Text>
          </View>
        </View>

        {/* Pulsanti Azione Rapida Saldo */}
        <View style={styles.walletActions}>
          {canClaimDaily ? (
            <TouchableOpacity
              onPress={handleClaimDailyReward}
              style={styles.dailyRewardBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.dailyRewardText}>🎁 +50 Free</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.dailyRewardCooldown}>
              <Text style={styles.dailyRewardCooldownText}>⏳ {remainingDailyHours}h</Text>
            </View>
          )}

          {playerCoins === 0 && (
            <TouchableOpacity
              onPress={handleClaimBailout}
              style={styles.bailoutBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.bailoutText}>💸 Emergenza</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* BADGE ATTIVI (Booster / Assicurazioni) */}
      {(hasInsurance || hasBooster || hasDeuceInsurance) && (
        <View style={styles.activePerksRow}>
          {hasBooster && (
            <View style={[styles.activePerkPill, { borderColor: '#F59E0B' }]}>
              <Text style={[styles.activePerkPillText, { color: '#F59E0B' }]}>⚡ Booster 2x Attivo</Text>
            </View>
          )}
          {hasDeuceInsurance && (
            <View style={[styles.activePerkPill, { borderColor: '#06B6D4' }]}>
              <Text style={[styles.activePerkPillText, { color: '#06B6D4' }]}>🛡️ Assic. Vantaggi</Text>
            </View>
          )}
          {hasInsurance && (
            <View style={[styles.activePerkPill, { borderColor: '#38BDF8' }]}>
              <Text style={[styles.activePerkPillText, { color: '#38BDF8' }]}>🛡️ Assic. 50%</Text>
            </View>
          )}
        </View>
      )}

      {/* CATEGORY TABS ORIZZONTALI COMPATTI */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  soundEffects.playButtonTap();
                  setActiveTab(tab.id);
                }}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CONTENUTO PRINCIPALE */}
      {activeTab === 'wheel' ? (
        /* SEZIONE SPECIALE: RUOTA DELLA FORTUNA */
        <ScrollView contentContainerStyle={styles.wheelContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.wheelHeaderBox}>
            <Text style={styles.wheelHeaderIcon}>🎡</Text>
            <Text style={styles.wheelHeaderTitle}>Ruota della Fortuna Arena</Text>
            <Text style={styles.wheelHeaderSubtitle}>
              {isWheelFree
                ? 'Hai 1 GIRO GRATIS a disposizione per oggi!'
                : 'Prossimo giro gratis domani. Giri extra a 50 🪙'}
            </Text>
          </View>

          {/* Griglia Settori Premi */}
          <View style={styles.wheelSectorsGrid}>
            {WHEEL_SECTORS.map((sec) => (
              <View
                key={sec.index}
                style={[
                  styles.wheelSectorCard,
                  { borderColor: sec.color },
                  sec.index === 6 && styles.wheelJackpotCard,
                ]}
              >
                <Text style={styles.wheelSectorIcon}>{sec.icon}</Text>
                <Text style={[styles.wheelSectorLabel, { color: sec.color }]}>{sec.label}</Text>
                <Text style={styles.wheelSectorProb}>{Math.round(sec.probability * 100)}% prob.</Text>
              </View>
            ))}
          </View>

          {/* Bottone di Lancio Ruota */}
          <TouchableOpacity
            onPress={handleSpinWheel}
            disabled={isSpinning}
            style={[
              styles.spinActionBtn,
              isWheelFree ? styles.spinActionBtnFree : styles.spinActionBtnPaid,
              isSpinning && { opacity: 0.6 },
            ]}
            activeOpacity={0.85}
          >
            <Text style={styles.spinActionBtnText}>
              {isSpinning
                ? 'Rotazione in corso... 🌀'
                : isWheelFree
                ? '🎡 GIRA GRATIS ORA!'
                : `🎡 Gira per 50 🪙 (Saldo: ${playerCoins})`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* GRIGLIA COMPATTA A 2 COLONNE PER GLI OGGETTI */
        <ScrollView
          style={styles.itemsScrollView}
          contentContainerStyle={styles.itemsGrid}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map((item) => {
            const isTrophy = item.category === 'trophy';
            const isSound = item.category === 'sound';
            const isBorder = item.category === 'border';
            const isTitle = item.category === 'title';

            const isOwned =
              userInventory.includes(item.id) ||
              (isTrophy && trophyShowcase.includes(item.id));

            const isEquipped =
              (isTitle && equippedTitle === item.name) ||
              (isBorder && equippedBorder === item.id) ||
              (isSound && equippedSound === (item.soundPreviewId || item.id));

            return (
              <View
                key={item.id}
                style={[
                  styles.compactCard,
                  isEquipped && styles.compactCardEquipped,
                  isTrophy && styles.compactCardTrophy,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.compactCardIcon}>{item.icon}</Text>
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>{item.price} 🪙</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.compactCardTitle,
                    item.previewColor ? { color: item.previewColor } : undefined,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <Text style={styles.compactCardDesc} numberOfLines={3}>
                  {item.description}
                </Text>

                {/* Pulsanti Preview per Inni */}
                {isSound && (
                  <TouchableOpacity
                    onPress={() => handlePreviewSound(item.soundPreviewId)}
                    style={styles.previewSoundBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.previewSoundBtnText}>▶️ Ascolta Inno</Text>
                  </TouchableOpacity>
                )}

                {/* Azione di Acquisto / Equip */}
                <View style={styles.cardFooterAction}>
                  {isOwned ? (
                    isTrophy ? (
                      <View style={styles.trophyOwnedBadge}>
                        <Text style={styles.trophyOwnedText}>🏆 In Bacheca</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          handleToggleEquip(
                            isSound ? 'sound' : isBorder ? 'border' : 'title',
                            isSound ? (item.soundPreviewId || item.id) : isBorder ? item.id : item.name
                          )
                        }
                        style={[
                          styles.equipBtn,
                          isEquipped ? styles.equipBtnActive : styles.equipBtnInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.equipBtnText,
                            isEquipped ? styles.equipBtnTextActive : styles.equipBtnTextInactive,
                          ]}
                        >
                          {isEquipped ? '✓ In Uso' : 'Equipaggia'}
                        </Text>
                      </TouchableOpacity>
                    )
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleBuy(item)}
                      disabled={buyingId === item.id || playerCoins < item.price}
                      style={[
                        styles.buyBtn,
                        playerCoins < item.price && styles.buyBtnDisabled,
                      ]}
                    >
                      <Text style={styles.buyBtnText}>
                        {buyingId === item.id ? '...' : `Sblocca`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal Mistero / Ruota */}
      {(mysteryModal || wheelModal) && (
        <Modal visible transparent animationType="fade" onRequestClose={() => { setMysteryModal(null); setWheelModal(null); }}>
          <View style={styles.modalOverlay}>
            <View style={styles.celebrationModalCard}>
              <Text style={styles.modalIcon}>
                {wheelModal
                  ? wheelModal.sector.icon
                  : mysteryModal?.isJackpot
                  ? '🎰'
                  : '📦'}
              </Text>
              <Text style={styles.modalTitle}>
                {wheelModal
                  ? wheelModal.isJackpot
                    ? 'JACKPOT CLAMOROSO!'
                    : 'Ruota della Fortuna'
                  : mysteryModal?.isJackpot
                  ? 'JACKPOT PACCO!'
                  : 'Pacco Aperto!'}
              </Text>
              <Text style={styles.modalMessage}>
                {wheelModal ? wheelModal.message : mysteryModal?.message}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMysteryModal(null);
                  setWheelModal(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>Incassa & Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  walletBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    borderBottomWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIcon: {
    fontSize: 26,
  },
  walletLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  walletValue: {
    color: '#FACC15',
    fontSize: 18,
    fontWeight: '900',
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyRewardBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dailyRewardText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  dailyRewardCooldown: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dailyRewardCooldownText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  bailoutBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bailoutText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  activePerksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  activePerkPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  activePerkPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: Colors.surface,
  },
  tabsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.textDark,
    fontWeight: '900',
  },
  itemsScrollView: {
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
    justifyContent: 'space-between',
  },
  compactCard: {
    width: '48.5%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  compactCardEquipped: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.07)',
  },
  compactCardTrophy: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactCardIcon: {
    fontSize: 22,
  },
  pricePill: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  pricePillText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '900',
  },
  compactCardTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  compactCardDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
    marginBottom: 8,
  },
  previewSoundBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  previewSoundBtnText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  cardFooterAction: {
    marginTop: 2,
  },
  buyBtn: {
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    opacity: 0.35,
  },
  buyBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  equipBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  equipBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  equipBtnActive: {
    backgroundColor: '#38BDF8',
  },
  equipBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  equipBtnTextInactive: {
    color: Colors.textSecondary,
  },
  equipBtnTextActive: {
    color: '#0F172A',
  },
  trophyOwnedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  trophyOwnedText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  wheelContainer: {
    padding: 16,
    alignItems: 'center',
  },
  wheelHeaderBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  wheelHeaderIcon: {
    fontSize: 42,
    marginBottom: 4,
  },
  wheelHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  wheelHeaderSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  wheelSectorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  wheelSectorCard: {
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  wheelJackpotCard: {
    width: '95%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
  },
  wheelSectorIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  wheelSectorLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  wheelSectorProb: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  spinActionBtn: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  spinActionBtnFree: {
    backgroundColor: '#10B981',
  },
  spinActionBtnPaid: {
    backgroundColor: '#FACC15',
  },
  spinActionBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  celebrationModalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FACC15',
    width: '100%',
    maxWidth: 340,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FDE047',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    color: Colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '900',
  },
});
