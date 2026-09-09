export interface Player {
  id: string;
  name: string;
  avatar: string; // Emoji default
  customAvatarUrl?: string; // Optional custom image / GIF URL
  profileBanner?: string; // Optional profile background image or GIF URL
  celebrationGifUrl?: string; // GIF to spawn on Elo milestone
  color: string; // Accent color hex
  elo: number;
  initialElo: number;
  wins: number;
  losses: number;
  currentStreak: number; // Positive for wins (3 = 3W), negative for losses (-2 = 2L)
  catchphrase: string; // Frase celebre / motto
  tags: string[]; // Badge comici (es. "Re della Schiacciata", "Il Muro")
  highestElo: number;
  lowestElo: number;
  lastCrossedThreshold?: number; // E.g. 1250, 1300...
  racePoints?: number; // Punti ATP Race della stagione
  lastMatchTimestamp?: number; // Timestamp dell'ultima partita disputata
  coins?: number; // Bilancio LUL Coins (default 200)
  betsWon?: number; // Numero di scommesse vinte
  betsLost?: number; // Numero di scommesse perse
  coinsWonOnBets?: number; // Guadagno o perdita netta da scommesse
  lastBailoutAt?: number; // Timestamp dell'ultimo sussidio di povertà riscosso
  inventory?: string[]; // ID degli oggetti acquistati al Bazar
  equippedTitle?: string; // Titolo onorario equipaggiato (es. "🎯 Il Cecchino")
  equippedBorder?: string; // ID cornice neon/aura equipaggiata (es. "border_gold")
  hasBetInsurance?: boolean; // Se ha un token assicurazione attivo per la prossima scommessa
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'title' | 'border' | 'perk' | 'mystery';
  icon: string;
  previewColor?: string;
}

export interface LiveBet {
  id: string;
  type: 'pre_match' | 'live_dynamic';
  bettorId: string;
  bettorName: string;
  bettorAvatar: string;
  betOnPlayer: 1 | 2;
  amount: number;
  odds: number;
  scoreAtBet: string; // e.g. "Pre-match" o "10 - 18"
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost';
  timestamp: number;
}

export interface MatchComment {
  id: string;
  matchId: string;
  playerId: string; // Who wrote the comment (associated player ID or referee)
  authorName?: string;
  authorAvatar?: string;
  text: string;
  gifUrl?: string;
  timestamp: number;
}

export interface MatchLiveStats {
  player1Edges: number; // Spigoli P1
  player2Edges: number; // Spigoli P2
  player1Nets: number; // Retine P1
  player2Nets: number; // Retine P2
  player1Smashes: number; // Schiacciate vincenti P1
  player2Smashes: number; // Schiacciate vincenti P2
  player1ServeErrors: number; // Errori in battuta P1
  player2ServeErrors: number; // Errori in battuta P2
  player1Aces?: number; // Ace vincenti P1
  player2Aces?: number; // Ace vincenti P2
  player1Defenses?: number; // Punti strappati in difesa P1
  player2Defenses?: number; // Punti strappati in difesa P2
  player1StylePoints?: number; // Punti stile realizzati P1
  player2StylePoints?: number; // Punti stile realizzati P2
  player1LuckPoints?: number; // Punti culo (retine + spigoli) P1
  player2LuckPoints?: number; // Punti culo (retine + spigoli) P2
  player1MatchPointsSaved?: number; // Match point annullati P1
  player2MatchPointsSaved?: number; // Match point annullati P2
  player1PointsOnServe?: number; // Punti totali realizzati su proprio servizio P1
  player2PointsOnServe?: number; // Punti totali realizzati su proprio servizio P2
  ballContestWinner?: 1 | 2; // Vincitore contesa iniziale "Per la palla"
  player1TotalServes?: number; // Battute totali effettuate P1
  player2TotalServes?: number; // Battute totali effettuate P2
  targetPoints?: 11 | 21;
}

export interface Match {
  id: string;
  timestamp: number;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  winnerId: string;
  loserId: string;
  player1EloBefore: number;
  player2EloBefore: number;
  player1EloAfter: number;
  player2EloAfter: number;
  eloDelta: number; // Points exchanged (or average)
  winnerEloDelta?: number; // Asymmetric gain for winner
  loserEloDelta?: number; // Asymmetric loss for loser
  note?: string;
  isFriendly?: boolean; // If true, delta = 0
  environmentalModifiers?: string[]; // e.g. 'wind', 'dark', 'derby'
  player1Modifiers?: string[]; // e.g. 'borrowed_racket', 'beer'
  player2Modifiers?: string[];
  reactions?: Record<string, string[]>; // emoji -> array of playerIds who reacted
  comments?: MatchComment[];
  stats?: MatchLiveStats; // Live game event statistics
  p1RacePointsDelta?: number; // Punti ATP guadagnati da P1
  p2RacePointsDelta?: number; // Punti ATP guadagnati da P2
  bets?: Record<string, LiveBet>; // Scommesse piazzate su questo match
}

