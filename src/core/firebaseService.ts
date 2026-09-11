import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    initializeFirestore,
    onSnapshot,
    query,
    setDoc,
    where,
} from 'firebase/firestore';
import {
    DEFAULT_CUSTOM_TAGS,
    DEFAULT_LEAGUE_CODE,
    DEFAULT_LEAGUE_ID,
    DEFAULT_LEAGUE_NAME,
} from './constants';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';
import { hashPassword } from './security';
import { AuthUserProfile, CustomTag, League, Match, MatchBackupRecord, Player, ReportSubmission, Season } from './types';

let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
      });
    } catch {
      const { getFirestore } = require('firebase/firestore');
      db = getFirestore(app);
    }
    auth = getAuth(app);
  } catch (err) {
    console.warn('Inizializzazione Firebase/Firestore fallita:', err);
  }
}

/**
 * Pulisce qualsiasi valore undefined prima del salvataggio in Firestore
 */
export function sanitizeForFirestore<T>(data: T): T {
  try {
    return JSON.parse(
      JSON.stringify(data, (_, value) => (value === undefined ? null : value))
    );
  } catch {
    return data;
  }
}

// ----------------------------------------------------
// AUTHENTICATION SERVICES
// ----------------------------------------------------

function emailToDocId(email: string): string {
  return 'acc_' + email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

export interface SimpleAuthUser {
  uid: string;
  email: string | null;
}

export async function signUpWithEmail(
  email: string,
  pass: string
): Promise<{ user?: SimpleAuthUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Prova prima con Firebase Auth ufficiale se attivo
  if (auth) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      return { user: { uid: cred.user.uid, email: cred.user.email || cleanEmail } };
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        return { error: 'Email già registrata. Effettua il login!' };
      }
      if (err.code === 'auth/weak-password') {
        return { error: 'La password deve avere almeno 6 caratteri.' };
      }
      if (err.code === 'auth/invalid-email') {
        return { error: 'Formato email non valido.' };
      }
      console.warn('Firebase Auth non attivo o non configurato, procedo con registrazione Firestore:', err.message || err.code);
    }
  }

  // 2. Fallback resiliente su Firestore
  if (!db || !isFirebaseConfigured()) {
    return { error: 'Database Firebase non configurato' };
  }

  try {
    const accDocId = emailToDocId(cleanEmail);
    const accRef = doc(db, 'accounts', accDocId);
    const existingSnap = await getDoc(accRef);

    if (existingSnap.exists()) {
      return { error: 'Email già registrata. Effettua il login!' };
    }

    const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const passwordHash = hashPassword(pass);
    const accountData = {
      uid,
      email: cleanEmail,
      passwordHash,
      joinedLeagueIds: [],
      activeLeagueId: '',
      createdAt: Date.now(),
    };

    await setDoc(accRef, sanitizeForFirestore(accountData));
    // Nei profili pubblici users non memorizziamo mai la password
    await setDoc(doc(db, 'users', uid), sanitizeForFirestore({
      uid,
      email: cleanEmail,
      joinedLeagueIds: [],
      activeLeagueId: '',
      createdAt: Date.now(),
    }));

    return { user: { uid, email: cleanEmail } };
  } catch (err: any) {
    console.error('Errore fallback registrazione Firestore:', err);
    return { error: 'Impossibile completare la registrazione: ' + (err?.message || 'errore database') };
  }
}

export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{ user?: SimpleAuthUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Prova prima con Firebase Auth ufficiale
  if (auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      return { user: { uid: cred.user.uid, email: cred.user.email || cleanEmail } };
    } catch (err: any) {
      console.warn('Firebase Auth signIn fallito o non attivo:', err.code, err.message);
    }
  }

  // 2. Fallback trasparente su Firestore
  if (!db || !isFirebaseConfigured()) {
    return { error: 'Database Firebase non configurato' };
  }

  try {
    const accDocId = emailToDocId(cleanEmail);
    const accSnap = await getDoc(doc(db, 'accounts', accDocId));

    if (!accSnap.exists()) {
      return { error: 'Nessun account trovato con questa email. Clicca su "Registrati"!' };
    }

    const accData = accSnap.data();
    const cleanPass = pass.trim();
    const hashed = hashPassword(pass);
    const hashedClean = hashPassword(cleanPass);
    const isPasswordValid =
      accData.passwordHash === hashed ||
      accData.passwordHash === hashedClean ||
      accData.password === pass ||
      accData.password === cleanPass ||
      accData.password === hashed;

    if (!isPasswordValid) {
      return { error: 'Password errata per questa email.' };
    }

    // Se l'account memorizzava ancora la password in chiaro, migrala automaticamente all'hash e rimuovi il testo in chiaro
    if (accData.password) {
      await setDoc(doc(db, 'accounts', accDocId), { passwordHash: hashed, password: null }, { merge: true });
    }

    return {
      user: {
        uid: accData.uid,
        email: accData.email || cleanEmail,
      },
    };
  } catch (err: any) {
    console.error('Errore login Firestore:', err);
    return { error: 'Errore durante il login: ' + (err?.message || 'riprova') };
  }
}

