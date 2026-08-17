/**
 * SKETCHOID Game Entities & Material Destruction Engine (Phase 2 Upgrade)
 * Progressive Brick Damage States (Intact -> Damaged -> Cracked -> Fractured -> Debris),
 * Material Physics (Ruby Chains, Amethyst Armor, Emerald Velocity, Amber Weakpoints),
 * Laser Overheating Gauge, and Reworked Powerups.
 */

class Paddle {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.baseWidth = 110;
        this.width = this.baseWidth;
        this.targetWidth = this.baseWidth;
        this.height = 18;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = canvasHeight - 48;
        this.targetX = this.x;
        this.vx = 0;
        this.prevX = this.x;

        // Swing momentum history buffer
        this.posHistory = [];
        this.swingVelocity = 0;

        // Elastic squash & stretch spring
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.targetScaleX = 1.0;
        this.targetScaleY = 1.0;
        this.springVelX = 0;
        this.springVelY = 0;
        this.tilt = 0;

        // Boiling seed
        this.seed = Math.floor(Math.random() * 1000);
        this.seedTimer = 0;

        // Powerups & Laser Heat Gauge
        this.hasLaser = false;
        this.laserTimer = 0;
        this.laserCooldown = 0;
        this.laserHeat = 0; // 0 to 100
        this.laserOverheated = false;
        this.laserTurretRecoilLeft = 0;
        this.laserTurretRecoilRight = 0;

