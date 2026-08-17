/**
 * Neo-Arkanoid Procedural Web Audio Engine
 * Pure synthesized zero-latency sound effects using Web Audio API
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.volume = 0.6;
        
        // Pentatonic scale (C Major Pentatonic across 4 octaves)
        this.pentatonicScale = [
            // Octave 4
            261.63, 293.66, 329.63, 392.00, 440.00,
            // Octave 5
            523.25, 587.33, 659.25, 783.99, 880.00,
            // Octave 6
            1046.50, 1174.66, 1318.51, 1567.98, 1760.00,
            // Octave 7
            2093.00, 2349.32, 2637.02, 3135.96, 3520.00
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    /**
     * Play Pentatonic Chime for brick hits with combo multiplier
     * FM synthesis bell chime
     */
    playBrickChime(comboStreak = 0, tier = 'emerald') {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const noteIndex = Math.min(comboStreak, this.pentatonicScale.length - 1);
        const baseFreq = this.pentatonicScale[noteIndex];
        const now = this.ctx.currentTime;

        // Carrier oscillator (Sine / Triangle)
        const carrier = this.ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(baseFreq, now);

        // Modulator oscillator for bell resonance
        const modulator = this.ctx.createOscillator();
        const modMultiplier = tier === 'sapphire' ? 2.76 : (tier === 'amethyst' ? 3.14 : 2.0);
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(baseFreq * modMultiplier, now);

        // Modulator Gain (Modulation Depth)
        const modGain = this.ctx.createGain();
        const modDepth = baseFreq * (0.8 + Math.min(comboStreak * 0.1, 1.5));
        modGain.gain.setValueAtTime(modDepth, now);
        modGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        modulator.connect(carrier.frequency);

        // Carrier Gain Envelope
        const carrierGain = this.ctx.createGain();
        carrierGain.gain.setValueAtTime(0.35, now);
        // Exponential decay for crystal glass / metallic chime ring
        const decayTime = tier === 'amethyst' ? 0.6 : (tier === 'ruby' ? 0.45 : 0.3);
        carrierGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

        // Sub overtone for warmth
        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(baseFreq * 0.5, now);
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.12, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        // Connect
        carrier.connect(carrierGain);
        subOsc.connect(subGain);
        carrierGain.connect(this.masterGain);
        subGain.connect(this.masterGain);

        // Start & Stop
        modulator.start(now);
        carrier.start(now);
        subOsc.start(now);

        modulator.stop(now + decayTime);
        carrier.stop(now + decayTime);
        subOsc.stop(now + decayTime);
    }

    /**
     * Paddle Rebound Boing Sound
     */
    playPaddleBoing(pitchOffset = 0) {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        // Pitch scoop
        const startFreq = 160 + pitchOffset * 80;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(260 + pitchOffset * 100, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    /**
     * Wall Bounce / Ricochet Tick
     */
    playWallTick() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    /**
     * Laser Blaster Synth Shot
     */
    playLaserShot() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

        // Lowpass filter for punchy laser pew
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.09);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Brick Explosion / Splinter Crunch
     */
    playExplosion(isRubyNuke = false) {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const duration = isRubyNuke ? 0.65 : 0.28;

        // White noise buffer
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        // Bandpass / Lowpass filter for explosion crunch
        const filter = this.ctx.createBiquadFilter();
        filter.type = isRubyNuke ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(isRubyNuke ? 800 : 1200, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + duration);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(isRubyNuke ? 0.6 : 0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        // Low frequency thud oscillator
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(isRubyNuke ? 180 : 130, now);
        subOsc.frequency.exponentialRampToValueAtTime(35, now + duration);

        subGain.gain.setValueAtTime(isRubyNuke ? 0.5 : 0.3, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain);

        whiteNoise.start(now);
        subOsc.start(now);

        whiteNoise.stop(now + duration);
        subOsc.stop(now + duration);
    }

    /**
     * Powerup Capsule Spawn
     */
    playPowerupSpawn() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Powerup Capsule Collected (Celestial 4-note ascending chime arpeggio)
     */
    playPowerupCollect(type = 'multiball') {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = type === 'laser' 
            ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5 E5 G5 C6 E6
            : [440.00, 554.37, 659.25, 880.00, 1108.73]; // A major sparkle

        notes.forEach((freq, i) => {
            const startTime = now + i * 0.045;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + 0.22);
        });
    }

    /**
     * Safety Trampoline Bounce
     */
    playTrampolineBounce() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.28);
    }

    /**
     * Lost Ball / Life Lost
     */
    playBallLost() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    /**
     * Level Victory Fanfare
     */
    playLevelClear() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const fanfare = [
            { freq: 523.25, time: 0, dur: 0.12 },
            { freq: 659.25, time: 0.12, dur: 0.12 },
            { freq: 783.99, time: 0.24, dur: 0.15 },
            { freq: 1046.50, time: 0.40, dur: 0.45 }
        ];

        fanfare.forEach(note => {
            const startTime = now + note.time;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, startTime);

            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + note.dur);
        });
    }

    /**
     * Game Over Chords
     */
    playGameOver() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [293.66, 261.63, 220.00, 174.61]; // D4, C4, A3, F3

        notes.forEach((freq, i) => {
            const startTime = now + i * 0.18;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }
}

window.soundEngine = new SoundEngine();
