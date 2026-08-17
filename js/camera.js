/**
 * SKETCHOID 2D Camera Engine (Optimized & Tightly Clamped)
 * World -> Camera -> Screen Transformation Pipeline with Controlled Shake, Clamped Punch, and Crisp Recovery
 */

class Camera2D {
    constructor(viewWidth, viewHeight) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;

        // Position & Target
        this.x = viewWidth / 2;
        this.y = viewHeight / 2;
        this.targetX = this.x;
        this.targetY = this.y;

        // Controlled Trauma-based Screen Shake
        this.trauma = 0; // 0.0 to 1.0
        this.traumaDecay = 2.8; // Fast recovery (2.8/s) to prevent lingering disorientation
        this.maxShakeAngle = 0.018; // Clamped to ~1 degree for legibility
        this.maxShakeOffset = 6.0; // Clamped to max 6px offset
        this.shakeFreq = 26;
        this.time = 0;

        // Directional Recoil Punch (Strictly Clamped)
        this.punchX = 0;
        this.punchY = 0;
        this.punchVelX = 0;
        this.punchVelY = 0;
        this.maxPunch = 7.0; // Max 7px punch displacement

        // Impact Zoom (Gentle & snappy)
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.zoomVel = 0;

        // Screen Flash Effect
        this.flashColor = '#ffffff';
        this.flashAlpha = 0;
        this.flashDecay = 5.5;

        this.lastTraumaTime = 0;
    }

    reset() {
        this.x = this.viewWidth / 2;
        this.y = this.viewHeight / 2;
        this.targetX = this.x;
        this.targetY = this.y;
        this.trauma = 0;
        this.punchX = 0;
        this.punchY = 0;
        this.punchVelX = 0;
        this.punchVelY = 0;
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.zoomVel = 0;
        this.flashAlpha = 0;
    }

    resize(viewWidth, viewHeight) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.x = viewWidth / 2;
        this.y = viewHeight / 2;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    /**
     * Add trauma with diminishing returns to prevent disorientation during combo bursts
     */
    addTrauma(amount) {
        const motionScale = (window.game && window.game.reducedMotion) ? 0.20 : 1.0;
        const effectiveAmount = amount * motionScale * (1.0 - this.trauma * 0.65);
        this.trauma = Math.min(0.85, this.trauma + effectiveAmount);
    }

    /**
     * Trigger a directional camera punch with strict velocity clamping
     */
    punch(dirX, dirY, strength = 4.0) {
        const motionScale = (window.game && window.game.reducedMotion) ? 0.25 : 1.0;
        const len = Math.hypot(dirX, dirY) || 1;
        const clampedStrength = Math.min(5.0, strength * motionScale);
        this.punchVelX += (dirX / len) * clampedStrength;
        this.punchVelY += (dirY / len) * clampedStrength;

        // Hard clamp velocities
        this.punchVelX = Math.max(-8.0, Math.min(8.0, this.punchVelX));
        this.punchVelY = Math.max(-8.0, Math.min(8.0, this.punchVelY));
    }

    /**
     * Trigger an impact zoom impulse
     */
    impactZoom(zoomFactor = 1.025) {
        this.zoom = Math.max(this.zoom, Math.min(1.035, zoomFactor));
    }

    /**
     * Trigger a subtle screen flash
     */
    flash(color = '#ffffff', initialAlpha = 0.22) {
        this.flashColor = color;
        this.flashAlpha = Math.min(0.35, initialAlpha);
    }

    /**
     * Update camera transforms, springs, and trauma decay
     */
    update(dt, focusX = null, focusY = null) {
        this.time += dt * this.shakeFreq;

        // Subtle ambient camera drift towards centroid
        if (focusX !== null && focusY !== null) {
            const centerX = this.viewWidth / 2;
            const centerY = this.viewHeight / 2;
            this.targetX = centerX + (focusX - centerX) * 0.02;
            this.targetY = centerY + (focusY - centerY) * 0.02;
        } else {
            this.targetX = this.viewWidth / 2;
            this.targetY = this.viewHeight / 2;
        }

        this.x += (this.targetX - this.x) * 0.10;
        this.y += (this.targetY - this.y) * 0.10;

        // Decay Trauma quickly and smoothly
        if (this.trauma > 0) {
            this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
        }

        // Spring physics for Directional Punch recovery with strict clamping
        const punchK = 0.35;
        const punchDamping = 0.65;
        const punchForceX = -this.punchX * punchK;
        const punchForceY = -this.punchY * punchK;
        this.punchVelX = (this.punchVelX + punchForceX) * punchDamping;
        this.punchVelY = (this.punchVelY + punchForceY) * punchDamping;
        this.punchX += this.punchVelX;
        this.punchY += this.punchVelY;

        // Hard clamp position
        this.punchX = Math.max(-this.maxPunch, Math.min(this.maxPunch, this.punchX));
        this.punchY = Math.max(-this.maxPunch, Math.min(this.maxPunch, this.punchY));

        // Spring physics for Impact Zoom recovery
        const zoomK = 0.32;
        const zoomDamping = 0.65;
        const zoomForce = (this.targetZoom - this.zoom) * zoomK;
        this.zoomVel = (this.zoomVel + zoomForce) * zoomDamping;
        this.zoom += this.zoomVel;

        // Flash decay
        if (this.flashAlpha > 0) {
            this.flashAlpha = Math.max(0, this.flashAlpha - this.flashDecay * dt);
        }
    }

    /**
     * Begin world-to-camera matrix transformation
     */
    begin(ctx) {
        ctx.save();

        const centerX = this.viewWidth / 2;
        const centerY = this.viewHeight / 2;

        // Calculate clamped non-linear trauma shake
        const shake = this.trauma * this.trauma;
        const offsetX = (Math.sin(this.time * 1.1) + Math.cos(this.time * 2.3) * 0.5) * this.maxShakeOffset * shake;
        const offsetY = (Math.cos(this.time * 1.3) + Math.sin(this.time * 1.9) * 0.5) * this.maxShakeOffset * shake;
        const angle = (Math.sin(this.time * 0.9)) * this.maxShakeAngle * shake;

        ctx.translate(centerX + offsetX + this.punchX, centerY + offsetY + this.punchY);
        ctx.rotate(angle);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    /**
     * End camera transformation & draw screen-space post overlays
     */
    end(ctx) {
        ctx.restore();

        if (this.flashAlpha > 0.005) {
            ctx.save();
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = Math.min(0.4, this.flashAlpha);
            ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
            ctx.restore();
        }
    }
}

window.Camera2D = Camera2D;
