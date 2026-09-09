import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { useElo } from '../context/EloContext';
import { Colors } from '../theme/colors';

export const HistoryScreen: React.FC = () => {
  const { matches, players, undoLastMatch, setActiveCommentsMatch, addReaction } = useElo();

  const handleUndo = () => {
    const confirmMessage =
      'Sei sicuro di voler annullare l\'ultimo match? I punti Elo e le statistiche dei due giocatori verranno ripristinati esattamente com\'erano prima.';

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        undoLastMatch();
      }
    } else {
      Alert.alert('Annulla Ultimo Match', confirmMessage, [
        { text: 'No, tieni', style: 'cancel' },
        {
          text: 'Sì, annulla',
          style: 'destructive',
          onPress: () => undoLastMatch(),
        },
      ]);
    }
  };

  const handleQuickReact = (matchId: string, emoji: string) => {
    // Reagisce come il primo giocatore o apre il thread
    if (players.length > 0) {
      addReaction(matchId, emoji, players[0].id);
    }
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
          <Text style={styles.headerIcon}>📜</Text>
          <Text style={styles.headerTitle}>STORICO PARTITE</Text>
        </View>
        <Text style={styles.headerSub}>
          Reagisci con emoji 🔥 o apri i commenti stile Reddit per sfottere i tuoi amici!
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {matches.length} {matches.length === 1 ? 'partita registrata' : 'partite registrate'}
          </Text>
        </View>
      </View>

      {/* Lista match */}
      {matches.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🏓</Text>
          <Text style={styles.emptyTitle}>Nessuna partita ancora giocata!</Text>
          <Text style={styles.emptyText}>
            Impugnate le racchette, andate nella tab "Nuovo Match" e registrate la prima sfida!
          </Text>
        </View>
      ) : (
        matches.map((match, index) => (
          <MatchCard
            key={match.id}
            match={match}
            players={players}
            isLatest={index === 0}
            onUndo={index === 0 ? handleUndo : undefined}
            onOpenComments={(m) => setActiveCommentsMatch(m)}
            onQuickReact={handleQuickReact}
          />
        ))
      )}

      {matches.length > 0 && (
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            💡 Puoi annullare solo l'ultimo match registrato per garantire la coerenza dell'Elo.
          </Text>
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
    paddingVertical: 14,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
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
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerNote: {
    marginTop: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerNoteText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
