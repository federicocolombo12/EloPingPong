import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { EditPlayerModal } from '../components/EditPlayerModal';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerProfileModal } from '../components/PlayerProfileModal';
import { Podium } from '../components/Podium';
import { SadLoserBox } from '../components/SadLoserBox';
import { useElo } from '../context/EloContext';
import { calculateActivityBonus, calculateInactivityDecay } from '../core/elo';
import { getPlayerTrophies } from '../core/trophies';
import { Player } from '../core/types';
import { Colors } from '../theme/colors';

interface LeaderboardScreenProps {
  onNavigateToNewMatch: () => void;
  onSelectPlayerStats?: (player: Player) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onNavigateToNewMatch,
  onSelectPlayerStats,
}) => {
  const {
    players,
    rankedPlayers,
    rankedPlayersByRace,
    loading,
    updatePlayer,
    matches,
    isCloudSyncActive,
    associatedPlayer,
    currentLeague,
    isAdmin,
  } = useElo();
  const [rankingType, setRankingType] = useState<'elo' | 'race'>('elo');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Caricamento Classifica...</Text>
      </View>
    );
  }

  const displayedPlayers = rankingType === 'race' ? rankedPlayersByRace : rankedPlayers;
  const top3 = displayedPlayers.slice(0, 3);
  const fourthPlayer = displayedPlayers.length >= 4 ? displayedPlayers[3] : null;
  const thirdPlayer = displayedPlayers.length >= 3 ? displayedPlayers[2] : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Intestazione Rapida Lega & Badge */}
        <View style={styles.headerBanner}>
          <View style={styles.badgesRow}>
            <View style={styles.matchCounterBadge}>
              <Text style={styles.matchCounterText}>
                Match Totali: <Text style={{ color: '#FDE047' }}>{matches.length}</Text>
              </Text>
            </View>

            <View style={[styles.syncBadge, isCloudSyncActive && styles.syncBadgeCloud]}>
              <Text style={styles.syncBadgeText}>
                {isCloudSyncActive ? '🟢 Cloud Live' : '📱 Locale'}
              </Text>
            </View>
          </View>
        </View>

        {/* Toggle Tipo Classifica (Elo vs Race ATP) */}
        <View style={styles.rankingTypeTabs}>
          <TouchableOpacity
            style={[styles.rankingTypeTab, rankingType === 'elo' && styles.rankingTypeTabActive]}
            onPress={() => setRankingType('elo')}
          >
            <Text style={[styles.rankingTypeText, rankingType === 'elo' && styles.rankingTypeTextActive]}>
              🏆 Ranking Elo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rankingTypeTab, rankingType === 'race' && styles.rankingTypeTabActive]}
            onPress={() => setRankingType('race')}
          >
            <Text style={[styles.rankingTypeText, rankingType === 'race' && styles.rankingTypeTextActive]}>
              🎾 Race ATP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Spiegazione Race ATP */}
        {rankingType === 'race' && (
          <View style={styles.raceExplainerCard}>
            <Text style={styles.raceExplainerTitle}>🎾 ATP Race Stagionale</Text>
            <Text style={styles.raceExplainerText}>
              Punti cumulativi per premiare chi gioca con più costanza durante la stagione:
            </Text>
            <View style={styles.racePointsGrid}>
              <Text style={styles.racePointPill}>🏆 +50 Vittoria netta</Text>
              <Text style={styles.racePointPill}>🔥 +40 Vittoria tirata</Text>
              <Text style={styles.racePointPill}>💪 +15 Sconfitta tirata</Text>
              <Text style={styles.racePointPill}>🏓 +10 Match giocato</Text>
              <Text style={styles.racePointPill}>🔴 +5 Match Live</Text>
            </View>
          </View>
        )}

        {/* Podio dei primi 3 */}
        {top3.length === 3 && <Podium top3={top3} />}

        {/* Box del 4° tipo disperato in basso a destra / prominent */}
        {rankingType === 'elo' && fourthPlayer && thirdPlayer && (
          <SadLoserBox loser={fourthPlayer} thirdPlaceElo={thirdPlayer.elo} />
        )}

        {/* Sezione Elenco Giocatori & Dettagli */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {rankingType === 'race' ? '🎾 Classifica Race ATP' : '🏆 Classifica Generale'}
          </Text>
          <Text style={styles.sectionHint}>
            {displayedPlayers.length} di {currentLeague?.maxPlayers || 4} partecipanti
          </Text>
        </View>

        {displayedPlayers.length < (currentLeague?.maxPlayers || 4) && (
          <View style={styles.waitingBanner}>
            <Text style={styles.waitingBannerTitle}>🕵️‍♂️ Riunione Segreta in riempimento</Text>
            <Text style={styles.waitingBannerSub}>
              Ci sono {displayedPlayers.length} su {currentLeague?.maxPlayers || 4} posti occupati.
              Condividi il codice segreto <Text style={{ color: '#FDE047', fontWeight: '900' }}>{currentLeague?.code || 'PONG26'}</Text> con i tuoi amici per farli entrare!
            </Text>
          </View>
        )}

        {displayedPlayers.map((player, index) => {
          const isCurrentPlayer = player.id === associatedPlayer?.id;
          const activity = calculateActivityBonus(matches, player.id);
          const decay = calculateInactivityDecay(player.elo, player.lastMatchTimestamp);
          const playerTrophies = getPlayerTrophies(player.id, rankedPlayers, matches);

          return (
            <PlayerCard
              key={player.id}
              player={player}
              rank={index + 1}
              isCurrentPlayer={isCurrentPlayer}
              onPress={() => setInspectingPlayer(player)}
              showRacePoints={rankingType === 'race'}
              isHotRhythm={activity.isHotRhythm}
              isDecaying={decay.isDecaying}
              daysInactive={decay.daysInactive}
              trophies={playerTrophies}
            />
          );
        })}

        {/* Pulsante rapido Nuovo Match */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateToNewMatch}
            style={styles.newMatchBtn}
          >
            <Text style={styles.newMatchBtnIcon}>⚔️</Text>
            <Text style={styles.newMatchBtnText}>REGISTRA NUOVO MATCH</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Scheda Profilo Giocatore (ispezionabile da chiunque) */}
      <PlayerProfileModal
        player={inspectingPlayer}
        visible={!!inspectingPlayer}
        onClose={() => setInspectingPlayer(null)}
        canEdit={inspectingPlayer?.id === associatedPlayer?.id || isAdmin}
        onEdit={(p) => setEditingPlayer(p)}
        onViewStats={(p) => {
          setInspectingPlayer(null);
          onSelectPlayerStats?.(p);
        }}
        allPlayers={players}
        allMatches={matches}
      />

      {/* Modal di modifica profilo */}
      <EditPlayerModal
        player={editingPlayer}
        visible={!!editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSave={updatePlayer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  headerBanner: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  racketEmoji: {
    fontSize: 28,
  },
  fireEmoji: {
    fontSize: 24,
  },
  mainTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  matchCounterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchCounterText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  syncBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncBadgeCloud: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  syncBadgeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHint: {
    color: Colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  buttonWrapper: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  newMatchBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  newMatchBtnIcon: {
    fontSize: 20,
  },
  newMatchBtnText: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  waitingBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  waitingBannerTitle: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  waitingBannerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  rankingTypeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankingTypeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  rankingTypeTabActive: {
    backgroundColor: Colors.primary,
  },
  rankingTypeText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  rankingTypeTextActive: {
    color: Colors.textDark,
    fontWeight: '900',
  },
  raceExplainerCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  raceExplainerTitle: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  raceExplainerText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  racePointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  racePointPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
