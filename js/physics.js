/**
 * SKETCHOID Physics Engine & Collision Pipeline
 * SpatialGrid Broadphase, Narrowphase Swept Solvers, Penetration Separation, Near-Miss Detection, and Hit-Stop Manager
 */

class SpatialGrid {
    constructor(worldWidth, worldHeight, cellSize = 64) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        this.cells = new Array(this.cols * this.rows).fill(null).map(() => []);
    }

    clear() {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i].length = 0;
        }
    }

    _getCellIndex(col, row) {
        return row * this.cols + col;
    }

    insert(entity) {
        const minCol = Math.max(0, Math.floor(entity.x / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((entity.x + entity.width) / this.cellSize));
        const minRow = Math.max(0, Math.floor(entity.y / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((entity.y + entity.height) / this.cellSize));

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const idx = this._getCellIndex(c, r);
                this.cells[idx].push(entity);
            }
        }
    }

    queryCircle(x, y, radius) {
        const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

        const candidates = new Set();
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const idx = this._getCellIndex(c, r);
                const cellEntities = this.cells[idx];
                for (let e = 0; e < cellEntities.length; e++) {
                    candidates.add(cellEntities[e]);
                }
            }
        }
        return candidates;
    }
}

class HitStopManager {
    constructor() {
        this.freezeTime = 0;
    }

    trigger(durationMs) {
        this.freezeTime = Math.max(this.freezeTime, durationMs / 1000);
    }

    update(dt) {
        if (this.freezeTime > 0) {
            this.freezeTime -= dt;
            return true; // Is currently frozen
        }
        return false;
    }
}

class NearMissDetector {
    constructor() {
        this.lastNearMissTime = 0;
        this.cooldown = 0.35; // Prevents spamming on consecutive sub-ticks
    }

    testPaddleNearMiss(ball, paddle, timeNow) {
        if (timeNow - this.lastNearMissTime < this.cooldown) return null;
        if (ball.isStuck || ball.vy <= 0) return null;

        // Ball is passing near paddle's top Y plane but just missed the horizontal ends
        const yDist = Math.abs((ball.y + ball.radius) - paddle.y);
        if (yDist < 12) {
            const leftDist = Math.abs(ball.x - paddle.x);
            const rightDist = Math.abs(ball.x - (paddle.x + paddle.width));
            const minEdgeDist = Math.min(leftDist, rightDist);

            if (minEdgeDist > 0 && minEdgeDist <= 22) {
                this.lastNearMissTime = timeNow;
                return {
                    type: 'paddle',
                    x: ball.x,
                    y: paddle.y,
                    edgeDist: minEdgeDist
                };
            }
        }
        return null;
    }

    testBrickCornerNearMiss(ball, brick, timeNow) {
        if (timeNow - this.lastNearMissTime < this.cooldown) return null;
        if (ball.isStuck || !brick.isAlive) return null;

        // 4 Brick Corners
        const corners = [
            { x: brick.x, y: brick.y },
            { x: brick.x + brick.width, y: brick.y },
            { x: brick.x, y: brick.y + brick.height },
            { x: brick.x + brick.width, y: brick.y + brick.height }
        ];

        for (const c of corners) {
            const dist = Math.hypot(ball.x - c.x, ball.y - c.y);
            // Just outside the ball radius threshold
            if (dist > ball.radius && dist <= ball.radius + 5) {
                this.lastNearMissTime = timeNow;
                return {
                    type: 'brick',
                    x: c.x,
                    y: c.y,
                    dist
                };
            }
        }
        return null;
    }
}

class PhysicsWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.spatialGrid = new SpatialGrid(width, height, 64);
        this.hitStop = new HitStopManager();
        this.nearMiss = new NearMissDetector();
        this.onEvent = null; // Callback: (eventType, payload) => {}
    }

    emit(type, payload) {
        if (this.onEvent) {
            this.onEvent(type, payload);
        }
    }

    /**
     * Rebuild broadphase grid with active obstacles
     */
    rebuildGrid(bricks, paddle, safetyNet) {
        this.spatialGrid.clear();
        for (let i = 0; i < bricks.length; i++) {
            const b = bricks[i];
            if (b.isAlive) {
                this.spatialGrid.insert(b);
            }
        }
    }

    /**
     * Run deterministic sub-step collision step
     */
    stepSubPhysics(subDt, balls, paddle, bricks, lasers, powerups, safetyNet, timeNow) {
        this.rebuildGrid(bricks, paddle, safetyNet);

        // 1. Ball vs World & Entities
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            if (ball.isStuck) continue;

            // Ball physics step (wall bounce, spin Magnus curve)
            ball.physicsStep(subDt, this.width, this.height);

            // Ball vs Safety Net Trampoline
            if (safetyNet.isActive && ball.y + ball.radius >= safetyNet.y) {
                ball.y = safetyNet.y - ball.radius;
                ball.vy = -Math.abs(ball.vy);
                ball.enforceVelocityBounds();
                safetyNet.bounce();
                this.emit('safetyNetBounce', { ball });
            }

            // Ball vs Paddle Near-Miss Test
            const paddleNearMiss = this.nearMiss.testPaddleNearMiss(ball, paddle, timeNow);
            if (paddleNearMiss) {
                this.emit('nearMiss', paddleNearMiss);
            }

            // Ball vs Paddle Precision Deflection
            if (ball.vy > 0 &&
                ball.y + ball.radius >= paddle.y &&
                ball.y - ball.radius <= paddle.y + paddle.height &&
                ball.x + ball.radius >= paddle.x &&
                ball.x - ball.radius <= paddle.x + paddle.width) {

                const deflection = paddle.calculateDeflection(ball);
                ball.vx = deflection.vx;
                ball.vy = deflection.vy;
                ball.spin = deflection.spin;
                ball.y = paddle.y - ball.radius - 1;

                ball.triggerImpactSquash(0, -1);
                paddle.triggerSquash(deflection.offset);

                const isEdgeFlick = Math.abs(deflection.offset) > 0.75 && Math.abs(paddle.swingVelocity) > 2.0;

                this.emit('paddleHit', {
                    ball,
                    deflection,
                    isEdgeFlick,
                    swingVelocity: paddle.swingVelocity
                });
            }

            // Ball vs Bricks via SpatialGrid Broadphase
            const candidateBricks = this.spatialGrid.queryCircle(ball.x, ball.y, ball.radius + 6);
            for (const brick of candidateBricks) {
                if (!brick.isAlive) continue;

                // Near-miss corner check
                const cornerNearMiss = this.nearMiss.testBrickCornerNearMiss(ball, brick, timeNow);
                if (cornerNearMiss) {
                    this.emit('nearMiss', cornerNearMiss);
                }

                // Narrowphase Swept Collision
                const hitResult = brick.testCollision(ball);
                if (hitResult) {
                    if (!ball.isFireball) {
                        // Penetration separation
                        ball.x += hitResult.sepX;
                        ball.y += hitResult.sepY;

                        // Velocity reflection across contact normal
                        const dot = ball.vx * hitResult.normalX + ball.vy * hitResult.normalY;
                        ball.vx -= 2 * dot * hitResult.normalX;
                        ball.vy -= 2 * dot * hitResult.normalY;

                        // Spin deflection & English
                        ball.vx += ball.spin * hitResult.normalY * 0.4;
                        ball.vy -= ball.spin * hitResult.normalX * 0.4;

                        ball.triggerImpactSquash(hitResult.normalX, hitResult.normalY);
                        ball.enforceVelocityBounds();
                    }

                    // Damage brick based on ball properties
                    const dmg = ball.isFireball ? 3 : 1;
                    const destroyed = brick.takeDamage(dmg);

                    this.emit('brickHit', {
                        ball,
                        brick,
                        hitResult,
                        destroyed,
                        isFireball: ball.isFireball
                    });
                    break;
                }
            }
        }

        // 2. Lasers vs Bricks
        for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            const candidateBricks = this.spatialGrid.queryCircle(laser.x, laser.y, 16);

            for (const brick of candidateBricks) {
                if (brick.isAlive &&
                    laser.x >= brick.x && laser.x <= brick.x + brick.width &&
                    laser.y >= brick.y && laser.y <= brick.y + brick.height) {

                    laser.isAlive = false;
                    const destroyed = brick.takeDamage(1);
                    this.emit('laserHit', { laser, brick, destroyed });
                    break;
                }
            }
        }

        // 3. Powerups vs Paddle Magnet / Catch
        for (let i = powerups.length - 1; i >= 0; i--) {
            const pow = powerups[i];
            if (pow.x >= paddle.x - 8 && pow.x <= paddle.x + paddle.width + 8 &&
                pow.y >= paddle.y - 12 && pow.y <= paddle.y + paddle.height + 6) {

                pow.isAlive = false;
                this.emit('powerupCollect', { powerup: pow, type: pow.type });
            }
        }
    }
}

window.SpatialGrid = SpatialGrid;
window.HitStopManager = HitStopManager;
window.NearMissDetector = NearMissDetector;
window.PhysicsWorld = PhysicsWorld;
