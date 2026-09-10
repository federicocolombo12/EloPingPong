import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthModal } from './src/components/AuthModal';
import { FullScreenLiveMatchModal } from './src/components/FullScreenLiveMatchModal';
import { GlobalThresholdModal } from './src/components/GlobalThresholdModal';
import { InAppNotificationToast } from './src/components/InAppNotificationToast';
import { LeagueManagementModal } from './src/components/LeagueManagementModal';
import { MatchCommentsModal } from './src/components/MatchCommentsModal';
import { ReportIssueModal } from './src/components/ReportIssueModal';
import { UserProfileModal } from './src/components/UserProfileModal';
import { WinCelebrationModal } from './src/components/WinCelebrationModal';
import { EloProvider, useElo } from './src/context/EloContext';
import { STARTING_COINS } from './src/core/constants';
import { AuthScreen } from './src/screens/AuthScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { LeagueGateScreen } from './src/screens/LeagueGateScreen';
import { NewMatchScreen } from './src/screens/NewMatchScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { Colors } from './src/theme/colors';
import { soundEffects } from './src/utils/soundEffects';

type TabKey = 'leaderboard' | 'match' | 'stats' | 'shop';

interface TabItem {
  key: TabKey;
  label: string;
  emoji: string;
}

const TABS: TabItem[] = [
  { key: 'leaderboard', label: 'Podio', emoji: '🏆' },
  { key: 'match', label: 'Match', emoji: '⚔️' },
  { key: 'stats', label: 'Stats', emoji: '📊' },
  { key: 'shop', label: 'Bazar', emoji: '🛍️' },
];

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');
  const [selectedStatsPlayerId, setSelectedStatsPlayerId] = useState<string | undefined>(undefined);
  const [isUserProfileModalVisible, setIsUserProfileModalVisible] = useState(false);

  const {
    celebrationMatch,
    clearCelebration,
    players,
    matches,
    updatePlayer,
    thresholdEvent,
    clearThresholdEvent,
    toastNotification,
    clearToastNotification,
    activeCommentsMatch,
    setActiveCommentsMatch,
    addReaction,
    addComment,
    isAuthModalVisible,
    setIsAuthModalVisible,
    isReportModalVisible,
    setIsReportModalVisible,
    isLeagueModalVisible,
    setIsLeagueModalVisible,
    isLiveRefereeOpen,
    closeLiveReferee,
    liveRefereeConfig,
    startLiveReferee,
    recordMatch,
    currentLeague,
    associatedPlayer,
    currentUser,
  } = useElo();

  const currentSeason =
    currentLeague?.seasons?.find((s) => s.id === currentLeague.currentSeasonId) ||
    currentLeague?.seasons?.[0];

  const liveMatch = currentLeague?.activeLiveMatch;
  const liveP1 = liveMatch ? players.find((p) => p.id === liveMatch.player1Id) : null;
  const liveP2 = liveMatch ? players.find((p) => p.id === liveMatch.player2Id) : null;

  const handleTabPress = (tabKey: TabKey) => {
    soundEffects.playButtonTap();
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {
        // Ignora se non disponibile
      }
    }
    setActiveTab(tabKey);
  };

  const handleToastPress = () => {
    if (toastNotification?.matchId) {
      const match = matches.find((m) => m.id === toastNotification.matchId);
      if (match) {
        setActiveCommentsMatch(match);
      }
    }
    clearToastNotification();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Banner Notifiche Toast in-App */}
      <InAppNotificationToast
        toast={toastNotification}
        onDismiss={clearToastNotification}
        onPress={handleToastPress}
      />

      {/* Top Header Bar: Lega & Profilo Utente */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity
          onPress={() => {
            soundEffects.playButtonTap();
            setIsLeagueModalVisible(true);
          }}
          style={styles.headerLeaguePill}
          activeOpacity={0.7}
        >
          <Text style={styles.headerLeagueText} numberOfLines={1}>
            🏆 {currentLeague?.name || 'Arena Elo Ping Pong'}
          </Text>
          <View style={styles.headerSeasonBadge}>
            <Text style={styles.headerSeasonBadgeText}>
              {currentSeason?.name ? currentSeason.name.replace('Stagione ', 'S') : 'S1'} ▾
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            soundEffects.playButtonTap();
            setIsReportModalVisible(true);
          }}
          style={styles.headerReportPill}
          activeOpacity={0.7}
        >
          <Text style={styles.headerReportText}>🚨 Segnala</Text>
        </TouchableOpacity>

        {associatedPlayer && (
          <TouchableOpacity
            onPress={() => {
              soundEffects.playCoinSound();
              handleTabPress('shop');
            }}
            style={styles.headerCoinsPill}
            activeOpacity={0.7}
          >
            <Text style={styles.headerCoinsText}>
              🪙 {associatedPlayer.coins !== undefined ? associatedPlayer.coins : STARTING_COINS}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            soundEffects.playButtonTap();
            if (associatedPlayer || currentUser) {
              setIsUserProfileModalVisible(true);
            } else {
              setIsAuthModalVisible(true);
            }
          }}
          style={[
            styles.headerUserPill,
            associatedPlayer && { borderColor: associatedPlayer.color || Colors.primary },
          ]}
          activeOpacity={0.7}
        >
          {associatedPlayer ? (
            <>
              <Text style={styles.headerUserAvatar}>{associatedPlayer.avatar}</Text>
              <Text
                style={[
                  styles.headerUserName,
                  { color: associatedPlayer.color || Colors.primary },
                ]}
                numberOfLines={1}
              >
                {associatedPlayer.name}
              </Text>
            </>
          ) : (
            <Text style={styles.headerLoginText}>👤 Accedi</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Live Match Spectator Banner */}
      {liveMatch && !isLiveRefereeOpen && liveP1 && liveP2 && (
        <TouchableOpacity
          style={styles.liveSpectatorBanner}
          activeOpacity={0.85}
          onPress={() => {
            soundEffects.playButtonTap();
            startLiveReferee(liveP1, liveP2, liveMatch.targetPoints || 11);
          }}
        >
          <View style={styles.liveSpectatorLeft}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveSpectatorBadge}>PARTITA LIVE</Text>
            <Text style={styles.liveSpectatorVersus} numberOfLines={1}>
              {liveP1.name}{' '}
              <Text style={styles.liveScoreHighlight}>{liveMatch.score1}</Text> -{' '}
              <Text style={styles.liveScoreHighlight}>{liveMatch.score2}</Text>{' '}
              {liveP2.name}
            </Text>
          </View>
          <View style={styles.liveSpectatorRight}>
            <Text style={styles.liveSpectatorAction}>Tifa 🏓</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Area Contenuto Schermata */}
      <View style={styles.screenContainer}>
        {activeTab === 'leaderboard' && (
          <LeaderboardScreen
            onNavigateToNewMatch={() => handleTabPress('match')}
            onSelectPlayerStats={(player) => {
              setSelectedStatsPlayerId(player.id);
              handleTabPress('stats');
            }}
          />
        )}
        {activeTab === 'match' && (
          <NewMatchScreen onMatchRegistered={() => setActiveTab('leaderboard')} />
        )}
        {activeTab === 'stats' && (
          <StatsScreen
            initialPlayerId={selectedStatsPlayerId}
            onNavigateToNewMatch={() => handleTabPress('match')}
          />
        )}
        {activeTab === 'shop' && <ShopScreen />}
      </View>

      {/* Barra di Navigazione Inferiore (Tab Bar) */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => handleTabPress(tab.key)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <Text style={[styles.tabEmoji, isActive && styles.tabEmojiActive]}>
                {tab.emoji}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal di Vittoria Spettacolare */}
      <WinCelebrationModal
        match={celebrationMatch}
        players={players}
        onClose={clearCelebration}
      />

      {/* Overlay Globale per Nuova Soglia Elo (spawna a tutto schermo ovunque!) */}
      <GlobalThresholdModal
        event={thresholdEvent}
        onClose={clearThresholdEvent}
      />

      {/* Modal Commenti & Reazioni Reddit */}
      <MatchCommentsModal
        match={activeCommentsMatch}
        players={players}
        visible={!!activeCommentsMatch}
        onClose={() => setActiveCommentsMatch(null)}
        onAddReaction={addReaction}
        onAddComment={addComment}
      />

      {/* Modal Autenticazione & Switch Utente */}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />

      {/* Modal Profilo Utente & Impostazioni / Admin */}
      <UserProfileModal
        visible={isUserProfileModalVisible}
        onClose={() => setIsUserProfileModalVisible(false)}
        onNavigateToShop={() => {
          setIsUserProfileModalVisible(false);
          handleTabPress('shop');
        }}
      />

      {/* Modal Gestione Lega, Stagioni & Albo d'Oro */}
      <LeagueManagementModal
        visible={isLeagueModalVisible}
        onClose={() => setIsLeagueModalVisible(false)}
      />

      {/* Modal Segnalazioni & Feedback AI */}
      <ReportIssueModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
      />

      {/* Modal Arbitraggio Live a Schermo Intero */}
      <FullScreenLiveMatchModal
        visible={isLiveRefereeOpen && !!liveRefereeConfig}
        player1={liveRefereeConfig?.player1 || null}
        player2={liveRefereeConfig?.player2 || null}
        initialTargetPoints={liveRefereeConfig?.targetPoints || 11}
        onClose={(opts) => closeLiveReferee(opts)}
        onFinishMatch={(s1, s2, stats, comments, reactions) => {
          if (liveRefereeConfig?.player1 && liveRefereeConfig?.player2) {
            recordMatch(
              liveRefereeConfig.player1.id,
              liveRefereeConfig.player2.id,
              s1,
              s2,
              { stats, comments, reactions }
            );
          }
          closeLiveReferee({ forceCancelMatch: true });
        }}
      />
    </SafeAreaView>
  );
}

