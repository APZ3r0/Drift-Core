# Drift Core

A browser-based asteroid mining game built with React and the Web Audio API. Mine ore, manage your cargo, upgrade your ship, and survive random deep-space events.

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/APZ3r0/Drift-Core.git

# 2. Enter the project directory
cd Drift-Core
# Full path on this machine: /home/user/Drift-Core

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

> **Already cloned?** Just navigate to the folder and run the dev server:
> ```bash
> cd /home/user/Drift-Core
> npm run dev
> ```

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static file host or:

```bash
npm run preview
```

## Project structure

```
Drift-Core/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── package.json
└── src/
    ├── main.jsx                # React root mount
    └── components/
        └── DriftCore.jsx       # Entire game (self-contained)
```

## How to play

| Input | Action |
|-------|--------|
| Click / tap | Move ship |
| WASD / Arrow keys | Move ship |
| Click asteroid | Target and mine |
| Click station (when nearby) | Dock |
| `Esc` | Dock at station (when nearby) |
| 🔊 button | Toggle mute |

### Station tabs

| Tab | Description |
|-----|-------------|
| **Cargo** | Sell ore, fill active contracts |
| **Upgrades** | Two-path upgrades for drill, engine, cargo, hull, scanner |
| **Ships** | Buy new vessels (Drifter, Hauler, Specter, Ravager, Beacon) |
| **Market** | Live ore prices — shift every dock, watch for SURGE/CRASH |
| **Stats** | Session stats and milestone tracker |

### Special asteroids

| Type | Effect |
|------|--------|
| ✦ Golden | 3× ore per strike |
| ◈ Crystal | Splits into 2 mini-asteroids on depletion |
| ☢ Radioactive | Drains hull slowly while mining |

### Random events

Fires roughly every 15 seconds while flying:

- **Ore Surge** — 2× mining yield for 20s
- **Cosmic Storm** — hull damage
- **Derelict Pod** — free CR salvage
- **Pirate Ambush** — lose CR and hull
- **Wormhole** — teleport to a random asteroid

## Save data

Progress is saved automatically to `localStorage` on dock, sell, upgrade, and ship purchase. Use **Reset Save** in the station footer to start fresh.
