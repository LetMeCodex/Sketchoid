# ✏️ SKETCHOID
> **The Hand-Drawn Neo-Arkanoid Brick Breaker Arcade Experience**

Built with **Rough.js**, **Anime.js**, and procedural **Web Audio API** pentatonic sound synthesis.

---

## 🕹️ Live Features

- 🎨 **Hand-Drawn Boiling Canvas**: 60 FPS multi-frame line jitter rendering with Rough.js.
- 💎 **Multi-Tiered Crystal Bricks**:
  - 🔴 **Ruby** (Explosive Crosshatch, chain reactions)
  - 🟠 **Amber** (2 HP Zigzag Core)
  - 🟢 **Emerald** (1 HP Speed Crystal)
  - 🔵 **Sapphire** (2 HP Diagonal Resonance)
  - 🟣 **Amethyst** (4 HP Armored Royal Hachure)
  - 🟡 **Golden Vault** (Guaranteed Powerup Drops)
  - ⬛ **Obsidian Barrier** (Indestructible Ricochet Pillar)
- ⚡ **Golden Powerup Drops**:
  - ⚡ 3x Multiball Frenzy
  - 🛡️ Wide Paddle Spring Wings
  - 🔫 Dual Laser Blaster Turrets (`Space` / `Click` to shoot)
  - 🔥 Meteor Fireball (Pierce Mode)
  - 🕸️ Safety Net Trampoline
  - ⏱️ Chrono Time Dilation
- 🎵 **Procedural Pentatonic Audio Synth**: Ascending major pentatonic scale chime cascade ($C_4 \to C_7$) triggered by combo streaks, FM synthesis crystal bells, laser zaps, and explosion rumbles.
- 🎨 **3 Visual Themes**: *Dark Blueprint*, *Vintage Parchment*, and *Neon Chalkboard*.
- 🗺️ **5 Hand-Crafted Stages + Infinite Endless Mode**.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/LetMeCodex/Sketchoid.git

# Navigate into directory
cd Sketchoid

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173/` in your browser!

---

## 🎮 Controls

| Key / Action | Function |
| :--- | :--- |
| **Mouse / `A` `D` / Arrow Keys** | Move Elastic Paddle |
| **`Space` / `Left-Click` / `W` / `Up`** | Launch Ball / Fire Dual Lasers |
| **`P` / `Escape`** | Pause / Resume |
| **`T`** | Switch Theme (*Blueprint / Parchment / Neon*) |
| **`M`** | Toggle Sound On/Off |

---

## 📄 License
MIT
