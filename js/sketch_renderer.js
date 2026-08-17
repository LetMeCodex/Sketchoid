/**
 * SKETCHOID Handcrafted Illustration & Item Renderer
 * Uses Rough.js and Anime.js to draw bespoke tactile preview illustrations
 * for Paddle Skins, Ball Trails, Crystal Types, Boss Trophies, and Achievement Medals.
 */

class SketchItemRenderer {
    static drawItemIllustration(canvas, category, itemId, isUnlocked = true) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const rc = (typeof rough !== 'undefined' && rough.canvas) ? rough.canvas(canvas) : window.game?.rc;
        if (!rc) return;

        const cx = w / 2;
        const cy = h / 2;

        if (!isUnlocked) {
            // Hand-drawn Locked Silhouette Blueprint
            rc.circle(cx, cy, Math.min(w, h) * 0.75, {
                roughness: 1.6,
                stroke: '#64748b',
                strokeWidth: 1.5,
                fillStyle: 'cross-hatch',
                fill: 'rgba(100, 116, 139, 0.15)'
            });
            ctx.save();
            ctx.font = 'bold 22px Fredoka, cursive';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', cx, cy);
            ctx.restore();
            return;
        }

        // Bespoke Handcrafted Item Illustrations
        if (category === 'skins') {
            if (itemId === 'classic') {
                // Hand-drawn charcoal paddle
                rc.rectangle(cx - 36, cy - 8, 72, 16, {
                    roughness: 1.2,
                    stroke: '#38bdf8',
                    strokeWidth: 2,
                    fill: '#0284c7',
                    fillStyle: 'hachure'
                });
                rc.circle(cx, cy, 8, { stroke: '#ffffff', fill: '#ffffff', fillStyle: 'solid' });
            } else if (itemId === 'ruler') {
                // Architect Metric Ruler with brass ticks
                rc.rectangle(cx - 40, cy - 9, 80, 18, {
                    roughness: 1.0,
                    stroke: '#78350f',
                    strokeWidth: 2,
                    fill: '#fde68a',
                    fillStyle: 'solid'
                });
                ctx.save();
                ctx.strokeStyle = '#78350f';
                ctx.lineWidth = 1.5;
                for (let i = -30; i <= 30; i += 6) {
                    const isMajor = i % 18 === 0;
                    ctx.beginPath();
                    ctx.moveTo(cx + i, cy - 9);
                    ctx.lineTo(cx + i, cy - 9 + (isMajor ? 7 : 4));
                    ctx.stroke();
                }
                ctx.restore();
            } else if (itemId === 'quill') {
                // Calligraphy Feather Quill
                rc.ellipse(cx, cy, 76, 20, {
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
                    stroke: '#b45309',
                    strokeWidth: 1.5,
                    fill: '#fbbf24',
                    fillStyle: 'solid'
                });
            } else if (itemId === 'gold') {
                // 24K Golden Stylus
                rc.rectangle(cx - 38, cy - 8, 76, 16, {
                    roughness: 1.1,
                    stroke: '#b45309',
                    strokeWidth: 2.2,
                    fill: '#fbbf24',
                    fillStyle: 'solid'
                });
                rc.circle(cx, cy, 10, { stroke: '#ffffff', fill: '#ffffff', fillStyle: 'solid' });
                rc.line(cx - 30, cy - 8, cx - 30, cy + 8, { stroke: '#78350f', strokeWidth: 1.5 });
                rc.line(cx + 30, cy - 8, cx + 30, cy + 8, { stroke: '#78350f', strokeWidth: 1.5 });
            }
        } else if (category === 'trails') {
            const colors = {
                charcoal: '#94a3b8',
                rainbow: '#f43f5e',
                nebula: '#a855f7',
                neon: '#38bdf8'
            };
            const col = colors[itemId] || '#38bdf8';
            
            // Motion Particle Swarm preview
            for (let i = 0; i < 5; i++) {
                const px = cx - 30 + i * 15;
                const py = cy + Math.sin(i * 0.8) * 8;
                const r = 6 + i * 1.5;
                rc.circle(px, py, r * 2, {
                    roughness: 1.4,
                    stroke: col,
                    strokeWidth: 1.8,
                    fill: col,
                    fillStyle: itemId === 'rainbow' ? 'dots' : 'solid'
                });
            }
        } else if (category === 'crystals') {
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

            rc.polygon([
                [cx, cy - 24],
                [cx + 26, cy - 8],
                [cx + 18, cy + 22],
                [cx - 18, cy + 22],
                [cx - 26, cy - 8]
            ], {
                roughness: 1.2,
                stroke: info.stroke,
                strokeWidth: 2.2,
                fill: info.col,
                fillStyle: info.fill
            });
        } else if (category === 'bosses') {
            if (itemId === 'eraser') {
                rc.rectangle(cx - 30, cy - 18, 30, 36, {
                    roughness: 1.2,
                    stroke: '#881337',
                    strokeWidth: 2,
                    fill: '#fb7185',
                    fillStyle: 'solid'
                });
                rc.rectangle(cx, cy - 18, 30, 36, {
                    roughness: 1.2,
                    stroke: '#0369a1',
                    strokeWidth: 2,
                    fill: '#38bdf8',
                    fillStyle: 'solid'
                });
            } else if (itemId === 'ink') {
                rc.rectangle(cx - 20, cy - 14, 40, 32, {
                    roughness: 1.3,
                    stroke: '#4c1d95',
                    strokeWidth: 2.2,
                    fill: '#3b82f6',
                    fillStyle: 'solid'
                });
                rc.circle(cx, cy + 2, 22, {
                    roughness: 1.4,
                    stroke: '#a855f7',
                    strokeWidth: 2.5,
                    fill: '#1e1b4b',
                    fillStyle: 'zigzag'
                });
            } else if (itemId === 'pencil') {
                rc.rectangle(cx - 14, cy - 24, 28, 38, {
                    roughness: 1.2,
                    stroke: '#78350f',
                    strokeWidth: 2,
                    fill: '#f59e0b',
                    fillStyle: 'solid'
                });
                rc.polygon([
                    [cx - 14, cy + 14],
                    [cx + 14, cy + 14],
                    [cx, cy + 30]
                ], {
                    roughness: 1.1,
                    stroke: '#78350f',
                    strokeWidth: 2,
                    fill: '#fde68a',
                    fillStyle: 'solid'
                });
                rc.polygon([
                    [cx - 5, cy + 24],
                    [cx + 5, cy + 24],
                    [cx, cy + 30]
                ], {
                    stroke: '#1e293b',
                    strokeWidth: 1.5,
                    fill: '#1e293b',
                    fillStyle: 'solid'
                });
            }
        } else if (category === 'achievements') {
            // Handcrafted Wax Seal / Star Medal
            rc.circle(cx, cy, 48, {
                roughness: 1.4,
                stroke: '#b45309',
                strokeWidth: 2.5,
                fill: '#fbbf24',
                fillStyle: 'solid'
            });
            rc.circle(cx, cy, 38, {
                roughness: 1.1,
                stroke: '#78350f',
                strokeWidth: 1.5,
                fill: '#f59e0b',
                fillStyle: 'hachure'
            });
            ctx.save();
            ctx.font = 'bold 20px Fredoka, cursive';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', cx, cy);
            ctx.restore();
        }
    }
}

window.SketchItemRenderer = SketchItemRenderer;
