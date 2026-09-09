import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useElo } from '../context/EloContext';
import { submitReport } from '../core/firebaseService';
import { ReportCategory } from '../core/types';
import { Colors } from '../theme/colors';

interface ReportIssueModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { key: ReportCategory; label: string; icon: string }[] = [
  { key: 'bug', label: 'Bug / Errore', icon: '🐛' },
  { key: 'feature', label: 'Nuova Funzione', icon: '✨' },
  { key: 'match_dispute', label: 'Contestazione Match', icon: '🏓' },
  { key: 'general', label: 'Suggerimento / Altro', icon: '💬' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ visible, onClose }) => {
  const { currentUser, associatedPlayer, currentLeague } = useElo();
  const [category, setCategory] = useState<ReportCategory>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      const msg = 'Inserisci un titolo per la segnalazione!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Campo Obbligatorio', msg);
      return;
    }
    if (!description.trim()) {
      const msg = 'Inserisci una descrizione dettagliata!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Campo Obbligatorio', msg);
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);

    const catObj = CATEGORIES.find((c) => c.key === category);
    const result = await submitReport({
      authorUid: currentUser?.uid || 'anon',
      authorEmail: currentUser?.email || 'anonimo@elopingpong.app',
      authorPlayerName: associatedPlayer?.name || currentUser?.email || 'Agente Anonimo',
      authorPlayerAvatar: associatedPlayer?.avatar || '👤',
      leagueId: currentLeague?.id || 'riunione_default',
      leagueName: currentLeague?.name || 'Riunione Segreta',
      category,
      categoryLabel: catObj ? `${catObj.icon} ${catObj.label}` : category,
      title: title.trim(),
      description: description.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg('✅ Segnalazione inviata con successo al server! L\'Agente AI la esaminerà quando richiesto.');
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1600);
    } else {
      const errMsg = result.error || 'Errore durante l\'invio della segnalazione.';
      Platform.OS === 'web' ? window.alert(errMsg) : Alert.alert('Errore', errMsg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerIcon}>🚨</Text>
              <Text style={styles.title}>Segnala all'AI</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Invia bug, suggerimenti o contestazioni partite. La segnalazione viene registrata nel server: quando chiedi all'Agente AI di controllare, lui esaminerà la richiesta e potrà agire sul codice o sui dati!
              </Text>
            </View>

            {successMsg && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Categoria */}
            <Text style={styles.label}>Categoria Segnalazione</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Titolo */}
            <Text style={styles.label}>Titolo / Oggetto</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Es. Il punteggio della partita tra Taddei e Gabriele..."
              placeholderTextColor={Colors.textMuted}
            />

            {/* Descrizione */}
            <Text style={styles.label}>Descrizione Dettagliata</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descrivi cosa è successo o quale funzionalità vorresti che l'Agente AI sviluppasse..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Mittente Info */}
            <View style={styles.metaBox}>
              <Text style={styles.metaRow}>
                👤 <Text style={styles.metaLabel}>Autore:</Text>{' '}
                {associatedPlayer?.name || currentUser?.email || 'Non collegato'} (
                {currentUser?.email || 'Nessuna mail'})
              </Text>
              <Text style={styles.metaRow}>
                🤫 <Text style={styles.metaLabel}>Riunione:</Text>{' '}
                {currentLeague?.name || 'Riunione Segreta'}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Invio in corso...' : '🚀 Invia Segnalazione al Server'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#1E293B',
  },
  headerIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.win,
    marginBottom: 16,
  },
  successText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryLabelActive: {
    color: '#F87171',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 90,
  },
  metaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  metaRow: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },
  metaLabel: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
