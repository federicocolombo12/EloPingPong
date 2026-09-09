import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PLAYERS } from './constants';
import { AuthUserProfile, Match, Player } from './types';

const PLAYERS_KEY = '@elopingpong_players_v1';
const MATCHES_KEY = '@elopingpong_matches_v1';
const ACTIVE_LEAGUE_ID_KEY = '@elopingpong_active_league_id';
const LINKED_PLAYER_ID_KEY = '@elopingpong_linked_player_id';
const USER_SESSION_KEY = '@elopingpong_user_session_v1';

export async function loadSavedUserSession(): Promise<AuthUserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveSavedUserSession(user: AuthUserProfile | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    }
  } catch (err) {
    console.error('Errore salvataggio sessione utente:', err);
  }
}

export async function loadActiveLeagueId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_LEAGUE_ID_KEY);
  } catch {
    return null;
  }
}

export async function saveActiveLeagueId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_LEAGUE_ID_KEY, id);
  } catch (err) {
    console.error('Errore salvataggio activeLeagueId:', err);
  }
}

export async function loadLinkedPlayerId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LINKED_PLAYER_ID_KEY);
  } catch {
    return null;
  }
}

export async function saveLinkedPlayerId(id: string | null): Promise<void> {
  try {
    if (id) {
      await AsyncStorage.setItem(LINKED_PLAYER_ID_KEY, id);
    } else {
      await AsyncStorage.removeItem(LINKED_PLAYER_ID_KEY);
    }
  } catch (err) {
    console.error('Errore salvataggio linkedPlayerId:', err);
  }
}

export async function loadPlayers(): Promise<Player[]> {
  try {
    const raw = await AsyncStorage.getItem(PLAYERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: Player[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    console.warn('Errore nel caricamento dei giocatori da storage:', error);
    return [];
  }
}

export async function savePlayers(players: Player[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch (error) {
    console.error('Errore nel salvataggio dei giocatori su storage:', error);
  }
}

export async function loadMatches(): Promise<Match[]> {
  try {
    const raw = await AsyncStorage.getItem(MATCHES_KEY);
    if (!raw) return [];
    const parsed: Match[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Errore nel caricamento delle partite da storage:', error);
    return [];
  }
}

export async function saveMatches(matches: Match[]): Promise<void> {
  try {
    await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  } catch (error) {
    console.error('Errore nel salvataggio delle partite su storage:', error);
  }
}

export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      PLAYERS_KEY,
      MATCHES_KEY,
      ACTIVE_LEAGUE_ID_KEY,
      LINKED_PLAYER_ID_KEY,
      USER_SESSION_KEY,
    ]);
  } catch (error) {
    console.error('Errore nella cancellazione dello storage:', error);
  }
}
