/**
 * SKETCHOID Boss Battle Engine: 3 Rule-Altering Bosses
 * 1. ✏️ THE ARCH-PENCIL (Drafts solid lead obstacles & fires graphite darts)
 * 2. 🧼 THE ERASER (Erases bricks mid-air, creates whiteout gaps & rubber dust)
 * 3. 🖋️ THE LIVING INK (Bleeds viscous floor pools that constrict paddle movement)
 */

class ArchPencilBoss {
    constructor(arenaWidth, arenaHeight) {
        this.type = 'pencil';
        this.name = 'THE ARCH-PENCIL';
        this.subtitle = 'The Sentient Drafter';
        this.arenaWidth = arenaWidth;
        this.arenaHeight = arenaHeight;

        this.x = arenaWidth / 2;
        this.y = 110;
        this.targetX = this.x;
        this.targetY = this.y;
        this.vx = 2.2;

        this.width = 65;
        this.height = 100;
        this.tilt = 0;

        this.maxHp = 32;
        this.hp = this.maxHp;
        this.phase = 1;
        this.isAlive = true;
        this.hitFlashTimer = 0;

        this.state = 'PATROL';
        this.draftTimer = 0;
        this.dartTimer = 0;
        this.darts = [];

        this.isDrawing = false;
        this.drawProgress = 0;
        this.drawTargetPos = null;
        this.seed = Math.floor(Math.random() * 1000);
    }

    takeDamage(dmg = 1) {
        if (!this.isAlive) return false;
        this.hp -= dmg;
        this.hitFlashTimer = 0.18;

        const ratio = this.hp / this.maxHp;
        if (ratio <= 0.33) this.phase = 3;
        else if (ratio <= 0.66) this.phase = 2;
        else this.phase = 1;

        if (this.hp <= 0) {
            this.isAlive = false;
            return true;
        }
        return false;
    }

    update(dt, bricks, paddle) {
        if (!this.isAlive) return;

        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

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

            this.draftTimer += dt;
            const draftInterval = this.phase === 3 ? 3.5 : (this.phase === 2 ? 4.5 : 5.8);
            if (this.draftTimer >= draftInterval) {
                this.draftTimer = 0;
                this.startDrafting(bricks);
            }

            if (this.phase >= 2) {
                this.dartTimer += dt;
                const dartInterval = this.phase === 3 ? 1.8 : 2.8;
                if (this.dartTimer >= dartInterval) {
                    this.dartTimer = 0;
                    this.fireGraphiteDarts(paddle);
                }
            }
        } else if (this.state === 'DRAFTING') {
            this.drawProgress += dt * 2.2;
            if (this.drawProgress >= 1.0) {
                this.completeDrafting(bricks);
                this.state = 'PATROL';
            }
        }

