/**
 * Neo-Arkanoid Particle & Visual FX Engine
 * Hand-drawn sketchy particle shards, shockwaves, floating text, and screen shake
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.shakeOffset = { x: 0, y: 0, rotation: 0 };
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.shakeOffset = { x: 0, y: 0, rotation: 0 };
    }

    /**
     * Trigger screen shake impulse
     */
    addShake(magnitude = 6, duration = 0.25) {
        this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
        this.shakeTime = Math.max(this.shakeTime, duration);
    }

    /**
     * Create explosion debris of hand-drawn shards
     */
    createBrickExplosion(x, y, w, h, color, tier = 'emerald', count = 14) {
        const isNuke = tier === 'ruby';
        const numShards = isNuke ? count * 2 : count;
        
        for (let i = 0; i < numShards; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (isNuke ? 3.5 : 2.0) + Math.random() * (isNuke ? 7.0 : 4.5);
            const size = 4 + Math.random() * (isNuke ? 12 : 8);
            
            // Random polygon vertices for hand-drawn shards
            const numVertices = 3 + Math.floor(Math.random() * 3);
            const vertices = [];
            for (let v = 0; v < numVertices; v++) {
                const a = (v / numVertices) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const r = size * (0.6 + Math.random() * 0.8);
                vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }

            this.particles.push({
                type: 'shard',
                x: x + Math.random() * w,
                y: y + Math.random() * h,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                gravity: 0.15,
                friction: 0.97,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.25,
                vertices,
                color,
                strokeColor: '#222222',
                alpha: 1.0,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                roughSeed: Math.floor(Math.random() * 1000)
            });
        }

        // Add smoke puff scribble
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                type: 'puff',
                x: x + w / 2 + (Math.random() - 0.5) * w,
                y: y + h / 2 + (Math.random() - 0.5) * h,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5 - 0.5,
                gravity: -0.02,
                friction: 0.94,
                radius: 6 + Math.random() * 12,
                maxRadius: 18 + Math.random() * 14,
                color: 'rgba(200, 200, 200, 0.4)',
                alpha: 0.8,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.02
            });
        }

        // Add expanding shockwave if heavy hit or ruby bomb
        if (isNuke || tier === 'amethyst' || tier === 'gold') {
            this.shockwaves.push({
                x: x + w / 2,
                y: y + h / 2,
                radius: 10,
                maxRadius: isNuke ? 120 : 60,
                speed: isNuke ? 8 : 4,
                color: color,
                alpha: 0.9,
                decay: 0.03
            });
        }
    }

    /**
     * Create laser impact spark burst
     */
    createLaserSparks(x, y, color = '#ff0055', count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.1,
                friction: 0.92,
                length: 4 + Math.random() * 6,
                color: color,
                alpha: 1.0,
                life: 1.0,
                decay: 0.04 + Math.random() * 0.04
            });
        }
    }

    /**
     * Create paddle hit bounce ripples
     */
    createPaddleHitSparks(x, y, paddleVx = 0) {
        for (let i = 0; i < 6; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed + paddleVx * 0.2,
                vy: Math.sin(angle) * speed,
                gravity: 0.12,
                friction: 0.94,
                length: 4 + Math.random() * 4,
                color: '#ffdd44',
                alpha: 1.0,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    /**
     * Add floating score / combo text
     */
    addFloatingText(text, x, y, color = '#ffffff', scale = 1.0, isCombo = false) {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -2.2,
            alpha: 1.0,
            life: 1.0,
            decay: isCombo ? 0.018 : 0.025,
            color,
            scale,
            wobble: Math.random() * 100,
            isCombo
        });
    }

    /**
     * Update all particles, shockwaves, and texts
     */
    update(dt = 1 / 60) {
        // Screen Shake update
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            const factor = Math.max(0, this.shakeTime / 0.3);
            const currentMag = this.shakeMagnitude * factor;
            this.shakeOffset.x = (Math.random() - 0.5) * 2 * currentMag;
            this.shakeOffset.y = (Math.random() - 0.5) * 2 * currentMag;
            this.shakeOffset.rotation = (Math.random() - 0.5) * 0.02 * currentMag;
        } else {
            this.shakeMagnitude = 0;
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
            this.shakeOffset.rotation = 0;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.vx *= p.friction || 1;
            p.vy *= p.friction || 1;
            if (p.vRot) p.rotation += p.vRot;
            
            p.life -= p.decay;
            p.alpha = Math.max(0, p.life);

            if (p.type === 'puff') {
                p.radius += (p.maxRadius - p.radius) * 0.08;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed;
            sw.alpha -= sw.decay;
            if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.vy *= 0.94;
            ft.wobble += 0.1;
            ft.life -= ft.decay;
            ft.alpha = Math.max(0, ft.life);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    /**
     * Render particles with Rough.js and 2D canvas context
     */
    draw(ctx, rc, theme) {
        ctx.save();

        // 1. Draw Shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = sw.alpha * 0.7;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            // Jittery sketchy circle
            for (let a = 0; a <= Math.PI * 2 + 0.2; a += 0.2) {
                const r = sw.radius + (Math.sin(a * 7) * 2);
                const px = sw.x + Math.cos(a) * r;
                const py = sw.y + Math.sin(a) * r;
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.restore();
        }

        // 2. Draw Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'shard') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                ctx.fillStyle = p.color;
                ctx.strokeStyle = theme.inkColor;
                ctx.lineWidth = 1.5;

                ctx.beginPath();
                if (p.vertices && p.vertices.length > 0) {
                    ctx.moveTo(p.vertices[0].x, p.vertices[0].y);
                    for (let v = 1; v < p.vertices.length; v++) {
                        ctx.lineTo(p.vertices[v].x, p.vertices[v].y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            } else if (p.type === 'puff') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 3. Draw Floating Texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            const wobbleX = Math.sin(ft.wobble) * 2;
            const wobbleY = Math.cos(ft.wobble) * 1.5;

            ctx.font = ft.isCombo ? `bold ${Math.round(20 * ft.scale)}px 'Fredoka', cursive` : `bold ${Math.round(15 * ft.scale)}px 'JetBrains Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text shadow for high legibility
            ctx.fillStyle = theme.bgDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
            ctx.fillText(ft.text, ft.x + wobbleX + 1.5, ft.y + wobbleY + 1.5);

            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x + wobbleX, ft.y + wobbleY);

            ctx.restore();
        }

        ctx.restore();
    }
}

window.particleSystem = new ParticleSystem();
