export class SoundManager {
    private context: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private volume = 0.5;

    // El AudioContext se crea recién al reproducir el primer sonido: los navegadores bloquean
    // (y advierten en consola) contextos creados antes de una interacción del usuario.
    private init() {
        if (this.context) return;
        try {
            const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            this.context = new AudioContextClass();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = this.volume;
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    private ensureContext() {
        this.init();
        if (this.context?.state === 'suspended') {
            this.context.resume();
        }
    }

    public setVolume(volume: number) {
        this.volume = volume;
        if (this.masterGain && this.context) {
            this.masterGain.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }

    /** Anuncio por voz (síntesis del navegador, en español si hay una voz disponible). */
    public announce(text: string) {
        if (!('speechSynthesis' in window) || this.volume <= 0) return;
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith('es-') && v.localService) ?? voices.find(v => v.lang.startsWith('es'));
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? 'es-ES';
        utterance.volume = Math.min(1, this.volume * 1.4);
        utterance.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    /**
     * Helper to create a noise buffer for sounds like card shuffles or chips clashing
     */
    private createNoiseBuffer(durationSeconds: number): AudioBuffer | null {
        if (!this.context) return null;
        const sampleRate = this.context.sampleRate;
        const bufferSize = sampleRate * durationSeconds;
        const buffer = this.context.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /**
     * Play a single noise-based swish with bandpass/highpass filtering
     */
    private playNoiseSwish(startTime: number, duration: number, frequency: number, Q: number, gainVal: number) {
        if (!this.context || !this.masterGain) return;
        const noiseBuffer = this.createNoiseBuffer(duration);
        if (!noiseBuffer) return;

        const source = this.context.createBufferSource();
        source.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(frequency, this.context.currentTime + startTime);
        filter.Q.setValueAtTime(Q, this.context.currentTime + startTime);

        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(0.01, this.context.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(gainVal, this.context.currentTime + startTime + duration * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + startTime + duration);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(this.context.currentTime + startTime);
        source.stop(this.context.currentTime + startTime + duration);
    }

    /**
     * High-Fidelity Casino Bell Chime for Blinds Up
     * Emulates a struck physical bell with fundamental + humming + harmonic overtones
     */
    public playBlindsUp() {
        this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const now = this.context.currentTime;
        const f0 = 587.33; // Fundamental (D5)

        // Harmonics configuration: [freqRatio, gainRatio, decayRatio]
        const harmonics = [
            [0.5, 0.4, 1.5],  // Hum (warm base)
            [1.0, 1.0, 1.2],  // Fundamental
            [1.2, 0.6, 0.8],  // Tierce (minor 3rd)
            [1.5, 0.5, 0.9],  // Quint (perfect 5th)
            [2.0, 0.4, 0.6],  // Nominal (octave)
            [3.0, 0.2, 0.4],  // High overtone
            [4.0, 0.1, 0.2]   // Sharp chime spark
        ];

        harmonics.forEach(([ratio, volScale, decayScale]) => {
            const osc = this.context!.createOscillator();
            const gain = this.context!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f0 * ratio, now);

            // Stressed strike
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(volScale * 0.25, now + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (1.6 * decayScale));

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(now);
            osc.stop(now + (1.6 * decayScale));
        });
    }

    /**
     * Realistic Card Shuffling Sound
     * Synthesizes 6 quick overlapping "swishes" of high-pass filtered noise
     */
    public playCardShuffle() {
        this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const swishDelays = [0, 0.08, 0.16, 0.24, 0.32, 0.42];
        const swishDurations = [0.12, 0.12, 0.12, 0.14, 0.16, 0.28];
        const swishGains = [0.35, 0.35, 0.4, 0.45, 0.5, 0.6];
        const swishFreqs = [3800, 4200, 3900, 4400, 4000, 3600];

        swishDelays.forEach((delay, idx) => {
            this.playNoiseSwish(
                delay,
                swishDurations[idx],
                swishFreqs[idx],
                1.5, // Resonance Q
                swishGains[idx]
            );
        });
    }

    /**
     * Plastic/Clay Chips Clashing Sound
     * Synthesizes several very brief high-frequency clattering clinks
     */
    public playChipsClash() {
        this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const now = this.context.currentTime;
        // Spaced out micro-collisions within 220ms
        const clicks = [
            { delay: 0.0, freq: 3800, decay: 0.015, vol: 0.6 },
            { delay: 0.02, freq: 4400, decay: 0.01, vol: 0.4 },
            { delay: 0.05, freq: 3200, decay: 0.02, vol: 0.5 },
            { delay: 0.09, freq: 4900, decay: 0.012, vol: 0.7 },
            { delay: 0.13, freq: 3500, decay: 0.025, vol: 0.65 },
            { delay: 0.18, freq: 4100, decay: 0.018, vol: 0.5 }
        ];

        clicks.forEach((click) => {
            const osc = this.context!.createOscillator();
            const gain = this.context!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(click.freq, now + click.delay);

            gain.gain.setValueAtTime(click.vol * 0.4, now + click.delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + click.delay + click.decay);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(now + click.delay);
            osc.stop(now + click.delay + click.decay + 0.02);
        });
    }

    /**
     * Tension Clock ticking heartbeat sound
     * Double-beat: deep low-freq mechanical thump + crisp Watch ticking escape click
     */
    public playTimerWarning() {
        this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const now = this.context.currentTime;

        // --- Low Chest Thump ---
        const thumpOsc = this.context.createOscillator();
        const thumpGain = this.context.createGain();

        thumpOsc.type = 'sine';
        thumpOsc.frequency.setValueAtTime(110, now);
        thumpOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        thumpGain.gain.setValueAtTime(0.7, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        thumpOsc.connect(thumpGain);
        thumpGain.connect(this.masterGain);

        thumpOsc.start(now);
        thumpOsc.stop(now + 0.1);

        // --- Crisp Mechanical Escape Tick ---
        const tickOsc = this.context.createOscillator();
        const tickGain = this.context.createGain();

        tickOsc.type = 'triangle';
        tickOsc.frequency.setValueAtTime(6200, now + 0.005); // slightly delayed crisp click

        tickGain.gain.setValueAtTime(0.08, now + 0.005);
        tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        tickOsc.connect(tickGain);
        tickGain.connect(this.masterGain);

        tickOsc.start(now + 0.005);
        tickOsc.stop(now + 0.03);
    }

    /**
     * Crisp, Premium button click sound for interactive elements
     */
    public playClick() {
        this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const now = this.context.currentTime;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Ascending elegant arpeggio for victory or success actions
     */
    public playSuccess() {
        this.ensureContext();
        if (!this.context || !this.masterGain) return;

        const now = this.context.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        const delays = [0, 0.06, 0.12, 0.18];

        notes.forEach((freq, idx) => {
            const osc = this.context!.createOscillator();
            const gain = this.context!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delays[idx]);

            gain.gain.setValueAtTime(0.2, now + delays[idx]);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delays[idx] + 0.25);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(now + delays[idx]);
            osc.stop(now + delays[idx] + 0.28);
        });
    }
}

export const soundManager = new SoundManager();
