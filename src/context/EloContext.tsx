import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastData } from '../components/InAppNotificationToast';
import {
    BAILOUT_AMOUNT,
    BAILOUT_COOLDOWN_MS,
    DEFAULT_CUSTOM_TAGS,
    DEFAULT_INITIAL_ELO,
    DEFAULT_LEAGUE_CODE,
    DEFAULT_LEAGUE_ID,
    DEFAULT_LEAGUE_NAME,
    DEFAULT_PLAYERS,
    MATCH_LOSS_COINS,
    MATCH_WIN_COINS,
    STARTING_COINS,
} from '../core/constants';
import {
  calculateActivityBonus,
  calculateEloChange,
  calculateRacePointsForMatch,
  checkThresholdCrossed,
  recalculateStreak,
} from '../core/elo';
import {
  calculateLiveDynamicOdds,
  calculatePreMatchOdds,
  canPlacePreMatchBet,
  handleBilateralBetRule,
  resolveMatchBets,
} from '../core/betting';
import { openMysteryBox, SHOP_ITEMS } from '../core/shop';
import { soundEffects } from '../utils/soundEffects';
import { isFirebaseConfigured } from '../core/firebaseConfig';
import {
  sanitizePlayerUpdates,
  validateLeagueMembership,
  validatePlayerOwnership,
} from '../core/security';
import {
    buildDefaultLeague,
    createSecretMeeting as createSecretMeetingInFirebase,
    findLeagueByCode,
    getUserProfile,
    joinSecretMeeting as joinSecretMeetingInFirebase,
    sanitizeForFirestore,
    saveUserProfile,
    signInWithEmail,
    signOutUser,
    signUpWithEmail,
    subscribeToAuth,
    subscribeToLeagueData,
    syncLeagueToCloud,
    wipeOldMockData,
} from '../core/firebaseService';
import {
    clearAllStorage,
    loadActiveLeagueId,
    loadLinkedPlayerId,
    loadMatches,
    loadPlayers,
    loadSavedUserSession,
    saveActiveLeagueId,
    saveLinkedPlayerId,
    saveMatches,
    savePlayers,
    saveSavedUserSession,
} from '../core/storage';
import {
    ActiveLiveMatch,
    AuthUserProfile,
    CustomTag,
    League,
    LiveBet,
    LiveMatchSpecialEvent,
    Match,
    MatchComment,
    MatchLiveStats,
    Player,
    Season,
    SeasonPodium,
} from '../core/types';

interface EloContextType {
  players: Player[];
  rankedPlayers: Player[];
  rankedPlayersByRace: Player[];
  matches: Match[];
  loading: boolean;
  isAuthLoading: boolean;
  isCloudSyncActive: boolean;
  celebrationMatch: Match | null;
  clearCelebration: () => void;
  thresholdEvent: { player: Player; threshold: number; gifUrl?: string } | null;
  clearThresholdEvent: () => void;
  toastNotification: ToastData | null;
  clearToastNotification: () => void;
  activeCommentsMatch: Match | null;
  setActiveCommentsMatch: (match: Match | null) => void;

