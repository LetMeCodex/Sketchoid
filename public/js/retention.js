/**
 * SKETCHOID Part 2: Retention, Daily Systems, Artist Board & Player Identity Engine
 * 100% Offline-First • Deterministic Daily Seeds • Anti-Abuse Safeguards • Zero Manipulative Mechanics
 */

/**
 * 1. PRNG & Deterministic Hashing Utilities
 */
function hashString(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}

function createPRNG(seed) {
    let s = seed >>> 0;
    return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getWeekId(d = new Date()) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * 2. Idempotent Reward & Anti-Abuse Claim Manager
 */
class RewardClaimManager {
    static isClaimed(rewardId) {
        if (!window.progression || !window.progression.data.claimedRewardIds) return false;
        return window.progression.data.claimedRewardIds.includes(rewardId);
    }

    static claim(rewardId, rewards = {}) {
        if (this.isClaimed(rewardId)) return false;
        if (!window.progression) return false;

        if (!window.progression.data.claimedRewardIds) {
            window.progression.data.claimedRewardIds = [];
        }
        window.progression.data.claimedRewardIds.push(rewardId);

        if (rewards.ink) window.progression.addInk(rewards.ink);
        if (rewards.xp) window.progression.addXp(rewards.xp);
        if (rewards.doodle) window.progression.unlockDoodle(rewards.doodle);
        if (rewards.title) window.progression.unlockTitle(rewards.title);
        if (rewards.skin) window.progression.unlockSkinDirect(rewards.skin);
        if (rewards.trail) window.progression.unlockTrailDirect(rewards.trail);

        window.progression.save();
        return true;
    }
}

/**
 * 3. Score & Time Validator (Anti-Cheat / Anti-Clock Tampering)
 */
class ScoreValidator {
    static validateRun(runData) {
        const { score, maxCombo, timeSeconds, bricksDestroyed } = runData;
        if (score < 0 || isNaN(score)) return false;
        if (maxCombo < 0 || maxCombo > 500) return false;
        if (timeSeconds < 2) return false; // Impossible to complete in under 2s
        if (score > 1000000) return false; // Sanity cap for standard run
        return true;
    }

    static checkTimeTampering(lastTimestamp) {
        const now = Date.now();
        // If current clock is more than 2 minutes behind last recorded save timestamp
        if (lastTimestamp && now < lastTimestamp - 120000) {
            console.warn('Clock roll-back detected. Clamping daily operations.');
            return false;
        }
        return true;
    }
}

/**
 * 4. Daily Sketch Engine (Flagship Deterministic Challenge Generator)
 */
class DailySketchEngine {
    constructor() {
        this.gameVersion = '2.0.0';
        this.activeChallenge = null;
        this.activeProgress = 0;
        this.isCompleted = false;

        this.archetypes = [
            { id: 'ricochet', title: 'THE RICOCHET', desc: 'Perform {target} side-wall bank shots.', targetMin: 12, targetMax: 25, inkReward: 250, xpReward: 500, icon: '📐' },
            { id: 'combo_artist', title: 'COMBO ARTIST', desc: 'Achieve an unbroken {target}x pentatonic combo.', targetMin: 10, targetMax: 20, inkReward: 260, xpReward: 520, icon: '🎵' },
            { id: 'ink_frenzy', title: 'INK FRENZY', desc: 'Demolish {target} crystal bricks in a single draft.', targetMin: 40, targetMax: 75, inkReward: 220, xpReward: 480, icon: '💥' },
            { id: 'perfect_page', title: 'PERFECT PAGE', desc: 'Complete Sector 2 without losing a single sphere.', targetMin: 1, targetMax: 1, targetLevel: 1, flawless: true, inkReward: 350, xpReward: 700, icon: '💎' },
            { id: 'speed_draw', title: 'SPEED DRAFTER', desc: 'Clear the sector in under {target} seconds.', targetMin: 45, targetMax: 70, inkReward: 280, xpReward: 550, icon: '⚡' },
            { id: 'power_draw', title: 'POWER MASTERY', desc: 'Collect and trigger {target} drafting capsules.', targetMin: 4, targetMax: 8, inkReward: 240, xpReward: 500, icon: '🛡️' },
            { id: 'ruby_detonator', title: 'RUBY DETONATOR', desc: 'Trigger {target} explosive Ruby chain reactions.', targetMin: 3, targetMax: 6, inkReward: 270, xpReward: 560, icon: '🔴' },
            { id: 'amethyst_crush', title: 'ARMORED BREAKER', desc: 'Shatter {target} heavy Amethyst crystal monoliths.', targetMin: 4, targetMax: 9, inkReward: 300, xpReward: 600, icon: '🟣' },
            { id: 'style_master', title: 'STYLE MASTER', desc: 'Accumulate {target} Style Points through high-angle trick shots.', targetMin: 600, targetMax: 1200, inkReward: 320, xpReward: 620, icon: '✨' },
            { id: 'one_ball_pure', title: 'ONE BALL CRAFTSMAN', desc: 'Clear Sector 3 with strictly 1 sphere and no powerups.', targetMin: 1, targetMax: 1, targetLevel: 2, lives: 1, disablePowerups: true, inkReward: 400, xpReward: 800, icon: '🎯' },
            { id: 'boss_takedown', title: 'THE VOID RUB-OUT', desc: 'Defeat The Eraser without letting balls fall below half arena.', targetMin: 1, targetMax: 1, targetLevel: 2, inkReward: 450, xpReward: 900, icon: '🧼' },
            { id: 'chaos_matrix', title: 'CHAOS BLUEPRINT', desc: 'Clear the stage while twin vortexes and rotating windmills distort trajectory.', targetMin: 1, targetMax: 1, chaosGeometry: true, inkReward: 380, xpReward: 750, icon: '🌪️' }
        ];
    }

    getDailyChallenge(dateStr = getTodayDateString()) {
        const seedStr = `${dateStr}_SKETCHOID_${this.gameVersion}`;
        const seed = hashString(seedStr);
        const prng = createPRNG(seed);

        const archIndex = Math.floor(prng() * this.archetypes.length);
        const arch = this.archetypes[archIndex];

        let target = arch.targetMin;
        if (arch.targetMax > arch.targetMin) {
            target = Math.floor(arch.targetMin + prng() * (arch.targetMax - arch.targetMin + 1));
        }

        // Calculate page number (Day of year)
        const dateObj = new Date(dateStr);
        const startOfYear = new Date(dateObj.getFullYear(), 0, 0);
        const diff = (dateObj - startOfYear) + ((startOfYear.getTimezoneOffset() - dateObj.getTimezoneOffset()) * 60 * 1000);
        const pageNumber = Math.floor(diff / (1000 * 60 * 60 * 24));

        const rewardId = `daily_${dateStr}_completion`;
        const isCompleted = RewardClaimManager.isClaimed(rewardId);

        return {
            date: dateStr,
            pageNumber: pageNumber || 218,
            id: `daily_${dateStr}`,
            rewardId: rewardId,
            archetypeId: arch.id,
            title: arch.title,
            desc: arch.desc.replace('{target}', target),
            target: target,
            inkReward: arch.inkReward,
            xpReward: arch.xpReward,
            targetLevel: arch.targetLevel !== undefined ? arch.targetLevel : (Math.floor(prng() * 3)),
            lives: arch.lives || 3,
            flawless: !!arch.flawless,
            disablePowerups: !!arch.disablePowerups,
            chaosGeometry: !!arch.chaosGeometry,
            isCompleted: isCompleted,
            seed: seed
        };
    }

    startDailyChallenge(game) {
        const challenge = this.getDailyChallenge();
        this.activeChallenge = challenge;
        this.activeProgress = 0;
        this.isCompleted = challenge.isCompleted;

        game.state = 'PLAYING';
        game.score = 0;
        game.styleScore = 0;
        game.lives = challenge.lives;
        game.levelIndex = challenge.targetLevel;
        game.isEndless = false;
        game.camera.reset();
        game.loadLevel(game.levelIndex);

        if (challenge.chaosGeometry) {
            game.geometryManager.windmills.push(
                new RotatingWindmill(200, 300, 75, 1.5, '#38bdf8'),
                new RotatingWindmill(600, 300, 75, 1.5, '#38bdf8')
            );
            game.geometryManager.vortexes.push(
                new GravityVortex(400, 240, 0.45, 110, '#a855f7')
            );
        }

        window.telemetry?.track('daily_sketch_started', { date: challenge.date, title: challenge.title });
        this.updateHUDObjective();
    }

    recordProgress(type, amount = 1) {
        if (!this.activeChallenge || this.isCompleted) return;

        const arch = this.activeChallenge.archetypeId;
        let matched = false;

        if (arch === 'ricochet' && type === 'bank_shot') matched = true;
        else if (arch === 'combo_artist' && type === 'combo' && amount >= this.activeChallenge.target) {
            this.activeProgress = this.activeChallenge.target;
            this.checkCompletion();
            return;
        } else if (arch === 'ink_frenzy' && type === 'brick_destroyed') matched = true;
        else if (arch === 'power_draw' && type === 'powerup_collected') matched = true;
        else if (arch === 'ruby_detonator' && type === 'ruby_nuke') matched = true;
        else if (arch === 'amethyst_crush' && type === 'amethyst_destroyed') matched = true;
        else if (arch === 'style_master' && type === 'style_points') {
            this.activeProgress += amount;
            this.checkCompletion();
            this.updateHUDObjective();
            return;
        } else if (arch === 'perfect_page' && type === 'stage_cleared' && amount === 0) { // amount is lives lost
            this.activeProgress = 1;
            this.checkCompletion();
            return;
        } else if ((arch === 'one_ball_pure' || arch === 'boss_takedown' || arch === 'chaos_matrix' || arch === 'speed_draw') && type === 'stage_cleared') {
            this.activeProgress = 1;
            this.checkCompletion();
            return;
        }

        if (matched) {
            this.activeProgress += amount;
            this.checkCompletion();
            this.updateHUDObjective();
        }
    }

    checkCompletion() {
        if (!this.activeChallenge || this.isCompleted) return;

        if (this.activeProgress >= this.activeChallenge.target) {
            this.isCompleted = true;
            this.completeDailyChallenge();
        }
    }

    completeDailyChallenge() {
        const challenge = this.activeChallenge;
        if (!challenge) return;

        const claimed = RewardClaimManager.claim(challenge.rewardId, {
            ink: challenge.inkReward,
            xp: challenge.xpReward
        });

        if (claimed) {
            window.streakEngine?.recordDailyCompletion();
            window.soundEngine?.playLevelClear();
            window.haptics?.success();
            window.particleSystem?.addFloatingText(`✓ TODAY'S SKETCH CERTIFIED! +${challenge.inkReward} Ink`, 400, 200, '#10b981', 2.2, true);
            window.telemetry?.track('daily_sketch_completed', { date: challenge.date, title: challenge.title });
        }
    }

    updateHUDObjective() {
        const hudObjective = document.getElementById('dailyHudObjective');
        if (!hudObjective) return;

        if (!this.activeChallenge) {
            hudObjective.style.display = 'none';
            return;
        }

        hudObjective.style.display = 'flex';
        const progress = Math.min(this.activeProgress, this.activeChallenge.target);
        hudObjective.innerHTML = `
            <span class="hud-label">TODAY'S SKETCH</span>
            <span class="hud-value" style="color: #38bdf8; font-size: 0.85rem;">${this.activeChallenge.title} [ ${progress} / ${this.activeChallenge.target} ]</span>
        `;
    }
}

/**
 * 5. Sketch Streak & Grace/Recovery Engine
 */
class StreakEngine {
    constructor() {
        this.milestoneRewards = {
            1: { ink: 100, xp: 150, desc: '+100 Ink' },
            2: { ink: 150, xp: 200, desc: '+150 Ink' },
            3: { ink: 200, xp: 300, doodle: 'doodle_star', desc: 'Doodle: Prismatic Star' },
            4: { ink: 250, xp: 350, desc: '+250 Ink' },
            5: { ink: 300, xp: 400, desc: 'Cosmetic Fragment (+300 Ink)' },
            6: { ink: 350, xp: 450, desc: '+350 Ink' },
            7: { ink: 500, xp: 750, skin: 'quill', desc: 'Rare Skin: Feather Quill' },
            14: { ink: 800, xp: 1200, doodle: 'doodle_blueprint', desc: 'Special Blueprint Page' },
            21: { ink: 1200, xp: 1800, trail: 'nebula', desc: 'Animated Trail: Quantum Nebula' },
            30: { ink: 2000, xp: 3000, title: 'legend', desc: 'Exclusive Title: Living Notebook Legend' }
        };
    }

    getStreakData() {
        if (!window.progression) return { current: 0, highest: 0, lastDate: '', graceAvailable: true, savedPages: 0 };
        if (!window.progression.data.streak) {
            window.progression.data.streak = { current: 0, highest: 0, lastDate: '', graceAvailable: true, savedPages: 1 };
        }
        return window.progression.data.streak;
    }

    recordDailyCompletion(todayStr = getTodayDateString()) {
        const streak = this.getStreakData();
        if (streak.lastDate === todayStr) return; // Already counted today

        const lastDate = streak.lastDate ? new Date(streak.lastDate) : null;
        const today = new Date(todayStr);

        if (!lastDate) {
            streak.current = 1;
        } else {
            const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                streak.current++;
            } else if (diffDays === 2 && streak.graceAvailable) {
                // Grace Day Protection!
                streak.graceAvailable = false;
                streak.savedPages++;
                streak.current++;
                window.particleSystem?.addFloatingText('PAGE SAVED BY GRACE!', 400, 260, '#38bdf8', 2.0, true);
            } else if (diffDays > 1) {
                // Streak broken - Offer recovery
                streak.previousStreak = streak.current;
                streak.current = 1;
                streak.recoveryAvailable = true;
            }
        }

        streak.lastDate = todayStr;
        streak.highest = Math.max(streak.highest, streak.current);

        // Check Milestone Reward
        const milestone = this.milestoneRewards[streak.current];
        if (milestone) {
            const rewardId = `streak_milestone_${streak.current}_${todayStr.substring(0, 7)}`;
            RewardClaimManager.claim(rewardId, milestone);
        }

        window.progression.save();
        window.telemetry?.track('streak_extended', { currentStreak: streak.current, highestStreak: streak.highest });
    }

    recoverStreak() {
        const streak = this.getStreakData();
        if (!streak.recoveryAvailable || !streak.previousStreak) return false;

        streak.current = streak.previousStreak + 1;
        streak.highest = Math.max(streak.highest, streak.current);
        streak.recoveryAvailable = false;
        window.progression.save();
        window.particleSystem?.addFloatingText('STREAK RESTORED!', 400, 200, '#10b981', 2.0, true);
        window.telemetry?.track('streak_recovered', { currentStreak: streak.current });
        return true;
    }
}

