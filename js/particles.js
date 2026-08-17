/**
 * SKETCHOID Particle & Visual FX Engine (Ultra-Optimized 60 FPS)
 * High-performance sketchy shards, sparks, shockwaves, and floating text
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 75;
        this.floatingTexts = [];
        this.maxFloatingTexts = 8;
        this.shockwaves = [];
        this.maxShockwaves = 6;
    }

    reset() {
        this.particles.length = 0;
        this.floatingTexts.length = 0;
        this.shockwaves.length = 0;
    }

    addShake(magnitude = 4, duration = 0.15) {
        // Delegate to unified Camera2D to prevent double-shaking
        if (window.game && window.game.camera) {
            window.game.camera.addTrauma(magnitude * 0.04);
        }
    }

    /**
     * Create explosion debris of hand-drawn shards
     */
    createBrickExplosion(x, y, w, h, color, tier = 'emerald', count = 10) {
        const isNuke = tier === 'ruby';
        const numShards = Math.min(isNuke ? 14 : count, 14);
        
        for (let i = 0; i < numShards; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = Math.random() * Math.PI * 2;
            const speed = (isNuke ? 3.0 : 1.8) + Math.random() * (isNuke ? 4.5 : 3.2);
            const size = 3 + Math.random() * 6;
            
            const vertices = [];
            const numVertices = 3;
            for (let v = 0; v < numVertices; v++) {
                const a = (v / numVertices) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                const r = size * (0.7 + Math.random() * 0.6);
                vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }

            this.particles.push({
                type: 'shard',
                x: x + Math.random() * w,
                y: y + Math.random() * h,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.0,
                gravity: 0.14,
                friction: 0.96,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.2,
                vertices,
                color,
                alpha: 1.0,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.02
            });
        }

        // Add expanding shockwave if heavy hit or ruby bomb
        if (isNuke || tier === 'amethyst' || tier === 'gold') {
            if (this.shockwaves.length >= this.maxShockwaves) {
                this.shockwaves.shift();
            }
            this.shockwaves.push({
                x: x + w / 2,
                y: y + h / 2,
                radius: 8,
                maxRadius: isNuke ? 85 : 45,
                speed: isNuke ? 6 : 3.5,
                color: color,
                alpha: 0.85,
                decay: 0.04
            });
        }
    }

    /**
     * Create laser impact spark burst
     */
    createLaserSparks(x, y, color = '#ff0055', count = 5) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3.5;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.1,
                friction: 0.92,
                length: 4 + Math.random() * 4,
                color: color,
                alpha: 1.0,
                life: 1.0,
                decay: 0.06 + Math.random() * 0.04
            });
        }
    }

    /**
     * Create paddle hit bounce sparks
     */
    createPaddleHitSparks(x, y, paddleVx = 0) {
        for (let i = 0; i < 4; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.0;
            const speed = 2 + Math.random() * 2.5;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed + paddleVx * 0.15,
                vy: Math.sin(angle) * speed,
                gravity: 0.12,
                friction: 0.94,
                length: 3 + Math.random() * 4,
                color: '#fbbf24',
                alpha: 1.0,
                life: 1.0,
                decay: 0.07
            });
        }
    }

    /**
     * Add floating score / combo text
     */
    addFloatingText(text, x, y, color = '#ffffff', scale = 1.0, isCombo = false) {
        if (this.floatingTexts.length >= this.maxFloatingTexts) {
            this.floatingTexts.shift();
        }

        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -2.0,
            alpha: 1.0,
            life: 1.0,
            decay: isCombo ? 0.024 : 0.035,
            color,
            scale: Math.min(1.4, scale),
            wobble: Math.random() * 100,
            isCombo
        });
    }

    /**
     * Fast update loop
     */
    update(dt = 1 / 60) {
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
            ft.vy *= 0.93;
            ft.wobble += 0.1;
            ft.life -= ft.decay;
            ft.alpha = Math.max(0, ft.life);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    /**
     * Fast batch rendering
     */
    draw(ctx, rc, theme) {
        ctx.save();

        // 1. Draw Shockwaves
        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            ctx.save();
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = sw.alpha * 0.6;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 2. Draw Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'shard') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                ctx.fillStyle = p.color;
                ctx.strokeStyle = theme.borderStroke;
                ctx.lineWidth = 1.2;

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
            } else if (p.type === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 3. Draw Floating Texts
        if (this.floatingTexts.length > 0) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < this.floatingTexts.length; i++) {
                const ft = this.floatingTexts[i];
                ctx.save();
                ctx.globalAlpha = ft.alpha;
                const wobbleX = Math.sin(ft.wobble) * 1.5;

                ctx.font = ft.isCombo ? `bold ${Math.round(18 * ft.scale)}px 'Fredoka', cursive` : `bold ${Math.round(14 * ft.scale)}px 'JetBrains Mono', monospace`;

                ctx.fillStyle = theme.bgDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)';
                ctx.fillText(ft.text, ft.x + wobbleX + 1.2, ft.y + 1.2);

                ctx.fillStyle = ft.color;
                ctx.fillText(ft.text, ft.x + wobbleX, ft.y);

                ctx.restore();
            }
        }

        ctx.restore();
    }
}

window.particleSystem = new ParticleSystem();