  // Autenticazione & Associazione Giocatore
  currentUser: AuthUserProfile | null;
  associatedPlayer: Player | null;
  setAssociatedPlayerId: (playerId: string | null) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (email: string, pass: string, chosenPlayerId?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthModalVisible: boolean;
  setIsAuthModalVisible: (visible: boolean) => void;

  // Segnalazioni & Feedback AI
  isReportModalVisible: boolean;
  setIsReportModalVisible: (visible: boolean) => void;

  // Riunioni Segrete & Stagioni
  currentLeague: League | null;
  isAdmin: boolean;
  isLeagueModalVisible: boolean;
  setIsLeagueModalVisible: (visible: boolean) => void;
  switchLeague: (leagueId: string) => Promise<void>;
  createSecretMeeting: (
    name: string,
    maxPlayers: number,
    playerConfig: { name: string; avatar: string; color: string; catchphrase: string }
  ) => Promise<{ success: boolean; meeting?: League; error?: string }>;
  joinSecretMeeting: (
    code: string,
    playerConfig: { name: string; avatar: string; color: string; catchphrase: string }
  ) => Promise<{ success: boolean; meeting?: League; error?: string }>;
  leaveMeeting: () => Promise<void>;
  resetMeetingData: () => Promise<void>;
  createLeague: (name: string) => Promise<{ success: boolean; league?: League; error?: string }>;
  joinLeague: (code: string) => Promise<{ success: boolean; league?: League; error?: string }>;
  concludeCurrentSeason: (newSeasonName?: string) => Promise<{ success: boolean; podium?: SeasonPodium; error?: string }>;

  // Tag Personalizzati
  customTags: CustomTag[];
  addCustomTag: (emoji: string, text: string) => Promise<void>;
  removeCustomTag: (tagId: string) => Promise<void>;

  // Arbitraggio Live a Schermo Intero & Spettatori
  isLiveRefereeOpen: boolean;
  liveRefereeConfig: { player1: Player; player2: Player; targetPoints: 11 | 21 } | null;
  startLiveReferee: (p1: Player, p2: Player, target: 11 | 21, initialServer?: 1 | 2) => Promise<void>;
  joinLiveMatchAsSpectator: (p1: Player, p2: Player, target: 11 | 21) => void;
  broadcastLiveEvent: (event: LiveMatchSpecialEvent) => Promise<void>;
  updateLiveMatchState: (
    score1: number,
    score2: number,
    server: 1 | 2,
    servesRemaining: number,
    isGameOver?: boolean,
    stats?: MatchLiveStats,
    ballContestDone?: boolean,
    recentEvent?: LiveMatchSpecialEvent
  ) => Promise<void>;
  addLiveMatchReaction: (emoji: string) => Promise<void>;
  addLiveMatchComment: (text: string) => Promise<void>;
  claimRefereeRole: () => Promise<void>;
  closeLiveReferee: (options?: { forceCancelMatch?: boolean }) => Promise<void>;

  // Azioni Match & Giocatori
  recordMatch: (
    p1Id: string,
    p2Id: string,
    score1: number,
    score2: number,
    options?: {
      note?: string;
      isFriendly?: boolean;
      environmentalModifiers?: string[];
      player1Modifiers?: string[];
      player2Modifiers?: string[];
      stats?: MatchLiveStats;
      comments?: MatchComment[];
      reactions?: Record<string, string[]>;
    }
  ) => Promise<{ success: boolean; match?: Match; error?: string }>;
  undoLastMatch: () => Promise<boolean>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  addPlayerToLeague: (name: string, avatar: string, color: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  addReaction: (matchId: string, emoji: string, playerId: string) => Promise<void>;
  addComment: (matchId: string, playerId: string, text: string, gifUrl?: string) => Promise<void>;

  // LUL Coins & Riunione Bet
  placeLiveBet: (
    betOnPlayer: 1 | 2,
    amount: number,
    type: 'pre_match' | 'live_dynamic'
  ) => Promise<{ success: boolean; error?: string }>;
  claimBailout: () => Promise<{ success: boolean; error?: string }>;
  resetAllCoins: () => Promise<{ success: boolean; error?: string }>;

  // Bazar Shop
  purchaseShopItem: (itemId: string) => Promise<{ success: boolean; error?: string; mysteryOutcome?: any }>;
  equipPlayerItem: (itemType: 'title' | 'border', itemId: string | null) => Promise<{ success: boolean; error?: string }>;
}

const EloContext = createContext<EloContextType | undefined>(undefined);

export const EloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [celebrationMatch, setCelebrationMatch] = useState<Match | null>(null);
  const [thresholdEvent, setThresholdEvent] = useState<{ player: Player; threshold: number; gifUrl?: string } | null>(null);
  const [toastNotification, setToastNotification] = useState<ToastData | null>(null);
  const [activeCommentsMatch, setActiveCommentsMatch] = useState<Match | null>(null);
  const [isCloudSyncActive, setIsCloudSyncActive] = useState(isFirebaseConfigured());

  // Autenticazione
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [linkedPlayerId, setLinkedPlayerId] = useState<string | null>(null);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Riunioni Segrete & Stagioni
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [isLeagueModalVisible, setIsLeagueModalVisible] = useState(false);
  const [customTags, setCustomTags] = useState<CustomTag[]>(DEFAULT_CUSTOM_TAGS);

  // Modal Arbitraggio a Schermo Intero
  const [isLiveRefereeOpen, setIsLiveRefereeOpen] = useState(false);
  const [liveRefereeConfig, setLiveRefereeConfig] = useState<{ player1: Player; player2: Player; targetPoints: 11 | 21 } | null>(null);

  const prevMatchesLengthRef = useRef<number>(0);
  const activeLeagueIdRef = useRef<string>('');
  const unsubscribeLeagueRef = useRef<(() => void) | null>(null);
  const isSavingMatchRef = useRef<boolean>(false);

  // Giocatore associato all'utente loggato
  const associatedPlayer = useMemo(() => {
    if (!linkedPlayerId || !players) return null;
    return players.find((p) => p.id === linkedPlayerId) || null;
  }, [players, linkedPlayerId]);

  // Verifica se l'utente loggato è il Capo Riunione Segreta (Admin)
  const isAdmin = useMemo(() => {
    if (!currentUser || !currentLeague) return false;
    return currentLeague.adminUid === currentUser.uid;
  }, [currentUser, currentLeague]);

  // Sottoscrizione real-time alla Riunione Segreta
  const attachLeagueListener = (leagueId: string) => {
    if (unsubscribeLeagueRef.current) {
      unsubscribeLeagueRef.current();
      unsubscribeLeagueRef.current = null;
    }

    if (!leagueId || !isFirebaseConfigured()) return;

    activeLeagueIdRef.current = leagueId;
    saveActiveLeagueId(leagueId);

    unsubscribeLeagueRef.current = subscribeToLeagueData(leagueId, (cloudLeague) => {
      setCurrentLeague(cloudLeague);
      setCustomTags(cloudLeague.customTags || DEFAULT_CUSTOM_TAGS);

      // Notifica se è arrivato un nuovo match da un altro dispositivo
      if (prevMatchesLengthRef.current > 0 && cloudLeague.matches.length > prevMatchesLengthRef.current) {
        const newest = cloudLeague.matches[0];
        const p1 = cloudLeague.players.find((p) => p.id === newest.player1Id);
        const p2 = cloudLeague.players.find((p) => p.id === newest.player2Id);
        const winner = cloudLeague.players.find((p) => p.id === newest.winnerId);

        setToastNotification({
          title: '🔔 Nuovo Match Registrato!',
          message: `${winner?.name || 'Vincitore'} ha battuto ${newest.winnerId === p1?.id ? p2?.name : p1?.name} ${newest.score1}-${newest.score2}!`,
          matchId: newest.id,
        });
      }

      prevMatchesLengthRef.current = cloudLeague.matches.length;
      const rawPlayers = cloudLeague.players || [];
      const mappedPlayers = rawPlayers.map((p) => ({
        ...p,
        coins: p.coins !== undefined ? p.coins : STARTING_COINS,
      }));

      // Segnalazione rep_1788965886886_fhbmn: Controllo se l'utente ha superato una soglia mentre era offline
      if (linkedPlayerId) {
        const me = mappedPlayers.find((p) => p.id === linkedPlayerId);
        if (me) {
          const crossed = checkThresholdCrossed(me.lastCrossedThreshold || 1200, me.elo, me.lastCrossedThreshold);
          if (crossed) {
            setThresholdEvent({ player: me, threshold: crossed, gifUrl: me.celebrationGifUrl });
          }
        }
      }

      setPlayers(mappedPlayers);
      setMatches(cloudLeague.matches || []);

      setActiveCommentsMatch((prev) => {
        if (!prev) return null;
        return cloudLeague.matches.find((m) => m.id === prev.id) || null;
      });

      savePlayers(mappedPlayers);
      saveMatches(cloudLeague.matches || []);
      setLoading(false);
    });
  };

  const handleUserSessionEstablished = async (uid: string, email: string) => {
    const profile = await getUserProfile(uid);
    const userObj: AuthUserProfile = profile || {
      uid,
      email: email || '',
      joinedLeagueIds: [],
      activeLeagueId: '',
    };
    setCurrentUser(userObj);
    await saveSavedUserSession(userObj);

    const activeLgId = userObj.activeLeagueId || (await loadActiveLeagueId()) || '';
    const activePlayerId = userObj.associatedPlayerId || (await loadLinkedPlayerId()) || null;

    setLinkedPlayerId(activePlayerId);

    if (activeLgId) {
      attachLeagueListener(activeLgId);
    } else {
      setCurrentLeague(null);
      setPlayers([]);
      setMatches([]);
      setLoading(false);
    }
  };

  // Caricamento iniziale e sottoscrizione Real-time Firebase
  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;

    async function init() {
      try {
        // Pulisci i vecchi dati mock legacy in background
        wipeOldMockData().catch(() => {});

        // Controlla prima se abbiamo una sessione utente salvata in locale (fallback o persistente)
        const savedSession = await loadSavedUserSession();
        if (savedSession) {
          await handleUserSessionEstablished(savedSession.uid, savedSession.email);
        }

        // Ascolto stato auth Firebase (se attivo)
        unsubscribeAuth = subscribeToAuth(async (firebaseUser) => {
          if (firebaseUser) {
            await handleUserSessionEstablished(firebaseUser.uid, firebaseUser.email || '');
          } else {
            // Solo se non abbiamo già caricato una sessione salvata
            const currentSaved = await loadSavedUserSession();
            if (!currentSaved) {
              setCurrentUser(null);
              setCurrentLeague(null);
              setPlayers([]);
              setMatches([]);
              setLinkedPlayerId(null);
              if (unsubscribeLeagueRef.current) {
                unsubscribeLeagueRef.current();
                unsubscribeLeagueRef.current = null;
              }
              setLoading(false);
            }
          }
          setIsAuthLoading(false);
        });

        // Timeout di sicurezza per non bloccare mai la schermata di caricamento auth
        setTimeout(() => {
          setIsAuthLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Errore inizializzazione dati Elo:', err);
        setIsAuthLoading(false);
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsubscribeLeagueRef.current) unsubscribeLeagueRef.current();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (b.elo !== a.elo) {
        return b.elo - a.elo;
      }
      return b.wins - a.wins;
    });
  }, [players]);

  // Classifica ATP Race Stagionale (ordinata per punti Race cumulativi)
  const rankedPlayersByRace = useMemo(() => {
    return [...players].sort((a, b) => {
      const aRace = a.racePoints || 0;
      const bRace = b.racePoints || 0;
      if (bRace !== aRace) return bRace - aRace;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.elo - a.elo;
    });
  }, [players]);

  // ----------------------------------------------------
  // GESTIONE AUTENTICAZIONE
  // ----------------------------------------------------