        this.hasWide = false;
        this.wideTimer = 0;
    }

    reset(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.width = this.baseWidth;
        this.targetWidth = this.baseWidth;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = canvasHeight - 48;
        this.targetX = this.x;
        this.vx = 0;
        this.prevX = this.x;
        this.posHistory = [];
        this.swingVelocity = 0;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.hasLaser = false;
        this.laserTimer = 0;
        this.laserHeat = 0;
        this.laserOverheated = false;
        this.hasWide = false;
        this.wideTimer = 0;
    }

    triggerSquash(impactOffset = 0) {
        this.scaleY = 0.52;
        this.scaleX = 1.42;
        this.springVelY = 0;
        this.springVelX = 0;
        this.tilt += impactOffset * 0.16;
    }

    update(dt, inputState) {
        this.prevX = this.x;

        const keyMoveSpeed = 19;
        if (inputState.left) this.targetX -= keyMoveSpeed;
        if (inputState.right) this.targetX += keyMoveSpeed;

        this.targetX = Math.max(8, Math.min(this.canvasWidth - this.width - 8, this.targetX));
        this.x += (this.targetX - this.x) * 0.44;
        this.vx = this.x - this.prevX;

        // Record swing velocity
        const now = performance.now();
        this.posHistory.push({ x: this.x, time: now });
        if (this.posHistory.length > 5) this.posHistory.shift();

        if (this.posHistory.length >= 2) {
            const oldest = this.posHistory[0];
            const newest = this.posHistory[this.posHistory.length - 1];
            const dtSec = (newest.time - oldest.time) / 1000;
            if (dtSec > 0.001) {
                this.swingVelocity = (newest.x - oldest.x) / (dtSec * 60);
            }
        }

        // Tilt
        const targetTilt = Math.max(-0.16, Math.min(0.16, this.vx * 0.02));
        this.tilt += (targetTilt - this.tilt) * 0.25;

        // Spring
        const k = 0.26;
        const damping = 0.72;
        const forceX = (this.targetScaleX - this.scaleX) * k;
        this.springVelX = (this.springVelX + forceX) * damping;
        this.scaleX += this.springVelX;

        const forceY = (this.targetScaleY - this.scaleY) * k;
        this.springVelY = (this.springVelY + forceY) * damping;
        this.scaleY += this.springVelY;

        // Wide Paddle Width
        this.width += (this.targetWidth - this.width) * 0.16;
        if (this.hasWide) {
            this.wideTimer -= dt;
            this.targetWidth = this.baseWidth * 1.65;
            if (this.wideTimer <= 0) {
                this.hasWide = false;
                this.targetWidth = this.baseWidth;
            }
        } else {
            this.targetWidth = this.baseWidth;
        }

        // Laser Heat & Overheat Management
        if (this.hasLaser) {
            this.laserTimer -= dt;
            if (this.laserCooldown > 0) this.laserCooldown -= dt;
            
            // Heat cooldown
            this.laserHeat = Math.max(0, this.laserHeat - dt * 38);
            if (this.laserOverheated && this.laserHeat <= 20) {
                this.laserOverheated = false;
            }

            if (this.laserTimer <= 0) {
                this.hasLaser = false;
                this.laserHeat = 0;
                this.laserOverheated = false;
            }
        }

        // Recoil
        this.laserTurretRecoilLeft = Math.max(0, this.laserTurretRecoilLeft - dt * 25);
        this.laserTurretRecoilRight = Math.max(0, this.laserTurretRecoilRight - dt * 25);

        // Boiling Seed
        this.seedTimer += dt;
        if (this.seedTimer > 0.08) {
            this.seedTimer = 0;
            this.seed = (this.seed + 137) % 10000;
        }
    }

    calculateDeflection(ball) {
        const paddleCenter = this.x + this.width / 2;
        const rawOffset = (ball.x - paddleCenter) / (this.width / 2);
        const clampedOffset = Math.max(-0.96, Math.min(0.96, rawOffset));

        const baseAngle = -Math.PI / 2 + clampedOffset * 1.15;
        const swingInfluence = Math.max(-4.8, Math.min(4.8, this.swingVelocity * 0.30));
        
        let newVx = Math.cos(baseAngle) * ball.speed + swingInfluence;
        let newVy = Math.sin(baseAngle) * ball.speed;

        const currentSpeed = Math.hypot(newVx, newVy);
        newVx = (newVx / currentSpeed) * ball.speed;
        newVy = (newVy / currentSpeed) * ball.speed;

        let angle = Math.atan2(newVy, newVx);
        const minAngle = -Math.PI * 0.90;
        const maxAngle = -Math.PI * 0.10;
        angle = Math.max(minAngle, Math.min(maxAngle, angle));

        newVx = Math.cos(angle) * ball.speed;
        newVy = Math.sin(angle) * ball.speed;

        const impartedSpin = (swingInfluence * 0.45 + clampedOffset * 0.35);

        return { vx: newVx, vy: newVy, offset: clampedOffset, spin: impartedSpin };
    }

    fireLasers() {
        if (!this.hasLaser || this.laserCooldown > 0 || this.laserOverheated) return null;
        
        this.laserCooldown = 0.15;
        this.laserTurretRecoilLeft = 7;
        this.laserTurretRecoilRight = 7;
        this.laserHeat = Math.min(100, this.laserHeat + 14);

        if (this.laserHeat >= 100) {
            this.laserOverheated = true;
            window.soundEngine?.playWallTick();
        } else {
            window.soundEngine?.playLaserShot();
        }

        const leftX = this.x + 8;
        const rightX = this.x + this.width - 8;
        const beamY = this.y - 4;

        return [
            new LaserBeam(leftX, beamY),
            new LaserBeam(rightX, beamY)
        ];
    }

    draw(ctx, rc, theme) {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(this.tilt);
        ctx.scale(this.scaleX, this.scaleY);

        const w = this.width;
        const h = this.height;
        const halfW = w / 2;
        const halfH = h / 2;

        const paddleFill = this.hasLaser 
            ? (this.laserOverheated ? '#991b1b' : '#f43f5e') 
            : (this.hasWide ? '#3b82f6' : theme.paddleFill);
        const paddleStroke = theme.paddleStroke;

        rc.rectangle(-halfW, -halfH, w, h, {
            seed: this.seed,
            roughness: 1.4,
            bowing: 1.5,
            stroke: paddleStroke,
            strokeWidth: 2.5,
            fill: paddleFill,
            fillStyle: 'zigzag',
            fillWeight: 1.8,
            hachureAngle: -25,
            hachureGap: 5
        });

        // Center grip ornament
        rc.ellipse(0, 0, 18, 10, {
            seed: this.seed + 1,
            roughness: 1.2,
            stroke: theme.paddleStroke,
            strokeWidth: 1.5,
            fill: '#ffffff',
            fillStyle: 'solid'
        });

        // Laser Turrets & Heat Gauge
        if (this.hasLaser) {
            const turretColor = this.laserOverheated ? '#7f1d1d' : '#e11d48';
            rc.rectangle(-halfW + 4, -halfH - 10 + this.laserTurretRecoilLeft, 6, 12, {
                seed: this.seed + 2,
                roughness: 1.2,
                stroke: turretColor,
                strokeWidth: 2,
                fill: this.laserOverheated ? '#fca5a5' : '#ffe4e6',
                fillStyle: 'solid'
            });
            rc.rectangle(halfW - 10, -halfH - 10 + this.laserTurretRecoilRight, 6, 12, {
                seed: this.seed + 3,
                roughness: 1.2,
                stroke: turretColor,
                strokeWidth: 2,
                fill: this.laserOverheated ? '#fca5a5' : '#ffe4e6',
                fillStyle: 'solid'
            });

            // Hand-drawn heat bar
            if (this.laserHeat > 0) {
                const heatWidth = (w * 0.7) * (this.laserHeat / 100);
                rc.line(-w * 0.35, halfH + 4, -w * 0.35 + heatWidth, halfH + 4, {
                    seed: this.seed + 6,
                    stroke: this.laserOverheated ? '#ef4444' : '#fbbf24',
                    strokeWidth: 3
                });
            }
        }

        // Wide Paddle Wings
        if (this.hasWide) {
            rc.line(-halfW, 0, -halfW + 14, 0, {
                seed: this.seed + 4,
                stroke: '#2563eb',
                strokeWidth: 3
            });
            rc.line(halfW - 14, 0, halfW, 0, {
                seed: this.seed + 5,
                stroke: '#2563eb',
                strokeWidth: 3
            });
        }

        ctx.restore();
    }
}