/**
 * Invia una segnalazione o richiesta al server Firestore
 */
export async function submitReport(
  report: Omit<ReportSubmission, 'id' | 'timestamp' | 'status'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db || !isFirebaseConfigured()) {
    return { success: false, error: 'Database non configurato' };
  }
  try {
    const reportId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const fullReport: ReportSubmission = {
      ...report,
      id: reportId,
      timestamp: Date.now(),
      status: 'pending',
    };
    await setDoc(doc(db, 'reports', reportId), sanitizeForFirestore(fullReport));
    return { success: true, id: reportId };
  } catch (err: any) {
    console.error('Errore invio segnalazione:', err);
    return { success: false, error: err?.message || 'Impossibile inviare la segnalazione' };
  }
}

/**
 * Recupera tutte le segnalazioni dal server
 */
export async function fetchReports(): Promise<ReportSubmission[]> {
  if (!db || !isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(collection(db, 'reports'));
    const reports: ReportSubmission[] = [];
    snap.forEach((d: any) => reports.push(d.data() as ReportSubmission));
    return reports.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Errore recupero segnalazioni:', err);
    return [];
  }
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): (() => void) | null {
  if (!auth) return null;
  return onAuthStateChanged(auth, callback);
}

// ----------------------------------------------------
// LEAGUE & DATA REALTIME SERVICES
// ----------------------------------------------------

export function buildDefaultLeague(
  id: string = DEFAULT_LEAGUE_ID,
  name: string = 'Riunione Segreta',
  code: string = DEFAULT_LEAGUE_CODE,
  players: Player[] = [],
  matches: Match[] = [],
  adminUid: string = 'admin_default',
  maxPlayers: number = 4
): League {
  const initialSeason: Season = {
    id: 'season_1',
    number: 1,
    name: 'Stagione 1',
    status: 'active',
    startDate: Date.now(),
    matchesCount: matches.length,
  };

  return {
    id,
    name,
    code,
    adminUid,
    maxPlayers,
    createdAt: Date.now(),
    currentSeasonId: 'season_1',
    seasons: [initialSeason],
    players,
    matches,
    customTags: DEFAULT_CUSTOM_TAGS,
    members: {},
  };
}

/**
 * Cancella i vecchi documenti mock da Firestore
 */
export async function wipeOldMockData(): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, 'rooms', 'elopingpong_room_1'));
    await deleteDoc(doc(db, 'leagues', 'elopingpong_room_1'));
    console.log('Vecchi dati mock Firestore eliminati con successo.');
  } catch (err) {
    console.warn('Avviso pulizia mock Firestore:', err);
  }
}

/**
 * Recupera il profilo utente su Firestore
 */
export async function getUserProfile(uid: string): Promise<AuthUserProfile | null> {
  if (!db || !isFirebaseConfigured()) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as AuthUserProfile;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Salva o aggiorna il profilo utente su Firestore
 */
export async function saveUserProfile(
  uid: string,
  profile: Partial<AuthUserProfile>
): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;
  try {
    await setDoc(doc(db, 'users', uid), sanitizeForFirestore(profile), { merge: true });
  } catch (err) {
    console.error('Errore salvataggio profilo utente:', err);
  }
}

/**
 * Crea una nuova Riunione Segreta su Firestore
 */