/**
 * 6. Daily & Weekly Missions Engine
 */
class MissionEngine {
    constructor() {
        this.dailyMissionPool = [
            { id: 'dm_bricks', title: 'Break 40 Bricks', target: 40, type: 'brick_destroyed', ink: 80, xp: 150 },
            { id: 'dm_banks', title: 'Perform 8 Bank Shots', target: 8, type: 'bank_shot', ink: 90, xp: 180 },
            { id: 'dm_combo', title: 'Reach 8x Combo Streak', target: 8, type: 'combo', ink: 100, xp: 200 },
            { id: 'dm_near_miss', title: 'Perform 6 Near Misses', target: 6, type: 'near_miss', ink: 110, xp: 220 },
            { id: 'dm_powerups', title: 'Collect 4 Powerups', target: 4, type: 'powerup_collected', ink: 85, xp: 160 },
            { id: 'dm_clear', title: 'Clear Any 2 Sectors', target: 2, type: 'stage_cleared', ink: 120, xp: 250 }
        ];

        this.weeklyMissionPool = [
            { id: 'wm_ink', title: 'Earn 3,000 Total Ink', target: 3000, type: 'ink_earned', ink: 600, xp: 1200 },
            { id: 'wm_perfect', title: 'Attain 3 Flawless Sectors', target: 3, type: 'flawless_clear', ink: 750, xp: 1500 },
            { id: 'wm_combo', title: 'Reach a 20x Combo Streak', target: 20, type: 'max_combo', ink: 800, xp: 1600 },
            { id: 'wm_bosses', title: 'Defeat 3 Bosses', target: 3, type: 'boss_defeated', ink: 900, xp: 1800 },
            { id: 'wm_daily', title: 'Complete 4 Daily Sketches', target: 4, type: 'daily_completed', ink: 1000, xp: 2000 }
        ];
    }

