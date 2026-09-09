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
import { getPlayerActiveMilestone, getWinRate } from '../core/elo';
import { getBorderCardStyle } from '../core/shop';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';
import { ChangelogModal, CURRENT_APP_VERSION } from './ChangelogModal';
import { EditPlayerModal } from './EditPlayerModal';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToShop?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  onNavigateToShop,
}) => {
  const {
    currentUser,
    associatedPlayer,
    isAdmin,
    currentLeague,
    logout,
    setIsAuthModalVisible,
    setIsReportModalVisible,
    setIsLeagueModalVisible,
    resetMeetingData,
    resetAllCoins,
    claimBailout,
    updatePlayer,
  } = useElo();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const coins = associatedPlayer?.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;
  const milestone = associatedPlayer ? getPlayerActiveMilestone(associatedPlayer.elo) : null;
  const winRate = associatedPlayer ? getWinRate(associatedPlayer.wins, associatedPlayer.losses) : 0;
  const pColor = associatedPlayer?.color || Colors.primary;

  const handleResetCoins = () => {
    soundEffects.playButtonTap();
    const confirmMsg =
      'Sei sicuro di voler resettare il saldo di TUTTI i giocatori a 200 LUL Coins? I punteggi Elo e i match NON verranno toccati.';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        resetAllCoins();
      }
    } else {
      Alert.alert('Reset Monete Admin', confirmMsg, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Sì, resetta a 200', style: 'destructive', onPress: resetAllCoins },
      ]);
    }
  };

  const handleResetMatches = () => {
    soundEffects.playButtonTap();
    const confirmMsg =
      'Sei sicuro di voler azzerare tutti i match e riportare i punteggi Elo a 1200? Questa operazione è irreversibile.';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        resetMeetingData();
      }
    } else {
      Alert.alert('Reset Partite & Elo', confirmMsg, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Sì, resetta', style: 'destructive', onPress: resetMeetingData },
      ]);
    }
  };

  const handleClaimBailout = async () => {
    soundEffects.playButtonTap();
    const res = await claimBailout();
    if (!res.success) {
      const msg = res.error || 'Impossibile richiedere il sussidio ora.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sussidio', msg);
    } else {
      const msg = '🎉 Sussidio accreditato! Hai ricevuto 50 LUL Coins!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Bailout Concesso! 💸', msg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerIcon}>⚙️</Text>
              <Text style={styles.headerTitle}>Account & Impostazioni</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Banner Profilo Utente */}
            {associatedPlayer ? (
              <View
                style={[
                  styles.profileCard,
                  { borderColor: pColor },
                  getBorderCardStyle(associatedPlayer.equippedBorder),
                ]}
              >
                <View style={styles.profileTopRow}>
                  <View style={[styles.avatarCircle, { borderColor: pColor }]}>
                    <Text style={styles.avatarEmoji}>{associatedPlayer.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.playerName, { color: pColor }]}>{associatedPlayer.name}</Text>
                      {milestone && (
                        <View style={[styles.milestoneBadge, { borderColor: milestone.color, backgroundColor: `${milestone.color}15` }]}>
                          <Text style={[styles.milestoneBadgeText, { color: milestone.color }]}>{milestone.badge}</Text>
                        </View>
                      )}
                    </View>
                    {associatedPlayer.equippedTitle && (
                      <View style={styles.equippedTitleBadge}>
                        <Text style={styles.equippedTitleText}>{associatedPlayer.equippedTitle}</Text>
                      </View>
                    )}
                    <Text style={styles.playerEmail}>
                      {currentUser?.email || 'Accesso locale'} • {isAdmin ? '👑 Capo Riunione' : 'Agente'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsEditModalOpen(true)}
                    style={styles.editBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>✏️ Modifica</Text>
                  </TouchableOpacity>
                </View>

                {associatedPlayer.catchphrase ? (
                  <View style={[styles.quoteBox, { borderLeftColor: pColor }]}>
                    <Text style={styles.quoteText}>"{associatedPlayer.catchphrase}"</Text>
                  </View>
                ) : null}

                {/* Statistiche Rapide */}
                <View style={styles.statsBar}>
                  <View style={styles.statCol}>
                    <Text style={styles.statNum}>{associatedPlayer.elo}</Text>
                    <Text style={styles.statLbl}>PUNTI ELO</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNum}>
                      <Text style={{ color: Colors.win }}>{associatedPlayer.wins}V</Text> -{' '}
                      <Text style={{ color: Colors.loss }}>{associatedPlayer.losses}P</Text>
                    </Text>
                    <Text style={styles.statLbl}>RECORD ({winRate}%)</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statNum, { color: '#FACC15' }]}>🪙 {coins}</Text>
                    <Text style={styles.statLbl}>LUL COINS</Text>
                  </View>
                </View>

                {coins === 0 && (
                  <TouchableOpacity
                    onPress={handleClaimBailout}
                    style={styles.bailoutBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bailoutBtnText}>💸 Chiedi Sussidio (+50 🪙)</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.guestCard}>
                <Text style={styles.guestIcon}>👤</Text>
                <Text style={styles.guestTitle}>Nessun Profilo Agente Collegato</Text>
                <Text style={styles.guestSub}>
                  Accedi o registrati per collegare il tuo profilo personale alla Riunione Segreta!
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    setIsAuthModalVisible(true);
                  }}
                  style={styles.guestLoginBtn}
                >
                  <Text style={styles.guestLoginBtnText}>🔐 Accedi o Registrati</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pulsanti Rapidi Menù */}
            <View style={styles.menuSection}>
              {onNavigateToShop && (
                <TouchableOpacity
                  onPress={() => {
                    soundEffects.playButtonTap();
                    onClose();
                    onNavigateToShop();
                  }}
                  style={styles.menuItem}
                  activeOpacity={0.75}
                >
                  <Text style={styles.menuItemIcon}>🛍️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemTitle}>Bazar di Lega</Text>
                    <Text style={styles.menuItemSub}>Spendi i tuoi LUL Coins in titoli e cornici neon</Text>
                  </View>
                  <Text style={styles.menuItemArrow}>➔</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  setIsReportModalVisible(true);
                }}
                style={styles.menuItem}
                activeOpacity={0.75}
              >
                <Text style={styles.menuItemIcon}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Segnala Problema / Suggerimento</Text>
                  <Text style={styles.menuItemSub}>Invia una richiesta direttamente all'AI di sviluppo</Text>
                </View>
                <Text style={styles.menuItemArrow}>➔</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  setIsChangelogOpen(true);
                }}
                style={styles.menuItem}
                activeOpacity={0.75}
              >
                <Text style={styles.menuItemIcon}>✨</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.menuItemTitle}>Novità & Aggiornamenti</Text>
                    <View style={styles.versionPill}>
                      <Text style={styles.versionPillText}>{CURRENT_APP_VERSION}</Text>
                    </View>
                  </View>
                  <Text style={styles.menuItemSub}>Leggi il changelog ufficiale delle versioni</Text>
                </View>
                <Text style={styles.menuItemArrow}>➔</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  setIsLeagueModalVisible(true);
                }}
                style={styles.menuItem}
                activeOpacity={0.75}
              >
                <Text style={styles.menuItemIcon}>🤫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Gestione Riunione Segreta</Text>
                  <Text style={styles.menuItemSub}>
                    {currentLeague ? `${currentLeague.name} (${currentLeague.code})` : 'Configura Riunione'}
                  </Text>
                </View>
                <Text style={styles.menuItemArrow}>➔</Text>
              </TouchableOpacity>
            </View>

            {/* SEZIONE PRIVILEGI ADMIN (CAPO RIUNIONE) */}
            {isAdmin && (
              <View style={styles.adminSection}>
                <Text style={styles.adminSectionTitle}>👑 Strumenti Capo Riunione (Admin)</Text>

                {/* Reset Soldi Separato */}
                <TouchableOpacity
                  onPress={handleResetCoins}
                  style={styles.adminResetCoinsBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adminBtnText}>🪙 Ripristina Monete di Tutti a 200 LUL Coins</Text>
                </TouchableOpacity>

                {/* Reset Partite ed Elo */}
                <TouchableOpacity
                  onPress={handleResetMatches}
                  style={styles.adminResetMatchesBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adminBtnText}>⚠️ Resetta Match & Punteggi della Riunione</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Logout / Switch Account */}
            {currentUser && (
              <TouchableOpacity
                onPress={async () => {
                  soundEffects.playButtonTap();
                  await logout();
                  onClose();
                }}
                style={styles.logoutBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>🚪 Disconnetti Account (Logout)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Edit Profile Modal */}
          {associatedPlayer && (
            <EditPlayerModal
              player={associatedPlayer}
              visible={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={updatePlayer}
            />
          )}

          {/* Changelog Modal */}
          <ChangelogModal
            visible={isChangelogOpen}
            onClose={() => setIsChangelogOpen(false)}
          />
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
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
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
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  profileTopRow: {
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
  playerName: {
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
  equippedTitleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  equippedTitleText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  playerEmail: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  editBtnText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
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
  bailoutBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  bailoutBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  guestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  guestIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  guestTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  guestSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  guestLoginBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  guestLoginBtnText: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '900',
  },
  menuSection: {
    gap: 8,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 22,
  },
  menuItemTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  menuItemSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  menuItemArrow: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  versionPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  versionPillText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '900',
  },
  adminSection: {
    backgroundColor: 'rgba(250, 204, 21, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.25)',
    gap: 10,
    marginBottom: 16,
  },
  adminSectionTitle: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  adminResetCoinsBtn: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: '#FACC15',
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  adminResetMatchesBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  adminBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
});
