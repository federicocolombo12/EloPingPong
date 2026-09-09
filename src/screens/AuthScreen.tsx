import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { Colors } from '../theme/colors';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail } = useElo();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Inserisci sia email che password');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La password deve contenere almeno 6 caratteri');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await registerWithEmail(trimmedEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Errore durante la registrazione');
        }
      } else {
        const res = await loginWithEmail(trimmedEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Credenziali non valide');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Si è verificato un errore imprevisto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandIcon}>🏓</Text>
          <Text style={styles.brandTitle}>ELO PING PONG</Text>
          <View style={styles.taglineBadge}>
            <Text style={styles.taglineText}>🕵️‍♂️ RIUNIONE SEGRETA</Text>
          </View>
          <Text style={styles.brandSubtitle}>
            Accedi o crea il tuo account per partecipare alla Riunione Segreta, registrare sfide e
            scalare la classifica Elo!
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.authCard}>
          {/* Tab Switcher */}
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              onPress={() => {
                setIsRegister(false);
                setErrorMsg(null);
              }}
              style={[styles.tabBtn, !isRegister && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, !isRegister && styles.tabBtnTextActive]}>
                Accedi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsRegister(true);
                setErrorMsg(null);
              }}
              style={[styles.tabBtn, isRegister && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, isRegister && styles.tabBtnTextActive]}>
                Registrati
              </Text>
            </TouchableOpacity>
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="latuaemail@esempio.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimo 6 caratteri..."
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textDark} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegister ? 'Crea Account & Inizia 🚀' : 'Entra nella Riunione 🔓'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            🔒 I dati e le statistiche sono sincronizzati in tempo reale tra tutti i membri.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIcon: {
    fontSize: 56,
    marginBottom: 10,
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  taglineBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginVertical: 10,
  },
  taglineText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  authCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: Colors.primary,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  submitBtnText: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: '900',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  errorText: {
    color: Colors.loss,
    fontSize: 13,
    fontWeight: '700',
  },
  footerNote: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
