import { Player } from './types';

/**
 * Utility di sicurezza e crittografia per hashing irreversibile delle password.
 * Implementazione pura di SHA-256 standard con Salt per garantire compatibilità
 * su qualsiasi piattaforma (Web, iOS, Android, Node) senza dipendenze native.
 */

const SALT = 'pingpong_secret_salt_v2026_elo_';

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: { [key: number]: boolean } = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let composite = candidate * candidate; composite < 312; composite += candidate) {
        isComposite[composite] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);

  for (i = 0; i < ascii.length; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = new Array(64);

  for (i = 0; i < words.length; i += 16) {
    const a = hash.slice(0);

    for (j = 0; j < 64; j++) {
      let s0: number, s1: number, t1: number, t2: number;
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      s1 = rightRotate(a[4], 6) ^ rightRotate(a[4], 11) ^ rightRotate(a[4], 25);
      const ch = (a[4] & a[5]) ^ (~a[4] & a[6]);
      t1 = (a[7] + s1 + ch + k[j] + w[j]) | 0;

      s0 = rightRotate(a[0], 2) ^ rightRotate(a[0], 13) ^ rightRotate(a[0], 22);
      const maj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]);
      t2 = (s0 + maj) | 0;

      a[7] = a[6];
      a[6] = a[5];
      a[5] = a[4];
      a[4] = (a[3] + t1) | 0;
      a[3] = a[2];
      a[2] = a[1];
      a[1] = a[0];
      a[0] = (t1 + t2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + a[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Calcola l'hash irreversibile della password con Salt crittografico.
 * La password reale non viene mai salvata in chiaro sul database.
 */
export function hashPassword(password: string): string {
  return sha256(SALT + password);
}

/**
 * Verifica una password controllando se il suo hash coincide.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ---------------------------------------------------------------------------
// PROTEZIONI ANTI-IDOR (Insecure Direct Object Reference) & SANITIZZAZIONE
// ---------------------------------------------------------------------------

/**
 * Whitelist rigorosa dei campi profilo modificabili.
 * Blocca qualsiasi tentativo di manipolazione diretta di Elo, vittorie, sconfitte o ID.
 */
export function sanitizePlayerUpdates(updates: Partial<Player>): Partial<Player> {
  const sanitized: Partial<Player> = {};

  if (typeof updates.name === 'string') {
    sanitized.name = updates.name.trim().slice(0, 32);
  }
  if (typeof updates.avatar === 'string') {
    sanitized.avatar = updates.avatar.slice(0, 8);
  }
  if (typeof updates.customAvatarUrl === 'string') {
    sanitized.customAvatarUrl = updates.customAvatarUrl.trim().slice(0, 500);
  }
  if (typeof updates.profileBanner === 'string') {
    sanitized.profileBanner = updates.profileBanner.trim().slice(0, 500);
  }
  if (typeof updates.celebrationGifUrl === 'string') {
    sanitized.celebrationGifUrl = updates.celebrationGifUrl.trim().slice(0, 500);
  }
  if (typeof updates.color === 'string') {
    sanitized.color = updates.color.slice(0, 16);
  }
  if (typeof updates.catchphrase === 'string') {
    sanitized.catchphrase = updates.catchphrase.trim().slice(0, 120);
  }
  if (Array.isArray(updates.tags)) {
    sanitized.tags = updates.tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim().slice(0, 32))
      .slice(0, 15);
  }

  return sanitized;
}

/**
 * Verifica anti-IDOR: solo il proprietario del profilo o l'admin possono modificare i dati
 */
export function validatePlayerOwnership(
  targetPlayerId: string,
  assignedPlayerId?: string | null,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  return !!assignedPlayerId && assignedPlayerId === targetPlayerId;
}

/**
 * Verifica anti-IDOR: accerta che l'utente appartenga alla Riunione Segreta
 */
export function validateLeagueMembership(
  userUid?: string,
  leagueMembers?: Record<string, { uid: string }>,
  adminUid?: string
): boolean {
  if (!userUid) return false;
  if (adminUid && userUid === adminUid) return true;
  if (leagueMembers && leagueMembers[userUid]) return true;
  return false;
}


