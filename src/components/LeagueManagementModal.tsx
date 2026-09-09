import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { Colors } from '../theme/colors';
import { Player } from '../core/types';

interface LeagueManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LeagueManagementModal: React.FC<LeagueManagementModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    currentLeague,
    currentUser,
    players,
    isAdmin,
    leaveMeeting,
    resetMeetingData,
    concludeCurrentSeason,
  } = useElo();

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'hallOfFame' | 'manage'>('info');
  const [copied, setCopied] = useState(false);

  // Conclusione stagione
  const [isConcludeOpen, setIsConcludeOpen] = useState(false);
  const [newSeasonNameInput, setNewSeasonNameInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Trova il giocatore del Capo
  const capoPlayer = currentLeague?.players?.find(
    (p) => currentLeague.members?.[currentLeague.adminUid]?.playerId === p.id
  ) || currentLeague?.players?.[0];

  // Giocatori ordinati per Elo attuale
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);
  const firstPlayer = sortedPlayers[0];
  const secondPlayer = sortedPlayers[1];
  const thirdPlayer = sortedPlayers[2];
  const woodenSpoonPlayer = sortedPlayers[sortedPlayers.length - 1];

  const currentSeason =
    currentLeague?.seasons?.find((s) => s.id === currentLeague.currentSeasonId) ||
    currentLeague?.seasons?.[0];

  const archivedSeasons = (currentLeague?.seasons || []).filter((s) => s.status === 'archived');

  const getPlayerById = (id: string): Player | undefined => {
    return players.find((p) => p.id === id);
  };

  const handleCopyCode = () => {
    const code = currentLeague?.code || 'PONG26';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    await leaveMeeting();
    onClose();
  };

  const handleConcludeSeason = async () => {
    const nextSeasonNum = (currentLeague?.seasons?.length || 1) + 1;
    const sName = newSeasonNameInput.trim() || `Stagione ${nextSeasonNum}`;

    setStatusMsg('Conclusione stagione in corso...');
    const res = await concludeCurrentSeason(sName);
    if (res.success) {
      setIsConcludeOpen(false);
      setNewSeasonNameInput('');
      setStatusMsg(`🎉 Stagione conclusa! Benvenuto in ${sName}!`);
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      setStatusMsg(`Errore: ${res.error || 'Impossibile concludere la stagione'}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>
                🕵️‍♂️ {currentLeague?.name || 'Riunione Segreta'}
              </Text>
              <Text style={styles.headerSub}>
                👑 Capo: {capoPlayer ? `${capoPlayer.avatar} ${capoPlayer.name}` : 'Admin'} • {players.length}/{currentLeague?.maxPlayers || 4} Giocatori
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Tabs */}
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              onPress={() => setActiveSubTab('info')}
              style={[styles.tabBtn, activeSubTab === 'info' && styles.tabBtnActive]}
            >
              <Text
                style={[styles.tabBtnText, activeSubTab === 'info' && styles.tabBtnTextActive]}
              >
                Riunione & Stagione
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveSubTab('hallOfFame')}
              style={[styles.tabBtn, activeSubTab === 'hallOfFame' && styles.tabBtnActive]}
            >
              <Text
                style={[styles.tabBtnText, activeSubTab === 'hallOfFame' && styles.tabBtnTextActive]}
              >
                Albo d'Oro ({archivedSeasons.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveSubTab('manage')}
              style={[styles.tabBtn, activeSubTab === 'manage' && styles.tabBtnActive]}
            >
              <Text
                style={[styles.tabBtnText, activeSubTab === 'manage' && styles.tabBtnTextActive]}
              >
                Gestione {isAdmin ? '👑' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {statusMsg && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusText}>{statusMsg}</Text>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* TAB 1: STAGIONE ATTUALE */}
            {activeSubTab === 'info' && (
              <View>
                {/* Codice Segreto Card */}
                <View style={styles.codeCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeCardLabel}>CODICE SEGRETO PER GLI AMICI</Text>
                    <Text style={styles.codeCardValue}>{currentLeague?.code || 'PONG26'}</Text>
                    <Text style={styles.codeCardHelp}>
                      {players.length} di {currentLeague?.maxPlayers || 4} posti occupati. Condividi questo codice con i tuoi amici per farli entrare!
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
                    <Text style={styles.copyBtnText}>{copied ? '✓ Copiato!' : '📋 Copia'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Proiezione Podio Attuale */}
                <Text style={styles.sectionLabel}>CLASSIFICA PROVVISORIA {currentSeason?.name?.toUpperCase() || 'STAGIONE 1'}</Text>
                <View style={styles.podiumPreview}>
                  {firstPlayer && (
                    <View style={styles.podiumRow}>
                      <Text style={styles.podiumRank}>🥇 1° Posto</Text>
                      <Text style={styles.podiumPlayer}>
                        {firstPlayer.avatar} {firstPlayer.name} ({firstPlayer.elo} Elo)
                      </Text>
                    </View>
                  )}
                  {secondPlayer && (
                    <View style={styles.podiumRow}>
                      <Text style={styles.podiumRank}>🥈 2° Posto</Text>
                      <Text style={styles.podiumPlayer}>
                        {secondPlayer.avatar} {secondPlayer.name} ({secondPlayer.elo} Elo)
                      </Text>
                    </View>
                  )}
                  {thirdPlayer && (
                    <View style={styles.podiumRow}>
                      <Text style={styles.podiumRank}>🥉 3° Posto</Text>
                      <Text style={styles.podiumPlayer}>
                        {thirdPlayer.avatar} {thirdPlayer.name} ({thirdPlayer.elo} Elo)
                      </Text>
                    </View>
                  )}
                  {woodenSpoonPlayer && sortedPlayers.length > 2 && (
                    <View style={[styles.podiumRow, styles.woodenSpoonRow]}>
                      <Text style={styles.woodenSpoonRank}>🪵 Cucchiaio di Legno</Text>
                      <Text style={styles.woodenSpoonPlayer}>
                        {woodenSpoonPlayer.avatar} {woodenSpoonPlayer.name} ({woodenSpoonPlayer.elo} Elo)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Azione Termina Stagione (Solo per il Capo) */}
                <View style={styles.concludeContainer}>
                  {isAdmin ? (
                    !isConcludeOpen ? (
                      <TouchableOpacity
                        onPress={() => setIsConcludeOpen(true)}
                        style={styles.concludeBtn}
                      >
                        <Text style={styles.concludeBtnText}>
                          🏁 Concludi Stagione & Assegna Premi (👑 Capo)
                        </Text>
                        <Text style={styles.concludeBtnSub}>
                          Incorona il Campione nell'Albo d'Oro, assegna il Cucchiaio di Legno e resetta l'Elo a 1200
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.concludeForm}>
                        <Text style={styles.concludeWarningTitle}>
                          ⚠️ Confermi la conclusione della stagione?
                        </Text>
                        <Text style={styles.concludeWarningText}>
                          • Il 1° classificato ({firstPlayer?.name}) entra nell'Albo d'Oro.{'\n'}
                          • L'ultimo classificato ({woodenSpoonPlayer?.name}) riceve il Cucchiaio di Legno 🪵.{'\n'}
                          • I punteggi Elo vengono resettati a 1200 per tutti i partecipanti.{'\n'}
                          • Tutte le partite disputate rimarranno salvate nello storico.
                        </Text>

                        <Text style={styles.inputLabel}>Nome Nuova Stagione</Text>
                        <TextInput
                          style={styles.input}
                          placeholder={`Es. Stagione ${(currentLeague?.seasons?.length || 1) + 1}`}
                          placeholderTextColor={Colors.textMuted}
                          value={newSeasonNameInput}
                          onChangeText={setNewSeasonNameInput}
                        />

                        <View style={styles.concludeActionRow}>
                          <TouchableOpacity
                            onPress={() => setIsConcludeOpen(false)}
                            style={styles.cancelConcludeBtn}
                          >
                            <Text style={styles.cancelConcludeBtnText}>Annulla</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleConcludeSeason}
                            style={styles.confirmConcludeBtn}
                          >
                            <Text style={styles.confirmConcludeBtnText}>
                              Conferma & Avvia Nuova 🚀
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  ) : (
                    <View style={styles.nonAdminBox}>
                      <Text style={styles.nonAdminText}>
                        🔒 Solo il Capo Riunione Segreta ({capoPlayer?.name || 'il creatore'}) può concludere la stagione o azzerare la classifica.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB 2: ALBO D'ORO */}
            {activeSubTab === 'hallOfFame' && (
              <View>
                {archivedSeasons.length === 0 ? (
                  <View style={styles.emptyHallBox}>
                    <Text style={styles.emptyHallEmoji}>🏆</Text>
                    <Text style={styles.emptyHallTitle}>Nessuna stagione conclusa finora</Text>
                    <Text style={styles.emptyHallSub}>
                      Quando il Capo Riunione concluderà la stagione, il podio e il cucchiaio di legno
                      saranno immortalati qui per sempre!
                    </Text>
                  </View>
                ) : (
                  archivedSeasons.map((season) => {
                    const first = season.podium?.firstPlayerId
                      ? getPlayerById(season.podium.firstPlayerId)
                      : null;
                    const second = season.podium?.secondPlayerId
                      ? getPlayerById(season.podium.secondPlayerId)
                      : null;
                    const third = season.podium?.thirdPlayerId
                      ? getPlayerById(season.podium.thirdPlayerId)
                      : null;
                    const wooden = season.podium?.woodenSpoonPlayerId
                      ? getPlayerById(season.podium.woodenSpoonPlayerId)
                      : null;

                    return (
                      <View key={season.id} style={styles.seasonCard}>
                        <View style={styles.seasonCardHeader}>
                          <Text style={styles.seasonCardTitle}>{season.name}</Text>
                          <Text style={styles.seasonCardMatches}>
                            {season.matchesCount || 0} match disputati
                          </Text>
                        </View>

                        <View style={styles.seasonPodiumGrid}>
                          {first && (
                            <View style={[styles.podiumPill, styles.goldPill]}>
                              <Text style={styles.podiumMedal}>🥇 1°</Text>
                              <Text style={styles.podiumPillName}>
                                {first.avatar} {first.name}
                              </Text>
                            </View>
                          )}
                          {second && (
                            <View style={[styles.podiumPill, styles.silverPill]}>
                              <Text style={styles.podiumMedal}>🥈 2°</Text>
                              <Text style={styles.podiumPillName}>
                                {second.avatar} {second.name}
                              </Text>
                            </View>
                          )}
                          {third && (
                            <View style={[styles.podiumPill, styles.bronzePill]}>
                              <Text style={styles.podiumMedal}>🥉 3°</Text>
                              <Text style={styles.podiumPillName}>
                                {third.avatar} {third.name}
                              </Text>
                            </View>
                          )}
                          {wooden && (
                            <View style={[styles.podiumPill, styles.woodPill]}>
                              <Text style={styles.podiumMedal}>🪵 Cucchiaio</Text>
                              <Text style={styles.podiumPillName}>
                                {wooden.avatar} {wooden.name}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 3: GESTIONE RIUNIONE */}
            {activeSubTab === 'manage' && (
              <View>
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>🕵️‍♂️ Dettagli Riunione Segreta</Text>
                  <Text style={styles.formCardHelp}>
                    Nome: <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{currentLeague?.name}</Text>{'\n'}
                    Capo: <Text style={{ color: '#FDE047', fontWeight: '800' }}>{capoPlayer ? `${capoPlayer.avatar} ${capoPlayer.name}` : 'Admin'} (👑)</Text>{'\n'}
                    Capienza: <Text style={{ color: Colors.primary, fontWeight: '800' }}>{players.length} su {currentLeague?.maxPlayers || 4} partecipanti massimi</Text>
                  </Text>
                </View>

                {isAdmin && (
                  <View style={styles.formCard}>
                    <Text style={[styles.formCardTitle, { color: Colors.loss }]}>⚠️ Azioni del Capo</Text>
                    <Text style={styles.formCardHelp}>
                      Puoi azzerare tutte le partite e riportare tutti i giocatori a 1200 punti Elo.
                    </Text>
                    <TouchableOpacity
                      onPress={async () => {
                        await resetMeetingData();
                        setStatusMsg('Dati partite azzerati con successo!');
                        setTimeout(() => setStatusMsg(null), 3000);
                      }}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: Colors.loss }]}
                    >
                      <Text style={[styles.actionBtnText, { color: Colors.loss }]}>
                        Azzera Partite & Reimposta a 1200 Elo
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Esci dalla Riunione Segreta */}
                <View style={styles.switchDefaultBox}>
                  <TouchableOpacity
                    onPress={handleLeave}
                    style={styles.leaveBtn}
                  >
                    <Text style={styles.leaveBtnText}>
                      🚪 Esci da questa Riunione Segreta
                    </Text>
                  </TouchableOpacity>
                </View>
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
    maxHeight: '88%',
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
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
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FDE047',
  },
  body: {
    marginBottom: 16,
  },
  codeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 16,
    gap: 12,
  },
  codeCardLabel: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeCardValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginVertical: 2,
  },
  codeCardHelp: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  copyBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  copyBtnText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  podiumPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 8,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  podiumRank: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  podiumPlayer: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  woodenSpoonRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    marginTop: 4,
  },
  woodenSpoonRank: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '800',
  },
  woodenSpoonPlayer: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
  },
  concludeContainer: {
    marginTop: 4,
    marginBottom: 16,
  },
  concludeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  concludeBtnText: {
    color: Colors.loss,
    fontSize: 14,
    fontWeight: '800',
  },
  concludeBtnSub: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  concludeForm: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  concludeWarningTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  concludeWarningText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  concludeActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelConcludeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelConcludeBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmConcludeBtn: {
    flex: 2,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.loss,
  },
  confirmConcludeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statusBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyHallBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyHallEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyHallTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyHallSub: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  seasonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seasonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seasonCardTitle: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: '800',
  },
  seasonCardMatches: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  seasonPodiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  podiumPill: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  goldPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  silverPill: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  bronzePill: {
    backgroundColor: 'rgba(205, 127, 50, 0.15)',
    borderColor: 'rgba(205, 127, 50, 0.4)',
  },
  woodPill: {
    backgroundColor: 'rgba(133, 77, 14, 0.2)',
    borderColor: 'rgba(133, 77, 14, 0.5)',
  },
  podiumMedal: {
    fontSize: 11,
    fontWeight: '800',
  },
  podiumPillName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formCardTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  formCardHelp: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '800',
  },
  switchDefaultBox: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  leaveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    width: '100%',
    alignItems: 'center',
  },
  leaveBtnText: {
    color: Colors.loss,
    fontSize: 13,
    fontWeight: '800',
  },
  nonAdminBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  nonAdminText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