  const setAssociatedPlayerId = async (playerId: string | null) => {
    // Blocco anti-impersonificazione e IDOR: ogni account è vincolato al proprio giocatore
    if (playerId && currentLeague && currentUser) {
      const assignedPlayerId = currentLeague.members?.[currentUser.uid]?.playerId;
      if (assignedPlayerId && assignedPlayerId !== playerId && !isAdmin) {
        console.warn('Tentativo non autorizzato di cambiare giocatore associato:', playerId);
        return;
      }

      // Verifica che il giocatore scelto non sia già di proprietà di un altro membro della Riunione
      const isClaimedByOther = Object.entries(currentLeague.members || {}).some(
        ([uid, m]) => uid !== currentUser.uid && m.playerId === playerId
      );
      if (isClaimedByOther && !isAdmin) {
        console.warn('IDOR bloccato: giocatore già associato a un altro utente:', playerId);
        return;
      }
    }
    setLinkedPlayerId(playerId);
    await saveLinkedPlayerId(playerId);
    if (currentUser) {
      const updated = { ...currentUser, associatedPlayerId: playerId || undefined };
      setCurrentUser(updated);
      await saveSavedUserSession(updated);
      await saveUserProfile(currentUser.uid, updated);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const res = await signInWithEmail(email, pass);
    if (res.user) {
      await handleUserSessionEstablished(res.user.uid, res.user.email || email);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const registerWithEmail = async (email: string, pass: string, chosenPlayerId?: string) => {
    const res = await signUpWithEmail(email, pass);
    if (res.user) {
      const cleanEmail = res.user.email || email.trim().toLowerCase();
      const newProfile: AuthUserProfile = {
        uid: res.user.uid,
        email: cleanEmail,
        joinedLeagueIds: [],
        activeLeagueId: '',
        associatedPlayerId: chosenPlayerId || undefined,
      };
      await saveUserProfile(res.user.uid, newProfile);
      await handleUserSessionEstablished(res.user.uid, cleanEmail);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    await signOutUser();
    await saveSavedUserSession(null);
    await clearAllStorage();
    if (unsubscribeLeagueRef.current) {
      unsubscribeLeagueRef.current();
      unsubscribeLeagueRef.current = null;
    }
    setCurrentUser(null);
    setCurrentLeague(null);
    setPlayers([]);
    setMatches([]);
    setLinkedPlayerId(null);
  };

  // ----------------------------------------------------
  // GESTIONE RIUNIONI SEGRETE & STAGIONI
  // ----------------------------------------------------

  const createSecretMeeting = async (
    name: string,
    maxPlayers: number,
    playerConfig: { name: string; avatar: string; color: string; catchphrase: string }
  ): Promise<{ success: boolean; meeting?: League; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Devi accedere per fondare una Riunione Segreta' };
    }

    const capoPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerConfig.name.trim(),
      avatar: playerConfig.avatar.trim() || '🏓',
      color: playerConfig.color || '#3B82F6',
      elo: DEFAULT_INITIAL_ELO,
      initialElo: DEFAULT_INITIAL_ELO,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      catchphrase: playerConfig.catchphrase?.trim() || '',
      tags: [],
      highestElo: DEFAULT_INITIAL_ELO,
      lowestElo: DEFAULT_INITIAL_ELO,
      lastCrossedThreshold: DEFAULT_INITIAL_ELO,
    };

    const res = await createSecretMeetingInFirebase(name, maxPlayers, currentUser, capoPlayer);
    if (res.success && res.meeting) {
      attachLeagueListener(res.meeting.id);
      setLinkedPlayerId(capoPlayer.id);
      await saveLinkedPlayerId(capoPlayer.id);
      const updatedUser: AuthUserProfile = {
        ...currentUser,
        activeLeagueId: res.meeting.id,
        associatedPlayerId: capoPlayer.id,
        joinedLeagueIds: [res.meeting.id],
      };
      setCurrentUser(updatedUser);
      await saveSavedUserSession(updatedUser);
      return { success: true, meeting: res.meeting };
    }
    return { success: false, error: res.error };
  };

  const joinSecretMeeting = async (
    code: string,
    playerConfig: { name: string; avatar: string; color: string; catchphrase: string }
  ): Promise<{ success: boolean; meeting?: League; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Devi accedere per unirti a una Riunione Segreta' };
    }

    const memberPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerConfig.name.trim(),
      avatar: playerConfig.avatar.trim() || '🏓',
      color: playerConfig.color || '#10B981',
      elo: DEFAULT_INITIAL_ELO,
      initialElo: DEFAULT_INITIAL_ELO,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      catchphrase: playerConfig.catchphrase?.trim() || '',
      tags: [],
      highestElo: DEFAULT_INITIAL_ELO,
      lowestElo: DEFAULT_INITIAL_ELO,
      lastCrossedThreshold: DEFAULT_INITIAL_ELO,
    };

    const res = await joinSecretMeetingInFirebase(code, currentUser, memberPlayer);
    if (res.success && res.meeting) {
      attachLeagueListener(res.meeting.id);
      setLinkedPlayerId(memberPlayer.id);
      await saveLinkedPlayerId(memberPlayer.id);
      const updatedUser: AuthUserProfile = {
        ...currentUser,
        activeLeagueId: res.meeting.id,
        associatedPlayerId: memberPlayer.id,
        joinedLeagueIds: [...(currentUser.joinedLeagueIds || []), res.meeting.id],
      };
      setCurrentUser(updatedUser);
      await saveSavedUserSession(updatedUser);
      return { success: true, meeting: res.meeting };
    }
    return { success: false, error: res.error };
  };

  const leaveMeeting = async () => {
    if (unsubscribeLeagueRef.current) {
      unsubscribeLeagueRef.current();
      unsubscribeLeagueRef.current = null;
    }
    setCurrentLeague(null);
    setPlayers([]);
    setMatches([]);
    setLinkedPlayerId(null);
    await saveActiveLeagueId('');
    await saveLinkedPlayerId(null);
    if (currentUser) {
      const updated: AuthUserProfile = {
        ...currentUser,
        activeLeagueId: '',
        associatedPlayerId: undefined,
      };
      await saveUserProfile(currentUser.uid, { activeLeagueId: '' });
      setCurrentUser(updated);
      await saveSavedUserSession(updated);
    }
  };

  const resetMeetingData = async () => {
    if (!currentLeague || !isAdmin) return;
    const resetPlayers = (currentLeague.players || []).map((p) => ({
      ...p,
      elo: DEFAULT_INITIAL_ELO,
      initialElo: DEFAULT_INITIAL_ELO,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      highestElo: DEFAULT_INITIAL_ELO,
      lowestElo: DEFAULT_INITIAL_ELO,
      lastCrossedThreshold: DEFAULT_INITIAL_ELO,
    }));

    const updatedLeague: League = {
      ...currentLeague,
      players: resetPlayers,
      matches: [],
    };

    setCurrentLeague(updatedLeague);
    setPlayers(resetPlayers);
    setMatches([]);
    await syncLeagueToCloud(updatedLeague);
  };

  const switchLeague = async (leagueId: string) => {
    attachLeagueListener(leagueId);
    if (currentUser) {
      await saveUserProfile(currentUser.uid, { activeLeagueId: leagueId });
      setCurrentUser({ ...currentUser, activeLeagueId: leagueId });
    }
  };

  const createLeague = async (name: string): Promise<{ success: boolean; league?: League; error?: string }> => {
    return createSecretMeeting(name, 4, {
      name: currentUser?.email?.split('@')[0] || 'Capo',
      avatar: '🏓',
      color: '#3B82F6',
      catchphrase: '',
    });
  };

  const joinLeague = async (code: string): Promise<{ success: boolean; league?: League; error?: string }> => {
    return joinSecretMeeting(code, {
      name: currentUser?.email?.split('@')[0] || 'Membro',
      avatar: '🏓',
      color: '#10B981',
      catchphrase: '',
    });
  };

