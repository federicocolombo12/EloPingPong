import React, { useState } from 'react';
import {
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
import { AVAILABLE_EMOJIS } from '../core/constants';

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

const MAX_PLAYER_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 16];

export const LeagueGateScreen: React.FC = () => {
  const { currentUser, logout, createSecretMeeting, joinSecretMeeting } = useElo();

  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Campi Creazione (Capo)
  const [meetingName, setMeetingName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  // Campi Unisciti (Membro)
  const [meetingCode, setMeetingCode] = useState('');

  // Profilo Giocatore
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('🏓');
  const [playerColor, setPlayerColor] = useState('#3B82F6');
  const [playerCatchphrase, setPlayerCatchphrase] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async () => {
    setErrorMsg(null);
    const trimmedName = meetingName.trim();
    const trimmedPName = playerName.trim();

    if (!trimmedName) {
      setErrorMsg('Inserisci un nome per la Riunione Segreta');
      return;
    }

    if (!trimmedPName) {
      setErrorMsg('Inserisci il tuo nome da giocatore');
      return;
    }

    setLoading(true);
    try {
      const res = await createSecretMeeting(trimmedName, maxPlayers, {
        name: trimmedPName,
        avatar: playerAvatar,
        color: playerColor,
        catchphrase: playerCatchphrase.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Impossibile creare la Riunione Segreta');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setErrorMsg(null);
    const trimmedCode = meetingCode.trim().toUpperCase();
    const trimmedPName = playerName.trim();

    if (!trimmedCode || trimmedCode.length < 4) {
      setErrorMsg('Inserisci un codice segreto valido');
      return;
    }

    if (!trimmedPName) {
      setErrorMsg('Inserisci il tuo nome da giocatore');
      return;
    }

    setLoading(true);
    try {
      const res = await joinSecretMeeting(trimmedCode, {
        name: trimmedPName,
        avatar: playerAvatar,
        color: playerColor,
        catchphrase: playerCatchphrase.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Impossibile entrare nella Riunione Segreta');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top User Bar */}
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          <Text style={styles.userIcon}>👤</Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {currentUser?.email}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Esci</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intestazione */}
        <View style={styles.header}>
          <Text style={styles.mainEmoji}>🕵️‍♂️</Text>
          <Text style={styles.headerTitle}>RIUNIONE SEGRETA</Text>
          <Text style={styles.headerSub}>
            Non fai ancora parte di nessuna Riunione Segreta. Fonda la tua come Capo o unisciti a
            quella dei tuoi amici con il codice segreto!
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            onPress={() => {
              setMode('create');
              setErrorMsg(null);
            }}
            style={[styles.modeBtn, mode === 'create' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeBtnText, mode === 'create' && styles.modeBtnTextActive]}>
              👑 Fonda Nuova Riunione
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMode('join');
              setErrorMsg(null);
            }}
            style={[styles.modeBtn, mode === 'join' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeBtnText, mode === 'join' && styles.modeBtnTextActive]}>
              🔗 Unisciti con Codice
            </Text>
          </TouchableOpacity>
        </View>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        {/* FORM CARD */}
        <View style={styles.formCard}>
          {mode === 'create' ? (
            /* SEZIONE CREA RIUNIONE */
            <View>
              <Text style={styles.cardHeaderTitle}>👑 Fonda la Riunione Segreta (Diventa Capo)</Text>
              <Text style={styles.cardHeaderDesc}>
                Come Capo Riunione Segreta avrai il potere di gestire le stagioni, proclamare il podio
                e assegnare il Cucchiaio di Legno.
              </Text>

              <Text style={styles.inputLabel}>Nome della Riunione Segreta</Text>
              <TextInput
                style={styles.input}
                placeholder="Es. Il Club del Topspin, Ufficio Ping Pong..."
                placeholderTextColor={Colors.textMuted}
                value={meetingName}
                onChangeText={setMeetingName}
              />

              <Text style={styles.inputLabel}>Posti Disponibili (Numero Max Giocatori)</Text>
              <Text style={styles.inputSub}>
                La riunione accetterà partecipanti fino a esaurimento posti.
              </Text>
              <View style={styles.maxPlayersRow}>
                {MAX_PLAYER_OPTIONS.map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setMaxPlayers(num)}
                    style={[
                      styles.maxPlayerChip,
                      maxPlayers === num && styles.maxPlayerChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.maxPlayerChipText,
                        maxPlayers === num && styles.maxPlayerChipTextSelected,
                      ]}
                    >
                      {num} {num === 4 ? '⭐️' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* SEZIONE UNISCITI */
            <View>
              <Text style={styles.cardHeaderTitle}>🔗 Inserisci il Codice Segreto</Text>
              <Text style={styles.cardHeaderDesc}>
                Fatti dare il codice a 6 caratteri dal Capo Riunione Segreta per accedere alla stanza.
              </Text>

              <Text style={styles.inputLabel}>Codice Segreto (6 Caratteri)</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="ES. PONG26"
                placeholderTextColor={Colors.textMuted}
                value={meetingCode}
                onChangeText={setMeetingCode}
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>
          )}

          <View style={styles.divider} />

          {/* SEZIONE PROFILO PERSONAGGIO */}
          <Text style={styles.cardHeaderTitle}>🏓 Il Tuo Profilo da Giocatore</Text>
          <Text style={styles.cardHeaderDesc}>
            Questo sarà il tuo personaggio nella classifica, nei commenti e nelle partite.
          </Text>

          <Text style={styles.inputLabel}>Il Tuo Nome in Campo</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. Federico, Alberto, Il Cecchino..."
            placeholderTextColor={Colors.textMuted}
            value={playerName}
            onChangeText={setPlayerName}
          />

          <Text style={styles.inputLabel}>Scegli la tua Emoji Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
            {AVAILABLE_EMOJIS.map((em) => (
              <TouchableOpacity
                key={em}
                onPress={() => setPlayerAvatar(em)}
                style={[styles.emojiBtn, playerAvatar === em && styles.emojiBtnSelected]}
              >
                <Text style={styles.emojiText}>{em}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Colore Distintivo</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((col) => (
              <TouchableOpacity
                key={col}
                onPress={() => setPlayerColor(col)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: col },
                  playerColor === col && styles.colorCircleSelected,
                ]}
              />
            ))}
          </View>

          <Text style={styles.inputLabel}>Catchphrase / Motto Celebre (Facoltativo)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Es. Oggi non c'è storia per nessuno!"
            placeholderTextColor={Colors.textMuted}
            value={playerCatchphrase}
            onChangeText={setPlayerCatchphrase}
            multiline
            numberOfLines={2}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            onPress={mode === 'create' ? handleCreate : handleJoin}
            disabled={loading}
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textDark} />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'create'
                  ? '👑 Fonda Riunione Segreta & Entra'
                  : '🚀 Entra nella Riunione Segreta'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'rgba(15, 22, 35, 0.9)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userIcon: {
    fontSize: 16,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: Colors.loss,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    maxWidth: 580,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  mainEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: Colors.surface,
  },
  modeBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#FDE047',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  errorText: {
    color: Colors.loss,
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardHeaderDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  inputSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  codeInput: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    color: '#FDE047',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  maxPlayersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  maxPlayerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  maxPlayerChipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  maxPlayerChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  maxPlayerChipTextSelected: {
    color: '#FDE047',
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  emojiBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiBtnSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 22,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
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
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: '900',
  },
});