class Ball {
    constructor(x, y, vx = 0, vy = 0) {
        this.radius = 8.5;
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        
        this.baseSpeed = 7.5;
        this.minSpeed = 6.8;
        this.maxSpeed = 15.5;
        this.speed = this.baseSpeed;
        this.minVy = 2.2;
        
        this.spin = 0;
        this.spinDecay = 0.985;

        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.springVelX = 0;
        this.springVelY = 0;

        this.isStuck = vx === 0 && vy === 0;
        this.vx = vx;
        this.vy = vy;

        this.trail = [];
        this.maxTrail = 8;
        this.seed = Math.floor(Math.random() * 1000);
        this.seedTimer = 0;

        this.isFireball = false;
        this.fireballTimer = 0;
        this.isAlive = true;
    }

    launch(angle = -Math.PI / 2) {
        this.isStuck = false;
        this.speed = this.baseSpeed;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.spin = (Math.random() - 0.5) * 0.5;
        this.enforceVelocityBounds();
    }

    setFireball(duration = 10) {
        this.isFireball = true;
        this.fireballTimer = duration;
    }

    triggerImpactSquash(impactNormalX, impactNormalY) {
        if (Math.abs(impactNormalY) > Math.abs(impactNormalX)) {
            this.scaleY = 0.52;
            this.scaleX = 1.38;
        } else {
            this.scaleX = 0.52;
            this.scaleY = 1.38;
        }
        this.springVelX = 0;
        this.springVelY = 0;
    }

