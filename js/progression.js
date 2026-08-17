/**
 * SKETCHOID Persistent Progression & Meta-Game Architecture (Save Version 1.0)
 * Handles Player XP & Level, Ink Currency, 3-Star Level Mastery,
 * Sketch Archive Discovery, Achievements, Titles, and Corruption-Safe Persistence.
 */

const SAVE_VERSION = 1;

class ProgressionManager {
    constructor() {
        this.storageKey = 'sketchoid_save_v1';
        this.data = this.getDefaultSaveData();

        // Data-Driven Archive of Sketchbook Discoveries
        this.archiveDefinitions = {
            crystals: [
                { id: 'emerald', name: 'Emerald Prism', desc: 'Accelerates trajectory velocity on impact.', icon: '🟢', tier: 'Common' },
                { id: 'amber', name: 'Amber Bastion', desc: 'Structural weakpoint; fractures adjacent amber bricks.', icon: '🟠', tier: 'Uncommon' },
                { id: 'sapphire', name: 'Sapphire Crystal', desc: 'Resonates harmonic frequencies, imparting kinetic energy.', icon: '🔵', tier: 'Uncommon' },
                { id: 'ruby', name: 'Ruby Core', desc: 'Explosive volatility; detonates localized blast radius.', icon: '🔴', tier: 'Rare' },
                { id: 'amethyst', name: 'Amethyst Monolith', desc: '4-layer armored crystal requiring heavy continuous bombardment.', icon: '🟣', tier: 'Epic' },
                { id: 'gold', name: 'Golden Vault', desc: 'Rewards fortunate drafters with high scores and powerup drops.', icon: '🟡', tier: 'Legendary' },
                { id: 'obsidian', name: 'Obsidian Barrier', desc: 'Indestructible environmental drafting boundary.', icon: '⬛', tier: 'Ancient' }
            ],
            powerups: [
                { id: 'multiball', name: '3x Multiball', desc: 'Triplicates active kinetic spheres.', icon: '⚡' },
                { id: 'wide', name: 'Wide Paddle Extension', desc: 'Expands the drafting ruler by 65%.', icon: '🛡️' },
                { id: 'laser', name: 'Laser Turrets', desc: 'Equips mechanical lead-firing blasters.', icon: '🔫' },
                { id: 'fireball', name: 'Meteor Fireball', desc: 'Punches clean through multiple crystal layers.', icon: '🔥' },
                { id: 'shield', name: 'Safety Net', desc: 'Deploys an elastic trampoline bounce line.', icon: '🕸️' },
                { id: 'slowmo', name: 'Chrono Dilation', desc: 'Slows down time for surgical precision bank shots.', icon: '⏱️' }
            ],
            bosses: [
                { id: 'eraser', name: 'The Eraser', desc: 'The Void Rub-Out erasing intact crystals mid-flight.', icon: '🧼' },
                { id: 'ink', name: 'The Living Ink', desc: 'Viscous floor reservoir constricting paddle movement.', icon: '🖋️' },
                { id: 'pencil', name: 'The Arch-Pencil', desc: 'The Sentient Drafter sketching solid obstacles onto canvas.', icon: '✏️' }
            ]
        };

        // Data-Driven Achievements
        this.achievements = [
            { id: 'first_draft', name: 'First Line', desc: 'Complete Sector 1 of the Campaign.', category: 'CAMPAIGN', xpReward: 100, inkReward: 25, badge: '✏️', condition: (d) => (d.stats.stagesCleared || 0) >= 1 },
            { id: 'bank_master', name: 'Angle Obsessed', desc: 'Perform 15 Bank Shots off side margins.', category: 'SKILL', xpReward: 200, inkReward: 50, badge: '📐', condition: (d) => (d.stats.bankShots || 0) >= 15 },
            { id: 'near_miss_ace', name: 'Razor Edge', desc: 'Perform 20 close-shave Near Misses.', category: 'SKILL', xpReward: 250, inkReward: 60, badge: '⚡', condition: (d) => (d.stats.nearMisses || 0) >= 20 },
            { id: 'combo_maestro', name: 'Crystal Symphony', desc: 'Reach a 15x Pentatonic Combo streak.', category: 'COMBO', xpReward: 300, inkReward: 80, badge: '🎵', condition: (d) => (d.stats.highestCombo || 0) >= 15 },
            { id: 'brick_demolisher', name: 'Paper Cut', desc: 'Destroy 250 crystal bricks.', category: 'GAMEPLAY', xpReward: 350, inkReward: 100, badge: '💥', condition: (d) => (d.stats.bricksBroken || 0) >= 250 },
            { id: 'star_collector', name: 'Constellation Drafter', desc: 'Earn 10 Mastery Stars across the campaign.', category: 'MASTERY', xpReward: 400, inkReward: 120, badge: '★', condition: (d) => d.totalStars >= 10 },
            { id: 'eraser_slayer', name: 'Clean Sheet', desc: 'Vanquish The Eraser boss in Sector 3.', category: 'BOSS', xpReward: 500, inkReward: 150, badge: '🧼', condition: (d) => (d.stats.bossDefeated || 0) >= 1 },
            { id: 'ink_slayer', name: 'Blotter', desc: 'Vanquish The Living Ink boss in Sector 4.', category: 'BOSS', xpReward: 600, inkReward: 200, badge: '🖋️', condition: (d) => (d.stats.bossDefeated || 0) >= 2 },
            { id: 'arch_slayer', name: 'Lead Shatterer', desc: 'Vanquish The Arch-Pencil in Sector 5.', category: 'BOSS', xpReward: 800, inkReward: 300, badge: '🏆', condition: (d) => (d.stats.bossDefeated || 0) >= 3 }
        ];

        // Cosmetics Catalog
        this.skins = [
            { id: 'classic', name: 'Standard Sketch', desc: 'The trusty hand-drawn charcoal paddle', icon: '📐', cost: 0, unlocked: true },
            { id: 'ruler', name: 'Architect Metric Ruler', desc: 'Precise wooden drafting ruler with brass ticks', icon: '📏', cost: 120, unlocked: false },
            { id: 'quill', name: 'Feather Calligraphy Quill', desc: 'Vintage swan feather with gold-plated nib', icon: '🪶', cost: 240, unlocked: false },
            { id: 'gold', name: '24K Golden Stylus', desc: 'Gleaming executive golden drafting stylus', icon: '✨', cost: 500, unlocked: false }
        ];

        this.trails = [
            { id: 'charcoal', name: 'Charcoal Dust', desc: 'Soft sketch pencil particle trail', color: '#94a3b8', cost: 0, unlocked: true },
            { id: 'rainbow', name: 'Prismatic Spectrum', desc: 'Cycling chromatic dispersion', color: '#f43f5e', cost: 150, unlocked: false },
            { id: 'nebula', name: 'Quantum Nebula', desc: 'Deep cosmic celestial vortex glow', color: '#a855f7', cost: 280, unlocked: false },
            { id: 'neon', name: 'Electric Spark', desc: 'High-voltage electric lightning arcs', color: '#38bdf8', cost: 420, unlocked: false }
        ];

        this.titles = [
            { id: 'apprentice', name: 'Ink Apprentice', reqLevel: 1 },
            { id: 'drafter', name: 'Trajectory Drafter', reqLevel: 3 },
            { id: 'artist', name: 'Combo Artist', reqLevel: 5 },
            { id: 'master', name: 'Grand Sketch Master', reqLevel: 8 },
            { id: 'legend', name: 'Living Notebook Legend', reqLevel: 10 }
        ];

        this.load();
    }

