import React, { useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
  ChangelogModal,
  CURRENT_APP_VERSION,
  CURRENT_APP_CODENAME,
} from '../components/ChangelogModal';
import { EditPlayerModal } from '../components/EditPlayerModal';
import { useElo } from '../context/EloContext';
import { getPlayerActiveMilestone } from '../core/elo';
import { STARTING_COINS } from '../core/constants';
import { getPlayerTrophies } from '../core/trophies';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

export const ProfilesScreen: React.FC = () => {
  const {
    players,
    matches,
    updatePlayer,
    resetAllData,
    recordMatch,
    isCloudSyncActive,
    currentUser,
    associatedPlayer,
    logout,
    setIsAuthModalVisible,
    setIsLeagueModalVisible,
    setIsReportModalVisible,
    currentLeague,
    isAdmin,
    resetMeetingData,
    claimBailout,
  } = useElo();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);

  const handleClaimBailout = async () => {
    soundEffects.playButtonTap();
    const res = await claimBailout();
    if (!res.success) {
      const msg = res.error || 'Impossibile richiedere il sussidio ora.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sussidio di Povertà', msg);
    } else {
      const msg = '🎉 Sussidio accreditato! Hai ricevuto 50 LUL Coins per rimetterti in gioco!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Bailout Concesso! 💸', msg);
    }
  };

  const handleReset = () => {
    if (!isAdmin) {
      const msg = 'Solo il Capo Riunione Segreta può azzerare le partite e i punteggi!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Accesso Negato', msg);
      return;
    }

    const confirmMessage =
      'Sei sicuro di voler resettare tutti i dati della Riunione Segreta? Verranno azzerate tutte le partite e i punteggi Elo torneranno a 1200!';

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        resetMeetingData();
      }
    } else {
      Alert.alert('Reset Riunione Segreta', confirmMessage, [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Sì, resetta',
          style: 'destructive',
          onPress: () => resetMeetingData(),
        },
      ]);
    }
  };

  // Funzione per caricare dati demo di esempio (utile per testare subito grafici e podio)
  const handleLoadDemoMatches = async () => {
    if (players.length < 4) return;
    const p1 = players[0].id;
    const p2 = players[1].id;
    const p3 = players[2].id;
    const p4 = players[3].id;

    // Registra una serie di partite simulate con modificatori realistici
    await recordMatch(p1, p2, 3, 1, { note: 'Smash imprendibile', environmentalModifiers: ['wind'] });
    await recordMatch(p1, p3, 3, 0, { note: 'Dominio assoluto' });
    await recordMatch(p3, p4, 3, 2, { note: 'Spigolo al quinto set', player2Modifiers: ['borrowed_racket'] });
    await recordMatch(p2, p4, 3, 0, { note: 'Cappotto clamoroso', environmentalModifiers: ['beer'] });
    await recordMatch(p2, p1, 3, 2, { note: 'Rimonta epica da 0-2', environmentalModifiers: ['derby'] });
    await recordMatch(p3, p2, 3, 1, { note: 'Top spin con effetto tagliato', isFriendly: true });
    await recordMatch(p1, p4, 3, 0, { note: 'Niente da fare' });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerIcon}>⚙️</Text>
          <Text style={styles.headerTitle}>PROFILI & IMPOSTAZIONI</Text>
        </View>
        <Text style={styles.headerSub}>
          Gestisci il tuo profilo, account, Riunione Segreta e personalizzazioni
        </Text>
      </View>

      {/* BANNER ACCOUNT & GIOCATORE ATTIVO */}
      <View style={styles.accountCard}>
        <View style={styles.accountHeaderRow}>
          <Text style={styles.accountAvatar}>
            {associatedPlayer ? associatedPlayer.avatar : '👤'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountTitle}>
              {associatedPlayer
                ? `Connesso come: ${associatedPlayer.name}`
                : 'Nessun agente collegato'}
            </Text>
            <Text style={styles.accountSub}>
              {currentUser
                ? `Account: ${currentUser.email}`
                : 'Modalità locale / ospite'}
            </Text>
          </View>
        </View>

        <View style={styles.accountActionsRow}>
          {currentUser ? (
            <TouchableOpacity
              onPress={logout}
              style={styles.accountBtnLogout}
            >
              <Text style={styles.accountBtnLogoutText}>🚪 Disconnetti Account (Logout)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setIsAuthModalVisible(true)}
              style={styles.accountBtnPrimary}
            >
              <Text style={styles.accountBtnPrimaryText}>🔐 Accedi o Registrati con Email</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.accountSwitchHint}>
          🔒 Ogni account è legato al proprio agente. Per cambiare profilo devi disconnetterti ed effettuare il login con la relativa email e password.
        </Text>
      </View>

      {/* BOTTONE NOVITÀ & VERSIONE APP */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsChangelogVisible(true)}
        style={styles.changelogBannerBtn}
      >
        <Text style={styles.changelogBannerIcon}>✨</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.changelogTitleRow}>
            <Text style={styles.changelogBannerTitle}>Novità Arena Ping Pong</Text>
            <View style={styles.changelogVersionBadge}>
              <Text style={styles.changelogVersionText}>{CURRENT_APP_VERSION}</Text>
            </View>
          </View>
          <Text style={styles.changelogBannerSub}>
            {CURRENT_APP_CODENAME || 'Tutte le novità, aggiornamenti e modifiche. Tocca per leggere!'}
          </Text>
        </View>
        <Text style={styles.changelogBannerArrow}>➔</Text>
      </TouchableOpacity>

      {/* BOTTONE GESTIONE RIUNIONE SEGRETA & STAGIONI */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsLeagueModalVisible(true)}
        style={styles.leagueBannerBtn}
      >
        <Text style={styles.leagueBannerIcon}>🤫</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.leagueBannerTitle}>
            Riunione Segreta: {currentLeague?.name || 'In attesa'}
          </Text>
          <Text style={styles.leagueBannerSub}>
            Codice: {currentLeague?.code || '---'} • {players.length}/{currentLeague?.maxPlayers || 4} Agenti • Gestisci Riunione
          </Text>
        </View>
        <Text style={styles.leagueBannerArrow}>➔</Text>
      </TouchableOpacity>

      {/* Lista Agenti Riunione Segreta */}
      {players.length === 0 ? (
        <View style={styles.accountCard}>
          <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🤫</Text>
          <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>
            Nessun Agente al tavolo
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
            Condividi il codice segreto con gli amici per farli entrare nella Riunione Segreta!
          </Text>
        </View>
      ) : (
        players.map((player) => {
          const isCurrent = player.id === associatedPlayer?.id;
          const canEdit = isCurrent || isAdmin;
          const playerColor = player.color || '#3B82F6';

          return (
            <View
              key={player.id}
              style={[
                styles.playerCard,
                isCurrent && {
                  borderColor: playerColor,
                  borderWidth: 2,
                  backgroundColor: `${playerColor}10`,
                },
              ]}
            >
              {player.profileBanner ? (
                <View style={styles.playerBannerWrapper}>
                  <Image
                    source={{ uri: player.profileBanner }}
                    style={styles.playerBannerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.playerBannerOverlay} />
                </View>
              ) : null}

              {isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: playerColor }]}>
                  <Text style={styles.currentBadgeText}>⭐️ IL TUO PROFILO</Text>
                </View>
              )}

              <View style={styles.playerCardHeader}>
                <View style={[styles.avatarCircle, { borderColor: playerColor }]}>
                  <Text style={styles.avatarEmoji}>{player.avatar}</Text>
                </View>
                <View style={styles.nameCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.playerName, { color: playerColor }]}>{player.name}</Text>
                    {(() => {
                      const milestone = getPlayerActiveMilestone(player.elo);
                      if (!milestone) return null;
                      return (
                        <View style={[styles.milestoneBadge, { borderColor: milestone.color, backgroundColor: `${milestone.color}15` }]}>
                          <Text style={[styles.milestoneBadgeText, { color: milestone.color }]}>{milestone.badge}</Text>
                        </View>
                      );
                    })()}
                  </View>
                  <Text style={styles.playerElo}>
                    {player.elo} ELO • {player.wins}V - {player.losses}P
                  </Text>
                </View>
                {canEdit && (
                  <TouchableOpacity
                    onPress={() => setEditingPlayer(player)}
                    style={[
                      styles.editBtn,
                      !isCurrent && isAdmin && { backgroundColor: 'rgba(250, 204, 21, 0.15)', borderColor: '#FACC15' }
                    ]}
                  >
                    <Text style={[styles.editBtnText, !isCurrent && isAdmin && { color: '#FACC15' }]}>
                      {isCurrent ? '✏️ Modifica' : '👑 Modifica'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Saldo LUL Coins & Statistiche Scommesse */}
              <View style={styles.economyRow}>
                <View style={styles.coinsBadge}>
                  <Text style={styles.coinsBadgeText}>
                    🪙 {player.coins !== undefined ? player.coins : STARTING_COINS} LUL Coins
                  </Text>
                </View>
                {isCurrent && (player.coins !== undefined ? player.coins : STARTING_COINS) === 0 && (
                  <TouchableOpacity
                    onPress={handleClaimBailout}
                    style={styles.bailoutBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bailoutBtnText}>💸 Chiedi Sussidio (+50 🪙)</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.betStatsBadge}>
                  <Text style={styles.betStatsText}>
                    🎯 Bet: {player.betsWon || 0}V - {player.betsLost || 0}P{player.coinsWonOnBets !== undefined ? ` • ${player.coinsWonOnBets >= 0 ? '+' : ''}${player.coinsWonOnBets} 🪙` : ''}
                  </Text>
                </View>
              </View>

              {/* Catchphrase con accento colorato */}
              <View style={[styles.quoteBox, { borderLeftColor: playerColor, borderLeftWidth: 3.5 }]}>
                <Text style={styles.quoteLabel}>Catchphrase:</Text>
                <Text style={styles.quoteText}>
                  {player.catchphrase ? `"${player.catchphrase}"` : 'Nessun motto impostato'}
                </Text>
              </View>

              {/* Trofei Speciali Posseduti */}
              {(() => {
                const playerTrophies = getPlayerTrophies(player.id, players, matches);
                if (playerTrophies.length === 0) return null;
                return (
                  <View style={styles.trophiesRow}>
                    {playerTrophies.map((trophy) => (
                      <View key={trophy.id} style={styles.trophyBadge}>
                        <Text style={styles.trophyIcon}>{trophy.icon}</Text>
                        <Text style={styles.trophyName}>{trophy.title}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}

              {/* Tag comici */}
              {player.tags && player.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {player.tags.map((tag, idx) => (
                    <View key={idx} style={[styles.tagBadge, { borderColor: `${playerColor}40` }]}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}

      {/* Sezione Sincronizzazione Cloud */}
      <View style={styles.cloudCard}>
        <View style={styles.cloudHeaderRow}>
          <Text style={styles.cloudIcon}>{isCloudSyncActive ? '☁️' : '📱'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cloudTitle}>
              {isCloudSyncActive ? 'Sincronizzazione Cloud Attiva' : 'Modalità Memoria Locale'}
            </Text>
            <Text style={styles.cloudDesc}>
              {isCloudSyncActive
                ? 'Tutti i telefoni della Riunione Segreta sono sincronizzati in tempo reale con Firebase! Quando un agente registra un match, tutti vedono l\'aggiornamento istantaneo.'
                : 'I dati sono salvati solo su questo dispositivo.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Sezione Segnalazioni & Feedback AI */}
      <View style={styles.reportCard}>
        <View style={styles.reportHeaderRow}>
          <Text style={styles.reportIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle}>Segnalazioni & Richieste AI</Text>
            <Text style={styles.reportDesc}>
              Hai trovato un errore, desideri una modifica o vuoi contestare un match? Invia una segnalazione: verrà salvata nel server e l'AI interverrà su richiesta!
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.openReportBtn}
          onPress={() => setIsReportModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.openReportBtnText}>📝 Invia Segnalazione all'AI</Text>
        </TouchableOpacity>
      </View>

      {/* Sezione Strumenti & Reset */}
      {isAdmin && (
        <View style={styles.toolsCard}>
          <Text style={styles.toolsTitle}>👑 Comandi Capo Riunione Segreta</Text>

          <TouchableOpacity
            onPress={handleReset}
            style={styles.resetBtn}
          >
            <Text style={styles.resetBtnText}>⚠️ Resetta Match & Punteggi della Riunione</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal di Modifica */}
      <EditPlayerModal
        player={editingPlayer}
        visible={!!editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSave={updatePlayer}
      />

      {/* Modal Changelog Novita & Versione */}
      <ChangelogModal
        visible={isChangelogVisible}
        onClose={() => setIsChangelogVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingVertical: 14,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  playerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  nameCol: {
    flex: 1,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  playerElo: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtnText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  quoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  quoteLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  quoteText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  cloudCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountAvatar: {
    fontSize: 28,
  },
  accountTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  accountSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  accountActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  accountBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  accountBtnLogout: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountBtnLogoutText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '800',
  },
  accountSwitchHint: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
  },
  accountBtnPrimary: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  accountBtnPrimaryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  changelogBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 12,
  },
  changelogBannerIcon: {
    fontSize: 24,
  },
  changelogTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changelogBannerTitle: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '800',
  },
  changelogVersionBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changelogVersionText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '900',
  },
  changelogBannerSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  changelogBannerArrow: {
    color: '#93C5FD',
    fontSize: 16,
    fontWeight: '800',
  },
  leagueBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 12,
  },
  leagueBannerIcon: {
    fontSize: 24,
  },
  leagueBannerTitle: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: '800',
  },
  leagueBannerSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  leagueBannerArrow: {
    color: '#FDE047',
    fontSize: 16,
    fontWeight: '800',
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cloudHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cloudIcon: {
    fontSize: 24,
  },
  cloudTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  cloudDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  toolsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolsTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  demoBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 10,
  },
  demoBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  resetBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resetBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  playerBannerWrapper: {
    height: 72,
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  playerBannerImage: {
    width: '100%',
    height: '100%',
  },
  playerBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  reportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 26,
  },
  reportTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  reportDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  openReportBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  openReportBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '800',
  },
  trophiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  trophyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  trophyIcon: {
    fontSize: 11,
  },
  trophyName: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
  },
  milestoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  milestoneBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  economyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  coinsBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  coinsBadgeText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
  },
  bailoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  bailoutBtnText: {
    color: '#FCA5A5',
    fontSize: 10.5,
    fontWeight: '900',
  },
  betStatsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  betStatsText: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
});
