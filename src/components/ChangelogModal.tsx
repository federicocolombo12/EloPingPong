import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';

interface ChangelogModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ChangelogRelease {
  version: string;
  codename: string;
  date: string;
  isCurrent?: boolean;
  features: { icon: string; title: string; desc: string }[];
}

export const RELEASES: ChangelogRelease[] = [
  {
    version: 'v3.0.0',
    codename: 'Bazar d\'Élite, 6-Tier Achievements & Multi-Market Live Bet',
    date: 'Settembre 2026',
    isCurrent: true,
    features: [
      {
        icon: '🛍️',
        title: 'Bazar Rinnovato & Trofei d\'Élite',
        desc: 'Interfaccia compatta a 6 schede orizzontali senza scroll. Trofei prestigiosi (Anello del Campione, Racchetta di Diamante, G.O.A.T., Monumento), aure neon (RGB e Oro Puro) e inni di vittoria sonori.',
      },
      {
        icon: '🎮',
        title: 'FFVII Fanfare & Inni di Vittoria',
        desc: 'Inno trionfale procedurale con il leggendario jingle di vittoria di Final Fantasy VII (FFVII) riprodotto ad ogni tuo trionfo, con pulsante di anteprima audio nello shop!',
      },
      {
        icon: '🎡',
        title: 'Ruota della Fortuna & Sussidio 24h',
        desc: '1 spin gratis ogni 24h alla Ruota della Fortuna (successivi a 50 🪙) con ricchi premi, Booster 2x e Jackpot da 500 🪙. Sussidio giornaliero di 50 monete ogni giorno.',
      },
      {
        icon: '🎲',
        title: 'Scommesse Live Multi-Mercato & Anti-Biscotto',
        desc: 'Quote live dinamiche su 5 mercati: Vincitore, Under/Over punti, Botto di Smash, Fattore Culo (spigoli/retine) e Vantaggi ai Titoli di Coda. Regola ferrea anti-match-fixing: chi gioca in campo può puntare solo sulla propria vittoria!',
      },
      {
        icon: '🌟',
        title: '8 Obiettivi a 6 Livelli (Fino a Gear 5)',
        desc: 'Achievement retroattivi calcolati sullo storico per smash, ace, difese, freddezza, strisce, vittorie, scommesse e patrimonio. 6 tier: Legno, Bronzo, Argento, Oro, Diamante e Gear 5 con monete riscattabili!',
      },
      {
        icon: '🎯',
        title: 'Poster WANTED & Piazza Taglia',
        desc: 'Nuova sezione taglie nella Scheda Agente: piazza una taglia in LUL Coins sulla testa dei rivali; chiunque li batterà in un match live incasserà subito il bottino!',
      },
      {
        icon: '🛡️',
        title: 'Meritocrazia Trofei & Tag',
        desc: 'Eliminata l\'auto-assegnazione arbitraria: si possono equipaggiare solo trofei e titoli conquistati con merito o acquistati nel Bazar.',
      },
    ],
  },
  {
    version: 'v2.9.0',
    codename: 'Bazar, Stats Unificate & Live Redesign',
    date: 'Settembre 2026',
    isCurrent: false,
    features: [
      {
        icon: '🛍️',
        title: 'Bazar di Lega & Mystery Box',
        desc: 'Spendi i tuoi LUL Coins per sbloccare titoli cosmetici da sfoggiare, bordi neon brillanti per la tua card giocatore, l\'Assicurazione Scommesse (rimborso 50% sulla prossima bet persa) e la Mystery Box da 50 🪙 per tentare la fortuna fino a 500 monete!',
      },
      {
        icon: '📊',
        title: 'Schermata Stats Unificata (3 Sub-Tab)',
        desc: 'Unione perfetta di Trend e Storico in 3 sezioni: Globale (classifiche, Wall Street e trofei meme), Personali (coach AI, superpoteri, punti deboli e rivalità contro chiunque selezionabile con un tocco) e Storico con filtri temporali rapidi.',
      },
      {
        icon: '🔍',
        title: 'Scheda Giocatore & Ispezione Matchup',
        desc: 'Tocca qualsiasi giocatore dal podio o dalla classifica per aprire la sua scheda profilo ufficiale, ispezionare il suo equipaggiamento e saltare subito alla sua analisi statistica e testa a testa.',
      },
      {
        icon: '🎲',
        title: 'Live Match Redesign & Anti-Hedging',
        desc: 'Interfaccia del match a tutto schermo ripulita da chat e reazioni con nuovo pulsante scommesse circolare dorato 🎲. Regola anti-hedging attiva (scommettere sull\'altro giocatore rimborsa la scommessa precedente) e rimborso totale garantito in caso di partita annullata.',
      },
      {
        icon: '👑',
        title: 'Reset Monete Admin & Accesso Profilo',
        desc: 'Pulsante admin dedicato per resettare i LUL Coins di tutti a 200 senza toccare partite ed Elo. Profilo, admin panel, bug report e changelog ora comodamente racchiusi nel menu utente in alto.',
      },
    ],
  },
  {
    version: 'v2.8.0',
    codename: 'LUL Coins & Live Bet Dinamiche',
    date: 'Settembre 2026',
    isCurrent: false,
    features: [
      {
        icon: '🪙',
        title: 'LUL Coins & Nuova Economia di Lega',
        desc: 'Arrivano i LUL Coins con 200 monete di partenza per ciascun giocatore! Guadagni 15 monete vincendo un match e 10 monete di consolazione per la partecipazione. Finito a secco? Richiedi il Sussidio di Povertà (+50 🪙 ogni 12h)!',
      },
      {
        icon: '🎲',
        title: 'Riunione Bet: Pre-Match & Live Dinamiche',
        desc: 'Piazza le tue scommesse prima dell\'inizio (o entro i 6 punti totali) con quote basate su Elo, oppure scommetti in tempo reale punto su punto con quote dinamiche ricalcolate da un algoritmo di induzione a ritroso. Rimonte impossibili quotate fino a 50.00x!',
      },
      {
        icon: '🏛️',
        title: 'Wall Street Arena nei Trend',
        desc: 'Nuova classifica finanziaria con titoli di prestigio (Magnate, Broker, Bancarotta), statistiche su scommesse vinte/perse e profitto netto cumulato.',
      },
      {
        icon: '🔒',
        title: 'Inibizione Ace & Fallo per il Ricevitore',
        desc: 'I pulsanti Ace e Fallo nel segnapunti live sono ora abilitati solo per il giocatore al servizio; per chi riceve risultano disabilitati e attenuati graficamente per prevenire errori.',
      },
      {
        icon: '🎖️',
        title: 'Milestone Elo a 25 Punti & Badge Permanente',
        desc: 'Scaglioni di traguardo ridotti a intervalli di 25 punti (1225, 1250, 1275, 1300...) con celebrazione anche per i traguardi raggiunti mentre eri offline e badge permanente del massimo tier raggiunto visibile su card e profilo (es. 👑 1500+, 💎 1450+, 🎖️ 1300+).',
      },
    ],
  },
  {
    version: 'v2.7.0',
    codename: 'Punto Stile, Punto Culo & Visual Serve Indicator',
    date: 'Settembre 2026',
    isCurrent: false,
    features: [
      {
        icon: '🍀',
        title: 'Unione "Punto Culo" (Spigoli & Net)',
        desc: 'Spigoli e netti beffardi sono ora accorpati in un unico leggendario tasto "🍀 Punto Culo", con animazione speciale, effetto sonoro comico dedicato ed elevazione nel trofeo meme "Culo Sfondato".',
      },
      {
        icon: '✨',
        title: 'Nuovo "Punto Stile" & Trofeo Pura Classe',
        desc: 'Aggiunto il prestigioso pulsante "✨ Punto Stile" per premiare colpi geniali, virtuosismi e classe pura! Include arpeggio scintillante stile arpa magica e il nuovo trofeo "Pura Classe".',
      },
      {
        icon: '🏓',
        title: 'Visual Serve Indicator (Outline Attivo)',
        desc: 'Solo il giocatore attualmente alla battuta possiede l\'outline e il bagliore pulsante del proprio colore di gioco, garantendo massima visibilità sul turno di servizio anche da fondo campo.',
      },
      {
        icon: '📊',
        title: 'Nuove Classifiche Live nei Trend',
        desc: 'Visualizza in tempo reale le classifiche di Difese d\'Acciaio, Ace Vincenti, Punti Stile, Schiacciate ed Errori nella schermata Trend, con piena trasparenza su tutti i dati di gioco.',
      },
      {
        icon: '🏷️',
        title: 'Sincronizzazione Versioning Profilo',
        desc: 'Risolto il disallineamento della versione mostrata nei profili utente, ora sempre sincronizzata dinamicamente con il changelog ufficiale.',
      },
    ],
  },
  {
    version: 'v2.6.0',
    codename: 'Sonorizzazione Totale & Setup Sfidanti Intelligente',
    date: 'Settembre 2026',
    isCurrent: false,
    features: [
      {
        icon: '🔊',
        title: 'Sonorizzazione Totale & Web Audio Engine',
        desc: 'Tutti i tasti e gli eventi di gioco sono ora dotati di effetti sonori a bassissima latenza sintetizzati in tempo reale (Ace, Smash, Difesa, Spigolo, Net, Fallo, colpo di racchetta, Undo, reazioni emoji, vittoria e tap UI).',
      },
      {
        icon: '👥',
        title: '4 Sfidanti Perfettamente Allineati su 1 Riga',
        desc: 'Nel setup del match, tutti i 4 profili della lega sono distribuiti in modo identico e proporzionato sulla stessa riga (flex: 1), senza strabordamenti o ingrandimenti anomali del 4° profilo.',
      },
      {
        icon: '⭐️',
        title: 'Profilo Utente Connesso in Prima Posizione (Tu)',
        desc: 'Il profilo con cui sei attualmente loggato viene posizionato per primo a sinistra con il badge dorato "⭐️ TU", ed è automaticamente preselezionato come Sfidante 1 per velocizzare la registrazione.',
      },
      {
        icon: '📱',
        title: 'Design Adattivo per Leghe Multiple',
        desc: 'Se la lega conta più di 4 giocatori, il selettore passa automaticamente a uno scorrimento orizzontale compatto, preservando proporzioni e stabilità visiva su ogni smartphone.',
      },
    ],
  },
  {
    version: 'v2.5.1',
    codename: 'Live Match FX & Risoluzione Bug Segnalati',
    date: 'Settembre 2026',
    features: [
      {
        icon: '💥',
        title: 'Effetti Speciali Sincronizzati in Live',
        desc: 'All\'assegnazione di Ace, Smash, Difesa, Spigolo o Net parte un\'animazione celebrativa a tutto schermo visibile simultaneamente dalla Guardia e da tutti gli spettatori.',
      },
      {
        icon: '👮‍♂️',
        title: 'Preservazione Ruolo Guardia',
        desc: 'Chi entra in una partita live avviata vi accede come spettatore, senza sovrascrivere il match né sottrarre il ruolo di Guardia a chi l\'ha creata.',
      },
      {
        icon: '✨',
        title: 'Fix Doppia Reazione Emoji',
        desc: 'Eliminata la duplicazione visiva delle emoji per chi invia la reazione, mantenendo l\'animazione immediata e sincronizzata con gli altri client.',
      },
      {
        icon: '📱',
        title: 'Fix UI iOS su Contesa Palla',
        desc: 'Risolto il salto e il glitch grafico prima del primo punto su iOS dopo l\'assegnazione del palleggio iniziale, con sincronizzazione istantanea dello stato.',
      },
      {
        icon: '📐',
        title: 'Layout Responsive & Nomi Senza Overflow',
        desc: 'I nomi dei giocatori e le caselle di selezione ora supportano wrapping dinamico a griglia e adattamento della dimensione dei font per smartphone piccoli.',
      },
    ],
  },
  {
    version: 'v2.5.0',
    codename: 'Segnalazioni Risolte: Ace, Palla & Controlli Live',
    date: 'Settembre 2026',
    features: [
      {
        icon: '🛡️',
        title: 'Fix Uscita Spettatore in Live',
        desc: "L'uscita di uno spettatore ('Ndranghetista) non annulla più la partita sul cloud: solo la Guardia ufficiale può terminare o cancellare l'arbitraggio.",
      },
      {
        icon: '🏓',
        title: 'Contesa "Per la Palla" & Selezione Fluida',
        desc: 'Rimossa la dicitura rigida Casa/Trasferta nella creazione match. All\'inizio del match la Guardia può assegnare la prima battuta a chi ha vinto il palleggio ("Per la palla").',
      },
      {
        icon: '⚡',
        title: 'Punti Ace & Difesa con Tasti ad Alta Visibilità',
        desc: 'Interfaccia arbitraggio ridisegnata con tasti ad alto contrasto e aggiunta dei nuovi pulsanti ⚡ Ace e 🛡️ Difesa.',
      },
      {
        icon: '🚦',
        title: 'Anti-Spam Reazioni Emoji',
        desc: 'Scritture su server regolate a massimo 1 ogni 400ms per client, con animazioni locali istantanee e senza lag.',
      },
      {
        icon: '🧱',
        title: '5 Nuovi Trofei Speciali',
        desc: 'Introdotto "Re dell\'Ace" (più ace), "Cuore d\'Acciaio" (match point annullati), "Difesa d\'Acciaio" (recuperi estremi), "Mia!" e "Tua!" (contese per la palla vinte/cedute).',
      },
      {
        icon: '🎯',
        title: 'Precisione Prime Vincenti',
        desc: 'Il trofeo "Buona la prima" ora traccia fedelmente i punti effettivi realizzati al servizio durante le partite live.',
      },
    ],
  },
  {
    version: 'v2.4.0',
    codename: "Aggiornamento 'Guardia & 'Ndrangheta'",
    date: 'Settembre 2026',
    features: [
      {
        icon: '🏷️',
        title: 'Fix Bug Rimozione Tag Orfani',
        desc: 'Nuova interfaccia sul profilo con chip diretti [ Tag ✕ ] per togliere istantaneamente qualsiasi tag, anche se rimosso o orfano nella lega.',
      },
      {
        icon: '👮‍♂️',
        title: "Ruoli Partita Live (Guardia vs 'Ndranghetista)",
        desc: "Solo la Guardia ufficiale può assegnare punti e terminare il match. Gli altri partecipano come 'Ndranghetisti (tifo, chat e reazioni) senza rischio di manomissione.",
      },
      {
        icon: '🚀',
        title: 'Reazioni Giganti Fluttuanti in Diretta',
        desc: 'Le emoji inviate in live fluttuano animate sullo schermo di tutti i partecipanti in tempo reale, con il badge del mittente.',
      },
      {
        icon: '🔒',
        title: 'Sicurezza Password con SHA-256 & Salt',
        desc: 'Password oscurate e protette con crittografia irreversibile, con tolleranza agli spazi accidentali delle tastiere smartphone.',
      },
      {
        icon: '🎾',
        title: 'Classifica ATP Race & Inactivity Decay',
        desc: 'Nuova classifica a punti cumulativi basata su continuità, ritmo e vittorie pesanti, con decadimento dopo 7 giorni di inattività.',
      },
      {
        icon: '🏆',
        title: 'Trofei Speciali da Bar',
        desc: 'Assegnati automaticamente: "Salvato in corner", "Culo sfondato", "Senza mani" e "Buona la prima".',
      },
    ],
  },
  {
    version: 'v2.3.0',
    codename: 'Wizard Match & Social Profiles',
    date: 'Settembre 2026',
    features: [
      {
        icon: '🧙‍♂️',
        title: 'Inserimento Match Sequenziale a Step',
        desc: 'Flusso pulito per inserire match punto a punto o rapido senza sovraffollare la schermata.',
      },
      {
        icon: '🎬',
        title: 'GIF Esultanza & Banner Profilo',
        desc: 'Personalizzazione avanzata di ogni profilo con GIF e copertine dedicate.',
      },
      {
        icon: '💬',
        title: 'Live Chat & Commenti Partita',
        desc: 'Possibilità di commentare e sfottere gli avversari durante e dopo i match.',
      },
    ],
  },
  {
    version: 'v2.2.0',
    codename: 'Cloud Riunione Segreta',
    date: 'Agosto 2026',
    features: [
      {
        icon: '☁️',
        title: 'Sincronizzazione Realtime Firebase',
        desc: 'Multiplayer cloud per tutti i dispositivi dei membri con codici riunione segreti.',
      },
      {
        icon: '🛡️',
        title: 'Protezione Anti-IDOR & Account Vincolati',
        desc: 'Impossibile impersonare altri giocatori o alterare punteggi arbitrariamente.',
      },
    ],
  },
  {
    version: 'v1.0.0',
    codename: 'Genesi dell’Elo Ping Pong',
    date: 'Inizio 2026',
    features: [
      {
        icon: '🏓',
        title: 'Algoritmo Elo Dinamico',
        desc: 'Calcolo scambi Elo, statistiche vittorie/sconfitte e storico partite.',
      },
    ],
  },
];