    getDailyMissions(dateStr = getTodayDateString()) {
        const seed = hashString(`DAILY_MISSIONS_${dateStr}`);
        const prng = createPRNG(seed);
        const shuffled = [...this.dailyMissionPool].sort(() => prng() - 0.5);
        const selected = shuffled.slice(0, 3);

        const pData = window.progression?.data?.dailyMissions || {};
        return selected.map(m => {
            const current = pData[m.id] || 0;
            const completed = current >= m.target;
            const rewardId = `daily_mission_${dateStr}_${m.id}`;
            const claimed = RewardClaimManager.isClaimed(rewardId);
            return { ...m, current, completed, claimed, rewardId };
        });
    }

    getWeeklyMissions(weekId = getWeekId()) {
        const pData = window.progression?.data?.weeklyMissions || {};
        return this.weeklyMissionPool.map(m => {
            const current = pData[m.id] || 0;
            const completed = current >= m.target;
            const rewardId = `weekly_mission_${weekId}_${m.id}`;
            const claimed = RewardClaimManager.isClaimed(rewardId);
            return { ...m, current, completed, claimed, rewardId };
        });
    }

    recordProgress(type, amount = 1) {
        if (!window.progression) return;
        const p = window.progression.data;
        if (!p.dailyMissions) p.dailyMissions = {};
        if (!p.weeklyMissions) p.weeklyMissions = {};

        const dailyList = this.getDailyMissions();
        for (const dm of dailyList) {
            if (dm.type === type) {
                if (type === 'combo' || type === 'max_combo') {
                    p.dailyMissions[dm.id] = Math.max(p.dailyMissions[dm.id] || 0, amount);
                } else {
                    p.dailyMissions[dm.id] = (p.dailyMissions[dm.id] || 0) + amount;
                }
                if (p.dailyMissions[dm.id] >= dm.target && !RewardClaimManager.isClaimed(dm.rewardId)) {
                    RewardClaimManager.claim(dm.rewardId, { ink: dm.ink, xp: dm.xp });
                    window.particleSystem?.addFloatingText(`✓ MISSION COMPLETE: ${dm.title}! +${dm.ink} Ink`, 400, 220, '#10b981', 1.8, true);
                    window.telemetry?.track('mission_completed', { missionId: dm.id });
                }
            }
        }

        const weeklyList = this.getWeeklyMissions();
        for (const wm of weeklyList) {
            if (wm.type === type) {
                if (type === 'combo' || type === 'max_combo') {
                    p.weeklyMissions[wm.id] = Math.max(p.weeklyMissions[wm.id] || 0, amount);
                } else {
                    p.weeklyMissions[wm.id] = (p.weeklyMissions[wm.id] || 0) + amount;
                }
                if (p.weeklyMissions[wm.id] >= wm.target && !RewardClaimManager.isClaimed(wm.rewardId)) {
                    RewardClaimManager.claim(wm.rewardId, { ink: wm.ink, xp: wm.xp });
                    window.particleSystem?.addFloatingText(`✓ WEEKLY OBJECTIVE CERTIFIED: ${wm.title}! +${wm.ink} Ink`, 400, 240, '#38bdf8', 2.0, true);
                    window.telemetry?.track('weekly_mission_completed', { missionId: wm.id });
                }
            }
        }
        window.progression.save();
    }
}

