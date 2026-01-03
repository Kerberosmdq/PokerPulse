export class SoundManager {
    private context: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    constructor() {
        try {
            // Initialize AudioContext on user interaction if possible, or lazily
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.context = new AudioContextClass();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = 0.5; // Default volume
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    private ensureContext() {
        if (this.context?.state === 'suspended') {
            this.context.resume();
        }
    }

    private createOscillator(type: OscillatorType, frequency: number, duration: number, startTime: number = 0) {
        if (!this.context || !this.masterGain) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.context.currentTime + startTime);

        gain.gain.setValueAtTime(0.5, this.context.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.context.currentTime + startTime);
        osc.stop(this.context.currentTime + startTime + duration);
    }

    public playBlindsUp() {
        this.ensureContext();
        // "High-Low" chime: Ding-Dong style but techy
        // First note: High (E5 - 659.25 Hz)
        this.createOscillator('sine', 659.25, 0.8, 0);
        this.createOscillator('triangle', 659.25, 0.8, 0); // Layer for texture

        // Second note: Lower (C5 - 523.25 Hz)
        this.createOscillator('sine', 523.25, 1.2, 0.6);
        this.createOscillator('triangle', 523.25, 1.2, 0.6);
    }

    public playTimerWarning() {
        this.ensureContext();
        // Sharp tick
        this.createOscillator('square', 880, 0.05);
    }

    public playClick() {
        this.ensureContext();
        // Soft click
        this.createOscillator('sine', 440, 0.1);
    }

    public playSuccess() {
        this.ensureContext();
        // Ascending arpeggio
        this.createOscillator('sine', 440, 0.2, 0);
        this.createOscillator('sine', 554.37, 0.2, 0.1); // C#
        this.createOscillator('sine', 659.25, 0.4, 0.2); // E
    }
}

export const soundManager = new SoundManager();
