/**
 * SKETCHOID Interactive Level Geometry & Physics Puzzles
 * Rotating Windmills, Curved Deflectors, Ink Portals, and Gravity Vortexes
 */

class RotatingWindmill {
    constructor(x, y, length = 75, speed = 1.2, color = '#38bdf8') {
        this.x = x;
        this.y = y;
        this.length = length;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = speed; // Radians per second
        this.color = color;
        this.seed = Math.floor(Math.random() * 1000);
    }

    update(dt) {
        this.angle += this.speed * dt;
    }

    testCollision(ball) {
        if (ball.isStuck) return null;

        const halfL = this.length / 2;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        const x1 = this.x - cos * halfL;
        const y1 = this.y - sin * halfL;
        const x2 = this.x + cos * halfL;
        const y2 = this.y + sin * halfL;

        // Closest point on line segment (x1, y1) to (x2, y2)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        let t = ((ball.x - x1) * dx + (ball.y - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;

        const distSq = (ball.x - closestX) * (ball.x - closestX) + (ball.y - closestY) * (ball.y - closestY);

        if (distSq < ball.radius * ball.radius) {
            const dist = Math.sqrt(distSq) || 0.001;
            const normalX = (ball.x - closestX) / dist;
            const normalY = (ball.y - closestY) / dist;

            // Rotational velocity vector of contact point: v = w x r
            const rx = closestX - this.x;
            const ry = closestY - this.y;
            const rotVx = -this.speed * ry;
            const rotVy = this.speed * rx;

            const sepX = normalX * (ball.radius - dist + 0.5);
            const sepY = normalY * (ball.radius - dist + 0.5);

            return {
                hit: true,
                normalX,
                normalY,
                sepX,
                sepY,
                rotVx,
                rotVy,
                contactX: closestX,
                contactY: closestY
            };
        }
        return null;
    }

    draw(ctx, rc, theme) {
        ctx.save();
        const halfL = this.length / 2;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        const x1 = this.x - cos * halfL;
        const y1 = this.y - sin * halfL;
        const x2 = this.x + cos * halfL;
        const y2 = this.y + sin * halfL;

        // Revolving Crossbar
        rc.line(x1, y1, x2, y2, {
            seed: this.seed,
            roughness: 1.4,
            stroke: this.color,
            strokeWidth: 4
        });

        // Center Pivot Pin
        rc.circle(this.x, this.y, 14, {
            seed: this.seed + 1,
            stroke: theme.borderStroke,
            strokeWidth: 2,
            fill: '#ffffff',
            fillStyle: 'solid'
        });

        ctx.restore();
    }
}

class InkPortal {
    constructor(entryX, entryY, exitX, exitY, colorA = '#38bdf8', colorB = '#f97316') {
        this.entryX = entryX;
        this.entryY = entryY;
        this.exitX = exitX;
        this.exitY = exitY;
        this.radius = 22;
        this.colorA = colorA;
        this.colorB = colorB;
        this.angle = 0;
        this.seed = Math.floor(Math.random() * 1000);
        this.teleportCooldown = 0;
    }

    update(dt) {
        this.angle += dt * 3.5;
        if (this.teleportCooldown > 0) {
            this.teleportCooldown -= dt;
        }
    }

    testTeleport(ball) {
        if (ball.isStuck || this.teleportCooldown > 0) return false;

        // Check Entry A -> Exit B
        const distA = Math.hypot(ball.x - this.entryX, ball.y - this.entryY);
        if (distA < this.radius) {
            ball.x = this.exitX + (ball.vx / ball.speed) * (this.radius + 6);
            ball.y = this.exitY + (ball.vy / ball.speed) * (this.radius + 6);
            this.teleportCooldown = 0.5;
            window.soundEngine?.playPowerupSpawn();
            window.particleSystem?.createLaserSparks(this.exitX, this.exitY, this.colorB, 10);
            return true;
        }

        // Check Entry B -> Exit A
        const distB = Math.hypot(ball.x - this.exitX, ball.y - this.exitY);
        if (distB < this.radius) {
            ball.x = this.entryX + (ball.vx / ball.speed) * (this.radius + 6);
            ball.y = this.entryY + (ball.vy / ball.speed) * (this.radius + 6);
            this.teleportCooldown = 0.5;
            window.soundEngine?.playPowerupSpawn();
            window.particleSystem?.createLaserSparks(this.entryX, this.entryY, this.colorA, 10);
            return true;
        }

        return false;
    }

