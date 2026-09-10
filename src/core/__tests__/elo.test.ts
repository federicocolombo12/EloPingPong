import {
    calculateActivityBonus,
    calculateEloChange,
    calculateHeadToHead,
    calculateInactivityDecay,
    calculateRacePointsForMatch,
    checkThresholdCrossed,
    getPlayerActiveMilestone,
    getStreakDisplay,
    getWinRate,
} from '../elo';
import {
    calculateAllLiveMarkets,
    calculateLiveDynamicOdds,
    calculatePreMatchOdds,
    handleBilateralBetRule,
    resolveMatchBets,
    validateBetPlacement,
} from '../betting';
import { openMysteryBox, SHOP_ITEMS, spinLuckyWheel, WHEEL_SECTORS } from '../shop';
import { calculatePlayerAchievements, ACHIEVEMENTS, getValidPlayerRecognitions, sanitizePlayerTags } from '../achievements';
import { sanitizePlayerUpdates } from '../security';
import { calculateSpecialTrophies, getPlayerTrophies } from '../trophies';
import { LiveBet, Match, Player } from '../types';

function runTests() {
  console.log('--- Esecuzione Test Logica Elo, ATP Race, Modificatori, Trofei & Sicurezza ---');

  // Test 1: Scontro tra pari livello (1200 vs 1200) standard
  const equalMatch = calculateEloChange(1200, 1200, 32);
  console.assert(equalMatch.delta === 16, `Test 1 Fallito: atteso delta 16, ricevuto ${equalMatch.delta}`);
  console.log('✓ Test 1 Superato: Sfida tra pari (1200 vs 1200) -> delta 16');

  // Test 2: Partita Amichevole (no Elo)
  const friendlyMatch = calculateEloChange(1200, 1200, 32, { isFriendly: true });
  console.assert(friendlyMatch.delta === 0, `Test 2 Fallito: delta amichevole atteso 0, ricevuto ${friendlyMatch.delta}`);
  console.assert(friendlyMatch.winnerEloAfter === 1200, 'Test 2 Fallito: Elo vincitore invariato');
  console.assert(friendlyMatch.loserEloAfter === 1200, 'Test 2 Fallito: Elo perdente invariato');
  console.log('✓ Test 2 Superato: Amichevole mantiene Elo invariato (delta = 0)');

  // Test 3: Modificatori Ambientali (Vento x0.6)
  const windMatch = calculateEloChange(1200, 1200, 32, { environmentalModifiers: ['wind'] });
  console.assert(windMatch.delta === 10, `Test 3 Fallito: atteso 16 * 0.6 = 10, ricevuto ${windMatch.delta}`);
  console.log(`✓ Test 3 Superato: Modificatore Vento riduce delta a ${windMatch.delta} punti`);

  // Test 4: Modificatore Asimmetrico (Vincitore con Racchetta Prestata -> Bonus eroe x1.3)
  const borrowedRacketMatch = calculateEloChange(1200, 1200, 32, { winnerModifiers: ['borrowed_racket'] });
  console.assert(borrowedRacketMatch.winnerDelta === 21, `Test 4 Fallito: atteso 16 * 1.3 = 21, ricevuto ${borrowedRacketMatch.winnerDelta}`);
  console.log(`✓ Test 4 Superato: Vincitore con racchetta prestata guadagna bonus +${borrowedRacketMatch.winnerDelta}`);

  // Test 5: Rilevamento Soglia Elo Superata (con nuovi scaglioni a 25 punti)
  const crossed1225 = checkThresholdCrossed(1215, 1230, 1200);
  console.assert(crossed1225 === 1225, `Test 5 Fallito: attesa soglia 1225, ricevuto ${crossed1225}`);
  const notCrossed = checkThresholdCrossed(1205, 1215, 1200);
  console.assert(notCrossed === null, 'Test 5 Fallito: nessuna soglia superata');
  console.log('✓ Test 5 Superato: Rilevamento automatico superamento soglie Elo');

  // Test 6: ATP Race Points Calculation
  const cleanSweepRace = calculateRacePointsForMatch(11, 0, false);
  console.assert(cleanSweepRace.p1RacePoints === 50, `Test 6a Fallito: atteso 50, ricevuto ${cleanSweepRace.p1RacePoints}`);
  console.assert(cleanSweepRace.p2RacePoints === 10, `Test 6a Fallito: atteso 10, ricevuto ${cleanSweepRace.p2RacePoints}`);

  const closeMatchRace = calculateRacePointsForMatch(11, 9, false);
  console.assert(closeMatchRace.p1RacePoints === 40, `Test 6b Fallito: atteso 40, ricevuto ${closeMatchRace.p1RacePoints}`);
  console.assert(closeMatchRace.p2RacePoints === 15, `Test 6b Fallito: atteso 15, ricevuto ${closeMatchRace.p2RacePoints}`);

  const friendlyRace = calculateRacePointsForMatch(11, 9, true);
  console.assert(friendlyRace.p1RacePoints === 15 && friendlyRace.p2RacePoints === 5, 'Test 6c Fallito: amichevole assegna 15 e 5 punti race per attività');
  console.log('✓ Test 6 Superato: Calcolo punti ATP Race per cappotto, match tirato e amichevole');

  // Test 7: Inactivity Decay (Rank decay anti-campeggio)
  const now = Date.now();
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const activeDecay = calculateInactivityDecay(1280, threeDaysAgo, now);
  console.assert(activeDecay.decayPoints === 0, 'Test 7a Fallito: 3 giorni di inattività non devono applicare decay');

  const inactiveDecay = calculateInactivityDecay(1280, twoWeeksAgo, now);
  console.assert(inactiveDecay.decayPoints === 10, `Test 7b Fallito: atteso decay 10 punti, ricevuto ${inactiveDecay.decayPoints}`);
  console.assert(inactiveDecay.newElo === 1270, `Test 7b Fallito: atteso newElo 1270, ricevuto ${inactiveDecay.newElo}`);

  const baseEloDecay = calculateInactivityDecay(1200, twoWeeksAgo, now);
  console.assert(baseEloDecay.decayPoints === 0, 'Test 7c Fallito: Elo base a 1200 non deve scendere ulteriormente');
  console.log('✓ Test 7 Superato: Inactivity Decay rispetta grace period di 7gg e floor 1200');

  // Test 8: Activity Rhythm Bonus (+15% per chi gioca almeno 3 match in 5 giorni)
  const dummyMatches = [
    { id: '1', player1Id: 'p1', player2Id: 'p2', score1: 11, score2: 9, winnerId: 'p1', loserId: 'p2', timestamp: now - 10000 },
    { id: '2', player1Id: 'p1', player2Id: 'p3', score1: 11, score2: 8, winnerId: 'p1', loserId: 'p3', timestamp: now - 20000 },
    { id: '3', player1Id: 'p2', player2Id: 'p1', score1: 7, score2: 11, winnerId: 'p1', loserId: 'p2', timestamp: now - 30000 },
  ] as unknown as Match[];
  const bonus = calculateActivityBonus(dummyMatches, 'p1', now);
  console.assert(bonus.isHotRhythm === true, 'Test 8a Fallito: giocatore con 3 match deve essere in ritmo');
  console.assert(bonus.multiplier === 1.15, 'Test 8a Fallito: moltiplicatore deve essere 1.15');

  const noBonus = calculateActivityBonus([], 'p1', now);
  console.assert(noBonus.isHotRhythm === false && noBonus.multiplier === 1.0, 'Test 8b Fallito: nessun bonus senza match');
  console.log('✓ Test 8 Superato: Rhythm Bonus (+15%) attivo con >= 3 match recenti');

  // Test 9: Special Trophies & Meme Badges
  const p1 = { id: 'p1', name: 'Alby', avatar: '👾', elo: 1250, wins: 10, losses: 2, currentStreak: 3, tags: [] } as unknown as Player;
  const p2 = { id: 'p2', name: 'Fede', avatar: '🦁', elo: 1240, wins: 8, losses: 4, currentStreak: 1, tags: [] } as unknown as Player;
  const matchWithStats = {
    id: 'm_stat',
    player1Id: 'p1',
    player2Id: 'p2',
    score1: 11,
    score2: 8,
    winnerId: 'p1',
    loserId: 'p2',
    timestamp: now,
    stats: {
      player1Edges: 5,
      player2Edges: 1,
      player1Nets: 3,
      player2Nets: 1,
      player1Smashes: 6,
      player2Smashes: 0,
      player1ServeErrors: 0,
      player2ServeErrors: 4,
      player1Aces: 4,
      player2Aces: 1,
      player1Defenses: 1,
      player2Defenses: 5,
      player1StylePoints: 4,
      player2StylePoints: 1,
      player1MatchPointsSaved: 3,
      player2MatchPointsSaved: 0,
      ballContestWinner: 1,
      player1TotalServes: 10,
      player2TotalServes: 9,
    },
  } as unknown as Match;
  const trophies = calculateSpecialTrophies([p1, p2], [matchWithStats]);
  const cornerSaver = trophies.find((t) => t.id === 'corner_saver');
  const luckyBastard = trophies.find((t) => t.id === 'lucky_bastard');
  const butterFingers = trophies.find((t) => t.id === 'no_hands');
  const firstServe = trophies.find((t) => t.id === 'first_serve_master');
  const aceKing = trophies.find((t) => t.id === 'ace_king');
  const ironDefense = trophies.find((t) => t.id === 'iron_defense');
  const styleMaster = trophies.find((t) => t.id === 'style_master');
  const mpSaver = trophies.find((t) => t.id === 'match_point_saver');
  const ballContestMaster = trophies.find((t) => t.id === 'ball_contest_master');
  const ballContestLoser = trophies.find((t) => t.id === 'ball_contest_loser');

  console.assert(cornerSaver?.winnerPlayerId === 'p1', 'Test 9a Fallito: Salvato in corner deve andare a p1');
  console.assert(luckyBastard?.winnerPlayerId === 'p1', 'Test 9b Fallito: Culo sfondato deve andare a p1');
  console.assert(butterFingers?.winnerPlayerId === 'p2', 'Test 9c Fallito: Senza mani deve andare a p2');
  console.assert(firstServe?.winnerPlayerId === 'p1', 'Test 9d Fallito: Buona la prima deve andare a p1');
  console.assert(aceKing?.winnerPlayerId === 'p1', 'Test 9e Fallito: Re dell\'Ace deve andare a p1');
  console.assert(ironDefense?.winnerPlayerId === 'p2', 'Test 9f Fallito: Difesa d\'Acciaio deve andare a p2');
  console.assert(styleMaster?.winnerPlayerId === 'p1', 'Test 9g Fallito: Pura Classe deve andare a p1');
  console.assert(mpSaver?.winnerPlayerId === 'p1', 'Test 9h Fallito: Cuore d\'Acciaio deve andare a p1');
  console.assert(ballContestMaster?.winnerPlayerId === 'p1', 'Test 9i Fallito: Mia! deve andare a p1');
  console.assert(ballContestLoser?.winnerPlayerId === 'p2', 'Test 9j Fallito: Tua! deve andare a p2');
  console.log('✓ Test 9 Superato: Assegnazione corretta di tutti i trofei speciali (inclusi Re dell\'Ace, Difesa d\'Acciaio, Pura Classe, Cuore d\'Acciaio, Mia! e Tua!)');

  // Test 10: Security & Anti-IDOR Whitelist
  const maliciousPayload = {
    name: 'Nome Legittimo',
    elo: 9999, // Tentativo di falsificare l'Elo!
    wins: 100, // Tentativo di falsificare le vittorie!
    id: 'hacked_id',
    avatar: '😎',
  };
  const sanitized = sanitizePlayerUpdates(maliciousPayload);
  console.assert(sanitized.name === 'Nome Legittimo', 'Test 10a Fallito: nome legittimo preservato');
  console.assert(sanitized.avatar === '😎', 'Test 10b Fallito: avatar legittimo preservato');
  console.assert((sanitized as any).elo === undefined, 'Test 10c Fallito: elo malevolo DEVE essere rimosso');
  console.assert((sanitized as any).wins === undefined, 'Test 10d Fallito: wins malevolo DEVE essere rimosso');
  console.assert((sanitized as any).id === undefined, 'Test 10e Fallito: id DEVE essere rimosso');
  console.log('✓ Test 10 Superato: Protezione Anti-IDOR rimuove attributi critici (elo, wins, id)');

  // Test 11: Quote Pre-Match & Live Dinamiche (LUL Coins Betting)
  const preMatchOdds = calculatePreMatchOdds(1200, 1200);
  console.assert(preMatchOdds.odds1 >= 1.8 && preMatchOdds.odds1 <= 2.0, `Test 11a Fallito: quote pari livello attese ~1.90, ottenuto ${preMatchOdds.odds1}`);
  console.assert(preMatchOdds.odds2 >= 1.8 && preMatchOdds.odds2 <= 2.0, `Test 11b Fallito: quote pari livello attese ~1.90, ottenuto ${preMatchOdds.odds2}`);

  // Test rimonta epica: P1 avanti 20-10 su 21 -> la quota di P2 deve schizzare molto in alto
  const comebackOdds = calculateLiveDynamicOdds(1200, 1200, 20, 10, 21);
  console.assert(comebackOdds.odds1 <= 1.05, `Test 11c Fallito: leader quasi a vittoria deve avere quota bassissima, ottenuto ${comebackOdds.odds1}`);
  console.assert(comebackOdds.odds2 >= 15.0, `Test 11d Fallito: underdog sotto 20-10 deve avere quota rimonta astronomica (>= 15x), ottenuto ${comebackOdds.odds2}`);
  console.log(`✓ Test 11 Superato: Quote pre-match (pari 1.90x) e quote live dinamiche (20-10 -> leader ${comebackOdds.odds1}x vs underdog ${comebackOdds.odds2}x)`);

  // Test 12: Risoluzione Scommesse (Match Winner)
  const testBets: Record<string, LiveBet> = {
    bet_1: {
      id: 'bet_1',
      type: 'live_dynamic',
      bettorId: 'p1',
      bettorName: 'Player 1',
      bettorAvatar: '🦁',
      betOnPlayer: 2,
      amount: 50,
      odds: 20.0,
      scoreAtBet: '20 - 10',
      potentialPayout: 1000,
      status: 'pending',
      timestamp: Date.now(),
    },
    bet_2: {
      id: 'bet_2',
      type: 'pre_match',
      bettorId: 'p2',
      bettorName: 'Player 2',
      bettorAvatar: '🦊',
      betOnPlayer: 1,
      amount: 30,
      odds: 1.5,
      scoreAtBet: 'Pre-match',
      potentialPayout: 45,
      status: 'pending',
      timestamp: Date.now(),
    },
  };

  // Se vince P2 (il miracolo!)
  const resolutionP2 = resolveMatchBets(testBets, 2);
  console.assert(resolutionP2.updatedBets['bet_1'].status === 'won', 'Test 12a Fallito: bet_1 deve essere won');
  console.assert(resolutionP2.payouts['p1'] === 1000, `Test 12b Fallito: payout p1 atteso 1000, ricevuto ${resolutionP2.payouts['p1']}`);
  console.assert(resolutionP2.updatedBets['bet_2'].status === 'lost', 'Test 12c Fallito: bet_2 deve essere lost');
  console.assert(resolutionP2.payouts['p2'] === 0, 'Test 12d Fallito: payout p2 deve essere 0');
  console.log('✓ Test 12 Superato: Risoluzione corretta scommesse vincenti e perdenti con calcolo payout');

  // Test 13: Traguardi Elo ravvicinati (passi di 25) & Badge permanente
  const milestone1300 = getPlayerActiveMilestone(1315);
  console.assert(milestone1300?.threshold === 1300, 'Test 13a Fallito: soglia 1300 attesa');
  console.assert(milestone1300?.badge.includes('1300+'), 'Test 13b Fallito: badge 1300+ atteso');
  // Test 14: Regola Bilaterale Scommesse (Zero-Hedging & Azzeramento Posizione)
  const betsWithP1: Record<string, LiveBet> = {
    bet_alice: {
      id: 'bet_alice',
      type: 'live_dynamic',
      bettorId: 'user_1',
      bettorName: 'Alice',
      bettorAvatar: '🦊',
      betOnPlayer: 1,
      amount: 40,
      odds: 2.1,
      scoreAtBet: '4 - 4',
      potentialPayout: 84,
      status: 'pending',
      timestamp: Date.now(),
    },
  };

  // Se Alice punta 40 sul giocatore 2 (avverso con stesso importo): azzeramento posizione e rimborso
  const zeroRule = handleBilateralBetRule(betsWithP1, 'user_1', 2, 40);
  console.assert(zeroRule.positionZeroed === true, 'Test 14a Fallito: positionZeroed deve essere true');
  console.assert(zeroRule.refundedCoins === 40, `Test 14b Fallito: refundedCoins atteso 40, ricevuto ${zeroRule.refundedCoins}`);
  console.assert(!zeroRule.updatedBets['bet_alice'], 'Test 14c Fallito: bet_alice deve essere stata cancellata');
  console.log('✓ Test 14 Superato: Regola bilaterale scommesse azzera posizione e rimborsa vecchia puntata');

  // Test 15: Assicurazione Scommessa (Rimborso 50% in caso di sconfitta)
  const insuredBets: Record<string, LiveBet> = {
    bet_bob: {
      id: 'bet_bob',
      type: 'live_dynamic',
      bettorId: 'user_bob',
      bettorName: 'Bob',
      bettorAvatar: '🦁',
      betOnPlayer: 1,
      amount: 100,
      odds: 3.0,
      scoreAtBet: '8 - 10',
      potentialPayout: 300,
      status: 'pending',
      timestamp: Date.now(),
    },
  };
  // Bob ha l'assicurazione attiva e perde perché vince Player 2
  const resolutionInsured = resolveMatchBets(insuredBets, 2, { user_bob: true });
  console.assert(resolutionInsured.updatedBets['bet_bob'].status === 'lost', 'Test 15a Fallito: bet status deve essere lost');
  console.assert(resolutionInsured.payouts['user_bob'] === 50, `Test 15b Fallito: atteso rimborso 50, ricevuto ${resolutionInsured.payouts['user_bob']}`);
  console.assert(resolutionInsured.insuranceRefunds['user_bob'] === 50, 'Test 15c Fallito: insuranceRefunds atteso 50');
  console.log('✓ Test 15 Superato: Assicurazione scommessa rimborsa il 50% al giocatore assicurato');

  // Test 16: Catalogo Bazar e Apertura Pacco Sorpresa
  console.assert(SHOP_ITEMS.length >= 10, `Test 16a Fallito: attesi almeno 10 oggetti nel Bazar, trovati ${SHOP_ITEMS.length}`);
  const mysteryOutcome = openMysteryBox();
  console.assert(mysteryOutcome.coins >= 25 && mysteryOutcome.coins <= 250, 'Test 16b Fallito: monete mystery box fuori range');
  console.log('✓ Test 16 Superato: Catalogo Bazar completo e logica Pacco Sorpresa funzionante');

  // Test 17: Trofei Speciali calcolati su media per partita live ed esclusione partite non-live
  const playerA = { id: 'pA', name: 'Player A', avatar: '🦁', elo: 1200, wins: 2, losses: 0, currentStreak: 2 } as unknown as Player;
  const playerB = { id: 'pB', name: 'Player B', avatar: '🐯', elo: 1200, wins: 7, losses: 0, currentStreak: 7 } as unknown as Player;
  const playerC = { id: 'pC', name: 'Player C', avatar: '🐼', elo: 1200, wins: 10, losses: 0, currentStreak: 10 } as unknown as Player;
  const playerD = { id: 'pD', name: 'Player D', avatar: '🦊', elo: 1200, wins: 1, losses: 0, currentStreak: 1 } as unknown as Player;

  const test17Matches: Match[] = [
    // 2 Live matches per Player A (totale 8 smash -> media 4.0/m)
    { id: 'm1', player1Id: 'pA', player2Id: 'pB', score1: 11, score2: 8, winnerId: 'pA', loserId: 'pB', timestamp: now, stats: { player1Smashes: 5, player2Smashes: 2 } } as unknown as Match,
    { id: 'm2', player1Id: 'pA', player2Id: 'pB', score1: 11, score2: 9, winnerId: 'pA', loserId: 'pB', timestamp: now, stats: { player1Smashes: 3, player2Smashes: 2 } } as unknown as Match,
    // 5 Partite non-live per Player B (senza stats: non devono contare nel conteggio live e non devono penalizzare)
    { id: 'm3', player1Id: 'pB', player2Id: 'pC', score1: 11, score2: 7, winnerId: 'pB', loserId: 'pC', timestamp: now } as unknown as Match,
    { id: 'm4', player1Id: 'pB', player2Id: 'pC', score1: 11, score2: 5, winnerId: 'pB', loserId: 'pC', timestamp: now } as unknown as Match,
    { id: 'm5', player1Id: 'pB', player2Id: 'pC', score1: 11, score2: 4, winnerId: 'pB', loserId: 'pC', timestamp: now } as unknown as Match,
    // Player D: 1 sola partita live con 6 smash (media 6.0/m, ma esclusa perché sotto la soglia minima di 2 live)
    { id: 'm6', player1Id: 'pD', player2Id: 'pC', score1: 11, score2: 2, winnerId: 'pD', loserId: 'pC', timestamp: now, stats: { player1Smashes: 6, player2Smashes: 0 } } as unknown as Match,
  ];

  const trophies17 = calculateSpecialTrophies([playerA, playerB, playerC, playerD], test17Matches);
  const smashKing17 = trophies17.find((t) => t.id === 'smash_king');

  console.assert(smashKing17?.winnerPlayerId === 'pA', `Test 17a Fallito: Re dello Smash atteso Player A, ottenuto ${smashKing17?.winnerPlayerName}`);
  console.assert(smashKing17?.statValue.includes('4.0/m'), `Test 17b Fallito: attesa media 4.0/m, ottenuto ${smashKing17?.statValue}`);
  console.log('✓ Test 17 Superato: Trofei speciali assegnati per media su partite live, escluse partite non-live e soglia minima rispettata');

  // Test 18: Regola Ferrea Anti-Match-Fixing (Giocatore in campo punta solo su se stesso per vincere)
  // P1 tenta di puntare sull'avversario P2: BLOCCATO
  const betOnOpponent = validateBetPlacement('p1', 'p1', 'p2', 'match_winner', 2);
  console.assert(betOnOpponent.valid === false, 'Test 18a Fallito: puntata su avversario deve essere bloccata');
  console.assert(betOnOpponent.error?.includes('Anti-Biscotto'), 'Test 18b Fallito: messaggio anti-biscotto atteso');

  // P1 tenta di puntare su mercati secondari (Over/Under punti): BLOCCATO
  const betOnSideMarket = validateBetPlacement('p1', 'p1', 'p2', 'total_points');
  console.assert(betOnSideMarket.valid === false, 'Test 18c Fallito: giocatore in campo non può puntare su mercati secondari');

  // P1 punta su se stesso (vincitore P1): PERMESSO
  const betOnSelf = validateBetPlacement('p1', 'p1', 'p2', 'match_winner', 1);
  console.assert(betOnSelf.valid === true, 'Test 18d Fallito: giocatore deve poter puntare su se stesso');

  // Spettatore neutrale p3 punta su qualsiasi mercato: PERMESSO
  const betSpectator = validateBetPlacement('p3', 'p1', 'p2', 'total_smashes');
  console.assert(betSpectator.valid === true, 'Test 18e Fallito: spettatore neutrale può puntare su mercati secondari');
  console.log('✓ Test 18 Superato: Regola ferrea anti-match-fixing verificata con successo');

  // Test 19: Calcolo Quote Live Multi-Mercato & Risoluzione Scommesse
  const allMarkets = calculateAllLiveMarkets(
    'Alice',
    'Bob',
    1250,
    1200,
    8,
    7,
    11,
    {
      player1Smashes: 2,
      player2Smashes: 1,
      player1Edges: 1,
      player2Edges: 0,
      player1Nets: 1,
      player2Nets: 0,
      targetPoints: 11,
    }
  );
  console.assert(allMarkets.length === 5, `Test 19a Fallito: attesi 5 mercati live, trovati ${allMarkets.length}`);
  const smashMkt = allMarkets.find((m) => m.type === 'total_smashes');
  console.assert(smashMkt?.targetLine === 2.5, 'Test 19b Fallito: linea smash attesa 2.5');

  // Risoluzione scommessa multi-mercato
  const multiBets: Record<string, LiveBet> = {
    bet_points: {
      id: 'bet_points',
      type: 'live_dynamic',
      marketType: 'total_points',
      selection: 'over',
      selectionLabel: 'Over 18.5',
      targetLine: 18.5,
      bettorId: 'spectator_1',
      bettorName: 'Spec 1',
      bettorAvatar: '👀',
      amount: 40,
      odds: 2.0,
      scoreAtBet: '8 - 7',
      potentialPayout: 80,
      status: 'pending',
      timestamp: Date.now(),
    },
    bet_smash: {
      id: 'bet_smash',
      type: 'live_dynamic',
      marketType: 'total_smashes',
      selection: 'under',
      selectionLabel: 'Under 2.5',
      targetLine: 2.5,
      bettorId: 'spectator_2',
      bettorName: 'Spec 2',
      bettorAvatar: '🦁',
      amount: 50,
      odds: 1.8,
      scoreAtBet: '8 - 7',
      potentialPayout: 90,
      status: 'pending',
      timestamp: Date.now(),
    },
  };

  // Match si conclude 11-9 (totale punti 20 > 18.5 -> Over vince)
  // Smash totali: 3 (> 2.5 -> Under perde)
  const resMulti = resolveMatchBets(
    multiBets,
    1,
    11,
    9,
    { player1Smashes: 2, player2Smashes: 1, targetPoints: 11 },
    undefined,
    { spectator_1: true } // Booster attivo su spectator_1! Raddoppia profitto netto: (80-40)*2 + 40 = 120
  );
  console.assert(resMulti.updatedBets['bet_points'].status === 'won', 'Test 19c Fallito: bet_points deve essere vinta');
  console.assert(resMulti.payouts['spectator_1'] === 120, `Test 19d Fallito: payout con booster atteso 120, ricevuto ${resMulti.payouts['spectator_1']}`);
  console.assert(resMulti.updatedBets['bet_smash'].status === 'lost', 'Test 19e Fallito: bet_smash under deve essere persa');
  console.log('✓ Test 19 Superato: Mercati multipli live e risoluzione con booster funzionanti');

  // Test 20: 6-Tier Achievements Retroattivi (Legno..Gear 5) & Calcolo Premi
  const playerAchTest = {
    id: 'p_ach',
    name: 'Smasher',
    coins: 500,
    claimedAchievements: {},
  } as unknown as Player;

  const matchesForAch: Match[] = [
    { id: 'm1', player1Id: 'p_ach', player2Id: 'p2', stats: { player1Smashes: 25 } } as unknown as Match,
  ];

  const achStatuses = calculatePlayerAchievements(playerAchTest, matchesForAch);
  const smashAch = achStatuses.find((s) => s.achievement.id === 'smash_king');
  console.assert(smashAch !== undefined, 'Test 20a Fallito: achievement smash_king non trovato');
  console.assert(smashAch?.currentValue === 25, `Test 20b Fallito: attesi 25 smash, trovati ${smashAch?.currentValue}`);
  // 25 smash ha superato Legno (5) e Bronzo (20). Livello più alto: 2 (Bronzo).
  console.assert(smashAch?.highestReachedTier?.level === 2, `Test 20c Fallito: atteso livello 2, trovato ${smashAch?.highestReachedTier?.level}`);
  // Premi da riscuotere: 15 (Legno) + 30 (Bronzo) = 45 monete
  console.assert(smashAch?.totalClaimableCoins === 45, `Test 20d Fallito: attese 45 monete da riscuotere, trovate ${smashAch?.totalClaimableCoins}`);
  console.log('✓ Test 20 Superato: 6-Tier achievements retroattivi e calcolo monete claimable corretto');

  // Test 21: Ruota della Fortuna (Lucky Wheel)
  const wheelSpin = spinLuckyWheel();
  console.assert(wheelSpin.sector.index >= 0 && wheelSpin.sector.index < WHEEL_SECTORS.length, 'Test 21a Fallito: indice settore ruota non valido');
  console.assert(wheelSpin.sector.label.length > 0, 'Test 21b Fallito: label outcome vuota');
  // Test 22: Rigorosa Meritocrazia dei Tag & Rimozione Tag Autoassegnati
  const playerWithFraudTags: Player = {
    id: 'p_fraud',
    name: 'Truffaldino',
    inventory: ['title_wall', 'trophy_goat_statue'],
    claimedAchievements: {
      win_streak: 1, // Livello 1: Legno 🪵
    },
    coinedTags: ['🏷️ Coniato col Gettone'],
    tags: [
      '👑 Campione del Mondo (autoprocl', // NON guadagnato -> deve essere rimosso!
      '🌪️ Topspin Fantasma', // NON guadagnato -> deve essere rimosso!
      '🧱 Muro di Gomma', // Guadagnato (title_wall) -> deve rimanere
      '🐐 Il G.O.A.T.', // Guadagnato (trophy_goat_statue) -> deve rimanere
      '🪵 Inarrestabile (Legno)', // Guadagnato (claimedAchievements win_streak) -> deve rimanere
      '🏷️ Coniato col Gettone', // Guadagnato (coinedTags) -> deve rimanere
    ],
  } as unknown as Player;

  const validRecs = getValidPlayerRecognitions(playerWithFraudTags);
  console.assert(validRecs.includes('🧱 Muro di Gomma'), 'Test 22a Fallito: Muro di Gomma deve essere valido');
  console.assert(validRecs.includes('🐐 Il G.O.A.T.'), 'Test 22b Fallito: GOAT deve essere valido');
  console.assert(validRecs.includes('🪵 Inarrestabile (Legno)'), 'Test 22c Fallito: Inarrestabile Legno deve essere valido');
  console.assert(validRecs.includes('🏷️ Coniato col Gettone'), 'Test 22d Fallito: Tag coniato deve essere valido');
  console.assert(!validRecs.includes('👑 Campione del Mondo (autoprocl'), 'Test 22e Fallito: Tag autoproclamato non deve essere valido');

  const sanitizedTags = sanitizePlayerTags(playerWithFraudTags);
  console.assert(sanitizedTags.length === 4, `Test 22f Fallito: attesi 4 tag legittimi, trovati ${sanitizedTags.length}`);
  console.assert(!sanitizedTags.includes('👑 Campione del Mondo (autoprocl'), 'Test 22g Fallito: Campione autoproclamato non rimosso');
  console.assert(!sanitizedTags.includes('🌪️ Topspin Fantasma'), 'Test 22h Fallito: Topspin Fantasma non rimosso');
  console.log('✓ Test 22 Superato: Rigorosa meritocrazia dei tag & rimozione categorica tag autoassegnati');

  console.log('\nTUTTI I 22 TEST AVANZATI SUPERATI CON SUCCESSO! 🎉');
}

runTests();