    getDefaultSaveData() {
        return {
            version: SAVE_VERSION,
            player: {
                level: 1,
                xp: 0,
                ink: 0,
                selectedSkin: 'classic',
                selectedTrail: 'charcoal',
                selectedTitle: 'Ink Apprentice'
            },
            unlockedSkins: ['classic'],
            unlockedTrails: ['charcoal'],
            unlockedThemes: ['blueprint', 'parchment', 'neon'],
            discoveredItems: {
                crystals: ['emerald'],
                powerups: ['multiball'],
                bosses: []
            },
            levelStars: {}, // { [levelId]: { stars: number, bestScore: number, bestStyle: number, bestCombo: number } }
            completedAchievements: [],
            totalStars: 0,
            stats: {
                bricksBroken: 0,
                bankShots: 0,
                nearMisses: 0,
                perfectRebounds: 0,
                portalsUsed: 0,
                highestCombo: 0,
                stagesCleared: 0,
                bossDefeated: 0,
                totalRuns: 0
            }
        };
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    this.data = this.mergeWithDefaults(parsed);
                    this.calculateTotalStars();
                }
            }
        } catch (e) {
            console.warn('Save data corrupted or unreadable. Initializing default save:', e);
            this.data = this.getDefaultSaveData();
            this.save();
        }
    }

    mergeWithDefaults(loaded) {
        const defaults = this.getDefaultSaveData();
        return {
            ...defaults,
            ...loaded,
            player: { ...defaults.player, ...(loaded.player || {}) },
            discoveredItems: { ...defaults.discoveredItems, ...(loaded.discoveredItems || {}) },
            stats: { ...defaults.stats, ...(loaded.stats || {}) },
            levelStars: loaded.levelStars || {},
            unlockedSkins: loaded.unlockedSkins || defaults.unlockedSkins,
            unlockedTrails: loaded.unlockedTrails || defaults.unlockedTrails,
            completedAchievements: loaded.completedAchievements || []
        };
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Error writing save data to localStorage:', e);
        }
    }

    calculateTotalStars() {
        let stars = 0;
        for (const lvlId in this.data.levelStars) {
            stars += this.data.levelStars[lvlId].stars || 0;
        }
        this.data.totalStars = stars;
    }

    getXpForNextLevel(level) {
        return Math.round(250 * Math.pow(1.32, level - 1));
    }

    addXp(amount) {
        if (amount <= 0) return;
        this.data.player.xp += amount;

        let needed = this.getXpForNextLevel(this.data.player.level);
        while (this.data.player.xp >= needed) {
            this.data.player.xp -= needed;
            this.data.player.level++;
            window.soundEngine?.playPowerupCollect('wide');
            window.haptics?.success();
            window.particleSystem?.addFloatingText(`✨ LEVEL UP: LVL ${this.data.player.level}!`, 400, 240, '#fbbf24', 1.8, true);
            needed = this.getXpForNextLevel(this.data.player.level);
        }
        this.checkAchievements();
        this.save();
    }

    addInk(amount) {
        if (amount <= 0) return;
        this.data.player.ink += amount;
        this.save();
    }

    discoverItem(category, itemId) {
        if (!this.data.discoveredItems[category]) {
            this.data.discoveredItems[category] = [];
        }
        if (!this.data.discoveredItems[category].includes(itemId)) {
            this.data.discoveredItems[category].push(itemId);
            this.save();
        }
    }

    recordStat(statKey, increment = 1) {
        if (this.data.stats[statKey] !== undefined) {
            this.data.stats[statKey] += increment;
            this.checkAchievements();
            this.save();
        }
    }

    recordLevelCompletion(levelId, score, styleScore, combo, isThreeStarEligible = false) {
        this.data.stats.stagesCleared++;
        this.calculateTotalStars();

        let earnedStars = 1;
        if (score >= 4000) earnedStars = 2;
        if (isThreeStarEligible && score >= 5000) earnedStars = 3;

        const prev = this.data.levelStars[levelId] || { stars: 0, bestScore: 0, bestStyle: 0, bestCombo: 0 };
        const newStars = Math.max(prev.stars, earnedStars);
        const bestScore = Math.max(prev.bestScore, score);
        const bestStyle = Math.max(prev.bestStyle, styleScore);
        const bestCombo = Math.max(prev.bestCombo, combo);

        this.data.levelStars[levelId] = {
            stars: newStars,
            bestScore,
            bestStyle,
            bestCombo
        };

        this.calculateTotalStars();
        this.checkAchievements();
        this.save();

        return {
            stars: earnedStars,
            isNewBest: score > prev.bestScore
        };
    }

    checkAchievements() {
        for (const ach of this.achievements) {
            if (!this.data.completedAchievements.includes(ach.id)) {
                if (ach.condition(this.data)) {
                    this.data.completedAchievements.push(ach.id);
                    this.addXp(ach.xpReward);
                    this.addInk(ach.inkReward);
                    window.haptics?.success();
                    window.particleSystem?.addFloatingText(`🏆 ACHIEVEMENT: ${ach.name}! (+${ach.inkReward} Ink)`, 400, 220, '#10b981', 1.8, true);
                    window.soundEngine?.playLevelClear();
                    window.telemetry?.track('achievement_unlocked', { id: ach.id, name: ach.name });
                }
            }
        }
    }

    unlockSkinWithInk(skinId) {
        const skin = this.skins.find(s => s.id === skinId);
        if (!skin || this.data.unlockedSkins.includes(skinId)) return false;
        if (this.data.player.ink >= skin.cost) {
            this.data.player.ink -= skin.cost;
            this.data.unlockedSkins.push(skinId);
            this.save();
            return true;
        }
        return false;
    }

    unlockTrailWithInk(trailId) {
        const trail = this.trails.find(t => t.id === trailId);
        if (!trail || this.data.unlockedTrails.includes(trailId)) return false;
        if (this.data.player.ink >= trail.cost) {
            this.data.player.ink -= trail.cost;
            this.data.unlockedTrails.push(trailId);
            this.save();
            return true;
        }
        return false;
    }

    selectSkin(skinId) {
        if (this.data.unlockedSkins.includes(skinId)) {
            this.data.player.selectedSkin = skinId;
            this.data.selectedSkin = skinId;
            this.save();
            return true;
        }
        return false;
    }

    selectTrail(trailId) {
        if (this.data.unlockedTrails.includes(trailId)) {
            this.data.player.selectedTrail = trailId;
            this.data.selectedTrail = trailId;
            this.save();
            return true;
        }
        return false;
    }

    unlockAllDevMode() {
        this.data.player.level = 10;
        this.data.player.xp = 0;
        this.data.player.ink = 9999;
        this.data.unlockedSkins = ['classic', 'ruler', 'quill', 'gold'];
        this.data.unlockedTrails = ['charcoal', 'rainbow', 'nebula', 'neon'];
        this.data.unlockedThemes = ['blueprint', 'parchment', 'neon'];
        this.data.discoveredItems = {
            crystals: ['emerald', 'amber', 'sapphire', 'ruby', 'amethyst', 'gold', 'obsidian'],
            powerups: ['multiball', 'wide', 'laser', 'fireball', 'shield', 'slowmo'],
            bosses: ['eraser', 'ink', 'pencil']
        };
        this.data.completedAchievements = this.achievements.map(a => a.id);
        
        // Award 3 Stars to all levels
        this.data.levelStars = {
            '1_1': { stars: 3, bestScore: 9800, bestStyle: 1200, bestCombo: 18 },
            '2_1': { stars: 3, bestScore: 11400, bestStyle: 1600, bestCombo: 22 },
            '3_1': { stars: 3, bestScore: 14200, bestStyle: 2100, bestCombo: 25 },
            '4_1': { stars: 3, bestScore: 16800, bestStyle: 2400, bestCombo: 28 },
            '5_1': { stars: 3, bestScore: 22500, bestStyle: 3500, bestCombo: 35 }
        };
        this.calculateTotalStars();
        this.save();
        window.soundEngine?.playLevelClear();
        window.haptics?.success();
        window.particleSystem?.addFloatingText('🔓 DEV MODE: EVERYTHING UNLOCKED! (9999 🖋️)', 400, 200, '#fbbf24', 2.0, true);
    }

    resetDevMode() {
        this.data = this.getDefaultSaveData();
        this.save();
        window.soundEngine?.playWallTick();
        window.particleSystem?.addFloatingText('🔄 SAVE DATA RESET TO DEFAULT', 400, 200, '#ef4444', 1.8, true);
    }
}

window.ProgressionManager = ProgressionManager;
window.progression = new ProgressionManager();
