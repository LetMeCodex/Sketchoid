/**
 * SKETCHOID Handcrafted 3D UI Component System
 * Built with Rough.js, Anime.js, DPR scaling, 3D paper drop shadows, and line-boil jitter.
 */

class RoughButton {
    constructor(buttonEl, options = {}) {
        this.button = buttonEl;
        if (!this.button) return;
        this.type = options.type || 'generic'; // 'sketchbook', 'devtools', 'settings'
        this.label = options.label || this.button.innerText || '';
        this.icon = options.icon || '';
        this.onClick = options.onClick || null;

        this.initDOM();
        this.initCanvas();
        this.bindEvents();
        this.startRenderLoop();
    }

    initDOM() {
        const text = this.label;
        this.button.innerHTML = `
            <canvas class="rough-ui-btn-canvas"></canvas>
            <span class="rough-ui-btn-label">${text}</span>
        `;
        this.canvas = this.button.querySelector('.rough-ui-btn-canvas');
        this.labelSpan = this.button.querySelector('.rough-ui-btn-label');
    }

    initCanvas() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(this.canvas) : null;
        this.dpr = window.devicePixelRatio || 2;
        
        // Measure button bounding size
        const rect = this.button.getBoundingClientRect();
        this.w = Math.max(120, Math.floor(rect.width) || 135);
        this.h = 42;

        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    startRenderLoop() {
        const render = (timestamp) => {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const rc = this.rc;
            if (!rc) return;

            const w = this.w;
            const h = this.h;
            const frameIdx = Math.floor(timestamp / 120) % 4;

            ctx.clearRect(0, 0, w, h);

            // 1. 3D Drop Shadow Under Button
            rc.rectangle(4, 5, w - 8, h - 8, {
                seed: 1000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0, 0, 0, 0.20)',
                fillStyle: 'solid'
            });

            // 2. Tactile Paper / Leather Button Base
            const isDark = document.body.classList.contains('theme-blueprint') || document.body.classList.contains('theme-neon');
            const fillCol = isDark ? '#1e293b' : '#fffbeb';
            const strokeCol = isDark ? '#38bdf8' : '#78350f';

            rc.rectangle(3, 2, w - 6, h - 6, {
                seed: 2000 + frameIdx * 8,
                roughness: 1.2,
                stroke: strokeCol,
                strokeWidth: 1.8,
                fill: fillCol,
                fillStyle: 'solid'
            });

            // 3. Subtle Texture Hatching
            rc.rectangle(3, 2, w - 6, h - 6, {
                seed: 3000 + frameIdx * 5,
                roughness: 1.3,
                stroke: 'transparent',
                fill: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(120, 53, 15, 0.05)',
                fillStyle: 'hachure',
                hachureGap: 6
            });

            // 4. Custom Hand-Drawn 3D Icon on the Left
            if (this.type === 'sketchbook') {
                // Mini 3D Notebook with Golden Bookmark
                rc.rectangle(12, 10, 18, 22, {
                    seed: 4000 + frameIdx * 5,
                    roughness: 1.1,
                    stroke: '#b45309',
                    strokeWidth: 1.5,
                    fill: '#f59e0b',
                    fillStyle: 'solid'
                });
                rc.line(21, 10, 21, 30, {
                    seed: 4050 + frameIdx * 5,
                    stroke: '#78350f',
                    strokeWidth: 1.2
                });
                // Red bookmark ribbon
                rc.polygon([[20, 26], [23, 26], [21.5, 34]], {
                    seed: 4080 + frameIdx * 5,
                    fill: '#ef4444',
                    fillStyle: 'solid',
                    stroke: '#b91c1c',
                    strokeWidth: 1
                });
            } else if (this.type === 'devtools') {
                // Mini Crossed Wrench & Pencil
                rc.line(12, 30, 28, 14, {
                    seed: 5000 + frameIdx * 5,
                    stroke: '#10b981',
                    strokeWidth: 2
                });
                rc.line(12, 14, 28, 30, {
                    seed: 5050 + frameIdx * 5,
                    stroke: '#06b6d4',
                    strokeWidth: 2
                });
            } else if (this.type === 'settings') {
                // Mini Rotating Gear
                const rot = timestamp * 0.0015;
                const gx = 20;
                const gy = 21;
                rc.circle(gx, gy, 14, {
                    seed: 6000 + frameIdx * 5,
                    roughness: 1.2,
                    stroke: '#8b5cf6',
                    strokeWidth: 1.6,
                    fill: '#ddd6fe',
                    fillStyle: 'solid'
                });
                for (let i = 0; i < 6; i++) {
                    const a = rot + (i * Math.PI) / 3;
                    const x1 = gx + Math.cos(a) * 7;
                    const y1 = gy + Math.sin(a) * 7;
                    const x2 = gx + Math.cos(a) * 11;
                    const y2 = gy + Math.sin(a) * 11;
                    rc.line(x1, y1, x2, y2, {
                        seed: 6100 + i * 20 + frameIdx * 5,
                        stroke: '#7c3aed',
                        strokeWidth: 2
                    });
                }
            }

            this.animFrame = requestAnimationFrame(render);
        };
        this.animFrame = requestAnimationFrame(render);
    }

    bindEvents() {
        this.button.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this.button,
                    scale: 1.06,
                    translateY: -3,
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
                    duration: 300,
                    easing: 'easeOutElastic(1, 0.6)'
                });
            }
        });

        if (this.onClick) {
            this.button.addEventListener('click', this.onClick);
        }
    }

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
}