  // Conclude la stagione corrente: calcola podio, assegna Albo d'Oro e resetta Elo
  const concludeCurrentSeason = async (newSeasonName?: string): Promise<{ success: boolean; podium?: SeasonPodium; error?: string }> => {
    if (!currentLeague) return { success: false, error: 'Nessuna lega attiva' };
    if (!isAdmin || currentLeague.adminUid !== currentUser?.uid) {
      return { success: false, error: 'Solo il Capo Riunione Segreta può concludere la stagione!' };
    }

    const sorted = [...players].sort((a, b) => b.elo - a.elo);
    const sortedRace = [...players].sort((a, b) => (b.racePoints || 0) - (a.racePoints || 0));
    if (sorted.length < 2) {
      return { success: false, error: 'Servono almeno 2 giocatori per completare una stagione' };
    }

    const podium: SeasonPodium = {
      firstPlayerId: sorted[0].id,
      secondPlayerId: sorted[1].id,
      thirdPlayerId: sorted[2]?.id || sorted[1].id,
      woodenSpoonPlayerId: sorted[sorted.length - 1].id,
      atpRaceWinnerPlayerId: sortedRace[0]?.id,
    };

    const currentSeason = currentLeague.seasons.find((s) => s.id === currentLeague.currentSeasonId) || currentLeague.seasons[0];
    const updatedCurrentSeason: Season = {
      ...currentSeason,
      status: 'archived',
      endDate: Date.now(),
      podium,
      matchesCount: matches.length,
    };

    const nextNumber = (currentLeague.seasons.length || 1) + 1;
    const newSeasonId = `season_${nextNumber}_${Date.now()}`;
    const nextSeason: Season = {
      id: newSeasonId,
      number: nextNumber,
      name: newSeasonName || `Stagione ${nextNumber}`,
      status: 'active',
      startDate: Date.now(),
      matchesCount: 0,
    };

    // Soft-reset Elo e Race ATP per la nuova stagione
    const resetPlayers = players.map((p) => ({
      ...p,
      elo: 1200,
      initialElo: 1200,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      highestElo: 1200,
      lowestElo: 1200,
      lastCrossedThreshold: 1200,
      racePoints: 0,
      lastMatchTimestamp: undefined,
    }));

    const otherSeasons = currentLeague.seasons.filter((s) => s.id !== currentSeason.id);
    const updatedLeague: League = {
      ...currentLeague,
      currentSeasonId: newSeasonId,
      seasons: [nextSeason, updatedCurrentSeason, ...otherSeasons],
      players: resetPlayers,
      matches: [], // Archivio azzerato per la nuova stagione
    };

    setPlayers(resetPlayers);
    setMatches([]);
    setCurrentLeague(updatedLeague);

    await savePlayers(resetPlayers);
    await saveMatches([]);
    await syncLeagueToCloud(updatedLeague);

    return { success: true, podium };
  };

  // ----------------------------------------------------
  // GESTIONE TAG PERSONALIZZATI
  // ----------------------------------------------------

  const addCustomTag = async (emoji: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTag: CustomTag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      emoji: emoji.trim() || '🏷️',
      text: trimmed,
    };