export const CURRENT_APP_VERSION = RELEASES[0].version;
export const CURRENT_APP_CODENAME = RELEASES[0].codename;

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>📜 Storico Aggiornamenti</Text>
              <Text style={styles.headerSub}>Tutte le novità introdotte nell’arena</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body Scroll */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {RELEASES.map((rel) => (
              <View
                key={rel.version}
                style={[styles.releaseCard, rel.isCurrent && styles.releaseCardCurrent]}
              >
                {/* Release Header */}
                <View style={styles.releaseHeaderRow}>
                  <View style={styles.versionBadgeRow}>
                    <View
                      style={[
                        styles.versionBadge,
                        rel.isCurrent && styles.versionBadgeCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.versionBadgeText,
                          rel.isCurrent && styles.versionBadgeTextCurrent,
                        ]}
                      >
                        {rel.version}
                      </Text>
                    </View>
                    {rel.isCurrent && (
                      <View style={styles.currentTag}>
                        <Text style={styles.currentTagText}>ATTUALE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.releaseDate}>{rel.date}</Text>
                </View>

                <Text style={styles.releaseCodename}>{rel.codename}</Text>

                {/* Features List */}
                <View style={styles.featuresList}>
                  {rel.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={styles.featureIcon}>{feat.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.featureTitle}>{feat.title}</Text>
                        <Text style={styles.featureDesc}>{feat.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>Capito, andiamo a giocare! 🏓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  body: {
    padding: 16,
  },
  releaseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  releaseCardCurrent: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
    backgroundColor: '#131D31',
  },
  releaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  versionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  versionBadgeCurrent: {
    backgroundColor: Colors.primary,
  },
  versionBadgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
  },
  versionBadgeTextCurrent: {
    color: Colors.textDark,
  },
  currentTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  currentTagText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '900',
  },
  releaseDate: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  releaseCodename: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  featureDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dismissBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '900',
  },
});
