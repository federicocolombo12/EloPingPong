import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { EloPreviewBadge } from '../components/EloPreviewBadge';
import { FullScreenLiveMatchModal } from '../components/FullScreenLiveMatchModal';
import { LiveScoreboard } from '../components/LiveScoreboard';
import { useElo } from '../context/EloContext';
import {
    ENVIRONMENTAL_MODIFIERS,
    PERSONAL_MODIFIERS,
    SCORE_PRESETS_11,
    SCORE_PRESETS_21,
    SCORE_PRESETS_SETS,
} from '../core/constants';
import { MatchLiveStats } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

interface NewMatchScreenProps {
  onMatchRegistered?: () => void;
}

export const NewMatchScreen: React.FC<NewMatchScreenProps> = ({ onMatchRegistered }) => {
  const {
    players,
    recordMatch,
    currentLeague,
    startLiveReferee,
    joinLiveMatchAsSpectator,
    associatedPlayer,
  } = useElo();

  // Mette in prima posizione il profilo con cui l'utente è attualmente loggato
  const sortedPlayers = useMemo(() => {
    if (!associatedPlayer) return players;
    return [
      associatedPlayer,
      ...players.filter((p) => p.id !== associatedPlayer.id),
    ];
  }, [players, associatedPlayer]);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [targetPoints, setTargetPoints] = useState<11 | 21>(11);
  const [showAdvancedConditions, setShowAdvancedConditions] = useState<boolean>(false);
  const [actionChoice, setActionChoice] = useState<'live' | 'quick'>('live');

  // Pre-seleziona l'utente loggato come Sfidante 1, e il primo avversario come Sfidante 2
  const [player1Id, setPlayer1Id] = useState<string>(() => {
    if (associatedPlayer) return associatedPlayer.id;
    return players[0]?.id || '';
  });
  const [player2Id, setPlayer2Id] = useState<string>(() => {
    if (associatedPlayer) {
      const other = players.find((p) => p.id !== associatedPlayer.id);
      return other ? other.id : (players[1]?.id || '');
    }
    return players[1]?.id || players[0]?.id || '';
  });
  const [score1, setScore1] = useState<number>(11);
  const [score2, setScore2] = useState<number>(9);
  const [note, setNote] = useState<string>('');
  const [isFriendly, setIsFriendly] = useState<boolean>(false);
  const [selectedEnvMods, setSelectedEnvMods] = useState<string[]>([]);
  const [p1Mods, setP1Mods] = useState<string[]>([]);
  const [p2Mods, setP2Mods] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (players.length > 0) {
      if (!player1Id || !players.some((p) => p.id === player1Id)) {
        setPlayer1Id(associatedPlayer?.id || players[0].id);
      }
      if (
        !player2Id ||
        !players.some((p) => p.id === player2Id) ||
        (players.length > 1 && player2Id === (associatedPlayer?.id || player1Id))
      ) {
        const fallbackOther = sortedPlayers.find((p) => p.id !== (associatedPlayer?.id || player1Id));
        setPlayer2Id(fallbackOther?.id || players[1]?.id || players[0]?.id || '');
      }
    }
  }, [players, associatedPlayer]);

  const handleCopySecretCode = () => {
    soundEffects.playButtonTap();
    if (currentLeague?.code) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(currentLeague.code);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const activeLive = currentLeague?.activeLiveMatch;
  const liveP1 = activeLive ? players.find((p) => p.id === activeLive.player1Id) : null;
  const liveP2 = activeLive ? players.find((p) => p.id === activeLive.player2Id) : null;

  const toggleEnvMod = (id: string) => {
    soundEffects.playButtonTap();
    if (selectedEnvMods.includes(id)) {
      setSelectedEnvMods(selectedEnvMods.filter((m) => m !== id));
    } else {
      setSelectedEnvMods([...selectedEnvMods, id]);
    }
  };

  const toggleP1Mod = (id: string) => {
    soundEffects.playButtonTap();
    if (p1Mods.includes(id)) {
      setP1Mods(p1Mods.filter((m) => m !== id));
    } else {
      setP1Mods([...p1Mods, id]);
    }
  };

  const toggleP2Mod = (id: string) => {
    soundEffects.playButtonTap();
    if (p2Mods.includes(id)) {
      setP2Mods(p2Mods.filter((m) => m !== id));
    } else {
      setP2Mods([...p2Mods, id]);
    }
  };

  const selectPreset = (p1Score: number, p2Score: number) => {
    soundEffects.playButtonTap();
    setScore1(p1Score);
    setScore2(p2Score);
  };

  const invertScore = () => {
    soundEffects.playButtonTap();
    const temp = score1;
    setScore1(score2);
    setScore2(temp);
  };

  const handleRegisterMatch = async () => {
    soundEffects.playButtonTap();
    if (player1Id === player2Id) {
      const msg = 'Devi selezionare due giocatori diversi!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Attenzione', msg);
      return;
    }
    if (score1 === score2) {
      const msg = 'A ping pong non esiste il pareggio! Uno dei due deve vincere.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Punteggio non valido', msg);
      return;
    }

    setSubmitting(true);
    try {
      const result = await recordMatch(player1Id, player2Id, score1, score2, {
        note: note.trim(),
        isFriendly,
        environmentalModifiers: selectedEnvMods,
        player1Modifiers: p1Mods,
        player2Modifiers: p2Mods,
      });

      if (result.success) {
        soundEffects.playVictoryFanfare();
        setNote('');
        setSelectedEnvMods([]);
        setP1Mods([]);
        setP2Mods([]);
        setCurrentStep(1);
        if (onMatchRegistered) {
          onMatchRegistered();
        }
      } else if (result.error) {
        Platform.OS === 'web'
          ? window.alert(result.error)
          : Alert.alert('Errore', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunchLive = async () => {
    soundEffects.playButtonTap();
    if (!player1 || !player2) return;
    if (player1.id === player2.id) {
      const msg = 'Devi selezionare due giocatori diversi!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Attenzione', msg);
      return;
    }
    await startLiveReferee(player1, player2, targetPoints);
  };

  const renderPlayerChips = (
    selectedId: string,
    onSelect: (id: string) => void,
    slot: 'p1' | 'p2'
  ) => {
    const isRowLayout = sortedPlayers.length <= 4;
    const chips = sortedPlayers.map((p) => {
      const isSelected = p.id === selectedId;
      const isMe = associatedPlayer?.id === p.id;
      return (
        <TouchableOpacity
          key={`${slot}_${p.id}`}
          activeOpacity={0.7}
          onPress={() => {
            soundEffects.playButtonTap();
            onSelect(p.id);
          }}
          style={[
            styles.playerChip,
            isRowLayout && styles.playerChipInRow,
            isSelected && (slot === 'p1' ? styles.playerChipSelectedP1 : styles.playerChipSelectedP2),
            isMe && !isSelected && styles.playerChipMe,
          ]}
        >
          {isMe && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>⭐️ TU</Text>
            </View>
          )}
          <Text style={[styles.chipAvatar, isRowLayout && styles.chipAvatarSmall]}>{p.avatar}</Text>
          <Text
            style={[styles.chipName, isSelected && styles.chipNameSelected, isRowLayout && styles.chipNameSmall]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {p.name}
          </Text>
          <Text style={[styles.chipElo, isRowLayout && styles.chipEloSmall]}>{p.elo}</Text>
        </TouchableOpacity>
      );
    });

    if (isRowLayout) {
      return <View style={styles.playerChipsRow}>{chips}</View>;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playerChipsScroll}
      >
        {chips}
      </ScrollView>
    );
  };

  if (players.length < 2) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🤫</Text>
          <Text style={styles.headerTitle}>RIUNIONE SEGRETA IN ATTESA</Text>
          <Text style={styles.headerSub}>Servono almeno 2 agenti per iniziare i match!</Text>
        </View>

        <View style={styles.waitingCard}>
          <Text style={styles.waitingEmoji}>🏓</Text>
          <Text style={styles.waitingTitle}>In attesa di altri giocatori...</Text>
          <Text style={styles.waitingDesc}>
            Per registrare partite e competere per la vetta dell'Elo, invita i tuoi compagni a entrare nella tua Riunione Segreta.
          </Text>

          <View style={styles.capacityRow}>
            <Text style={styles.capacityLabel}>Agenti al tavolo:</Text>
            <View style={styles.capacityPill}>
              <Text style={styles.capacityPillText}>
                {players.length} / {currentLeague?.maxPlayers || 4} Giocatori
              </Text>
            </View>
          </View>

          {players.map((p) => (
            <View key={p.id} style={styles.singlePlayerBadge}>
              <Text style={{ fontSize: 24 }}>{p.avatar}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: p.color || '#FACC15', fontWeight: '900', fontSize: 16 }}>{p.name}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{p.elo} ELO • {p.catchphrase || 'Pronto alla sfida'}</Text>
              </View>
              <View style={styles.readyTag}>
                <Text style={styles.readyTagText}>PRONTO</Text>
              </View>
            </View>
          ))}

          <View style={styles.secretCodeBox}>
            <Text style={styles.secretCodeLabel}>CODICE SEGRETO DI INVITO</Text>
            <Text style={styles.secretCodeValue}>{currentLeague?.code || '---'}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopySecretCode}
              style={[styles.copyCodeBtn, copiedCode && styles.copyCodeBtnSuccess]}
            >
              <Text style={styles.copyCodeBtnText}>
                {copiedCode ? '✅ Codice Copiato!' : '📋 Copia Codice Segreto'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.instructionsText}>
            Dì ai tuoi avversari di registrarsi all'app e inserire questo codice per unirsi al torneo!
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚔️</Text>
        <Text style={styles.headerTitle}>REGISTRA MATCH</Text>
        <Text style={styles.headerSub}>Chi vince si prende i punti, chi perde inventa scuse!</Text>
      </View>

      {/* BANNER SEGNALAZIONE BUG 1: MATCH IN CORSO NELLA LEGA */}
      {activeLive && liveP1 && liveP2 && (
        <View style={styles.activeMatchCard}>
          <View style={styles.activeMatchBadgeRow}>
            <View style={styles.livePulseDot} />
            <Text style={styles.activeMatchBadgeText}>🔴 PARTITA IN CORSO ADESSO</Text>
            <Text style={styles.activeMatchTargetText}>Al {activeLive.targetPoints}</Text>
          </View>

          <View style={styles.activeMatchScoreRow}>
            <View style={styles.activeMatchPlayerCol}>
              <Text style={styles.activeMatchAvatar}>{liveP1.avatar}</Text>
              <Text style={[styles.activeMatchPlayerName, { color: liveP1.color || '#3B82F6' }]} numberOfLines={1}>
                {liveP1.name}
              </Text>
            </View>
            <View style={styles.activeMatchCenterScore}>
              <Text style={styles.activeMatchScoreNumber}>
                {activeLive.score1} - {activeLive.score2}
              </Text>
              <Text style={styles.activeMatchRefereeText}>
                Arbitro: {activeLive.refereePlayerName || 'Lega'}
              </Text>
            </View>
            <View style={styles.activeMatchPlayerCol}>
              <Text style={styles.activeMatchAvatar}>{liveP2.avatar}</Text>
              <Text style={[styles.activeMatchPlayerName, { color: liveP2.color || '#10B981' }]} numberOfLines={1}>
                {liveP2.name}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.joinLiveBtn}
            activeOpacity={0.8}
            onPress={() => {
              soundEffects.playButtonTap();
              joinLiveMatchAsSpectator(liveP1, liveP2, activeLive.targetPoints || 11);
            }}
          >
            <Text style={styles.joinLiveBtnText}>
              👀 Entra nella Partita Live (Chat & Reazioni) 💬
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PROGRESS STEPPER (SEGNALAZIONE 2: SEQUENZA A STEP) */}
      <View style={styles.stepperNav}>
        {[
          { step: 1, title: '1. Sfidanti', icon: '👥' },
          { step: 2, title: '2. Regole', icon: '⚙️' },
          { step: 3, title: '3. Azione', icon: '🏓' },
        ].map((item) => {
          const isActive = currentStep === item.step;
          const isPassed = currentStep > item.step;
          return (
            <TouchableOpacity
              key={item.step}
              disabled={item.step > currentStep}
              onPress={() => {
                soundEffects.playButtonTap();
                setCurrentStep(item.step as 1 | 2 | 3);
              }}
              style={[
                styles.stepIndicatorItem,
                isActive && styles.stepIndicatorItemActive,
                isPassed && styles.stepIndicatorItemPassed,
              ]}
            >
              <Text
                style={[
                  styles.stepIndicatorText,
                  isActive && styles.stepIndicatorTextActive,
                  isPassed && styles.stepIndicatorTextPassed,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ========================================================= */}
      {/* STEP 1: CHI GIOCA? (SFIDANTI) */}
      {/* ========================================================= */}
      {currentStep === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepSectionTitle}>Seleziona Sfidante 1</Text>
          {renderPlayerChips(player1Id, setPlayer1Id, 'p1')}

          {/* VS EMBLEM */}
          <View style={styles.vsBadgeRow}>
            <View style={styles.vsLine} />
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.vsLine} />
          </View>

          <Text style={styles.stepSectionTitle}>Seleziona Sfidante 2</Text>
          {renderPlayerChips(player2Id, setPlayer2Id, 'p2')}

          {/* Mini riepilogo sfidanti o avviso stesso giocatore */}
          {player1Id === player2Id ? (
            <View style={[styles.stepSummaryBox, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Text style={[styles.stepSummaryText, { color: '#FCA5A5' }]}>
                ⚠️ Hai selezionato lo stesso giocatore in entrambi gli slot! Seleziona due sfidanti diversi per procedere.
              </Text>
            </View>
          ) : player1 && player2 ? (
            <View style={styles.stepSummaryBox}>
              <Text style={styles.stepSummaryText}>
                ⚔️ <Text style={{ color: player1.color || '#3B82F6', fontWeight: '900' }}>{player1.name}</Text> ({player1.elo}) contro <Text style={{ color: player2.color || '#10B981', fontWeight: '900' }}>{player2.name}</Text> ({player2.elo})
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.wizardPrimaryBtn,
              (!player1 || !player2 || player1.id === player2.id) && styles.wizardPrimaryBtnDisabled,
            ]}
            disabled={!player1 || !player2 || player1.id === player2.id}
            onPress={() => {
              soundEffects.playButtonTap();
              setCurrentStep(2);
            }}
          >
            <Text style={styles.wizardPrimaryBtnText}>Avanti: Regole & Formato ➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================= */}
      {/* STEP 2: REGOLE & FORMATO */}
      {/* ========================================================= */}
      {currentStep === 2 && (
        <View style={styles.stepContainer}>
          {/* Selettore Punti Partita (11 o 21) */}
          <Text style={styles.stepSectionTitle}>🎯 Formato Punti</Text>
          <View style={styles.targetChoiceRow}>
            <TouchableOpacity
              style={[styles.targetChoiceBtn, targetPoints === 11 && styles.targetChoiceBtnActive]}
              onPress={() => {
                soundEffects.playButtonTap();
                setTargetPoints(11);
                setScore1(11);
                setScore2(9);
              }}
            >
              <Text style={[styles.targetChoiceTitle, targetPoints === 11 && styles.targetChoiceTitleActive]}>
                ⚡ Partita all'11
              </Text>
              <Text style={styles.targetChoiceSub}>Veloce • Cambio battuta ogni 2</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.targetChoiceBtn, targetPoints === 21 && styles.targetChoiceBtnActive]}
              onPress={() => {
                soundEffects.playButtonTap();
                setTargetPoints(21);
                setScore1(21);
                setScore2(18);
              }}
            >
              <Text style={[styles.targetChoiceTitle, targetPoints === 21 && styles.targetChoiceTitleActive]}>
                🎯 Partita al 21
              </Text>
              <Text style={styles.targetChoiceSub}>Classica • Cambio battuta ogni 5</Text>
            </TouchableOpacity>
          </View>

          {/* Partita Ufficiale vs Amichevole */}
          <Text style={styles.stepSectionTitle}>🏆 Tipo di Competizione</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              soundEffects.playButtonTap();
              setIsFriendly(!isFriendly);
            }}
            style={[styles.friendlyToggleCard, isFriendly && styles.friendlyToggleCardActive]}
          >
            <Text style={styles.friendlyToggleIcon}>{isFriendly ? '🤝' : '🏆'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.friendlyToggleTitle, isFriendly && { color: '#93C5FD' }]}>
                {isFriendly ? 'Partita Amichevole (Nessun punto Elo)' : 'Partita Ufficiale Elo & ATP Race'}
              </Text>
              <Text style={styles.friendlyToggleDesc}>
                {isFriendly
                  ? 'Salva lo storico ma NESSUN punto Elo scambiato.'
                  : 'Punti Elo ufficiali e punti stagionali per la Race ATP!'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Accordion Modificatori e Scuse (non ingombra la schermata) */}
          <TouchableOpacity
            style={styles.advancedToggleBtn}
            onPress={() => {
              soundEffects.playButtonTap();
              setShowAdvancedConditions(!showAdvancedConditions);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.advancedToggleBtnText}>
              {showAdvancedConditions
                ? '▼ Nascondi Scuse e Condizioni Ambientali'
                : '▶ Aggiungi Scuse o Condizioni Ambientali (Opzionale)'}
            </Text>
          </TouchableOpacity>

          {showAdvancedConditions && (
            <View style={styles.advancedBox}>
              <Text style={styles.envTitle}>🌪️ Condizioni Ambientali:</Text>
              <View style={styles.envChipsRow}>
                {ENVIRONMENTAL_MODIFIERS.filter((m) => m.id !== 'friendly').map((mod) => {
                  const isSelected = selectedEnvMods.includes(mod.id);
                  return (
                    <TouchableOpacity
                      key={mod.id}
                      onPress={() => toggleEnvMod(mod.id)}
                      style={[styles.envChip, isSelected && styles.envChipSelected]}
                    >
                      <Text style={[styles.envChipText, isSelected && styles.envChipTextSelected]}>
                        {mod.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.subModLabel}>Scusa a caldo per {player1?.name || 'P1'}:</Text>
              <View style={styles.modChipsRow}>
                {PERSONAL_MODIFIERS.map((mod) => {
                  const isSelected = p1Mods.includes(mod.id);
                  return (
                    <TouchableOpacity
                      key={`p1m_${mod.id}`}
                      onPress={() => toggleP1Mod(mod.id)}
                      style={[styles.personalChip, isSelected && styles.personalChipSelected]}
                    >
                      <Text style={[styles.personalChipText, isSelected && styles.personalChipTextSelected]}>
                        {mod.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.subModLabel}>Scusa a caldo per {player2?.name || 'P2'}:</Text>
              <View style={styles.modChipsRow}>
                {PERSONAL_MODIFIERS.map((mod) => {
                  const isSelected = p2Mods.includes(mod.id);
                  return (
                    <TouchableOpacity
                      key={`p2m_${mod.id}`}
                      onPress={() => toggleP2Mod(mod.id)}
                      style={[styles.personalChip, isSelected && styles.personalChipSelected]}
                    >
                      <Text style={[styles.personalChipText, isSelected && styles.personalChipTextSelected]}>
                        {mod.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tasti Navigazione Step 2 */}
          <View style={styles.wizardNavRow}>
            <TouchableOpacity
              style={styles.wizardBackBtn}
              onPress={() => {
                soundEffects.playButtonTap();
                setCurrentStep(1);
              }}
            >
              <Text style={styles.wizardBackBtnText}>⬅️ Sfidanti</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.wizardPrimaryBtn}
              onPress={() => {
                soundEffects.playButtonTap();
                setCurrentStep(3);
              }}
            >
              <Text style={styles.wizardPrimaryBtnText}>Avanti: Gioca o Registra ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* STEP 3: AZIONE (ARBITRA LIVE vs INSERIMENTO RAPIDO) */}
      {/* ========================================================= */}
      {currentStep === 3 && (
        <View style={styles.stepContainer}>
          {/* Card Riepilogo Partita */}
          <View style={styles.matchSummaryPill}>
            <Text style={styles.matchSummaryPillText}>
              🏓 <Text style={{ color: player1?.color || '#3B82F6', fontWeight: '900' }}>{player1?.name}</Text> vs{' '}
              <Text style={{ color: player2?.color || '#10B981', fontWeight: '900' }}>{player2?.name}</Text> • Partita al{' '}
              {targetPoints} • {isFriendly ? '🤝 Amichevole' : '🏆 Ufficiale'}
            </Text>
          </View>

          {/* Toggle Modalità */}
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              onPress={() => {
                soundEffects.playButtonTap();
                setActionChoice('live');
              }}
              style={[styles.modeTab, actionChoice === 'live' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, actionChoice === 'live' && styles.modeTabTextActive]}>
                🏓 Arbitra Live con Chat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                soundEffects.playButtonTap();
                setActionChoice('quick');
              }}
              style={[styles.modeTab, actionChoice === 'quick' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, actionChoice === 'quick' && styles.modeTabTextActive]}>
                ⚡ Inserimento Rapido
              </Text>
            </TouchableOpacity>
          </View>

          {/* Opzione A: Arbitraggio Live */}
          {actionChoice === 'live' ? (
            <View style={styles.liveLaunchpadCard}>
              <View style={styles.liveLaunchpadHeader}>
                <Text style={styles.liveLaunchpadIcon}>🏓</Text>
                <Text style={styles.liveLaunchpadTitle}>Arbitraggio Live a Schermo Intero</Text>
              </View>
              <Text style={styles.liveLaunchpadDesc}>
                Trasforma il telefono nel tabellone elettronico da tavolo: segna spigoli, net, smash e falli di battuta a tutto schermo!
                La partita verrà trasmessa in diretta sul server della Riunione Segreta con Live Chat e Reazioni per tutti gli spettatori.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLaunchLive}
                style={styles.launchRefereeBtn}
              >
                <Text style={styles.launchRefereeBtnText}>
                  🏁 AVVIA DIRETTA & ARBITRAGGIO LIVE
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Opzione B: Inserimento Rapido */
            <View style={styles.quickFormCard}>
              {/* Stepper Punteggio */}
              <View style={styles.stepperContainer}>
                {/* Punteggio P1 */}
                <View style={styles.scoreBox}>
                  <Text style={styles.scorePlayerName} numberOfLines={1}>
                    {player1?.name || 'P1'}
                  </Text>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      onPress={() => {
                        soundEffects.playPaddleHit();
                        setScore1((prev) => Math.max(0, prev - 1));
                      }}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.scoreDisplay}>{score1}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        soundEffects.playPaddleHit();
                        setScore1((prev) => prev + 1);
                      }}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inverti */}
                <TouchableOpacity onPress={invertScore} style={styles.invertBtn}>
                  <Text style={styles.invertBtnText}>⇄</Text>
                </TouchableOpacity>

                {/* Punteggio P2 */}
                <View style={styles.scoreBox}>
                  <Text style={styles.scorePlayerName} numberOfLines={1}>
                    {player2?.name || 'P2'}
                  </Text>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      onPress={() => {
                        soundEffects.playPaddleHit();
                        setScore2((prev) => Math.max(0, prev - 1));
                      }}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.scoreDisplay}>{score2}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        soundEffects.playPaddleHit();
                        setScore2((prev) => prev + 1);
                      }}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Preset pertinenti */}
              <Text style={styles.presetLabel}>
                🎯 Preset rapidi ({targetPoints === 11 ? "Partite all'11" : 'Partite al 21'}):
              </Text>
              <View style={styles.presetRow}>
                {(targetPoints === 11 ? SCORE_PRESETS_11 : SCORE_PRESETS_21).map((preset, idx) => (
                  <TouchableOpacity
                    key={`pre_${idx}`}
                    onPress={() => selectPreset(preset.p1, preset.p2)}
                    style={[styles.presetBtn, targetPoints === 21 && styles.presetBtn21]}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        targetPoints === 21 && { color: '#FDE047' },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Anteprima Elo */}
              {player1 && player2 && (
                <EloPreviewBadge
                  player1={player1}
                  player2={player2}
                  score1={score1}
                  score2={score2}
                  isFriendly={isFriendly}
                  environmentalModifiers={selectedEnvMods}
                  player1Modifiers={p1Mods}
                  player2Modifiers={p2Mods}
                />
              )}

              {/* Nota / Sfottò */}
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Commento o scusa a caldo (opzionale):</Text>
                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Es: Spigolo clamoroso sul 10 pari / Smash sul lampadario"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Tasto Registra */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={submitting}
                onPress={handleRegisterMatch}
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              >
                <Text style={styles.submitBtnIcon}>🏆</Text>
                <Text style={styles.submitBtnText}>
                  {submitting ? 'CALCOLO IN CORSO...' : 'CONFERMA RISULTATO & ASSEGNA PUNTI'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tasto Indietro Step 3 */}
          <TouchableOpacity
            style={styles.wizardBackBtnFull}
            onPress={() => {
              soundEffects.playButtonTap();
              setCurrentStep(2);
            }}
          >
            <Text style={styles.wizardBackBtnText}>⬅️ Modifica Regole & Formato</Text>
          </TouchableOpacity>
        </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  // Active Match Banner (Bug 1)
  activeMatchCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  activeMatchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  activeMatchBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeMatchTargetText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  activeMatchScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  activeMatchPlayerCol: {
    alignItems: 'center',
    flex: 1,
  },
  activeMatchAvatar: {
    fontSize: 26,
    marginBottom: 4,
  },
  activeMatchPlayerName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  activeMatchCenterScore: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  activeMatchScoreNumber: {
    color: '#FDE047',
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  activeMatchRefereeText: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  joinLiveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  joinLiveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // Stepper Nav
  stepperNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  stepIndicatorItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  stepIndicatorItemActive: {
    backgroundColor: Colors.primary,
  },
  stepIndicatorItemPassed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepIndicatorText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  stepIndicatorTextActive: {
    color: Colors.textDark,
    fontWeight: '900',
  },
  stepIndicatorTextPassed: {
    color: Colors.textPrimary,
  },

  // Step Container & Titles
  stepContainer: {
    gap: 12,
  },
  stepSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  stepSummaryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  stepSummaryText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Target Choice
  targetChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  targetChoiceBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  targetChoiceBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
  },
  targetChoiceTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  targetChoiceTitleActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
  targetChoiceSub: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },

  // Advanced conditions
  advancedToggleBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  advancedToggleBtnText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  advancedBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },

  // Match Summary Pill & Quick Form Card
  matchSummaryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  matchSummaryPillText: {
    color: Colors.textPrimary,
    fontSize: 12,
  },
  quickFormCard: {
    gap: 12,
  },

  // Wizard Navigation Buttons
  wizardPrimaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  wizardPrimaryBtnDisabled: {
    opacity: 0.4,
  },
  wizardPrimaryBtnText: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: '900',
  },
  wizardNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  wizardBackBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wizardBackBtnFull: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wizardBackBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },

  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: Colors.textDark,
    fontWeight: '900',
  },
  friendlyToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 10,
  },
  friendlyToggleCardActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  friendlyToggleIcon: {
    fontSize: 22,
  },
  friendlyToggleTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  friendlyToggleDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  selectorCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  playerChipsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  playerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    minWidth: 80,
  },
  playerChipInRow: {
    flex: 1,
    minWidth: 0,
  },
  playerChipSelectedP1: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: '#3B82F6',
  },
  playerChipSelectedP2: {
    backgroundColor: 'rgba(255, 107, 0, 0.25)',
    borderColor: Colors.secondary,
  },
  playerChipMe: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  playerChipDisabled: {
    opacity: 0.3,
  },
  youBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  youBadgeText: {
    color: '#000000',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  chipAvatar: {
    fontSize: 22,
    marginBottom: 2,
  },
  chipAvatarSmall: {
    fontSize: 18,
    marginBottom: 1,
  },
  chipName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '100%',
  },
  chipNameSmall: {
    fontSize: 11,
  },
  chipNameSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  chipElo: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  chipEloSmall: {
    fontSize: 9.5,
    marginTop: 1,
  },
  subModLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  personalChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  personalChipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: Colors.gold,
  },
  personalChipText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  personalChipTextSelected: {
    color: '#FDE047',
  },
  vsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  vsText: {
    color: Colors.secondary,
    fontWeight: '900',
    fontSize: 12,
  },
  envSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  envTitle: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  envChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  envChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  envChipSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: Colors.accent,
  },
  envChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  envChipTextSelected: {
    color: '#A5F3FC',
  },
  scoreSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreBox: {
    alignItems: 'center',
    flex: 1,
  },
  scorePlayerName: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  scoreDisplay: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    minWidth: 40,
    textAlign: 'center',
  },
  invertBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  invertBtnText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '900',
  },
  presetLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetBtn21: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  presetBtnText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  noteContainer: {
    marginTop: 10,
  },
  noteLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginTop: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnIcon: {
    fontSize: 20,
  },
  submitBtnText: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveLaunchpadCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  liveLaunchpadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  liveLaunchpadIcon: {
    fontSize: 22,
  },
  liveLaunchpadTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  liveLaunchpadDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  liveMatchupPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  livePreviewPlayer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  livePreviewAvatar: {
    fontSize: 28,
    marginBottom: 4,
  },
  livePreviewName: {
    fontSize: 14,
    fontWeight: '800',
  },
  livePreviewVs: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '900',
    marginHorizontal: 10,
  },
  launchRefereeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  launchRefereeBtnText: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  waitingCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    marginBottom: 20,
  },
  waitingEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  waitingTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  capacityLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  capacityPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  capacityPillText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
  },
  singlePlayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  readyTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readyTagText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  secretCodeBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  secretCodeLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  secretCodeValue: {
    color: '#FACC15',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  copyCodeBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  copyCodeBtnSuccess: {
    backgroundColor: '#10B981',
  },
  copyCodeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  instructionsText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