        for (let i = this.darts.length - 1; i >= 0; i--) {
            const dart = this.darts[i];
            dart.y += dart.vy * dt * 60;
            dart.x += dart.vx * dt * 60;

            if (dart.x >= paddle.x && dart.x <= paddle.x + paddle.width &&
                dart.y >= paddle.y && dart.y <= paddle.y + paddle.height) {
                paddle.triggerSquash(0);
                window.particleSystem?.createLaserSparks(dart.x, dart.y, '#ef4444', 6);
                window.soundEngine?.playWallTick();
                this.darts.splice(i, 1);
                continue;
            }

            if (dart.y > this.arenaHeight + 20) {
                this.darts.splice(i, 1);
            }
        }
    }

    startDrafting(bricks) {
        const aliveBricks = bricks.filter(b => b.isAlive);
        if (aliveBricks.length >= 24) return;

        this.state = 'DRAFTING';
        this.drawProgress = 0;
        const targetCol = Math.floor(Math.random() * 8);
        const targetRow = 1 + Math.floor(Math.random() * 3);
        const brickW = 68;
        const brickH = 22;
        this.drawTargetPos = {
            x: 60 + targetCol * (brickW + 6),
            y: 160 + targetRow * (brickH + 6),
            w: brickW,
            h: brickH
        };
        window.soundEngine?.playWallTick();
    }

    completeDrafting(bricks) {
        if (!this.drawTargetPos) return;
        const typeKeys = ['OBSIDIAN', 'AMBER', 'SAPPHIRE', 'EMERALD'];
        const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const newBrick = new Brick(this.drawTargetPos.x, this.drawTargetPos.y, this.drawTargetPos.w, this.drawTargetPos.h, typeKey);
        bricks.push(newBrick);

        window.soundEngine?.playBrickChime(10, 'sapphire');
        window.particleSystem?.addFloatingText('✏️ DRAFTED!', this.drawTargetPos.x + this.drawTargetPos.w / 2, this.drawTargetPos.y - 12, '#38bdf8', 1.1, true);
        this.drawTargetPos = null;
    }

    fireGraphiteDarts(paddle) {
        const tipX = this.x;
        const tipY = this.y + this.height / 2;

        const count = Math.min(4, this.phase === 3 ? 3 : 2);
        for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 0.28;
            const angle = Math.PI / 2 + spread;
            const speed = 4.0;
            this.darts.push({
                x: tipX,
                y: tipY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                length: 12
            });
        }
        window.soundEngine?.playLaserShot();
    }

    testCollision(ball) {
        if (!this.isAlive) return null;
        const cx = this.x;
        const cy = this.y;
        const halfW = this.width / 2;
        const halfH = this.height / 2;

        const closestX = Math.max(cx - halfW, Math.min(ball.x, cx + halfW));
        const closestY = Math.max(cy - halfH, Math.min(ball.y, cy + halfH));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < ball.radius * ball.radius) {
            const dist = Math.sqrt(distSq) || 1;
            return {
                hit: true,
                normalX: dx / dist,
                normalY: dy / dist,
                sepX: (dx / dist) * (ball.radius - dist + 1),
                sepY: (dy / dist) * (ball.radius - dist + 1),
                contactX: closestX,
                contactY: closestY
            };
        }
        return null;
    }

    draw(ctx, rc, theme) {
        if (!this.isAlive) return;

        ctx.save();
        const centerX = this.x;
        const centerY = this.y;

        for (const dart of this.darts) {
            ctx.save();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(dart.x, dart.y);
            ctx.lineTo(dart.x - dart.vx * 2.5, dart.y - dart.vy * 2.5);
            ctx.stroke();
            ctx.restore();
        }

        ctx.translate(centerX, centerY);
        ctx.rotate(this.tilt);

        const isFlashing = this.hitFlashTimer > 0;
        const woodColor = isFlashing ? '#ffffff' : '#f59e0b';
        const ferruleColor = isFlashing ? '#ffffff' : '#94a3b8';
        const eraserColor = isFlashing ? '#ffffff' : '#f43f5e';
        const leadColor = isFlashing ? '#ffffff' : '#1e293b';

        const halfW = this.width / 2;
        const halfH = this.height / 2;

        rc.rectangle(-halfW, -halfH + 20, this.width, this.height - 45, {
            seed: this.seed,
            roughness: 1.2,
            stroke: theme.borderStroke,
            strokeWidth: 2.2,
            fill: woodColor,
            fillStyle: 'solid'
        });

        rc.rectangle(-halfW, -halfH, this.width, 18, {
            seed: this.seed + 10,
            roughness: 1.1,
            stroke: theme.borderStroke,
            strokeWidth: 2,
            fill: eraserColor,
            fillStyle: 'solid'
        });

        rc.rectangle(-halfW, -halfH + 18, this.width, 10, {
            seed: this.seed + 20,
            roughness: 1.0,
            stroke: theme.borderStroke,
            strokeWidth: 1.8,
            fill: ferruleColor,
            fillStyle: 'solid'
        });

        const tipY = halfH;
        const coneTopY = halfH - 25;
        rc.polygon([
            [-halfW, coneTopY],
            [halfW, coneTopY],
            [0, tipY]
        ], {
            seed: this.seed + 30,
            roughness: 1.2,
            stroke: theme.borderStroke,
            strokeWidth: 2,
            fill: '#fde68a',
            fillStyle: 'solid'
        });

        rc.polygon([
            [-8, tipY - 10],
            [8, tipY - 10],
            [0, tipY]
        ], {
            seed: this.seed + 40,
            roughness: 1.0,
            stroke: theme.borderStroke,
            strokeWidth: 2,
            fill: leadColor,
            fillStyle: 'solid'
        });

        ctx.restore();

        this.drawBossHpBar(ctx, rc, theme);
    }

    drawBossHpBar(ctx, rc, theme) {
        ctx.save();
        const barW = 240;
        const barH = 14;
        const barX = this.arenaWidth / 2 - barW / 2;
        const barY = 22;

        ctx.font = 'bold 11px Fredoka, cursive';
        ctx.fillStyle = theme.inkColor;
        ctx.textAlign = 'center';
        ctx.fillText(`✏️ ${this.name} (PHASE ${this.phase})`, this.arenaWidth / 2, barY - 6);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = theme.borderStroke;
        ctx.strokeRect(barX, barY, barW, barH);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        const fillW = (barW - 4) * hpRatio;
        ctx.fillStyle = this.phase === 3 ? '#ef4444' : (this.phase === 2 ? '#f59e0b' : '#10b981');
        ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);

        ctx.restore();
    }
}