/**
 * 7. Weekly Artist Board & Personal Best System (Deterministic Offline Cohort)
 */
class ArtistBoardEngine {
    constructor() {
        this.categories = [
            { id: 'score', name: 'Score Artist', desc: 'Highest single-session master drafting score' },
            { id: 'combo', name: 'Combo Artist', desc: 'Highest unbroken pentatonic harmonic rebound chain' },
            { id: 'style', name: 'Style Artist', desc: 'Highest accumulated bank-shot & near-miss finesse points' },
            { id: 'speed', name: 'Speed Artist', desc: 'Fastest clean sector demolition time' },
            { id: 'perfect', name: 'Perfect Artist', desc: 'Most flawless sectors cleared without sphere loss' },
            { id: 'ink', name: 'Ink Master', desc: 'Most Ink currency earned through direct crystal demolition' }
        ];

        this.tiers = [
            { id: 'master', name: 'MASTER SKETCHER', minPercentile: 0.98, color: '#fbbf24', inkReward: 1000 },
            { id: 'gold', name: 'GOLDEN INK', minPercentile: 0.90, color: '#f59e0b', inkReward: 650 },
            { id: 'crystal', name: 'CRYSTAL DRAFTER', minPercentile: 0.75, color: '#06b6d4', inkReward: 450 },
            { id: 'ink', name: 'INK ARTIST', minPercentile: 0.50, color: '#38bdf8', inkReward: 300 },
            { id: 'graphite', name: 'GRAPHITE DRAFTER', minPercentile: 0.25, color: '#94a3b8', inkReward: 150 },
            { id: 'pencil', name: 'PENCIL APPRENTICE', minPercentile: 0.0, color: '#64748b', inkReward: 75 }
        ];
    }