    enforceVelocityBounds() {
        if (this.isStuck) return;

        let currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed < this.minSpeed) {
            this.vx = (this.vx / currentSpeed) * this.minSpeed;
            this.vy = (this.vy / currentSpeed) * this.minSpeed;
            currentSpeed = this.minSpeed;
        } else if (currentSpeed > this.maxSpeed) {
            this.vx = (this.vx / currentSpeed) * this.maxSpeed;
            this.vy = (this.vy / currentSpeed) * this.maxSpeed;
            currentSpeed = this.maxSpeed;
        }
        this.speed = currentSpeed;

        if (Math.abs(this.vy) < this.minVy) {
            const signY = this.vy >= 0 ? 1 : -1;
            this.vy = signY * this.minVy;
            const signX = this.vx >= 0 ? 1 : -1;
            this.vx = signX * Math.sqrt(Math.max(0.1, this.speed * this.speed - this.vy * this.vy));
        }
    }

    physicsStep(subDt, canvasWidth, canvasHeight) {
        if (this.isStuck) return;

        this.prevX = this.x;
        this.prevY = this.y;

        this.x += this.vx * subDt * 60 + (this.spin * 0.25);
        this.y += this.vy * subDt * 60;

        this.spin *= this.spinDecay;

        // Boundaries
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.vx = Math.abs(this.vx);
            this.triggerImpactSquash(1, 0);
            window.soundEngine?.playWallTick();
            window.particleSystem?.createLaserSparks(this.x, this.y, '#94a3b8', 4);
        }
        if (this.x + this.radius >= canvasWidth) {
            this.x = canvasWidth - this.radius;
            this.vx = -Math.abs(this.vx);
            this.triggerImpactSquash(-1, 0);
            window.soundEngine?.playWallTick();
            window.particleSystem?.createLaserSparks(this.x, this.y, '#94a3b8', 4);
        }
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy);
            this.triggerImpactSquash(0, 1);
            window.soundEngine?.playWallTick();
            window.particleSystem?.createLaserSparks(this.x, this.y, '#94a3b8', 4);
        }

        this.enforceVelocityBounds();

        if (this.y - this.radius > canvasHeight + 25) {
            this.isAlive = false;
        }
    }

    update(dt, canvasWidth, canvasHeight, paddle) {
        if (this.isStuck) {
            this.x = paddle.x + paddle.width / 2;
            this.y = paddle.y - this.radius - 2;
            this.prevX = this.x;
            this.prevY = this.y;
            this.speed = this.baseSpeed;
            return;
        }

        this.trail.unshift({ x: this.x, y: this.y, alpha: 1.0, speed: this.speed });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        if (this.isFireball) {
            this.fireballTimer -= dt;
            if (this.fireballTimer <= 0) this.isFireball = false;
        }

        const k = 0.28;
        const damping = 0.70;
        const speedStretch = Math.min(1.30, 1.0 + (this.speed - this.baseSpeed) * 0.028);
        const targetSx = 1.0 / speedStretch;
        const targetSy = speedStretch;

        const forceX = (targetSx - this.scaleX) * k;
        this.springVelX = (this.springVelX + forceX) * damping;
        this.scaleX += this.springVelX;

        const forceY = (targetSy - this.scaleY) * k;
        this.springVelY = (this.springVelY + forceY) * damping;
        this.scaleY += this.springVelY;

        this.seedTimer += dt;
        if (this.seedTimer > 0.06) {
            this.seedTimer = 0;
            this.seed = (this.seed + 199) % 10000;
        }
    }

    draw(ctx, rc, theme) {
        ctx.save();

        // Motion Trails
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const trailAlpha = (1 - i / this.trail.length) * 0.45;
            const r = this.radius * (1 - i / (this.trail.length * 1.4));
            
            ctx.fillStyle = this.isFireball ? `rgba(239, 68, 68, ${trailAlpha})` : theme.ballTrail;
            ctx.beginPath();
            ctx.arc(t.x, t.y, Math.max(1, r), 0, Math.PI * 2);
            ctx.fill();
        }

        const flightAngle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        ctx.translate(this.x, this.y);
        ctx.rotate(flightAngle);
        ctx.scale(this.scaleX, this.scaleY);

        const ballColor = this.isFireball ? '#f97316' : theme.ballFill;
        const ballStroke = this.isFireball ? '#ef4444' : theme.ballStroke;
        const ballRadius = this.isFireball ? this.radius * 1.3 : this.radius;

        rc.circle(0, 0, ballRadius * 2, {
            seed: this.seed,
            roughness: 1.3,
            bowing: 1.6,
            stroke: ballStroke,
            strokeWidth: 2,
            fill: ballColor,
            fillStyle: this.isFireball ? 'zigzag' : 'solid',
            fillWeight: 2
        });

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-ballRadius * 0.35, -ballRadius * 0.35, ballRadius * 0.32, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Brick Damage States & Material Physics Engine
 */
