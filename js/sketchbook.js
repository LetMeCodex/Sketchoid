/**
 * SKETCHOID Living Sketchbook World & Atmosphere Engine
 * Multi-layer canvas renderer with notebook binder rings, margin equations, coffee stains, ink splatters, and stage evolution
 */

class SketchbookWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.currentStage = 1;

        // Persistent Ink Splatters on the page
        this.inkSplatters = [];
        this.maxSplatters = 35;

        // Micro-jitter boil cycle (3-frame loop at 12fps)
        this.boilFrame = 0;
        this.boilTimer = 0;
        this.boilSeedOffset = 0;

        // Procedural Coffee Ring Stains
        this.coffeeStains = [
            { x: 120, y: 150, radius: 48, innerRadius: 42, alpha: 0.12, seed: 101 },
            { x: 680, y: 440, radius: 56, innerRadius: 50, alpha: 0.10, seed: 202 }
        ];

        // Atmospheric Margin Scribbles & Technical Field Notes
        this.marginNotes = [
            { text: "PROJECT: SKETCHOID // DRAFT #07", x: 60, y: 32, stage: 1, angle: 0 },
            { text: "m = 1.0  |  F = dp/dt", x: 60, y: 610, stage: 2, angle: -0.02 },
            { text: "θ_rebound = f(offset, v_paddle)", x: 580, y: 32, stage: 2, angle: 0.015 },
            { text: "⚠️ INSTABILITY DETECTED IN SECTOR 3", x: 60, y: 32, stage: 3, angle: -0.01 },
            { text: "INK SEEPAGE: CRITICAL", x: 600, y: 610, stage: 4, angle: 0.03 },
            { text: "REALITY TORN: CONVERGENCE AT HAND", x: 260, y: 32, stage: 5, angle: 0 }
        ];
    }

    setStage(stageNum) {
        this.currentStage = Math.max(1, Math.min(5, stageNum));
    }

    addInkSplatter(x, y, color = '#1e293b', size = 12) {
        if (this.inkSplatters.length > this.maxSplatters) {
            this.inkSplatters.shift();
        }

        const droplets = [];
        const numDroplets = 4 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numDroplets; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 4 + Math.random() * size * 1.5;
            droplets.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                r: 1.5 + Math.random() * 3.5
            });
        }

        this.inkSplatters.push({
            x,
            y,
            mainRadius: size,
            droplets,
            color,
            alpha: 0.85,
            seed: Math.floor(Math.random() * 1000)
        });
    }

    update(dt) {
        // 3-Frame Controlled Jitter (12fps)
        this.boilTimer += dt;
        if (this.boilTimer >= 0.083) { // ~12 FPS
            this.boilTimer = 0;
            this.boilFrame = (this.boilFrame + 1) % 3;
            this.boilSeedOffset = this.boilFrame * 313;
        }

        // Fade ink splatters gradually
        for (let i = this.inkSplatters.length - 1; i >= 0; i--) {
            const s = this.inkSplatters[i];
            s.alpha = Math.max(0.2, s.alpha - dt * 0.015);
        }
    }

    /**
     * Layer 0 & 1: Draw Notebook Atmosphere, Binder Rings, Coffee Stains, and Margin Annotations
     */
    drawBackgroundLayers(ctx, rc, theme) {
        ctx.save();

        const stage = this.currentStage;
        const seed = 42 + this.boilSeedOffset;

        // 1. Binder Ring Holes (Left Margin)
        const holeX = 22;
        const numRings = 7;
        const spacing = (this.height - 80) / (numRings - 1);

        for (let i = 0; i < numRings; i++) {
            const hy = 40 + i * spacing;
            // Metal Binder Ring
            rc.arc(holeX, hy, 18, 14, -Math.PI * 0.7, Math.PI * 0.7, false, {
                seed: seed + i * 5,
                stroke: theme.borderStroke,
                strokeWidth: 2.5
            });
            // Paper Hole Cutout
            ctx.fillStyle = theme.bgDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)';
            ctx.beginPath();
            ctx.arc(holeX, hy, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Margin Red Guide Line
        const marginLineX = 54;
        rc.line(marginLineX, 0, marginLineX, this.height, {
            seed: seed + 50,
            stroke: stage >= 4 ? '#ef4444' : 'rgba(239, 68, 68, 0.35)',
            strokeWidth: 1.8
        });

        // 3. Procedural Coffee Stains (Stage 2+)
        if (stage >= 2) {
            for (const cs of this.coffeeStains) {
                ctx.save();
                ctx.strokeStyle = theme.bgDark ? `rgba(217, 119, 6, ${cs.alpha * 0.7})` : `rgba(180, 83, 9, ${cs.alpha})`;
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                for (let a = 0; a <= Math.PI * 2 + 0.3; a += 0.2) {
                    const r = cs.radius + Math.sin(a * 5 + cs.seed) * 2.5;
                    const px = cs.x + Math.cos(a) * r;
                    const py = cs.y + Math.sin(a) * r;
                    if (a === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.restore();
            }
        }

        // 4. Protractor / Compass Angle Arc (Stage 2+)
        if (stage >= 2 && stage < 5) {
            ctx.save();
            ctx.strokeStyle = theme.gridColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(marginLineX + 80, 520, 45, -Math.PI * 0.5, 0);
            ctx.stroke();
            ctx.font = '9px Architects Daughter, cursive';
            ctx.fillStyle = theme.inkColor;
            ctx.globalAlpha = 0.5;
            ctx.fillText('90°', marginLineX + 75, 470);
            ctx.fillText('45°', marginLineX + 115, 500);
            ctx.restore();
        }

        // 5. Margin Handwritten Notes
        ctx.save();
        ctx.font = '11px Architects Daughter, cursive';
        ctx.fillStyle = theme.inkColor;
        ctx.globalAlpha = 0.65;

        for (const note of this.marginNotes) {
            if (stage >= note.stage) {
                ctx.save();
                ctx.translate(note.x, note.y);
                ctx.rotate(note.angle);
                ctx.fillText(note.text, 0, 0);
                ctx.restore();
            }
        }
        ctx.restore();

        // 6. Persistent Ink Splatters (Stage 3+)
        for (const sp of this.inkSplatters) {
            ctx.save();
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = sp.alpha * 0.45;
            
            // Center splat
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.mainRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Surrounding droplets
            for (const d of sp.droplets) {
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 7. Stage 5: Torn Reality / Void Creases
        if (stage === 5) {
            ctx.save();
            // Ripped page seams
            rc.line(marginLineX + 40, 0, marginLineX + 160, this.height * 0.45, {
                seed: seed + 90,
                stroke: theme.borderStroke,
                strokeWidth: 2
            });
            rc.line(this.width - 80, this.height * 0.3, this.width - 20, this.height * 0.8, {
                seed: seed + 95,
                stroke: theme.borderStroke,
                strokeWidth: 2
            });

            // Void darkness bleeding in
            ctx.fillStyle = theme.bgDark ? 'rgba(0,0,0,0.3)' : 'rgba(30, 27, 75, 0.08)';
            ctx.beginPath();
            ctx.moveTo(this.width - 120, 0);
            ctx.lineTo(this.width, 0);
            ctx.lineTo(this.width, 140);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }
}

window.SketchbookWorld = SketchbookWorld;