    const updatedTags = [...customTags, newTag];
    setCustomTags(updatedTags);

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        customTags: updatedTags,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  const removeCustomTag = async (tagId: string) => {
    const tagToRemove = customTags.find((t) => t.id === tagId);
    const fullTagStr = tagToRemove ? `${tagToRemove.emoji} ${tagToRemove.text}` : null;
    const updatedTags = customTags.filter((t) => t.id !== tagId);
    setCustomTags(updatedTags);

    if (currentLeague) {
      const updatedPlayers = (currentLeague.players || []).map((p) => {
        if (!fullTagStr || !p.tags) return p;
        return {
          ...p,
          tags: p.tags.filter((t) => t !== fullTagStr),
        };
      });
      const updatedLeague: League = {
        ...currentLeague,
        customTags: updatedTags,
        players: updatedPlayers,
      };
      setPlayers(updatedPlayers);
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  // ----------------------------------------------------
  // ARBITRAGGIO LIVE A SCHERMO INTERO ('Ndranghetisti vs Guardia)
  // ----------------------------------------------------

  const startLiveReferee = async (
    p1: Player,
    p2: Player,
    target: 11 | 21,
    initialServer: 1 | 2 = 1
  ) => {
    setLiveRefereeConfig({ player1: p1, player2: p2, targetPoints: target });
    setIsLiveRefereeOpen(true);

    if (currentLeague) {
      // Se esiste già una partita live attiva non terminata tra questi sfidanti
      // ed è già stata avviata da un'altra Guardia, preserva la partita e la Guardia originale!
      const existing = currentLeague.activeLiveMatch;
      if (
        existing &&
        !existing.isGameOver &&
        ((existing.player1Id === p1.id && existing.player2Id === p2.id) ||
         (existing.player1Id === p2.id && existing.player2Id === p1.id))
      ) {
        if (existing.refereeUid && currentUser?.uid && existing.refereeUid !== currentUser.uid) {
          // Entra come spettatore senza rubare il ruolo né azzerare i punti
          return;
        }
      }

      const activeMatch: ActiveLiveMatch = {
        id: `live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        leagueId: currentLeague.id,
        player1Id: p1.id,
        player2Id: p2.id,
        score1: 0,
        score2: 0,
        targetPoints: target,
        server: initialServer,
        servesRemaining: target === 11 ? 2 : 5,
        isGameOver: false,
        startedAt: Date.now(),
        refereeUid: currentUser?.uid || 'guardia',
        refereePlayerName: associatedPlayer?.name || currentUser?.email?.split('@')[0] || 'Guardia',
        comments: [],
        reactions: { '🔥': 0, '😱': 0, '💥': 0, '👏': 0, '💩': 0, '🏓': 0 },
        ballContestDone: false,
      };
      const updatedLeague = { ...currentLeague, activeLiveMatch: activeMatch };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  const joinLiveMatchAsSpectator = (p1: Player, p2: Player, target: 11 | 21) => {
    setLiveRefereeConfig({ player1: p1, player2: p2, targetPoints: target });
    setIsLiveRefereeOpen(true);
  };

  const updateLiveMatchState = async (
    score1: number,
    score2: number,
    server: 1 | 2,
    servesRemaining: number,
    isGameOver: boolean = false,
    stats?: MatchLiveStats,
    ballContestDone?: boolean,
    recentEvent?: LiveMatchSpecialEvent
  ) => {
    if (!currentLeague?.activeLiveMatch) return;
    const updatedActive: ActiveLiveMatch = {
      ...currentLeague.activeLiveMatch,
      score1,
      score2,
      server,
      servesRemaining,
      isGameOver,
      stats,
      ballContestDone:
        ballContestDone !== undefined
          ? ballContestDone
          : currentLeague.activeLiveMatch.ballContestDone,
      recentEvent: recentEvent || currentLeague.activeLiveMatch.recentEvent,
    };
    const updatedLeague = { ...currentLeague, activeLiveMatch: updatedActive };
    setCurrentLeague(updatedLeague);
    await syncLeagueToCloud(updatedLeague);
  };

  const broadcastLiveEvent = async (event: LiveMatchSpecialEvent) => {
    if (!currentLeague?.activeLiveMatch) return;
    const updatedActive: ActiveLiveMatch = {
      ...currentLeague.activeLiveMatch,
      recentEvent: event,
    };
    const updatedLeague = { ...currentLeague, activeLiveMatch: updatedActive };
    setCurrentLeague(updatedLeague);
    await syncLeagueToCloud(updatedLeague);
  };

  const addLiveMatchReaction = async (emoji: string) => {
    if (!currentLeague?.activeLiveMatch) return;
    const currentReactions = { ...(currentLeague.activeLiveMatch.reactions || {}) };
    currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
    const updatedActive: ActiveLiveMatch = {
      ...currentLeague.activeLiveMatch,
      reactions: currentReactions,
      recentReaction: {
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        senderName: associatedPlayer?.name || currentUser?.email?.split('@')[0] || "'Ndranghetista",
        senderUid: currentUser?.uid,
        timestamp: Date.now(),
      },
    };
    const updatedLeague = { ...currentLeague, activeLiveMatch: updatedActive };
    setCurrentLeague(updatedLeague);
    await syncLeagueToCloud(updatedLeague);
  };

  const addLiveMatchComment = async (text: string) => {
    if (!currentLeague?.activeLiveMatch || !text.trim()) return;
    const newComment: MatchComment = {
      id: `lcomm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchId: currentLeague.activeLiveMatch.id,
      playerId: associatedPlayer?.id || currentUser?.uid || 'ndranghetista',
      authorName: associatedPlayer?.name || currentUser?.email || "'Ndranghetista",
      authorAvatar: associatedPlayer?.avatar || '🕶️',
      text: text.trim(),
      timestamp: Date.now(),
    };
    const updatedActive: ActiveLiveMatch = {
      ...currentLeague.activeLiveMatch,
      comments: [...(currentLeague.activeLiveMatch.comments || []), newComment],
    };
    const updatedLeague = { ...currentLeague, activeLiveMatch: updatedActive };
    setCurrentLeague(updatedLeague);
    await syncLeagueToCloud(updatedLeague);
  };

  const claimRefereeRole = async () => {
    if (!currentLeague?.activeLiveMatch) return;
    const refereePlayerName = associatedPlayer?.name || currentUser?.email?.split('@')[0] || 'Guardia';
    const updatedActive: ActiveLiveMatch = {
      ...currentLeague.activeLiveMatch,
      refereeUid: currentUser?.uid || 'guardia',
      refereePlayerName,
    };
    const updatedLeague = { ...currentLeague, activeLiveMatch: updatedActive };
    setCurrentLeague(updatedLeague);
    await syncLeagueToCloud(updatedLeague);
  };

  const closeLiveReferee = async (options?: { forceCancelMatch?: boolean }) => {
    setIsLiveRefereeOpen(false);
    setLiveRefereeConfig(null);
    if (options?.forceCancelMatch && currentLeague?.activeLiveMatch) {
      const live = currentLeague.activeLiveMatch;
      let updatedPlayers = [...players];

      // Rimborso automatico scommesse su annullamento match
      if (live.bets && Object.keys(live.bets).length > 0) {
        const refunds: Record<string, number> = {};
        Object.values(live.bets).forEach((b) => {
          if (b.status === 'pending') {
            refunds[b.bettorId] = (refunds[b.bettorId] || 0) + b.amount;
          }
        });

        if (Object.keys(refunds).length > 0) {
          updatedPlayers = updatedPlayers.map((p) => {
            if (refunds[p.id]) {
              const currentCoins = p.coins !== undefined ? p.coins : STARTING_COINS;
              return {
                ...p,
                coins: currentCoins + refunds[p.id],
              };
            }
            return p;
          });
          setPlayers(updatedPlayers);
          await savePlayers(updatedPlayers);
          soundEffects.playCashoutSound();
          setToastNotification({
            title: '🪙 Scommesse Rimborsate!',
            message: 'Partita annullata: tutte le puntate sono state restituite ai rispettivi giocatori.',
          });
        }
      }

      const updatedLeague = { ...currentLeague, players: updatedPlayers, activeLiveMatch: undefined };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  const placeLiveBet = async (
    betOnPlayer: 1 | 2,
    amount: number,
    type: 'pre_match' | 'live_dynamic'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!associatedPlayer) {
      return { success: false, error: 'Devi collegare il tuo profilo giocatore per scommettere!' };
    }
    if (!currentLeague?.activeLiveMatch) {
      return { success: false, error: 'Nessuna partita live attiva al momento!' };
    }
    const live = currentLeague.activeLiveMatch;
    if (live.isGameOver) {
      return { success: false, error: 'La partita è già conclusa!' };
    }
    if (type === 'pre_match' && !canPlacePreMatchBet(live.score1, live.score2)) {
      return { success: false, error: 'Le scommesse Pre-Match sono chiuse (oltre il 5° punto). Usa la scommessa Live Dinamica!' };
    }
    // Anti-biscotto: un giocatore in campo può scommettere solo sulla propria vittoria
    if (live.player1Id === associatedPlayer.id && betOnPlayer === 2) {
      return { success: false, error: 'Non puoi scommettere contro te stesso!' };
    }
    if (live.player2Id === associatedPlayer.id && betOnPlayer === 1) {
      return { success: false, error: 'Non puoi scommettere contro te stesso!' };
    }

    const currentCoins = associatedPlayer.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;

    // Gestione regola bilaterale / No-Hedging (azzeramento o cancellazione scommessa sul giocatore opposto)
    const bilateral = handleBilateralBetRule(live.bets, associatedPlayer.id, betOnPlayer, amount);
    let workingCoins = currentCoins + bilateral.refundedCoins;

    if (bilateral.positionZeroed) {
      // Posizione azzerata: la scommessa opposta è stata annullata e rimborsata, azzerando l'esposizione
      const updatedPlayers = players.map((p) => {
        if (p.id === associatedPlayer.id) {
          return {
            ...p,
            coins: workingCoins,
          };
        }
        return p;
      });

      const updatedLive: ActiveLiveMatch = {
        ...live,
        bets: bilateral.updatedBets,
      };

      setPlayers(updatedPlayers);
      await savePlayers(updatedPlayers);

      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
        activeLiveMatch: updatedLive,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);

      soundEffects.playCashoutSound();
      setToastNotification({
        title: '⚖️ Posizione Azzerata',
        message: 'Scommessa opposta annullata e monete rimborsate come da regolamento (no-hedging)!',
      });
      return { success: true };
    }

    if (amount <= 0 || amount > workingCoins) {
      return { success: false, error: 'Saldo LUL Coins insufficiente!' };
    }

    const p1 = players.find((p) => p.id === live.player1Id);
    const p2 = players.find((p) => p.id === live.player2Id);
    const targetPoints = (live.targetPoints as 11 | 21) || 11;
    const oddsCalc =
      type === 'pre_match'
        ? calculatePreMatchOdds(p1?.elo || 1200, p2?.elo || 1200)
        : calculateLiveDynamicOdds(p1?.elo || 1200, p2?.elo || 1200, live.score1, live.score2, targetPoints);

    const lockedOdds = betOnPlayer === 1 ? oddsCalc.odds1 : oddsCalc.odds2;
    const potentialPayout = Math.round(amount * lockedOdds);

    const newBet: LiveBet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      bettorId: associatedPlayer.id,
      bettorName: associatedPlayer.name,
      bettorAvatar: associatedPlayer.avatar,
      betOnPlayer,
      amount,
      odds: lockedOdds,
      scoreAtBet: type === 'pre_match' ? 'Pre-match' : `${live.score1} - ${live.score2}`,
      potentialPayout,
      status: 'pending',
      timestamp: Date.now(),
    };

    // Scala i gettoni dal giocatore
    const updatedPlayers = players.map((p) => {
      if (p.id === associatedPlayer.id) {
        return {
          ...p,
          coins: workingCoins - amount,
        };
      }
      return p;
    });

    const updatedBets = { ...bilateral.updatedBets, [newBet.id]: newBet };
    const updatedLive: ActiveLiveMatch = {
      ...live,
      bets: updatedBets,
    };

    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);

    const updatedLeague: League = {
      ...currentLeague,
      players: updatedPlayers,
      activeLiveMatch: updatedLive,
    };
    setCurrentLeague(updatedLeague);
    await syncLeagueToCloud(updatedLeague);

    soundEffects.playCoinSound();
    return { success: true };
  };

  const claimBailout = async (): Promise<{ success: boolean; error?: string }> => {
    if (!associatedPlayer) {
      return { success: false, error: 'Devi collegare il tuo profilo giocatore!' };
    }
    const currentCoins = associatedPlayer.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;
    if (currentCoins > 0) {
      return { success: false, error: 'Hai ancora LUL Coins nel tuo saldo!' };
    }
    if (associatedPlayer.lastBailoutAt) {
      const diff = Date.now() - associatedPlayer.lastBailoutAt;
      if (diff < BAILOUT_COOLDOWN_MS) {
        const remainingHours = Math.ceil((BAILOUT_COOLDOWN_MS - diff) / (1000 * 60 * 60));
        return { success: false, error: `Sussidio già riscosso di recente. Riprova tra circa ${remainingHours} ore!` };
      }
    }

    const updatedPlayers = players.map((p) => {
      if (p.id === associatedPlayer.id) {
        return {
          ...p,
          coins: BAILOUT_AMOUNT,
          lastBailoutAt: Date.now(),
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }

    soundEffects.playCashoutSound();
    return { success: true };
  };

  const resetAllCoins = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Solo il Capo Riunione Segreta può reimpostare i soldi!' };
    }
    const updatedPlayers = players.map((p) => ({
      ...p,
      coins: STARTING_COINS,
      betsWon: 0,
      betsLost: 0,
      coinsWonOnBets: 0,
      lastBailoutAt: undefined,
    }));
    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);
    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
    soundEffects.playCashoutSound();
    setToastNotification({
      title: '🪙 Monete Ripristinate!',
      message: 'Il saldo di tutti i giocatori è tornato a 200 LUL Coins.',
    });
    return { success: true };
  };

  const purchaseShopItem = async (
    itemId: string
  ): Promise<{ success: boolean; error?: string; mysteryOutcome?: any }> => {
    if (!associatedPlayer) {
      return { success: false, error: 'Devi collegare il tuo profilo giocatore per acquistare al Bazar!' };
    }
    const item = SHOP_ITEMS.find((it) => it.id === itemId);
    if (!item) {
      return { success: false, error: 'Oggetto non trovato nel catalogo del Bazar!' };
    }
    const currentCoins = associatedPlayer.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;
    if (currentCoins < item.price) {
      return { success: false, error: `LUL Coins insufficienti! Ti mancano ${item.price - currentCoins} 🪙` };
    }

    let mysteryOutcome: any = undefined;
    let coinsAfter = currentCoins - item.price;
    let newInventory = [...(associatedPlayer.inventory || [])];
    let newEquippedTitle = associatedPlayer.equippedTitle;
    let newEquippedBorder = associatedPlayer.equippedBorder;
    let newHasInsurance = associatedPlayer.hasBetInsurance;
    let newTags = [...(associatedPlayer.tags || [])];

    if (item.category === 'mystery') {
      mysteryOutcome = openMysteryBox();
      coinsAfter += mysteryOutcome.coins;
      if (mysteryOutcome.badge && !newTags.includes(mysteryOutcome.badge)) {
        newTags.push(mysteryOutcome.badge);
      }
    } else if (item.category === 'perk' && item.id === 'perk_insurance') {
      newHasInsurance = true;
    } else {
      if (!newInventory.includes(item.id)) {
        newInventory.push(item.id);
      }
      if (item.category === 'title' && !newEquippedTitle) {
        newEquippedTitle = item.name;
      }
      if (item.category === 'border' && !newEquippedBorder) {
        newEquippedBorder = item.id;
      }
    }

    const updatedPlayers = players.map((p) => {
      if (p.id === associatedPlayer.id) {
        return {
          ...p,
          coins: coinsAfter,
          inventory: newInventory,
          equippedTitle: newEquippedTitle,
          equippedBorder: newEquippedBorder,
          hasBetInsurance: newHasInsurance,
          tags: newTags,
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);
    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }

    if (mysteryOutcome?.isJackpot) {
      soundEffects.playCashoutSound();
    } else {
      soundEffects.playCoinSound();
    }

    return { success: true, mysteryOutcome };
  };

  const equipPlayerItem = async (
    itemType: 'title' | 'border',
    itemId: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    if (!associatedPlayer) {
      return { success: false, error: 'Devi collegare il tuo profilo giocatore!' };
    }

    const updatedPlayers = players.map((p) => {
      if (p.id === associatedPlayer.id) {
        if (itemType === 'title') {
          const item = SHOP_ITEMS.find((it) => it.id === itemId);
          return {
            ...p,
            equippedTitle: item ? item.name : undefined,
          };
        } else {
          return {
            ...p,
            equippedBorder: itemId || undefined,
          };
        }
      }
      return p;
    });

    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);
    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
    soundEffects.playButtonTap();
    return { success: true };
  };

  // ----------------------------------------------------
  // REGISTRAZIONE MATCH & ELO
  // ----------------------------------------------------

  const recordMatch = async (
    p1Id: string,
    p2Id: string,
    score1: number,
    score2: number,
    options: {
      note?: string;
      isFriendly?: boolean;
      environmentalModifiers?: string[];
      player1Modifiers?: string[];
      player2Modifiers?: string[];
      stats?: MatchLiveStats;
      comments?: MatchComment[];
      reactions?: Record<string, string[]>;
    } = {}
  ): Promise<{ success: boolean; match?: Match; error?: string }> => {
    // Controllo sicurezza IDOR: utente deve appartenere alla Riunione
    if (currentLeague && currentUser) {
      const isMember = validateLeagueMembership(
        currentUser.uid,
        currentLeague.members,
        currentLeague.adminUid
      );
      if (!isMember) {
        return { success: false, error: 'Accesso negato: non appartieni a questa Riunione Segreta!' };
      }
    }

    if (p1Id === p2Id) {
      return { success: false, error: 'Un giocatore non può giocare contro se stesso!' };
    }
    if (score1 === score2) {
      return { success: false, error: 'A ping pong non esiste il pareggio!' };
    }

    if (isSavingMatchRef.current) {
      return { success: false, error: 'Salvataggio della partita già in corso, attendi...' };
    }

    // Deduplica anti-doppia registrazione accidentale o multi-client (< 45s, stessi giocatori e punteggio)
    const isDuplicate = matches.some(
      (m) =>
        ((m.player1Id === p1Id && m.player2Id === p2Id && m.score1 === score1 && m.score2 === score2) ||
         (m.player1Id === p2Id && m.player2Id === p1Id && m.score1 === score2 && m.score2 === score1)) &&
        Date.now() - m.timestamp < 45000
    );
    if (isDuplicate) {
      return { success: false, error: 'Questa partita risulta già registrata pochi istanti fa!' };
    }

    isSavingMatchRef.current = true;
    try {
      const p1 = players.find((p) => p.id === p1Id);
      const p2 = players.find((p) => p.id === p2Id);

      if (!p1 || !p2) {
        return { success: false, error: 'Giocatori non trovati!' };
      }

    const isP1Winner = score1 > score2;
    const winner = isP1Winner ? p1 : p2;
    const loser = isP1Winner ? p2 : p1;

    const winnerMods = isP1Winner ? options.player1Modifiers : options.player2Modifiers;
    const loserMods = isP1Winner ? options.player2Modifiers : options.player1Modifiers;

    // Bonus Ritmo Partita (Tennis): chi gioca spesso ha un boost di reattività sulle vittorie
    const activity = calculateActivityBonus(matches, winner.id);

    const eloCalc = calculateEloChange(winner.elo, loser.elo, undefined, {
      isFriendly: options.isFriendly,
      environmentalModifiers: options.environmentalModifiers,
      winnerModifiers: winnerMods,
      loserModifiers: loserMods,
      winnerActivityMultiplier: activity.multiplier,
    });

    // Punti Race ATP della stagione
    const raceDeltas = calculateRacePointsForMatch(score1, score2, options.isFriendly);

    // Se ci sono commenti o reazioni dalla partita live attiva, uniscili
    const finalComments = options.comments || currentLeague?.activeLiveMatch?.comments || [];

    // Risoluzione scommesse live Riunione Bet
    const liveBets = currentLeague?.activeLiveMatch?.bets;
    const winnerSide: 1 | 2 = isP1Winner ? 1 : 2;
    const insurancesMap: Record<string, boolean> = {};
    players.forEach((p) => {
      if (p.hasBetInsurance) {
        insurancesMap[p.id] = true;
      }
    });
    const betResolution = resolveMatchBets(liveBets, winnerSide, insurancesMap);

    const newMatch: Match = {
      id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      player1Id: p1Id,
      player2Id: p2Id,
      score1,
      score2,
      winnerId: winner.id,
      loserId: loser.id,
      player1EloBefore: p1.elo,
      player2EloBefore: p2.elo,
      player1EloAfter: isP1Winner ? eloCalc.winnerEloAfter : eloCalc.loserEloAfter,
      player2EloAfter: isP1Winner ? eloCalc.loserEloAfter : eloCalc.winnerEloAfter,
      eloDelta: eloCalc.delta,
      winnerEloDelta: eloCalc.winnerDelta,
      loserEloDelta: eloCalc.loserDelta,
      note: options.note || undefined,
      isFriendly: options.isFriendly,
      environmentalModifiers: options.environmentalModifiers || [],
      player1Modifiers: options.player1Modifiers || [],
      player2Modifiers: options.player2Modifiers || [],
      reactions: options.reactions || {},
      comments: finalComments,
      stats: options.stats,
      p1RacePointsDelta: raceDeltas.p1RacePoints,
      p2RacePointsDelta: raceDeltas.p2RacePoints,
      bets: Object.keys(betResolution.updatedBets).length > 0 ? betResolution.updatedBets : undefined,
    };

    let crossedThreshold: number | null = null;
    let thresholdPlayer: Player | null = null;

    // Calcolo nuovi stati giocatori con Elo, Punti Race ATP, LUL Coins e Risoluzione Scommesse
    const updatedPlayers = players.map((p) => {
      let playerCoins = p.coins !== undefined ? p.coins : STARTING_COINS;
      const payout = betResolution.payouts[p.id] || 0;
      playerCoins += payout;

      let wonBets = 0;
      let lostBets = 0;
      let netBetProfit = 0;
      if (liveBets) {
        Object.values(liveBets).forEach((b) => {
          if (b.bettorId === p.id) {
            if (b.betOnPlayer === winnerSide) {
              wonBets += 1;
              netBetProfit += Math.round(b.amount * b.odds) - b.amount;
            } else {
              lostBets += 1;
              netBetProfit -= b.amount;
            }
          }
        });
      }

      if (p.id === winner.id) {
        playerCoins += MATCH_WIN_COINS;
        const newElo = eloCalc.winnerEloAfter;
        const newStreak = p.currentStreak > 0 ? p.currentStreak + 1 : 1;
        const addedRace = isP1Winner ? raceDeltas.p1RacePoints : raceDeltas.p2RacePoints;

        const threshold = checkThresholdCrossed(p.elo, newElo, p.lastCrossedThreshold);
        if (threshold) {
          crossedThreshold = threshold;
        }

        const updated: Player = {
          ...p,
          elo: newElo,
          wins: p.wins + 1,
          currentStreak: newStreak,
          highestElo: Math.max(p.highestElo, newElo),
          lowestElo: Math.min(p.lowestElo, newElo),
          lastCrossedThreshold: threshold ? threshold : p.lastCrossedThreshold,
          racePoints: (p.racePoints || 0) + addedRace,
          lastMatchTimestamp: Date.now(),
          coins: playerCoins,
          betsWon: (p.betsWon || 0) + wonBets,
          betsLost: (p.betsLost || 0) + lostBets,
          coinsWonOnBets: (p.coinsWonOnBets || 0) + netBetProfit,
        };

        if (threshold) {
          thresholdPlayer = updated;
        }

        return updated;
      }
      if (p.id === loser.id) {
        playerCoins += MATCH_LOSS_COINS;
        const newElo = eloCalc.loserEloAfter;
        const newStreak = p.currentStreak < 0 ? p.currentStreak - 1 : -1;
        const addedRace = isP1Winner ? raceDeltas.p2RacePoints : raceDeltas.p1RacePoints;

        return {
          ...p,
          elo: newElo,
          losses: p.losses + 1,
          currentStreak: newStreak,
          highestElo: Math.max(p.highestElo, newElo),
          lowestElo: Math.min(p.lowestElo, newElo),
          racePoints: (p.racePoints || 0) + addedRace,
          lastMatchTimestamp: Date.now(),
          coins: playerCoins,
          betsWon: (p.betsWon || 0) + wonBets,
          betsLost: (p.betsLost || 0) + lostBets,
          coinsWonOnBets: (p.coinsWonOnBets || 0) + netBetProfit,
        };
      }

      // Giocatori non in campo ma che hanno scommesso
      if (wonBets > 0 || lostBets > 0) {
        return {
          ...p,
          coins: playerCoins,
          betsWon: (p.betsWon || 0) + wonBets,
          betsLost: (p.betsLost || 0) + lostBets,
          coinsWonOnBets: (p.coinsWonOnBets || 0) + netBetProfit,
        };
      }

      return {
        ...p,
        coins: playerCoins,
      };
    });

    const updatedMatches = [newMatch, ...matches];
    prevMatchesLengthRef.current = updatedMatches.length;

    setPlayers(updatedPlayers);
    setMatches(updatedMatches);

    // Salva locale
    await savePlayers(updatedPlayers);
    await saveMatches(updatedMatches);

    // Sync cloud con sanitizzazione (e pulizia eventuale live match attivo)
    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
        matches: updatedMatches,
        activeLiveMatch: undefined, // Partita conclusa
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }

    // Trigger celebrazioni se vittoria epica o soglia superata
    if (!options.isFriendly && eloCalc.delta >= 20) {
      setCelebrationMatch(newMatch);
    }
    if (crossedThreshold && thresholdPlayer) {
      const p = thresholdPlayer as Player;
      setThresholdEvent({
        player: p,
        threshold: crossedThreshold,
        gifUrl: p.celebrationGifUrl || undefined,
      });
    }

    // Se l'utente collegato ha vinto una scommessa, trigger fanfara Cashout!
    if (associatedPlayer && (betResolution.payouts[associatedPlayer.id] || 0) > 0) {
      soundEffects.playCashoutSound();
      setToastNotification({
        title: '💰 CASHOUT VITTORIOSO!',
        message: `Hai vinto +${betResolution.payouts[associatedPlayer.id]} LUL Coins dalla tua scommessa!`,
        matchId: newMatch.id,
      });
    }

      return { success: true, match: newMatch };
    } finally {
      isSavingMatchRef.current = false;
    }
  };

  const undoLastMatch = async (): Promise<boolean> => {
    if (matches.length === 0) return false;

    const lastMatch = matches[0];
    const remainingMatches = matches.slice(1);

    const updatedPlayers = players.map((p) => {
      let coinsDelta = 0;
      let betsWonDelta = 0;
      let betsLostDelta = 0;
      let coinsWonOnBetsDelta = 0;

      // Revert winner/loser match coins
      if (p.id === lastMatch.winnerId) {
        coinsDelta -= MATCH_WIN_COINS;
      } else if (p.id === lastMatch.loserId) {
        coinsDelta -= MATCH_LOSS_COINS;
      }

      // Revert bets if any
      if (lastMatch.bets) {
        Object.values(lastMatch.bets).forEach((b) => {
          if (b.bettorId === p.id) {
            if (b.status === 'won') {
              betsWonDelta -= 1;
              const payout = b.potentialPayout || Math.round(b.amount * b.odds);
              coinsDelta -= payout;
              coinsWonOnBetsDelta -= (payout - b.amount);
            } else if (b.status === 'lost') {
              betsLostDelta -= 1;
              // Rimborsa l'importo puntato
              coinsDelta += b.amount;
              coinsWonOnBetsDelta += b.amount;
            }
          }
        });
      }

      const currentCoins = p.coins !== undefined ? p.coins : STARTING_COINS;
      const finalCoins = Math.max(0, currentCoins + coinsDelta);
      const finalBetsWon = Math.max(0, (p.betsWon || 0) + betsWonDelta);
      const finalBetsLost = Math.max(0, (p.betsLost || 0) + betsLostDelta);
      const finalCoinsWon = (p.coinsWonOnBets || 0) + coinsWonOnBetsDelta;

      if (p.id === lastMatch.winnerId) {
        const prevElo = lastMatch.player1Id === p.id ? lastMatch.player1EloBefore : lastMatch.player2EloBefore;
        const subRace = (lastMatch.player1Id === p.id ? lastMatch.p1RacePointsDelta : lastMatch.p2RacePointsDelta) || 0;
        return {
          ...p,
          elo: prevElo,
          wins: Math.max(0, p.wins - 1),
          currentStreak: recalculateStreak(p.id, remainingMatches),
          racePoints: Math.max(0, (p.racePoints || 0) - subRace),
          coins: finalCoins,
          betsWon: finalBetsWon,
          betsLost: finalBetsLost,
          coinsWonOnBets: finalCoinsWon,
        };
      }
      if (p.id === lastMatch.loserId) {
        const prevElo = lastMatch.player1Id === p.id ? lastMatch.player1EloBefore : lastMatch.player2EloBefore;
        const subRace = (lastMatch.player1Id === p.id ? lastMatch.p1RacePointsDelta : lastMatch.p2RacePointsDelta) || 0;
        return {
          ...p,
          elo: prevElo,
          losses: Math.max(0, p.losses - 1),
          currentStreak: recalculateStreak(p.id, remainingMatches),
          racePoints: Math.max(0, (p.racePoints || 0) - subRace),
          coins: finalCoins,
          betsWon: finalBetsWon,
          betsLost: finalBetsLost,
          coinsWonOnBets: finalCoinsWon,
        };
      }

      if (coinsDelta !== 0 || betsWonDelta !== 0 || betsLostDelta !== 0) {
        return {
          ...p,
          coins: finalCoins,
          betsWon: finalBetsWon,
          betsLost: finalBetsLost,
          coinsWonOnBets: finalCoinsWon,
        };
      }

      return p;
    });

    prevMatchesLengthRef.current = remainingMatches.length;
    setPlayers(updatedPlayers);
    setMatches(remainingMatches);

    await savePlayers(updatedPlayers);
    await saveMatches(remainingMatches);

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
        matches: remainingMatches,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }

    return true;
  };

