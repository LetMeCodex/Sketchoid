/**
 * SKETCHOID Main Game Engine & Controller
 * Rough.js hand-drawn rendering loop, physics, collisions, combo streaks & UI
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
        
        // Initialize Rough.js canvas safely
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

        // Game State
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, LEVEL_CLEAR, GAME_OVER, VICTORY
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('sketchoid_highscore') || localStorage.getItem('neo_arkanoid_highscore') || '0', 10);
        this.lives = 3;
        this.maxLives = 5;
        this.levelIndex = 0;
        this.currentLevel = null;
        this.isEndless = false;

        // Combo Multiplier System
        this.comboStreak = 0;
        this.maxComboStreak = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;

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

        // Time Dilation / SlowMo
        this.slowmoTimer = 0;
        this.timeScale = 1.0;

        // Boiling seed for canvas frame
        this.borderSeed = 42;
        this.borderSeedTimer = 0;

        // Frame timing
        this.lastTime = performance.now();

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
            }
        };
    }

    setupEventListeners() {
        // Mouse Controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            this.inputState.mouseX = (e.clientX - rect.left) * scaleX;
            this.inputState.isUsingMouse = true;
            this.paddle.targetX = this.inputState.mouseX - this.paddle.width / 2;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.handleActionTrigger();
            }
        });

        // Touch Controls
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

        // Keyboard Controls
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
            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            }
            if (e.code === 'KeyM') {
                this.toggleMute();
            }
            if (e.code === 'KeyT') {
                this.cycleTheme();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.inputState.left = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.inputState.right = false;
            }
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.inputState.space = false;
            }
        });

        // UI Button Bindings
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
        if (window.soundEngine) {
            window.soundEngine.init();
        }

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
            // Launch stuck balls
            let launchedAny = false;
            for (const ball of this.balls) {
                if (ball.isStuck) {
                    const launchAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
                    ball.launch(launchAngle);
                    window.soundEngine?.playPaddleBoing(0.3);
                    launchedAny = true;
                }
            }

            // Fire laser turrets if active
            if (this.paddle.hasLaser && !launchedAny) {
                const newLasers = this.paddle.fireLasers();
                if (newLasers) {
                    this.lasers.push(...newLasers);
                }
            }
        }
    }

    startGame(levelIdx = 0) {
        this.state = 'PLAYING';
        this.score = 0;
        this.lives = 3;
        this.levelIndex = levelIdx;
        this.isEndless = false;
        this.comboStreak = 0;
        this.maxComboStreak = 0;
        this.comboMultiplier = 1;
        this.loadLevel(this.levelIndex);
        this.hideAllModals();
        this.updateHUD();
    }

    startEndless() {
        this.state = 'PLAYING';
        this.score = 0;
        this.lives = 3;
        this.levelIndex = 1;
        this.isEndless = true;
        this.comboStreak = 0;
        this.maxComboStreak = 0;
        this.comboMultiplier = 1;
        this.loadLevel(this.levelIndex);
        this.hideAllModals();
        this.updateHUD();
    }

    restartCurrentGame() {
        if (this.isEndless) {
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
            if (muteBtn) {
                muteBtn.innerHTML = isMuted ? '🔇 Unmute' : '🔊 Sound';
            }
        }
    }

    cycleTheme() {
        const themeKeys = Object.keys(THEMES);
        const nextIdx = (themeKeys.indexOf(this.currentThemeKey) + 1) % themeKeys.length;
        this.currentThemeKey = themeKeys[nextIdx];
        this.theme = THEMES[this.currentThemeKey];

        document.body.className = `theme-${this.currentThemeKey}`;
        const themeBtn = document.getElementById('btnTheme');
        if (themeBtn) {
            themeBtn.innerText = `🎨 ${this.theme.name}`;
        }
    }

    loadLevel(index) {
        window.particleSystem?.reset();
        this.lasers = [];
        this.powerups = [];
        this.safetyNet.isActive = false;

        // Reset paddle & spawn stuck ball
        this.paddle.reset(this.width, this.height);
        this.balls = [new Ball(this.paddle.x + this.paddle.width / 2, this.paddle.y - 12)];

        if (this.isEndless) {
            this.currentLevel = window.generateProceduralLevel(this.levelIndex);
        } else {
            const levelData = window.LEVELS[index % window.LEVELS.length];
            this.currentLevel = levelData;
        }

        // Build bricks matrix
        this.bricks = [];
        const rows = this.currentLevel.rows;
        const totalRows = rows.length;
        const totalCols = rows[0].length;

        const brickMargin = 5;
        const topOffset = 70;
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

        // Animate Level Banner
        const levelTitleElem = document.getElementById('hudLevelName');
        if (levelTitleElem) {
            levelTitleElem.innerText = this.currentLevel.name;
        }
    }

    nextLevel() {
        if (this.isEndless) {
            this.levelIndex++;
            this.loadLevel(this.levelIndex);
            this.state = 'PLAYING';
            this.hideAllModals();
        } else {
            this.levelIndex++;
            if (this.levelIndex >= window.LEVELS.length) {
                // Victory!
                this.state = 'VICTORY';
                window.soundEngine?.playLevelClear();
                document.getElementById('modalVictory')?.classList.remove('hidden');
                const vicScore = document.getElementById('victoryFinalScore');
                if (vicScore) vicScore.innerText = this.score;
            } else {
                this.loadLevel(this.levelIndex);
                this.state = 'PLAYING';
                this.hideAllModals();
            }
        }
        this.updateHUD();
    }

    hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
    }

    checkLevelClear() {
        const remainingDestructible = this.bricks.filter(b => b.isAlive && !b.unbreakable);
        if (remainingDestructible.length === 0 && this.state === 'PLAYING') {
            this.state = 'LEVEL_CLEAR';
            window.soundEngine?.playLevelClear();
            window.particleSystem?.addShake(8, 0.4);

            // Award level clear bonus
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
        window.soundEngine?.playBallLost();
        window.particleSystem?.addShake(6, 0.3);
        this.lives--;
        this.comboStreak = 0;
        this.comboMultiplier = 1;
        this.updateHUD();

        if (this.lives <= 0) {
            this.state = 'GAME_OVER';
            window.soundEngine?.playGameOver();
            document.getElementById('modalGameOver')?.classList.remove('hidden');
            const goScore = document.getElementById('gameOverFinalScore');
            if (goScore) goScore.innerText = this.score;
        } else {
            // Respawn paddle and ball
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
                    const angle1 = Math.atan2(ball.vy, ball.vx) + 0.35;
                    const angle2 = Math.atan2(ball.vy, ball.vx) - 0.35;
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
        } else if (type === 'fireball') {
            for (const ball of this.balls) {
                ball.setFireball(10);
            }
        } else if (type === 'shield') {
            this.safetyNet.activate(2);
        } else if (type === 'slowmo') {
            this.slowmoTimer = 8;
            this.timeScale = 0.6;
        }
    }

    /**
     * Trigger explosive chain reaction for Ruby Bricks
     */
    triggerRubyNuke(centerBrick) {
        window.soundEngine?.playExplosion(true);
        window.particleSystem?.addShake(10, 0.35);

        const explosionRadius = 90;
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
                        const earnedPts = brick.score * this.comboMultiplier;
                        this.addScore(earnedPts);
                        window.particleSystem?.addFloatingText(`+${earnedPts}`, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, 1.1);
                        if (brick.dropsPowerup) {
                            this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                        }
                    }
                }
            }
        }
    }

    update(dt) {
        // Handle SlowMo timer
        if (this.slowmoTimer > 0) {
            this.slowmoTimer -= dt;
            this.timeScale = 0.6;
            if (this.slowmoTimer <= 0) {
                this.timeScale = 1.0;
            }
        }

        const effectiveDt = dt * this.timeScale;

        // Boiling frame border seed
        this.borderSeedTimer += dt;
        if (this.borderSeedTimer > 0.08) {
            this.borderSeedTimer = 0;
            this.borderSeed = (this.borderSeed + 223) % 10000;
        }

        if (this.state === 'PLAYING') {
            // 1. Update Paddle
            this.paddle.update(effectiveDt, this.inputState);

            // 2. Update Safety Net
            this.safetyNet.update(effectiveDt);

            // 3. Update Bricks
            for (const brick of this.bricks) {
                brick.update(effectiveDt);
            }

            // 4. Update Lasers
            for (let i = this.lasers.length - 1; i >= 0; i--) {
                const laser = this.lasers[i];
                laser.update(effectiveDt);

                // Laser vs Bricks collision
                let hitBrick = false;
                for (const brick of this.bricks) {
                    if (brick.isAlive && 
                        laser.x >= brick.x && laser.x <= brick.x + brick.width &&
                        laser.y >= brick.y && laser.y <= brick.y + brick.height) {
                        
                        hitBrick = true;
                        const destroyed = brick.takeDamage(1);
                        window.particleSystem?.createLaserSparks(laser.x, laser.y, '#ff0055', 6);
                        
                        if (destroyed) {
                            window.soundEngine?.playExplosion(brick.isExplosive);
                            window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id);
                            const earnedPts = brick.score * this.comboMultiplier;
                            this.addScore(earnedPts);
                            window.particleSystem?.addFloatingText(`+${earnedPts}`, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, 1.1);

                            if (brick.isExplosive) {
                                this.triggerRubyNuke(brick);
                            }
                            if (brick.dropsPowerup) {
                                this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                            }
                        } else {
                            window.soundEngine?.playBrickChime(this.comboStreak, brick.config.id);
                        }
                        break;
                    }
                }

                if (hitBrick || !laser.isAlive) {
                    this.lasers.splice(i, 1);
                }
            }

            // 5. Update Powerup Capsules
            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const pow = this.powerups[i];
                pow.update(effectiveDt, this.height);

                // Check collision with Paddle
                if (pow.x >= this.paddle.x && pow.x <= this.paddle.x + this.paddle.width &&
                    pow.y >= this.paddle.y - 10 && pow.y <= this.paddle.y + this.paddle.height + 5) {
                    
                    this.applyPowerup(pow.type);
                    this.powerups.splice(i, 1);
                    continue;
                }

                if (!pow.isAlive) {
                    this.powerups.splice(i, 1);
                }
            }

            // 6. Update Balls & Collisions
            for (let i = this.balls.length - 1; i >= 0; i--) {
                const ball = this.balls[i];
                ball.update(effectiveDt, this.width, this.height, this.paddle);

                if (!ball.isAlive) {
                    this.balls.splice(i, 1);
                    continue;
                }

                // Ball vs Safety Net Trampoline
                if (this.safetyNet.isActive && !ball.isStuck && ball.y + ball.radius >= this.safetyNet.y) {
                    ball.y = this.safetyNet.y - ball.radius;
                    ball.vy = -Math.abs(ball.vy);
                    this.safetyNet.bounce();
                }

                // Ball vs Paddle Collision
                if (!ball.isStuck && ball.vy > 0 &&
                    ball.y + ball.radius >= this.paddle.y &&
                    ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
                    ball.x + ball.radius >= this.paddle.x &&
                    ball.x - ball.radius <= this.paddle.x + this.paddle.width) {

                    // Calculate impact offset (-1.0 to 1.0)
                    const paddleCenter = this.paddle.x + this.paddle.width / 2;
                    const impactOffset = (ball.x - paddleCenter) / (this.paddle.width / 2);
                    const clampedOffset = Math.max(-0.95, Math.min(0.95, impactOffset));

                    // Launch angle with paddle velocity slice
                    const bounceAngle = -Math.PI / 2 + clampedOffset * 1.05 + this.paddle.vx * 0.05;
                    const clampedAngle = Math.max(-Math.PI * 0.88, Math.min(-Math.PI * 0.12, bounceAngle));

                    ball.vx = Math.cos(clampedAngle) * ball.speed;
                    ball.vy = Math.sin(clampedAngle) * ball.speed;
                    ball.y = this.paddle.y - ball.radius - 1;

                    // Elastic squash & sound
                    this.paddle.triggerSquash(clampedOffset);
                    window.soundEngine?.playPaddleBoing(Math.abs(clampedOffset));
                    window.particleSystem?.createPaddleHitSparks(ball.x, this.paddle.y, this.paddle.vx);

                    // Reset combo streak on paddle catch (rewards long continuous air combos!)
                    this.comboStreak = 0;
                    this.comboMultiplier = 1;
                    this.updateHUD();
                }

                // Ball vs Bricks Collision
                for (const brick of this.bricks) {
                    if (!brick.isAlive) continue;

                    // Bounding box overlap test
                    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
                    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
                    const distX = ball.x - closestX;
                    const distY = ball.y - closestY;
                    const distance = Math.hypot(distX, distY);

                    if (distance < ball.radius) {
                        // Collision Occurred!
                        if (!ball.isFireball) {
                            // Determine bounce normal
                            const overlapLeft = (ball.x + ball.radius) - brick.x;
                            const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
                            const overlapTop = (ball.y + ball.radius) - brick.y;
                            const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);

                            const minOverlapX = Math.min(overlapLeft, overlapRight);
                            const minOverlapY = Math.min(overlapTop, overlapBottom);

                            if (minOverlapX < minOverlapY) {
                                ball.vx = -ball.vx;
                                ball.x += (overlapLeft < overlapRight ? -minOverlapX : minOverlapX) * 0.5;
                            } else {
                                ball.vy = -ball.vy;
                                ball.y += (overlapTop < overlapBottom ? -minOverlapY : minOverlapY) * 0.5;
                            }
                        }

                        // Damage Brick
                        const dmg = ball.isFireball ? 3 : 1;
                        const destroyed = brick.takeDamage(dmg);

                        // Combo Multiplier Streak logic
                        this.comboStreak++;
                        if (this.comboStreak > this.maxComboStreak) {
                            this.maxComboStreak = this.comboStreak;
                        }
                        this.comboMultiplier = 1 + Math.floor(this.comboStreak / 3);

                        // Pentatonic chime playback
                        window.soundEngine?.playBrickChime(this.comboStreak, brick.config.id);

                        if (destroyed) {
                            window.soundEngine?.playExplosion(brick.isExplosive);
                            window.particleSystem?.createBrickExplosion(brick.x, brick.y, brick.width, brick.height, brick.config.color, brick.config.id);
                            
                            const earnedPts = brick.score * this.comboMultiplier;
                            this.addScore(earnedPts);

                            // Floating score & combo popup
                            const isHighCombo = this.comboMultiplier > 1;
                            const comboText = isHighCombo ? `+${earnedPts} (x${this.comboMultiplier})` : `+${earnedPts}`;
                            window.particleSystem?.addFloatingText(comboText, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.config.color, isHighCombo ? 1.4 : 1.0, isHighCombo);

                            if (brick.isExplosive) {
                                this.triggerRubyNuke(brick);
                            }
                            if (brick.dropsPowerup) {
                                window.soundEngine?.playPowerupSpawn();
                                this.powerups.push(new PowerupCapsule(brick.x + brick.width / 2, brick.y + brick.height / 2));
                            }

                            this.checkLevelClear();
                        } else {
                            window.particleSystem?.createLaserSparks(ball.x, ball.y, brick.config.color, 4);
                        }

                        this.updateHUD();
                        break; // Only one brick collision per sub-frame per ball
                    }
                }
            }

            // Check if all balls were lost
            if (this.balls.length === 0) {
                this.handleBallLost();
            }
        } else if (this.state === 'MENU') {
            // Gentle paddle and stuck ball sway on Menu screen
            this.paddle.update(effectiveDt, this.inputState);
            if (this.balls[0]) {
                this.balls[0].update(effectiveDt, this.width, this.height, this.paddle);
            }
        }

        // 7. Update Particles & VFX
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
        
        // Hand-drawn heart lives
        if (livesElem) {
            let hearts = '';
            for (let i = 0; i < this.lives; i++) hearts += '❤️ ';
            livesElem.innerText = hearts || '💀';
        }

        if (comboElem && comboMultiplierElem) {
            if (this.comboStreak > 1) {
                comboElem.innerText = `${this.comboStreak} HITS`;
                comboMultiplierElem.innerText = `${this.comboMultiplier}x`;
                document.getElementById('hudComboContainer')?.classList.add('combo-active');
            } else {
                comboElem.innerText = `0 HITS`;
                comboMultiplierElem.innerText = `1x`;
                document.getElementById('hudComboContainer')?.classList.remove('combo-active');
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const rc = this.rc;
        const theme = this.theme;

        ctx.save();

        // 1. Apply Screen Shake & Trauma
        if (window.particleSystem) {
            const shake = window.particleSystem.shakeOffset;
            if (shake.x !== 0 || shake.y !== 0 || shake.rotation !== 0) {
                ctx.translate(this.width / 2, this.height / 2);
                ctx.rotate(shake.rotation);
                ctx.translate(-this.width / 2 + shake.x, -this.height / 2 + shake.y);
            }
        }

        // 2. Clear canvas with background color
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // 3. Draw Sketchy Grid Pattern (Architectural Blueprint / Graph Paper)
        ctx.strokeStyle = theme.gridColor;
        ctx.lineWidth = 1;
        const gridSize = 24;
        ctx.beginPath();
        for (let x = gridSize; x < this.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
        }
        for (let y = gridSize; y < this.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
        }
        ctx.stroke();

        // 4. Draw Hand-Drawn Boiling Arena Border
        rc.rectangle(4, 4, this.width - 8, this.height - 8, {
            seed: this.borderSeed,
            roughness: 1.6,
            bowing: 1.8,
            stroke: theme.borderStroke,
            strokeWidth: 3
        });

        // 5. Draw Safety Trampoline Net
        this.safetyNet.draw(ctx, rc, theme);

        // 6. Draw Bricks
        for (const brick of this.bricks) {
            brick.draw(ctx, rc, theme);
        }

        // 7. Draw Powerups
        for (const pow of this.powerups) {
            pow.draw(ctx, rc, theme);
        }

        // 8. Draw Laser Beams
        for (const laser of this.lasers) {
            laser.draw(ctx, rc, theme);
        }

        // 9. Draw Paddle
        this.paddle.draw(ctx, rc, theme);

        // 10. Draw Kinetic Balls
        for (const ball of this.balls) {
            ball.draw(ctx, rc, theme);
        }

        // 11. Draw Particle Debris, Shockwaves, and Floating Scores
        window.particleSystem?.draw(ctx, rc, theme);

        ctx.restore();
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

// Instantiate Game on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.start();
});
