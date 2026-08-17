/**
 * SKETCHOID Handcrafted 3D Celestial Theme Toggle & Tactile Sound Switch
 * Built with Rough.js, Anime.js, DPR scaling, 3D paper drop shadows, and line-boil jitter.
 */

class ThemeToggle {
    constructor(buttonEl, game) {
        this.button = buttonEl || document.getElementById('theme-toggle-btn');
        this.game = game;
        if (!this.button) return;

        this.initDOM();
        this.initCanvas();
        this.initState();
        this.bindEvents();
        this.startRenderLoop();
    }

    initDOM() {
        this.button.innerHTML = `
            <canvas id="rough-theme-switch-canvas" class="rough-switch-canvas"></canvas>
        `;
        this.canvas = this.button.querySelector('#rough-theme-switch-canvas');
    }

    initCanvas() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(this.canvas) : null;
        this.dpr = window.devicePixelRatio || 2;
        this.w = 84;
        this.h = 42;
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    initState() {
        const isNight = this.game ? this.game.theme.bgDark : true;
        this.state = {
            progress: isNight ? 1 : 0,
            orbX: isNight ? 62 : 22,
            orbY: 21,
            orbSquishX: 1,
            orbSquishY: 1,
            sunRaysScale: isNight ? 0 : 1,
            craterScale: isNight ? 1 : 0,
            cloudsY: isNight ? 30 : 0,
            cloudsOpacity: isNight ? 0 : 1,
            starsY: isNight ? 0 : -22,
            starsOpacity: isNight ? 1 : 0
        };
    }

    syncTheme(isNight, animated = true) {
        if (!animated) {
            this.state.progress = isNight ? 1 : 0;
            this.state.orbX = isNight ? 62 : 22;
            this.state.sunRaysScale = isNight ? 0 : 1;
            this.state.craterScale = isNight ? 1 : 0;
            this.state.cloudsY = isNight ? 30 : 0;
            this.state.cloudsOpacity = isNight ? 0 : 1;
            this.state.starsY = isNight ? 0 : -22;
            this.state.starsOpacity = isNight ? 1 : 0;
            return;
        }

        if (typeof anime !== 'undefined') {
            anime.remove(this.state);
            anime({
                targets: this.state,
                progress: isNight ? 1 : 0,
                orbX: isNight ? 62 : 22,
                sunRaysScale: isNight ? 0 : 1,
                craterScale: isNight ? 1 : 0,
                cloudsY: isNight ? 30 : 0,
                cloudsOpacity: isNight ? 0 : 1,
                starsY: isNight ? 0 : -22,
                starsOpacity: isNight ? 1 : 0,
                duration: 650,
                easing: 'spring(1, 80, 12, 0)'
            });

            anime({
                targets: this.state,
                orbSquishX: [1, 1.25, 0.92, 1],
                orbSquishY: [1, 0.8, 1.1, 1],
                duration: 550,
                easing: 'easeOutElastic(1, 0.5)'
            });
        } else {
            this.state.progress = isNight ? 1 : 0;
            this.state.orbX = isNight ? 62 : 22;
        }
    }

    startRenderLoop() {
        const render = (timestamp) => {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const rc = this.rc;
            if (!rc) return;

            const w = this.w;
            const h = this.h;
            const frameIdx = Math.floor(timestamp / 100) % 4;

            ctx.clearRect(0, 0, w, h);
            const p = this.state.progress;

            // 1. Tactile Paper Chassis Pill
            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(2, 2, w - 4, h - 4, 19);
            } else {
                ctx.rect(2, 2, w - 4, h - 4);
            }
            ctx.clip();

            const skyGrad = ctx.createLinearGradient(0, 0, w, h);
            if (p < 0.5) {
                skyGrad.addColorStop(0, '#38bdf8');
                skyGrad.addColorStop(1, '#7dd3fc');
            } else {
                skyGrad.addColorStop(0, '#0f172a');
                skyGrad.addColorStop(1, '#1e293b');
            }
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);

            rc.rectangle(2, 2, w - 4, h - 4, {
                seed: 1000 + frameIdx * 10,
                roughness: 1.4,
                stroke: 'transparent',
                fill: p > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
                fillStyle: p > 0.5 ? 'dots' : 'zigzag',
                hachureGap: 6
            });

