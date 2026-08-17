/**
 * Neo-Arkanoid Game Entities
 * Paddle, Ball, Brick, LaserBeam, PowerupCapsule, SafetyNet
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

        // Powerups active on paddle
        this.hasLaser = false;
        this.laserTimer = 0;
        this.laserCooldown = 0;
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
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.hasLaser = false;
        this.laserTimer = 0;
        this.hasWide = false;
        this.wideTimer = 0;
    }

    triggerSquash(impactX = 0) {
        // Vertical compression, horizontal expansion
        this.scaleY = 0.6;
        this.scaleX = 1.35;
        this.springVelY = 0;
        this.springVelX = 0;
    }

    update(dt, inputState) {
        this.prevX = this.x;

        // Smooth follow target X (Mouse or Keyboard)
        const moveSpeed = 16;
        if (inputState.left) {
            this.targetX -= moveSpeed;
        }
        if (inputState.right) {
            this.targetX += moveSpeed;
        }

        // Clamp targetX within canvas boundaries
        this.targetX = Math.max(10, Math.min(this.canvasWidth - this.width - 10, this.targetX));

        // Smooth interpolation
        this.x += (this.targetX - this.x) * 0.35;
        this.vx = this.x - this.prevX;

        // Paddle tilt based on velocity
        const targetTilt = Math.max(-0.12, Math.min(0.12, this.vx * 0.015));
        this.tilt += (targetTilt - this.tilt) * 0.2;

        // Spring physics for squash & stretch
        const k = 0.22; // Spring stiffness
        const damping = 0.72; // Damping factor

        const forceX = (this.targetScaleX - this.scaleX) * k;
        this.springVelX = (this.springVelX + forceX) * damping;
        this.scaleX += this.springVelX;

        const forceY = (this.targetScaleY - this.scaleY) * k;
        this.springVelY = (this.springVelY + forceY) * damping;
        this.scaleY += this.springVelY;

        // Smooth width transition for Wide Powerup
        this.width += (this.targetWidth - this.width) * 0.15;

        // Powerup timers
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

        if (this.hasLaser) {
            this.laserTimer -= dt;
            if (this.laserCooldown > 0) this.laserCooldown -= dt;
            if (this.laserTimer <= 0) {
                this.hasLaser = false;
            }
        }

        // Laser turret recoil recovery
        this.laserTurretRecoilLeft = Math.max(0, this.laserTurretRecoilLeft - dt * 25);
        this.laserTurretRecoilRight = Math.max(0, this.laserTurretRecoilRight - dt * 25);

        // Boiling seed cycle (every ~80ms)
        this.seedTimer += dt;
        if (this.seedTimer > 0.08) {
            this.seedTimer = 0;
            this.seed = (this.seed + 137) % 10000;
        }
    }

    fireLasers() {
        if (!this.hasLaser || this.laserCooldown > 0) return null;
        this.laserCooldown = 0.18; // Fire rate limit
        this.laserTurretRecoilLeft = 6;
        this.laserTurretRecoilRight = 6;
        
        window.soundEngine.playLaserShot();

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

        // Draw main wooden/metallic sketched paddle body
        const paddleFill = this.hasLaser ? '#f43f5e' : (this.hasWide ? '#3b82f6' : theme.paddleFill);
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

        // Draw center jewel / grip ornament
        rc.ellipse(0, 0, 18, 10, {
            seed: this.seed + 1,
            roughness: 1.2,
            stroke: theme.paddleStroke,
            strokeWidth: 1.5,
            fill: '#ffffff',
            fillStyle: 'solid'
        });

        // Draw Laser Turrets if active
        if (this.hasLaser) {
            // Left Turret barrel
            rc.rectangle(-halfW + 4, -halfH - 10 + this.laserTurretRecoilLeft, 6, 12, {
                seed: this.seed + 2,
                roughness: 1.2,
                stroke: '#e11d48',
                strokeWidth: 2,
                fill: '#ffe4e6',
                fillStyle: 'solid'
            });
            // Right Turret barrel
            rc.rectangle(halfW - 10, -halfH - 10 + this.laserTurretRecoilRight, 6, 12, {
                seed: this.seed + 3,
                roughness: 1.2,
                stroke: '#e11d48',
                strokeWidth: 2,
                fill: '#ffe4e6',
                fillStyle: 'solid'
            });
        }

        // Draw Wide Paddle Wing connectors if active
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
        this.baseSpeed = 7.2;
        this.speed = this.baseSpeed;
        
        // If initial velocity is 0, ball is resting on paddle
        this.isStuck = vx === 0 && vy === 0;
        this.vx = vx;
        this.vy = vy;

        this.trail = [];
        this.maxTrail = 6;
        this.seed = Math.floor(Math.random() * 1000);
        this.seedTimer = 0;

        // Powerup states
        this.isFireball = false;
        this.fireballTimer = 0;
        this.isAlive = true;
    }

    launch(angle = -Math.PI / 2) {
        this.isStuck = false;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    setFireball(duration = 10) {
        this.isFireball = true;
        this.fireballTimer = duration;
    }

    update(dt, canvasWidth, canvasHeight, paddle) {
        if (this.isStuck) {
            // Ball rests atop the paddle center
            this.x = paddle.x + paddle.width / 2;
            this.y = paddle.y - this.radius - 2;
            this.speed = this.baseSpeed;
            return;
        }

        // Trail recording
        this.trail.unshift({ x: this.x, y: this.y, alpha: 1.0 });
        if (this.trail.length > this.maxTrail) {
            this.trail.pop();
        }

        // Fireball timer
        if (this.isFireball) {
            this.fireballTimer -= dt;
            if (this.fireballTimer <= 0) {
                this.isFireball = false;
            }
        }

        // Sub-stepping for ultra-precise collision detection at high speeds
        const subSteps = 3;
        const subDt = dt / subSteps;
        const subVx = this.vx / subSteps;
        const subVy = this.vy / subSteps;

        for (let s = 0; s < subSteps; s++) {
            this.x += subVx;
            this.y += subVy;

            // Left Wall bounce
            if (this.x - this.radius <= 0) {
                this.x = this.radius;
                this.vx = Math.abs(this.vx);
                window.soundEngine.playWallTick();
                window.particleSystem.createLaserSparks(this.x, this.y, '#94a3b8', 4);
            }
            // Right Wall bounce
            if (this.x + this.radius >= canvasWidth) {
                this.x = canvasWidth - this.radius;
                this.vx = -Math.abs(this.vx);
                window.soundEngine.playWallTick();
                window.particleSystem.createLaserSparks(this.x, this.y, '#94a3b8', 4);
            }
            // Top Ceiling bounce
            if (this.y - this.radius <= 0) {
                this.y = this.radius;
                this.vy = Math.abs(this.vy);
                window.soundEngine.playWallTick();
                window.particleSystem.createLaserSparks(this.x, this.y, '#94a3b8', 4);
            }
        }

        // Keep speed constant or escalating
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > 0) {
            this.vx = (this.vx / currentSpeed) * this.speed;
            this.vy = (this.vy / currentSpeed) * this.speed;
        }

        // Boiling seed
        this.seedTimer += dt;
        if (this.seedTimer > 0.06) {
            this.seedTimer = 0;
            this.seed = (this.seed + 199) % 10000;
        }

        // Out of bottom bounds
        if (this.y - this.radius > canvasHeight + 20) {
            this.isAlive = false;
        }
    }

    draw(ctx, rc, theme) {
        ctx.save();

        // 1. Draw sketchy motion ghost trails
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const trailAlpha = (1 - i / this.trail.length) * 0.45;
            const r = this.radius * (1 - i / (this.trail.length * 1.5));
            
            ctx.fillStyle = this.isFireball ? `rgba(239, 68, 68, ${trailAlpha})` : theme.ballTrail;
            ctx.beginPath();
            ctx.arc(t.x, t.y, Math.max(1, r), 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Draw Ball Sphere
        const ballColor = this.isFireball ? '#f97316' : theme.ballFill;
        const ballStroke = this.isFireball ? '#ef4444' : theme.ballStroke;

        rc.circle(this.x, this.y, this.radius * 2, {
            seed: this.seed,
            roughness: 1.3,
            bowing: 1.6,
            stroke: ballStroke,
            strokeWidth: 2,
            fill: ballColor,
            fillStyle: this.isFireball ? 'zigzag' : 'solid',
            fillWeight: 2
        });

        // Highlight shine dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

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

        this.hitFlashTimer = 0;
        this.seed = Math.floor(Math.random() * 1000);
        this.crackLines = [];
    }

    takeDamage(dmg = 1) {
        if (this.unbreakable) {
            window.soundEngine.playWallTick();
            return false;
        }

        this.hp -= dmg;
        this.hitFlashTimer = 0.15;

        // Generate hand-drawn crack lines on damage
        if (this.hp > 0 && this.hp < this.maxHp) {
            const crackCount = (this.maxHp - this.hp) * 2;
            this.crackLines = [];
            for (let i = 0; i < crackCount; i++) {
                const sx = this.x + Math.random() * this.width;
                const sy = this.y + Math.random() * this.height;
                const ex = sx + (Math.random() - 0.5) * (this.width * 0.6);
                const ey = sy + (Math.random() - 0.5) * (this.height * 0.6);
                this.crackLines.push({ sx, sy, ex, ey });
            }
        }

        if (this.hp <= 0) {
            this.isAlive = false;
            return true; // Destroyed
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
        const color = isFlashing ? '#ffffff' : this.config.color;
        const strokeColor = isFlashing ? '#ffffff' : this.config.strokeColor;
        const fillStyle = this.config.fillStyle;

        // Golden brick extra shimmer
        let customSeed = this.seed;
        if (this.typeKey === 'GOLD') {
            customSeed = (this.seed + Math.floor(Date.now() / 150)) % 1000;
        }

        // Draw rough hand-drawn brick
        rc.rectangle(this.x, this.y, this.width, this.height, {
            seed: customSeed,
            roughness: 1.5,
            bowing: 1.8,
            stroke: strokeColor,
            strokeWidth: 2,
            fill: color,
            fillStyle: fillStyle,
            fillWeight: 1.6,
            hachureAngle: this.typeKey === 'SAPPHIRE' ? 45 : (this.typeKey === 'RUBY' ? -45 : 30),
            hachureGap: 4
        });

        // Draw crack lines if damaged
        if (this.crackLines.length > 0) {
            ctx.strokeStyle = theme.inkColor;
            ctx.lineWidth = 1.8;
            for (const crack of this.crackLines) {
                rc.line(crack.sx, crack.sy, crack.ex, crack.ey, {
                    seed: customSeed + 20,
                    stroke: theme.inkColor,
                    strokeWidth: 1.6
                });
            }
        }

        // Draw symbol / icon inside special bricks
        if (this.typeKey === 'GOLD') {
            // Golden star icon
            ctx.fillStyle = '#b45309';
            ctx.font = 'bold 12px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', this.x + this.width / 2, this.y + this.height / 2 + 1);
        } else if (this.typeKey === 'RUBY') {
            // Ruby explosion spark symbol
            ctx.fillStyle = '#7f1d1d';
            ctx.font = 'bold 11px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✹', this.x + this.width / 2, this.y + this.height / 2 + 1);
        } else if (this.typeKey === 'OBSIDIAN') {
            // Obsidian lock icon
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('◆', this.x + this.width / 2, this.y + this.height / 2 + 1);
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

        // Visual configs
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
        
        // Sketchy rounded capsule
        rc.ellipse(this.x, this.y, this.width, this.height, {
            seed: this.seed,
            roughness: 1.3,
            stroke: this.info.stroke,
            strokeWidth: 2,
            fill: this.info.color,
            fillStyle: 'solid'
        });

        // Center Icon
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
        window.soundEngine.playTrampolineBounce();
        window.particleSystem.addShake(4, 0.2);
        if (this.uses <= 0) {
            this.isActive = false;
        }
    }

    update(dt) {
        if (!this.isActive) return;
        // Spring bounce physics
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

        // Bouncy criss-cross netting
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
