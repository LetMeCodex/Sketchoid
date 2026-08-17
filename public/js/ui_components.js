/**
 * SKETCHOID High-End Architectural 3D UI & Visual Component System
 * Built with Rough.js, Anime.js, DPR scaling, 3D paper drop shadows, and line-boil jitter.
 * Zero Emojis • Pure Handcrafted Vector Art & Architectural Micro-Motion.
 */

/**
 * 1. 3D Animated SKETCHOID Header Logo Canvas
 * Features rotating 3D drafting compass / calligraphy nib and line-boiled typography.
 */
class Sketchoid3DLogo {
    constructor(canvasEl) {
        this.canvas = canvasEl || document.getElementById('sketchoid-3d-logo');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(this.canvas) : null;
        this.dpr = window.devicePixelRatio || 2;
        this.w = 175;
        this.h = 42;

        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.scale(this.dpr, this.dpr);

        this.startRenderLoop();
    }

    startRenderLoop() {
        const render = (timestamp) => {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const rc = this.rc;
            if (!rc) return;

            const w = this.w;
            const h = this.h;
            const frameIdx = Math.floor(timestamp / 110) % 4;

            ctx.clearRect(0, 0, w, h);

            const isDark = document.body.classList.contains('theme-blueprint') || document.body.classList.contains('theme-neon');
            const inkColor = isDark ? '#38bdf8' : '#0f172a';
            const accentColor = isDark ? '#60a5fa' : '#2563eb';
            const goldColor = isDark ? '#fbbf24' : '#d97706';

            // 1. 3D Calligraphy Drafting Nib Icon on the Left
            const nx = 16;
            const ny = 21;
            const rotAngle = Math.sin(timestamp * 0.002) * 0.12;

            ctx.save();
            ctx.translate(nx, ny);
            ctx.rotate(rotAngle);

            // 3D Drop shadow under nib
            rc.polygon([[-6, 7], [6, 7], [8, -7], [-8, -7]], {
                seed: 1000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0, 0, 0, 0.25)',
                fillStyle: 'solid'
            });

            // Golden Nib Body
            rc.polygon([[-6, 6], [6, 6], [8, -8], [-8, -8]], {
                seed: 1100 + frameIdx * 8,
                roughness: 1.2,
                stroke: goldColor,
                strokeWidth: 1.6,
                fill: isDark ? '#fbbf24' : '#f59e0b',
                fillStyle: 'solid'
            });

            // Precision Nib Tip & Ink Channel
            rc.polygon([[-6, 6], [6, 6], [0, 15]], {
                seed: 1200 + frameIdx * 5,
                roughness: 1.1,
                stroke: inkColor,
                strokeWidth: 1.5,
                fill: isDark ? '#0284c7' : '#1e293b',
                fillStyle: 'solid'
            });
            rc.line(0, -6, 0, 14, {
                seed: 1250 + frameIdx * 5,
                stroke: '#ffffff',
                strokeWidth: 1.2
            });
            ctx.restore();

            // 2. Handcrafted Typography: SKETCHOID
            ctx.save();
            ctx.font = '900 18px "Space Grotesk", "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '1px';
            ctx.fillStyle = inkColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('SKETCHOID', 34, 16);

            // Architectural Subtitle
            ctx.font = '600 9px "JetBrains Mono", monospace';
            ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
            ctx.letterSpacing = '1.5px';
            ctx.fillText('LIVING SKETCHBOOK', 35, 29);
            ctx.restore();

            // 3. Technical Drafting Underline with Measurement Ticks
            rc.line(34, 34, 165, 34, {
                seed: 1400 + frameIdx * 5,
                roughness: 1.1,
                stroke: accentColor,
                strokeWidth: 1.2
            });

            this.animFrame = requestAnimationFrame(render);
        };
        this.animFrame = requestAnimationFrame(render);
    }

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
}

/**
 * 2. 3D Architectural Button with Bespoke Vector Iconography (Zero Emojis)
 */
class RoughButton {
    constructor(buttonEl, options = {}) {
        this.button = buttonEl;
        if (!this.button) return;
        this.type = options.type || 'generic'; // 'sketchbook', 'devtools', 'settings', 'play', 'endless', 'resume', 'restart', 'menu', 'next'
        this.label = options.label || this.button.innerText || '';
        this.onClick = options.onClick || null;

        this.initDOM();
        this.initCanvas();
        this.bindEvents();
        this.startRenderLoop();
    }

    initDOM() {
        this.button.innerHTML = `
            <canvas class="rough-ui-btn-canvas"></canvas>
            <span class="rough-ui-btn-label">${this.label}</span>
        `;
        this.canvas = this.button.querySelector('.rough-ui-btn-canvas');
    }

