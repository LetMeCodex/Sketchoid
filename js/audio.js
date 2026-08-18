/**
 * SKETCHOID Procedural Soundscape 2.0 & 5-Layer Adaptive Soundtrack
 * Android-Optimized, Glitch-Free Web Audio Synthesizer with strict Background Lifecycle,
 * User Gesture Unlocking, Dynamic Compressor, and Zero-Stutter Sequencer.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.limiter = null;
        this.isMuted = false;
        this.isInitialized = false;
        this.isAppInBackground = false;
        this.droneOscillators = [];

        this.musicVolume = parseFloat(localStorage.getItem('sketchoid_vol_music') || '0.65');
        this.sfxVolume = parseFloat(localStorage.getItem('sketchoid_vol_sfx') || '0.85');

        // Current Theme Sound Palette: 'blueprint' | 'parchment' | 'neon' | 'cosmic'
        this.currentPalette = 'blueprint';

        // Pentatonic Scale Matrix (C4 -> C7)
        this.pentatonicScale = [
            261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
            523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
            1046.50, 1174.66, 1318.51, 1567.98, 1760.00, // C6, D6, E6, G6, A6
            2093.00 // C7
        ];

        // 5-Layer Dynamic Adaptive Soundtrack State
        this.musicState = {
            tempo: 120, // BPM
            step: 0,
            timer: 0,
            ambientGain: null,
            percussionGain: null,
            bassGain: null,
            arpGain: null,
            frenzyGain: null,
            bossGain: null,
            currentCombo: 0,
            isFrenzy: false,
            isBoss: false
        };

        this.bassSequence = [130.81, 0, 146.83, 0, 164.81, 0, 196.00, 146.83];
        this.arpSequence = [523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 659.25, 587.33];

        this.setupUnlockListeners();
        this.setupLifecycleListeners();
    }

    setupUnlockListeners() {
        const unlock = () => {
            if (!this.isInitialized) {
                this.init();
            } else if (this.ctx && this.ctx.state === 'suspended' && !this.isAppInBackground && !document.hidden) {
                this.ctx.resume().catch(() => {});
            }
        };

        ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'click'].forEach(evt => {
            window.addEventListener(evt, unlock, { passive: true });
        });
    }

    setupLifecycleListeners() {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                this.onAppPause();
            } else {
                this.onAppResume();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', () => this.onAppPause());
        window.addEventListener('focus', () => this.onAppResume());
        window.addEventListener('pagehide', () => this.onAppPause());
        window.addEventListener('pageshow', () => this.onAppResume());
    }

    onAppPause() {
        this.isAppInBackground = true;
        if (this.musicState) {
            this.musicState.timer = 0;
        }
        if (this.ctx && this.ctx.state === 'running') {
            if (this.masterGain) {
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            }
            this.ctx.suspend().catch(() => {});
        }
    }

    onAppResume() {
        this.isAppInBackground = false;
        if (this.musicState) {
            this.musicState.timer = 0;
        }
        if (this.ctx) {
            this.ctx.resume().then(() => {
                if (this.masterGain && !this.isMuted) {
                    this.masterGain.gain.setTargetAtTime(0.85, this.ctx.currentTime, 0.08);
                }
            }).catch(() => {});
        }
    }

    init() {
        if (this.isInitialized) return;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();

            this.limiter = this.ctx.createDynamicsCompressor();
            this.limiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
            this.limiter.knee.setValueAtTime(6, this.ctx.currentTime);
            this.limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
            this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
            this.limiter.release.setValueAtTime(0.15, this.ctx.currentTime);
            this.limiter.connect(this.ctx.destination);

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
            this.masterGain.connect(this.limiter);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.setupMusicLayers();
            this.isInitialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('sketchoid_vol_music', this.musicVolume.toString());
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
        }
    }

    setSFXVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('sketchoid_vol_sfx', this.sfxVolume.toString());
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
        }
    }

    setPalette(themeKey) {
        this.currentPalette = themeKey || 'blueprint';
        if (this.isInitialized && this.ctx) {
            this.startAmbientDrone();
        }
    }

    setupMusicLayers() {
        const now = this.ctx.currentTime;

        this.musicState.ambientGain = this.ctx.createGain();
        this.musicState.ambientGain.gain.setValueAtTime(0.35, now);
        this.musicState.ambientGain.connect(this.musicGain);

        this.musicState.percussionGain = this.ctx.createGain();
        this.musicState.percussionGain.gain.setValueAtTime(0.0, now);
        this.musicState.percussionGain.connect(this.musicGain);

        this.musicState.bassGain = this.ctx.createGain();
        this.musicState.bassGain.gain.setValueAtTime(0.0, now);
        this.musicState.bassGain.connect(this.musicGain);

        this.musicState.arpGain = this.ctx.createGain();
        this.musicState.arpGain.gain.setValueAtTime(0.0, now);
        this.musicState.arpGain.connect(this.musicGain);

        this.musicState.frenzyGain = this.ctx.createGain();
        this.musicState.frenzyGain.gain.setValueAtTime(0.0, now);
        this.musicState.frenzyGain.connect(this.musicGain);

        this.startAmbientDrone();
    }

    startAmbientDrone() {
        this.stopAmbientDrone();
        this.droneOscillators = [];

        const chord = [65.41, 98.00, 130.81];
        for (const freq of chord) {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();

            osc.type = this.currentPalette === 'neon' ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(280, this.ctx.currentTime);

            osc.connect(filter);
            filter.connect(this.musicState.ambientGain);
            osc.start();
            this.droneOscillators.push({ osc, filter });
        }
    }

    stopAmbientDrone() {
        if (this.droneOscillators) {
            for (const { osc, filter } of this.droneOscillators) {
                try {
                    osc.stop();
                    osc.disconnect();
                    filter.disconnect();
                } catch (e) {}
            }
            this.droneOscillators = [];
        }
    }

    updateMusic(dt, comboStreak = 0, isCrystalFrenzy = false, isBoss = false, isPlaying = true) {
        if (!this.isInitialized || this.isMuted || !isPlaying || this.isAppInBackground || document.hidden) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
            return;
        }

        // Clamp dt to strictly prevent audio bursts after lag spikes or background sleep
        const safeDt = Math.min(Math.max(0, dt), 0.05);
        const now = this.ctx.currentTime;
        const ms = this.musicState;

        const targetPercussion = comboStreak >= 2 ? 0.38 : 0.12;
        const targetBass = comboStreak >= 4 ? 0.42 : 0.0;
        const targetArp = comboStreak >= 8 ? 0.38 : 0.0;
        const targetFrenzy = (isCrystalFrenzy || isBoss) ? 0.48 : 0.0;

        ms.percussionGain.gain.setTargetAtTime(targetPercussion, now, 0.4);
        ms.bassGain.gain.setTargetAtTime(targetBass, now, 0.4);
        ms.arpGain.gain.setTargetAtTime(targetArp, now, 0.3);
        ms.frenzyGain.gain.setTargetAtTime(targetFrenzy, now, 0.25);

        const stepInterval = 60 / ms.tempo / 4;
        ms.timer += safeDt;

        if (ms.timer >= stepInterval) {
            ms.timer = 0; // Absolute reset avoids cumulative lag bursts
            ms.step = (ms.step + 1) % 16;
            this.triggerSequencerStep(ms.step, now);
        }
    }

    triggerSequencerStep(step, now) {
        if (this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        if (this.musicState.percussionGain.gain.value > 0.05) {
            if (step % 4 === 0) {
                this.synthesizePencilTap(now, 90, 0.06, 0.3);
            } else if (step % 2 === 0) {
                this.synthesizePencilTap(now, 3200, 0.025, 0.16);
            }
        }

        if (this.musicState.bassGain.gain.value > 0.05 && step % 2 === 0) {
            const bassIdx = Math.floor(step / 2) % this.bassSequence.length;
            const freq = this.bassSequence[bassIdx];
            if (freq > 0) {
                this.synthesizeBassNote(now, freq, 0.14);
            }
        }

        if (this.musicState.arpGain.gain.value > 0.05) {
            const arpIdx = step % this.arpSequence.length;
            const freq = this.arpSequence[arpIdx];
            this.synthesizeArpNote(now, freq, 0.09);
        }

        if (this.musicState.frenzyGain.gain.value > 0.05 && step % 4 === 0) {
            const leadNotes = [1046.50, 1174.66, 1318.51, 1567.98];
            const freq = leadNotes[(step / 4) % leadNotes.length];
            this.synthesizeFrenzyLead(now, freq, 0.22);
        }
    }

    synthesizePencilTap(time, pitch, duration, gainLevel) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = pitch > 1000 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(pitch, time);
            osc.frequency.exponentialRampToValueAtTime(pitch * 0.3, time + duration);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(pitch, time);

            gain.gain.setValueAtTime(gainLevel, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicState.percussionGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    filter.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(time);
            osc.stop(time + duration);
        } catch (e) {}
    }

    synthesizeBassNote(time, freq, duration) {
        try {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, time);
            filter.Q.setValueAtTime(4, time);

            gain.gain.setValueAtTime(0.35, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicState.bassGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    filter.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(time);
            osc.stop(time + duration);
        } catch (e) {}
    }

    synthesizeArpNote(time, freq, duration) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = this.currentPalette === 'neon' ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.24, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(gain);
            gain.connect(this.musicState.arpGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(time);
            osc.stop(time + duration);
        } catch (e) {}
    }

    synthesizeFrenzyLead(time, freq, duration) {
        try {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, time);
            filter.Q.setValueAtTime(6, time);

            gain.gain.setValueAtTime(0.30, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicState.frenzyGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    filter.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(time);
            osc.stop(time + duration);
        } catch (e) {}
    }

    playBrickChime(comboIndex = 0, tier = 'emerald', velocity = 8.0) {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const baseIndex = comboIndex % this.pentatonicScale.length;
            const velocityShift = Math.max(0, (velocity - 7.5) * 12);
            const freq = this.pentatonicScale[baseIndex] + velocityShift;

            const carrier = this.ctx.createOscillator();
            const modulator = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            const mainGain = this.ctx.createGain();

            carrier.type = 'sine';
            carrier.frequency.setValueAtTime(freq, now);

            modulator.type = 'triangle';
            modulator.frequency.setValueAtTime(freq * 2.0, now);
            modGain.gain.setValueAtTime(freq * 1.5, now);
            modGain.gain.exponentialRampToValueAtTime(0.1, now + 0.35);

            modulator.connect(modGain);
            modGain.connect(carrier.frequency);

            mainGain.gain.setValueAtTime(0.35, now);
            mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

            carrier.connect(mainGain);
            mainGain.connect(this.sfxGain);

            carrier.onended = () => {
                try {
                    carrier.disconnect();
                    modulator.disconnect();
                    modGain.disconnect();
                    mainGain.disconnect();
                } catch (e) {}
            };

            modulator.start(now);
            carrier.start(now);
            modulator.stop(now + 0.40);
            carrier.stop(now + 0.40);
        } catch (e) {}
    }

    playExplosion(x, y, radius = 60) {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;

            // Sub-bass thud
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(160, now);
            subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
            subGain.gain.setValueAtTime(0.55, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
            subOsc.connect(subGain);
            subGain.connect(this.sfxGain);
            subOsc.start(now);
            subOsc.stop(now + 0.38);

            // Noise burst for paper shred
            const bufferSize = this.ctx.sampleRate * 0.25;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.25);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.40, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            noiseNode.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noiseNode.onended = () => {
                try {
                    noiseNode.disconnect();
                    filter.disconnect();
                    noiseGain.disconnect();
                    subOsc.disconnect();
                    subGain.disconnect();
                } catch (e) {}
            };

            noiseNode.start(now);
            noiseNode.stop(now + 0.25);
        } catch (e) {}
    }

    playPaddleHit(offsetRatio = 0, isEdge = false) {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const baseFreq = isEdge ? 620 : 340;
            const freq = baseFreq + Math.abs(offsetRatio) * 120;

            osc.type = isEdge ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.12);

            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + 0.14);
        } catch (e) {}
    }

    playNearMissWhoosh() {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, now);
            filter.Q.setValueAtTime(3.5, now);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    filter.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {}
    }

    playPowerupCollect(type) {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.045);

                gain.gain.setValueAtTime(0.28, now + idx * 0.045);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.22);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.onended = () => {
                    try {
                        osc.disconnect();
                        gain.disconnect();
                    } catch (e) {}
                };

                osc.start(now + idx * 0.045);
                osc.stop(now + idx * 0.045 + 0.22);
            });
        } catch (e) {}
    }

    playLaserShoot() {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {}
    }

    playWallTick() {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(920, now);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {}
    }

    playTrampolineBounce() {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + 0.20);
        } catch (e) {}
    }

    playBallLost() {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(65, now + 0.45);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + 0.48);
        } catch (e) {}
    }

    playLevelClear() {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            fanfare.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(0.32, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.onended = () => {
                    try {
                        osc.disconnect();
                        gain.disconnect();
                    } catch (e) {}
                };

                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.45);
            });
        } catch (e) {}
    }

    playGameOver() {
        if (!this.isInitialized || this.isMuted || this.isAppInBackground || !this.ctx || this.ctx.state !== 'running') return;

        try {
            const now = this.ctx.currentTime;
            const notes = [196.00, 185.00, 174.61, 164.81];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.16);

                gain.gain.setValueAtTime(0.30, now + idx * 0.16);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.38);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.onended = () => {
                    try {
                        osc.disconnect();
                        gain.disconnect();
                    } catch (e) {}
                };

                osc.start(now + idx * 0.16);
                osc.stop(now + idx * 0.16 + 0.38);
            });
        } catch (e) {}
    }

    toggleMute() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
        }
        return this.isMuted;
    }
}

window.soundEngine = new SoundEngine();
