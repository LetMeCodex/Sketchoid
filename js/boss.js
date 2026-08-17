/**
 * SKETCHOID Boss Battle Engine: ✏️ THE ARCH-PENCIL (The Living Drafter)
 * Multi-phase Sentient Boss that live-drafts new physical geometry into the arena,
 * fires graphite darts, and features a pencil-body HP bar.
 */

class ArchPencilBoss {
    constructor(arenaWidth, arenaHeight) {
        this.arenaWidth = arenaWidth;
        this.arenaHeight = arenaHeight;

        this.x = arenaWidth / 2;
        this.y = 110;
        this.targetX = this.x;
        this.targetY = this.y;
        this.vx = 2.2;

        this.width = 65;
        this.height = 100;
        this.angle = 0.15; // Slanted drafting angle
        this.tilt = 0;

        // Health: 36 HP
        this.maxHp = 36;
        this.hp = this.maxHp;
        this.phase = 1; // 1: 100-66%, 2: 66-33%, 3: 33-0% (Frenzy)
        this.isAlive = true;
        this.hitFlashTimer = 0;

        // AI Behaviors & Attack Timers
        this.state = 'PATROL'; // PATROL, DRAFTING, ATTACKING
        this.draftTimer = 0;
        this.draftCooldown = 5.5; // Drafts new bricks every 5.5 seconds
        this.dartTimer = 0;
        this.dartCooldown = 3.0;

        // Active Graphite Projectiles
        this.darts = [];

        // Drafting animation state
        this.isDrawing = false;
        this.drawProgress = 0;
        this.drawTargetPos = null;

        this.seed = Math.floor(Math.random() * 1000);
    }

    takeDamage(dmg = 1) {
        if (!this.isAlive) return false;

        this.hp -= dmg;
        this.hitFlashTimer = 0.18;

        // Update Phase
        const ratio = this.hp / this.maxHp;
        if (ratio <= 0.33) this.phase = 3;
        else if (ratio <= 0.66) this.phase = 2;
        else this.phase = 1;

        if (this.hp <= 0) {
            this.isAlive = false;
            return true; // Boss defeated!
        }
        return false;
    }

    update(dt, bricks, paddle) {
        if (!this.isAlive) return;

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        // Float / Patrol across top arena
        if (this.state === 'PATROL') {
            this.x += this.vx;
            if (this.x - this.width / 2 <= 70) {
                this.x = 70 + this.width / 2;
                this.vx = Math.abs(this.vx);
            } else if (this.x + this.width / 2 >= this.arenaWidth - 70) {
                this.x = this.arenaWidth - 70 - this.width / 2;
                this.vx = -Math.abs(this.vx);
            }
            this.tilt = Math.sin(Date.now() / 400) * 0.12;

            // Live Drafting Attack Timer
            this.draftTimer += dt;
            const draftInterval = this.phase === 3 ? 3.5 : (this.phase === 2 ? 4.5 : 5.8);
            if (this.draftTimer >= draftInterval) {
                this.draftTimer = 0;
                this.startDrafting(bricks);
            }

            // Graphite Dart Attack Timer (Phase 2 & 3)
            if (this.phase >= 2) {
                this.dartTimer += dt;
                const dartInterval = this.phase === 3 ? 1.8 : 2.8;
                if (this.dartTimer >= dartInterval) {
                    this.dartTimer = 0;
                    this.fireGraphiteDarts(paddle);
                }
            }
        } else if (this.state === 'DRAFTING') {
            // Move tip to drafting location
            this.drawProgress += dt * 2.2;
            if (this.drawProgress >= 1.0) {
                this.completeDrafting(bricks);
                this.state = 'PATROL';
            }
        }

        // Update Projectiles
        for (let i = this.darts.length - 1; i >= 0; i--) {
            const dart = this.darts[i];
            dart.y += dart.vy * dt * 60;
            dart.x += dart.vx * dt * 60;

            // Check collision with paddle
            if (dart.x >= paddle.x && dart.x <= paddle.x + paddle.width &&
                dart.y >= paddle.y && dart.y <= paddle.y + paddle.height) {
                
                this.darts.splice(i, 1);
                window.soundEngine?.playWallTick();
                window.particleSystem?.createLaserSparks(dart.x, dart.y, '#f59e0b', 8);
                window.particleSystem?.addShake(3, 0.15);
                continue;
            }

            if (dart.y > this.arenaHeight + 20) {
                this.darts.splice(i, 1);
            }
        }
    }

    startDrafting(bricks) {
        // Find an empty slot in the upper grid to draw a fresh brick
        const deadBricks = bricks.filter(b => !b.isAlive);
        if (deadBricks.length > 0) {
            const targetBrick = deadBricks[Math.floor(Math.random() * deadBricks.length)];
            this.drawTargetPos = targetBrick;
            this.drawProgress = 0;
            this.state = 'DRAFTING';
            window.soundEngine?.playPowerupSpawn();
        }
    }

    completeDrafting(bricks) {
        if (this.drawTargetPos) {
            this.drawTargetPos.isAlive = true;
            this.drawTargetPos.hp = 1;
            this.drawTargetPos.damageState = 'INTACT';
            this.drawTargetPos.typeKey = this.phase === 3 ? 'AMBER' : 'EMERALD';
            this.drawTargetPos.config = window.BRICK_TYPES[this.drawTargetPos.typeKey];
            
            window.particleSystem?.createBrickExplosion(
                this.drawTargetPos.x, this.drawTargetPos.y,
                this.drawTargetPos.width, this.drawTargetPos.height,
                this.drawTargetPos.config.color, this.drawTargetPos.config.id, 6
            );
            window.particleSystem?.addFloatingText('✏️ DRAFTED!', this.drawTargetPos.x + this.drawTargetPos.width / 2, this.drawTargetPos.y - 12, '#fbbf24', 1.1, true);
        }
        this.drawTargetPos = null;
    }