    initCanvas() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(this.canvas) : null;
        this.dpr = window.devicePixelRatio || 2;
        
        const rect = this.button.getBoundingClientRect();
        this.w = Math.max(120, Math.floor(rect.width) || 140);
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

            const isDark = document.body.classList.contains('theme-blueprint') || document.body.classList.contains('theme-neon');
            const fillCol = isDark ? '#1e293b' : '#ffffff';
            const strokeCol = isDark ? '#38bdf8' : '#0f172a';
            const accentCol = isDark ? '#60a5fa' : '#2563eb';

            // 1. 3D Architectural Drop Shadow
            rc.rectangle(4, 5, w - 8, h - 8, {
                seed: 1000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0, 0, 0, 0.22)',
                fillStyle: 'solid'
            });

            // 2. Tactile Button Chassis
            rc.rectangle(3, 2, w - 6, h - 6, {
                seed: 2000 + frameIdx * 8,
                roughness: 1.2,
                stroke: strokeCol,
                strokeWidth: 1.8,
                fill: fillCol,
                fillStyle: 'solid'
            });

            // 3. Subtle Technical Grid / Hatching
            rc.rectangle(3, 2, w - 6, h - 6, {
                seed: 3000 + frameIdx * 5,
                roughness: 1.3,
                stroke: 'transparent',
                fill: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(15, 23, 42, 0.03)',
                fillStyle: 'hachure',
                hachureGap: 6
            });

            // 4. Bespoke 3D Vector Icon on the Left (Zero Emojis!)
            const ix = 18;
            const iy = 21;

            if (this.type === 'sketchbook') {
                // Architectural Binder with Caliper Ribbon
                rc.rectangle(ix - 7, iy - 9, 14, 18, {
                    seed: 4000 + frameIdx * 5,
                    roughness: 1.1,
                    stroke: accentCol,
                    strokeWidth: 1.5,
                    fill: isDark ? '#0284c7' : '#dbeafe',
                    fillStyle: 'solid'
                });
                rc.line(ix, iy - 9, ix, iy + 9, {
                    seed: 4050 + frameIdx * 5,
                    stroke: strokeCol,
                    strokeWidth: 1.2
                });
                rc.polygon([[ix - 1, iy + 6], [ix + 2, iy + 6], [ix + 0.5, iy + 12]], {
                    seed: 4080 + frameIdx * 5,
                    fill: '#ef4444',
                    fillStyle: 'solid',
                    stroke: '#b91c1c',
                    strokeWidth: 1
                });
            } else if (this.type === 'devtools') {
                // Technical Calipers & Drafting Rule
                rc.line(ix - 6, iy + 7, ix + 6, iy - 7, {
                    seed: 5000 + frameIdx * 5,
                    stroke: '#10b981',
                    strokeWidth: 2
                });
                rc.line(ix - 6, iy - 7, ix + 6, iy + 7, {
                    seed: 5050 + frameIdx * 5,
                    stroke: '#06b6d4',
                    strokeWidth: 2
                });
                rc.circle(ix, iy, 4, {
                    seed: 5100 + frameIdx * 5,
                    stroke: strokeCol,
                    fill: '#ffffff',
                    fillStyle: 'solid'
                });
            } else if (this.type === 'settings') {
                // Precision 6-Tooth Brass Cog
                const rot = timestamp * 0.0015;
                rc.circle(ix, iy, 11, {
                    seed: 6000 + frameIdx * 5,
                    roughness: 1.2,
                    stroke: isDark ? '#a78bfa' : '#6d28d9',
                    strokeWidth: 1.6,
                    fill: isDark ? '#4c1d95' : '#ede9fe',
                    fillStyle: 'solid'
                });
                for (let i = 0; i < 6; i++) {
                    const a = rot + (i * Math.PI) / 3;
                    const x1 = ix + Math.cos(a) * 5;
                    const y1 = iy + Math.sin(a) * 5;
                    const x2 = ix + Math.cos(a) * 9;
                    const y2 = iy + Math.sin(a) * 9;
                    rc.line(x1, y1, x2, y2, {
                        seed: 6100 + i * 20 + frameIdx * 5,
                        stroke: isDark ? '#c4b5fd' : '#7c3aed',
                        strokeWidth: 1.8
                    });
                }
            } else if (this.type === 'play') {
                // Dynamic Arrow Vector
                rc.polygon([[ix - 5, iy - 7], [ix + 6, iy], [ix - 5, iy + 7]], {
                    seed: 7000 + frameIdx * 5,
                    roughness: 1.2,
                    stroke: '#059669',
                    strokeWidth: 1.8,
                    fill: '#10b981',
                    fillStyle: 'solid'
                });
            } else if (this.type === 'endless') {
                // Infinity Mobius Loop
                rc.ellipse(ix - 4, iy, 9, 8, {
                    seed: 7100 + frameIdx * 5,
                    stroke: '#3b82f6',
                    strokeWidth: 1.5
                });
                rc.ellipse(ix + 4, iy, 9, 8, {
                    seed: 7150 + frameIdx * 5,
                    stroke: '#3b82f6',
                    strokeWidth: 1.5
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
                    scale: 1.05,
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
 * 3. 3D Handcrafted Sound Toggle Switch
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
        this.w = 98;
        this.h = 42;

        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    initState() {
        this.isMuted = this.soundEngine ? this.soundEngine.muted : false;
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

            const isDark = document.body.classList.contains('theme-blueprint') || document.body.classList.contains('theme-neon');
            const fillCol = isDark ? '#1e293b' : '#ffffff';
            const strokeCol = this.isMuted ? '#ef4444' : (isDark ? '#38bdf8' : '#0f172a');

            // 1. 3D Drop Shadow
            rc.rectangle(4, 5, w - 8, h - 8, {
                seed: 8000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0, 0, 0, 0.22)',
                fillStyle: 'solid'
            });

            // 2. Button Chassis
            rc.rectangle(3, 2, w - 6, h - 6, {
                seed: 8100 + frameIdx * 8,
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
                seed: 8200 + frameIdx * 5,
                roughness: 1.1,
                stroke: strokeCol,
                strokeWidth: 1.5,
                fill: strokeCol,
                fillStyle: 'solid'
            });

            // 4. Acoustic Sound Wave Arcs or Technical Mute Cross
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
                rc.line(sx + 10, sy - 6, sx + 18, sy + 6, {
                    seed: 8300 + frameIdx * 5,
                    stroke: '#ef4444',
                    strokeWidth: 2
                });
                rc.line(sx + 18, sy - 6, sx + 10, sy + 6, {
                    seed: 8350 + frameIdx * 5,
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

/**
 * 4. 3D Modal Header Artwork Generator (Bespoke 3D vector illustration for each modal screen)
 */
class ModalArtRenderer {
    static drawHeaderDiorama(canvas, modalType) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 2;
        const w = 120;
        const h = 60;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.scale(dpr, dpr);

        const rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(canvas) : null;
        if (!rc) return;

        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        if (modalType === 'menu') {
            // Drafting Calipers & Prism Shard
            rc.polygon([[cx, cy - 20], [cx + 18, cy - 2], [cx + 10, cy + 18], [cx - 10, cy + 18], [cx - 18, cy - 2]], {
                roughness: 1.2,
                stroke: '#0284c7',
                strokeWidth: 2,
                fill: '#38bdf8',
                fillStyle: 'cross-hatch',
                hachureGap: 3
            });
            rc.line(cx - 24, cy + 16, cx + 24, cy - 16, { stroke: '#f59e0b', strokeWidth: 2 });
        } else if (modalType === 'pause') {
            // 3D Double Drafting Ruled Bars
            rc.rectangle(cx - 16, cy - 18, 10, 36, {
                roughness: 1.1,
                stroke: '#0284c7',
                strokeWidth: 2,
                fill: '#38bdf8',
                fillStyle: 'solid'
            });
            rc.rectangle(cx + 6, cy - 18, 10, 36, {
                roughness: 1.1,
                stroke: '#0284c7',
                strokeWidth: 2,
                fill: '#38bdf8',
                fillStyle: 'solid'
            });
        } else if (modalType === 'clear') {
            // Triple Golden Star Seal
            rc.circle(cx, cy, 38, {
                roughness: 1.3,
                stroke: '#b45309',
                strokeWidth: 2.2,
                fill: '#fbbf24',
                fillStyle: 'solid'
            });
            rc.circle(cx, cy, 28, {
                roughness: 1.1,
                stroke: '#78350f',
                strokeWidth: 1.5,
                fill: '#f59e0b',
                fillStyle: 'hachure'
            });
        } else if (modalType === 'gameover') {
            // Architectural Broken Inkwell with Splash
            rc.rectangle(cx - 16, cy - 10, 32, 26, {
                roughness: 1.3,
                stroke: '#475569',
                strokeWidth: 2,
                fill: '#1e293b',
                fillStyle: 'solid'
            });
            rc.line(cx - 12, cy - 8, cx + 12, cy + 12, { stroke: '#ef4444', strokeWidth: 2 });
        }
    }
}

window.Sketchoid3DLogo = Sketchoid3DLogo;
window.RoughButton = RoughButton;
window.SoundToggle = SoundToggle;
window.ModalArtRenderer = ModalArtRenderer;
