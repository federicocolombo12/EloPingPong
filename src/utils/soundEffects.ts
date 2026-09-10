/**
 * Sound Manager per EloPingPong Arena
 * Generazione procedurale di effetti sonori a zero latenza con Web Audio API.
 * Non richiede download di file audio pesanti, funziona offline e non genera lag su mobile Safari / Chrome.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private distortionCurve: Float32Array | null = null;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;

      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Genera o riutilizza un buffer di rumore bianco per i transienti percussivi
   */
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const bufferSize = ctx.sampleRate * 0.5; // 500ms di rumore
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  /**
   * Curva di distorsione soft-clipping per dare presenza e bassi potenti su speaker di smartphone
   */
  private getDistortionCurve(k: number = 20): Float32Array {
    if (this.distortionCurve) return this.distortionCurve;
    const nSamples = 256;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    this.distortionCurve = curve;
    return curve;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * 🏓 Paddle Hit: Colpo realistico di pallina da ping pong (legno + gomma + celluloide)
   * Tre layer acustici:
   * 1. Clic percussivo della celluloide (rumore filtrato a banda stretta a 3.4kHz)
   * 2. Risonanza della cavità sferica della pallina (940Hz -> 520Hz)
   * 3. Corpo e assorbimento del telaio in legno (280Hz -> 140Hz)
   */
  public playPaddleHit() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Layer 1: Plastic click transient
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(3400, t);
      noiseFilter.Q.setValueAtTime(5.0, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + 0.02);

      // Layer 2: Hollow celluloid sphere resonance
      const sphereOsc = ctx.createOscillator();
      const sphereGain = ctx.createGain();
      sphereOsc.type = 'sine';
      sphereOsc.frequency.setValueAtTime(940, t);
      sphereOsc.frequency.exponentialRampToValueAtTime(520, t + 0.045);

      sphereGain.gain.setValueAtTime(0.4, t);
      sphereGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      sphereOsc.connect(sphereGain);
      sphereGain.connect(ctx.destination);

      sphereOsc.start(t);
      sphereOsc.stop(t + 0.05);

      // Layer 3: Wood blade low thud
      const woodOsc = ctx.createOscillator();
      const woodGain = ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(280, t);
      woodOsc.frequency.exponentialRampToValueAtTime(140, t + 0.06);

      woodGain.gain.setValueAtTime(0.3, t);
      woodGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      woodOsc.connect(woodGain);
      woodGain.connect(ctx.destination);

      woodOsc.start(t);
      woodOsc.stop(t + 0.07);
    } catch {}
  }

  /**
   * ⚡ Ace: Servizio fulmineo e laser con scia scintillante
   * 1. Laser FM Modulation (frequenza portante 1.75kHz modulata a 95Hz)
   * 2. Shimmering Sparkle Trail (arpeggio ultrarapido E6, G6, B6, E7)
   */
  public playAceSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Layer 1: FM Laser Zap
      const carrier = ctx.createOscillator();
      const carrierGain = ctx.createGain();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();

      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(1750, t);
      carrier.frequency.exponentialRampToValueAtTime(650, t + 0.14);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(95, t);

      modGain.gain.setValueAtTime(450, t);
      modGain.gain.exponentialRampToValueAtTime(10, t + 0.14);

      modulator.connect(carrier.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4800, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + 0.15);

      carrierGain.gain.setValueAtTime(0.4, t);
      carrierGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      carrier.connect(filter);
      filter.connect(carrierGain);
      carrierGain.connect(ctx.destination);

      modulator.start(t);
      carrier.start(t);
      modulator.stop(t + 0.16);
      carrier.stop(t + 0.16);

      // Layer 2: Shimmering Sparkle Trail
      const sparkleNotes = [1318.5, 1567.98, 1975.53, 2637.0];
      sparkleNotes.forEach((f, i) => {
        const spk = ctx.createOscillator();
        const spkGain = ctx.createGain();
        const start = t + 0.02 + i * 0.03;

        spk.type = 'sine';
        spk.frequency.setValueAtTime(f, start);

        spkGain.gain.setValueAtTime(0.2, start);
        spkGain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        spk.connect(spkGain);
        spkGain.connect(ctx.destination);

        spk.start(start);
        spk.stop(start + 0.12);
      });
    } catch {}
  }

  /**
   * 💥 Smash: Colpo potente e devastante con sub-bass e frustata d'aria
   * 1. Sub-bass punch (808 drop da 190Hz a 36Hz con saturazione morbida)
   * 2. Racket whip (rumore filtrato sweeping 4.5kHz -> 700Hz)
   * 3. Wood snap percussivo ad alta energia
   */
  public playSmashSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Layer 1: Sub-bass 808 Thud con Soft Saturation
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.getDistortionCurve(15) as any;
      shaper.oversample = '2x';

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(190, t);
      subOsc.frequency.exponentialRampToValueAtTime(36, t + 0.28);

      subGain.gain.setValueAtTime(0.75, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      subOsc.connect(shaper);
      shaper.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(t);
      subOsc.stop(t + 0.3);

      // Layer 2: Violent Racket Whip & Air Displacement
      const whipNoise = ctx.createBufferSource();
      whipNoise.buffer = this.getNoiseBuffer(ctx);

      const whipFilter = ctx.createBiquadFilter();
      whipFilter.type = 'bandpass';
      whipFilter.frequency.setValueAtTime(4500, t);
      whipFilter.frequency.exponentialRampToValueAtTime(700, t + 0.08);
      whipFilter.Q.setValueAtTime(3.0, t);

      const whipGain = ctx.createGain();
      whipGain.gain.setValueAtTime(0.5, t);
      whipGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      whipNoise.connect(whipFilter);
      whipFilter.connect(whipGain);
      whipGain.connect(ctx.destination);

      whipNoise.start(t);
      whipNoise.stop(t + 0.09);

      // Layer 3: Sharp High Impact Crack
      const crackOsc = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crackOsc.type = 'triangle';
      crackOsc.frequency.setValueAtTime(1600, t);
      crackOsc.frequency.exponentialRampToValueAtTime(220, t + 0.04);

      crackGain.gain.setValueAtTime(0.5, t);
      crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      crackOsc.connect(crackGain);
      crackGain.connect(ctx.destination);

      crackOsc.start(t);
      crackOsc.stop(t + 0.05);
    } catch {}
  }

  /**
   * 🛡️ Difesa: Rimbalzo metallico eroico / Scudo in titanio
   * Sintesi a campana inarmonica (parziali non interi a decadimento lungo):
   * Timbro cristallino che risuona nell'aria come la parata di una lama
   */
  public playDefenseSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Parziali inarmonici metallici: Fondamentale A5 (880Hz) + moltiplicatori inarmonici
      const partials = [
        { mult: 1.0, gain: 0.35, dur: 0.45 },
        { mult: 1.618, gain: 0.25, dur: 0.38 }, // Sezione aurea inarmonica
        { mult: 2.414, gain: 0.2, dur: 0.3 },
        { mult: 3.82, gain: 0.15, dur: 0.22 },
      ];

      partials.forEach(({ mult, gain: gVal, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 * mult, t);

        gain.gain.setValueAtTime(gVal, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + dur);
      });

      // Transient iniziale metallico (clank)
      const clankNoise = ctx.createBufferSource();
      clankNoise.buffer = this.getNoiseBuffer(ctx);
      const clankFilter = ctx.createBiquadFilter();
      clankFilter.type = 'highpass';
      clankFilter.frequency.setValueAtTime(3200, t);
      const clankGain = ctx.createGain();
      clankGain.gain.setValueAtTime(0.25, t);
      clankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      clankNoise.connect(clankFilter);
      clankFilter.connect(clankGain);
      clankGain.connect(ctx.destination);

      clankNoise.start(t);
      clankNoise.stop(t + 0.03);
    } catch {}
  }

  /**
   * 🎲 Spigolo: Inconfondibile doppio tocco sul bordo in legno ("Tak-Tack")
   * 1. Primo tocco secco sul legno dello spigolo a t=0 (2.25kHz sharp)
   * 2. Rimbalzo deviato secondario a t=32ms (1.75kHz)
   */
  public playEdgeSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Due colpi ravvicinati ad alta risonanza legnosa
      [
        { delay: 0, freq: 2250, drop: 1200, gainVal: 0.4 },
        { delay: 0.032, freq: 1750, drop: 950, gainVal: 0.28 },
      ].forEach(({ delay, freq, drop, gainVal }) => {
        const start = t + delay;

        // Wood resonance
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(drop, start + 0.03);

        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.035);

        // Click transient
        const click = ctx.createBufferSource();
        click.buffer = this.getNoiseBuffer(ctx);
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(3600, start);
        clickFilter.Q.setValueAtTime(6.0, start);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(gainVal * 0.7, start);
        clickGain.gain.exponentialRampToValueAtTime(0.001, start + 0.012);

        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(ctx.destination);

        click.start(start);
        click.stop(start + 0.015);
      });
    } catch {}
  }

  /**
   * 🕸️ Net: Sfioramento della retina con frizione e oscillazione elastica
   * 1. Frizione ruvida della pallina sul nastro superiore (rumore filtrato)
   * 2. Vibrazione elastica del tirante (320Hz modulato da LFO a 30Hz)
   */
  public playNetSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // 1. Frizione plastica/corda
      const rub = ctx.createBufferSource();
      rub.buffer = this.getNoiseBuffer(ctx);

      const rubFilter = ctx.createBiquadFilter();
      rubFilter.type = 'bandpass';
      rubFilter.frequency.setValueAtTime(2100, t);
      rubFilter.Q.setValueAtTime(3.5, t);

      const rubGain = ctx.createGain();
      rubGain.gain.setValueAtTime(0.35, t);
      rubGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      rub.connect(rubFilter);
      rubFilter.connect(rubGain);
      rubGain.connect(ctx.destination);

      rub.start(t);
      rub.stop(t + 0.06);

      // 2. Vibrazione della cordicella metallica/nylon
      const netOsc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const netGain = ctx.createGain();

      netOsc.type = 'sine';
      netOsc.frequency.setValueAtTime(320, t);
      netOsc.frequency.exponentialRampToValueAtTime(170, t + 0.16);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(30, t); // Tremolo della retina
      lfoGain.gain.setValueAtTime(45, t);

      lfo.connect(netOsc.frequency);

      netGain.gain.setValueAtTime(0.35, t);
      netGain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

      netOsc.connect(netGain);
      netGain.connect(ctx.destination);

      lfo.start(t);
      netOsc.start(t);
      lfo.stop(t + 0.17);
      netOsc.stop(t + 0.17);
    } catch {}
  }

  /**
   * 🍀 Punto Culo: Unione spigolo + net + rimbalzo fortunato ("Boing-Chime")
   * 1. Doppio tick d'impatto deviato sul bordo/nastro
   * 2. Bouncing glissando comico (280Hz -> 620Hz -> 480Hz) con vibrato elastico
   * 3. Rintocco brillante e giocoso di campanella fortunata
   */
  public playLuckSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Layer 1: Doppio tocco legnoso/corda (edge tick)
      [
        { delay: 0, freq: 2100, gainVal: 0.35 },
        { delay: 0.03, freq: 1650, gainVal: 0.25 },
      ].forEach(({ delay, freq, gainVal }) => {
        const start = t + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(800, start + 0.035);

        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.04);
      });

      // Layer 2: Cartoonish "Boing" elastico fortunato (curva pitch sweep allegra)
      const springOsc = ctx.createOscillator();
      const springGain = ctx.createGain();
      const springLfo = ctx.createOscillator();
      const springLfoGain = ctx.createGain();

      springOsc.type = 'sine';
      springOsc.frequency.setValueAtTime(260, t + 0.04);
      springOsc.frequency.exponentialRampToValueAtTime(680, t + 0.14);
      springOsc.frequency.exponentialRampToValueAtTime(440, t + 0.28);

      springLfo.type = 'sine';
      springLfo.frequency.setValueAtTime(22, t + 0.04);
      springLfoGain.gain.setValueAtTime(35, t + 0.04);
      springLfo.connect(springOsc.frequency);

      springGain.gain.setValueAtTime(0.001, t);
      springGain.gain.setValueAtTime(0.38, t + 0.04);
      springGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      springOsc.connect(springGain);
      springGain.connect(ctx.destination);

      springLfo.start(t + 0.04);
      springOsc.start(t + 0.04);
      springLfo.stop(t + 0.3);
      springOsc.stop(t + 0.3);

      // Layer 3: Campanella fortunata argentata (lucky chime)
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1975.5, t + 0.12); // B6
      chimeGain.gain.setValueAtTime(0.22, t + 0.12);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      chime.start(t + 0.12);
      chime.stop(t + 0.45);
    } catch {}
  }

  /**
   * ✨ Punto Stile: Cascata di arpeggio cristallino e regale ("Pura Classe")
   * Scala pentatonica ascendente scintillante (E6 -> G#6 -> B6 -> E7 -> G#7)
   * Timbro tipo arpa / celesta magica per celebrare la giocata da antologia
   */
  public playStylePointSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // Arpeggio dorato di stile: E6, G#6, B6, E7, G#7
      const notes = [
        { freq: 1318.5, delay: 0.0, dur: 0.35, gainVal: 0.25 },
        { freq: 1661.2, delay: 0.045, dur: 0.38, gainVal: 0.26 },
        { freq: 1975.5, delay: 0.09, dur: 0.42, gainVal: 0.28 },
        { freq: 2637.0, delay: 0.135, dur: 0.5, gainVal: 0.32 },
        { freq: 3322.4, delay: 0.18, dur: 0.65, gainVal: 0.35 },
      ];

      notes.forEach(({ freq, delay, dur, gainVal }) => {
        const start = t + delay;

        // Oscillatore fondamentale brillante
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        // Subtly detuned harmonic shimmer
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, start);

        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        overtoneGain.gain.setValueAtTime(gainVal * 0.25, start);
        overtoneGain.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.7);

        osc.connect(gain);
        overtone.connect(overtoneGain);
        gain.connect(ctx.destination);
        overtoneGain.connect(ctx.destination);

        osc.start(start);
        overtone.start(start);
        osc.stop(start + dur);
        overtone.stop(start + dur * 0.7);
      });

      // Shimmer stardust (soffio di polvere di stelle a 4.2kHz)
      const shimmer = ctx.createBufferSource();
      shimmer.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4200, t);
      filter.Q.setValueAtTime(4.0, t);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0.12, t + 0.1);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      shimmer.connect(filter);
      filter.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      shimmer.start(t + 0.1);
      shimmer.stop(t + 0.52);
    } catch {}
  }

  /**
   * ❌ Fallo di Battuta: Buzzer arbitrale autoritario con battimento acustico
   * Due onde a dente di sega scordate (118Hz e 125Hz) per generare il "wah-wah-wah" di penalità
   */
  public playFaultSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(118, t);
      osc1.frequency.exponentialRampToValueAtTime(74, t + 0.2);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(125, t); // Scordatura di 7Hz per battimento acustico
      osc2.frequency.exponentialRampToValueAtTime(78, t + 0.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.22);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.22);
      osc2.stop(t + 0.22);
    } catch {}
  }

  /**
   * ↩️ Undo: Riavvolgimento sonoro inverso "Swoop"
   */
  public playUndoSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(780, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.13);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.14);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch {}
  }

  /**
   * 💬 Reazione Emoji: Bolla d'aria "Juicy Pop" ad alta risoluzione
   * Surge ascendente rapido da 380Hz a 1350Hz con risonanza d'aria gommosa
   */
  public playReactionPop() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Layer 1: Juicy rising bubble chirp
      const bubble = ctx.createOscillator();
      const bubbleGain = ctx.createGain();

      bubble.type = 'sine';
      bubble.frequency.setValueAtTime(380, t);
      bubble.frequency.exponentialRampToValueAtTime(1350, t + 0.024);
      bubble.frequency.exponentialRampToValueAtTime(540, t + 0.06);

      bubbleGain.gain.setValueAtTime(0.4, t);
      bubbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      bubble.connect(bubbleGain);
      bubbleGain.connect(ctx.destination);

      bubble.start(t);
      bubble.stop(t + 0.065);

      // Layer 2: Soft high click
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(1800, t);
      click.frequency.exponentialRampToValueAtTime(800, t + 0.015);

      clickGain.gain.setValueAtTime(0.2, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

      click.connect(clickGain);
      clickGain.connect(ctx.destination);

      click.start(t);
      click.stop(t + 0.02);
    } catch {}
  }

  /**
   * 🏆 Fanfara Vittoria Trionfale: Accordo di ottoni a quattro voci
   * Arpeggio ascendente in Do Maggiore con vibrato espressivo finale:
   * 1. G4 + C5 (quinta nobile)
   * 2. E5 + G5 (terza radiosa)
   * 3. G5 + C6 (ottava potente)
   * 4. Accordo finale pieno C5 + E5 + G5 + C6 tenuto con shimmer
   */
  public playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      const steps = [
        { time: 0, notes: [392.0, 523.25], dur: 0.12, vol: 0.28 },       // G4 + C5
        { time: 0.11, notes: [523.25, 659.25], dur: 0.12, vol: 0.3 },     // C5 + E5
        { time: 0.22, notes: [659.25, 783.99], dur: 0.14, vol: 0.32 },    // E5 + G5
        { time: 0.35, notes: [523.25, 659.25, 783.99, 1046.5], dur: 0.65, vol: 0.35 }, // Gran Finale C Maggiore
      ];

      steps.forEach(({ time, notes, dur, vol }) => {
        const start = t + time;
        notes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          // Calore orchestrale con lowpass
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400, start);

          // Vibrato sul gran finale
          if (dur > 0.4) {
            const vib = ctx.createOscillator();
            const vibGain = ctx.createGain();
            vib.frequency.setValueAtTime(5.5, start);
            vibGain.gain.setValueAtTime(freq * 0.012, start);
            vib.connect(osc.frequency);
            vib.start(start + 0.15);
            vib.stop(start + dur);
          }

          gain.gain.setValueAtTime(vol / notes.length, start);
          gain.gain.setValueAtTime(vol / notes.length, start + dur * 0.7);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + dur);
        });
      });
    } catch {}
  }

  /**
   * 🏓 Fischietto Arbitro ("Per la palla"):
   * Modellazione acustica di un fischietto da arbitro tipo Fox 40:
   * Due frequenze dominanti (2740Hz e 2960Hz) con modulazione rapida a 24Hz
   * che simula la pallina/pallina d'aria che rotea all'interno della camera
   */
  public playBallContestSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      const freqs = [2740, 2960]; // Armoniche tipiche fischietto
      freqs.forEach((baseFreq) => {
        const osc = ctx.createOscillator();
        const peaLfo = ctx.createOscillator(); // Rotazione della pallina interna
        const peaGain = ctx.createGain();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);

        peaLfo.type = 'sine';
        peaLfo.frequency.setValueAtTime(24, t); // 24Hz wobble
        peaGain.gain.setValueAtTime(60, t);

        peaLfo.connect(osc.frequency);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
        gain.gain.setValueAtTime(0.25, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        peaLfo.start(t);
        osc.start(t);
        peaLfo.stop(t + 0.32);
        osc.stop(t + 0.32);
      });

      // Soffio d'aria
      const breath = ctx.createBufferSource();
      breath.buffer = this.getNoiseBuffer(ctx);
      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.frequency.setValueAtTime(2850, t);
      breathFilter.Q.setValueAtTime(2.5, t);

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.12, t);
      breathGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      breath.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(ctx.destination);

      breath.start(t);
      breath.stop(t + 0.3);
    } catch {}
  }

  /**
   * 🔘 Button Tap: Click tattile meccanico ultramoderno
   * Ispirato ai click aptici di iOS e ai tasti meccanici premium:
   * 2.5ms di transiente + tono smorzato a 680Hz a volume delicato (0.08).
   * Mai fastidioso, piacevole e rassicurante al tatto.
   */
  public playButtonTap() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Micro noise transient (tactile impulse)
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, t);
      filter.Q.setValueAtTime(2.0, t);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.1, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + 0.01);

      // Low wooden body
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.022);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.025);
    } catch {}
  }

  /**
   * 🪙 Coin Sound: Tintinnio metallico cristallino di gettone / LUL Coin
   * Due risonanze metalliche pure (2420Hz e 3180Hz) + micro-rimbalzo a t + 45ms.
   * Feedback tattile e sonoro immediato quando si punta una scommessa o si seleziona una chip.
   */
  public playCoinSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Colpo 1: Tocco iniziale del gettone d'oro
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2420, t);
      osc1.frequency.exponentialRampToValueAtTime(2380, t + 0.25);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3180, t);
      osc2.frequency.exponentialRampToValueAtTime(3120, t + 0.22);

      gain1.gain.setValueAtTime(0.18, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      gain2.gain.setValueAtTime(0.12, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.26);
      osc2.stop(t + 0.26);

      // Colpo 2: Micro rimbalzo leggero a 45ms
      const oscBounce = ctx.createOscillator();
      const gainBounce = ctx.createGain();
      oscBounce.type = 'sine';
      oscBounce.frequency.setValueAtTime(2890, t + 0.045);
      oscBounce.frequency.exponentialRampToValueAtTime(2850, t + 0.18);

      gainBounce.gain.setValueAtTime(0, t);
      gainBounce.gain.setValueAtTime(0.11, t + 0.045);
      gainBounce.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      oscBounce.connect(gainBounce);
      gainBounce.connect(ctx.destination);

      oscBounce.start(t + 0.045);
      oscBounce.stop(t + 0.21);
    } catch {}
  }

  /**
   * 💰 Cashout Sound: Fanfara di vincita scommessa con cassa registratore "Ka-Ching!"
   * Cassa metallica iniziale + rapida cascata ascendente di 4 gettoni + arpeggio di vittoria (G5, B5, D6, G6).
   */
  public playCashoutSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // 1. Meccanismo cassa registratore "Ch-Ching!"
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(4500, t);
      nFilter.Q.setValueAtTime(3.0, t);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.15, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + 0.08);

      // 2. Cascata di 4 gettoni a intervalli di 55ms
      const coinFreqs = [1980, 2480, 2980, 3520];
      coinFreqs.forEach((freq, idx) => {
        const coinTime = t + 0.05 + idx * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, coinTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, coinTime + 0.22);

        gain.gain.setValueAtTime(0, t);
        gain.gain.setValueAtTime(0.14, coinTime);
        gain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(coinTime);
        osc.stop(coinTime + 0.23);
      });

      // 3. Arpeggio dorato di trionfo (G5 = 784Hz, B5 = 988Hz, D6 = 1175Hz, G6 = 1568Hz)
      const chordNotes = [784, 988, 1175, 1568];
      chordNotes.forEach((freq, idx) => {
        const noteTime = t + 0.26 + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0, t);
        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.46);
      });
    } catch {
      // Audio error ignored
    }
  }

  /**
   * 🎮 Final Fantasy VII Victory Fanfare (Procedurale Web Audio)
   * Il leggendario jingle di vittoria di Nobuo Uematsu (FFVII):
   * Triplet C5-C5-C5 -> C5 -> Ab4 -> Bb4 -> C5 -> Bb4 -> C5 trionfale con accordo ad ottoni
   */
  public playFFVIIVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // Frequenze note: C5=523.25, Ab4=415.3, Bb4=466.16, G5=783.99, C6=1046.5
      const notes = [
        // Triplette iniziali C5
        { time: 0.0, freq: 523.25, dur: 0.1, vol: 0.35 },
        { time: 0.11, freq: 523.25, dur: 0.1, vol: 0.35 },
        { time: 0.22, freq: 523.25, dur: 0.1, vol: 0.35 },
        // C5 tenuto
        { time: 0.35, freq: 523.25, dur: 0.25, vol: 0.38 },
        // Ab4
        { time: 0.65, freq: 415.3, dur: 0.22, vol: 0.36 },
        // Bb4
        { time: 0.9, freq: 466.16, dur: 0.22, vol: 0.38 },
        // C5
        { time: 1.15, freq: 523.25, dur: 0.28, vol: 0.4 },
        // Bb4 (rapida)
        { time: 1.45, freq: 466.16, dur: 0.12, vol: 0.36 },
        // C5 Gran Finale (Accordo C Maj: C4 + G4 + C5 + E5 + G5 + C6)
        { time: 1.6, freq: 523.25, dur: 0.9, vol: 0.42, chord: [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5] },
      ];

      notes.forEach(({ time, freq, dur, vol, chord }) => {
        const start = t + time;
        const freqsToPlay = chord || [freq];

        freqsToPlay.forEach((f) => {
          // Brass synth (sawtooth + triangle)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(f, start);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(f * 1.002, start); // micro chorus

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(3200, start);
          filter.frequency.exponentialRampToValueAtTime(1400, start + dur);

          // Vibrato for long final chord
          if (dur > 0.5) {
            const vib = ctx.createOscillator();
            const vibGain = ctx.createGain();
            vib.frequency.setValueAtTime(6.0, start);
            vibGain.gain.setValueAtTime(f * 0.015, start);
            vib.connect(osc1.frequency);
            vib.connect(osc2.frequency);
            vib.start(start + 0.2);
            vib.stop(start + dur);
          }

          const individualVol = vol / Math.sqrt(freqsToPlay.length);
          gain.gain.setValueAtTime(individualVol, start);
          gain.gain.setValueAtTime(individualVol * 0.85, start + dur * 0.7);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(start);
          osc2.start(start);
          osc1.stop(start + dur);
          osc2.stop(start + dur);
        });
      });
    } catch {}
  }

  /**
   * 🎸 Rock Anthem: Riff aggressivo di chitarra elettrica distorta
   */
  public playRockRiff() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const chords = [
        { time: 0.0, freqs: [164.81, 246.94, 329.63], dur: 0.18 }, // E power chord
        { time: 0.2, freqs: [164.81, 246.94, 329.63], dur: 0.15 },
        { time: 0.4, freqs: [196.0, 293.66, 392.0], dur: 0.2 },   // G power chord
        { time: 0.65, freqs: [220.0, 330.0, 440.0], dur: 0.5 },   // A power chord finale
      ];

      chords.forEach(({ time, freqs, dur }) => {
        const start = t + time;
        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          const shaper = ctx.createWaveShaper();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, start);

          shaper.curve = this.getDistortionCurve(30) as any;

          gain.gain.setValueAtTime(0.18, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(shaper);
          shaper.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + dur);
        });
      });
    } catch {}
  }

  /**
   * ⚡ Techno Anthem: Drop rave elettronico con sub kick e synth bass
   */
  public playTechnoDrop() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // 4 cassa dritta kicks + synth bassline
      for (let i = 0; i < 4; i++) {
        const kickTime = t + i * 0.22;
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();

        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(160, kickTime);
        kickOsc.frequency.exponentialRampToValueAtTime(45, kickTime + 0.18);

        kickGain.gain.setValueAtTime(0.6, kickTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, kickTime + 0.2);

        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);

        kickOsc.start(kickTime);
        kickOsc.stop(kickTime + 0.2);

        // Synth offbeat chirp
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        const bassFilter = ctx.createBiquadFilter();
        const bassTime = kickTime + 0.11;

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(110 * (1 + (i % 2) * 0.33), bassTime);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(1800, bassTime);
        bassFilter.frequency.exponentialRampToValueAtTime(300, bassTime + 0.1);

        bassGain.gain.setValueAtTime(0.25, bassTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, bassTime + 0.11);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(ctx.destination);

        bassOsc.start(bassTime);
        bassOsc.stop(bassTime + 0.11);
      }
    } catch {}
  }

  /**
   * 🏟️ Stadium Anthem: Boato dello stadio con trombetta da stadio da festa
   */
  public playStadiumCheer() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Horn rhythm: Da-da-da-da-da-daaaa
      const hornNotes = [
        { time: 0.0, dur: 0.12, freq: 440 },
        { time: 0.14, dur: 0.12, freq: 440 },
        { time: 0.28, dur: 0.12, freq: 440 },
        { time: 0.42, dur: 0.18, freq: 554.37 }, // C#5
        { time: 0.62, dur: 0.18, freq: 440 },
        { time: 0.82, dur: 0.45, freq: 659.25 }, // E5
      ];

      hornNotes.forEach(({ time, dur, freq }) => {
        const start = t + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });

      // Crowd applause / noise swell
      const crowd = ctx.createBufferSource();
      crowd.buffer = this.getNoiseBuffer(ctx);
      const crowdFilter = ctx.createBiquadFilter();
      crowdFilter.type = 'bandpass';
      crowdFilter.frequency.setValueAtTime(1600, t + 0.3);
      crowdFilter.Q.setValueAtTime(1.5, t + 0.3);

      const crowdGain = ctx.createGain();
      crowdGain.gain.setValueAtTime(0.01, t);
      crowdGain.gain.linearRampToValueAtTime(0.2, t + 0.8);
      crowdGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      crowd.connect(crowdFilter);
      crowdFilter.connect(crowdGain);
      crowdGain.connect(ctx.destination);

      crowd.start(t);
      crowd.stop(t + 1.4);
    } catch {}
  }

  /**
   * 🎡 Wheel Tick: Scatto meccanico della ruota della fortuna quando tocca un perno
   */
  public playWheelTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.015);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.02);
    } catch {}
  }

  /**
   * Suona l'inno di vittoria equipaggiato dal giocatore
   */
  public playAnthem(soundId?: string) {
    if (!soundId || soundId === 'sound_default') {
      this.playVictoryFanfare();
      return;
    }
    switch (soundId) {
      case 'sound_ff7_fanfare':
        this.playFFVIIVictoryFanfare();
        break;
      case 'sound_rock':
        this.playRockRiff();
        break;
      case 'sound_techno':
        this.playTechnoDrop();
        break;
      case 'sound_stadium':
        this.playStadiumCheer();
        break;
      default:
        this.playVictoryFanfare();
        break;
    }
  }
}

export const soundEffects = new SoundEffectsManager();