            // 3D Inner Bevel Shadow
            const innerShadow = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 45);
            innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
            innerShadow.addColorStop(1, 'rgba(0,0,0,0.35)');
            ctx.fillStyle = innerShadow;
            ctx.fillRect(0, 0, w, h);

            // 2. Hand-drawn Clouds (Day)
            if (this.state.cloudsOpacity > 0.01) {
                ctx.save();
                ctx.globalAlpha = this.state.cloudsOpacity;
                const cy = this.state.cloudsY;
                rc.ellipse(60, 26 + cy, 26, 12, {
                    seed: 2000 + frameIdx * 8,
                    roughness: 1.3,
                    stroke: '#cbd5e1',
                    strokeWidth: 1.2,
                    fill: '#ffffff',
                    fillStyle: 'solid'
                });
                rc.circle(54, 21 + cy, 14, {
                    seed: 2100 + frameIdx * 8,
                    roughness: 1.2,
                    stroke: '#cbd5e1',
                    strokeWidth: 1.2,
                    fill: '#ffffff',
                    fillStyle: 'solid'
                });
                rc.circle(66, 23 + cy, 11, {
                    seed: 2200 + frameIdx * 8,
                    roughness: 1.2,
                    stroke: '#cbd5e1',
                    strokeWidth: 1.2,
                    fill: '#ffffff',
                    fillStyle: 'solid'
                });
                ctx.restore();
            }

            // 3. Hand-drawn Starfield (Night)
            if (this.state.starsOpacity > 0.01) {
                ctx.save();
                ctx.globalAlpha = this.state.starsOpacity;
                const sy = this.state.starsY;
                const stars = [
                    { x: 18, y: 12 + sy, size: 3.5, seed: 3000 },
                    { x: 30, y: 22 + sy, size: 2.5, seed: 3100 },
                    { x: 14, y: 28 + sy, size: 3.0, seed: 3200 },
                    { x: 36, y: 11 + sy, size: 2.0, seed: 3300 }
                ];
                stars.forEach((st, idx) => {
                    const twinkle = Math.sin(timestamp * 0.004 + idx * 1.5) * 0.6 + 0.9;
                    const sz = st.size * twinkle;
                    rc.line(st.x - sz * 1.5, st.y, st.x + sz * 1.5, st.y, {
                        seed: st.seed + frameIdx * 5,
                        roughness: 1.2,
                        stroke: '#fbbf24',
                        strokeWidth: 1.2
                    });
                    rc.line(st.x, st.y - sz * 1.5, st.x, st.y + sz * 1.5, {
                        seed: st.seed + 50 + frameIdx * 5,
                        roughness: 1.2,
                        stroke: '#fbbf24',
                        strokeWidth: 1.2
                    });
                    rc.circle(st.x, st.y, sz, {
                        seed: st.seed + 100 + frameIdx * 5,
                        roughness: 1.1,
                        stroke: 'transparent',
                        fill: '#ffffff',
                        fillStyle: 'solid'
                    });
                });
                ctx.restore();
            }

            // 4. 3D Tactile Sun / Moon Orb
            const ox = this.state.orbX;
            const oy = this.state.orbY;
            const r = 12.5;

            // 4A. 3D Drop Shadow Under Orb
            rc.ellipse(ox + 1.5, oy + 2.5, (r * 2) * this.state.orbSquishX, (r * 2) * this.state.orbSquishY, {
                seed: 4000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0,0,0,0.3)',
                fillStyle: 'solid'
            });

            // 4B. Boiling Sun Rays (Day Mode)
            if (this.state.sunRaysScale > 0.05) {
                ctx.save();
                ctx.globalAlpha = this.state.sunRaysScale;
                const rayRot = timestamp * 0.001;
                const numRays = 8;
                for (let i = 0; i < numRays; i++) {
                    const angle = rayRot + (i * Math.PI * 2) / numRays;
                    const innerR = r + 2;
                    const outerR = r + 5.5 * this.state.sunRaysScale;
                    const x1 = ox + Math.cos(angle) * innerR;
                    const y1 = oy + Math.sin(angle) * innerR;
                    const x2 = ox + Math.cos(angle) * outerR;
                    const y2 = oy + Math.sin(angle) * outerR;
                    rc.line(x1, y1, x2, y2, {
                        seed: 5000 + i * 20 + frameIdx * 8,
                        roughness: 1.5,
                        stroke: '#f59e0b',
                        strokeWidth: 1.6
                    });
                }
                ctx.restore();
            }

            // 4C. Orb Main Body
            const orbColor = p < 0.5 ? '#f59e0b' : '#e2e8f0';
            const orbStroke = p < 0.5 ? '#d97706' : '#64748b';

            rc.circle(ox, oy, (r * 2) * this.state.orbSquishX, {
                seed: 6000 + frameIdx * 10,
                roughness: 1.3,
                stroke: orbStroke,
                strokeWidth: 1.8,
                fill: orbColor,
                fillStyle: 'solid'
            });

            // Lunar Craters (Night Mode)
            if (this.state.craterScale > 0.05) {
                ctx.save();
                ctx.globalAlpha = this.state.craterScale;
                const cs = this.state.craterScale;
                rc.circle(ox - 3.5, oy - 3.5, 6 * cs, {
                    seed: 7000 + frameIdx * 8,
                    roughness: 1.4,
                    stroke: '#475569',
                    strokeWidth: 1.2,
                    fill: '#94a3b8',
                    fillStyle: 'cross-hatch',
                    hachureGap: 2.5
                });
                rc.circle(ox + 4, oy + 3, 4.5 * cs, {
                    seed: 7100 + frameIdx * 8,
                    roughness: 1.4,
                    stroke: '#475569',
                    strokeWidth: 1.2,
                    fill: '#94a3b8',
                    fillStyle: 'cross-hatch',
                    hachureGap: 2.5
                });
                ctx.restore();
            }

            ctx.restore(); // restore clipping

            // 5. Sketchy Rough.js Pill Outer Border
            const borderStroke = p > 0.5 ? '#38bdf8' : '#44403c';
            rc.path(`M 21 2 L ${w - 21} 2 A 19 19 0 0 1 ${w - 21} ${h - 2} L 21 ${h - 2} A 19 19 0 0 1 21 2 Z`, {
                seed: 8000 + frameIdx * 10,
                roughness: 1.5,
                stroke: borderStroke,
                strokeWidth: 2,
                fill: 'transparent'
            });

            this.animFrame = requestAnimationFrame(render);
        };
        this.animFrame = requestAnimationFrame(render);
    }

    bindEvents() {
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.game) {
                this.game.cycleTheme();
                this.syncTheme(this.game.theme.bgDark, true);
                window.soundEngine?.playWallTick();
                window.haptics?.light();
            }
        });

        this.button.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this.button,
                    scale: 1.08,
                    translateY: -2,
                    duration: 350,
                    easing: 'easeOutElastic(1, 0.6)'
                });
            }
        });

        this.button.addEventListener('mouseleave', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this.button,
                    scale: 1,
                    translateY: 0,
                    duration: 350,
                    easing: 'easeOutElastic(1, 0.6)'
                });
            }
        });
    }

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
}

window.ThemeToggle = ThemeToggle;