  const updatePlayer = async (id: string, updates: Partial<Player>): Promise<void> => {
    // Controllo sicurezza IDOR: solo il Capo (isAdmin) o il titolare del profilo possono salvare modifiche
    const isOwner = associatedPlayer?.id === id;
    if (!isAdmin && !isOwner) {
      console.warn('IDOR bloccato: modifica non autorizzata per il giocatore:', id);
      return;
    }

    // Sanitizzazione whitelist: impedisce la manipolazione di Elo, vittorie, sconfitte o ID
    const safeUpdates = sanitizePlayerUpdates(updates);

    const updatedPlayers = players.map((p) => (p.id === id ? { ...p, ...safeUpdates } : p));
    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  const addPlayerToLeague = async (name: string, avatar: string, color: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      avatar: avatar || '🏓',
      color: color || '#3B82F6',
      elo: 1200,
      initialElo: 1200,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      catchphrase: 'Pronto alla sfida!',
      tags: [],
      highestElo: 1200,
      lowestElo: 1200,
      lastCrossedThreshold: 1200,
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: updatedPlayers,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  const resetAllData = async (): Promise<void> => {
    await clearAllStorage();
    setPlayers(DEFAULT_PLAYERS);
    setMatches([]);
    prevMatchesLengthRef.current = 0;

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        players: DEFAULT_PLAYERS,
        matches: [],
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  // Aggiunge o rimuove una reazione emoji al match
  const addReaction = async (matchId: string, emoji: string, playerId: string): Promise<void> => {
    const updatedMatches = matches.map((m) => {
      if (m.id !== matchId) return m;

      const currentReactions = { ...(m.reactions || {}) };
      const userList = [...(currentReactions[emoji] || [])];

      if (userList.includes(playerId)) {
        currentReactions[emoji] = userList.filter((id) => id !== playerId);
      } else {
        currentReactions[emoji] = [...userList, playerId];
      }

      return {
        ...m,
        reactions: currentReactions,
      };
    });

    setMatches(updatedMatches);
    setActiveCommentsMatch((prev) => (prev?.id === matchId ? updatedMatches.find((m) => m.id === matchId) || null : prev));

    await saveMatches(updatedMatches);

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        matches: updatedMatches,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  // Aggiunge un commento al match (con supporto testo e GIF)
  const addComment = async (
    matchId: string,
    playerId: string,
    text: string,
    gifUrl?: string
  ): Promise<void> => {
    const newComment: MatchComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchId,
      playerId,
      text: text || '',
      gifUrl: gifUrl || undefined,
      timestamp: Date.now(),
    };

    const updatedMatches = matches.map((m) => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        comments: [...(m.comments || []), newComment],
      };
    });

    setMatches(updatedMatches);
    setActiveCommentsMatch((prev) => (prev?.id === matchId ? updatedMatches.find((m) => m.id === matchId) || null : prev));

    await saveMatches(updatedMatches);

    if (currentLeague) {
      const updatedLeague: League = {
        ...currentLeague,
        matches: updatedMatches,
      };
      setCurrentLeague(updatedLeague);
      await syncLeagueToCloud(updatedLeague);
    }
  };

  const clearCelebration = () => setCelebrationMatch(null);
  const clearThresholdEvent = () => setThresholdEvent(null);
  const clearToastNotification = () => setToastNotification(null);

  return (
    <EloContext.Provider
      value={{
        players,
        rankedPlayers,
        rankedPlayersByRace,
        matches,
        loading,
        isAuthLoading,
        isCloudSyncActive,
        celebrationMatch,
        clearCelebration,
        thresholdEvent,
        clearThresholdEvent,
        toastNotification,
        clearToastNotification,
        activeCommentsMatch,
        setActiveCommentsMatch,

        currentUser,
        associatedPlayer,
        setAssociatedPlayerId,
        loginWithEmail,
        registerWithEmail,
        logout,
        isAuthModalVisible,
        setIsAuthModalVisible,
        isReportModalVisible,
        setIsReportModalVisible,

        currentLeague,
        isAdmin,
        isLeagueModalVisible,
        setIsLeagueModalVisible,
        switchLeague,
        createSecretMeeting,
        joinSecretMeeting,
        leaveMeeting,
        resetMeetingData,
        createLeague,
        joinLeague,
        concludeCurrentSeason,

        customTags,
        addCustomTag,
        removeCustomTag,

        isLiveRefereeOpen,
        liveRefereeConfig,
        startLiveReferee,
        joinLiveMatchAsSpectator,
        broadcastLiveEvent,
        updateLiveMatchState,
        addLiveMatchReaction,
        addLiveMatchComment,
        claimRefereeRole,
        closeLiveReferee,

        recordMatch,
        undoLastMatch,
        updatePlayer,
        addPlayerToLeague,
        resetAllData,
        addReaction,
        addComment,

        // LUL Coins & Riunione Bet
        placeLiveBet,
        claimBailout,
        resetAllCoins,

        // Bazar Shop
        purchaseShopItem,
        equipPlayerItem,
      }}
    >
      {children}
    </EloContext.Provider>
  );
};

export function useElo() {
  const context = useContext(EloContext);
  if (!context) {
    throw new Error('useElo deve essere usato all\'interno di un EloProvider');
  }
  return context;
}