/**
 * 3D Handcrafted Tactile Sound Switch with Animated Sound Waves
 */
class SoundToggle {
    constructor(buttonEl, soundEngine) {
        this.button = buttonEl;
        this.soundEngine = soundEngine;
        if (!this.button) return;

        this.initDOM();
        this.initCanvas();
        this.initState();
        this.bindEvents();
        this.startRenderLoop();
    }

    initDOM() {
        this.button.innerHTML = `
            <canvas class="rough-ui-btn-canvas"></canvas>
            <span class="rough-ui-btn-label" style="padding-left: 28px;">Sound</span>
        `;
        this.canvas = this.button.querySelector('.rough-ui-btn-canvas');
    }

    initCanvas() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(this.canvas) : null;
        this.dpr = window.devicePixelRatio || 2;
        this.w = 95;
        this.h = 42;

        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    initState() {
        this.isMuted = this.soundEngine ? this.soundEngine.muted : false;
        this.waveScale = this.isMuted ? 0 : 1;
    }

    startRenderLoop() {
        const render = (timestamp) => {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const rc = this.rc;
            if (!rc) return;

            const w = this.w;
            const h = this.h;
            const frameIdx = Math.floor(timestamp / 120) % 4;

            ctx.clearRect(0, 0, w, h);

            // 1. 3D Drop Shadow
            rc.rectangle(4, 5, w - 8, h - 8, {
                seed: 7000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0, 0, 0, 0.20)',
                fillStyle: 'solid'
            });

            // 2. Tactile Button Base
            const isDark = document.body.classList.contains('theme-blueprint') || document.body.classList.contains('theme-neon');
            const fillCol = isDark ? '#1e293b' : '#fffbeb';
            const strokeCol = this.isMuted ? '#ef4444' : (isDark ? '#38bdf8' : '#78350f');

            rc.rectangle(3, 2, w - 6, h - 6, {
                seed: 7100 + frameIdx * 8,
                roughness: 1.2,
                stroke: strokeCol,
                strokeWidth: 1.8,
                fill: fillCol,
                fillStyle: 'solid'
            });

            // 3. Mini Speaker Cone
            const sx = 14;
            const sy = 21;
            rc.polygon([
                [sx, sy - 4],
                [sx + 4, sy - 4],
                [sx + 9, sy - 8],
                [sx + 9, sy + 8],
                [sx + 4, sy + 4],
                [sx, sy + 4]
            ], {
                seed: 7200 + frameIdx * 5,
                roughness: 1.1,
                stroke: strokeCol,
                strokeWidth: 1.5,
                fill: strokeCol,
                fillStyle: 'solid'
            });

            // 4. Sound Wave Arcs or Mute Cross-Hatch
            if (!this.isMuted) {
                const wavePulse = Math.sin(timestamp * 0.008) * 0.2 + 0.9;
                ctx.save();
                ctx.strokeStyle = strokeCol;
                ctx.lineWidth = 1.6;

                // Wave 1
                ctx.beginPath();
                ctx.arc(sx + 8, sy, 6 * wavePulse, -Math.PI * 0.35, Math.PI * 0.35);
                ctx.stroke();

                // Wave 2
                ctx.beginPath();
                ctx.arc(sx + 8, sy, 10 * wavePulse, -Math.PI * 0.35, Math.PI * 0.35);
                ctx.stroke();
                ctx.restore();
            } else {
                // Red Mute Cross
                rc.line(sx + 10, sy - 6, sx + 18, sy + 6, {
                    seed: 7300 + frameIdx * 5,
                    stroke: '#ef4444',
                    strokeWidth: 2
                });
                rc.line(sx + 18, sy - 6, sx + 10, sy + 6, {
                    seed: 7350 + frameIdx * 5,
                    stroke: '#ef4444',
                    strokeWidth: 2
                });
            }

            this.animFrame = requestAnimationFrame(render);
        };
        this.animFrame = requestAnimationFrame(render);
    }

    bindEvents() {
        this.button.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this.button,
                    scale: 1.06,
                    translateY: -3,
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
                    duration: 300,
                    easing: 'easeOutElastic(1, 0.6)'
                });
            }
        });

        this.button.addEventListener('click', () => {
            if (this.soundEngine) {
                this.isMuted = this.soundEngine.toggleMute();
                window.haptics?.light();
            }
        });
    }

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
}

window.RoughButton = RoughButton;
window.SoundToggle = SoundToggle;