class Brick {
    constructor(x, y, width, height, typeKey) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.typeKey = typeKey;
        this.config = window.BRICK_TYPES[typeKey] || window.BRICK_TYPES.EMERALD;

        this.maxHp = this.config.hp;
        this.hp = this.maxHp;
        this.isAlive = true;
        this.score = this.config.score;
        this.isExplosive = !!this.config.isExplosive;
        this.dropsPowerup = !!this.config.dropsPowerup;
        this.unbreakable = !!this.config.unbreakable;

        // Damage State: INTACT (100%), DAMAGED (75%), CRACKED (50%), FRACTURED (25%), DESTROYED (0%)
        this.damageState = 'INTACT';
        this.hitFlashTimer = 0;
        this.seed = Math.floor(Math.random() * 1000);
        this.crackLines = [];
        this.armorPlates = this.typeKey === 'AMETHYST' ? 4 : 0;
    }

    testCollision(ball) {
        if (!this.isAlive) return null;

        const closestX = Math.max(this.x, Math.min(ball.x, this.x + this.width));
        const closestY = Math.max(this.y, Math.min(ball.y, this.y + this.height));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < ball.radius * ball.radius) {
            const dist = Math.sqrt(distSq);
            let normalX = 0;
            let normalY = 0;

            if (dist > 0.0001) {
                normalX = dx / dist;
                normalY = dy / dist;
            } else {
                const overlapLeft = ball.x - this.x;
                const overlapRight = (this.x + this.width) - ball.x;
                const overlapTop = ball.y - this.y;
                const overlapBottom = (this.y + this.height) - ball.y;

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                if (minOverlap === overlapTop) { normalX = 0; normalY = -1; }
                else if (minOverlap === overlapBottom) { normalX = 0; normalY = 1; }
                else if (minOverlap === overlapLeft) { normalX = -1; normalY = 0; }
                else { normalX = 1; normalY = 0; }
            }

            const penetration = ball.radius - dist;
            const sepX = normalX * (penetration + 0.5);
            const sepY = normalY * (penetration + 0.5);

            return {
                hit: true,
                normalX,
                normalY,
                sepX,
                sepY,
                contactX: closestX,
                contactY: closestY
            };
        }
        return null;
    }

    takeDamage(dmg = 1) {
        if (this.unbreakable) {
            window.soundEngine?.playWallTick();
            return false;
        }

        this.hp -= dmg;
        this.hitFlashTimer = 0.16;

        // Update Damage State
        const ratio = this.hp / this.maxHp;
        if (ratio >= 0.75) this.damageState = 'DAMAGED';
        else if (ratio >= 0.50) this.damageState = 'CRACKED';
        else if (ratio > 0) this.damageState = 'FRACTURED';
        else this.damageState = 'DESTROYED';

        if (this.typeKey === 'AMETHYST') {
            this.armorPlates = Math.max(0, this.hp);
        }

        // Generate procedural crack lines based on damage state
        if (this.hp > 0 && this.hp < this.maxHp) {
            const crackCount = (this.maxHp - this.hp) * 3;
            this.crackLines = [];
            for (let i = 0; i < crackCount; i++) {
                const sx = this.x + Math.random() * this.width;
                const sy = this.y + Math.random() * this.height;
                const ex = sx + (Math.random() - 0.5) * (this.width * 0.7);
                const ey = sy + (Math.random() - 0.5) * (this.height * 0.7);
                this.crackLines.push({ sx, sy, ex, ey });
            }
        }

        if (this.hp <= 0) {
            this.isAlive = false;
            return true;
        }
        return false;
    }

    update(dt) {
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
    }

    draw(ctx, rc, theme) {
        if (!this.isAlive) return;

        ctx.save();
        const isFlashing = this.hitFlashTimer > 0;
        let color = isFlashing ? '#ffffff' : this.config.color;
        let strokeColor = isFlashing ? '#ffffff' : this.config.strokeColor;
        let fillStyle = this.config.fillStyle;

        // Shading modifications based on damage state
        if (this.damageState === 'CRACKED') {
            fillStyle = 'cross-hatch';
        } else if (this.damageState === 'FRACTURED') {
            fillStyle = 'zigzag';
        }

        let customSeed = this.seed;
        if (this.typeKey === 'GOLD') {
            customSeed = (this.seed + Math.floor(Date.now() / 150)) % 1000;
        }

        // Draw Brick Body
        rc.rectangle(this.x, this.y, this.width, this.height, {
            seed: customSeed,
            roughness: this.damageState === 'FRACTURED' ? 2.2 : 1.5,
            bowing: 1.8,
            stroke: strokeColor,
            strokeWidth: 2,
            fill: color,
            fillStyle: fillStyle,
            fillWeight: 1.6,
            hachureAngle: this.typeKey === 'SAPPHIRE' ? 45 : (this.typeKey === 'RUBY' ? -45 : 30),
            hachureGap: 4
        });

        // Amethyst Armored Plates Visual
        if (this.typeKey === 'AMETHYST' && this.armorPlates > 0) {
            for (let p = 0; p < this.armorPlates; p++) {
                const px = this.x + 4 + p * (this.width / 4 - 2);
                rc.rectangle(px, this.y + 3, this.width / 4 - 4, this.height - 6, {
                    seed: customSeed + p * 10,
                    roughness: 1.2,
                    stroke: '#581c87',
                    strokeWidth: 1.5,
                    fill: '#c084fc',
                    fillStyle: 'solid'
                });
            }
        }

        // Procedural Crack Overlays
        if (this.crackLines.length > 0) {
            for (const crack of this.crackLines) {
                rc.line(crack.sx, crack.sy, crack.ex, crack.ey, {
                    seed: customSeed + 20,
                    stroke: theme.inkColor,
                    strokeWidth: 1.8
                });
            }
        }

        // Distinct Material Icons
        if (this.typeKey === 'GOLD') {
            ctx.fillStyle = '#b45309';
            ctx.font = 'bold 12px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', this.x + this.width / 2, this.y + this.height / 2 + 1);
        } else if (this.typeKey === 'RUBY') {
            ctx.fillStyle = '#7f1d1d';
            ctx.font = 'bold 11px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✹', this.x + this.width / 2, this.y + this.height / 2 + 1);
        } else if (this.typeKey === 'OBSIDIAN') {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('◆', this.x + this.width / 2, this.y + this.height / 2 + 1);
        } else if (this.typeKey === 'AMBER' && this.damageState !== 'INTACT') {
            ctx.fillStyle = '#78350f';
            ctx.font = 'bold 10px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', this.x + this.width / 2, this.y + this.height / 2 + 1);
        }

        ctx.restore();
    }
}

