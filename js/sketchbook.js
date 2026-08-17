/**
 * SKETCHOID Living Sketchbook World & Atmosphere Engine (Theme 2.0 & Dynamic Weather)
 * Multi-layer canvas renderer with notebook binder rings, margin equations, coffee stains,
 * ink splatters, stage evolution, 3D Page Turns, and Dynamic Weather (Rain, Wind, Cosmic, Ember).
 */

class SketchbookWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.currentStage = 1;

        // Weather System: 'none' | 'rain' | 'wind' | 'cosmic' | 'ember'
        this.weather = 'wind';
        this.rainDroplets = [];
        this.dustMotes = [];
        this.constellations = [];

        // Persistent Ink Splatters on the page
        this.inkSplatters = [];
        this.maxSplatters = 20;

        // Micro-jitter boil cycle (3-frame loop at 12fps)
        this.boilFrame = 0;
        this.boilTimer = 0;
        this.boilSeedOffset = 0;

        // Page Turn Mutation State
        this.isPageTurning = false;
        this.pageTurnProgress = 0;
        this.pageTurnCallback = null;

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

        this.initWeather();
    }

    initWeather() {
        // Init dust motes for gentle wind
        this.dustMotes = [];
        for (let i = 0; i < 15; i++) {
            this.dustMotes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: 0.2 + Math.random() * 0.4,
                vy: (Math.random() - 0.5) * 0.3,
                radius: 0.8 + Math.random() * 1.5,
                alpha: 0.2 + Math.random() * 0.3
            });
        }

        // Init cosmic stars
        this.constellations = [];
        for (let i = 0; i < 18; i++) {
            this.constellations.push({
                x: 60 + Math.random() * (this.width - 120),
                y: 50 + Math.random() * (this.height - 100),
                radius: 1.0 + Math.random() * 1.8,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    setStage(stageNum) {
        this.currentStage = Math.max(1, Math.min(5, stageNum));
        if (this.currentStage === 1) this.weather = 'none';
        else if (this.currentStage === 2) this.weather = 'wind';
        else if (this.currentStage === 3) this.weather = 'rain';
        else if (this.currentStage === 4) this.weather = 'cosmic';
        else if (this.currentStage === 5) this.weather = 'ember';
    }

    triggerPageTurn(onCompleteCallback) {
        this.isPageTurning = true;
        this.pageTurnProgress = 0;
        this.pageTurnCallback = onCompleteCallback;
        window.soundEngine?.playWallTick();
    }

    addInkSplatter(x, y, color = '#1e293b', size = 10) {
        if (this.inkSplatters.length > this.maxSplatters) {
            this.inkSplatters.shift();
        }

        const droplets = [];
        const numDroplets = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numDroplets; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * size * 1.2;
            droplets.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                r: 1.2 + Math.random() * 2.5
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
        this.boilTimer += dt;
        if (this.boilTimer >= 0.083) {
            this.boilTimer = 0;
            this.boilFrame = (this.boilFrame + 1) % 3;
            this.boilSeedOffset = this.boilFrame * 313;
        }

        if (this.isPageTurning) {
            this.pageTurnProgress += dt * 1.6;
            if (this.pageTurnProgress >= 1.0) {
                this.isPageTurning = false;
                this.pageTurnProgress = 0;
                if (this.pageTurnCallback) {
                    this.pageTurnCallback();
                    this.pageTurnCallback = null;
                }
            }
        }

        // Update Dynamic Weather Particles
        if (this.weather === 'wind' || this.weather === 'ember') {
            for (const d of this.dustMotes) {
                d.x += d.vx;
                d.y += d.vy;
                if (d.x > this.width) d.x = 0;
                if (d.y < 0) d.y = this.height;
                if (d.y > this.height) d.y = 0;
            }
        } else if (this.weather === 'rain') {
            if (Math.random() < 0.12 && this.rainDroplets.length < 12) {
                this.rainDroplets.push({
                    x: 60 + Math.random() * (this.width - 120),
                    y: 60 + Math.random() * (this.height - 120),
                    radius: 2,
                    maxRadius: 16 + Math.random() * 14,
                    alpha: 0.6
                });
            }

            for (let i = this.rainDroplets.length - 1; i >= 0; i--) {
                const rd = this.rainDroplets[i];
                rd.radius += dt * 25;
                rd.alpha -= dt * 1.2;
                if (rd.alpha <= 0 || rd.radius >= rd.maxRadius) {
                    this.rainDroplets.splice(i, 1);
                }
            }
        } else if (this.weather === 'cosmic') {
            for (const c of this.constellations) {
                c.twinkle += dt * 2.5;
            }
        }

        for (let i = this.inkSplatters.length - 1; i >= 0; i--) {
            const s = this.inkSplatters[i];
            s.alpha = Math.max(0.15, s.alpha - dt * 0.015);
        }
    }

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
            rc.arc(holeX, hy, 18, 14, -Math.PI * 0.7, Math.PI * 0.7, false, {
                seed: seed + i * 5,
                stroke: theme.borderStroke,
                strokeWidth: 2.5
            });
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

        // 4. Protractor Angle Arc (Stage 2+)
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

        // 6. Persistent Ink Splatters
        for (const sp of this.inkSplatters) {
            ctx.save();
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = sp.alpha * 0.40;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.mainRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            for (const d of sp.droplets) {
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 7. Dynamic Weather & Atmospheric Layer
        this.drawWeatherEffects(ctx, rc, theme);

        // 8. Stage 5: Torn Reality / Charred Edge Holes
        if (stage === 5) {
            ctx.save();
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

            ctx.fillStyle = theme.bgDark ? 'rgba(0,0,0,0.3)' : 'rgba(30, 27, 75, 0.08)';
            ctx.beginPath();
            ctx.moveTo(this.width - 120, 0);
            ctx.lineTo(this.width, 0);
            ctx.lineTo(this.width, 140);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // 9. Hand-Drawn 3D Page Turn Sweep Overlay
        if (this.isPageTurning) {
            this.drawPageTurnEffect(ctx, rc, theme);
        }

        ctx.restore();
    }

    drawWeatherEffects(ctx, rc, theme) {
        ctx.save();

        if (this.weather === 'wind') {
            // Floating graphite dust motes
            ctx.fillStyle = theme.inkColor;
            for (const d of this.dustMotes) {
                ctx.globalAlpha = d.alpha * 0.4;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.weather === 'rain') {
            // Expanding water ripple rings
            ctx.strokeStyle = theme.borderStroke;
            for (const rd of this.rainDroplets) {
                ctx.globalAlpha = rd.alpha * 0.35;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(rd.x, rd.y, rd.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (this.weather === 'cosmic') {
            // Constellation star grid
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.lineWidth = 1.0;

            ctx.beginPath();
            for (let i = 0; i < this.constellations.length; i++) {
                const c = this.constellations[i];
                const alpha = 0.3 + Math.sin(c.twinkle) * 0.25;
                ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                ctx.fillRect(c.x - 1, c.y - 1, 2.5, 2.5);

                if (i < this.constellations.length - 1 && i % 3 !== 0) {
                    const next = this.constellations[i + 1];
                    ctx.moveTo(c.x, c.y);
                    ctx.lineTo(next.x, next.y);
                }
            }
            ctx.stroke();
        } else if (this.weather === 'ember') {
            // Charred glowing ember flakes
            ctx.fillStyle = '#f97316';
            for (const d of this.dustMotes) {
                ctx.globalAlpha = d.alpha * 0.6;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius * 1.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawPageTurnEffect(ctx, rc, theme) {
        ctx.save();
        const p = this.pageTurnProgress;
        const peelX = this.width * (1.0 - p * 1.1);
        const curlWidth = 140 * Math.sin(p * Math.PI);

        const shadowGrad = ctx.createLinearGradient(peelX - curlWidth, 0, peelX + 40, 0);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
        shadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.35)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0.6)');

        ctx.fillStyle = shadowGrad;
        ctx.fillRect(peelX - curlWidth, 0, curlWidth + 40, this.height);

        rc.rectangle(peelX, 0, this.width - peelX + 20, this.height, {
            seed: 777 + Math.floor(p * 10),
            roughness: 1.4,
            stroke: theme.borderStroke,
            strokeWidth: 3,
            fill: theme.bgDark ? '#1e293b' : '#f1f5f9',
            fillStyle: 'solid'
        });

        rc.line(peelX, 0, peelX, this.height, {
            seed: 888,
            stroke: theme.borderStroke,
            strokeWidth: 3.5
        });

        ctx.restore();
    }
}

window.SketchbookWorld = SketchbookWorld;
