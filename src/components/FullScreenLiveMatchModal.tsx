import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { calculateAllLiveMarkets, calculateLiveDynamicOdds, calculatePreMatchOdds, canPlacePreMatchBet } from '../core/betting';
import { getBorderCardStyle } from '../core/shop';
import { STARTING_COINS } from '../core/constants';
import { BetMarketType, LiveBet, LiveMatchSpecialEvent, MatchComment, MatchLiveStats, Player } from '../core/types';
import { Colors } from '../theme/colors';
import { soundEffects } from '../utils/soundEffects';

interface FullScreenLiveMatchModalProps {
  visible: boolean;
  player1: Player | null;
  player2: Player | null;
  initialTargetPoints?: 11 | 21;
  onClose: (options?: { forceCancelMatch?: boolean }) => void;
  onFinishMatch: (
    score1: number,
    score2: number,
    stats: MatchLiveStats,
    comments?: MatchComment[],
    reactions?: Record<string, string[]>
  ) => void;
}

type PointEvent =
  | { type: 'normal'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'edge'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'net'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'smash'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'ace'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'defense'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'luck'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'style'; winner: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 }
  | { type: 'serve_error'; faultPlayer: 1 | 2; savedMatchPointBy?: 1 | 2; scoredOnServeBy?: 1 | 2 };

interface FloatingEmojiItem {
  id: string;
  emoji: string;
  senderName?: string;
  left: number;
}