class LaserBeam {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4.5;
        this.height = 16;
        this.vy = -16;
        this.isAlive = true;
        this.seed = Math.floor(Math.random() * 1000);
    }

    update(dt) {
        this.y += this.vy;
        if (this.y + this.height < 0) {
            this.isAlive = false;
        }
    }

    draw(ctx, rc, theme) {
        if (!this.isAlive) return;
        ctx.save();
        rc.rectangle(this.x - this.width / 2, this.y, this.width, this.height, {
            seed: this.seed,
            roughness: 1.2,
            stroke: '#ff0055',
            strokeWidth: 2,
            fill: '#ff3366',
            fillStyle: 'solid'
        });
        ctx.restore();
    }
}

class PowerupCapsule {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 20;
        this.vy = 2.2;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.time = Math.random() * 10;
        this.isAlive = true;
        this.seed = Math.floor(Math.random() * 1000);

        const types = ['multiball', 'wide', 'laser', 'fireball', 'shield', 'slowmo'];
        this.type = type || types[Math.floor(Math.random() * types.length)];

        const configs = {
            multiball: { name: '3x Multiball', icon: '⚡', color: '#f59e0b', stroke: '#b45309' },
            wide: { name: 'Wide Paddle', icon: '🛡️', color: '#3b82f6', stroke: '#1d4ed8' },
            laser: { name: 'Laser Turrets', icon: '🔫', color: '#ef4444', stroke: '#b91c1c' },
            fireball: { name: 'Fire Meteor', icon: '🔥', color: '#f97316', stroke: '#c2410c' },
            shield: { name: 'Safety Net', icon: '🕸️', color: '#10b981', stroke: '#047857' },
            slowmo: { name: 'Slow Motion', icon: '⏱️', color: '#8b5cf6', stroke: '#6d28d9' }
        };
        this.info = configs[this.type];
    }

    update(dt, canvasHeight) {
        this.time += dt * 3;
        this.y += this.vy;
        this.x += Math.sin(this.time) * 0.8;

        if (this.y > canvasHeight + 30) {
            this.isAlive = false;
        }
    }

    draw(ctx, rc, theme) {
        if (!this.isAlive) return;
        ctx.save();
        
        rc.ellipse(this.x, this.y, this.width, this.height, {
            seed: this.seed,
            roughness: 1.3,
            stroke: this.info.stroke,
            strokeWidth: 2,
            fill: this.info.color,
            fillStyle: 'solid'
        });

        ctx.font = '12px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.info.icon, this.x, this.y);

        ctx.restore();
    }
}