class EraserBoss {
    constructor(arenaWidth, arenaHeight) {
        this.type = 'eraser';
        this.name = 'THE ERASER';
        this.subtitle = 'The Void Rub-Out';
        this.arenaWidth = arenaWidth;
        this.arenaHeight = arenaHeight;

        this.x = arenaWidth / 2;
        this.y = 110;
        this.vx = 2.8;

        this.width = 85;
        this.height = 45;
        this.tilt = 0;

        this.maxHp = 28;
        this.hp = this.maxHp;
        this.phase = 1;
        this.isAlive = true;
        this.hitFlashTimer = 0;

        this.eraseTimer = 0;
        this.eraseInterval = 4.5; // Erases random bricks every 4.5s
        this.erasedZones = []; // Whiteout zones where bricks were rubbed out
        this.seed = Math.floor(Math.random() * 1000);
    }

    takeDamage(dmg = 1) {
        if (!this.isAlive) return false;
        this.hp -= dmg;
        this.hitFlashTimer = 0.18;

        const ratio = this.hp / this.maxHp;
        if (ratio <= 0.33) this.phase = 3;
        else if (ratio <= 0.66) this.phase = 2;
        else this.phase = 1;

        if (this.hp <= 0) {
            this.isAlive = false;
            return true;
        }
        return false;
    }

    update(dt, bricks, paddle) {
        if (!this.isAlive) return;

        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        this.x += this.vx;
        if (this.x - this.width / 2 <= 60) {
            this.x = 60 + this.width / 2;
            this.vx = Math.abs(this.vx);
        } else if (this.x + this.width / 2 >= this.arenaWidth - 60) {
            this.x = this.arenaWidth - 60 - this.width / 2;
            this.vx = -Math.abs(this.vx);
        }
        this.tilt = Math.sin(Date.now() / 250) * 0.18;

        // Erase Attack: Rubs out bricks mid-flight
        this.eraseTimer += dt;
        const currentInterval = this.phase === 3 ? 3.0 : 4.5;
        if (this.eraseTimer >= currentInterval) {
            this.eraseTimer = 0;
            this.performEraseAttack(bricks);
        }

        // Decay erased whiteout zones
        for (let i = this.erasedZones.length - 1; i >= 0; i--) {
            const z = this.erasedZones[i];
            z.alpha -= dt * 0.25;
            if (z.alpha <= 0) this.erasedZones.splice(i, 1);
        }
    }

    performEraseAttack(bricks) {
        const aliveDestructible = bricks.filter(b => b.isAlive && !b.unbreakable);
        if (aliveDestructible.length === 0) return;

        // Pick 2-3 random bricks to erase
        const count = Math.min(aliveDestructible.length, this.phase === 3 ? 3 : 2);
        for (let i = 0; i < count; i++) {
            const target = aliveDestructible[Math.floor(Math.random() * aliveDestructible.length)];
            target.isAlive = false;

            this.erasedZones.push({
                x: target.x,
                y: target.y,
                w: target.width,
                h: target.height,
                alpha: 1.0
            });

            window.particleSystem?.addFloatingText('🧼 ERASED!', target.x + target.width / 2, target.y, '#f43f5e', 1.2, true);
        }
        window.soundEngine?.playWallTick();
    }