function MainAppRouter() {
  const { isAuthLoading, currentUser, currentLeague } = useElo();

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.splashContainer} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="light" />
        <Text style={styles.splashIcon}>🏓</Text>
        <Text style={styles.splashTitle}>ELO PING PONG</Text>
        <Text style={styles.splashSub}>🕵️‍♂️ Riunione Segreta</Text>
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  if (!currentLeague) {
    return <LeagueGateScreen />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <EloProvider>
        <MainAppRouter />
      </EloProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 22, 35, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  headerLeaguePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 6,
  },
  headerLeagueText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  headerSeasonBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  headerSeasonBadgeText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '900',
  },
  headerReportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  headerReportText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800',
  },
  headerCoinsPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  headerCoinsText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '900',
  },
  headerUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
    maxWidth: 140,
  },
  headerUserAvatar: {
    fontSize: 14,
  },
  headerUserName: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerLoginText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F1623',
    borderTopWidth: 1.5,
    borderTopColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 60,
  },
  tabItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.65,
  },
  tabEmojiActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  tabLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  splashIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  splashTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  splashSub: {
    color: '#FDE047',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 1,
  },
  liveSpectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#6366F1',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  liveSpectatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveSpectatorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveSpectatorVersus: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  liveScoreHighlight: {
    color: '#FDE047',
    fontWeight: '900',
    fontSize: 14,
  },
  liveSpectatorRight: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  liveSpectatorAction: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
