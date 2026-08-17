/**
 * SKETCHOID Modular Particle Architecture (AAA Polish Engine)
 * Distinct particle families: Crystal, Sparks, Smoke, Debris, Dust, Ink, and Elastic Shockwaves.
 */

class CrystalParticle {
    constructor(x, y, color, speedScale = 1.0) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = (2.0 + Math.random() * 4.0) * speedScale;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1.2;
        this.gravity = 0.14;
        this.friction = 0.96;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.22;
        this.color = color;
        this.alpha = 1.0;
        this.life = 1.0;
        this.decay = 0.028 + Math.random() * 0.02;

        // Faceted crystal polygon vertices
        const size = 3.5 + Math.random() * 5.5;
        this.vertices = [
            { x: -size * 0.6, y: -size * 0.8 },
            { x: size * 0.7, y: -size * 0.4 },
            { x: size * 0.5, y: size * 0.7 },
            { x: -size * 0.5, y: size * 0.6 }
        ];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.rotation += this.vRot;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life);
        return this.life > 0;
    }

    draw(ctx, theme) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        ctx.fillStyle = this.color;
        ctx.strokeStyle = theme.borderStroke;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Specular glint highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -1.5, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class SparkParticle {
    constructor(x, y, color, vx = null, vy = null) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 4.5;
        this.vx = vx !== null ? vx : Math.cos(angle) * speed;
        this.vy = vy !== null ? vy : Math.sin(angle) * speed;
        this.gravity = 0.10;
        this.friction = 0.92;
        this.color = color;
        this.alpha = 1.0;
        this.life = 1.0;
        this.decay = 0.05 + Math.random() * 0.04;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life);
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 2.0, this.y - this.vy * 2.0);
        ctx.stroke();
        ctx.restore();
    }
}

class SmokeParticle {
    constructor(x, y, color = 'rgba(200, 200, 200, 0.4)') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.6;
        this.vy = -0.5 - Math.random() * 1.2;
        this.radius = 6 + Math.random() * 8;
        this.maxRadius = 22 + Math.random() * 14;
        this.color = color;
        this.alpha = 0.75;
        this.life = 1.0;
        this.decay = 0.035 + Math.random() * 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.radius += (this.maxRadius - this.radius) * 0.08;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life * 0.65);
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class DebrisParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const speed = 2.5 + Math.random() * 3.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.20;
        this.friction = 0.97;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.3;
        this.w = 6 + Math.random() * 6;
        this.h = 4 + Math.random() * 4;
        this.color = color;
        this.alpha = 1.0;
        this.life = 1.0;
        this.decay = 0.025;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.rotation += this.vRot;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life);
        return this.life > 0;
    }

    draw(ctx, theme) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = theme.borderStroke;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

