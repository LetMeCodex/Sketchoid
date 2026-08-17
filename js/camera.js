/**
 * SKETCHOID 2D Camera Engine
 * World -> Camera -> Screen Transformation Pipeline with Trauma Shake, Recoil Punch, Impact Zoom, and Screen Flash
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

        // Trauma-based Screen Shake (stress / decay)
        this.trauma = 0; // 0.0 to 1.0
        this.traumaDecay = 1.4; // Decay per second
        this.maxShakeAngle = 0.045; // Radians (~2.5 deg)
        this.maxShakeOffset = 14; // Pixels
        this.shakeFreq = 28;
        this.time = 0;

        // Directional Recoil Punch (impulse)
        this.punchX = 0;
        this.punchY = 0;
        this.punchVelX = 0;
        this.punchVelY = 0;

        // Impact Zoom
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.zoomVel = 0;

        // Screen Flash Effect
        this.flashColor = '#ffffff';
        this.flashAlpha = 0;
        this.flashDecay = 4.0;
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

    /**
     * Add trauma (0.0 to 1.0) for procedural screen shake
     */
    addTrauma(amount) {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }

    /**
     * Trigger a directional camera punch
     */
    punch(dirX, dirY, strength = 6) {
        const len = Math.hypot(dirX, dirY) || 1;
        this.punchVelX += (dirX / len) * strength;
        this.punchVelY += (dirY / len) * strength;
    }

    /**
     * Trigger an impact zoom impulse (e.g. 1.04 on heavy hits)
     */
    impactZoom(zoomFactor = 1.035) {
        this.zoom = Math.max(this.zoom, zoomFactor);
    }

    /**
     * Trigger a fullscreen flash
     */
    flash(color = '#ffffff', initialAlpha = 0.35) {
        this.flashColor = color;
        this.flashAlpha = initialAlpha;
    }

    /**
     * Update camera transforms, springs, and trauma decay
     */
    update(dt, focusX = null, focusY = null) {
        this.time += dt * this.shakeFreq;

        // Subtle ambient camera drift towards centroid of focus
        if (focusX !== null && focusY !== null) {
            const centerX = this.viewWidth / 2;
            const centerY = this.viewHeight / 2;
            this.targetX = centerX + (focusX - centerX) * 0.04;
            this.targetY = centerY + (focusY - centerY) * 0.04;
        } else {
            this.targetX = this.viewWidth / 2;
            this.targetY = this.viewHeight / 2;
        }

        this.x += (this.targetX - this.x) * 0.08;
        this.y += (this.targetY - this.y) * 0.08;

        // Decay Trauma non-linearly (trauma^2 produces natural organic shudder)
        if (this.trauma > 0) {
            this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
        }

        // Spring physics for Directional Punch recovery
        const punchK = 0.22;
        const punchDamping = 0.74;
        const punchForceX = -this.punchX * punchK;
        const punchForceY = -this.punchY * punchK;
        this.punchVelX = (this.punchVelX + punchForceX) * punchDamping;
        this.punchVelY = (this.punchVelY + punchForceY) * punchDamping;
        this.punchX += this.punchVelX;
        this.punchY += this.punchVelY;

        // Spring physics for Impact Zoom recovery
        const zoomK = 0.25;
        const zoomDamping = 0.70;
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

        // Calculate trauma shake offsets
        const shake = this.trauma * this.trauma; // Non-linear shake power
        const offsetX = (Math.sin(this.time * 1.1) + Math.cos(this.time * 2.3) * 0.5) * this.maxShakeOffset * shake;
        const offsetY = (Math.cos(this.time * 1.3) + Math.sin(this.time * 1.9) * 0.5) * this.maxShakeOffset * shake;
        const angle = (Math.sin(this.time * 0.9)) * this.maxShakeAngle * shake;

        // Apply transformations centered on viewport
        ctx.translate(centerX + offsetX + this.punchX, centerY + offsetY + this.punchY);
        ctx.rotate(angle);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    /**
     * End camera transformation & draw screen-space post overlays (flash, vignette)
     */
    end(ctx) {
        ctx.restore();

        // Draw Screen Flash
        if (this.flashAlpha > 0.005) {
            ctx.save();
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = Math.min(1.0, this.flashAlpha);
            ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
            ctx.restore();
        }
    }
}

window.Camera2D = Camera2D;
