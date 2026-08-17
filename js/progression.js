/**
 * SKETCHOID Progression & Notebook Collection System
 * Persistent unlocks for Themes, Paddle Skins, Ball Trails, and Achievement Badges
 */

class ProgressionManager {
    constructor() {
        this.storageKey = 'sketchoid_progression_v1';
        this.data = {
            unlockedSkins: ['classic'],
            unlockedTrails: ['charcoal'],
            unlockedThemes: ['blueprint', 'parchment', 'neon'],
            selectedSkin: 'classic',
            selectedTrail: 'charcoal',
            selectedTheme: 'blueprint',
            stats: {
                bricksBroken: 0,
                bossDefeated: 0,
                nearMisses: 0,
                portalsUsed: 0,
                highestCombo: 0,
                stagesCleared: 0,
                challengesBeaten: []
            },
            badges: []
        };

        this.badgeDefinitions = [
            { id: 'first_blood', name: 'First Sketch', desc: 'Destroy your first crystal brick', icon: '✏️' },
            { id: 'near_miss_ace', name: 'Razor Edge', desc: 'Perform 10 close-shave Near Misses', icon: '⚡' },
            { id: 'portal_voyager', name: 'Quantum Leap', desc: 'Pass through 5 Ink Portals', icon: '🌀' },
            { id: 'combo_virtuoso', name: 'Crystal Maestro', desc: 'Achieve a 15x Combo Streak', icon: '🎵' },
            { id: 'boss_slayer', name: 'Lead Shatterer', desc: 'Defeat The Arch-Pencil in Sector 5', icon: '🏆' },
            { id: 'challenge_champion', name: 'Master Drafter', desc: 'Complete any 3 Challenge Modes', icon: '🎖️' }
        ];

        this.skins = [
            { id: 'classic', name: 'Standard Sketch', desc: 'The trusty hand-drawn charcoal paddle', icon: '📐', unlockReq: 'Default' },
            { id: 'ruler', name: 'Architect Metric Ruler', desc: 'Precise wooden drafting ruler with brass edge', icon: '📏', unlockReq: 'Break 100 Bricks' },
            { id: 'quill', name: 'Feather Calligraphy Quill', desc: 'Vintage swan feather with gold-plated nib', icon: '🪶', unlockReq: 'Perform 10 Near Misses' },
            { id: 'gold', name: '24K Golden Stylus', desc: 'Gleaming executive golden drafting stylus', icon: '✨', unlockReq: 'Defeat The Arch-Pencil' }
        ];

        this.trails = [
            { id: 'charcoal', name: 'Charcoal Dust', desc: 'Soft sketch pencil particle trail', color: '#94a3b8', unlockReq: 'Default' },
            { id: 'rainbow', name: 'Prismatic Spectrum', desc: 'Cycling rainbow chromatic dispersion', color: '#f43f5e', unlockReq: 'Achieve 10x Combo' },
            { id: 'nebula', name: 'Quantum Nebula', desc: 'Deep cosmic celestial vortex glow', color: '#a855f7', unlockReq: 'Use 5 Portals' },
            { id: 'neon', name: 'Electric Spark', desc: 'High-voltage electric lightning arcs', color: '#38bdf8', unlockReq: 'Clear 3 Sectors' }
        ];

        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.data = { ...this.data, ...parsed };
            }
        } catch (e) {
            console.error('Error loading progression:', e);
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving progression:', e);
        }
    }

    recordStat(statKey, increment = 1) {
        if (this.data.stats[statKey] !== undefined) {
            this.data.stats[statKey] += increment;
            this.checkUnlocks();
            this.save();
        }
    }

    checkUnlocks() {
        const stats = this.data.stats;

        // Skins
        if (stats.bricksBroken >= 100 && !this.data.unlockedSkins.includes('ruler')) {
            this.unlockSkin('ruler');
        }
        if (stats.nearMisses >= 10 && !this.data.unlockedSkins.includes('quill')) {
            this.unlockSkin('quill');
        }
        if (stats.bossDefeated >= 1 && !this.data.unlockedSkins.includes('gold')) {
            this.unlockSkin('gold');
        }

        // Trails
        if (stats.highestCombo >= 10 && !this.data.unlockedTrails.includes('rainbow')) {
            this.unlockTrail('rainbow');
        }
        if (stats.portalsUsed >= 5 && !this.data.unlockedTrails.includes('nebula')) {
            this.unlockTrail('nebula');
        }
        if (stats.stagesCleared >= 3 && !this.data.unlockedTrails.includes('neon')) {
            this.unlockTrail('neon');
        }

        // Badges
        if (stats.bricksBroken >= 1) this.grantBadge('first_blood');
        if (stats.nearMisses >= 10) this.grantBadge('near_miss_ace');
        if (stats.portalsUsed >= 5) this.grantBadge('portal_voyager');
        if (stats.highestCombo >= 15) this.grantBadge('combo_virtuoso');
        if (stats.bossDefeated >= 1) this.grantBadge('boss_slayer');
        if (stats.challengesBeaten.length >= 3) this.grantBadge('challenge_champion');
    }

    unlockSkin(skinId) {
        if (!this.data.unlockedSkins.includes(skinId)) {
            this.data.unlockedSkins.push(skinId);
            const skin = this.skins.find(s => s.id === skinId);
            window.particleSystem?.addFloatingText(`🔓 UNLOCKED SKIN: ${skin.name}!`, 400, 300, '#fbbf24', 1.8, true);
            window.soundEngine?.playPowerupCollect('multiball');
            this.save();
        }
    }

    unlockTrail(trailId) {
        if (!this.data.unlockedTrails.includes(trailId)) {
            this.data.unlockedTrails.push(trailId);
            const trail = this.trails.find(t => t.id === trailId);
            window.particleSystem?.addFloatingText(`🔓 UNLOCKED TRAIL: ${trail.name}!`, 400, 300, '#38bdf8', 1.8, true);
            window.soundEngine?.playPowerupCollect('multiball');
            this.save();
        }
    }

    grantBadge(badgeId) {
        if (!this.data.badges.includes(badgeId)) {
            this.data.badges.push(badgeId);
            const badge = this.badgeDefinitions.find(b => b.id === badgeId);
            if (badge) {
                window.particleSystem?.addFloatingText(`🏅 BADGE: ${badge.name}!`, 400, 260, '#10b981', 2.0, true);
            }
            this.save();
        }
    }

    selectSkin(skinId) {
        if (this.data.unlockedSkins.includes(skinId)) {
            this.data.selectedSkin = skinId;
            this.save();
            return true;
        }
        return false;
    }

    selectTrail(trailId) {
        if (this.data.unlockedTrails.includes(trailId)) {
            this.data.selectedTrail = trailId;
            this.save();
            return true;
        }
        return false;
    }
}

window.ProgressionManager = ProgressionManager;
window.progression = new ProgressionManager();
