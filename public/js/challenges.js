/**
 * SKETCHOID Challenge Mode Engine
 * 6 Standalone Skill Challenges with Distinct Modifiers and Victory Badges
 */

class ChallengeManager {
    constructor() {
        this.activeChallenge = null;
        this.speedTimer = 0;

        this.challenges = [
            {
                id: 'one_ball',
                name: '🎯 One Ball Master',
                desc: 'Strictly 1 life. No extra lives or recovery nets. Complete Sector 3 in a single clean run.',
                icon: '🎯',
                targetLevel: 2, // Sector 3
                lives: 1,
                noSafetyNet: true,
                badgeReward: 'one_ball_master'
            },
            {
                id: 'speed_draw',
                name: '⚡ Speed Draw Overdrive',
                desc: 'Ball velocity accelerates +5% every 4 seconds without speed caps!',
                icon: '⚡',
                targetLevel: 1,
                lives: 3,
                speedAccelerate: true,
                badgeReward: 'speed_demon'
            },
            {
                id: 'no_powerups',
                name: '🚫 Pure Geometry',
                desc: 'Bricks never drop capsules. Pure mechanical trajectory control.',
                icon: '🚫',
                targetLevel: 2,
                lives: 2,
                disablePowerups: true,
                badgeReward: 'pure_craftsman'
            },
            {
                id: 'chaos_matrix',
                name: '🌪️ Chaos Drafting Matrix',
                desc: 'Triple rotating windmills, twin wormhole portals, and gravity wells active all at once.',
                icon: '🌪️',
                targetLevel: 0,
                lives: 3,
                chaosGeometry: true,
                badgeReward: 'chaos_navigator'
            },
            {
                id: 'perfect_run',
                name: '💎 Flawless Rebound',
                desc: 'Miss a single paddle rebound and the challenge instantly fails.',
                icon: '💎',
                targetLevel: 1,
                lives: 1,
                flawless: true,
                badgeReward: 'flawless_maestro'
            },
            {
                id: 'ink_flood',
                name: '🖋️ Ink Flood Protocol',
                desc: 'Every destroyed brick creates giant pools of permanent drying watercolor ink.',
                icon: '🖋️',
                targetLevel: 3,
                lives: 3,
                heavyInk: true,
                badgeReward: 'ink_drenched'
            }
        ];
    }

    startChallenge(challengeId, game) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        this.activeChallenge = challenge;
        this.speedTimer = 0;

        game.state = 'PLAYING';
        game.score = 0;
        game.lives = challenge.lives || 3;
        game.levelIndex = challenge.targetLevel || 0;
        game.isEndless = false;
        game.camera.reset();
        game.loadLevel(game.levelIndex);

        // Apply Modifiers
        if (challenge.chaosGeometry) {
            game.geometryManager.windmills.push(
                new RotatingWindmill(200, 300, 75, 1.5, '#38bdf8'),
                new RotatingWindmill(400, 240, 90, -1.8, '#f59e0b'),
                new RotatingWindmill(600, 300, 75, 1.5, '#38bdf8')
            );
            game.geometryManager.portals.push(
                new InkPortal(120, 260, 680, 260, '#38bdf8', '#f97316')
            );
            game.geometryManager.vortexes.push(
                new GravityVortex(400, 240, 220, 110, '#a855f7')
            );
        }

        game.hideAllModals();
        game.updateHUD();
        window.particleSystem?.addFloatingText(`CHALLENGE: ${challenge.name}`, 400, 280, '#fbbf24', 1.6, true);
    }

    update(dt, game) {
        if (!this.activeChallenge) return;

        // Speed Draw Acceleration
        if (this.activeChallenge.speedAccelerate && game.state === 'PLAYING') {
            this.speedTimer += dt;
            if (this.speedTimer >= 4.0) {
                this.speedTimer = 0;
                for (const ball of game.balls) {
                    if (!ball.isStuck) {
                        ball.speed *= 1.06;
                        ball.maxSpeed = Math.max(ball.maxSpeed, ball.speed);
                        ball.enforceVelocityBounds();
                    }
                }
                game.camera.punch(0, -3, 3);
                window.particleSystem?.addFloatingText('⚡ VELOCITY SURGE! (+6%)', 400, 320, '#f59e0b', 1.3, true);
            }
        }
    }

    onStageCleared(game) {
        if (this.activeChallenge) {
            const chId = this.activeChallenge.id;
            if (window.progression && !window.progression.data.stats.challengesBeaten.includes(chId)) {
                window.progression.data.stats.challengesBeaten.push(chId);
                window.progression.grantBadge(this.activeChallenge.badgeReward);
                window.progression.checkUnlocks();
                window.progression.save();
            }
            window.particleSystem?.addFloatingText(`🏅 CHALLENGE COMPLETE!`, 400, 240, '#10b981', 2.0, true);
        }
    }
}

window.ChallengeManager = ChallengeManager;
window.challengeManager = new ChallengeManager();
