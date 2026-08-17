/**
 * SKETCHOID Main Game Controller & Architecture (Commercial Indie Polish Pass)
 * Integrates Living Sketchbook Canvas, Centralized Impact & Skill Event Buses,
 * 3-Star Level Mastery, 3 Rule-Altering Bosses, Mobile Input Abstraction, and Developer Debug Tools.
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
                this.rc = this.createFallbackRenderer();
            }
        } catch (e) {
            this.rc = this.createFallbackRenderer();
        }

        this.width = 800;
        this.height = 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.currentThemeKey = 'blueprint';
        this.theme = THEMES[this.currentThemeKey];

        // Decoupled Core Systems
        this.camera = new Camera2D(this.width, this.height);
        this.physicsWorld = new PhysicsWorld(this.width, this.height);
        this.sketchbook = new SketchbookWorld(this.width, this.height);
        this.geometryManager = new InteractiveGeometryManager();
        this.inputManager = new InputManager(this.canvas, this.width, this.height);
        this.boss = null;

        // Game State & Scoring
        this.state = 'MENU';
        this.score = 0;
        this.styleScore = 0;
        this.lives = 3;
        this.maxLives = 5;
        this.levelIndex = 0;
        this.currentLevel = null;
        this.isEndless = false;
        this.sessionInkEarned = 0;
        this.sessionXpEarned = 0;
        this.livesLostThisLevel = 0;

        // Combo 2.0 & Style Engine
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

        // Time Dilation
        this.slowmoTimer = 0;
        this.timeScale = 1.0;

        // Debug Flags
        this.godMode = false;
        this.showDebugColliders = false;

        this.lastTime = performance.now();
        this.fixedTimeStep = 1 / 120;

        this.setupEventListeners();
        this.setupCentralizedEventBuses();
        this.themeToggle = new ThemeToggle(document.getElementById('theme-toggle-btn'), this);
        this.loadLevel(0);
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

    setupCentralizedEventBuses() {
        // 1. Centralized Impact Event Bus Dispatcher
        window.impactEvents.subscribe((evt) => {
            if (evt.type === 'WALL_HIT') {
                window.skillEvents.recordWallBounce(performance.now() / 1000);
                window.soundEngine?.playWallTick();
                window.haptics?.light();
            } else if (evt.type === 'PADDLE_HIT') {
                window.skillEvents.recordPaddleHit();
                window.haptics?.light();
            } else if (evt.type === 'BRICK_HIT') {
                window.haptics?.medium();
            } else if (evt.type === 'EXPLOSION') {
                window.haptics?.heavy();
            }
        });

        // 2. Physics Event Bus Wiring
        this.physicsWorld.onEvent = (type, payload) => {
            if (this.state !== 'PLAYING') return;
            const timeNow = performance.now() / 1000;

            if (type === 'brickHit') {
                const { ball, brick, hitResult, destroyed } = payload;
                const dtSinceLastHit = timeNow - this.lastHitTime;
                this.lastHitTime = timeNow;

                // Discover in Sketch Archive
                window.progression?.discoverItem('crystals', brick.config.id);

                this.comboStreak++;
                if (this.comboStreak > this.maxComboStreak) {
                    this.maxComboStreak = this.comboStreak;
                    window.progression?.recordStat('highestCombo', this.maxComboStreak);
                }
                this.comboMultiplier = 1 + Math.floor(this.comboStreak / 3);

                // Check Bank Shot Skill Event
                const bankShot = window.skillEvents.checkBankShot(timeNow);
                if (bankShot) {
                    this.styleScore += bankShot.scoreBonus;
                    this.addScore(bankShot.scoreBonus);
                    window.progression?.addXp(bankShot.xpBonus);
                    window.progression?.addInk(bankShot.inkBonus);
                    window.progression?.recordStat('bankShots', 1);
                    this.sessionInkEarned += bankShot.inkBonus;
                    this.sessionXpEarned += bankShot.xpBonus;
                    window.particleSystem?.addFloatingText(bankShot.name, hitResult.contactX, hitResult.contactY - 24, bankShot.color, 1.3, true);
                }

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
                    this.camera.flash('#fbbf24', 0.20);
                    window.particleSystem?.addFloatingText('🔥 CRYSTAL FRENZY! (3x)', this.width / 2, this.height / 2 - 40, '#fbbf24', 1.5, true);
                }

                if (this.isCrystalFrenzy) styleMultiplier *= 1.5;

                window.soundEngine?.playBrickChime(this.comboStreak, brick.config.id, ball.speed);

                if (brick.typeKey === 'SAPPHIRE') {
                    ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.35);
                    window.particleSystem?.createLaserSparks(hitResult.contactX, hitResult.contactY, '#38bdf8', 4);
                } else if (brick.typeKey === 'EMERALD') {
                    ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.5);
                    window.particleSystem?.createLaserSparks(hitResult.contactX, hitResult.contactY, '#10b981', 4);
                } else if (brick.typeKey === 'AMBER' && brick.damageState === 'CRACKED') {
                    this.propagateAmberFracture(brick);
                }

                if (destroyed) {
                    window.progression?.recordStat('bricksBroken', 1);
                    window.progression?.addInk(1);
                    window.progression?.addXp(5);
                    this.sessionInkEarned += 1;
                    this.sessionXpEarned += 5;

                    const earnedPts = Math.round(brick.score * this.comboMultiplier * speedBonus * styleMultiplier);
                    this.addScore(earnedPts);

                    window.soundEngine?.playExplosion(brick.isExplosive);
                    window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id);
                    
                    const splatSize = window.challengeManager?.activeChallenge?.heavyInk ? 18 : 10;
                    this.sketchbook.addInkSplatter(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.strokeColor, splatSize);
                    this.sketchbook.recordBrickDestroyed(brick.x + brick.width / 2, brick.y + brick.height / 2);

                    if (brick.typeKey === 'AMETHYST') {
                        this.physicsWorld.hitStop.trigger(30);
                        this.camera.addTrauma(0.16);
                        this.camera.impactZoom(1.02);
                    } else if (brick.isExplosive) {
                        this.physicsWorld.hitStop.trigger(30);
                        this.camera.addTrauma(0.25);
                        this.camera.flash('#ef4444', 0.20);
                        this.triggerRubyNuke(brick);
                    } else {
                        this.camera.addTrauma(0.04);
                    }

                    const comboText = styleCallout ? `${styleCallout} +${earnedPts}` : (this.comboMultiplier > 1 ? `+${earnedPts} (x${this.comboMultiplier})` : `+${earnedPts}`);
                    window.particleSystem?.addFloatingText(comboText, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, styleCallout ? 1.25 : 1.0, !!styleCallout);

                    if (brick.dropsPowerup && !window.challengeManager?.activeChallenge?.disablePowerups && this.powerups.length < 3) {
                        window.soundEngine?.playPowerupSpawn();
                        this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                    }

                    this.checkLevelClear();
                } else {
                    this.camera.punch(-hitResult.normalX, -hitResult.normalY, 1.8);
                    window.particleSystem?.createLaserSparks(hitResult.contactX, hitResult.contactY, brick.config.color, 3);
                }
                this.updateHUD();
            } else if (type === 'bossHit') {
                const { boss, hitResult, defeated } = payload;
                this.physicsWorld.hitStop.trigger(30);
                this.camera.addTrauma(0.20);
                this.camera.impactZoom(1.025);
                window.soundEngine?.playExplosion(false);
                window.soundEngine?.playBrickChime(15, 'amethyst');
                window.progression?.discoverItem('bosses', boss.type);

                const hitX = hitResult ? hitResult.contactX : boss.x;
                const hitY = hitResult ? hitResult.contactY : boss.y;

                window.particleSystem?.createLaserSparks(hitX, hitY, '#fbbf24', 8);
                this.sketchbook.addInkSplatter(hitX, hitY, '#78350f', 12);
                this.addScore(250);
                window.particleSystem?.addFloatingText('+250 BOSS HIT!', hitX, hitY - 20, '#fbbf24', 1.3, true);

                if (defeated) {
                    window.progression?.recordStat('bossDefeated', 1);
                    window.progression?.addInk(150);
                    window.progression?.addXp(300);
                    this.sessionInkEarned += 150;
                    this.sessionXpEarned += 300;

                    this.camera.flash('#fbbf24', 0.35);
                    this.camera.impactZoom(1.05);
                    window.soundEngine?.playLevelClear();
                    this.addScore(5000);
                    window.particleSystem?.addFloatingText(`🏆 ${boss.name} VANQUISHED! +5000`, this.width / 2, this.height / 2 - 30, '#fbbf24', 1.8, true);
                    this.checkLevelClear();
                }
                this.updateHUD();
            } else if (type === 'paddleHit') {
                const { ball, deflection, isEdgeFlick, swingVelocity } = payload;
                window.soundEngine?.playPaddleBoing(Math.abs(deflection.offset));
                window.particleSystem?.createPaddleHitSparks(ball.x, this.paddle.y, swingVelocity);
                this.camera.punch(deflection.vx * 0.25, 2.5, isEdgeFlick ? 3.8 : 2.0);

                if (isEdgeFlick) {
                    this.physicsWorld.hitStop.trigger(25);
                    this.camera.impactZoom(1.02);
                    window.soundEngine?.playPerfectReboundTriad();
                    this.styleScore += 150;
                    this.addScore(150);
                    window.progression?.recordStat('perfectRebounds', 1);
                    window.progression?.addXp(15);
                    window.particleSystem?.addFloatingText('PERFECT REBOUND! +150', ball.x, this.paddle.y - 25, '#38bdf8', 1.3, true);
                }

                this.comboStreak = 0;
                this.comboMultiplier = 1;
                this.updateHUD();
            } else if (type === 'nearMiss') {
                const { x, y } = payload;
                window.progression?.recordStat('nearMisses', 1);
                window.progression?.addXp(10);
                this.styleScore += 50;
                this.addScore(50);
                this.camera.addTrauma(0.04);
                window.soundEngine?.playWallTick();
                window.particleSystem?.createLaserSparks(x, y, '#fbbf24', 3);
                window.particleSystem?.addFloatingText('NEAR MISS +50', x, y - 18, '#fbbf24', 1.1, true);
                this.updateHUD();
            } else if (type === 'laserHit') {
                const { laser, brick, destroyed } = payload;
                window.particleSystem?.createLaserSparks(laser.x, laser.y, '#ff0055', 4);
                if (destroyed) {
                    window.progression?.recordStat('bricksBroken', 1);
                    const earnedPts = Math.round(brick.score * this.comboMultiplier);
                    this.addScore(earnedPts);
                    window.soundEngine?.playExplosion(brick.isExplosive);
                    window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id);
                    window.particleSystem?.addFloatingText(`+${earnedPts}`, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, 1.0);
                    if (brick.isExplosive) this.triggerRubyNuke(brick);
                    if (brick.dropsPowerup && !window.challengeManager?.activeChallenge?.disablePowerups && this.powerups.length < 3) {
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
        this.inputManager.onActionTrigger = () => this.handleActionTrigger();

        // Main Navigation Buttons
        document.getElementById('btnStart')?.addEventListener('click', () => this.startGame(0));
        document.getElementById('btnEndless')?.addEventListener('click', () => this.startEndless());
        document.getElementById('btnResume')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btnRestart')?.addEventListener('click', () => this.restartCurrentGame());
        document.getElementById('btnNextLevel')?.addEventListener('click', () => this.nextLevel());
        document.getElementById('btnMenu')?.addEventListener('click', () => this.showMenu());
        document.getElementById('btnTheme')?.addEventListener('click', () => this.cycleTheme());
        // Attach Handcrafted 3D Elastic Physics to all sketch buttons
        document.querySelectorAll('.btn-sketch').forEach(btn => this.attachTactilePhysics(btn));

        // Notebook Collection Modal & Dev Tools
        document.getElementById('btnCollection')?.addEventListener('click', () => this.openSketchbookModal('chapters'));
        document.getElementById('btnDevTools')?.addEventListener('click', () => this.toggleDebugConsole());
        document.getElementById('btnCloseCollection')?.addEventListener('click', () => {
            document.getElementById('modalCollection')?.classList.add('hidden');
        });

        // Settings Modal & Accessibility
        document.getElementById('btnSettings')?.addEventListener('click', () => {
            document.getElementById('modalSettings')?.classList.remove('hidden');
        });
        document.getElementById('btnCloseSettings')?.addEventListener('click', () => {
            document.getElementById('modalSettings')?.classList.add('hidden');
        });

        document.getElementById('sliderMusic')?.addEventListener('input', (e) => {
            window.soundEngine?.setMusicVolume(parseFloat(e.target.value));
        });
        document.getElementById('sliderSFX')?.addEventListener('input', (e) => {
            window.soundEngine?.setSFXVolume(parseFloat(e.target.value));
        });

        document.getElementById('chkReducedMotion')?.addEventListener('change', (e) => {
            this.reducedMotion = e.target.checked;
        });

        document.getElementById('chkHighContrast')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.className = 'theme-high-contrast';
            } else {
                document.body.className = `theme-${this.currentThemeKey}`;
            }
        });

        document.getElementById('btnFullscreen')?.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });

        // Developer Debug Console (Press Backtick `)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Backquote') {
                this.toggleDebugConsole();
            }
            if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
            if (e.code === 'KeyM') this.toggleMute();
            if (e.code === 'KeyT') this.cycleTheme();
        });

        // Pause on window blur
        window.addEventListener('blur', () => {
            if (this.state === 'PLAYING') {
                this.togglePause();
            }
        });
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
                    this.camera.punch(0, -2.5, 3.0);
                    launchedAny = true;
                }
            }

            if (this.paddle.hasLaser && !launchedAny) {
                const newLasers = this.paddle.fireLasers();
                if (newLasers) {
                    this.lasers.push(...newLasers);
                    this.camera.punch(0, 1.2, 1.8);
                }
            }
        }
    }

    startGame(levelIdx = 0) {
        window.challengeManager.activeChallenge = null;
        this.state = 'PLAYING';
        this.score = 0;
        this.styleScore = 0;
        this.lives = 3;
        this.livesLostThisLevel = 0;
        this.sessionInkEarned = 0;
        this.sessionXpEarned = 0;
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
        window.telemetry?.track('level_start', { levelId: this.currentLevel.id, isEndless: false });
    }

    startEndless() {
        window.challengeManager.activeChallenge = null;
        this.state = 'PLAYING';
        this.score = 0;
        this.styleScore = 0;
        this.lives = 3;
        this.livesLostThisLevel = 0;
        this.sessionInkEarned = 0;
        this.sessionXpEarned = 0;
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
        window.telemetry?.track('level_start', { levelId: 'infinite', isEndless: true });
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
        window.soundEngine?.setPalette(this.currentThemeKey);
        this.themeToggle?.syncTheme(this.theme.bgDark, true);
    }

    loadLevel(index) {
        window.particleSystem?.reset();
        this.lasers = [];
        this.powerups = [];
        this.safetyNet.isActive = false;
        this.geometryManager.clear();
        this.boss = null;
        this.livesLostThisLevel = 0;

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
            const bType = this.currentLevel.bossType || 'pencil';
            if (bType === 'eraser') {
                this.boss = new EraserBoss(this.width, this.height);
            } else if (bType === 'ink') {
                this.boss = new LivingInkBoss(this.width, this.height);
            } else {
                this.boss = new ArchPencilBoss(this.width, this.height);
            }
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
            window.haptics?.success();
            this.camera.impactZoom(1.04);
            this.camera.flash('#10b981', 0.25);

            const clearBonus = 1000 * (this.levelIndex + 1);
            this.addScore(clearBonus);

            const isFlawless = this.livesLostThisLevel === 0;
            const completionResult = window.progression?.recordLevelCompletion(
                this.currentLevel.id,
                this.score,
                this.styleScore,
                this.maxComboStreak,
                isFlawless
            );

            // Award Stage Clear XP & Ink
            const earnedXp = 100 + (completionResult?.stars === 3 ? 75 : 0);
            const earnedInk = 20 + (completionResult?.stars === 3 ? 50 : 0);
            window.progression?.addXp(earnedXp);
            window.progression?.addInk(earnedInk);
            this.sessionXpEarned += earnedXp;
            this.sessionInkEarned += earnedInk;

            window.telemetry?.track('level_complete', {
                levelId: this.currentLevel.id,
                score: this.score,
                stars: completionResult?.stars || 1
            });

            setTimeout(() => {
                if (this.state === 'LEVEL_CLEAR') {
                    document.getElementById('modalLevelClear')?.classList.remove('hidden');
                    const cScore = document.getElementById('clearScore');
                    const cCombo = document.getElementById('clearCombo');
                    const cStars = document.getElementById('clearStarsDisplay');
                    const cInk = document.getElementById('clearInkReward');
                    const cXp = document.getElementById('clearXpReward');

                    if (cScore) cScore.innerText = this.score.toLocaleString();
                    if (cCombo) cCombo.innerText = `${this.maxComboStreak}x`;
                    if (cInk) cInk.innerText = `+${earnedInk} 🖋️`;
                    if (cXp) cXp.innerText = `+${earnedXp} XP`;

                    if (cStars) {
                        const count = completionResult?.stars || 1;
                        let starText = '';
                        for (let s = 0; s < 3; s++) {
                            starText += s < count ? '★ ' : '☆ ';
                        }
                        cStars.innerText = starText.trim();
                    }
                }
            }, 500);
        }
    }

    handleBallLost() {
        this.livesLostThisLevel++;
        if (window.challengeManager?.activeChallenge?.flawless) {
            this.lives = 0;
        } else {
            this.lives--;
        }

        window.soundEngine?.playBallLost();
        window.haptics?.failure();
        this.camera.addTrauma(0.25);
        this.camera.flash('#ef4444', 0.20);
        this.comboStreak = 0;
        this.comboMultiplier = 1;
        this.isCrystalFrenzy = false;
        this.updateHUD();

        if (this.lives <= 0) {
            this.state = 'GAME_OVER';
            window.soundEngine?.playGameOver();
            window.telemetry?.track('game_over', { levelId: this.currentLevel.id, score: this.score });

            document.getElementById('modalGameOver')?.classList.remove('hidden');
            const goScore = document.getElementById('gameOverFinalScore');
            const goStyle = document.getElementById('gameOverStyleScore');
            const goCombo = document.getElementById('gameOverMaxCombo');
            const goInk = document.getElementById('gameOverInkEarned');
            const goXp = document.getElementById('gameOverXpEarned');

            if (goScore) goScore.innerText = this.score.toLocaleString();
            if (goStyle) goStyle.innerText = this.styleScore.toLocaleString();
            if (goCombo) goCombo.innerText = `${this.maxComboStreak}x`;
            if (goInk) goInk.innerText = `+${this.sessionInkEarned} 🖋️`;
            if (goXp) goXp.innerText = `+${this.sessionXpEarned} XP`;
        } else {
            this.paddle.reset(this.width, this.height);
            this.balls = [new Ball(this.paddle.x + this.paddle.width / 2, this.paddle.y - 12)];
        }
    }

    addScore(pts) {
        this.score += pts;
        this.updateHUD();
    }

    applyPowerup(type) {
        window.soundEngine?.playPowerupCollect(type);
        window.progression?.discoverItem('powerups', type);
        window.haptics?.medium();
        this.physicsWorld.hitStop.trigger(25);
        this.camera.impactZoom(1.02);

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

        window.particleSystem?.addFloatingText(pNames[type] || 'POWERUP!', this.paddle.x + this.paddle.width / 2, this.paddle.y - 30, pColors[type] || '#ffffff', 1.3, true);

        if (type === 'multiball') {
            const MAX_BALLS = 8;
            if (this.balls.length < MAX_BALLS) {
                const leadBall = this.balls.find(b => !b.isStuck) || this.balls[0];
                if (leadBall) {
                    const angle1 = Math.atan2(leadBall.vy, leadBall.vx) + 0.35;
                    const angle2 = Math.atan2(leadBall.vy, leadBall.vx) - 0.35;
                    const b1 = new Ball(leadBall.x, leadBall.y, Math.cos(angle1) * leadBall.speed, Math.sin(angle1) * leadBall.speed);
                    const b2 = new Ball(leadBall.x, leadBall.y, Math.cos(angle2) * leadBall.speed, Math.sin(angle2) * leadBall.speed);
                    if (leadBall.isFireball) {
                        b1.setFireball(leadBall.fireballTimer);
                        b2.setFireball(leadBall.fireballTimer);
                    }
                    this.balls.push(b1);
                    if (this.balls.length < MAX_BALLS) {
                        this.balls.push(b2);
                    }
                }
            } else {
                this.addScore(500);
            }
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
        const explosionRadius = 90;
        const cx = centerBrick.x + centerBrick.width / 2;
        const cy = centerBrick.y + centerBrick.height / 2;

        let totalChainPts = 0;
        let chainCount = 0;

        for (const brick of this.bricks) {
            if (brick.isAlive && brick !== centerBrick && !brick.unbreakable) {
                const bx = brick.x + brick.width / 2;
                const by = brick.y + brick.height / 2;
                const dist = Math.hypot(bx - cx, by - cy);

                if (dist <= explosionRadius) {
                    const destroyed = brick.takeDamage(2);
                    if (destroyed) {
                        chainCount++;
                        totalChainPts += Math.round(brick.score * this.comboMultiplier * 2.0);
                        if (chainCount <= 2) {
                            window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id, 6);
                        } else {
                            window.particleSystem?.createLaserSparks(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, 3);
                        }

                        if (brick.dropsPowerup && !window.challengeManager?.activeChallenge?.disablePowerups && this.powerups.length < 3) {
                            this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                        }
                    }
                }
            }
        }

        if (totalChainPts > 0) {
            this.addScore(totalChainPts);
            window.particleSystem?.addFloatingText(`CHAIN x${chainCount}! +${totalChainPts}`, cx, cy, '#ef4444', 1.3, true);
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

        window.soundEngine?.updateMusic(dt, this.comboStreak, this.isCrystalFrenzy, !!(this.boss && this.boss.isAlive), this.state === 'PLAYING');

        this.sketchbook.update(dt);
        window.challengeManager?.update(effectiveDt, this);

        if (this.state === 'PLAYING') {
            const paddleDt = this.slowmoTimer > 0 ? dt * 0.85 : effectiveDt;
            this.paddle.targetX = this.inputManager.state.paddleTargetX - this.paddle.width / 2;
            this.paddle.update(paddleDt, this.inputManager.state);
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
                    this.geometryManager, this.boss, timeNow,
                    this.comboStreak
                );
            }

            for (let i = this.balls.length - 1; i >= 0; i--) {
                const ball = this.balls[i];
                ball.update(effectiveDt, this.width, this.height, this.paddle);
                if (!ball.isAlive) this.balls.splice(i, 1);
            }

            if (this.balls.length === 0 && !this.godMode) {
                this.handleBallLost();
            }
        } else if (this.state === 'MENU') {
            this.paddle.update(effectiveDt, this.inputManager.state);
            if (this.balls[0]) this.balls[0].update(effectiveDt, this.width, this.height, this.paddle);
        }

        const leadBall = this.balls[0];
        this.camera.update(dt, leadBall ? leadBall.x : null, leadBall ? leadBall.y : null);
        window.particleSystem?.update(dt);
    }

    updateHUD() {
        const scoreElem = document.getElementById('hudScore');
        const livesElem = document.getElementById('hudLives');
        const comboElem = document.getElementById('hudCombo');
        const comboMultiplierElem = document.getElementById('hudMultiplier');
        const inkElem = document.getElementById('hudInkVal');
        const levelElem = document.getElementById('hudLevelVal');

        if (scoreElem) scoreElem.innerText = this.score.toLocaleString();
        if (inkElem && window.progression) inkElem.innerText = window.progression.data.player.ink.toLocaleString();
        if (levelElem && window.progression) levelElem.innerText = `LVL ${window.progression.data.player.level}`;

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
            seed: 42,
            roughness: 1.4,
            bowing: 1.4,
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

    attachTactilePhysics(el) {
        if (!el) return;
        el.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: el,
                    scale: 1.05,
                    translateY: -3,
                    duration: 350,
                    easing: 'easeOutElastic(1, 0.6)'
                });
            }
        });
        el.addEventListener('mouseleave', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: el,
                    scale: 1,
                    translateY: 0,
                    duration: 300,
                    easing: 'easeOutElastic(1, 0.6)'
                });
            }
        });
    }

    openSketchbookModal(activeTab = 'chapters') {
        const modal = document.getElementById('modalCollection');
        if (!modal) return;

        this.renderSketchbookTabs(activeTab);
        modal.classList.remove('hidden');
    }

    renderSketchbookTabs(activeTab = 'chapters') {
        const grid = document.getElementById('collectionItemsGrid');
        if (!grid || !window.progression) return;

        // Update tab buttons active state
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (activeTab === 'chapters') document.getElementById('tabChapters')?.classList.add('active');
        if (activeTab === 'archive') document.getElementById('tabArchive')?.classList.add('active');
        if (activeTab === 'achievements') document.getElementById('tabAchievements')?.classList.add('active');
        if (activeTab === 'cosmetics') document.getElementById('tabCosmetics')?.classList.add('active');

        grid.innerHTML = '';
        const pData = window.progression.data;

        if (activeTab === 'chapters') {
            for (let i = 0; i < window.LEVELS.length; i++) {
                const lvl = window.LEVELS[i];
                const stats = pData.levelStars[lvl.id] || { stars: 0, bestScore: 0 };
                const card = document.createElement('div');
                card.className = 'collection-card chapter-select-card';
                card.onclick = () => {
                    this.startGame(i);
                };

                const canvas = document.createElement('canvas');
                canvas.width = 110;
                canvas.height = 65;
                canvas.className = 'item-sketch-canvas';

                let starStr = '';
                for (let s = 0; s < 3; s++) starStr += s < stats.stars ? '★' : '☆';

                card.appendChild(canvas);
                const textContainer = document.createElement('div');
                textContainer.innerHTML = `
                    <div class="collection-title">${lvl.name}</div>
                    <div class="star-rating" style="color: #fbbf24; font-size: 1.15rem; margin: 4px 0;">${starStr}</div>
                    <div class="collection-desc">${lvl.starConditions?.masteryDesc || lvl.subtitle}</div>
                    <button class="btn-sketch btn-small" style="margin-top: 8px;">Draft Sector</button>
                `;
                card.appendChild(textContainer);
                this.attachTactilePhysics(card);
                grid.appendChild(card);

                // Draw sector icon
                SketchItemRenderer.drawItemIllustration(canvas, 'bosses', i === 2 ? 'eraser' : (i === 3 ? 'ink' : (i === 4 ? 'pencil' : 'emerald')), true);
            }
        } else if (activeTab === 'archive') {
            const defs = window.progression.archiveDefinitions;
            for (const cat in defs) {
                for (const item of defs[cat]) {
                    const isDiscovered = pData.discoveredItems[cat]?.includes(item.id);
                    const card = document.createElement('div');
                    card.className = `collection-card ${isDiscovered ? '' : 'locked'}`;

                    const canvas = document.createElement('canvas');
                    canvas.width = 110;
                    canvas.height = 65;
                    canvas.className = 'item-sketch-canvas';
                    card.appendChild(canvas);

                    const textContainer = document.createElement('div');
                    textContainer.innerHTML = `
                        <div class="collection-title">${isDiscovered ? item.name : '???'}</div>
                        <div class="collection-desc">${isDiscovered ? item.desc : 'Break crystals or play sectors to discover.'}</div>
                    `;
                    card.appendChild(textContainer);
                    this.attachTactilePhysics(card);
                    grid.appendChild(card);

                    SketchItemRenderer.drawItemIllustration(canvas, cat, item.id, isDiscovered);
                }
            }
        } else if (activeTab === 'achievements') {
            for (const ach of window.progression.achievements) {
                const completed = pData.completedAchievements.includes(ach.id);
                const card = document.createElement('div');
                card.className = `collection-card ${completed ? 'equipped' : 'locked'}`;

                const canvas = document.createElement('canvas');
                canvas.width = 110;
                canvas.height = 65;
                canvas.className = 'item-sketch-canvas';
                card.appendChild(canvas);

                const textContainer = document.createElement('div');
                textContainer.innerHTML = `
                    <div class="collection-title">${ach.name}</div>
                    <div class="collection-desc">${ach.desc}</div>
                    <div class="reward-pill" style="margin-top: 6px; font-size: 0.75rem; color: #10b981; font-weight: bold;">${completed ? '🏅 COMPLETED' : `+${ach.inkReward} 🖋️ &bull; +${ach.xpReward} XP`}</div>
                `;
                card.appendChild(textContainer);
                this.attachTactilePhysics(card);
                grid.appendChild(card);

                SketchItemRenderer.drawItemIllustration(canvas, 'achievements', ach.id, completed);
            }
        } else if (activeTab === 'cosmetics') {
            // 1. Paddle Skins Subheader
            const skinHeader = document.createElement('div');
            skinHeader.className = 'cosmetic-section-header';
            skinHeader.style.gridColumn = '1 / -1';
            skinHeader.innerHTML = `<h3>📐 PADDLE SKINS (Select 1)</h3>`;
            grid.appendChild(skinHeader);

            for (const skin of window.progression.skins) {
                const unlocked = pData.unlockedSkins.includes(skin.id);
                const equipped = pData.player.selectedSkin === skin.id;
                const card = document.createElement('div');
                card.className = `collection-card ${equipped ? 'equipped' : ''}`;

                const canvas = document.createElement('canvas');
                canvas.width = 110;
                canvas.height = 65;
                canvas.className = 'item-sketch-canvas';
                card.appendChild(canvas);

                const textContainer = document.createElement('div');
                textContainer.innerHTML = `
                    <div class="collection-title">${skin.name}</div>
                    <div class="collection-desc">${skin.desc}</div>
                    <button class="btn-sketch btn-small" style="margin-top: 8px;">${equipped ? 'EQUIPPED' : (unlocked ? 'EQUIP' : `UNLOCK (${skin.cost} 🖋️)`)}</button>
                `;
                card.appendChild(textContainer);

                card.onclick = () => {
                    if (unlocked) {
                        window.progression.selectSkin(skin.id);
                        this.renderSketchbookTabs('cosmetics');
                    } else {
                        if (window.progression.unlockSkinWithInk(skin.id)) {
                            this.renderSketchbookTabs('cosmetics');
                            window.soundEngine?.playPowerupCollect('multiball');
                        }
                    }
                };
                this.attachTactilePhysics(card);
                grid.appendChild(card);
                SketchItemRenderer.drawItemIllustration(canvas, 'skins', skin.id, unlocked);
            }

            // 2. Ball Trails Subheader
            const trailHeader = document.createElement('div');
            trailHeader.className = 'cosmetic-section-header';
            trailHeader.style.gridColumn = '1 / -1';
            trailHeader.style.marginTop = '12px';
            trailHeader.innerHTML = `<h3>🌠 BALL TRAILS (Select 1)</h3>`;
            grid.appendChild(trailHeader);

            for (const trail of window.progression.trails) {
                const unlocked = pData.unlockedTrails.includes(trail.id);
                const equipped = pData.player.selectedTrail === trail.id;
                const card = document.createElement('div');
                card.className = `collection-card ${equipped ? 'equipped' : ''}`;

                const canvas = document.createElement('canvas');
                canvas.width = 110;
                canvas.height = 65;
                canvas.className = 'item-sketch-canvas';
                card.appendChild(canvas);

                const textContainer = document.createElement('div');
                textContainer.innerHTML = `
                    <div class="collection-title">${trail.name}</div>
                    <div class="collection-desc">${trail.desc}</div>
                    <button class="btn-sketch btn-small" style="margin-top: 8px;">${equipped ? 'EQUIPPED' : (unlocked ? 'EQUIP' : `UNLOCK (${trail.cost} 🖋️)`)}</button>
                `;
                card.appendChild(textContainer);

                card.onclick = () => {
                    if (unlocked) {
                        window.progression.selectTrail(trail.id);
                        this.renderSketchbookTabs('cosmetics');
                    } else {
                        if (window.progression.unlockTrailWithInk(trail.id)) {
                            this.renderSketchbookTabs('cosmetics');
                            window.soundEngine?.playPowerupCollect('multiball');
                        }
                    }
                };
                this.attachTactilePhysics(card);
                grid.appendChild(card);
                SketchItemRenderer.drawItemIllustration(canvas, 'trails', trail.id, unlocked);
            }
        }
    }

    toggleDebugConsole() {
        let debugPanel = document.getElementById('sketchoidDebugPanel');
        if (!debugPanel) {
            debugPanel = document.createElement('div');
            debugPanel.id = 'sketchoidDebugPanel';
            debugPanel.className = 'debug-panel';
            debugPanel.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 6px; color: #fbbf24;">🛠️ SKETCHOID DEV TOOLS</div>
                <button id="dbgUnlockAll" class="btn-sketch btn-small" style="background: #10b981; color: #fff; font-weight: bold;">🔓 UNLOCK EVERYTHING (DEV)</button>
                <button id="dbgSkipLevel" class="btn-sketch btn-small">⏩ Skip Level</button>
                <button id="dbgAddInk" class="btn-sketch btn-small">+500 🖋️ Ink</button>
                <button id="dbgAddXp" class="btn-sketch btn-small">+1000 XP</button>
                <button id="dbgMultiball" class="btn-sketch btn-small">⚡ Multiball</button>
                <button id="dbgLaser" class="btn-sketch btn-small">🔫 Lasers</button>
                <button id="dbgKillBoss" class="btn-sketch btn-small">💀 Kill Boss</button>
                <button id="dbgResetSave" class="btn-sketch btn-small" style="color: #f43f5e;">🔄 Reset Save</button>
            `;
            document.body.appendChild(debugPanel);

            document.getElementById('dbgUnlockAll')?.addEventListener('click', () => {
                window.progression?.unlockAllDevMode();
                this.updateHUD();
                this.renderSketchbookTabs('chapters');
            });
            document.getElementById('dbgSkipLevel')?.addEventListener('click', () => this.nextLevel());
            document.getElementById('dbgAddInk')?.addEventListener('click', () => {
                window.progression?.addInk(500);
                this.updateHUD();
            });
            document.getElementById('dbgAddXp')?.addEventListener('click', () => {
                window.progression?.addXp(1000);
                this.updateHUD();
            });
            document.getElementById('dbgMultiball')?.addEventListener('click', () => this.applyPowerup('multiball'));
            document.getElementById('dbgLaser')?.addEventListener('click', () => this.applyPowerup('laser'));
            document.getElementById('dbgKillBoss')?.addEventListener('click', () => {
                if (this.boss && this.boss.isAlive) this.boss.takeDamage(100);
            });
            document.getElementById('dbgResetSave')?.addEventListener('click', () => {
                window.progression?.resetDevMode();
                this.updateHUD();
                this.renderSketchbookTabs('chapters');
            });
        } else {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'flex' : 'none';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.start();
});