    getCohort(category = 'score', weekId = getWeekId()) {
        const seed = hashString(`COHORT_${weekId}_${category}`);
        const prng = createPRNG(seed);

        const names = [
            'Elena Rostova', 'Kenji Sato', 'Maya Lin', 'Arthur Pendelton', 'Zara Thorne',
            'Dante Alighieri', 'Lucas Vance', 'Sophia Dubois', 'Devon Kim', 'Freja Lind',
            'Tariq Mansoor', 'Camila Ortiz', 'Boris Volkov', 'Aria Sterling', 'Leo DaVinci'
        ];

        const entries = [];
        for (let i = 0; i < names.length; i++) {
            let val = 0;
            if (category === 'score') val = Math.floor(18000 + prng() * 32000);
            else if (category === 'combo') val = Math.floor(14 + prng() * 38);
            else if (category === 'style') val = Math.floor(800 + prng() * 2400);
            else if (category === 'speed') val = Math.floor(35 + prng() * 60); // Lower is better
            else if (category === 'perfect') val = Math.floor(1 + prng() * 5);
            else if (category === 'ink') val = Math.floor(400 + prng() * 1800);

            entries.push({
                rank: 0,
                name: names[i],
                title: prng() > 0.6 ? 'Ink Master' : 'Architect',
                value: val,
                isPlayer: false
            });
        }

        // Insert Player Entry
        const pBest = this.getPlayerBest(category);
        entries.push({
            rank: 0,
            name: window.progression?.data?.identity?.name || 'ANISH',
            title: window.progression?.data?.identity?.title || 'Ink Apprentice',
            value: pBest,
            isPlayer: true
        });

        // Sort descending (except speed which sorts ascending)
        if (category === 'speed') {
            entries.sort((a, b) => (a.value || 999) - (b.value || 999));
        } else {
            entries.sort((a, b) => b.value - a.value);
        }

        // Assign ranks
        entries.forEach((e, idx) => e.rank = idx + 1);
        return entries;
    }

