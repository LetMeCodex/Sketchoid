/**
 * SKETCHOID Centralized Events, Haptics & Telemetry Architecture
 * Standardized ImpactEvent and SkillEvent pipelines decoupling Physics from Audio, Camera, Particles, and Meta.
 */

class ImpactEventBus {
    constructor() {
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    emit(event) {
        for (let i = 0; i < this.listeners.length; i++) {
            try {
                this.listeners[i](event);
            } catch (err) {
                console.error('Error in ImpactEvent listener:', err);
            }
        }
    }
}

class SkillEventManager {
    constructor() {
        this.lastWallHitTime = 0;
        this.lastBankShotTime = 0;
        this.wallBounceCount = 0;
    }

    reset() {
        this.lastWallHitTime = 0;
        this.lastBankShotTime = 0;
        this.wallBounceCount = 0;
    }

    recordWallBounce(timeNow) {
        this.lastWallHitTime = timeNow;
        this.wallBounceCount++;
    }

    recordPaddleHit() {
        this.wallBounceCount = 0;
    }

    checkBankShot(timeNow) {
        // If ball bounced off side walls within the last 0.85s before hitting a brick
        if (timeNow - this.lastWallHitTime < 0.85 && this.wallBounceCount > 0 && timeNow - this.lastBankShotTime > 0.4) {
            this.lastBankShotTime = timeNow;
            return {
                type: 'BANK_SHOT',
                name: '📐 BANK SHOT!',
                scoreBonus: 80,
                xpBonus: 10,
                inkBonus: 2,
                color: '#38bdf8'
            };
        }
        return null;
    }
}

class HapticEngine {
    constructor() {
        this.enabled = true;
        this.hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
    }

    light() {
        if (!this.enabled || !this.hasVibration) return;
        try { navigator.vibrate(12); } catch (e) {}
    }

    medium() {
        if (!this.enabled || !this.hasVibration) return;
        try { navigator.vibrate(25); } catch (e) {}
    }

    heavy() {
        if (!this.enabled || !this.hasVibration) return;
        try { navigator.vibrate([35, 20, 45]); } catch (e) {}
    }

    success() {
        if (!this.enabled || !this.hasVibration) return;
        try { navigator.vibrate([15, 30, 20, 30, 35]); } catch (e) {}
    }

    failure() {
        if (!this.enabled || !this.hasVibration) return;
        try { navigator.vibrate([60, 40, 60]); } catch (e) {}
    }
}

class TelemetryEngine {
    constructor() {
        this.events = [];
        this.maxEvents = 100;
    }

    track(eventName, payload = {}) {
        const entry = {
            event: eventName,
            timestamp: Date.now(),
            payload
        };
        this.events.push(entry);
        if (this.events.length > this.maxEvents) this.events.shift();

        // Ready for production analytics integrations
        if (window.SKETCHOID_DEBUG) {
            console.debug(`[Telemetry] ${eventName}`, payload);
        }
    }
}

window.ImpactEventBus = ImpactEventBus;
window.SkillEventManager = SkillEventManager;
window.HapticEngine = HapticEngine;
window.TelemetryEngine = TelemetryEngine;

window.impactEvents = new ImpactEventBus();
window.skillEvents = new SkillEventManager();
window.haptics = new HapticEngine();
window.telemetry = new TelemetryEngine();
