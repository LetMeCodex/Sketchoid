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

        this.currentThemeKey = 'parchment';
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
        this.logo3d = new Sketchoid3DLogo(document.getElementById('sketchoid-3d-logo'));
        this.themeToggle = new ThemeToggle(document.getElementById('theme-toggle-btn'), this);
        this.setupResponsiveResolution();
        this.loadLevel(0);
        this.updateHUD();
        ModalArtRenderer.drawHeaderDiorama(document.getElementById('menu-art-canvas'), 'menu');
    }

    setupResponsiveResolution() {
        const updateSize = () => {
            const isMobile = window.innerWidth <= 768 || window.innerHeight > window.innerWidth;
            if (isMobile) {
                // Tall mobile portrait: 460 coordinate width, dynamic height matching phone viewport
                const headerH = document.querySelector('header')?.offsetHeight || 36;
                const hudH = document.querySelector('.hud-bar')?.offsetHeight || 40;
                const availableH = window.innerHeight - headerH - hudH - 10;
                const availableW = window.innerWidth - 8;
                
                const targetW = 460;
                const aspect = Math.max(1.35, Math.min(1.95, availableH / Math.max(1, availableW)));
                const targetH = Math.round(targetW * aspect);

                if (this.width !== targetW || this.height !== targetH) {
                    this.width = targetW;
                    this.height = targetH;
                    this.canvas.width = this.width;
                    this.canvas.height = this.height;

                    this.camera?.resize(this.width, this.height);
                    this.physicsWorld?.resize(this.width, this.height);
                    this.sketchbook?.resize(this.width, this.height);
                    this.inputManager?.resize(this.width, this.height);
                    this.paddle?.resize(this.width, this.height);
                    this.safetyNet?.resize(this.width, this.height);

                    if (this.currentLevel) {
                        this.loadLevel(this.levelIndex);
                    }
                }
            } else {
                // Desktop Landscape: 800 x 640
                const targetW = 800;
                const targetH = 640;
                if (this.width !== targetW || this.height !== targetH) {
                    this.width = targetW;
                    this.height = targetH;
                    this.canvas.width = this.width;
                    this.canvas.height = this.height;

                    this.camera?.resize(this.width, this.height);
                    this.physicsWorld?.resize(this.width, this.height);
                    this.sketchbook?.resize(this.width, this.height);
                    this.inputManager?.resize(this.width, this.height);
                    this.paddle?.resize(this.width, this.height);
                    this.safetyNet?.resize(this.width, this.height);

                    if (this.currentLevel) {
                        this.loadLevel(this.levelIndex);
                    }
                }
            }
        };

        window.addEventListener('resize', () => updateSize());
        window.addEventListener('orientationchange', () => setTimeout(updateSize, 100));
        updateSize();
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
        document.getElementById('btnMute')?.addEventListener('click', () => this.toggleMute());
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
        const modal = document.getElementById('modalMenu');
        if (modal) {
            window.motionEngine?.openModal(modal, modal.querySelector('.modal-card'));
        }
        ModalArtRenderer.drawHeaderDiorama(document.getElementById('menu-art-canvas'), 'menu');
        this.loadLevel(0);
        this.updateHUD();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            const modal = document.getElementById('modalPause');
            if (modal) {
                window.motionEngine?.openModal(modal, modal.querySelector('.modal-card'));
            }
            ModalArtRenderer.drawHeaderDiorama(document.getElementById('pause-art-canvas'), 'pause');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            const modal = document.getElementById('modalPause');
            if (modal) {
                window.motionEngine?.closeModal(modal, modal.querySelector('.modal-card'));
            }
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

        const isMobile = this.width < 600;
        const brickMargin = isMobile ? 3 : 5;
        const topOffset = this.boss ? (isMobile ? 150 : 150) : (isMobile ? 75 : 70);
        const sidePadding = isMobile ? 20 : 40;
        const totalUsableWidth = this.width - sidePadding * 2;
        const brickW = (totalUsableWidth - (totalCols - 1) * brickMargin) / totalCols;
        const brickH = isMobile ? 32 : 24;

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

            // Record Part 2 Retention, Daily, Mission & Artist Board Runs
            window.dailySketchEngine?.recordProgress('stage_cleared', this.livesLostThisLevel);
            window.missionEngine?.recordProgress('stage_cleared', 1);
            if (isFlawless) window.missionEngine?.recordProgress('flawless_clear', 1);
            window.artistBoardEngine?.recordPlayerRun('score', this.score);
            window.artistBoardEngine?.recordPlayerRun('style', this.styleScore);
            window.artistBoardEngine?.recordPlayerRun('combo', this.maxComboStreak);
            window.artistBoardEngine?.recordPlayerRun('ink', this.sessionInkEarned);

            if (this.currentLevel.bossType === 'ink' && isFlawless) {
                window.progression?.unlockSecret('sec_living_ink_clean');
            }

            window.telemetry?.track('level_complete', {
                levelId: this.currentLevel.id,
                score: this.score,
                stars: completionResult?.stars || 1
            });

            setTimeout(() => {
                if (this.state === 'LEVEL_CLEAR') {
                    const modal = document.getElementById('modalLevelClear');
                    if (modal) {
                        window.motionEngine?.openModal(modal, modal.querySelector('.modal-card'));
                    }
                    ModalArtRenderer.drawHeaderDiorama(document.getElementById('clear-art-canvas'), 'clear');
                    const cScore = document.getElementById('clearScore');
                    const cCombo = document.getElementById('clearCombo');
                    const cStars = document.getElementById('clearStarsDisplay');
                    const cInk = document.getElementById('clearInkReward');
                    const cXp = document.getElementById('clearXpReward');

                    if (cScore) window.motionEngine?.animateNumberRoll(cScore, this.score);
                    if (cCombo) cCombo.innerText = `${this.maxComboStreak}x`;
                    if (cInk) cInk.innerText = `+${earnedInk} Ink`;
                    if (cXp) cXp.innerText = `+${earnedXp} XP`;

                    if (cStars) {
                        const count = completionResult?.stars || 1;
                        let starText = '';
                        for (let s = 0; s < 3; s++) {
                            starText += s < count ? '★ ' : '☆ ';
                        }
                        cStars.innerText = `[ ${starText.trim()} ]`;
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

            // Record Artist Board Runs on Defeat
            window.artistBoardEngine?.recordPlayerRun('score', this.score);
            window.artistBoardEngine?.recordPlayerRun('style', this.styleScore);
            window.artistBoardEngine?.recordPlayerRun('combo', this.maxComboStreak);
            window.artistBoardEngine?.recordPlayerRun('ink', this.sessionInkEarned);

            const modal = document.getElementById('modalGameOver');
            if (modal) {
                window.motionEngine?.openModal(modal, modal.querySelector('.modal-card'));
            }
            ModalArtRenderer.drawHeaderDiorama(document.getElementById('gameover-art-canvas'), 'gameover');
            const goScore = document.getElementById('gameOverFinalScore');
            const goStyle = document.getElementById('gameOverStyleScore');
            const goCombo = document.getElementById('gameOverMaxCombo');
            const goInk = document.getElementById('gameOverInkEarned');
            const goXp = document.getElementById('gameOverXpEarned');

            if (goScore) window.motionEngine?.animateNumberRoll(goScore, this.score);
            if (goStyle) window.motionEngine?.animateNumberRoll(goStyle, this.styleScore);
            if (goCombo) goCombo.innerText = `${this.maxComboStreak}x`;
            if (goInk) goInk.innerText = `+${this.sessionInkEarned} Ink`;
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
            let pips = '';
            for (let i = 0; i < this.lives; i++) pips += '■ ';
            livesElem.innerText = `[ ${pips.trim() || 'EXPENDED'} ]`;
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
        if (document.hidden) {
            this.lastTime = currentTime;
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        const rawDt = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0.016;
        const dt = Math.min(Math.max(0, rawDt), 0.05);
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    start() {
        document.addEventListener('visibilitychange', () => {
            this.lastTime = performance.now();
        });

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
        window.motionEngine?.openModal(modal, modal.querySelector('.modal-card'));
    }

    renderSketchbookTabs(activeTab = 'chapters') {
        const grid = document.getElementById('collectionItemsGrid');
        if (!grid || !window.progression) return;

        // Update tab buttons active state
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (activeTab === 'chapters') document.getElementById('tabChapters')?.classList.add('active');
        if (activeTab === 'daily') document.getElementById('tabDaily')?.classList.add('active');
        if (activeTab === 'artist_board') document.getElementById('tabArtistBoard')?.classList.add('active');
        if (activeTab === 'archive') document.getElementById('tabArchive')?.classList.add('active');
        if (activeTab === 'identity') document.getElementById('tabIdentity')?.classList.add('active');
        if (activeTab === 'season') document.getElementById('tabSeason')?.classList.add('active');

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

                SketchItemRenderer.drawItemIllustration(canvas, 'bosses', i === 2 ? 'eraser' : (i === 3 ? 'ink' : (i === 4 ? 'pencil' : 'emerald')), true);
            }
        } else if (activeTab === 'daily') {
            const daily = window.dailySketchEngine?.getDailyChallenge();
            const streak = window.streakEngine?.getStreakData() || { current: 0, highest: 0 };

            // 1. Daily Sketch Banner
            const banner = document.createElement('div');
            banner.className = 'daily-sketch-banner';
            const progress = Math.min(window.dailySketchEngine?.activeProgress || 0, daily.target);
            const pct = Math.round((progress / daily.target) * 100);
            banner.innerHTML = `
                <div class="daily-page-tag">TODAY'S SKETCH &bull; PAGE #${daily.pageNumber} &bull; ${daily.date}</div>
                <div class="daily-title">${daily.title}</div>
                <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 6px;">${daily.desc}</div>
                <div class="daily-progress-bar">
                    <div class="daily-progress-fill" style="width: ${daily.isCompleted ? 100 : pct}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span style="font-family: var(--font-mono); font-size: 0.85rem; color: #38bdf8;">+${daily.inkReward} Ink &bull; +${daily.xpReward} XP</span>
                    <button id="btnDailyStart" class="btn-sketch btn-small" style="background: ${daily.isCompleted ? '#10b981' : '#0284c7'}; color: #fff;">${daily.isCompleted ? 'CERTIFIED ✓' : 'START SKETCH'}</button>
                </div>
            `;
            grid.appendChild(banner);
            banner.querySelector('#btnDailyStart')?.addEventListener('click', () => {
                if (!daily.isCompleted) {
                    this.hideAllModals();
                    window.dailySketchEngine?.startDailyChallenge(this);
                }
            });

            // 2. 7-Day Notebook Calendar
            const calSection = document.createElement('div');
            calSection.className = 'calendar-section';
            calSection.innerHTML = `
                <div style="font-weight: bold; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 4px;">7-DAY SKETCH CALENDAR (Streak: ${streak.current} Days)</div>
                <div class="calendar-grid">
                    ${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, idx) => `
                        <div class="calendar-day-box ${idx < streak.current ? 'completed-day' : (idx === streak.current ? 'active-day' : '')}">
                            <div>${day}</div>
                            <div style="font-size: 1.1rem; margin-top: 4px;">${idx < streak.current ? '✓' : '□'}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            grid.appendChild(calSection);

            // 3. Daily Missions
            const misHeader = document.createElement('div');
            misHeader.className = 'cosmetic-section-header';
            misHeader.style.gridColumn = '1 / -1';
            misHeader.innerHTML = `<h3>DAILY MISSIONS (3 Active)</h3>`;
            grid.appendChild(misHeader);

            const missions = window.missionEngine?.getDailyMissions() || [];
            missions.forEach(m => {
                const card = document.createElement('div');
                card.className = `mission-card ${m.completed ? 'completed' : ''}`;
                card.style.gridColumn = '1 / -1';
                card.innerHTML = `
                    <div>
                        <div style="font-weight: bold; color: var(--text-primary);">${m.title}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">[ ${Math.min(m.current, m.target)} / ${m.target} ] &bull; +${m.ink} Ink &bull; +${m.xp} XP</div>
                    </div>
                    <span style="font-weight: bold; color: ${m.completed ? '#10b981' : '#38bdf8'}; font-family: var(--font-mono);">${m.completed ? '✓ DONE' : 'IN PROGRESS'}</span>
                `;
                grid.appendChild(card);
            });
        } else if (activeTab === 'artist_board') {
            const boardContainer = document.createElement('div');
            boardContainer.className = 'artist-board-container';

            const activeCat = this.currentBoardCat || 'score';
            const cohort = window.artistBoardEngine?.getCohort(activeCat) || [];

            boardContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">WEEKLY ARTIST BOARD</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">LEAGUE OF THE LIVING SKETCHBOOK &bull; 60Hz VERIFIED</div>
                    </div>
                    <span class="rank-stamp" style="color: #fbbf24;">TOP 5% &bull; GOLDEN INK</span>
                </div>
                <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;">
                    ${['score', 'combo', 'style', 'speed', 'perfect', 'ink'].map(c => `
                        <button class="tab-btn ${c === activeCat ? 'active' : ''}" onclick="window.game.currentBoardCat = '${c}'; window.game.renderSketchbookTabs('artist_board');">${c.toUpperCase()}</button>
                    `).join('')}
                </div>
                <table class="board-table">
                    <thead>
                        <tr>
                            <th>RANK</th>
                            <th>DRAFTER</th>
                            <th>TITLE</th>
                            <th style="text-align: right;">RECORD</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cohort.slice(0, 10).map(entry => `
                            <tr class="${entry.isPlayer ? 'board-row-player' : ''}">
                                <td>#${entry.rank}</td>
                                <td>${entry.name}</td>
                                <td style="font-family: var(--font-mono); font-size: 0.75rem;">${entry.title}</td>
                                <td style="text-align: right; font-weight: bold;">${entry.value.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            grid.appendChild(boardContainer);
        } else if (activeTab === 'archive') {
            const stats = window.progression.getCollectionStats();

            // 1. Overall Completion Progress Bar
            const barBox = document.createElement('div');
            barBox.className = 'archive-progress-container';
            barBox.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: var(--text-primary);">ARCHIVE COMPLETION</span>
                    <span style="font-family: var(--font-mono); font-weight: bold; color: #38bdf8;">${stats.overall.count} / ${stats.overall.total} (${stats.overall.percentage}%)</span>
                </div>
                <div class="daily-progress-bar">
                    <div class="daily-progress-fill" style="width: ${stats.overall.percentage}%;"></div>
                </div>
                <div style="margin-top: 6px;">
                    ${[25, 50, 75, 100].map(tier => {
                        const claimed = pData.collectionMilestonesClaimed?.includes(tier);
                        const ready = stats.overall.percentage >= tier;
                        return `
                            <span class="milestone-reward-pill ${claimed ? 'claimed' : ''}" onclick="window.progression.claimCollectionMilestone(${tier}); window.game.renderSketchbookTabs('archive');">
                                ${tier}%: ${claimed ? '✓ CLAIMED' : (ready ? 'CLAIM BONUS' : 'LOCKED')}
                            </span>
                        `;
                    }).join('')}
                </div>
            `;
            grid.appendChild(barBox);

            // 2. Discoveries
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

            // 3. Secret Discoveries
            const secHeader = document.createElement('div');
            secHeader.className = 'cosmetic-section-header';
            secHeader.style.gridColumn = '1 / -1';
            secHeader.innerHTML = `<h3>SECRET DISCOVERIES (${(pData.discoveredSecrets || []).length} / ${window.progression.secrets.length})</h3>`;
            grid.appendChild(secHeader);

            window.progression.secrets.forEach(sec => {
                const unlocked = (pData.discoveredSecrets || []).includes(sec.id);
                const card = document.createElement('div');
                card.className = `mission-card ${unlocked ? 'completed' : ''}`;
                card.style.gridColumn = '1 / -1';
                card.innerHTML = `
                    <div>
                        <div style="font-weight: bold; color: var(--text-primary);">${unlocked ? sec.name : 'Hidden Architect Secret'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${unlocked ? sec.desc : 'Unusual trajectory or mechanical action required.'}</div>
                    </div>
                    <span style="font-weight: bold; color: ${unlocked ? '#10b981' : '#64748b'}; font-family: var(--font-mono);">${unlocked ? '★ UNLOCKED' : 'UNDISCOVERED'}</span>
                `;
                grid.appendChild(card);
            });
        } else if (activeTab === 'identity') {
            const idBox = document.createElement('div');
            idBox.className = 'identity-profile-card';
            const idData = pData.identity || { name: 'ANISH', title: 'Ink Apprentice' };

            idBox.innerHTML = `
                <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">DRAFTER PROFILE</div>
                <div style="margin-top: 8px;">
                    <label style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">CALLIGRAPHY NAME</label><br>
                    <input id="inputDrafterName" class="identity-name-input" type="text" value="${idData.name}" maxlength="16">
                    <button id="btnSaveName" class="btn-sketch btn-small" style="margin-left: 6px;">SAVE</button>
                </div>
                <div style="margin-top: 12px;">
                    <label style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">ARTIST TITLE</label>
                    <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                        ${window.progression.titles.map(t => `
                            <button class="tab-btn ${idData.title === t.name ? 'active' : ''}" onclick="window.progression.selectTitle('${t.name}'); window.game.renderSketchbookTabs('identity');">${t.name}</button>
                        `).join('')}
                    </div>
                </div>
                <div style="margin-top: 12px;">
                    <label style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">OFFICIAL ARCHITECT SIGNATURE</label>
                    <div class="signature-preview">Certified by Drafter ${idData.name}</div>
                </div>
            `;
            grid.appendChild(idBox);
            idBox.querySelector('#btnSaveName')?.addEventListener('click', () => {
                const val = idBox.querySelector('#inputDrafterName')?.value;
                window.progression.setPlayerName(val);
                this.renderSketchbookTabs('identity');
                window.particleSystem?.addFloatingText('NAME SAVED!', 400, 200, '#10b981', 1.8, true);
            });

            // Drawing Kit: Paddle Skins & Ball Trails
            const skinHeader = document.createElement('div');
            skinHeader.className = 'cosmetic-section-header';
            skinHeader.style.gridColumn = '1 / -1';
            skinHeader.innerHTML = `<h3>DRAWING KIT &bull; PADDLE SKINS</h3>`;
            grid.appendChild(skinHeader);

            for (const skin of window.progression.skins) {
                const unlocked = pData.unlockedSkins.includes(skin.id);
                const equipped = pData.player.selectedSkin === skin.id || pData.selectedSkin === skin.id;
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
                    <button class="btn-sketch btn-small" style="margin-top: 8px; pointer-events: none;">${equipped ? 'EQUIPPED ✓' : (unlocked ? 'EQUIP' : `UNLOCK (${skin.cost} Ink)`)}</button>
                `;
                card.appendChild(textContainer);

                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (unlocked) {
                        window.progression.selectSkin(skin.id);
                        window.soundEngine?.playWallTick();
                        window.particleSystem?.addFloatingText(`EQUIPPED: ${skin.name}`, 400, 220, '#10b981', 1.5, true);
                        this.renderSketchbookTabs('identity');
                    } else if (window.progression.unlockSkinWithInk(skin.id)) {
                        window.soundEngine?.playLevelClear();
                        window.particleSystem?.addFloatingText(`UNLOCKED: ${skin.name}!`, 400, 220, '#fbbf24', 1.8, true);
                        this.renderSketchbookTabs('identity');
                    } else {
                        window.particleSystem?.addFloatingText(`NOT ENOUGH INK! (${skin.cost} needed)`, 400, 220, '#ef4444', 1.5, true);
                    }
                });

                grid.appendChild(card);
                SketchItemRenderer.drawItemIllustration(canvas, 'skins', skin.id, unlocked);
            }

            const trailHeader = document.createElement('div');
            trailHeader.className = 'cosmetic-section-header';
            trailHeader.style.gridColumn = '1 / -1';
            trailHeader.style.marginTop = '12px';
            trailHeader.innerHTML = `<h3>DRAWING KIT &bull; BALL TRAILS</h3>`;
            grid.appendChild(trailHeader);

            for (const trail of window.progression.trails) {
                const unlocked = pData.unlockedTrails.includes(trail.id);
                const equipped = pData.player.selectedTrail === trail.id || pData.selectedTrail === trail.id;
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
                    <button class="btn-sketch btn-small" style="margin-top: 8px; pointer-events: none;">${equipped ? 'EQUIPPED ✓' : (unlocked ? 'EQUIP' : `UNLOCK (${trail.cost} Ink)`)}</button>
                `;
                card.appendChild(textContainer);

                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (unlocked) {
                        window.progression.selectTrail(trail.id);
                        window.soundEngine?.playWallTick();
                        window.particleSystem?.addFloatingText(`EQUIPPED: ${trail.name}`, 400, 220, '#10b981', 1.5, true);
                        this.renderSketchbookTabs('identity');
                    } else if (window.progression.unlockTrailWithInk(trail.id)) {
                        window.soundEngine?.playLevelClear();
                        window.particleSystem?.addFloatingText(`UNLOCKED: ${trail.name}!`, 400, 220, '#fbbf24', 1.8, true);
                        this.renderSketchbookTabs('identity');
                    } else {
                        window.particleSystem?.addFloatingText(`NOT ENOUGH INK! (${trail.cost} needed)`, 400, 220, '#ef4444', 1.5, true);
                    }
                });

                grid.appendChild(card);
                SketchItemRenderer.drawItemIllustration(canvas, 'trails', trail.id, unlocked);
            }
        } else if (activeTab === 'season') {
            const season = window.seasonalChapterEngine?.currentChapter;
            const progressXp = window.seasonalChapterEngine?.getProgress() || 0;

            const seasonTrack = document.createElement('div');
            seasonTrack.className = 'season-track-container';
            seasonTrack.innerHTML = `
                <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">${season.title}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${season.desc}</div>
                <div style="font-family: var(--font-mono); font-size: 0.8rem; color: #38bdf8; margin: 4px 0;">SEASON TOTAL DRAFTING XP: ${progressXp.toLocaleString()} / 15,000</div>
                <div class="daily-progress-bar">
                    <div class="daily-progress-fill" style="width: ${(progressXp / 15000) * 100}%;"></div>
                </div>
            `;
            grid.appendChild(seasonTrack);

            season.pages.forEach(p => {
                const unlocked = progressXp >= p.reqXp;
                const rewardId = `season_ch1_page_${p.page}`;
                const claimed = RewardClaimManager.isClaimed(rewardId);

                const card = document.createElement('div');
                card.className = `season-page-item ${unlocked ? 'unlocked' : ''}`;
                card.style.gridColumn = '1 / -1';
                card.innerHTML = `
                    <div>
                        <div style="font-weight: bold; color: var(--text-primary);">${p.desc}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">Requirement: ${p.reqXp.toLocaleString()} Total XP</div>
                    </div>
                    <button class="btn-sketch btn-small" style="background: ${claimed ? '#10b981' : (unlocked ? '#fbbf24' : '#1e293b')}; color: ${claimed || !unlocked ? '#fff' : '#0f172a'};" onclick="if(!'${claimed}' && ${unlocked}) { RewardClaimManager.claim('${rewardId}', ${JSON.stringify(p.reward).replace(/"/g, "'")}); window.game.renderSketchbookTabs('season'); }">
                        ${claimed ? '✓ CLAIMED' : (unlocked ? 'CLAIM' : 'LOCKED')}
                    </button>
                `;
                grid.appendChild(card);
            });
        }

        window.motionEngine?.animateGridStagger(grid);
    }

    openShareCardModal() {
        const modal = document.getElementById('modalShareCard');
        const container = document.getElementById('shareCardContainer');
        if (!modal || !container) return;

        container.innerHTML = '';
        const canvas = ShareCardGenerator.generateCertificate({
            score: this.score,
            combo: this.maxComboStreak
        });
        container.appendChild(canvas);

        window.motionEngine?.openModal(modal, modal.querySelector('.modal-card'));
    }

    downloadShareCard() {
        const container = document.getElementById('shareCardContainer');
        const canvas = container?.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `Sketchoid_Mastery_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        window.particleSystem?.addFloatingText('CERTIFICATE DOWNLOADED!', 400, 200, '#10b981', 2.0, true);
    }

    toggleDebugConsole() {
        let debugPanel = document.getElementById('sketchoidDebugPanel');
        if (!debugPanel) {
            debugPanel = document.createElement('div');
            debugPanel.id = 'sketchoidDebugPanel';
            debugPanel.className = 'debug-panel';
            debugPanel.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 6px; color: #38bdf8;">SKETCHOID DEV TOOLS</div>
                <button id="dbgUnlockAll" class="btn-sketch btn-small" style="background: #10b981; color: #fff; font-weight: bold;">UNLOCK EVERYTHING (DEV)</button>
                <button id="dbgSkipLevel" class="btn-sketch btn-small">Skip Level</button>
                <button id="dbgAddInk" class="btn-sketch btn-small">+500 Ink</button>
                <button id="dbgAddXp" class="btn-sketch btn-small">+1000 XP</button>
                <button id="dbgMultiball" class="btn-sketch btn-small">Multiball</button>
                <button id="dbgLaser" class="btn-sketch btn-small">Lasers</button>
                <button id="dbgKillBoss" class="btn-sketch btn-small">Kill Boss</button>
                <button id="dbgResetSave" class="btn-sketch btn-small" style="color: #f43f5e;">Reset Save</button>
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