    getPlayerBest(category = 'score') {
        const pb = window.progression?.data?.personalBests || {};
        return pb[category] || 0;
    }

    recordPlayerRun(category, value) {
        if (!window.progression) return;
        if (!window.progression.data.personalBests) {
            window.progression.data.personalBests = {};
        }

        const current = window.progression.data.personalBests[category] || 0;
        let isNewBest = false;

        if (category === 'speed') {
            if (current === 0 || value < current) {
                window.progression.data.personalBests[category] = value;
                isNewBest = true;
            }
        } else {
            if (value > current) {
                window.progression.data.personalBests[category] = value;
                isNewBest = true;
            }
        }

        if (isNewBest) {
            window.progression.save();
            window.particleSystem?.addFloatingText('★ NEW PERSONAL BEST!', 400, 180, '#fbbf24', 2.0, true);
        }
    }
}

/**
 * 8. Seasonal Chapters Engine (Chapter of the Month)
 */
class SeasonalChapterEngine {
    constructor() {
        this.currentChapter = {
            id: 'ch1',
            title: 'CHAPTER 01: THE LOST BLUEPRINT',
            desc: 'Unearth ancient drafting techniques from the First Architect.',
            maxPages: 10,
            pages: [
                { page: 1, reqXp: 500, reward: { ink: 200 }, desc: 'Page 01: Graphite Foundation (+200 Ink)' },
                { page: 2, reqXp: 1200, reward: { doodle: 'doodle_caliper' }, desc: 'Page 02: Doodle - Brass Caliper' },
                { page: 3, reqXp: 2100, reward: { ink: 350 }, desc: 'Page 03: Precision Measure (+350 Ink)' },
                { page: 4, reqXp: 3200, reward: { skin: 'ruler' }, desc: 'Page 04: Architect Metric Ruler' },
                { page: 5, reqXp: 4500, reward: { ink: 500 }, desc: 'Page 05: Golden Ratio Matrix (+500 Ink)' },
                { page: 6, reqXp: 6000, reward: { doodle: 'doodle_triad' }, desc: 'Page 06: Doodle - Prismatic Shard' },
                { page: 7, reqXp: 7800, reward: { trail: 'rainbow' }, desc: 'Page 07: Prismatic Spectrum Trail' },
                { page: 8, reqXp: 9800, reward: { ink: 800 }, desc: 'Page 08: Ink Storm Masterwork (+800 Ink)' },
                { page: 9, reqXp: 12200, reward: { title: 'master' }, desc: 'Page 09: Title - Grand Sketch Master' },
                { page: 10, reqXp: 15000, reward: { skin: 'gold' }, desc: 'Page 10: Executive 24K Golden Stylus' }
            ]
        };
    }