class ShockwaveRing {
    constructor(x, y, color, maxRadius = 60, speed = 4.0) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.maxRadius = maxRadius;
        this.speed = speed;
        this.color = color;
        this.alpha = 0.85;
        this.decay = 0.04;
    }

    update() {
        this.radius += this.speed;
        this.alpha -= this.decay;
        return this.alpha > 0 && this.radius < this.maxRadius;
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.alpha * 0.7);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.crystals = [];
        this.sparks = [];
        this.smokes = [];
        this.debris = [];
        this.shockwaves = [];
        this.floatingTexts = [];

        this.maxCrystals = 50;
        this.maxSparks = 40;
        this.maxSmokes = 25;
        this.maxDebris = 30;
        this.maxShockwaves = 6;
        this.maxFloatingTexts = 8;
    }

    reset() {
        this.crystals.length = 0;
        this.sparks.length = 0;
        this.smokes.length = 0;
        this.debris.length = 0;
        this.shockwaves.length = 0;
        this.floatingTexts.length = 0;
    }

    addShake(magnitude = 4, duration = 0.15) {
        if (window.game && window.game.camera) {
            window.game.camera.addTrauma(magnitude * 0.04);
        }
    }

    createBrickExplosion(x, y, w, h, color, tier = 'emerald', count = 8) {
        const isNuke = tier === 'ruby';
        const cx = x + w / 2;
        const cy = y + h / 2;

        if (tier === 'sapphire') {
            // Sapphire: Pure Crystalline faceted shards
            for (let i = 0; i < count + 4; i++) {
                if (this.crystals.length >= this.maxCrystals) this.crystals.shift();
                this.crystals.push(new CrystalParticle(cx, cy, color, 1.2));
            }
            for (let i = 0; i < 4; i++) {
                if (this.sparks.length >= this.maxSparks) this.sparks.shift();
                this.sparks.push(new SparkParticle(cx, cy, '#38bdf8'));
            }
        } else if (tier === 'amethyst') {
            // Amethyst: Heavy Armor Debris
            for (let i = 0; i < 6; i++) {
                if (this.debris.length >= this.maxDebris) this.debris.shift();
                this.debris.push(new DebrisParticle(cx, cy, '#c084fc'));
            }
            for (let i = 0; i < 5; i++) {
                if (this.crystals.length >= this.maxCrystals) this.crystals.shift();
                this.crystals.push(new CrystalParticle(cx, cy, color));
            }
        } else if (isNuke) {
            // Ruby: Smoke + Fire Embers + Shockwave
            for (let i = 0; i < 8; i++) {
                if (this.smokes.length >= this.maxSmokes) this.smokes.shift();
                this.smokes.push(new SmokeParticle(cx, cy, 'rgba(239, 68, 68, 0.45)'));
            }
            for (let i = 0; i < 8; i++) {
                if (this.sparks.length >= this.maxSparks) this.sparks.shift();
                this.sparks.push(new SparkParticle(cx, cy, '#f97316'));
            }
            if (this.shockwaves.length >= this.maxShockwaves) this.shockwaves.shift();
            this.shockwaves.push(new ShockwaveRing(cx, cy, '#ef4444', 90, 6.5));
        } else if (tier === 'gold') {
            // Gold: Golden Spark Burst + Starburst Rings
            for (let i = 0; i < count; i++) {
                if (this.sparks.length >= this.maxSparks) this.sparks.shift();
                this.sparks.push(new SparkParticle(cx, cy, '#fbbf24'));
            }
            if (this.shockwaves.length >= this.maxShockwaves) this.shockwaves.shift();
            this.shockwaves.push(new ShockwaveRing(cx, cy, '#fbbf24', 55, 4.0));
        } else {
            // Emerald / Amber: Standard Crystals + Sparks
            for (let i = 0; i < count; i++) {
                if (this.crystals.length >= this.maxCrystals) this.crystals.shift();
                this.crystals.push(new CrystalParticle(cx, cy, color));
            }
        }
    }

    createLaserSparks(x, y, color = '#ff0055', count = 5) {
        for (let i = 0; i < count; i++) {
            if (this.sparks.length >= this.maxSparks) this.sparks.shift();
            this.sparks.push(new SparkParticle(x, y, color));
        }
    }

    createPaddleHitSparks(x, y, paddleVx = 0) {
        for (let i = 0; i < 4; i++) {
            if (this.sparks.length >= this.maxSparks) this.sparks.shift();
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.0;
            const speed = 2.2 + Math.random() * 2.5;
            this.sparks.push(new SparkParticle(
                x, y, '#fbbf24',
                Math.cos(angle) * speed + paddleVx * 0.15,
                Math.sin(angle) * speed
            ));
        }
    }

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

    update(dt = 1 / 60) {
        this.crystals = this.crystals.filter(c => c.update());
        this.sparks = this.sparks.filter(s => s.update());
        this.smokes = this.smokes.filter(sm => sm.update());
        this.debris = this.debris.filter(d => d.update());
        this.shockwaves = this.shockwaves.filter(sw => sw.update());

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

    draw(ctx, rc, theme) {
        for (let i = 0; i < this.smokes.length; i++) this.smokes[i].draw(ctx);
        for (let i = 0; i < this.shockwaves.length; i++) this.shockwaves[i].draw(ctx);
        for (let i = 0; i < this.debris.length; i++) this.debris[i].draw(ctx, theme);
        for (let i = 0; i < this.crystals.length; i++) this.crystals[i].draw(ctx, theme);
        for (let i = 0; i < this.sparks.length; i++) this.sparks[i].draw(ctx);

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
    }
}

window.ParticleSystem = ParticleSystem;
window.particleSystem = new ParticleSystem();
