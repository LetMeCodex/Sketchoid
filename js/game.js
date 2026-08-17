/**
 * SKETCHOID Main Game Engine & Controller (Phase 3 Full Universe)
 * Living Sketchbook Renderer, Dynamic Stage Evolution, Page Turn Mutation,
 * Interactive Geometry, Boss Battles (Arch-Pencil), Challenges, and Collection Unlocks
 */

const THEMES = {
    parchment: {
        id: 'parchment',
        name: 'Vintage Parchment',
        bg: '#faf6ee',
        inkColor: '#292524',
        gridColor: 'rgba(120, 113, 108, 0.15)',
        borderStroke: '#44403c',
        paddleStroke: '#1c1917',
        paddleFill: '#e7e5e4',
        ballStroke: '#0c0a09',
        ballFill: '#fef08a',
        ballTrail: 'rgba(234, 179, 8, 0.35)',
        bgDark: false
    },
    blueprint: {
        id: 'blueprint',
        name: 'Dark Blueprint',
        bg: '#0f172a',
        inkColor: '#f8fafc',
        gridColor: 'rgba(56, 189, 248, 0.16)',
        borderStroke: '#38bdf8',
        paddleStroke: '#38bdf8',
        paddleFill: '#0284c7',
        ballStroke: '#ffffff',
        ballFill: '#38bdf8',
        ballTrail: 'rgba(56, 189, 248, 0.45)',
        bgDark: true
    },
    neon: {
        id: 'neon',
        name: 'Neon Chalkboard',
        bg: '#18181b',
        inkColor: '#fafafa',
        gridColor: 'rgba(244, 63, 94, 0.12)',
        borderStroke: '#f43f5e',
        paddleStroke: '#f43f5e',
        paddleFill: '#fb7185',
        ballStroke: '#38bdf8',
        ballFill: '#a7f3d0',
        ballTrail: 'rgba(52, 211, 153, 0.45)',
        bgDark: true
    }
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        try {
            if (typeof rough !== 'undefined' && rough.canvas) {
                this.rc = rough.canvas(this.canvas);
            } else if (typeof window.rough !== 'undefined' && window.rough.canvas) {
                this.rc = window.rough.canvas(this.canvas);
            } else {
                console.warn('Rough.js not found, using fallback renderer');
                this.rc = this.createFallbackRenderer();
            }
        } catch (e) {
            console.error('Error initializing Rough.js:', e);
            this.rc = this.createFallbackRenderer();
        }

        this.width = 800;
        this.height = 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.currentThemeKey = 'blueprint';
        this.theme = THEMES[this.currentThemeKey];

        // Decoupled Phase 3 Engines
        this.camera = new Camera2D(this.width, this.height);
        this.physicsWorld = new PhysicsWorld(this.width, this.height);
        this.sketchbook = new SketchbookWorld(this.width, this.height);
        this.geometryManager = new InteractiveGeometryManager();
        this.boss = null;

        this.setupPhysicsEventBus();

        // Game State
        this.state = 'MENU';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('sketchoid_highscore') || localStorage.getItem('neo_arkanoid_highscore') || '0', 10);
        this.lives = 3;
        this.maxLives = 5;
        this.levelIndex = 0;
        this.currentLevel = null;
        this.isEndless = false;

        // Combo 2.0 & Style Scoring Engine
        this.comboStreak = 0;
        this.maxComboStreak = 0;
        this.comboMultiplier = 1;
        this.lastHitTime = 0;
        this.isCrystalFrenzy = false;
        this.crystalFrenzyTimer = 0;

        // Entities
        this.paddle = new Paddle(this.width, this.height);
        this.balls = [];
        this.bricks = [];
        this.lasers = [];
        this.powerups = [];
        this.safetyNet = new SafetyNet(this.width, this.height);

        // Input
        this.inputState = {
            left: false,
            right: false,
            space: false,
            mouseX: this.width / 2,
            isUsingMouse: true
        };

        // Time Dilation & Chrono SlowMo
        this.slowmoTimer = 0;
        this.timeScale = 1.0;

        // Frame timing & fixed sub-stepping accumulator
        this.lastTime = performance.now();
        this.fixedTimeStep = 1 / 120;

        // Initial preview load
        this.loadLevel(0);

        this.setupEventListeners();
        this.updateHUD();
    }

    createFallbackRenderer() {
        const ctx = this.ctx;
        return {
            rectangle: (x, y, w, h, opts = {}) => {
                ctx.save();
                if (opts.fill) {
                    ctx.fillStyle = opts.fill;
                    ctx.fillRect(x, y, w, h);
                }
                ctx.strokeStyle = opts.stroke || '#fff';
                ctx.lineWidth = opts.strokeWidth || 2;
                ctx.strokeRect(x, y, w, h);
                ctx.restore();
            },
            circle: (x, y, d, opts = {}) => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, d / 2, 0, Math.PI * 2);
                if (opts.fill) {
                    ctx.fillStyle = opts.fill;
                    ctx.fill();
                }
                ctx.strokeStyle = opts.stroke || '#fff';
                ctx.lineWidth = opts.strokeWidth || 2;
                ctx.stroke();
                ctx.restore();
            },
            ellipse: (x, y, w, h, opts = {}) => {
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
                if (opts.fill) {
                    ctx.fillStyle = opts.fill;
                    ctx.fill();
                }
                ctx.strokeStyle = opts.stroke || '#fff';
                ctx.lineWidth = opts.strokeWidth || 2;
                ctx.stroke();
                ctx.restore();
            },
            line: (x1, y1, x2, y2, opts = {}) => {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = opts.stroke || '#fff';
                ctx.lineWidth = opts.strokeWidth || 2;
                ctx.stroke();
                ctx.restore();
            },
            arc: (x, y, w, h, start, end, closed, opts = {}) => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, w / 2, start, end);
                ctx.strokeStyle = opts.stroke || '#fff';
                ctx.lineWidth = opts.strokeWidth || 2;
                ctx.stroke();
                ctx.restore();
            },
            polygon: (points, opts = {}) => {
                ctx.save();
                ctx.beginPath();
                if (points.length > 0) {
                    ctx.moveTo(points[0][0], points[0][1]);
                    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
                    ctx.closePath();
                }
                if (opts.fill) {
                    ctx.fillStyle = opts.fill;
                    ctx.fill();
                }
                ctx.strokeStyle = opts.stroke || '#fff';
                ctx.lineWidth = opts.strokeWidth || 2;
                ctx.stroke();
                ctx.restore();
            }
        };
    }

    setupPhysicsEventBus() {
        this.physicsWorld.onEvent = (type, payload) => {
            if (this.state !== 'PLAYING') return;

            const timeNow = performance.now() / 1000;

            if (type === 'brickHit') {
                const { ball, brick, hitResult, destroyed } = payload;
                const dtSinceLastHit = timeNow - this.lastHitTime;
                this.lastHitTime = timeNow;

                this.comboStreak++;
                if (this.comboStreak > this.maxComboStreak) {
                    this.maxComboStreak = this.comboStreak;
                    window.progression?.recordStat('highestCombo', this.maxComboStreak);
                }
                this.comboMultiplier = 1 + Math.floor(this.comboStreak / 3);

                let styleMultiplier = 1.0;
                let styleCallout = null;

                if (dtSinceLastHit > 0 && dtSinceLastHit < 0.35) {
                    styleMultiplier *= 1.3;
                    styleCallout = 'QUICK HIT!';
                }
                if (this.balls.length >= 3) {
                    styleMultiplier *= 1.4;
                    styleCallout = styleCallout || 'MULTI HIT!';
                }

                const speedBonus = 1.0 + Math.max(0, (ball.speed - ball.baseSpeed) * 0.05);

                if (this.comboStreak >= 12 && !this.isCrystalFrenzy) {
                    this.isCrystalFrenzy = true;
                    this.crystalFrenzyTimer = 8;
                    this.camera.flash('#fbbf24', 0.3);
                    window.particleSystem?.addFloatingText('🔥 CRYSTAL FRENZY! (3x)', this.width / 2, this.height / 2 - 40, '#fbbf24', 1.8, true);
                }

                if (this.isCrystalFrenzy) styleMultiplier *= 1.5;

                window.soundEngine?.playBrickChime(this.comboStreak, brick.config.id);

                if (brick.typeKey === 'SAPPHIRE') {
                    ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.35);
                    window.particleSystem?.createLaserSparks(hitResult.contactX, hitResult.contactY, '#38bdf8', 6);
                } else if (brick.typeKey === 'EMERALD') {
                    ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.5);
                    window.particleSystem?.createLaserSparks(hitResult.contactX, hitResult.contactY, '#10b981', 6);
                } else if (brick.typeKey === 'AMBER' && brick.damageState === 'CRACKED') {
                    this.propagateAmberFracture(brick);
                }

                if (destroyed) {
                    window.progression?.recordStat('bricksBroken', 1);

                    const earnedPts = Math.round(brick.score * this.comboMultiplier * speedBonus * styleMultiplier);
                    this.addScore(earnedPts);

                    window.soundEngine?.playExplosion(brick.isExplosive);
                    window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id);
                    
                    const splatSize = window.challengeManager?.activeChallenge?.heavyInk ? 24 : 12;
                    this.sketchbook.addInkSplatter(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.strokeColor, splatSize);

                    if (brick.typeKey === 'AMETHYST') {
                        this.physicsWorld.hitStop.trigger(50);
                        this.camera.addTrauma(0.35);
                        this.camera.impactZoom(1.03);
                    } else if (brick.isExplosive) {
                        this.physicsWorld.hitStop.trigger(65);
                        this.camera.addTrauma(0.55);
                        this.camera.flash('#ef4444', 0.28);
                        this.triggerRubyNuke(brick);
                    } else {
                        this.camera.addTrauma(0.12);
                    }

                    const comboText = styleCallout ? `${styleCallout} +${earnedPts}` : (this.comboMultiplier > 1 ? `+${earnedPts} (x${this.comboMultiplier})` : `+${earnedPts}`);
                    window.particleSystem?.addFloatingText(comboText, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, styleCallout ? 1.35 : 1.0, !!styleCallout);

                    if (brick.dropsPowerup && !window.challengeManager?.activeChallenge?.disablePowerups) {
                        window.soundEngine?.playPowerupSpawn();
                        this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                    }

                    this.checkLevelClear();
                } else {
                    this.camera.punch(-hitResult.normalX, -hitResult.normalY, 3.5);
                    window.particleSystem?.createLaserSparks(hitResult.contactX, hitResult.contactY, brick.config.color, 4);
                }
                this.updateHUD();
            } else if (type === 'bossHit') {
                const { boss, ball, hitResult, defeated } = payload;
                this.physicsWorld.hitStop.trigger(45);
                this.camera.addTrauma(0.4);
                this.camera.impactZoom(1.035);
                window.soundEngine?.playExplosion(false);
                window.soundEngine?.playBrickChime(15, 'amethyst');

                const hitX = hitResult ? hitResult.contactX : boss.x;
                const hitY = hitResult ? hitResult.contactY : boss.y;

                window.particleSystem?.createLaserSparks(hitX, hitY, '#fbbf24', 12);
                this.sketchbook.addInkSplatter(hitX, hitY, '#78350f', 16);
                this.addScore(250);
                window.particleSystem?.addFloatingText('+250 BOSS HIT!', hitX, hitY - 20, '#fbbf24', 1.4, true);

                if (defeated) {
                    window.progression?.recordStat('bossDefeated', 1);
                    this.camera.flash('#fbbf24', 0.5);
                    this.camera.impactZoom(1.08);
                    window.soundEngine?.playLevelClear();
                    this.addScore(5000);
                    window.particleSystem?.addFloatingText('🏆 ARCH-PENCIL VANQUISHED! +5000', this.width / 2, this.height / 2 - 30, '#fbbf24', 2.0, true);
                    this.checkLevelClear();
                }
                this.updateHUD();
            } else if (type === 'paddleHit') {
                const { ball, deflection, isEdgeFlick, swingVelocity } = payload;
                window.soundEngine?.playPaddleBoing(Math.abs(deflection.offset));
                window.particleSystem?.createPaddleHitSparks(ball.x, this.paddle.y, swingVelocity);
                this.camera.punch(deflection.vx * 0.4, 4, isEdgeFlick ? 6 : 3.5);

                if (isEdgeFlick) {
                    this.physicsWorld.hitStop.trigger(35);
                    this.camera.impactZoom(1.025);
                    this.addScore(150);
                    window.particleSystem?.addFloatingText('PERFECT REBOUND! +150', ball.x, this.paddle.y - 25, '#38bdf8', 1.4, true);
                }

                this.comboStreak = 0;
                this.comboMultiplier = 1;
                this.updateHUD();
            } else if (type === 'nearMiss') {
                const { x, y } = payload;
                window.progression?.recordStat('nearMisses', 1);
                this.addScore(50);
                this.camera.addTrauma(0.08);
                window.soundEngine?.playWallTick();
                window.particleSystem?.createLaserSparks(x, y, '#fbbf24', 4);
                window.particleSystem?.addFloatingText('NEAR MISS +50', x, y - 18, '#fbbf24', 1.15, true);
                this.updateHUD();
            } else if (type === 'laserHit') {
                const { laser, brick, destroyed } = payload;
                window.particleSystem?.createLaserSparks(laser.x, laser.y, '#ff0055', 6);
                if (destroyed) {
                    window.progression?.recordStat('bricksBroken', 1);
                    const earnedPts = Math.round(brick.score * this.comboMultiplier);
                    this.addScore(earnedPts);
                    window.soundEngine?.playExplosion(brick.isExplosive);
                    window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id);
                    window.particleSystem?.addFloatingText(`+${earnedPts}`, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, 1.0);
                    if (brick.isExplosive) this.triggerRubyNuke(brick);
                    if (brick.dropsPowerup && !window.challengeManager?.activeChallenge?.disablePowerups) {
                        this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                    }
                    this.checkLevelClear();
                } else {
                    window.soundEngine?.playBrickChime(this.comboStreak, brick.config.id);
                }
                this.updateHUD();
            } else if (type === 'powerupCollect') {
                this.applyPowerup(payload.type);
            }
        };
    }

    propagateAmberFracture(amberBrick) {
        const cx = amberBrick.x + amberBrick.width / 2;
        const cy = amberBrick.y + amberBrick.height / 2;

        for (const b of this.bricks) {
            if (b.isAlive && b !== amberBrick && b.typeKey === 'AMBER') {
                const bx = b.x + b.width / 2;
                const by = b.y + b.height / 2;
                const dist = Math.hypot(bx - cx, by - cy);
                if (dist < 60 && b.damageState === 'INTACT') {
                    b.takeDamage(1);
                    window.particleSystem?.createLaserSparks(b.x + b.width / 2, b.y + b.height / 2, '#f59e0b', 3);
                }
            }
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            this.inputState.mouseX = (e.clientX - rect.left) * scaleX;
            this.inputState.isUsingMouse = true;
            this.paddle.targetX = this.inputState.mouseX - this.paddle.width / 2;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.handleActionTrigger();
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.width / rect.width;
                this.inputState.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
                this.inputState.isUsingMouse = true;
                this.paddle.targetX = this.inputState.mouseX - this.paddle.width / 2;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleActionTrigger();
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.inputState.left = true;
                this.inputState.isUsingMouse = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.inputState.right = true;
                this.inputState.isUsingMouse = false;
            }
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.inputState.space = true;
                this.handleActionTrigger();
            }
            if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
            if (e.code === 'KeyM') this.toggleMute();
            if (e.code === 'KeyT') this.cycleTheme();
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.inputState.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.inputState.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.inputState.space = false;
        });

        document.getElementById('btnStart')?.addEventListener('click', () => this.startGame(0));
        document.getElementById('btnEndless')?.addEventListener('click', () => this.startEndless());
        document.getElementById('btnResume')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btnRestart')?.addEventListener('click', () => this.restartCurrentGame());
        document.getElementById('btnNextLevel')?.addEventListener('click', () => this.nextLevel());
        document.getElementById('btnMenu')?.addEventListener('click', () => this.showMenu());
        document.getElementById('btnTheme')?.addEventListener('click', () => this.cycleTheme());
        document.getElementById('btnMute')?.addEventListener('click', () => this.toggleMute());
    }

    handleActionTrigger() {
        if (window.soundEngine) window.soundEngine.init();

        if (this.state === 'MENU') {
            this.startGame(0);
            return;
        }
        if (this.state === 'LEVEL_CLEAR') {
            this.nextLevel();
            return;
        }
        if (this.state === 'GAME_OVER' || this.state === 'VICTORY') {
            this.showMenu();
            return;
        }
        if (this.state === 'PAUSED') {
            this.togglePause();
            return;
        }

        if (this.state === 'PLAYING') {
            let launchedAny = false;
            for (const ball of this.balls) {
                if (ball.isStuck) {
                    const aimAngle = -Math.PI / 2 + (this.paddle.swingVelocity * 0.04);
                    const clampedAngle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, aimAngle));
                    ball.launch(clampedAngle);
                    window.soundEngine?.playPaddleBoing(0.3);
                    this.camera.punch(0, -4, 4);
                    launchedAny = true;
                }
            }

            if (this.paddle.hasLaser && !launchedAny) {
                const newLasers = this.paddle.fireLasers();
                if (newLasers) {
                    this.lasers.push(...newLasers);
                    this.camera.punch(0, 2, 2.5);
                }
            }
        }
    }

    startGame(levelIdx = 0) {
        window.challengeManager.activeChallenge = null;
        this.state = 'PLAYING';
        this.score = 0;
        this.lives = 3;
        this.levelIndex = levelIdx;
        this.isEndless = false;
        this.comboStreak = 0;
        this.maxComboStreak = 0;
        this.comboMultiplier = 1;
        this.isCrystalFrenzy = false;
        this.crystalFrenzyTimer = 0;
        this.camera.reset();
        this.loadLevel(this.levelIndex);
        this.hideAllModals();
        this.updateHUD();
    }

    startEndless() {
        window.challengeManager.activeChallenge = null;
        this.state = 'PLAYING';
        this.score = 0;
        this.lives = 3;
        this.levelIndex = 1;
        this.isEndless = true;
        this.comboStreak = 0;
        this.maxComboStreak = 0;
        this.comboMultiplier = 1;
        this.isCrystalFrenzy = false;
        this.crystalFrenzyTimer = 0;
        this.camera.reset();
        this.loadLevel(this.levelIndex);
        this.hideAllModals();
        this.updateHUD();
    }

    restartCurrentGame() {
        if (window.challengeManager.activeChallenge) {
            window.challengeManager.startChallenge(window.challengeManager.activeChallenge.id, this);
        } else if (this.isEndless) {
            this.startEndless();
        } else {
            this.startGame(this.levelIndex);
        }
    }

    showMenu() {
        this.state = 'MENU';
        this.hideAllModals();
        document.getElementById('modalMenu')?.classList.remove('hidden');
        this.loadLevel(0);
        this.updateHUD();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('modalPause')?.classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('modalPause')?.classList.add('hidden');
        }
    }

    toggleMute() {
        if (window.soundEngine) {
            const isMuted = window.soundEngine.toggleMute();
            const muteBtn = document.getElementById('btnMute');
            if (muteBtn) muteBtn.innerHTML = isMuted ? '🔇 Unmute' : '🔊 Sound';
        }
    }

    cycleTheme() {
        const themeKeys = Object.keys(THEMES);
        const nextIdx = (themeKeys.indexOf(this.currentThemeKey) + 1) % themeKeys.length;
        this.currentThemeKey = themeKeys[nextIdx];
        this.theme = THEMES[this.currentThemeKey];

        document.body.className = `theme-${this.currentThemeKey}`;
        const themeBtn = document.getElementById('btnTheme');
        if (themeBtn) themeBtn.innerText = `🎨 ${this.theme.name}`;
    }

    loadLevel(index) {
        window.particleSystem?.reset();
        this.lasers = [];
        this.powerups = [];
        this.safetyNet.isActive = false;
        this.geometryManager.clear();
        this.boss = null;

        this.paddle.reset(this.width, this.height);
        this.balls = [new Ball(this.paddle.x + this.paddle.width / 2, this.paddle.y - 12)];

        if (this.isEndless) {
            this.currentLevel = window.generateProceduralLevel(this.levelIndex);
        } else {
            const levelData = window.LEVELS[index % window.LEVELS.length];
            this.currentLevel = levelData;
        }

        this.sketchbook.setStage(this.currentLevel.stageNumber || 1);

        if (this.currentLevel.geometry) {
            if (this.currentLevel.geometry.windmills) {
                for (const w of this.currentLevel.geometry.windmills) {
                    this.geometryManager.windmills.push(new RotatingWindmill(w.x, w.y, w.length, w.speed, w.color));
                }
            }
            if (this.currentLevel.geometry.portals) {
                for (const p of this.currentLevel.geometry.portals) {
                    this.geometryManager.portals.push(new InkPortal(p.entryX, p.entryY, p.exitX, p.exitY, p.colorA, p.colorB));
                }
            }
            if (this.currentLevel.geometry.vortexes) {
                for (const v of this.currentLevel.geometry.vortexes) {
                    this.geometryManager.vortexes.push(new GravityVortex(v.x, v.y, v.strength, v.radius, v.color));
                }
            }
        }

        if (this.currentLevel.hasBoss) {
            this.boss = new ArchPencilBoss(this.width, this.height);
        }

        this.bricks = [];
        const rows = this.currentLevel.rows;
        const totalRows = rows.length;
        const totalCols = rows[0].length;

        const brickMargin = 5;
        const topOffset = this.boss ? 150 : 70;
        const sidePadding = 40;
        const totalUsableWidth = this.width - sidePadding * 2;
        const brickW = (totalUsableWidth - (totalCols - 1) * brickMargin) / totalCols;
        const brickH = 22;

        const codeToTypeKey = {
            'E': 'EMERALD',
            'A': 'AMBER',
            'S': 'SAPPHIRE',
            'R': 'RUBY',
            'M': 'AMETHYST',
            'G': 'GOLD',
            'X': 'OBSIDIAN'
        };

        for (let r = 0; r < totalRows; r++) {
            for (let c = 0; c < totalCols; c++) {
                const char = rows[r][c];
                if (char && char !== '.' && codeToTypeKey[char]) {
                    const bx = sidePadding + c * (brickW + brickMargin);
                    const by = topOffset + r * (brickH + brickMargin);
                    const typeKey = codeToTypeKey[char];
                    this.bricks.push(new Brick(bx, by, brickW, brickH, typeKey));
                }
            }
        }

        const levelTitleElem = document.getElementById('hudLevelName');
        if (levelTitleElem) {
            levelTitleElem.innerText = this.currentLevel.name;
        }
    }

    nextLevel() {
        this.hideAllModals();
        window.challengeManager.onStageCleared(this);
        window.progression?.recordStat('stagesCleared', 1);

        if (this.isEndless) {
            this.levelIndex++;
            this.sketchbook.triggerPageTurn(() => {
                this.loadLevel(this.levelIndex);
                this.state = 'PLAYING';
            });
        } else {
            this.levelIndex++;
            if (this.levelIndex >= window.LEVELS.length) {
                this.state = 'VICTORY';
                window.soundEngine?.playLevelClear();
                document.getElementById('modalVictory')?.classList.remove('hidden');
                const vicScore = document.getElementById('victoryFinalScore');
                if (vicScore) vicScore.innerText = this.score;
            } else {
                this.sketchbook.triggerPageTurn(() => {
                    this.loadLevel(this.levelIndex);
                    this.state = 'PLAYING';
                });
            }
        }
        this.updateHUD();
    }

    hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
    }

    checkLevelClear() {
        const remainingDestructible = this.bricks.filter(b => b.isAlive && !b.unbreakable);
        const bossDefeated = !this.boss || !this.boss.isAlive;

        if (remainingDestructible.length === 0 && bossDefeated && this.state === 'PLAYING') {
            this.state = 'LEVEL_CLEAR';
            window.soundEngine?.playLevelClear();
            this.camera.impactZoom(1.06);
            this.camera.flash('#10b981', 0.35);

            const clearBonus = 1000 * (this.levelIndex + 1);
            this.addScore(clearBonus);
            window.particleSystem?.addFloatingText(`STAGE CLEAR! +${clearBonus}`, this.width / 2, this.height / 2 - 20, '#fbbf24', 1.8, true);

            setTimeout(() => {
                if (this.state === 'LEVEL_CLEAR') {
                    document.getElementById('modalLevelClear')?.classList.remove('hidden');
                    const cScore = document.getElementById('clearScore');
                    const cCombo = document.getElementById('clearCombo');
                    if (cScore) cScore.innerText = this.score;
                    if (cCombo) cCombo.innerText = `${this.maxComboStreak}x`;
                }
            }, 600);
        }
    }

    handleBallLost() {
        if (window.challengeManager?.activeChallenge?.flawless) {
            this.lives = 0;
        } else {
            this.lives--;
        }

        window.soundEngine?.playBallLost();
        this.camera.addTrauma(0.4);
        this.camera.flash('#ef4444', 0.25);
        this.comboStreak = 0;
        this.comboMultiplier = 1;
        this.isCrystalFrenzy = false;
        this.updateHUD();

        if (this.lives <= 0) {
            this.state = 'GAME_OVER';
            window.soundEngine?.playGameOver();
            document.getElementById('modalGameOver')?.classList.remove('hidden');
            const goScore = document.getElementById('gameOverFinalScore');
            if (goScore) goScore.innerText = this.score;
        } else {
            this.paddle.reset(this.width, this.height);
            this.balls = [new Ball(this.paddle.x + this.paddle.width / 2, this.paddle.y - 12)];
        }
    }

    addScore(pts) {
        this.score += pts;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('sketchoid_highscore', this.highScore.toString());
        }
        this.updateHUD();
    }

    applyPowerup(type) {
        window.soundEngine?.playPowerupCollect(type);
        this.physicsWorld.hitStop.trigger(35);
        this.camera.impactZoom(1.03);

        const pNames = {
            multiball: '3X MULTIBALL FRENZY!',
            wide: 'WIDE PADDLE EXTENSION!',
            laser: 'LASER BLASTER TURRETS!',
            fireball: 'METEOR FIREBALL!',
            shield: 'SAFETY NET DEPLOYED!',
            slowmo: 'CHRONO TIME DILATION!'
        };
        const pColors = {
            multiball: '#f59e0b',
            wide: '#3b82f6',
            laser: '#ef4444',
            fireball: '#f97316',
            shield: '#10b981',
            slowmo: '#8b5cf6'
        };

        window.particleSystem?.addFloatingText(pNames[type] || 'POWERUP!', this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, pColors[type] || '#ffffff', 1.4, true);

        if (type === 'multiball') {
            const newBalls = [];
            for (const ball of this.balls) {
                if (!ball.isStuck) {
                    const angle1 = Math.atan2(ball.vy, ball.vx) + 0.32;
                    const angle2 = Math.atan2(ball.vy, ball.vx) - 0.32;
                    const b1 = new Ball(ball.x, ball.y, Math.cos(angle1) * ball.speed, Math.sin(angle1) * ball.speed);
                    const b2 = new Ball(ball.x, ball.y, Math.cos(angle2) * ball.speed, Math.sin(angle2) * ball.speed);
                    if (ball.isFireball) {
                        b1.setFireball(ball.fireballTimer);
                        b2.setFireball(ball.fireballTimer);
                    }
                    newBalls.push(b1, b2);
                }
            }
            this.balls.push(...newBalls);
        } else if (type === 'wide') {
            this.paddle.hasWide = true;
            this.paddle.wideTimer = 14;
        } else if (type === 'laser') {
            this.paddle.hasLaser = true;
            this.paddle.laserTimer = 12;
            this.paddle.laserHeat = 0;
            this.paddle.laserOverheated = false;
        } else if (type === 'fireball') {
            for (const ball of this.balls) ball.setFireball(10);
        } else if (type === 'shield') {
            this.safetyNet.activate(2);
        } else if (type === 'slowmo') {
            this.slowmoTimer = 8;
            this.timeScale = 0.35;
        }
    }

    triggerRubyNuke(centerBrick) {
        window.soundEngine?.playExplosion(true);
        const explosionRadius = 95;
        const cx = centerBrick.x + centerBrick.width / 2;
        const cy = centerBrick.y + centerBrick.height / 2;

        for (const brick of this.bricks) {
            if (brick.isAlive && brick !== centerBrick && !brick.unbreakable) {
                const bx = brick.x + brick.width / 2;
                const by = brick.y + brick.height / 2;
                const dist = Math.hypot(bx - cx, by - cy);

                if (dist <= explosionRadius) {
                    const destroyed = brick.takeDamage(2);
                    window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id, 8);
                    if (destroyed) {
                        const earnedPts = Math.round(brick.score * this.comboMultiplier * 2.0);
                        this.addScore(earnedPts);
                        window.particleSystem?.addFloatingText(`CHAIN! +${earnedPts}`, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, 1.25, true);
                        if (brick.dropsPowerup && !window.challengeManager?.activeChallenge?.disablePowerups) {
                            this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                        }
                    }
                }
            }
        }
    }

    update(dt) {
        const isFrozen = this.physicsWorld.hitStop.update(dt);
        if (isFrozen) {
            this.camera.update(dt);
            return;
        }

        if (this.slowmoTimer > 0) {
            this.slowmoTimer -= dt;
            this.timeScale = 0.35;
            if (this.slowmoTimer <= 0) this.timeScale = 1.0;
        }

        if (this.isCrystalFrenzy) {
            this.crystalFrenzyTimer -= dt;
            if (this.crystalFrenzyTimer <= 0) this.isCrystalFrenzy = false;
        }

        const effectiveDt = dt * this.timeScale;
        const timeNow = performance.now() / 1000;

        this.sketchbook.update(dt);
        window.challengeManager?.update(effectiveDt, this);

        if (this.state === 'PLAYING') {
            const paddleDt = this.slowmoTimer > 0 ? dt * 0.85 : effectiveDt;
            this.paddle.update(paddleDt, this.inputState);
            this.safetyNet.update(effectiveDt);

            for (const brick of this.bricks) brick.update(effectiveDt);
            this.geometryManager.update(effectiveDt, this.balls);

            if (this.boss && this.boss.isAlive) {
                this.boss.update(effectiveDt, this.bricks, this.paddle);
            }

            for (let i = this.lasers.length - 1; i >= 0; i--) {
                this.lasers[i].update(effectiveDt);
                if (!this.lasers[i].isAlive) this.lasers.splice(i, 1);
            }

            for (let i = this.powerups.length - 1; i >= 0; i--) {
                this.powerups[i].update(effectiveDt, this.height);
                if (!this.powerups[i].isAlive) this.powerups.splice(i, 1);
            }

            const subSteps = 4;
            const subDt = effectiveDt / subSteps;
            for (let s = 0; s < subSteps; s++) {
                this.physicsWorld.stepSubPhysics(
                    subDt, this.balls, this.paddle, this.bricks,
                    this.lasers, this.powerups, this.safetyNet,
                    this.geometryManager, this.boss, timeNow
                );
            }

            for (let i = this.balls.length - 1; i >= 0; i--) {
                const ball = this.balls[i];
                ball.update(effectiveDt, this.width, this.height, this.paddle);
                if (!ball.isAlive) this.balls.splice(i, 1);
            }

            if (this.balls.length === 0) {
                this.handleBallLost();
            }
        } else if (this.state === 'MENU') {
            this.paddle.update(effectiveDt, this.inputState);
            if (this.balls[0]) this.balls[0].update(effectiveDt, this.width, this.height, this.paddle);
        }

        const leadBall = this.balls[0];
        this.camera.update(dt, leadBall ? leadBall.x : null, leadBall ? leadBall.y : null);
        window.particleSystem?.update(dt);
    }

    updateHUD() {
        const scoreElem = document.getElementById('hudScore');
        const highScoreElem = document.getElementById('hudHighScore');
        const livesElem = document.getElementById('hudLives');
        const comboElem = document.getElementById('hudCombo');
        const comboMultiplierElem = document.getElementById('hudMultiplier');

        if (scoreElem) scoreElem.innerText = this.score.toLocaleString();
        if (highScoreElem) highScoreElem.innerText = this.highScore.toLocaleString();
        
        if (livesElem) {
            let hearts = '';
            for (let i = 0; i < this.lives; i++) hearts += '❤️ ';
            livesElem.innerText = hearts || '💀';
        }

        if (comboElem && comboMultiplierElem) {
            if (this.comboStreak > 1) {
                comboElem.innerText = `${this.comboStreak} HITS`;
                comboMultiplierElem.innerText = this.isCrystalFrenzy ? `${this.comboMultiplier * 3}x FRENZY` : `${this.comboMultiplier}x`;
                document.getElementById('hudComboContainer')?.classList.add('combo-active');
            } else {
                comboElem.innerText = `0 HITS`;
                comboMultiplierElem.innerText = `1x`;
                document.getElementById('hudComboContainer')?.classList.remove('combo-active');
            }
        }
    }

    drawLaunchAimGuide(ctx, rc, theme) {
        const stuckBall = this.balls.find(b => b.isStuck);
        if (!stuckBall) return;

        ctx.save();
        const aimAngle = -Math.PI / 2 + (this.paddle.swingVelocity * 0.04);
        const clampedAngle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, aimAngle));

        const startX = stuckBall.x;
        const startY = stuckBall.y - stuckBall.radius;
        const aimDist = 120;

        ctx.strokeStyle = theme.borderStroke;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.cos(clampedAngle) * aimDist, startY + Math.sin(clampedAngle) * aimDist);
        ctx.stroke();

        ctx.fillStyle = theme.borderStroke;
        ctx.beginPath();
        ctx.arc(startX + Math.cos(clampedAngle) * aimDist, startY + Math.sin(clampedAngle) * aimDist, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    draw() {
        const ctx = this.ctx;
        const rc = this.rc;
        const theme = this.theme;

        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        this.camera.begin(ctx);

        this.sketchbook.drawBackgroundLayers(ctx, rc, theme);

        rc.rectangle(4, 4, this.width - 8, this.height - 8, {
            seed: 42 + this.sketchbook.boilSeedOffset,
            roughness: 1.6,
            bowing: 1.8,
            stroke: theme.borderStroke,
            strokeWidth: 3
        });

        this.geometryManager.draw(ctx, rc, theme);
        this.safetyNet.draw(ctx, rc, theme);

        for (const brick of this.bricks) brick.draw(ctx, rc, theme);

        if (this.boss && this.boss.isAlive) {
            this.boss.draw(ctx, rc, theme);
        }

        for (const pow of this.powerups) pow.draw(ctx, rc, theme);
        for (const laser of this.lasers) laser.draw(ctx, rc, theme);

        this.drawLaunchAimGuide(ctx, rc, theme);
        this.paddle.draw(ctx, rc, theme);

        for (const ball of this.balls) ball.draw(ctx, rc, theme);

        window.particleSystem?.draw(ctx, rc, theme);

        this.camera.end(ctx);
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    start() {
        requestAnimationFrame((t) => {
            this.lastTime = t;
            this.loop(t);
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.start();
});