    getProgress() {
        const xp = window.progression?.data?.player?.xp || 0;
        const totalXp = (window.progression?.data?.player?.level || 1) * 600 + xp;
        return Math.min(totalXp, 15000);
    }
}

/**
 * 9. Shareable Result Card Certificate Generator
 */
class ShareCardGenerator {
    static generateCertificate(data = {}) {
        const canvas = document.createElement('canvas');
        const w = 600;
        const h = 420;
        canvas.width = w * 2;
        canvas.height = h * 2;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);

        const rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(canvas) : null;
        const name = data.name || window.progression?.data?.identity?.name || 'ANISH';
        const title = data.title || window.progression?.data?.identity?.title || 'Ink Apprentice';
        const score = data.score || 0;
        const combo = data.combo || 0;
        const streak = data.streak || window.streakEngine?.getStreakData()?.current || 1;
        const dateStr = getTodayDateString();

        // 1. Parchment Background
        ctx.fillStyle = '#070d1e';
        ctx.fillRect(0, 0, w, h);

        if (rc) {
            // 3D Certificate Border
            rc.rectangle(12, 12, w - 24, h - 24, {
                stroke: '#38bdf8',
                strokeWidth: 2.5,
                roughness: 1.2
            });
            rc.rectangle(20, 20, w - 40, h - 40, {
                stroke: 'rgba(56, 189, 248, 0.4)',
                strokeWidth: 1.2,
                roughness: 1.4
            });

            // Golden Wax Seal Stamp
            rc.circle(w - 70, h - 70, 48, {
                stroke: '#b45309',
                strokeWidth: 2,
                fill: '#fbbf24',
                fillStyle: 'solid'
            });
        }