export async function createSecretMeeting(
  name: string,
  maxPlayers: number,
  capoUser: { uid: string; email: string },
  capoPlayer: Player
): Promise<{ success: boolean; meeting?: League; error?: string }> {
  if (!db || !isFirebaseConfigured()) {
    return { success: false, error: 'Database Firebase non configurato' };
  }

  try {
    const meetingId = 'meeting_' + Math.random().toString(36).substring(2, 9);
    // Codice univoco a 6 caratteri alfanumerici maiuscoli
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const initialSeason: Season = {
      id: 'season_1',
      number: 1,
      name: 'Stagione 1',
      status: 'active',
      startDate: Date.now(),
      matchesCount: 0,
    };

    const newMeeting: League = {
      id: meetingId,
      name: name.trim(),
      code,
      adminUid: capoUser.uid,
      maxPlayers,
      createdAt: Date.now(),
      currentSeasonId: 'season_1',
      seasons: [initialSeason],
      players: [capoPlayer],
      matches: [],
      customTags: DEFAULT_CUSTOM_TAGS,
      members: {
        [capoUser.uid]: {
          uid: capoUser.uid,
          email: capoUser.email,
          role: 'admin',
          playerId: capoPlayer.id,
          joinedAt: Date.now(),
        },
      },
    };

    await setDoc(doc(db, 'leagues', meetingId), sanitizeForFirestore(newMeeting));
    await saveUserProfile(capoUser.uid, {
      uid: capoUser.uid,
      email: capoUser.email,
      activeLeagueId: meetingId,
      joinedLeagueIds: [meetingId],
      associatedPlayerId: capoPlayer.id,
    });

    return { success: true, meeting: newMeeting };
  } catch (err: any) {
    console.error('Errore creazione Riunione Segreta:', err);
    return { success: false, error: err?.message || 'Impossibile fondare la Riunione Segreta' };
  }
}

/**
 * Unisciti a una Riunione Segreta con codice e profilo
 */
export async function joinSecretMeeting(
  code: string,
  memberUser: { uid: string; email: string },
  memberPlayer: Player
): Promise<{ success: boolean; meeting?: League; error?: string }> {
  if (!db || !isFirebaseConfigured()) {
    return { success: false, error: 'Database Firebase non configurato' };
  }

  try {
    const q = query(
      collection(db, 'leagues'),
      where('code', '==', code.trim().toUpperCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { success: false, error: 'Nessuna Riunione Segreta trovata con questo codice!' };
    }

    const meetingDoc = snap.docs[0];
    const meeting = meetingDoc.data() as League;

    // Se già membro, aggiorna profilo utente ed entra
    if (meeting.members && meeting.members[memberUser.uid]) {
      await saveUserProfile(memberUser.uid, {
        uid: memberUser.uid,
        email: memberUser.email,
        activeLeagueId: meeting.id,
        associatedPlayerId: meeting.members[memberUser.uid].playerId || memberPlayer.id,
      });
      return { success: true, meeting };
    }

    // Verifica capienza massima
    const currentCount = meeting.players?.length || 0;
    const maxCount = meeting.maxPlayers || 4;
    if (currentCount >= maxCount) {
      return {
        success: false,
        error: `Questa Riunione Segreta ha già raggiunto il limite massimo di ${maxCount} partecipanti!`,
      };
    }

    // Verifica nome duplicato
    const nameExists = meeting.players?.some(
      (p) => p.name.trim().toLowerCase() === memberPlayer.name.trim().toLowerCase()
    );
    if (nameExists) {
      return {
        success: false,
        error: `Un giocatore con il nome "${memberPlayer.name}" è già presente nella Riunione Segreta!`,
      };
    }

    const updatedPlayers = [...(meeting.players || []), memberPlayer];
    const updatedMembers = {
      ...(meeting.members || {}),
      [memberUser.uid]: {
        uid: memberUser.uid,
        email: memberUser.email,
        role: 'member' as const,
        playerId: memberPlayer.id,
        joinedAt: Date.now(),
      },
    };

    const updatedMeeting: League = {
      ...meeting,
      players: updatedPlayers,
      members: updatedMembers,
    };

    await setDoc(doc(db, 'leagues', meeting.id), sanitizeForFirestore(updatedMeeting));
    await saveUserProfile(memberUser.uid, {
      uid: memberUser.uid,
      email: memberUser.email,
      activeLeagueId: meeting.id,
      associatedPlayerId: memberPlayer.id,
    });

    return { success: true, meeting: updatedMeeting };
  } catch (err: any) {
    console.error('Errore ingresso Riunione Segreta:', err);
    return { success: false, error: err?.message || 'Impossibile unirsi alla Riunione Segreta' };
  }
}

/**
 * Si iscrive alla Riunione Segreta attiva su Firestore in tempo reale
 */
export function subscribeToLeagueData(
  leagueId: string,
  onUpdate: (league: League) => void
): (() => void) | null {
  if (!db || !isFirebaseConfigured()) {
    return null;
  }

  const leagueRef = doc(db, 'leagues', leagueId);

  const unsubscribe = onSnapshot(
    leagueRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data() as League;
        if (raw) {
          const sanitizedLeague: League = {
            ...raw,
            id: raw.id || leagueId,
            players: raw.players || [],
            matches: raw.matches || [],
            maxPlayers: raw.maxPlayers || 4,
            seasons: raw.seasons || [
              {
                id: 'season_1',
                number: 1,
                name: 'Stagione 1',
                status: 'active',
                startDate: Date.now(),
                matchesCount: raw.matches?.length || 0,
              },
            ],
            currentSeasonId: raw.currentSeasonId || 'season_1',
            customTags: raw.customTags || DEFAULT_CUSTOM_TAGS,
            members: raw.members || {},
          };
          onUpdate(sanitizedLeague);
        }
      }
    },
    (error) => {
      console.error('Errore snapshot real-time Riunione Segreta Firebase:', error);
    }
  );

  return unsubscribe;
}