const AnimatedFloatingEmoji: React.FC<{
  item: FloatingEmojiItem;
  onDone: (id: string) => void;
}> = ({ item, onDone }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      onDone(item.id);
    });
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, -60, -320],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.08, 0.75, 1],
    outputRange: [0, 1, 0.9, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0.5, 1.4, 1.2, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingEmojiWrapper,
        {
          left: `${item.left}%`,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.floatingEmojiText}>{item.emoji}</Text>
      {item.senderName ? (
        <View style={styles.floatingSenderBadge}>
          <Text style={styles.floatingSenderText}>{item.senderName}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
};

const LiveEventCelebrationBanner: React.FC<{
  event: LiveMatchSpecialEvent;
  onDone: () => void;
}> = ({ event, onDone }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
      Animated.delay(1900),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    ]).start(() => {
      onDone();
    });
  }, [event.id]);

  const eventBg = event.color || '#3B82F6';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.celebrationOverlay,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={[styles.celebrationCard, { borderColor: eventBg }]}>
        <View style={styles.celebrationHeaderRow}>
          <Text style={styles.celebrationAvatar}>{event.playerAvatar}</Text>
          <View style={styles.celebrationTitleBlock}>
            <Text style={[styles.celebrationTitle, { color: eventBg }]}>{event.title}</Text>
            <Text style={styles.celebrationSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {event.subtitle}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const QUICK_SHOUTS = [
  'Spigolo rubato! 🎲',
  'Rimonta in corso! 🔥',
  'Smash clamoroso! 💥',
  'Fallo incredibile! ❌',
  'Che match pazzesco! 😱',
  'Mani di velluto! 🏓',
];

export const FullScreenLiveMatchModal: React.FC<FullScreenLiveMatchModalProps> = ({
  visible,
  player1,
  player2,
  initialTargetPoints = 11,
  onClose,
  onFinishMatch,
}) => {
  if (!player1 || !player2) return null;

  const {
    currentLeague,
    currentUser,
    associatedPlayer,
    updateLiveMatchState,
    claimRefereeRole,
    placeLiveBet,
    setIsReportModalVisible,
  } = useElo();

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380 || screenHeight < 720;

  const [targetPoints, setTargetPoints] = useState<11 | 21>(initialTargetPoints);
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [history, setHistory] = useState<PointEvent[]>([]);

  // Riunione Bet State (LUL Coins)
  const [isBetOpen, setIsBetOpen] = useState(false);
  const [betMode, setBetMode] = useState<'pre_match' | 'live_dynamic'>('pre_match');
  const [betTarget, setBetTarget] = useState<1 | 2>(1);
  const [selectedMarketType, setSelectedMarketType] = useState<BetMarketType>('match_winner');
  const [selectedSelection, setSelectedSelection] = useState<string>('1');
  const [betAmount, setBetAmount] = useState<number>(25);
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);

  // Sincronizzazione automatica se si entra in una partita già avviata da un altro arbitro o spettatore
  useEffect(() => {
    const live = currentLeague?.activeLiveMatch;
    if (live) {
      if (live.score1 !== undefined) setScore1(live.score1);
      if (live.score2 !== undefined) setScore2(live.score2);
      if (live.targetPoints) setTargetPoints(live.targetPoints);
      if (live.stats) {
        setP1Edges(live.stats.player1Edges || 0);
        setP2Edges(live.stats.player2Edges || 0);
        setP1Nets(live.stats.player1Nets || 0);
        setP2Nets(live.stats.player2Nets || 0);
        setP1Smashes(live.stats.player1Smashes || 0);
        setP2Smashes(live.stats.player2Smashes || 0);
        setP1ServeErrors(live.stats.player1ServeErrors || 0);
        setP2ServeErrors(live.stats.player2ServeErrors || 0);
        setP1Aces(live.stats.player1Aces || 0);
        setP2Aces(live.stats.player2Aces || 0);
        setP1Defenses(live.stats.player1Defenses || 0);
        setP2Defenses(live.stats.player2Defenses || 0);
        setP1LuckPoints(live.stats.player1LuckPoints ?? ((live.stats.player1Edges || 0) + (live.stats.player1Nets || 0)));
        setP2LuckPoints(live.stats.player2LuckPoints ?? ((live.stats.player2Edges || 0) + (live.stats.player2Nets || 0)));
        setP1StylePoints(live.stats.player1StylePoints || 0);
        setP2StylePoints(live.stats.player2StylePoints || 0);
        setP1MatchPointsSaved(live.stats.player1MatchPointsSaved || 0);
        setP2MatchPointsSaved(live.stats.player2MatchPointsSaved || 0);
        setP1PointsOnServe(live.stats.player1PointsOnServe || 0);
        setP2PointsOnServe(live.stats.player2PointsOnServe || 0);
        if (live.stats.ballContestWinner) {
          setBallContestWinner(live.stats.ballContestWinner);
        }
        setP1TotalServes(live.stats.player1TotalServes || 0);
        setP2TotalServes(live.stats.player2TotalServes || 0);
      }
      if (live.server && live.ballContestDone && !ballContestWinner) {
        setBallContestWinner(live.server as 1 | 2);
      }
    }
  }, [
    currentLeague?.activeLiveMatch?.id,
    currentLeague?.activeLiveMatch?.score1,
    currentLeague?.activeLiveMatch?.score2,
    currentLeague?.activeLiveMatch?.isGameOver,
    currentLeague?.activeLiveMatch?.ballContestDone,
    currentLeague?.activeLiveMatch?.server,
    currentLeague?.activeLiveMatch?.stats?.ballContestWinner,
  ]);

  // Statistiche live
  const [p1Edges, setP1Edges] = useState(0);
  const [p2Edges, setP2Edges] = useState(0);
  const [p1Nets, setP1Nets] = useState(0);
  const [p2Nets, setP2Nets] = useState(0);
  const [p1LuckPoints, setP1LuckPoints] = useState(0);
  const [p2LuckPoints, setP2LuckPoints] = useState(0);
  const [p1StylePoints, setP1StylePoints] = useState(0);
  const [p2StylePoints, setP2StylePoints] = useState(0);
  const [p1Smashes, setP1Smashes] = useState(0);
  const [p2Smashes, setP2Smashes] = useState(0);
  const [p1ServeErrors, setP1ServeErrors] = useState(0);
  const [p2ServeErrors, setP2ServeErrors] = useState(0);
  const [p1Aces, setP1Aces] = useState(0);
  const [p2Aces, setP2Aces] = useState(0);
  const [p1Defenses, setP1Defenses] = useState(0);
  const [p2Defenses, setP2Defenses] = useState(0);
  const [p1MatchPointsSaved, setP1MatchPointsSaved] = useState(0);
  const [p2MatchPointsSaved, setP2MatchPointsSaved] = useState(0);
  const [p1PointsOnServe, setP1PointsOnServe] = useState(0);
  const [p2PointsOnServe, setP2PointsOnServe] = useState(0);
  const [ballContestWinner, setBallContestWinner] = useState<1 | 2 | undefined>(undefined);
  const [p1TotalServes, setP1TotalServes] = useState(0);
  const [p2TotalServes, setP2TotalServes] = useState(0);

  // Chat live e reazioni
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [localComments, setLocalComments] = useState<MatchComment[]>([]);
  const [localReactions, setLocalReactions] = useState<Record<string, number>>({
    '🔥': 0, '😱': 0, '💥': 0, '👏': 0, '💩': 0, '🏓': 0,
  });
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiItem[]>([]);
  const lastReactionIdRef = useRef<string | null>(null);

  // Eventi celebrativi sincroni su tutti i client (Smash, Ace, Difesa, Spigolo, Net)
  const [activeCelebrationEvent, setActiveCelebrationEvent] = useState<LiveMatchSpecialEvent | null>(null);
  const lastCelebrationEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    const ev = currentLeague?.activeLiveMatch?.recentEvent;
    if (ev && ev.id && ev.id !== lastCelebrationEventIdRef.current) {
      lastCelebrationEventIdRef.current = ev.id;
      setActiveCelebrationEvent(ev);
      triggerHaptic();

      // Suono evento speciale per tutti i client
      if (ev.type === 'ace') soundEffects.playAceSound();
      else if (ev.type === 'smash') soundEffects.playSmashSound();
      else if (ev.type === 'defense') soundEffects.playDefenseSound();
      else if (ev.type === 'luck') soundEffects.playLuckSound();
      else if (ev.type === 'style') soundEffects.playStylePointSound();
      else if (ev.type === 'edge') soundEffects.playEdgeSound();
      else if (ev.type === 'net') soundEffects.playNetSound();
    }
  }, [currentLeague?.activeLiveMatch?.recentEvent?.id]);

  // Rate limiter per salvataggio reazioni su Firestore
  const lastCloudReactionTimeRef = useRef<number>(0);
  const queuedReactionRef = useRef<string | null>(null);
  const reactionThrottleTimeoutRef = useRef<any>(null);

  // Riconoscimento Ruoli: Guardia vs 'Ndranghetista
  const activeLive = currentLeague?.activeLiveMatch;
  const isGuardia = !activeLive?.refereeUid || activeLive.refereeUid === currentUser?.uid;
  const guardiaName = activeLive?.refereePlayerName || 'Guardia';

  // Sincronizzazione in tempo reale delle reazioni fluttuanti ricevute da tutti i client
  useEffect(() => {
    const rec = currentLeague?.activeLiveMatch?.recentReaction;
    if (rec && rec.id && rec.id !== lastReactionIdRef.current) {
      lastReactionIdRef.current = rec.id;
      // Se la reazione è stata inviata da questo stesso client, è già stata mostrata localmente con zero latenza!
      if (currentUser?.uid && rec.senderUid === currentUser.uid) {
        return;
      }
      soundEffects.playReactionPop();
      const left = Math.floor(Math.random() * 60) + 20;
      setFloatingEmojis((prev) => [
        ...prev.slice(-10),
        { id: rec.id, emoji: rec.emoji, senderName: rec.senderName, left },
      ]);
    }
  }, [currentLeague?.activeLiveMatch?.recentReaction?.id]);

  const handleRemoveFloatingEmoji = (id: string) => {
    setFloatingEmojis((prev) => prev.filter((p) => p.id !== id));
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  };

  // Logica battuta e vantaggi con supporto contesa "Per la palla"
  const initialServer: 1 | 2 =
    ballContestWinner || (currentLeague?.activeLiveMatch?.server as 1 | 2) || 1;
  const totalPoints = score1 + score2;
  const isDeuce = score1 >= targetPoints - 1 && score2 >= targetPoints - 1;
  const serveInterval = isDeuce ? 1 : targetPoints === 11 ? 2 : 5;
  const isEvenRound = Math.floor(totalPoints / serveInterval) % 2 === 0;
  const currentServer: 1 | 2 = isEvenRound
    ? initialServer
    : initialServer === 1
    ? 2
    : 1;
  const servesRemaining = isDeuce ? 1 : serveInterval - (totalPoints % serveInterval);

  // Vittoria
  const isP1Winner = score1 >= targetPoints && score1 - score2 >= 2;
  const isP2Winner = score2 >= targetPoints && score2 - score1 >= 2;
  const isGameOver = isP1Winner || isP2Winner;

  // Match Point
  const isP1MatchPoint = !isGameOver && score1 >= targetPoints - 1 && score1 > score2;
  const isP2MatchPoint = !isGameOver && score2 >= targetPoints - 1 && score2 > score1;

  // Calcolo Quote e Gestione Riunione Bet (LUL Coins)
  const isPlayingInMatch = associatedPlayer?.id === player1.id || associatedPlayer?.id === player2.id;
  const mySide: 1 | 2 = associatedPlayer?.id === player1.id ? 1 : 2;

  const betsList: LiveBet[] = currentLeague?.activeLiveMatch?.bets
    ? Object.values(currentLeague.activeLiveMatch.bets)
    : [];
  const myBets = React.useMemo(() => {
    if (!associatedPlayer) return [];
    return betsList.filter((b) => b.bettorId === associatedPlayer.id);
  }, [betsList, associatedPlayer]);

  const currentLiveStats: MatchLiveStats = {
    player1Edges: p1Edges,
    player2Edges: p2Edges,
    player1Nets: p1Nets,
    player2Nets: p2Nets,
    player1Smashes: p1Smashes,
    player2Smashes: p2Smashes,
    player1ServeErrors: p1ServeErrors,
    player2ServeErrors: p2ServeErrors,
    player1Aces: p1Aces,
    player2Aces: p2Aces,
    player1Defenses: p1Defenses,
    player2Defenses: p2Defenses,
    player1StylePoints: p1StylePoints,
    player2StylePoints: p2StylePoints,
    player1LuckPoints: p1LuckPoints,
    player2LuckPoints: p2LuckPoints,
    player1MatchPointsSaved: p1MatchPointsSaved,
    player2MatchPointsSaved: p2MatchPointsSaved,
    player1PointsOnServe: p1PointsOnServe,
    player2PointsOnServe: p2PointsOnServe,
    ballContestWinner,
    player1TotalServes: p1TotalServes,
    player2TotalServes: p2TotalServes,
    targetPoints,
  };

  const allMarkets = React.useMemo(() => {
    return calculateAllLiveMarkets(
      player1.name,
      player2.name,
      player1.elo,
      player2.elo,
      score1,
      score2,
      targetPoints,
      currentLiveStats
    );
  }, [
    player1.name,
    player2.name,
    player1.elo,
    player2.elo,
    score1,
    score2,
    targetPoints,
    p1Smashes,
    p2Smashes,
    p1Edges,
    p2Edges,
    p1Nets,
    p2Nets,
  ]);

  const activeMarket =
    allMarkets.find((m) => m.type === (isPlayingInMatch ? 'match_winner' : selectedMarketType)) ||
    allMarkets[0];
  const activeOption =
    activeMarket.options.find(
      (o) => o.selection === (isPlayingInMatch ? String(mySide) : selectedSelection)
    ) || activeMarket.options[0];

  const selectedOdds = activeOption.odds;
  const hasBooster = !!associatedPlayer?.activeBetBooster;
  const potentialWin = hasBooster
    ? Math.round(betAmount + betAmount * (selectedOdds - 1) * 2)
    : Math.round(betAmount * selectedOdds);
  const isPreMatchOpen = canPlacePreMatchBet(score1, score2);

  const handlePlaceBet = async () => {
    if (isSubmittingBet) return;
    if (!associatedPlayer) {
      const msg = 'Devi collegare il tuo profilo giocatore per scommettere!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Profilo Richiesto', msg);
      return;
    }
    const userCoins = associatedPlayer.coins !== undefined ? associatedPlayer.coins : STARTING_COINS;
    if (betAmount <= 0) {
      const msg = 'Seleziona un importo valido di LUL Coins!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Importo non valido', msg);
      return;
    }
    if (betAmount > userCoins) {
      const msg = `Saldo insufficiente! Hai ${userCoins} LUL Coins.`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Fondi Insufficienti', msg);
      return;
    }

    setIsSubmittingBet(true);
    try {
      const betTargetSide =
        activeMarket.type === 'match_winner' ? (activeOption.selection === '2' ? 2 : 1) : 1;
      const res = await placeLiveBet(betTargetSide, betAmount, betMode, {
        marketType: activeMarket.type,
        marketLabel: activeMarket.title,
        selection: activeOption.selection,
        selectionLabel: activeOption.label,
        targetLine: activeMarket.targetLine,
        odds: activeOption.odds,
      });
      if (!res.success) {
        const msg = res.error || 'Errore piazzando la scommessa';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Errore Scommessa', msg);
      } else {
        triggerHaptic();
        const msg = `Scommessa registrata con successo! ${betAmount} LUL Coins su "${activeOption.label}" a quota ${activeOption.odds.toFixed(2)}x (Vincita potenziale: ${potentialWin} 🪙)${hasBooster ? ' ⚡ (Booster 2x Attivo!)' : ''}`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Bet Piazzata! 🎰', msg);
      }
    } finally {
      setIsSubmittingBet(false);
    }
  };

  const handleSetBallContestWinner = (winner: 1 | 2) => {
    if (!isGuardia) return;
    triggerHaptic();
    soundEffects.playBallContestSound();
    setBallContestWinner(winner);
    updateLiveMatchState(
      score1,
      score2,
      winner,
      targetPoints === 11 ? 2 : 5,
      false,
      {
        player1Edges: p1Edges,
        player2Edges: p2Edges,
        player1Nets: p1Nets,
        player2Nets: p2Nets,
        player1Smashes: p1Smashes,
        player2Smashes: p2Smashes,
        player1ServeErrors: p1ServeErrors,
        player2ServeErrors: p2ServeErrors,
        player1Aces: p1Aces,
        player2Aces: p2Aces,
        player1Defenses: p1Defenses,
        player2Defenses: p2Defenses,
        player1MatchPointsSaved: p1MatchPointsSaved,
        player2MatchPointsSaved: p2MatchPointsSaved,
        player1PointsOnServe: p1PointsOnServe,
        player2PointsOnServe: p2PointsOnServe,
        ballContestWinner: winner,
        player1TotalServes: p1TotalServes,
        player2TotalServes: p2TotalServes,
        targetPoints,
      },
      true
    ).catch(() => {});
  };

  const addPoint = (event: PointEvent) => {
    if (!isGuardia || isGameOver) return;
    triggerHaptic();

    let newS1 = score1;
    let newS2 = score2;
    let nextP1Edges = p1Edges;
    let nextP2Edges = p2Edges;
    let nextP1Nets = p1Nets;
    let nextP2Nets = p2Nets;
    let nextP1Smashes = p1Smashes;
    let nextP2Smashes = p2Smashes;
    let nextP1ServeErrors = p1ServeErrors;
    let nextP2ServeErrors = p2ServeErrors;
    let nextP1Aces = p1Aces;
    let nextP2Aces = p2Aces;
    let nextP1Defenses = p1Defenses;
    let nextP2Defenses = p2Defenses;
    let nextP1LuckPoints = p1LuckPoints;
    let nextP2LuckPoints = p2LuckPoints;
    let nextP1StylePoints = p1StylePoints;
    let nextP2StylePoints = p2StylePoints;
    let nextP1MatchPointsSaved = p1MatchPointsSaved;
    let nextP2MatchPointsSaved = p2MatchPointsSaved;
    let nextP1PointsOnServe = p1PointsOnServe;
    let nextP2PointsOnServe = p2PointsOnServe;

    if (currentServer === 1) {
      setP1TotalServes((s) => s + 1);
    } else {
      setP2TotalServes((s) => s + 1);
    }

    // Identifica chi vince il punto
    const pointWinner: 1 | 2 =
      event.type === 'serve_error'
        ? event.faultPlayer === 1
          ? 2
          : 1
        : event.winner;

    // Controllo se è stato annullato un Match Point
    let savedMatchPointBy: 1 | 2 | undefined = undefined;
    if (isP1MatchPoint && pointWinner === 2) {
      savedMatchPointBy = 2;
      nextP2MatchPointsSaved += 1;
      setP2MatchPointsSaved(nextP2MatchPointsSaved);
    } else if (isP2MatchPoint && pointWinner === 1) {
      savedMatchPointBy = 1;
      nextP1MatchPointsSaved += 1;
      setP1MatchPointsSaved(nextP1MatchPointsSaved);
    }

    // Controllo se il punto è stato vinto su proprio servizio (per trofeo 'Buona la prima')
    let scoredOnServeBy: 1 | 2 | undefined = undefined;
    if (event.type !== 'serve_error' && pointWinner === currentServer) {
      scoredOnServeBy = currentServer;
      if (currentServer === 1) {
        nextP1PointsOnServe += 1;
        setP1PointsOnServe(nextP1PointsOnServe);
      } else {
        nextP2PointsOnServe += 1;
        setP2PointsOnServe(nextP2PointsOnServe);
      }
    }

    // Creazione animazione celebrativa speciale (Ace, Smash, Difesa, Punto Culo, Punto Stile, Spigolo, Net)
    let triggeredSpecialEvent: LiveMatchSpecialEvent | undefined = undefined;
    if (
      event.type === 'ace' ||
      event.type === 'smash' ||
      event.type === 'defense' ||
      event.type === 'luck' ||
      event.type === 'style' ||
      event.type === 'edge' ||
      event.type === 'net'
    ) {
      const winnerPlayer = event.winner === 1 ? player1 : player2;
      const eventConfig: Record<string, { title: string; subtitle: string; color: string }> = {
        ace: { title: '⚡ ACE DEVASTANTE!', subtitle: `Battuta micidiale di ${winnerPlayer.name}!`, color: '#C084FC' },
        smash: { title: '💥 SMASH CLAMOROSO!', subtitle: `Schiacciata violenta di ${winnerPlayer.name}!`, color: '#F87171' },
        defense: { title: '🛡️ DIFESA D\'ACCIAIO!', subtitle: `Recupero da urlo di ${winnerPlayer.name}!`, color: '#22D3EE' },
        luck: { title: '🍀 PUNTO CULO!', subtitle: `Incredibile botta di fortuna per ${winnerPlayer.name}!`, color: '#10B981' },
        style: { title: '✨ PUNTO STILE!', subtitle: `Giocata di pura classe per ${winnerPlayer.name}!`, color: '#A855F7' },
        edge: { title: '🎲 SPIGOLO RUBATO!', subtitle: `Filo del tavolo per ${winnerPlayer.name}!`, color: '#34D399' },
        net: { title: '🕸️ NET FORTUNATO!', subtitle: `Rete beffarda per ${winnerPlayer.name}!`, color: '#60A5FA' },
      };
      const cfg = eventConfig[event.type];
      triggeredSpecialEvent = {
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        type: event.type,
        title: cfg.title,
        subtitle: cfg.subtitle,
        playerName: winnerPlayer.name,
        playerAvatar: winnerPlayer.avatar,
        color: cfg.color,
        timestamp: Date.now(),
      };
      if (triggeredSpecialEvent) {
        setActiveCelebrationEvent(triggeredSpecialEvent);
        lastCelebrationEventIdRef.current = triggeredSpecialEvent.id;
      }
    }

    if (event.type === 'normal') {
      soundEffects.playPaddleHit();
      if (event.winner === 1) { newS1 += 1; setScore1(newS1); }
      else { newS2 += 1; setScore2(newS2); }
    } else if (event.type === 'luck') {
      soundEffects.playLuckSound();
      if (event.winner === 1) {
        newS1 += 1; setScore1(newS1);
        nextP1LuckPoints += 1; setP1LuckPoints(nextP1LuckPoints);
        nextP1Edges += 1; setP1Edges(nextP1Edges);
      } else {
        newS2 += 1; setScore2(newS2);
        nextP2LuckPoints += 1; setP2LuckPoints(nextP2LuckPoints);
        nextP2Edges += 1; setP2Edges(nextP2Edges);
      }
    } else if (event.type === 'style') {
      soundEffects.playStylePointSound();
      if (event.winner === 1) {
        newS1 += 1; setScore1(newS1);
        nextP1StylePoints += 1; setP1StylePoints(nextP1StylePoints);
      } else {
        newS2 += 1; setScore2(newS2);
        nextP2StylePoints += 1; setP2StylePoints(nextP2StylePoints);
      }
    } else if (event.type === 'edge') {
      soundEffects.playEdgeSound();
      if (event.winner === 1) {
        newS1 += 1; setScore1(newS1);
        nextP1Edges += 1; setP1Edges(nextP1Edges);
        nextP1LuckPoints += 1; setP1LuckPoints(nextP1LuckPoints);
      } else {
        newS2 += 1; setScore2(newS2);
        nextP2Edges += 1; setP2Edges(nextP2Edges);
        nextP2LuckPoints += 1; setP2LuckPoints(nextP2LuckPoints);
      }
    } else if (event.type === 'net') {
      soundEffects.playNetSound();
      if (event.winner === 1) {
        newS1 += 1; setScore1(newS1);
        nextP1Nets += 1; setP1Nets(nextP1Nets);
        nextP1LuckPoints += 1; setP1LuckPoints(nextP1LuckPoints);
      } else {
        newS2 += 1; setScore2(newS2);
        nextP2Nets += 1; setP2Nets(nextP2Nets);
        nextP2LuckPoints += 1; setP2LuckPoints(nextP2LuckPoints);
      }
    } else if (event.type === 'smash') {
      soundEffects.playSmashSound();
      if (event.winner === 1) {
        newS1 += 1; setScore1(newS1);
        nextP1Smashes += 1; setP1Smashes(nextP1Smashes);
      } else {
        newS2 += 1; setScore2(newS2);
        nextP2Smashes += 1; setP2Smashes(nextP2Smashes);
      }
    } else if (event.type === 'ace') {
      soundEffects.playAceSound();
      if (event.winner === 1) {
        newS1 += 1; setScore1(newS1);
        nextP1Aces += 1; setP1Aces(nextP1Aces);
      } else {
        newS2 += 1; setScore2(newS2);
        nextP2Aces += 1; setP2Aces(nextP2Aces);
      }
    } else if (event.type === 'defense') {
      soundEffects.playDefenseSound();
      if (event.winner === 1) {
        newS1 += 1; setScore1(newS1);
        nextP1Defenses += 1; setP1Defenses(nextP1Defenses);
      } else {
        newS2 += 1; setScore2(newS2);
        nextP2Defenses += 1; setP2Defenses(nextP2Defenses);
      }
    } else if (event.type === 'serve_error') {
      soundEffects.playFaultSound();
      if (event.faultPlayer === 1) {
        newS2 += 1; setScore2(newS2);
        nextP1ServeErrors += 1; setP1ServeErrors(nextP1ServeErrors);
      } else {
        newS1 += 1; setScore1(newS1);
        nextP2ServeErrors += 1; setP2ServeErrors(nextP2ServeErrors);
      }
    }

    setHistory((prev) => [...prev, { ...event, savedMatchPointBy, scoredOnServeBy }]);

    // Calcolo prossimo servizio
    const newTot = newS1 + newS2;
    const newIsDeuce = newS1 >= targetPoints - 1 && newS2 >= targetPoints - 1;
    const newInterval = newIsDeuce ? 1 : targetPoints === 11 ? 2 : 5;
    const newIsEvenRound = Math.floor(newTot / newInterval) % 2 === 0;
    const nextServer: 1 | 2 = newIsEvenRound
      ? initialServer
      : initialServer === 1
      ? 2
      : 1;
    const nextRemaining = newIsDeuce ? 1 : newInterval - (newTot % newInterval);
    const newGameOver = (newS1 >= targetPoints && newS1 - newS2 >= 2) || (newS2 >= targetPoints && newS2 - newS1 >= 2);

    if (newGameOver) {
      soundEffects.playVictoryFanfare();
    }

    updateLiveMatchState(newS1, newS2, nextServer, nextRemaining, newGameOver, {
      player1Edges: nextP1Edges,
      player2Edges: nextP2Edges,
      player1Nets: nextP1Nets,
      player2Nets: nextP2Nets,
      player1LuckPoints: nextP1LuckPoints,
      player2LuckPoints: nextP2LuckPoints,
      player1StylePoints: nextP1StylePoints,
      player2StylePoints: nextP2StylePoints,
      player1Smashes: nextP1Smashes,
      player2Smashes: nextP2Smashes,
      player1ServeErrors: nextP1ServeErrors,
      player2ServeErrors: nextP2ServeErrors,
      player1Aces: nextP1Aces,
      player2Aces: nextP2Aces,
      player1Defenses: nextP1Defenses,
      player2Defenses: nextP2Defenses,
      player1MatchPointsSaved: nextP1MatchPointsSaved,
      player2MatchPointsSaved: nextP2MatchPointsSaved,
      player1PointsOnServe: nextP1PointsOnServe,
      player2PointsOnServe: nextP2PointsOnServe,
      ballContestWinner: ballContestWinner || initialServer,
      player1TotalServes: p1TotalServes + (currentServer === 1 ? 1 : 0),
      player2TotalServes: p2TotalServes + (currentServer === 2 ? 1 : 0),
      targetPoints,
    }, true, triggeredSpecialEvent).catch(() => {});
  };

  const undoLastPoint = () => {
    if (history.length === 0) return;
    triggerHaptic();
    soundEffects.playUndoSound();
    const lastEvent = history[history.length - 1];

    let newS1 = score1;
    let newS2 = score2;
    let nextP1Edges = p1Edges;
    let nextP2Edges = p2Edges;
    let nextP1Nets = p1Nets;
    let nextP2Nets = p2Nets;
    let nextP1Smashes = p1Smashes;
    let nextP2Smashes = p2Smashes;
    let nextP1ServeErrors = p1ServeErrors;
    let nextP2ServeErrors = p2ServeErrors;
    let nextP1Aces = p1Aces;
    let nextP2Aces = p2Aces;
    let nextP1Defenses = p1Defenses;
    let nextP2Defenses = p2Defenses;
    let nextP1LuckPoints = p1LuckPoints;
    let nextP2LuckPoints = p2LuckPoints;
    let nextP1StylePoints = p1StylePoints;
    let nextP2StylePoints = p2StylePoints;
    let nextP1MatchPointsSaved = p1MatchPointsSaved;
    let nextP2MatchPointsSaved = p2MatchPointsSaved;
    let nextP1PointsOnServe = p1PointsOnServe;
    let nextP2PointsOnServe = p2PointsOnServe;

    if (lastEvent.savedMatchPointBy === 1) {
      nextP1MatchPointsSaved = Math.max(0, p1MatchPointsSaved - 1);
      setP1MatchPointsSaved(nextP1MatchPointsSaved);
    } else if (lastEvent.savedMatchPointBy === 2) {
      nextP2MatchPointsSaved = Math.max(0, p2MatchPointsSaved - 1);
      setP2MatchPointsSaved(nextP2MatchPointsSaved);
    }

    if (lastEvent.scoredOnServeBy === 1) {
      nextP1PointsOnServe = Math.max(0, p1PointsOnServe - 1);
      setP1PointsOnServe(nextP1PointsOnServe);
    } else if (lastEvent.scoredOnServeBy === 2) {
      nextP2PointsOnServe = Math.max(0, p2PointsOnServe - 1);
      setP2PointsOnServe(nextP2PointsOnServe);
    }

    if (lastEvent.type === 'normal') {
      if (lastEvent.winner === 1) { newS1 = Math.max(0, score1 - 1); setScore1(newS1); }
      else { newS2 = Math.max(0, score2 - 1); setScore2(newS2); }
    } else if (lastEvent.type === 'luck') {
      if (lastEvent.winner === 1) {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP1LuckPoints = Math.max(0, p1LuckPoints - 1); setP1LuckPoints(nextP1LuckPoints);
        nextP1Edges = Math.max(0, p1Edges - 1); setP1Edges(nextP1Edges);
      } else {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP2LuckPoints = Math.max(0, p2LuckPoints - 1); setP2LuckPoints(nextP2LuckPoints);
        nextP2Edges = Math.max(0, p2Edges - 1); setP2Edges(nextP2Edges);
      }
    } else if (lastEvent.type === 'style') {
      if (lastEvent.winner === 1) {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP1StylePoints = Math.max(0, p1StylePoints - 1); setP1StylePoints(nextP1StylePoints);
      } else {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP2StylePoints = Math.max(0, p2StylePoints - 1); setP2StylePoints(nextP2StylePoints);
      }
    } else if (lastEvent.type === 'edge') {
      if (lastEvent.winner === 1) {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP1Edges = Math.max(0, p1Edges - 1); setP1Edges(nextP1Edges);
        nextP1LuckPoints = Math.max(0, p1LuckPoints - 1); setP1LuckPoints(nextP1LuckPoints);
      } else {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP2Edges = Math.max(0, p2Edges - 1); setP2Edges(nextP2Edges);
        nextP2LuckPoints = Math.max(0, p2LuckPoints - 1); setP2LuckPoints(nextP2LuckPoints);
      }
    } else if (lastEvent.type === 'net') {
      if (lastEvent.winner === 1) {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP1Nets = Math.max(0, p1Nets - 1); setP1Nets(nextP1Nets);
        nextP1LuckPoints = Math.max(0, p1LuckPoints - 1); setP1LuckPoints(nextP1LuckPoints);
      } else {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP2Nets = Math.max(0, p2Nets - 1); setP2Nets(nextP2Nets);
        nextP2LuckPoints = Math.max(0, p2LuckPoints - 1); setP2LuckPoints(nextP2LuckPoints);
      }
    } else if (lastEvent.type === 'smash') {
      if (lastEvent.winner === 1) {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP1Smashes = Math.max(0, p1Smashes - 1); setP1Smashes(nextP1Smashes);
      } else {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP2Smashes = Math.max(0, p2Smashes - 1); setP2Smashes(nextP2Smashes);
      }
    } else if (lastEvent.type === 'ace') {
      if (lastEvent.winner === 1) {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP1Aces = Math.max(0, p1Aces - 1); setP1Aces(nextP1Aces);
      } else {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP2Aces = Math.max(0, p2Aces - 1); setP2Aces(nextP2Aces);
      }
    } else if (lastEvent.type === 'defense') {
      if (lastEvent.winner === 1) {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP1Defenses = Math.max(0, p1Defenses - 1); setP1Defenses(nextP1Defenses);
      } else {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP2Defenses = Math.max(0, p2Defenses - 1); setP2Defenses(nextP2Defenses);
      }
    } else if (lastEvent.type === 'serve_error') {
      if (lastEvent.faultPlayer === 1) {
        newS2 = Math.max(0, score2 - 1); setScore2(newS2);
        nextP1ServeErrors = Math.max(0, p1ServeErrors - 1); setP1ServeErrors(nextP1ServeErrors);
      } else {
        newS1 = Math.max(0, score1 - 1); setScore1(newS1);
        nextP2ServeErrors = Math.max(0, p2ServeErrors - 1); setP2ServeErrors(nextP2ServeErrors);
      }
    }

    setHistory((prev) => prev.slice(0, prev.length - 1));

    const newTot = newS1 + newS2;
    const newIsDeuce = newS1 >= targetPoints - 1 && newS2 >= targetPoints - 1;
    const newInterval = newIsDeuce ? 1 : targetPoints === 11 ? 2 : 5;
    const newIsEvenRound = Math.floor(newTot / newInterval) % 2 === 0;
    const nextServer: 1 | 2 = newIsEvenRound
      ? initialServer
      : initialServer === 1
      ? 2
      : 1;
    const nextRemaining = newIsDeuce ? 1 : newInterval - (newTot % newInterval);
    const newGameOver = (newS1 >= targetPoints && newS1 - newS2 >= 2) || (newS2 >= targetPoints && newS2 - newS1 >= 2);

    updateLiveMatchState(newS1, newS2, nextServer, nextRemaining, newGameOver, {
      player1Edges: nextP1Edges,
      player2Edges: nextP2Edges,
      player1Nets: nextP1Nets,
      player2Nets: nextP2Nets,
      player1LuckPoints: nextP1LuckPoints,
      player2LuckPoints: nextP2LuckPoints,
      player1StylePoints: nextP1StylePoints,
      player2StylePoints: nextP2StylePoints,
      player1Smashes: nextP1Smashes,
      player2Smashes: nextP2Smashes,
      player1ServeErrors: nextP1ServeErrors,
      player2ServeErrors: nextP2ServeErrors,
      player1Aces: nextP1Aces,
      player2Aces: nextP2Aces,
      player1Defenses: nextP1Defenses,
      player2Defenses: nextP2Defenses,
      player1MatchPointsSaved: nextP1MatchPointsSaved,
      player2MatchPointsSaved: nextP2MatchPointsSaved,
      player1PointsOnServe: nextP1PointsOnServe,
      player2PointsOnServe: nextP2PointsOnServe,
      ballContestWinner: ballContestWinner || initialServer,
      player1TotalServes: Math.max(0, p1TotalServes - (currentServer === 1 ? 1 : 0)),
      player2TotalServes: Math.max(0, p2TotalServes - (currentServer === 2 ? 1 : 0)),
      targetPoints,
    }, true).catch(() => {});
  };

  const handleFinish = () => {
    soundEffects.playButtonTap();
    onFinishMatch(
      score1,
      score2,
      {
        player1Edges: p1Edges,
        player2Edges: p2Edges,
        player1Nets: p1Nets,
        player2Nets: p2Nets,
        player1LuckPoints: p1LuckPoints,
        player2LuckPoints: p2LuckPoints,
        player1StylePoints: p1StylePoints,
        player2StylePoints: p2StylePoints,
        player1Smashes: p1Smashes,
        player2Smashes: p2Smashes,
        player1ServeErrors: p1ServeErrors,
        player2ServeErrors: p2ServeErrors,
        player1Aces: p1Aces,
        player2Aces: p2Aces,
        player1Defenses: p1Defenses,
        player2Defenses: p2Defenses,
        player1MatchPointsSaved: p1MatchPointsSaved,
        player2MatchPointsSaved: p2MatchPointsSaved,
        player1PointsOnServe: p1PointsOnServe,
        player2PointsOnServe: p2PointsOnServe,
        ballContestWinner: ballContestWinner || initialServer,
        player1TotalServes: p1TotalServes,
        player2TotalServes: p2TotalServes,
        targetPoints,
      },
      [],
      {}
    );
  };

  const handleRequestClose = () => {
    soundEffects.playButtonTap();
    if (!isGuardia) {
      // Per lo spettatore ('Ndranghetista), uscire non deve cancellare la partita per gli altri!
      onClose({ forceCancelMatch: false });
      return;
    }
    if (score1 > 0 || score2 > 0) {
      const confirmMsg = 'Sei sicuro di voler uscire? La partita in corso verrà annullata.';
      if (Platform.OS === 'web') {
        if (window.confirm(confirmMsg)) onClose({ forceCancelMatch: true });
      } else {
        Alert.alert('Uscita Arbitraggio', confirmMsg, [
          { text: 'Resta in partita', style: 'cancel' },
          {
            text: 'Esci ed annulla',
            style: 'destructive',
            onPress: () => onClose({ forceCancelMatch: true }),
          },
        ]);
      }
    } else {
      onClose({ forceCancelMatch: true });
    }
  };

  const p1Color = player1.color || '#3B82F6';
  const p2Color = player2.color || '#10B981';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleRequestClose}>
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={handleRequestClose} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>✕ Esci</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              soundEffects.playButtonTap();
              setIsReportModalVisible(true);
            }}
            style={styles.liveReportBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.liveReportBtnText}>🚨 Segnala</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={undoLastPoint}
            disabled={!isGuardia || history.length === 0}
            style={[styles.undoBtn, (!isGuardia || history.length === 0) && { opacity: 0.3 }]}
          >
            <Text style={styles.undoBtnText}>↩️ Undo</Text>
          </TouchableOpacity>
        </View>

        {/* Role Banner: Guardia vs 'Ndranghetista */}
        <View style={styles.roleBannerRow}>
          {isGuardia ? (
            <View style={styles.guardiaBadge}>
              <Text style={styles.guardiaBadgeText}>👮‍♂️ SEI LA GUARDIA UFFICIALE</Text>
            </View>
          ) : (
            <View style={styles.ndranghetaRow}>
              <View style={styles.ndranghetaBadge}>
                <Text style={styles.ndranghetaBadgeText}>🕶️ 'NDRANGHETISTA</Text>
              </View>
              <Text style={styles.guardiaInfoText}>Guardia: {guardiaName}</Text>
              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  claimRefereeRole();
                }}
                style={styles.claimGuardiaBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.claimGuardiaBtnText}>👮‍♂️ Diventa Guardia</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Banner Turno di Battuta & Alert */}
        <View style={styles.statusBanner}>
          {isGameOver ? (
            <View style={styles.gameOverBanner}>
              <Text style={styles.gameOverText}>
                🏆 VITTORIA PER {isP1Winner ? player1.name.toUpperCase() : player2.name.toUpperCase()}!
              </Text>
            </View>
          ) : isP1MatchPoint || isP2MatchPoint ? (
            <View style={styles.matchPointBanner}>
              <Text style={styles.matchPointText}>
                ⚡ MATCH POINT PER {isP1MatchPoint ? player1.name : player2.name}! ⚡
              </Text>
            </View>
          ) : isDeuce ? (
            <View style={styles.deuceBanner}>
              <Text style={styles.deuceText}>🔥 VANTAGGI (DEUCE) - CAMBIO BATTUTA A OGNI PUNTO 🔥</Text>
            </View>
          ) : (
            <View style={styles.serverBanner}>
              <Text style={styles.serverEmoji}>🏓</Text>
              <Text style={styles.serverText}>
                Al Servizio:{' '}
                <Text style={{ color: currentServer === 1 ? p1Color : p2Color, fontWeight: '900' }}>
                  {currentServer === 1 ? player1.name : player2.name}
                </Text>{' '}
                ({servesRemaining} {servesRemaining === 1 ? 'battuta rimanente' : 'battute rimanenti'})
              </Text>
            </View>
          )}
        </View>

        {/* Banner Contesa Iniziale "Per la palla" */}
        {score1 === 0 && score2 === 0 && !ballContestWinner && !currentLeague?.activeLiveMatch?.ballContestDone && (
          <View style={[styles.ballContestBanner, isSmallScreen && { padding: 8, marginBottom: 6 }]}>
            <Text style={styles.ballContestTitle}>🏓 CONTESA PER LA PALLA</Text>
            <Text style={styles.ballContestSub}>Chi ha vinto il palleggio iniziale per servire?</Text>
            {isGuardia ? (
              <View style={styles.ballContestBtnRow}>
                <TouchableOpacity
                  onPress={() => handleSetBallContestWinner(1)}
                  style={[styles.ballContestBtn, { backgroundColor: `${p1Color}25`, borderColor: p1Color }]}
                >
                  <Text style={[styles.ballContestBtnText, { color: p1Color }, isSmallScreen && { fontSize: 11 }]} numberOfLines={1} ellipsizeMode="tail">
                    🏓 {player1.name} (Mia!)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSetBallContestWinner(2)}
                  style={[styles.ballContestBtn, { backgroundColor: `${p2Color}25`, borderColor: p2Color }]}
                >
                  <Text style={[styles.ballContestBtnText, { color: p2Color }, isSmallScreen && { fontSize: 11 }]} numberOfLines={1} ellipsizeMode="tail">
                    🏓 {player2.name} (Mia!)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.ballContestWaitingText}>
                In attesa che la Guardia ({guardiaName}) assegni la prima battuta...
              </Text>
            )}
          </View>
        )}

        {/* Tabellone Principale con Due Colonne */}
        <View style={styles.scoreboardRow}>
          {/* Colonna Player 1 */}
          <View
            style={[
              styles.playerColumn,
              {
                borderColor: currentServer === 1 ? p1Color : 'rgba(255, 255, 255, 0.12)',
                borderWidth: currentServer === 1 ? 2.5 : 1,
                backgroundColor: currentServer === 1 ? `${p1Color}18` : 'rgba(255, 255, 255, 0.03)',
              },
              getBorderCardStyle(player1.equippedBorder),
              currentServer === 1 && { borderTopWidth: 4, borderTopColor: p1Color },
              isSmallScreen && { padding: 8 },
            ]}
          >
            <View style={styles.playerInfo}>
              <Text style={[styles.playerAvatar, isSmallScreen && { fontSize: 24, marginBottom: 0 }]}>{player1.avatar}</Text>
              <Text style={[styles.playerName, { color: p1Color }, isSmallScreen && { fontSize: 13 }]} numberOfLines={1} ellipsizeMode="tail">
                {player1.name}
              </Text>
              {player1.equippedTitle && (
                <Text style={styles.playerEquippedTitle} numberOfLines={1}>
                  {player1.equippedTitle}
                </Text>
              )}
              {currentServer === 1 && !isGameOver && (
                <View style={[styles.serverBadge, { backgroundColor: p1Color }]}>
                  <Text style={styles.serverBadgeText}>SERVE 🏓</Text>
                </View>
              )}
            </View>

            {/* Punteggio P1 */}
            <TouchableOpacity
              activeOpacity={isGuardia ? 0.7 : 1}
              disabled={!isGuardia || isGameOver}
              onPress={() => addPoint({ type: 'normal', winner: 1 })}
              style={[
                styles.bigScoreBox,
                !isGuardia && styles.bigScoreBoxSpectator,
                isSmallScreen && { paddingVertical: isGuardia ? 10 : 16, marginVertical: 3 },
              ]}
            >
              <Text style={[styles.bigScoreNumber, { color: p1Color }, isSmallScreen && { fontSize: 46 }]}>{score1}</Text>
              <Text style={[styles.tapToScoreText, isSmallScreen && { fontSize: 10 }]} numberOfLines={1} ellipsizeMode="tail">
                {isGuardia ? '+1 Punto rapido' : `Punti ${player1.name}`}
              </Text>
            </TouchableOpacity>

            {/* Tasti Eventi P1 vs Riepilogo Statistiche per 'Ndranghetisti */}
            {isGuardia ? (
              <View style={styles.actionGrid}>
                {/* Riga 1: Ace e Smash */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    disabled={currentServer !== 1}
                    onPress={() => {
                      if (currentServer !== 1) return;
                      addPoint({ type: 'ace', winner: 1 });
                    }}
                    style={[
                      styles.eventBtn,
                      styles.aceBtn,
                      currentServer !== 1 && styles.eventBtnDisabled,
                      isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventBtnText,
                        styles.aceBtnText,
                        currentServer !== 1 && styles.eventBtnTextDisabled,
                        isSmallScreen && { fontSize: 9.5 },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      ⚡ Ace ({p1Aces})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'smash', winner: 1 })}
                    style={[styles.eventBtn, styles.smashBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.smashBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      💥 Smash ({p1Smashes})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Riga 2: Difesa e Punto Culo */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'defense', winner: 1 })}
                    style={[styles.eventBtn, styles.defenseBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.defenseBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      🛡️ Difesa ({p1Defenses})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'luck', winner: 1 })}
                    style={[styles.eventBtn, styles.luckBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.luckBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      🍀 Culo ({p1LuckPoints || (p1Edges + p1Nets)})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Riga 3: Punto Stile e Fallo */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'style', winner: 1 })}
                    style={[styles.eventBtn, styles.styleBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.styleBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      ✨ Stile ({p1StylePoints})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={currentServer !== 1}
                    onPress={() => {
                      if (currentServer !== 1) return;
                      addPoint({ type: 'serve_error', faultPlayer: 1 });
                    }}
                    style={[
                      styles.eventBtn,
                      styles.faultBtn,
                      currentServer !== 1 && styles.eventBtnDisabled,
                      isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventBtnText,
                        styles.faultBtnText,
                        currentServer !== 1 && styles.eventBtnTextDisabled,
                        isSmallScreen && { fontSize: 9.5 },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      ❌ Fallo ({p1ServeErrors})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.spectatorStatsSummary}>
                <Text style={[styles.spectatorStatChip, styles.aceChip]} numberOfLines={1} ellipsizeMode="tail">⚡ Ace: {p1Aces}</Text>
                <Text style={[styles.spectatorStatChip, styles.smashChip]} numberOfLines={1} ellipsizeMode="tail">💥 Smash: {p1Smashes}</Text>
                <Text style={[styles.spectatorStatChip, styles.defenseChip]} numberOfLines={1} ellipsizeMode="tail">🛡️ Difese: {p1Defenses}</Text>
                <Text style={[styles.spectatorStatChip, styles.luckChip]} numberOfLines={1} ellipsizeMode="tail">🍀 Culo: {p1LuckPoints || (p1Edges + p1Nets)}</Text>
                <Text style={[styles.spectatorStatChip, styles.styleChip]} numberOfLines={1} ellipsizeMode="tail">✨ Stile: {p1StylePoints}</Text>
                <Text style={[styles.spectatorStatChip, styles.faultChip]} numberOfLines={1} ellipsizeMode="tail">❌ Falli: {p1ServeErrors}</Text>
                {p1MatchPointsSaved > 0 && (
                  <Text style={[styles.spectatorStatChip, styles.mpSavedChip]} numberOfLines={1} ellipsizeMode="tail">🧱 MP Salvati: {p1MatchPointsSaved}</Text>
                )}
              </View>
            )}
          </View>

          {/* Divisore Centrale */}
          <View style={styles.centerDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Colonna Player 2 */}
          <View
            style={[
              styles.playerColumn,
              {
                borderColor: currentServer === 2 ? p2Color : 'rgba(255, 255, 255, 0.12)',
                borderWidth: currentServer === 2 ? 2.5 : 1,
                backgroundColor: currentServer === 2 ? `${p2Color}18` : 'rgba(255, 255, 255, 0.03)',
              },
              getBorderCardStyle(player2.equippedBorder),
              currentServer === 2 && { borderTopWidth: 4, borderTopColor: p2Color },
              isSmallScreen && { padding: 8 },
            ]}
          >
            <View style={styles.playerInfo}>
              <Text style={[styles.playerAvatar, isSmallScreen && { fontSize: 24, marginBottom: 0 }]}>{player2.avatar}</Text>
              <Text style={[styles.playerName, { color: p2Color }, isSmallScreen && { fontSize: 13 }]} numberOfLines={1} ellipsizeMode="tail">
                {player2.name}
              </Text>
              {player2.equippedTitle && (
                <Text style={styles.playerEquippedTitle} numberOfLines={1}>
                  {player2.equippedTitle}
                </Text>
              )}
              {currentServer === 2 && !isGameOver && (
                <View style={[styles.serverBadge, { backgroundColor: p2Color }]}>
                  <Text style={styles.serverBadgeText}>SERVE 🏓</Text>
                </View>
              )}
            </View>

            {/* Punteggio P2 */}
            <TouchableOpacity
              activeOpacity={isGuardia ? 0.7 : 1}
              disabled={!isGuardia || isGameOver}
              onPress={() => addPoint({ type: 'normal', winner: 2 })}
              style={[
                styles.bigScoreBox,
                !isGuardia && styles.bigScoreBoxSpectator,
                isSmallScreen && { paddingVertical: isGuardia ? 10 : 16, marginVertical: 3 },
              ]}
            >
              <Text style={[styles.bigScoreNumber, { color: p2Color }, isSmallScreen && { fontSize: 46 }]}>{score2}</Text>
              <Text style={[styles.tapToScoreText, isSmallScreen && { fontSize: 10 }]} numberOfLines={1} ellipsizeMode="tail">
                {isGuardia ? '+1 Punto rapido' : `Punti ${player2.name}`}
              </Text>
            </TouchableOpacity>

            {/* Tasti Eventi P2 vs Riepilogo Statistiche per 'Ndranghetisti */}
            {isGuardia ? (
              <View style={styles.actionGrid}>
                {/* Riga 1: Ace e Smash */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    disabled={currentServer !== 2}
                    onPress={() => {
                      if (currentServer !== 2) return;
                      addPoint({ type: 'ace', winner: 2 });
                    }}
                    style={[
                      styles.eventBtn,
                      styles.aceBtn,
                      currentServer !== 2 && styles.eventBtnDisabled,
                      isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventBtnText,
                        styles.aceBtnText,
                        currentServer !== 2 && styles.eventBtnTextDisabled,
                        isSmallScreen && { fontSize: 9.5 },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      ⚡ Ace ({p2Aces})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'smash', winner: 2 })}
                    style={[styles.eventBtn, styles.smashBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.smashBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      💥 Smash ({p2Smashes})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Riga 2: Difesa e Punto Culo */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'defense', winner: 2 })}
                    style={[styles.eventBtn, styles.defenseBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.defenseBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      🛡️ Difesa ({p2Defenses})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'luck', winner: 2 })}
                    style={[styles.eventBtn, styles.luckBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.luckBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      🍀 Culo ({p2LuckPoints || (p2Edges + p2Nets)})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Riga 3: Punto Stile e Fallo */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => addPoint({ type: 'style', winner: 2 })}
                    style={[styles.eventBtn, styles.styleBtn, isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 }]}
                  >
                    <Text style={[styles.eventBtnText, styles.styleBtnText, isSmallScreen && { fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="tail">
                      ✨ Stile ({p2StylePoints})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={currentServer !== 2}
                    onPress={() => {
                      if (currentServer !== 2) return;
                      addPoint({ type: 'serve_error', faultPlayer: 2 });
                    }}
                    style={[
                      styles.eventBtn,
                      styles.faultBtn,
                      currentServer !== 2 && styles.eventBtnDisabled,
                      isSmallScreen && { paddingVertical: 6, paddingHorizontal: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventBtnText,
                        styles.faultBtnText,
                        currentServer !== 2 && styles.eventBtnTextDisabled,
                        isSmallScreen && { fontSize: 9.5 },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      ❌ Fallo ({p2ServeErrors})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.spectatorStatsSummary}>
                <Text style={[styles.spectatorStatChip, styles.aceChip]} numberOfLines={1} ellipsizeMode="tail">⚡ Ace: {p2Aces}</Text>
                <Text style={[styles.spectatorStatChip, styles.smashChip]} numberOfLines={1} ellipsizeMode="tail">💥 Smash: {p2Smashes}</Text>
                <Text style={[styles.spectatorStatChip, styles.defenseChip]} numberOfLines={1} ellipsizeMode="tail">🛡️ Difese: {p2Defenses}</Text>
                <Text style={[styles.spectatorStatChip, styles.luckChip]} numberOfLines={1} ellipsizeMode="tail">🍀 Culo: {p2LuckPoints || (p2Edges + p2Nets)}</Text>
                <Text style={[styles.spectatorStatChip, styles.styleChip]} numberOfLines={1} ellipsizeMode="tail">✨ Stile: {p2StylePoints}</Text>
                <Text style={[styles.spectatorStatChip, styles.faultChip]} numberOfLines={1} ellipsizeMode="tail">❌ Falli: {p2ServeErrors}</Text>
                {p2MatchPointsSaved > 0 && (
                  <Text style={[styles.spectatorStatChip, styles.mpSavedChip]} numberOfLines={1} ellipsizeMode="tail">🧱 MP Salvati: {p2MatchPointsSaved}</Text>
                )}
              </View>
            )}
          </View>
        </View>


        {/* Special Event Celebration Banner Overlay */}
        {activeCelebrationEvent && (
          <LiveEventCelebrationBanner
            event={activeCelebrationEvent}
            onDone={() => setActiveCelebrationEvent(null)}
          />
        )}

        {/* Pulsante BET Circolare e Prominente */}
        <View style={styles.circularBetBar}>
          <TouchableOpacity
            style={[styles.circularBetBtn, isBetOpen && styles.circularBetBtnActive]}
            onPress={() => {
              soundEffects.playCoinSound();
              if (!isBetOpen && score1 + score2 < 6) {
                setBetMode('pre_match');
              }
              setIsBetOpen(!isBetOpen);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.circularBetIcon}>🎲</Text>
            <Text style={styles.circularBetLabel}>BET</Text>
            {betsList.length > 0 && (
              <View style={styles.circularBetBadge}>
                <Text style={styles.circularBetBadgeText}>{betsList.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Drawer Riunione Bet 🎰 */}
        {isBetOpen && (
          <View style={styles.betDrawer}>
            <View style={styles.betDrawerHeader}>
              <View style={styles.betDrawerTitleRow}>
                <Text style={styles.betDrawerIcon}>🎰</Text>
                <View>
                  <Text style={styles.betDrawerTitle}>Riunione Bet</Text>
                  <Text style={styles.betDrawerSubtitle}>
                    Saldo:{' '}
                    <Text style={{ color: '#FACC15', fontWeight: '900' }}>
                      🪙 {associatedPlayer?.coins ?? STARTING_COINS} LUL Coins
                    </Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  soundEffects.playButtonTap();
                  setIsBetOpen(false);
                }}
                style={styles.chatCloseBtn}
              >
                <Text style={styles.chatCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.betDrawerScroll} contentContainerStyle={styles.betDrawerContent}>
              {/* Selettore Modalità: Live Dinamica vs Pre-Match */}
              <View style={styles.betModeSelector}>
                <TouchableOpacity
                  style={[styles.betModeTab, betMode === 'live_dynamic' && styles.betModeTabActive]}
                  onPress={() => {
                    soundEffects.playButtonTap();
                    setBetMode('live_dynamic');
                  }}
                >
                  <Text style={[styles.betModeTabText, betMode === 'live_dynamic' && styles.betModeTabTextActive]}>
                    ⚡ Live Dinamica (In-Play)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.betModeTab, betMode === 'pre_match' && styles.betModeTabActive]}
                  onPress={() => {
                    soundEffects.playButtonTap();
                    setBetMode('pre_match');
                  }}
                >
                  <Text style={[styles.betModeTabText, betMode === 'pre_match' && styles.betModeTabTextActive]}>
                    🟢 Pre-Match {isPreMatchOpen ? '✓' : '🔒'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Descrizione Modalità */}
              <View style={styles.betInfoBox}>
                <Text style={styles.betInfoText}>
                  {betMode === 'live_dynamic'
                    ? '⚡ Quote in tempo reale! Variano punto dopo punto: se punti sulla rimonta e si avvera, la quota congelata ti fa vincere una marea di LUL Coins!'
                    : isPreMatchOpen
                    ? `🟢 Quota fissa pre-match basata sull'Elo di partenza. Si chiude al 6° punto totale (${score1 + score2}/6 giocati).`
                    : '🔒 Scommesse Pre-Match chiuse (superato il 5° punto). Usa la scheda "⚡ Live Dinamica" per scommettere sul finale!'}
                </Text>
              </View>

              {/* Regola Ferrea Anti-Biscotto vs Selezione Mercati Multipli */}
              {isPlayingInMatch ? (
                <View style={styles.antiBiscottoNotice}>
                  <Text style={styles.antiBiscottoIcon}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.antiBiscottoTitle}>Regola Ferrea Anti-Biscotto</Text>
                    <Text style={styles.antiBiscottoDesc}>
                      Sei un giocatore in campo! Puoi scommettere esclusivamente sulla tua vittoria personale.
                    </Text>
                  </View>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marketTabsScroll}>
                  {allMarkets.map((mkt) => {
                    const isSelected = selectedMarketType === mkt.type;
                    return (
                      <TouchableOpacity
                        key={mkt.type}
                        onPress={() => {
                          soundEffects.playButtonTap();
                          setSelectedMarketType(mkt.type);
                          setSelectedSelection(mkt.options[0].selection);
                        }}
                        style={[styles.multiMarketTab, isSelected && styles.multiMarketTabActive]}
                      >
                        <Text style={[styles.multiMarketTabText, isSelected && styles.multiMarketTabTextActive]}>
                          {mkt.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Opzioni del mercato attivo */}
              <View style={styles.marketOptionsGrid}>
                {activeMarket.options.map((opt) => {
                  const isSelected =
                    (isPlayingInMatch ? String(mySide) : selectedSelection) === opt.selection;
                  const isLockedForPlayer = isPlayingInMatch && opt.selection !== String(mySide);

                  return (
                    <TouchableOpacity
                      key={opt.selection}
                      disabled={isLockedForPlayer}
                      onPress={() => {
                        soundEffects.playCoinSound();
                        setSelectedSelection(opt.selection);
                      }}
                      style={[
                        styles.marketOptionCard,
                        isSelected && styles.marketOptionCardActive,
                        isLockedForPlayer && { opacity: 0.35 },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.marketOptionLabel, isSelected && styles.marketOptionLabelActive]}>
                        {opt.label}
                      </Text>
                      <View style={[styles.marketOddsPill, isSelected && styles.marketOddsPillActive]}>
                        <Text style={[styles.marketOddsPillText, isSelected && styles.marketOddsPillTextActive]}>
                          {opt.odds.toFixed(2)}x
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Azione di Puntata */}
              {!isGameOver && (betMode === 'live_dynamic' || isPreMatchOpen) ? (
                <View style={styles.betActionSection}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.betActionTitle}>
                      Puntata su{' '}
                      <Text style={{ color: '#FACC15', fontWeight: '900' }}>
                        {activeOption.label}
                      </Text>{' '}
                      (Quota {selectedOdds.toFixed(2)}x)
                    </Text>
                    {hasBooster && (
                      <View style={styles.boosterActiveBadge}>
                        <Text style={styles.boosterActiveText}>⚡ BOOSTER QUOTA 2X ATTIVO! Profitto netto raddoppiato!</Text>
                      </View>
                    )}
                  </View>

                  {/* Chips rapide */}
                  <View style={styles.betChipsRow}>
                    {[10, 25, 50, 100].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[styles.betChip, betAmount === amt && styles.betChipActive]}
                        onPress={() => {
                          soundEffects.playCoinSound();
                          setBetAmount(amt);
                        }}
                      >
                        <Text style={[styles.betChipText, betAmount === amt && styles.betChipTextActive]}>
                          {amt} 🪙
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.betChip, styles.betChipAllIn]}
                      onPress={() => {
                        soundEffects.playCoinSound();
                        const userCoins = associatedPlayer?.coins ?? STARTING_COINS;
                        setBetAmount(Math.max(1, userCoins));
                      }}
                    >
                      <Text style={styles.betChipAllInText}>ALL-IN 💥</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.payoutSummaryBox}>
                    <Text style={styles.payoutSummaryLabel}>
                      Puntata: <Text style={{ color: '#FACC15', fontWeight: '800' }}>{betAmount} 🪙</Text>
                    </Text>
                    <Text style={styles.payoutSummaryVal}>
                      Vincita: <Text style={{ color: '#10B981', fontWeight: '900' }}>+{potentialWin} 🪙</Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.placeBetBtn, isSubmittingBet && { opacity: 0.6 }]}
                    onPress={handlePlaceBet}
                    disabled={isSubmittingBet}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.placeBetBtnText}>
                      {isSubmittingBet ? 'Piazzamento in corso...' : `🎰 PIAZZA BET (${betAmount} LUL Coins)`}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isGameOver ? (
                <View style={styles.betClosedBox}>
                  <Text style={styles.betClosedText}>🏆 Partita Conclusa - Scommesse Risolte</Text>
                </View>
              ) : (
                <View style={styles.betClosedBox}>
                  <Text style={styles.betClosedText}>🔒 Scommesse Pre-Match Chiuse. Passa alla scheda "Live Dinamica"!</Text>
                </View>
              )}

              {/* Le mie scommesse su questa partita */}
              {myBets.length > 0 && (
                <View style={styles.myBetsSection}>
                  <Text style={styles.myBetsTitle}>✅ Le tue Scommesse in questo match ({myBets.length}):</Text>
                  {myBets.map((b) => {
                    const targetLabel = b.selectionLabel || (b.betOnPlayer === 1 ? player1.name : player2.name);
                    return (
                      <View key={b.id} style={styles.myBetCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.myBetTargetText}>
                            🎯 {targetLabel} @ <Text style={{ color: '#FACC15', fontWeight: '900' }}>{b.odds.toFixed(2)}x</Text>
                          </Text>
                          <View style={[styles.myBetTypeBadge, b.type === 'live_dynamic' && { backgroundColor: 'rgba(234, 179, 8, 0.2)' }]}>
                            <Text style={styles.myBetTypeBadgeText}>
                              {b.type === 'live_dynamic' ? `⚡ Live (${b.scoreAtBet})` : '🟢 Pre-Match'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.myBetAmountText}>
                          Puntati: <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{b.amount} 🪙</Text> • Vincita: <Text style={{ color: '#10B981', fontWeight: '900' }}>{b.potentialPayout} 🪙</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Feed Scommesse di Tutti gli Spettatori */}
              {betsList.length > 0 && (
                <View style={styles.allBetsSection}>
                  <Text style={styles.allBetsTitle}>👥 Tutte le Scommesse della Riunione ({betsList.length}):</Text>
                  {betsList.map((b) => {
                    const targetLabel = b.selectionLabel || (b.betOnPlayer === 1 ? player1.name : player2.name);
                    const labelColor = b.betOnPlayer === 1 ? p1Color : b.betOnPlayer === 2 ? p2Color : '#FACC15';
                    return (
                      <View key={b.id} style={styles.spectatorBetRow}>
                        <Text style={styles.spectatorBetAvatar}>{b.bettorAvatar || '🕶️'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.spectatorBetText}>
                            <Text style={{ fontWeight: '800', color: Colors.textPrimary }}>{b.bettorName}</Text> ha puntato <Text style={{ color: '#FACC15', fontWeight: '900' }}>{b.amount} 🪙</Text> su <Text style={{ fontWeight: '800', color: labelColor }}>{targetLabel}</Text> @ {b.odds.toFixed(2)}x
                          </Text>
                          <Text style={styles.spectatorBetSub}>
                            {b.type === 'live_dynamic' ? `⚡ Live In-Game (${b.scoreAtBet})` : '🟢 Pre-Match'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Footer con Azione di Fine Partita */}
        <View style={styles.bottomBar}>
          {isGuardia ? (
            isGameOver ? (
              <TouchableOpacity onPress={handleFinish} style={styles.finishBtnActive}>
                <Text style={styles.finishBtnText}>🏆 REGISTRA PARTITA & SALVA ELO</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleFinish} style={styles.finishBtnEarly}>
                <Text style={styles.finishBtnEarlyText}>
                  🏁 Termina Arbitraggio ({score1} - {score2})
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.spectatorBottomNotice}>
              <Text style={styles.spectatorBottomNoticeText}>
                🕶️ Sei 'Ndranghetista • La Guardia ({guardiaName}) sta arbitrando il match
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  exitBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  exitBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  targetPicker: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 3,
  },
  targetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  targetChipActive: {
    backgroundColor: Colors.primary,
  },
  targetChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  targetChipTextActive: {
    color: Colors.textDark,
    fontWeight: '900',
  },
  undoBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  undoBtnText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  serverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  serverEmoji: {
    fontSize: 16,
  },
  serverText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  matchPointBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  matchPointText: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deuceBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deuceText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '900',
  },
  gameOverBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  gameOverText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreboardRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  playerColumn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 4,
  },
  playerAvatar: {
    fontSize: 32,
    marginBottom: 2,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  serverBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  serverBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  bigScoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 20,
    paddingVertical: 20,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bigScoreNumber: {
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  tapToScoreText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  ballContestBanner: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  ballContestTitle: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ballContestSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  ballContestBtnRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  ballContestBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  ballContestBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  ballContestWaitingText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  actionGrid: {
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  eventBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  eventBtnText: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  aceBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.28)',
    borderColor: '#C084FC',
  },
  aceBtnText: {
    color: '#F0ABFC',
  },
  smashBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
    borderColor: '#F87171',
  },
  smashBtnText: {
    color: '#FCA5A5',
  },
  edgeBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
    borderColor: '#34D399',
  },
  edgeBtnText: {
    color: '#6EE7B7',
  },
  netBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.28)',
    borderColor: '#60A5FA',
  },
  netBtnText: {
    color: '#93C5FD',
  },
  defenseBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.28)',
    borderColor: '#22D3EE',
  },
  defenseBtnText: {
    color: '#67E8F9',
  },
  luckBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
    borderColor: '#10B981',
  },
  luckBtnText: {
    color: '#6EE7B7',
  },
  styleBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: '#A855F7',
  },
  styleBtnText: {
    color: '#E9D5FF',
  },
  faultBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
    borderColor: '#EF4444',
  },
  faultBtnText: {
    color: '#FCA5A5',
  },
  centerDivider: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  vsText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  bottomBar: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  finishBtnActive: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  finishBtnText: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  finishBtnEarly: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  finishBtnEarlyText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  // Role Banner
  roleBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  guardiaBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guardiaBadgeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ndranghetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ndranghetaBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ndranghetaBadgeText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  guardiaInfoText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  claimGuardiaBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  claimGuardiaBtnText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
  },
  spectatorStatsSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  spectatorStatChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  aceChip: {
    color: '#F0ABFC',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  smashChip: {
    color: '#FCA5A5',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  edgeChip: {
    color: '#6EE7B7',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  netChip: {
    color: '#93C5FD',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  defenseChip: {
    color: '#67E8F9',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  luckChip: {
    color: '#6EE7B7',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  styleChip: {
    color: '#FDE047',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  faultChip: {
    color: '#FDE047',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  mpSavedChip: {
    color: '#FECACA',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    fontWeight: '900',
  },
  bigScoreBoxSpectator: {
    opacity: 0.9,
  },
  spectatorBottomNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  spectatorBottomNoticeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Floating Emojis
  floatingEmojiWrapper: {
    position: 'absolute',
    bottom: 110,
    zIndex: 9999,
    alignItems: 'center',
  },
  floatingEmojiText: {
    fontSize: 54,
  },
  floatingSenderBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  floatingSenderText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  // Live Report Button
  liveReportBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveReportBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800',
  },

  // Circular BET Bar & Button
  circularBetBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  circularBetBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderWidth: 2,
    borderColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  circularBetBtnActive: {
    backgroundColor: '#FACC15',
    borderColor: '#FEF08A',
    transform: [{ scale: 1.05 }],
  },
  circularBetIcon: {
    fontSize: 22,
    marginTop: -2,
  },
  circularBetLabel: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: -2,
  },
  circularBetBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  circularBetBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  chatCloseBtn: {
    padding: 6,
  },
  chatCloseBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  // Special Event Celebration Banner Overlay
  celebrationOverlay: {
    position: 'absolute',
    top: '38%',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  celebrationCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 22,
    borderWidth: 2.5,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  celebrationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  celebrationAvatar: {
    fontSize: 36,
  },
  celebrationTitleBlock: {
    flex: 1,
  },
  celebrationTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  celebrationSubtitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  eventBtnDisabled: {
    opacity: 0.25,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
  // Bet Toggle Button
  betToggleBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  betToggleBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  betToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
  },
  betToggleBtnTextActive: {
    color: '#000',
  },
  // Bet Drawer
  betDrawer: {
    maxHeight: 380,
    backgroundColor: '#0F172A',
    borderTopWidth: 2,
    borderTopColor: '#F59E0B',
    padding: 10,
  },
  betDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  betDrawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  betDrawerIcon: {
    fontSize: 22,
  },
  betDrawerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  betDrawerSubtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  betDrawerScroll: {
    maxHeight: 320,
  },
  betDrawerContent: {
    paddingVertical: 8,
    gap: 10,
  },
  betModeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  betModeTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  betModeTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  betModeTabText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  betModeTabTextActive: {
    color: '#FDE047',
    fontWeight: '900',
  },
  betInfoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  betInfoText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
  },
  oddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  oddsCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  oddsAvatar: {
    fontSize: 22,
    marginBottom: 2,
  },
  oddsName: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  oddsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  oddsBadgeMultiplier: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  oddsProbText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  oddsVsBox: {
    paddingHorizontal: 4,
  },
  oddsVsText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
  },
  betActionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  betActionTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  betChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  betChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  betChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  betChipText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  betChipTextActive: {
    color: '#FDE047',
    fontWeight: '900',
  },
  betChipAllIn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  betChipAllInText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '900',
  },
  payoutSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 8,
    borderRadius: 8,
  },
  payoutSummaryLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  payoutSummaryVal: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  placeBetBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBetBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  betClosedBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  betClosedText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  myBetsSection: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  myBetsTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  myBetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  myBetTargetText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  myBetTypeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  myBetTypeBadgeText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    fontWeight: '700',
  },
  myBetAmountText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  allBetsSection: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  allBetsTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  spectatorBetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 6,
    borderRadius: 6,
  },
  spectatorBetAvatar: {
    fontSize: 16,
  },
  spectatorBetText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  spectatorBetSub: {
    color: Colors.textMuted,
    fontSize: 9.5,
  },
  antiBiscottoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  antiBiscottoIcon: {
    fontSize: 24,
  },
  antiBiscottoTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 2,
  },
  antiBiscottoDesc: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },
  marketTabsScroll: {
    marginBottom: 10,
  },
  multiMarketTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 6,
  },
  multiMarketTabActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  multiMarketTabText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  multiMarketTabTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  marketOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  marketOptionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  marketOptionCardActive: {
    borderColor: '#FACC15',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 2,
  },
  marketOptionLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  marketOptionLabelActive: {
    color: '#FACC15',
  },
  marketOddsPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  marketOddsPillActive: {
    backgroundColor: '#FACC15',
  },
  marketOddsPillText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '900',
  },
  marketOddsPillTextActive: {
    color: '#0F172A',
  },
  boosterActiveBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  boosterActiveText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  playerEquippedTitle: {
    fontSize: 10,
    color: '#FACC15',
    fontWeight: '800',
    marginTop: 1,
    textAlign: 'center',
  },
});
