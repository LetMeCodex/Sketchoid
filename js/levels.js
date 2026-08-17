/**
 * SKETCHOID Level Blueprints & 3 Boss Encounters (Phase 2 & Phase 3 Evolution)
 * Sector 1: Clean Draft, Sector 2: Portal Matrix,
 * Sector 3: 🧼 The Eraser Boss, Sector 4: 🖋️ The Living Ink Boss, Sector 5: ✏️ The Arch-Pencil Boss!
 */

const BRICK_TYPES = {
    EMERALD: { code: 'E', id: 'emerald', name: 'Emerald (Speed)', hp: 1, color: '#10b981', strokeColor: '#047857', fillStyle: 'dots', score: 60 },
    AMBER: { code: 'A', id: 'amber', name: 'Amber (Weakpoint)', hp: 2, color: '#f59e0b', strokeColor: '#b45309', fillStyle: 'zigzag', score: 120 },
    SAPPHIRE: { code: 'S', id: 'sapphire', name: 'Sapphire (Resonance)', hp: 2, color: '#06b6d4', strokeColor: '#0e7490', fillStyle: 'cross-hatch', score: 180 },
    RUBY: { code: 'R', id: 'ruby', name: 'Ruby (Explosive)', hp: 3, color: '#ef4444', strokeColor: '#b91c1c', fillStyle: 'hachure', score: 300, isExplosive: true },
    AMETHYST: { code: 'M', id: 'amethyst', name: 'Amethyst (Armored)', hp: 4, color: '#a855f7', strokeColor: '#7e22ce', fillStyle: 'cross-hatch', score: 500 },
    GOLD: { code: 'G', id: 'gold', name: 'Golden Vault', hp: 1, color: '#fbbf24', strokeColor: '#d97706', fillStyle: 'solid', score: 250, dropsPowerup: true },
    OBSIDIAN: { code: 'X', id: 'obsidian', name: 'Obsidian Barrier', hp: Infinity, color: '#475569', strokeColor: '#1e293b', fillStyle: 'cross-hatch', score: 0, unbreakable: true }
};

const LEVELS = [
    {
        id: 1,
        stageNumber: 1,
        name: "Sector 1: The Clean Draft",
        subtitle: "A pristine graph-paper gateway of crystals and gold",
        geometry: {
            windmills: [],
            portals: [],
            vortexes: []
        },
        hasBoss: false,
        rows: [
            "................",
            "...E..E..E..E...",
            "..AAAAAAAAAAAA..",
            "..SSSS.GG.SSSS..",
            "..RRRR....RRRR..",
            "...EEEE..EEEE...",
            "................"
        ]
    },
    {
        id: 2,
        stageNumber: 2,
        name: "Sector 2: The Portal Matrix",
        subtitle: "Twin Ink Portals & revolving windmill kinetic deflection",
        geometry: {
            windmills: [
                { x: 400, y: 260, length: 85, speed: 1.4, color: '#38bdf8' }
            ],
            portals: [
                { entryX: 120, entryY: 280, exitX: 680, exitY: 280, colorA: '#38bdf8', colorB: '#f97316' }
            ],
            vortexes: []
        },
        hasBoss: false,
        rows: [
            ".R..AA....AA..R.",
            ".A.SSSS..SSSS.A.",
            ".A.S.MM..MM.S.A.",
            ".R.S.MG..GM.S.R.",
            "...S........S...",
            ".E.SSSS..SSSS.E.",
            ".EEEE......EEEE."
        ]
    },
    {
        id: 3,
        stageNumber: 3,
        name: "Sector 3: 🧼 The Eraser",
        subtitle: "BOSS ENCOUNTER: The Void Rub-Out erasing bricks mid-flight!",
        geometry: {
            windmills: [],
            portals: [],
            vortexes: []
        },
        hasBoss: true,
        bossType: 'eraser',
        rows: [
            "......MMMM......",
            "....SSSSSSSS....",
            "...SS.X..X.SS...",
            "..RR..G..G..RR..",
            ".AA.X.EEEE.X.AA.",
            "..RR..G..G..RR..",
            "...SS.X..X.SS...",
            "....SSSSSSSS....",
            "......EEEE......"
        ]
    },
    {
        id: 4,
        stageNumber: 4,
        name: "Sector 4: 🖋️ The Living Ink",
        subtitle: "BOSS ENCOUNTER: Corrosive Ink Bleeds constricting your arena!",
        geometry: {
            windmills: [],
            portals: [],
            vortexes: [
                { x: 400, y: 240, strength: 200, radius: 100, color: '#a855f7' }
            ]
        },
        hasBoss: true,
        bossType: 'ink',
        rows: [
            "..M.M.MMMM.M.M..",
            "..MMMMMMMMMMMM..",
            "..M.R.SSSS.R.M..",
            ".MM.R.SGGSR.MM.",
            ".AA...AAAA...AA.",
            ".AAAA.EEEE.AAAA.",
            "..EEEE....EEEE.."
        ]
    },
    {
        id: 5,
        stageNumber: 5,
        name: "Sector 5: ✏️ The Arch-Pencil",
        subtitle: "BOSS ENCOUNTER: The Sentient Drafter live-sketching physical obstacles!",
        geometry: {
            windmills: [
                { x: 180, y: 320, length: 70, speed: -1.2, color: '#f59e0b' },
                { x: 620, y: 320, length: 70, speed: 1.2, color: '#f59e0b' }
            ],
            portals: [],
            vortexes: []
        },
        hasBoss: true,
        bossType: 'pencil',
        rows: [
            "RR.MM......MM.RR",
            "SS.AA.GG.GG.AA.SS",
            "EE.SS.X..X.SS.EE",
            "GG.RR.E..E.RR.GG",
            "MM.GG......GG.MM",
            "AA.EE.RRRR.EE.AA",
            "SS.AA.EEEE.AA.SS"
        ]
    }
];

