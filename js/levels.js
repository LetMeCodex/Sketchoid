/**
 * Neo-Arkanoid Level Blueprints & Endless Procedural Wave Generator
 */
const BRICK_TYPES = {
    EMERALD: { code: 'E', id: 'emerald', name: 'Emerald', hp: 1, color: '#10b981', strokeColor: '#047857', fillStyle: 'dots', score: 60 },
    AMBER: { code: 'A', id: 'amber', name: 'Amber', hp: 2, color: '#f59e0b', strokeColor: '#b45309', fillStyle: 'zigzag', score: 120 },
    SAPPHIRE: { code: 'S', id: 'sapphire', name: 'Sapphire', hp: 2, color: '#06b6d4', strokeColor: '#0e7490', fillStyle: 'cross-hatch', score: 180 },
    RUBY: { code: 'R', id: 'ruby', name: 'Ruby (Explosive)', hp: 3, color: '#ef4444', strokeColor: '#b91c1c', fillStyle: 'hachure', score: 300, isExplosive: true },
    AMETHYST: { code: 'M', id: 'amethyst', name: 'Amethyst (Armored)', hp: 4, color: '#a855f7', strokeColor: '#7e22ce', fillStyle: 'cross-hatch', score: 500 },
    GOLD: { code: 'G', id: 'gold', name: 'Golden Vault', hp: 1, color: '#fbbf24', strokeColor: '#d97706', fillStyle: 'solid', score: 250, dropsPowerup: true },
    OBSIDIAN: { code: 'X', id: 'obsidian', name: 'Obsidian Barrier', hp: Infinity, color: '#475569', strokeColor: '#1e293b', fillStyle: 'cross-hatch', score: 0, unbreakable: true }
};

const LEVELS = [
    {
        id: 1,
        name: "The Prismatic Gate",
        subtitle: "A balanced gateway of crystals and gold",
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
        name: "The Amber Bastion",
        subtitle: "Reinforced defense lines with strategic Ruby bomb triggers",
        rows: [
            ".R..AA....AA..R.",
            ".A.SSSS..SSSS.A.",
            ".A.S.MM..MM.S.A.",
            ".R.S.MG..GM.S.R.",
            "...S.MM..MM.S...",
            ".E.SSSS..SSSS.E.",
            ".EEEE......EEEE."
        ]
    },
    {
        id: 3,
        name: "Sapphire Citadel",
        subtitle: "Dense diamond structure with indestructible obsidian pillars",
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
        name: "The Amethyst Monarch",
        subtitle: "Royal armored crest guarded by explosive Ruby clusters",
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
        name: "The Neo-Nexus Core",
        subtitle: "Master labyrinth featuring cascading chain reactions",
        rows: [
            "RR.MM.GG.GG.MM.RR",
            "SS.AA.MM.MM.AA.SS",
            "EE.SS.X..X.SS.EE",
            "GG.RR.E..E.RR.GG",
            "MM.GG.SSSS.GG.MM",
            "AA.EE.RRRR.EE.AA",
            "SS.AA.EEEE.AA.SS"
        ]
    }
];

/**
 * Generate infinite procedural wave
 */
function generateProceduralLevel(levelNum) {
    const rows = [];
    const width = 14;
    const height = Math.min(6 + Math.floor(levelNum / 2), 10);
    const difficultyFactor = Math.min(levelNum * 0.15, 1.0);

    for (let r = 0; r < height; r++) {
        let rowStr = "";
        for (let c = 0; c < width; c++) {
            // Symmetrical generation
            const mirrorCol = c < width / 2 ? c : (width - 1 - c);
            const rand = Math.random();

            if (r === 0 && (c === 0 || c === width - 1)) {
                rowStr += ".";
            } else if (rand < 0.18 - difficultyFactor * 0.08) {
                rowStr += ".";
            } else if (rand < 0.28) {
                rowStr += "G"; // Golden
            } else if (rand < 0.40 && difficultyFactor > 0.4 && r > 1) {
                rowStr += "X"; // Obsidian
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

    return {
        id: levelNum,
        name: `Sector ${levelNum}: Quantum Rift`,
        subtitle: `Procedurally generated crystal matrix (Wave ${levelNum})`,
        rows
    };
}

window.LEVELS = LEVELS;
window.BRICK_TYPES = BRICK_TYPES;
window.generateProceduralLevel = generateProceduralLevel;
