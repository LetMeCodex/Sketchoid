/**
 * SKETCHOID Handcrafted 3D Illustration & Micro-Canvas Renderer
 * Built with Rough.js, Anime.js, DPR scaling, 3D paper drop shadows, and line-boil jitter.
 */

class SketchItemRenderer {
    static drawItemIllustration(canvas, category, itemId, isUnlocked = true) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 2;
        const logicalW = 110;
        const logicalH = 65;

        canvas.width = logicalW * dpr;
        canvas.height = logicalH * dpr;
        canvas.style.width = `${logicalW}px`;
        canvas.style.height = `${logicalH}px`;
        ctx.scale(dpr, dpr);

        const rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(canvas) : window.game?.rc;
        if (!rc) return;

        const w = logicalW;
        const h = logicalH;
        const cx = w / 2;
        const cy = h / 2;
        const frameIdx = Math.floor(performance.now() / 120) % 4;

        ctx.clearRect(0, 0, w, h);

        if (!isUnlocked) {
            // Hand-drawn 3D Locked Blueprint Silhouette
            rc.ellipse(cx + 1, cy + 2, 44, 44, {
                seed: 9000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0,0,0,0.18)',
                fillStyle: 'solid'
            });
            rc.circle(cx, cy, 44, {
                seed: 9100 + frameIdx * 5,
                roughness: 1.5,
                stroke: '#64748b',
                strokeWidth: 1.8,
                fillStyle: 'cross-hatch',
                fill: 'rgba(100, 116, 139, 0.12)',
                hachureGap: 4
            });
            ctx.save();
            ctx.font = 'bold 20px Fredoka, cursive';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', cx, cy);
            ctx.restore();
            return;
        }

        // ======================================================================
        // 1. PADDLE SKINS (3D Tactile Drafting Tools)
        // ======================================================================
        if (category === 'skins') {
            // 3D Drop Shadow
            rc.ellipse(cx + 2, cy + 4, 76, 18, {
                seed: 1000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0,0,0,0.22)',
                fillStyle: 'solid'
            });

            if (itemId === 'classic') {
                rc.rectangle(cx - 36, cy - 8, 72, 16, {
                    seed: 1100 + frameIdx * 10,
                    roughness: 1.2,
                    stroke: '#38bdf8',
                    strokeWidth: 2,
                    fill: '#0284c7',
                    fillStyle: 'solid'
                });
                rc.circle(cx, cy, 8, {
                    seed: 1150 + frameIdx * 5,
                    roughness: 1.0,
                    stroke: '#ffffff',
                    fill: '#ffffff',
                    fillStyle: 'solid'
                });
            } else if (itemId === 'ruler') {
                rc.rectangle(cx - 40, cy - 9, 80, 18, {
                    seed: 1200 + frameIdx * 10,
                    roughness: 1.1,
                    stroke: '#78350f',
                    strokeWidth: 2,
                    fill: '#fde68a',
                    fillStyle: 'solid'
                });
                ctx.save();
                ctx.strokeStyle = '#78350f';
                ctx.lineWidth = 1.4;
                for (let i = -32; i <= 32; i += 6) {
                    const isMajor = i % 18 === 0;
                    ctx.beginPath();
                    ctx.moveTo(cx + i, cy - 9);
                    ctx.lineTo(cx + i, cy - 9 + (isMajor ? 7 : 4));
                    ctx.stroke();
                }
                ctx.restore();
            } else if (itemId === 'quill') {
                rc.ellipse(cx, cy, 76, 20, {
                    seed: 1300 + frameIdx * 10,
                    roughness: 1.3,
                    stroke: '#1e293b',
                    strokeWidth: 2,
                    fill: '#f8fafc',
                    fillStyle: 'solid'
                });
                rc.polygon([
                    [cx - 38, cy],
                    [cx - 46, cy - 4],
                    [cx - 46, cy + 4]
                ], {
                    seed: 1350 + frameIdx * 5,
                    roughness: 1.1,
                    stroke: '#b45309',
                    strokeWidth: 1.5,
                    fill: '#fbbf24',
                    fillStyle: 'solid'
                });
            } else if (itemId === 'gold') {
                rc.rectangle(cx - 38, cy - 8, 76, 16, {
                    seed: 1400 + frameIdx * 10,
                    roughness: 1.2,
                    stroke: '#b45309',
                    strokeWidth: 2.2,
                    fill: '#fbbf24',
                    fillStyle: 'solid'
                });
                rc.circle(cx, cy, 10, {
                    seed: 1450 + frameIdx * 5,
                    roughness: 1.0,
                    stroke: '#ffffff',
                    fill: '#ffffff',
                    fillStyle: 'solid'
                });
            }
        } 
        // ======================================================================
        // 2. BALL TRAILS (3D Flowing Chromatic & Particle Plumes)
        // ======================================================================
        else if (category === 'trails') {
            const colors = {
                charcoal: '#94a3b8',
                rainbow: '#f43f5e',
                nebula: '#a855f7',
                neon: '#38bdf8'
            };
            const col = colors[itemId] || '#38bdf8';

            // 3D Shadow Swarm
            for (let i = 0; i < 5; i++) {
                const px = cx - 28 + i * 14;
                const py = cy + Math.sin(i * 0.9) * 7;
                rc.circle(px + 1.5, py + 2.5, 10 + i * 2, {
                    seed: 2000 + i * 50 + frameIdx * 5,
                    roughness: 1.4,
                    stroke: 'transparent',
                    fill: 'rgba(0,0,0,0.18)',
                    fillStyle: 'solid'
                });
            }

            // Foreground Particle Stream
            for (let i = 0; i < 5; i++) {
                const px = cx - 28 + i * 14;
                const py = cy + Math.sin(i * 0.9) * 7;
                const r = 4 + i * 1.5;
                const nodeHue = itemId === 'rainbow' ? (i * 65) : null;
                const fillCol = nodeHue !== null ? `hsla(${nodeHue}, 90%, 60%, 0.85)` : col;

                rc.circle(px, py, r * 2, {
                    seed: 2100 + i * 50 + frameIdx * 8,
                    roughness: 1.3,
                    stroke: col,
                    strokeWidth: 1.6,
                    fill: fillCol,
                    fillStyle: 'solid'
                });
            }
        } 
        // ======================================================================
        // 3. CRYSTAL PRISMS & MONOLITHS (3D Faceted Crystals)
        // ======================================================================
        else if (category === 'crystals') {
            const crystalTypes = {
                emerald: { col: '#10b981', fill: 'dots', stroke: '#047857' },
                amber: { col: '#f59e0b', fill: 'zigzag', stroke: '#b45309' },
                sapphire: { col: '#06b6d4', fill: 'cross-hatch', stroke: '#0e7490' },
                ruby: { col: '#ef4444', fill: 'hachure', stroke: '#b91c1c' },
                amethyst: { col: '#a855f7', fill: 'cross-hatch', stroke: '#7e22ce' },
                gold: { col: '#fbbf24', fill: 'solid', stroke: '#d97706' },
                obsidian: { col: '#475569', fill: 'cross-hatch', stroke: '#1e293b' }
            };
            const info = crystalTypes[itemId] || crystalTypes.emerald;

            // 3D Drop Shadow
            rc.polygon([
                [cx + 2, cy - 20],
                [cx + 26, cy - 4],
                [cx + 18, cy + 26],
                [cx - 16, cy + 26],
                [cx - 24, cy - 4]
            ], {
                seed: 3000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0,0,0,0.22)',
                fillStyle: 'solid'
            });

            // 3D Faceted Crystal Body
            rc.polygon([
                [cx, cy - 22],
                [cx + 24, cy - 6],
                [cx + 16, cy + 24],
                [cx - 16, cy + 24],
                [cx - 24, cy - 6]
            ], {
                seed: 3100 + frameIdx * 10,
                roughness: 1.2,
                stroke: info.stroke,
                strokeWidth: 2.2,
                fill: info.col,
                fillStyle: info.fill,
                hachureGap: 3
            });

            // Facet Specular Ridge
            rc.line(cx, cy - 22, cx, cy + 24, {
                seed: 3200 + frameIdx * 5,
                roughness: 1.1,
                stroke: '#ffffff',
                strokeWidth: 1.6
            });
        } 
        // ======================================================================
        // 4. BOSS TROPHIES (3D Living Sketchbook Arch-Enemies)
        // ======================================================================
        else if (category === 'bosses') {
            // 3D Shadow
            rc.ellipse(cx + 2, cy + 20, 56, 14, {
                seed: 4000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0,0,0,0.25)',
                fillStyle: 'solid'
            });

            if (itemId === 'eraser') {
                rc.rectangle(cx - 28, cy - 16, 28, 32, {
                    seed: 4100 + frameIdx * 8,
                    roughness: 1.2,
                    stroke: '#881337',
                    strokeWidth: 2,
                    fill: '#fb7185',
                    fillStyle: 'solid'
                });
                rc.rectangle(cx, cy - 16, 28, 32, {
                    seed: 4150 + frameIdx * 8,
                    roughness: 1.2,
                    stroke: '#0369a1',
                    strokeWidth: 2,
                    fill: '#38bdf8',
                    fillStyle: 'solid'
                });
            } else if (itemId === 'ink') {
                rc.rectangle(cx - 18, cy - 12, 36, 28, {
                    seed: 4200 + frameIdx * 8,
                    roughness: 1.3,
                    stroke: '#4c1d95',
                    strokeWidth: 2.2,
                    fill: '#3b82f6',
                    fillStyle: 'solid'
                });
                rc.circle(cx, cy + 2, 20, {
                    seed: 4250 + frameIdx * 8,
                    roughness: 1.4,
                    stroke: '#a855f7',
                    strokeWidth: 2.5,
                    fill: '#1e1b4b',
                    fillStyle: 'zigzag'
                });
            } else if (itemId === 'pencil') {
                rc.rectangle(cx - 12, cy - 22, 24, 32, {
                    seed: 4300 + frameIdx * 8,
                    roughness: 1.2,
                    stroke: '#78350f',
                    strokeWidth: 2,
                    fill: '#f59e0b',
                    fillStyle: 'solid'
                });
                rc.polygon([
                    [cx - 12, cy + 10],
                    [cx + 12, cy + 10],
                    [cx, cy + 26]
                ], {
                    seed: 4350 + frameIdx * 5,
                    roughness: 1.1,
                    stroke: '#78350f',
                    strokeWidth: 2,
                    fill: '#fde68a',
                    fillStyle: 'solid'
                });
                rc.polygon([
                    [cx - 4, cy + 20],
                    [cx + 4, cy + 20],
                    [cx, cy + 26]
                ], {
                    seed: 4380 + frameIdx * 5,
                    stroke: '#1e293b',
                    strokeWidth: 1.5,
                    fill: '#1e293b',
                    fillStyle: 'solid'
                });
            }
        } 
        // ======================================================================
        // 5. ACHIEVEMENTS (3D Golden Wax Seal Medal with Boiling Rays)
        // ======================================================================
        else if (category === 'achievements') {
            // 3D Drop Shadow
            rc.circle(cx + 2, cy + 3, 44, {
                seed: 5000 + frameIdx * 5,
                roughness: 1.4,
                stroke: 'transparent',
                fill: 'rgba(0,0,0,0.25)',
                fillStyle: 'solid'
            });

            // Outer Wax Seal Ring
            rc.circle(cx, cy, 44, {
                seed: 5100 + frameIdx * 8,
                roughness: 1.4,
                stroke: '#b45309',
                strokeWidth: 2.5,
                fill: '#fbbf24',
                fillStyle: 'solid'
            });

            // Inner Relief Medal with Crosshatch Engraving
            rc.circle(cx, cy, 34, {
                seed: 5200 + frameIdx * 6,
                roughness: 1.1,
                stroke: '#78350f',
                strokeWidth: 1.5,
                fill: '#f59e0b',
                fillStyle: 'hachure',
                hachureGap: 3
            });

            // Star Centerpiece
            ctx.save();
            ctx.font = 'bold 18px Fredoka, cursive';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', cx, cy);
            ctx.restore();
        }
    }
}

window.SketchItemRenderer = SketchItemRenderer;