    testCollision(ball) {
        if (!this.isAlive) return null;
        const cx = this.x;
        const cy = this.y;
        const halfW = this.width / 2;
        const halfH = this.height / 2;

        const closestX = Math.max(cx - halfW, Math.min(ball.x, cx + halfW));
        const closestY = Math.max(cy - halfH, Math.min(ball.y, cy + halfH));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < ball.radius * ball.radius) {
            const dist = Math.sqrt(distSq) || 1;
            return {
                hit: true,
                normalX: dx / dist,
                normalY: dy / dist,
                sepX: (dx / dist) * (ball.radius - dist + 1),
                sepY: (dy / dist) * (ball.radius - dist + 1),
                contactX: closestX,
                contactY: closestY
            };
        }
        return null;
    }

    draw(ctx, rc, theme) {
        if (!this.isAlive) return;

        ctx.save();

        // Draw whiteout erasure marks on canvas
        for (const ez of this.erasedZones) {
            ctx.save();
            ctx.fillStyle = theme.bgDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.75)';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = ez.alpha;
            ctx.fillRect(ez.x, ez.y, ez.w, ez.h);
            ctx.strokeRect(ez.x, ez.y, ez.w, ez.h);
            ctx.restore();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.tilt);

        const isFlashing = this.hitFlashTimer > 0;
        const pinkColor = isFlashing ? '#ffffff' : '#fb7185';
        const blueColor = isFlashing ? '#ffffff' : '#38bdf8';

        const halfW = this.width / 2;
        const halfH = this.height / 2;

        // Slanted dual-tone pink/blue rubber eraser block
        rc.rectangle(-halfW, -halfH, halfW, this.height, {
            seed: this.seed,
            roughness: 1.2,
            stroke: theme.borderStroke,
            strokeWidth: 2.2,
            fill: pinkColor,
            fillStyle: 'solid'
        });

        rc.rectangle(0, -halfH, halfW, this.height, {
            seed: this.seed + 10,
            roughness: 1.2,
            stroke: theme.borderStroke,
            strokeWidth: 2.2,
            fill: blueColor,
            fillStyle: 'solid'
        });

        ctx.restore();

        this.drawBossHpBar(ctx, rc, theme);
    }

    drawBossHpBar(ctx, rc, theme) {
        ctx.save();
        const barW = 240;
        const barH = 14;
        const barX = this.arenaWidth / 2 - barW / 2;
        const barY = 22;

        ctx.font = 'bold 11px Fredoka, cursive';
        ctx.fillStyle = theme.inkColor;
        ctx.textAlign = 'center';
        ctx.fillText(`🧼 ${this.name} (PHASE ${this.phase})`, this.arenaWidth / 2, barY - 6);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = theme.borderStroke;
        ctx.strokeRect(barX, barY, barW, barH);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        const fillW = (barW - 4) * hpRatio;
        ctx.fillStyle = this.phase === 3 ? '#ef4444' : '#fb7185';
        ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);

        ctx.restore();
    }
}

class LivingInkBoss {
    constructor(arenaWidth, arenaHeight) {
        this.type = 'ink';
        this.name = 'THE LIVING INK';
        this.subtitle = 'Viscous Floor Reservoir';
        this.arenaWidth = arenaWidth;
        this.arenaHeight = arenaHeight;

        this.x = arenaWidth / 2;
        this.y = 110;
        this.vx = 2.0;

        this.width = 75;
        this.height = 75;
        this.tilt = 0;

        this.maxHp = 30;
        this.hp = this.maxHp;
        this.phase = 1;
        this.isAlive = true;
        this.hitFlashTimer = 0;

        this.puddleTimer = 0;
        this.puddles = []; // Viscous ink floor puddles
        this.seed = Math.floor(Math.random() * 1000);
    }

    takeDamage(dmg = 1) {
        if (!this.isAlive) return false;
        this.hp -= dmg;
        this.hitFlashTimer = 0.18;

        const ratio = this.hp / this.maxHp;
        if (ratio <= 0.33) this.phase = 3;
        else if (ratio <= 0.66) this.phase = 2;
        else this.phase = 1;

        if (this.hp <= 0) {
            this.isAlive = false;
            return true;
        }
        return false;
    }