        // 2. Typography
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 24px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SKETCHOID CERTIFICATE OF MASTERY', w / 2, 55);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText(`OFFICIAL DRAFTING LEDGER &bull; ${dateStr}`, w / 2, 78);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 14px "Space Grotesk", sans-serif';
        ctx.fillText('Drawn and certified by Drafter:', w / 2, 120);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '800 28px "Space Grotesk", sans-serif';
        ctx.fillText(name.toUpperCase(), w / 2, 155);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(`[ ${title.toUpperCase()} ]`, w / 2, 178);

        // Stats Ledger Boxes
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(50, 205, w - 100, 100);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 16px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Final Score: ${score.toLocaleString()}`, 75, 242);
        ctx.fillText(`Max Pentatonic Combo: ${combo}x`, 75, 275);

        ctx.textAlign = 'right';
        ctx.fillText(`Active Streak: ${streak} Days`, w - 75, 242);
        ctx.fillText(`Verification Seed: #${hashString(dateStr + name).toString(16).toUpperCase()}`, w - 75, 275);

        // Artist Signature
        ctx.textAlign = 'left';
        ctx.font = 'italic 16px "Architects Daughter", cursive';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Hand-signed: ${name}`, 50, 360);

        return canvas;
    }
}

/**
 * 10. Global Retention Hub Orchestrator
 */
class RetentionEngine {
    constructor() {
        this.dailySketch = new DailySketchEngine();
        this.streak = new StreakEngine();
        this.missions = new MissionEngine();
        this.artistBoard = new ArtistBoardEngine();
        this.season = new SeasonalChapterEngine();

        // Listen for gameplay events
        this.setupEventBuses();
    }

    setupEventBuses() {
        if (window.impactEventBus) {
            window.impactEventBus.subscribe((evt) => {
                if (evt.type === 'BRICK_COLLISION') {
                    this.dailySketch.recordProgress('brick_destroyed', 1);
                    this.missions.recordProgress('brick_destroyed', 1);
                    if (evt.brickType === 'RUBY') this.dailySketch.recordProgress('ruby_nuke', 1);
                    if (evt.brickType === 'AMETHYST') this.dailySketch.recordProgress('amethyst_destroyed', 1);
                }
            });
        }
    }
}

window.RewardClaimManager = RewardClaimManager;
window.ScoreValidator = ScoreValidator;
window.DailySketchEngine = DailySketchEngine;
window.StreakEngine = StreakEngine;
window.MissionEngine = MissionEngine;
window.ArtistBoardEngine = ArtistBoardEngine;
window.SeasonalChapterEngine = SeasonalChapterEngine;
window.ShareCardGenerator = ShareCardGenerator;
window.retentionEngine = new RetentionEngine();
window.streakEngine = window.retentionEngine.streak;
window.dailySketchEngine = window.retentionEngine.dailySketch;
window.missionEngine = window.retentionEngine.missions;
window.artistBoardEngine = window.retentionEngine.artistBoard;
window.seasonalChapterEngine = window.retentionEngine.season;