/**
 * Salva l'intera lega su Firestore in modo atomico e pulito da undefined
 */
export async function syncLeagueToCloud(league: League): Promise<boolean> {
  if (!db || !isFirebaseConfigured()) {
    return false;
  }

  try {
    const cleanLeague = sanitizeForFirestore({
      ...league,
      lastUpdated: Date.now(),
    });
    const leagueRef = doc(db, 'leagues', league.id);
    await setDoc(leagueRef, cleanLeague);
    return true;
  } catch (error) {
    console.error('Errore sincronizzazione lega su Firebase:', error);
    return false;
  }
}

/**
 * Cerca una lega tramite codice invito a 6 cifre
 */
export async function findLeagueByCode(code: string): Promise<League | null> {
  if (!db || !isFirebaseConfigured()) return null;

  try {
    const q = query(
      collection(db, 'leagues'),
      where('code', '==', code.trim().toUpperCase())
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as League;
    }
    return null;
  } catch (err) {
    console.error('Errore ricerca lega per codice:', err);
    return null;
  }
}

/**
 * Retro-compatibilità per salvataggio generico
 */
export async function syncStateToCloud(
  players: Player[],
  matches: Match[]
): Promise<boolean> {
  if (!db || !isFirebaseConfigured()) return false;
  try {
    const roomRef = doc(db, 'rooms', 'elopingpong_room_1');
    await setDoc(roomRef, sanitizeForFirestore({
      players,
      matches,
      lastUpdated: Date.now(),
    }));
    return true;
  } catch (err) {
    console.error('Errore sincronizzazione cloud legacy:', err);
    return false;
  }
}

/**
 * Salva una copia di backup immutabile (audit log) di una partita nel vault Firestore (match_backups)
 */
export async function saveMatchBackup(backup: MatchBackupRecord): Promise<boolean> {
  if (!db || !isFirebaseConfigured()) return false;
  try {
    const backupRef = doc(db, 'match_backups', backup.id);
    await setDoc(backupRef, sanitizeForFirestore({
      ...backup,
      backupSavedAt: Date.now(),
    }));
    return true;
  } catch (err) {
    console.error('Errore salvataggio backup partita:', err);
    return false;
  }
}

/**
 * Recupera l'elenco di tutte le partite salvate nel vault di backup (completate o annullate)
 */
export async function fetchMatchBackups(leagueId?: string): Promise<MatchBackupRecord[]> {
  if (!db || !isFirebaseConfigured()) return [];
  try {
    const colRef = collection(db, 'match_backups');
    const q = leagueId ? query(colRef, where('leagueId', '==', leagueId)) : colRef;
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as MatchBackupRecord);
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    console.error('Errore recupero backup partite:', err);
    return [];
  }
}