    update(dt, bricks, paddle) {
        if (!this.isAlive) return;

        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        this.x += this.vx;
        if (this.x - this.width / 2 <= 70) {
            this.x = 70 + this.width / 2;
            this.vx = Math.abs(this.vx);
        } else if (this.x + this.width / 2 >= this.arenaWidth - 70) {
            this.x = this.arenaWidth - 70 - this.width / 2;
            this.vx = -Math.abs(this.vx);
        }
        this.tilt = Math.sin(Date.now() / 300) * 0.14;

        // Bleed Ink Puddle onto the bottom floor
        this.puddleTimer += dt;
        const puddleInterval = this.phase === 3 ? 3.2 : 5.0;
        if (this.puddleTimer >= puddleInterval) {
            this.puddleTimer = 0;
            this.spawnInkPuddle();
        }

        // Check if paddle is inside any puddle to slow paddle movement
        for (let i = this.puddles.length - 1; i >= 0; i--) {
            const p = this.puddles[i];
            p.duration -= dt;
            if (p.duration <= 0) {
                this.puddles.splice(i, 1);
                continue;
            }

            // Paddle overlap
            if (paddle.x + paddle.width > p.x - p.radius && paddle.x < p.x + p.radius) {
                paddle.targetX += (Math.random() - 0.5) * 1.5; // Viscous friction
            }
        }
    }

    spawnInkPuddle() {
        if (this.puddles.length >= 4) this.puddles.shift();
        const px = 100 + Math.random() * (this.arenaWidth - 200);
        this.puddles.push({
            x: px,
            y: this.arenaHeight - 50,
            radius: 45 + Math.random() * 20,
            duration: 8.0
        });
        window.soundEngine?.playWallTick();
        window.particleSystem?.addFloatingText('🖋️ INK BLEED!', px, this.arenaHeight - 80, '#a855f7', 1.2, true);
    }

    testCollision(ball) {
        if (!this.isAlive) return null;
        const cx = this.x;
        const cy = this.y;
        const radius = this.width / 2;

        const dx = ball.x - cx;
        const dy = ball.y - cy;
        const distSq = dx * dx + dy * dy;

        if (distSq < (radius + ball.radius) * (radius + ball.radius)) {
            const dist = Math.sqrt(distSq) || 1;
            return {
                hit: true,
                normalX: dx / dist,
                normalY: dy / dist,
                sepX: (dx / dist) * (radius + ball.radius - dist + 1),
                sepY: (dy / dist) * (radius + ball.radius - dist + 1),
                contactX: cx + (dx / dist) * radius,
                contactY: cy + (dy / dist) * radius
            };
        }
        return null;
    }

    draw(ctx, rc, theme) {
        if (!this.isAlive) return;

        ctx.save();

        // Draw floor ink puddles
        for (const p of this.puddles) {
            ctx.save();
            ctx.fillStyle = theme.bgDark ? 'rgba(168, 85, 247, 0.40)' : 'rgba(88, 28, 135, 0.35)';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.tilt);

        const isFlashing = this.hitFlashTimer > 0;
        const bottleColor = isFlashing ? '#ffffff' : '#3b82f6';
        const inkColor = isFlashing ? '#ffffff' : '#1e1b4b';

        // Ink Bottle Glass & Droplet
        rc.rectangle(-25, -25, 50, 50, {
            seed: this.seed,
            roughness: 1.3,
            stroke: theme.borderStroke,
            strokeWidth: 2.2,
            fill: bottleColor,
            fillStyle: 'solid'
        });

        rc.circle(0, 0, 30, {
            seed: this.seed + 10,
            roughness: 1.4,
            stroke: '#a855f7',
            strokeWidth: 2.5,
            fill: inkColor,
            fillStyle: 'zigzag'
        });

        ctx.restore();

        this.drawBossHpBar(ctx, rc, theme);
    }

    drawBossHpBar(ctx, rc, theme) {
        ctx.save();
        const barW = 240;
        const barH = 14;
        const barX = this.arenaWidth / 2 - barW / 2;
        const barY = 22;

        ctx.font = 'bold 11px Fredoka, cursive';
        ctx.fillStyle = theme.inkColor;
        ctx.textAlign = 'center';
        ctx.fillText(`🖋️ ${this.name} (PHASE ${this.phase})`, this.arenaWidth / 2, barY - 6);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = theme.borderStroke;
        ctx.strokeRect(barX, barY, barW, barH);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        const fillW = (barW - 4) * hpRatio;
        ctx.fillStyle = this.phase === 3 ? '#ef4444' : '#a855f7';
        ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);

        ctx.restore();
    }
}

window.ArchPencilBoss = ArchPencilBoss;
window.EraserBoss = EraserBoss;
window.LivingInkBoss = LivingInkBoss;