    draw(ctx, rc, theme) {
        ctx.save();

        // Portal A (Swirling Vortex)
        rc.circle(this.entryX, this.entryY, this.radius * 2, {
            seed: this.seed + Math.floor(Date.now() / 100) % 1000,
            roughness: 1.8,
            stroke: this.colorA,
            strokeWidth: 2.5,
            fill: this.colorA,
            fillStyle: 'zigzag',
            fillWeight: 1.5
        });

        // Portal B (Swirling Vortex)
        rc.circle(this.exitX, this.exitY, this.radius * 2, {
            seed: this.seed + 50 + Math.floor(Date.now() / 100) % 1000,
            roughness: 1.8,
            stroke: this.colorB,
            strokeWidth: 2.5,
            fill: this.colorB,
            fillStyle: 'zigzag',
            fillWeight: 1.5
        });

        ctx.restore();
    }
}

class GravityVortex {
    constructor(x, y, strength = 180, radius = 95, color = '#a855f7') {
        this.x = x;
        this.y = y;
        this.strength = strength;
        this.radius = radius;
        this.color = color;
        this.angle = 0;
        this.seed = Math.floor(Math.random() * 1000);
    }

    update(dt, balls) {
        this.angle -= dt * 2.0;

        for (const ball of balls) {
            if (ball.isStuck) continue;
            const dx = this.x - ball.x;
            const dy = this.y - ball.y;
            const dist = Math.hypot(dx, dy);

            if (dist < this.radius && dist > 12) {
                // Orbital / Inward gravitational force
                const force = (1 - dist / this.radius) * this.strength * dt;
                ball.vx += (dx / dist) * force;
                ball.vy += (dy / dist) * force;
                // Add tangential vortex spin
                ball.vx += (-dy / dist) * force * 0.4;
                ball.vy += (dx / dist) * force * 0.4;
                ball.enforceVelocityBounds();
            }
        }
    }

    draw(ctx, rc, theme) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;

        // Concentric swirling spiral lines
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.25) {
            const r = (a / (Math.PI * 4)) * this.radius;
            const px = this.x + Math.cos(a + this.angle) * r;
            const py = this.y + Math.sin(a + this.angle) * r;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.restore();
    }
}

class InteractiveGeometryManager {
    constructor() {
        this.windmills = [];
        this.portals = [];
        this.vortexes = [];
    }

    clear() {
        this.windmills = [];
        this.portals = [];
        this.vortexes = [];
    }

    update(dt, balls) {
        for (const w of this.windmills) w.update(dt);
        for (const p of this.portals) p.update(dt);
        for (const v of this.vortexes) v.update(dt, balls);
    }

    handleBallCollisions(ball) {
        if (ball.isStuck) return;

        // Test Windmills
        for (const w of this.windmills) {
            const hit = w.testCollision(ball);
            if (hit) {
                ball.x += hit.sepX;
                ball.y += hit.sepY;

                // Reflect and transfer rotational momentum
                const dot = ball.vx * hit.normalX + ball.vy * hit.normalY;
                ball.vx = ball.vx - 2 * dot * hit.normalX + hit.rotVx * 0.45;
                ball.vy = ball.vy - 2 * dot * hit.normalY + hit.rotVy * 0.45;

                ball.triggerImpactSquash(hit.normalX, hit.normalY);
                ball.enforceVelocityBounds();
                window.soundEngine?.playWallTick();
                window.particleSystem?.createLaserSparks(hit.contactX, hit.contactY, w.color, 5);
                break;
            }
        }

        // Test Portals
        for (const p of this.portals) {
            p.testTeleport(ball);
        }
    }

    draw(ctx, rc, theme) {
        for (const v of this.vortexes) v.draw(ctx, rc, theme);
        for (const p of this.portals) p.draw(ctx, rc, theme);
        for (const w of this.windmills) w.draw(ctx, rc, theme);
    }
}

window.RotatingWindmill = RotatingWindmill;
window.InkPortal = InkPortal;
window.GravityVortex = GravityVortex;
window.InteractiveGeometryManager = InteractiveGeometryManager;