class SafetyNet {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.y = canvasHeight - 12;
        this.isActive = false;
        this.uses = 1;
        this.springY = 0;
        this.springVel = 0;
        this.seed = Math.floor(Math.random() * 1000);
    }

    activate(uses = 1) {
        this.isActive = true;
        this.uses = uses;
    }

    bounce() {
        this.springVel = 12;
        this.uses--;
        window.soundEngine?.playTrampolineBounce();
        window.particleSystem?.addShake(4, 0.2);
        if (this.uses <= 0) {
            this.isActive = false;
        }
    }

    update(dt) {
        if (!this.isActive) return;
        const k = 0.2;
        const damping = 0.8;
        const force = -this.springY * k;
        this.springVel = (this.springVel + force) * damping;
        this.springY += this.springVel;
    }

    draw(ctx, rc, theme) {
        if (!this.isActive) return;
        ctx.save();

        const curY = this.y + this.springY;
        rc.line(0, curY, this.canvasWidth, curY, {
            seed: this.seed,
            roughness: 2.0,
            bowing: 2.5,
            stroke: '#10b981',
            strokeWidth: 4
        });

        for (let x = 20; x < this.canvasWidth; x += 40) {
            rc.line(x - 10, curY + 6, x + 10, curY - 6, {
                seed: this.seed + x,
                stroke: '#047857',
                strokeWidth: 2
            });
        }

        ctx.restore();
    }
}

window.Paddle = Paddle;
window.Ball = Ball;
window.Brick = Brick;
window.LaserBeam = LaserBeam;
window.PowerupCapsule = PowerupCapsule;
window.SafetyNet = SafetyNet;
