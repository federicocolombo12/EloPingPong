import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MatchLiveStats, Player } from '../core/types';
import { Colors } from '../theme/colors';

interface LiveScoreboardProps {
  player1: Player;
  player2: Player;
  onFinishMatch: (score1: number, score2: number, stats: MatchLiveStats) => void;
}

type PointEvent =
  | { type: 'normal'; winner: 1 | 2 }
  | { type: 'edge'; winner: 1 | 2 }
  | { type: 'net'; winner: 1 | 2 }
  | { type: 'smash'; winner: 1 | 2 }
  | { type: 'ace'; winner: 1 | 2 }
  | { type: 'defense'; winner: 1 | 2 }
  | { type: 'luck'; winner: 1 | 2 }
  | { type: 'style'; winner: 1 | 2 }
  | { type: 'serve_error'; faultPlayer: 1 | 2 }; // Punto va all'avversario

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  player1,
  player2,
  onFinishMatch,
}) => {
  const [targetPoints, setTargetPoints] = useState<11 | 21>(11);
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [history, setHistory] = useState<PointEvent[]>([]);

  // Statistiche evento
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
  const [p1Aces, setP1Aces] = useState(0);
  const [p2Aces, setP2Aces] = useState(0);
  const [p1Defenses, setP1Defenses] = useState(0);
  const [p2Defenses, setP2Defenses] = useState(0);
  const [p1ServeErrors, setP1ServeErrors] = useState(0);
  const [p2ServeErrors, setP2ServeErrors] = useState(0);

  // Calcolo turno di battuta
  const totalPoints = score1 + score2;
  const isDeuce = score1 >= targetPoints - 1 && score2 >= targetPoints - 1;
  const serveInterval = isDeuce ? 1 : targetPoints === 11 ? 2 : 5;
  const currentServer: 1 | 2 = Math.floor(totalPoints / serveInterval) % 2 === 0 ? 1 : 2;

  // Controllo vittoria (richiede 2 punti di distacco)
  const isP1Winner = score1 >= targetPoints && score1 - score2 >= 2;
  const isP2Winner = score2 >= targetPoints && score2 - score1 >= 2;
  const isGameOver = isP1Winner || isP2Winner;

  // Match Point
  const isP1MatchPoint = !isGameOver && score1 >= targetPoints - 1 && score1 > score2;
  const isP2MatchPoint = !isGameOver && score2 >= targetPoints - 1 && score2 > score1;

  const addPoint = (event: PointEvent) => {
    if (isGameOver) return;

    if (event.type === 'normal') {
      if (event.winner === 1) setScore1((s) => s + 1);
      else setScore2((s) => s + 1);
    } else if (event.type === 'edge') {
      if (event.winner === 1) {
        setScore1((s) => s + 1);
        setP1Edges((e) => e + 1);
      } else {
        setScore2((s) => s + 1);
        setP2Edges((e) => e + 1);
      }
    } else if (event.type === 'net') {
      if (event.winner === 1) {
        setScore1((s) => s + 1);
        setP1Nets((n) => n + 1);
      } else {
        setScore2((s) => s + 1);
        setP2Nets((n) => n + 1);
      }
    } else if (event.type === 'smash') {
      if (event.winner === 1) {
        setScore1((s) => s + 1);
        setP1Smashes((sm) => sm + 1);
      } else {
        setScore2((s) => s + 1);
        setP2Smashes((sm) => sm + 1);
      }
    } else if (event.type === 'serve_error') {
      if (event.faultPlayer === 1) {
        setScore2((s) => s + 1);
        setP1ServeErrors((se) => se + 1);
      } else {
        setScore1((s) => s + 1);
        setP2ServeErrors((se) => se + 1);
      }
    }

    setHistory((prev) => [...prev, event]);
  };

  const undoLastPoint = () => {
    if (history.length === 0) return;
    const lastEvent = history[history.length - 1];

    if (lastEvent.type === 'normal') {
      if (lastEvent.winner === 1) setScore1((s) => Math.max(0, s - 1));
      else setScore2((s) => Math.max(0, s - 1));
    } else if (lastEvent.type === 'edge') {
      if (lastEvent.winner === 1) {
        setScore1((s) => Math.max(0, s - 1));
        setP1Edges((e) => Math.max(0, e - 1));
      } else {
        setScore2((s) => Math.max(0, s - 1));
        setP2Edges((e) => Math.max(0, e - 1));
      }
    } else if (lastEvent.type === 'net') {
      if (lastEvent.winner === 1) {
        setScore1((s) => Math.max(0, s - 1));
        setP1Nets((n) => Math.max(0, n - 1));
      } else {
        setScore2((s) => Math.max(0, s - 1));
        setP2Nets((n) => Math.max(0, n - 1));
      }
    } else if (lastEvent.type === 'smash') {
      if (lastEvent.winner === 1) {
        setScore1((s) => Math.max(0, s - 1));
        setP1Smashes((sm) => Math.max(0, sm - 1));
      } else {
        setScore2((s) => Math.max(0, s - 1));
        setP2Smashes((sm) => Math.max(0, sm - 1));
      }
    } else if (lastEvent.type === 'serve_error') {
      if (lastEvent.faultPlayer === 1) {
        setScore2((s) => Math.max(0, s - 1));
        setP1ServeErrors((se) => Math.max(0, se - 1));
      } else {
        setScore1((s) => Math.max(0, s - 1));
        setP2ServeErrors((se) => Math.max(0, se - 1));
      }
    }

    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const resetScoreboard = () => {
    setScore1(0);
    setScore2(0);
    setHistory([]);
    setP1Edges(0);
    setP2Edges(0);
    setP1Nets(0);
    setP2Nets(0);
    setP1LuckPoints(0);
    setP2LuckPoints(0);
    setP1StylePoints(0);
    setP2StylePoints(0);
    setP1Smashes(0);
    setP2Smashes(0);
    setP1Aces(0);
    setP2Aces(0);
    setP1Defenses(0);
    setP2Defenses(0);
    setP1ServeErrors(0);
    setP2ServeErrors(0);
  };

  const handleFinish = () => {
    onFinishMatch(score1, score2, {
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
      player1Aces: p1Aces,
      player2Aces: p2Aces,
      player1Defenses: p1Defenses,
      player2Defenses: p2Defenses,
      player1ServeErrors: p1ServeErrors,
      player2ServeErrors: p2ServeErrors,
      targetPoints,
    });
  };

  return (
    <View style={styles.container}>
      {/* SELETTORE OBIETTIVO PARTITA (11 o 21 PUNTI) */}
      <View style={styles.targetRow}>
        <TouchableOpacity
          onPress={() => setTargetPoints(11)}
          style={[styles.targetBtn, targetPoints === 11 && styles.targetBtnActive]}
        >
          <Text style={[styles.targetBtnText, targetPoints === 11 && styles.targetBtnTextActive]}>
            🎯 Partita all'11
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTargetPoints(21)}
          style={[styles.targetBtn, targetPoints === 21 && styles.targetBtnActive]}
        >
          <Text style={[styles.targetBtnText, targetPoints === 21 && styles.targetBtnTextActive]}>
            🎯 Partita al 21
          </Text>
        </TouchableOpacity>
      </View>

      {/* BANNER TURNO DI BATTUTA */}
      <View style={styles.serverBanner}>
        <Text style={styles.serverIcon}>🏓</Text>
        <Text style={styles.serverText}>
          In battuta:{' '}
          <Text style={{ color: '#FDE047', fontWeight: '900' }}>
            {currentServer === 1 ? player1.name : player2.name}
          </Text>{' '}
          (cambio ogni {serveInterval} {serveInterval === 1 ? 'punto' : 'punti'})
        </Text>
      </View>

      {/* BANNER MATCH POINT */}
      {(isP1MatchPoint || isP2MatchPoint) && (
        <View style={styles.matchPointBanner}>
          <Text style={styles.matchPointText}>
            🔥 MATCH POINT PER {isP1MatchPoint ? player1.name : player2.name}! 🔥
          </Text>
        </View>
      )}

      {/* TABELLONE DEI PUNTEGGI PRINCIPALE */}
      <View style={styles.scoreboardGrid}>
        {/* GIOCATORE 1 */}
        <View
          style={[
            styles.playerSide,
            currentServer === 1 && styles.playerSideServing,
            { borderColor: player1.color || Colors.primary },
          ]}
        >
          <View style={styles.playerHeader}>
            <Text style={styles.playerAvatar}>{player1.avatar}</Text>
            <Text style={styles.playerName} numberOfLines={1}>
              {player1.name}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isGameOver}
            onPress={() => addPoint({ type: 'normal', winner: 1 })}
            style={styles.scoreClickBox}
          >
            <Text style={styles.scoreBigText}>{score1}</Text>
            <Text style={styles.tapAddHint}>+1 Punto Normale</Text>
          </TouchableOpacity>

          {/* Tasti Eventi Rapidi per P1 */}
          <View style={styles.eventBtnsCol}>
            <TouchableOpacity
              onPress={() => addPoint({ type: 'edge', winner: 1 })}
              style={styles.eventBtnEdge}
            >
              <Text style={styles.eventBtnLabel}>🎲 Spigolo! (+1)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addPoint({ type: 'net', winner: 1 })}
              style={styles.eventBtnNet}
            >
              <Text style={styles.eventBtnLabel}>🕸️ Net! (+1)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addPoint({ type: 'smash', winner: 1 })}
              style={styles.eventBtnSmash}
            >
              <Text style={styles.eventBtnLabel}>💥 Smash! (+1)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addPoint({ type: 'serve_error', faultPlayer: 1 })}
              style={styles.eventBtnFault}
            >
              <Text style={styles.eventBtnLabelFault}>❌ Sbaglia Battuta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GIOCATORE 2 */}
        <View
          style={[
            styles.playerSide,
            currentServer === 2 && styles.playerSideServing,
            { borderColor: player2.color || Colors.secondary },
          ]}
        >
          <View style={styles.playerHeader}>
            <Text style={styles.playerAvatar}>{player2.avatar}</Text>
            <Text style={styles.playerName} numberOfLines={1}>
              {player2.name}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isGameOver}
            onPress={() => addPoint({ type: 'normal', winner: 2 })}
            style={styles.scoreClickBox}
          >
            <Text style={styles.scoreBigText}>{score2}</Text>
            <Text style={styles.tapAddHint}>+1 Punto Normale</Text>
          </TouchableOpacity>

          {/* Tasti Eventi Rapidi per P2 */}
          <View style={styles.eventBtnsCol}>
            <TouchableOpacity
              onPress={() => addPoint({ type: 'edge', winner: 2 })}
              style={styles.eventBtnEdge}
            >
              <Text style={styles.eventBtnLabel}>🎲 Spigolo! (+1)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addPoint({ type: 'net', winner: 2 })}
              style={styles.eventBtnNet}
            >
              <Text style={styles.eventBtnLabel}>🕸️ Net! (+1)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addPoint({ type: 'smash', winner: 2 })}
              style={styles.eventBtnSmash}
            >
              <Text style={styles.eventBtnLabel}>💥 Smash! (+1)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addPoint({ type: 'serve_error', faultPlayer: 2 })}
              style={styles.eventBtnFault}
            >
              <Text style={styles.eventBtnLabelFault}>❌ Sbaglia Battuta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* RIEPILOGO STATISTICHE LIVE */}
      <View style={styles.liveStatsCard}>
        <Text style={styles.liveStatsTitle}>📊 Statistiche del Match dal Vivo:</Text>
        <View style={styles.statsCompareRow}>
          <Text style={styles.statPlayerVal}>{p1Edges}</Text>
          <Text style={styles.statLabelCenter}>🎲 Spigoli Fortunosi</Text>
          <Text style={styles.statPlayerVal}>{p2Edges}</Text>
        </View>
        <View style={styles.statsCompareRow}>
          <Text style={styles.statPlayerVal}>{p1Nets}</Text>
          <Text style={styles.statLabelCenter}>🕸️ Retine Beffarde</Text>
          <Text style={styles.statPlayerVal}>{p2Nets}</Text>
        </View>
        <View style={styles.statsCompareRow}>
          <Text style={styles.statPlayerVal}>{p1Smashes}</Text>
          <Text style={styles.statLabelCenter}>💥 Schiacciate Vincenti</Text>
          <Text style={styles.statPlayerVal}>{p2Smashes}</Text>
        </View>
        <View style={styles.statsCompareRow}>
          <Text style={styles.statPlayerVal}>{p1ServeErrors}</Text>
          <Text style={styles.statLabelCenter}>❌ Errori in Battuta</Text>
          <Text style={styles.statPlayerVal}>{p2ServeErrors}</Text>
        </View>
      </View>

      {/* CONTROLLI INFERIORI (UNDO & RESET) */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          onPress={undoLastPoint}
          disabled={history.length === 0}
          style={[styles.controlBtn, history.length === 0 && { opacity: 0.4 }]}
        >
          <Text style={styles.controlBtnText}>↩️ Annulla Ultimo Punto</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetScoreboard} style={styles.controlBtnDanger}>
          <Text style={styles.controlBtnTextDanger}>🔄 Azzera</Text>
        </TouchableOpacity>
      </View>

      {/* BANNER DI FINE PARTITA */}
      {isGameOver && (
        <View style={styles.gameOverCard}>
          <Text style={styles.gameOverTrophy}>🏆</Text>
          <Text style={styles.gameOverTitle}>
            PARTITA CONCLUSA! {isP1Winner ? player1.name : player2.name} TRIONFA!
          </Text>
          <Text style={styles.gameOverScore}>
            Risultato finale: {score1} - {score2}
          </Text>

          <TouchableOpacity onPress={handleFinish} style={styles.finishMatchBtn}>
            <Text style={styles.finishMatchBtnText}>
              CONFERMA E CALCOLA ELO CON QUESTE STATISTICHE 🚀
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  targetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  targetBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.primary,
  },
  targetBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  targetBtnTextActive: {
    color: Colors.primary,
  },
  serverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serverIcon: {
    fontSize: 16,
  },
  serverText: {
    color: Colors.textPrimary,
    fontSize: 12,
  },
  matchPointBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  matchPointText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreboardGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  playerSide: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  playerSideServing: {
    backgroundColor: '#19263a',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  playerAvatar: {
    fontSize: 20,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 90,
  },
  scoreClickBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  scoreBigText: {
    color: Colors.textPrimary,
    fontSize: 48,
    fontWeight: '900',
  },
  tapAddHint: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  eventBtnsCol: {
    width: '100%',
    gap: 5,
  },
  eventBtnEdge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  eventBtnNet: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  eventBtnSmash: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  eventBtnFault: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventBtnLabel: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  eventBtnLabelFault: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
  liveStatsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveStatsTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  statPlayerVal: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    minWidth: 24,
    textAlign: 'center',
  },
  statLabelCenter: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  controlBtn: {
    flex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  controlBtnDanger: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  controlBtnTextDanger: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  gameOverCard: {
    backgroundColor: '#1E2D44',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  gameOverTrophy: {
    fontSize: 32,
    marginBottom: 4,
  },
  gameOverTitle: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 2,
  },
  gameOverScore: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  finishMatchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  finishMatchBtnText: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
