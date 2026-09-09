import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { Colors } from '../theme/colors';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const {
    currentUser,
    associatedPlayer,
    loginWithEmail,
    registerWithEmail,
    logout,
    isAdmin,
    currentLeague,
  } = useElo();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Inserisci sia email che password');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La password deve contenere almeno 6 caratteri');
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        const res = await registerWithEmail(trimmedEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Errore durante la registrazione');
        } else {
          setSuccessMsg('Account creato con successo!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const res = await loginWithEmail(trimmedEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Credenziali non valide');
        } else {
          setSuccessMsg('Accesso effettuato!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setEmail('');
    setPassword('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              {currentUser ? 'Il Tuo Account & Profilo' : 'Autenticazione'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Se già connesso */}
            {currentUser ? (
              <View style={styles.loggedInSection}>
                {/* Banner Email & Ruolo */}
                <View style={styles.userBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userBannerEmail}>✉️ {currentUser.email}</Text>
                    <Text style={styles.userBannerStatus}>
                      {isAdmin ? '👑 Capo Riunione Segreta' : '🕵️‍♂️ Agente Attivo'}
                    </Text>
                  </View>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>ATTIVO</Text>
                  </View>
                </View>

                {currentLeague && (
                  <View style={styles.meetingInfoBanner}>
                    <Text style={styles.meetingInfoTitle}>🤫 Riunione: {currentLeague.name}</Text>
                    <Text style={styles.meetingInfoCode}>
                      Codice: <Text style={{ color: '#FDE047', fontWeight: '900' }}>{currentLeague.code}</Text>
                    </Text>
                  </View>
                )}

                <Text style={styles.sectionLabel}>
                  IL TUO AGENTE PERSONALE (BLINDATO)
                </Text>

                {associatedPlayer ? (
                  <View
                    style={[
                      styles.assignedPlayerCard,
                      { borderColor: associatedPlayer.color || Colors.primary },
                    ]}
                  >
                    <View
                      style={[
                        styles.assignedAvatarCircle,
                        { borderColor: associatedPlayer.color || Colors.primary },
                      ]}
                    >
                      <Text style={styles.assignedAvatarEmoji}>{associatedPlayer.avatar}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.assignedPlayerName,
                          { color: associatedPlayer.color || Colors.primary },
                        ]}
                      >
                        {associatedPlayer.name}
                      </Text>
                      <Text style={styles.assignedPlayerElo}>
                        {associatedPlayer.elo} ELO • {associatedPlayer.wins}V - {associatedPlayer.losses}P
                      </Text>
                      {associatedPlayer.catchphrase ? (
                        <Text style={styles.assignedPlayerMotto} numberOfLines={2}>
                          "{associatedPlayer.catchphrase}"
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedBadgeText}>🔒 TUO</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.assignedPlayerCard}>
                    <Text style={{ color: Colors.textSecondary }}>Nessun agente collegato a questo account.</Text>
                  </View>
                )}

                {/* Box di sicurezza */}
                <View style={styles.securityBox}>
                  <Text style={styles.securityBoxIcon}>🛡️</Text>
                  <Text style={styles.securityBoxText}>
                    Questo profilo agente è collegato in modo esclusivo alla tua email. Nessun altro utente può selezionarlo o impersonarlo senza effettuare l'accesso con la tua email e password.
                  </Text>
                </View>

                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Text style={styles.logoutBtnText}>🚪 Disconnetti Account (Logout)</Text>
                </TouchableOpacity>

                <Text style={styles.logoutSubText}>
                  Per accedere come un altro giocatore, disconnettiti ed effettua il login con la rispettiva email.
                </Text>
              </View>
            ) : (
              // Form Login / Registrazione quando non connesso
              <View>
                <View style={styles.tabSwitch}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsRegisterMode(false);
                      setErrorMsg(null);
                    }}
                    style={[styles.tabBtn, !isRegisterMode && styles.tabBtnActive]}
                  >
                    <Text style={[styles.tabBtnText, !isRegisterMode && styles.tabBtnTextActive]}>
                      Accedi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsRegisterMode(true);
                      setErrorMsg(null);
                    }}
                    style={[styles.tabBtn, isRegisterMode && styles.tabBtnActive]}
                  >
                    <Text style={[styles.tabBtnText, isRegisterMode && styles.tabBtnTextActive]}>
                      Registrati
                    </Text>
                  </TouchableOpacity>
                </View>

                {errorMsg && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                  </View>
                )}

                {successMsg && (
                  <View style={styles.successBanner}>
                    <Text style={styles.successText}>✅ {successMsg}</Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="La tua email..."
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Almeno 6 caratteri..."
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  onPress={handleAuthSubmit}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.textDark} />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {isRegisterMode ? 'Crea Account' : 'Accedi'}
                    </Text>
                  )}
                </TouchableOpacity>
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
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
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
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: Colors.primary,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  submitBtnText: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: '900',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    color: Colors.loss,
    fontSize: 12,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 12,
  },
  successText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  loggedInSection: {
    paddingTop: 4,
  },
  userBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userBannerEmail: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  userBannerStatus: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  activePillText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
  },
  meetingInfoBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  meetingInfoTitle: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
  meetingInfoCode: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  assignedPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  assignedAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedAvatarEmoji: {
    fontSize: 24,
  },
  assignedPlayerName: {
    fontSize: 16,
    fontWeight: '900',
  },
  assignedPlayerElo: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  assignedPlayerMotto: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 3,
  },
  lockedBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
    marginBottom: 16,
  },
  securityBoxIcon: {
    fontSize: 18,
  },
  securityBoxText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 8,
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '800',
  },
  logoutSubText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