export interface ActiveLiveMatch {
  id: string;
  leagueId: string;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  targetPoints: 11 | 21;
  server: 1 | 2;
  servesRemaining: number;
  isGameOver: boolean;
  winnerId?: string;
  startedAt: number;
  refereeUid: string;
  refereePlayerName: string;
  comments: MatchComment[];
  reactions: Record<string, number>; // emoji -> total count
  recentReaction?: {
    id: string;
    emoji: string;
    senderName: string;
    senderUid?: string;
    timestamp: number;
  };
  recentEvent?: LiveMatchSpecialEvent;
  stats?: MatchLiveStats;
  ballContestDone?: boolean;
  bets?: Record<string, LiveBet>; // Scommesse live piazzate
}

export interface LiveMatchSpecialEvent {
  id: string;
  type: 'ace' | 'smash' | 'defense' | 'luck' | 'style' | 'edge' | 'net' | 'match_point_saved';
  title: string;
  subtitle: string;
  playerAvatar: string;
  playerName: string;
  color?: string;
  timestamp: number;
}

export interface SeasonPodium {
  firstPlayerId: string;
  secondPlayerId: string;
  thirdPlayerId: string;
  woodenSpoonPlayerId: string; // Ultimo classificato (Cucchiaio di Legno)
  atpRaceWinnerPlayerId?: string; // Vincitore ATP Race Stagionale
}

export interface Season {
  id: string;
  number: number;
  name: string; // e.g. "Stagione 1 - Primavera 2026"
  status: 'active' | 'archived';
  startDate: number;
  endDate?: number;
  podium?: SeasonPodium;
  matchesCount: number;
}

export interface CustomTag {
  id: string;
  emoji: string;
  text: string;
}

export interface LeagueMember {
  uid: string;
  email: string;
  playerId?: string;
  role: 'admin' | 'member';
  joinedAt: number;
}

export interface League {
  id: string; // e.g. "meeting_abc123"
  name: string; // Nome della Riunione Segreta
  code: string; // Codice segreto a 6 caratteri, es. "PONG26"
  adminUid: string; // UID del Capo Riunione Segreta
  maxPlayers: number; // Numero massimo di partecipanti ammessi
  createdAt: number;
  currentSeasonId: string;
  seasons: Season[];
  players: Player[];
  matches: Match[];
  customTags?: CustomTag[];
  members?: Record<string, LeagueMember>;
  activeLiveMatch?: ActiveLiveMatch; // Partita live attualmente in corso
}

export type SpecialTrophyId =
  | 'first_serve_master'   // "Buona la prima" (più alta % prime battute a segno)
  | 'corner_saver'         // "Salvato in corner" (più spigoli)
  | 'lucky_bastard'        // "Culo sfondato" (più punti net + spigoli)
  | 'no_hands'             // "Senza mani" (più falli al servizio)
  | 'smash_king'           // "Re dello smash" (più schiacciate)
  | 'ace_king'             // "Re dell'Ace" (più ace vincenti)
  | 'match_point_saver'    // "Cuore d'Acciaio" (più match point annullati)
  | 'iron_defense'         // "Difesa d'Acciaio" (più punti vinti in difesa)
  | 'style_master'         // "Pura Classe" (più punti stile realizzati)
  | 'ball_contest_master'  // "Mia!" (più contese iniziali vinte)
  | 'ball_contest_loser'   // "Tua!" (più contese iniziali perse)
  | 'wooden_spoon';        // "Cucchiaio di legno" (ultimo in Elo)

export interface SpecialTrophy {
  id: SpecialTrophyId;
  title: string;
  icon: string;
  memeSubtitle: string;
  winnerPlayerId?: string;
  winnerPlayerName?: string;
  winnerPlayerAvatar?: string;
  statValue: string;
  description: string;
}

export type SecretMeeting = League;

export interface AuthUserProfile {
  uid: string;
  email: string;
  associatedPlayerId?: string;
  joinedLeagueIds: string[];
  activeLeagueId: string;
}

export interface EloCalculationResult {
  winnerEloBefore: number;
  loserEloBefore: number;
  winnerEloAfter: number;
  loserEloAfter: number;
  delta: number;
  winnerDelta: number;
  loserDelta: number;
  expectedWinnerWinProb: number;
}

export interface HeadToHeadStats {
  player1Id: string;
  player2Id: string;
  player1Wins: number;
  player2Wins: number;
  totalMatches: number;
  player1WinRate: number;
  lastMatches: Match[];
}

export type ReportCategory = 'bug' | 'feature' | 'match_dispute' | 'general';

export interface ReportSubmission {
  id: string;
  authorUid: string;
  authorEmail: string;
  authorPlayerName: string;
  authorPlayerAvatar: string;
  leagueId: string;
  leagueName: string;
  category: ReportCategory;
  categoryLabel: string;
  title: string;
  description: string;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  notes?: string;
}