    fireGraphiteDarts(paddle) {
        window.soundEngine?.playLaserShot();
        const numDarts = this.phase === 3 ? 3 : 2;
        for (let i = 0; i < numDarts; i++) {
            const angle = Math.PI / 2 + (i - (numDarts - 1) / 2) * 0.35;
            this.darts.push({
                x: this.x,
                y: this.y + 35,
                vx: Math.cos(angle) * 3.8,
                vy: Math.sin(angle) * 4.2,
                length: 12
            });
        }
    }

    testCollision(ball) {
        if (!this.isAlive || ball.isStuck) return null;

        // Bounding box for pencil core
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const closestX = Math.max(this.x - halfW, Math.min(ball.x, this.x + halfW));
        const closestY = Math.max(this.y - halfH, Math.min(ball.y, this.y + halfH));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < ball.radius * ball.radius) {
            const dist = Math.sqrt(distSq) || 0.001;
            const normalX = dx / dist;
            const normalY = dy / dist;

            const sepX = normalX * (ball.radius - dist + 0.5);
            const sepY = normalY * (ball.radius - dist + 0.5);

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

    draw(ctx, rc, theme) {
        if (!this.isAlive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + this.tilt);

        const isFlashing = this.hitFlashTimer > 0;
        const bodyColor = isFlashing ? '#ffffff' : (this.phase === 3 ? '#ea580c' : '#fbbf24');
        const strokeColor = isFlashing ? '#ffffff' : '#451a03';

        // 1. Pink Rubber Eraser Top
        rc.rectangle(-18, -48, 36, 20, {
            seed: this.seed,
            roughness: 1.2,
            stroke: strokeColor,
            strokeWidth: 2,
            fill: '#f472b6',
            fillStyle: 'solid'
        });

        // 2. Brass Gold Ferrule Band
        rc.rectangle(-19, -28, 38, 12, {
            seed: this.seed + 1,
            roughness: 1.1,
            stroke: strokeColor,
            strokeWidth: 2,
            fill: '#ca8a04',
            fillStyle: 'solid'
        });

        // 3. Hexagonal Yellow Wooden Pencil Body
        rc.rectangle(-18, -16, 36, 50, {
            seed: this.seed + 2,
            roughness: 1.3,
            stroke: strokeColor,
            strokeWidth: 2.2,
            fill: bodyColor,
            fillStyle: 'solid'
        });

        // HB #2 Pencil Stamp Logo
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 9px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HB • ARCH', 0, 10);

        // 4. Sharpened Wooden Cone Tip
        rc.polygon([[-18, 34], [18, 34], [0, 58]], {
            seed: this.seed + 3,
            roughness: 1.3,
            stroke: strokeColor,
            strokeWidth: 2,
            fill: '#fed7aa',
            fillStyle: 'solid'
        });

        // 5. Dark Graphite Lead Tip
        rc.polygon([[-7, 46], [7, 46], [0, 58]], {
            seed: this.seed + 4,
            roughness: 1.1,
            stroke: '#0f172a',
            strokeWidth: 1.5,
            fill: '#0f172a',
            fillStyle: 'solid'
        });

        ctx.restore();

        // Draw Live Drafting Line
        if (this.state === 'DRAFTING' && this.drawTargetPos) {
            ctx.save();
            rc.line(this.x, this.y + 40, this.drawTargetPos.x + this.drawTargetPos.width / 2, this.drawTargetPos.y + this.drawTargetPos.height / 2, {
                seed: this.seed + 50,
                stroke: '#fbbf24',
                strokeWidth: 2.5
            });
            ctx.restore();
        }

        // Draw Graphite Darts
        for (const dart of this.darts) {
            ctx.save();
            rc.line(dart.x, dart.y, dart.x - dart.vx * 2, dart.y - dart.vy * 2, {
                seed: this.seed + 9,
                stroke: '#0f172a',
                strokeWidth: 3
            });
            ctx.restore();
        }

        // Draw Boss Pencil Health Bar at Top
        this.drawHealthBar(ctx, rc, theme);
    }

    drawHealthBar(ctx, rc, theme) {
        ctx.save();
        const barWidth = 320;
        const barHeight = 16;
        const barX = this.arenaWidth / 2 - barWidth / 2;
        const barY = 48;

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        const currentFillW = barWidth * hpRatio;

        // Background Bar
        rc.rectangle(barX, barY, barWidth, barHeight, {
            seed: this.seed + 10,
            roughness: 1.1,
            stroke: theme.borderStroke,
            strokeWidth: 2,
            fill: 'rgba(0, 0, 0, 0.4)',
            fillStyle: 'solid'
        });

        // Yellow Pencil HP Fill
        if (currentFillW > 0) {
            rc.rectangle(barX, barY, currentFillW, barHeight, {
                seed: this.seed + 11,
                roughness: 1.2,
                stroke: 'none',
                fill: this.phase === 3 ? '#ef4444' : '#fbbf24',
                fillStyle: 'solid'
            });
        }

        // Boss Title Badge
        ctx.fillStyle = theme.inkColor;
        ctx.font = 'bold 11px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✏️ THE ARCH-PENCIL [PHASE ${this.phase}]`, this.arenaWidth / 2, barY - 10);

        ctx.restore();
    }
}

window.ArchPencilBoss = ArchPencilBoss;