function generateProceduralLevel(levelNum) {
    const rows = [];
    const width = 14;
    const height = Math.min(6 + Math.floor(levelNum / 2), 10);
    const difficultyFactor = Math.min(levelNum * 0.15, 1.0);

    for (let r = 0; r < height; r++) {
        let rowStr = "";
        for (let c = 0; c < width; c++) {
            const rand = Math.random();
            if (r === 0 && (c === 0 || c === width - 1)) {
                rowStr += ".";
            } else if (rand < 0.18 - difficultyFactor * 0.08) {
                rowStr += ".";
            } else if (rand < 0.28) {
                rowStr += "G";
            } else if (rand < 0.40 && difficultyFactor > 0.4 && r > 1) {
                rowStr += "X";
            } else if (rand < 0.55 + difficultyFactor * 0.2) {
                rowStr += difficultyFactor > 0.5 ? "M" : "R";
            } else if (rand < 0.75) {
                rowStr += "S";
            } else if (rand < 0.9) {
                rowStr += "A";
            } else {
                rowStr += "E";
            }
        }
        rows.push(rowStr);
    }

    const bossTypes = ['eraser', 'ink', 'pencil'];
    const isBossLevel = levelNum > 0 && levelNum % 3 === 0;

    return {
        id: `infinite_${levelNum}`,
        stageNumber: ((levelNum - 1) % 5) + 1,
        name: isBossLevel ? `Rift ${levelNum}: Boss Convergence` : `Rift ${levelNum}: Procedural Fracture`,
        subtitle: isBossLevel ? `A chaotic entity has breached the sketchbook boundary!` : `Dynamic geometry at entropy tier ${difficultyFactor.toFixed(2)}`,
        hasBoss: isBossLevel,
        bossType: isBossLevel ? bossTypes[levelNum % bossTypes.length] : null,
        geometry: {
            windmills: levelNum % 2 === 0 ? [{ x: 400, y: 260, length: 80, speed: 1.5, color: '#38bdf8' }] : [],
            portals: levelNum % 3 === 0 ? [{ entryX: 120, entryY: 280, exitX: 680, exitY: 280, colorA: '#38bdf8', colorB: '#f97316' }] : [],
            vortexes: levelNum % 4 === 0 ? [{ x: 400, y: 220, strength: 200, radius: 100, color: '#a855f7' }] : []
        },
        rows: rows
    };
}

window.BRICK_TYPES = BRICK_TYPES;
window.LEVELS = LEVELS;
window.generateProceduralLevel = generateProceduralLevel;
