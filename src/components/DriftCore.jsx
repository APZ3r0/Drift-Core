import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════
// AUDIO — Pure Web Audio API, no dependencies
// ═══════════════════════════════════════════
let _a = null;
function A() {
  if (_a) return _a;
  let actx = null;
  let masterGain = null;
  let muted = false;
  let padInterval = null;

  function beep(freq, type, vol, attack, decay) {
    if (!actx || muted) return;
    try {
      const g = actx.createGain();
      g.connect(masterGain);
      const o = actx.createOscillator();
      o.type = type; o.frequency.value = freq; o.connect(g);
      const t = actx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
      o.start(t); o.stop(t + attack + decay + 0.05);
    } catch(e) {}
  }

  function noise(vol, decay) {
    if (!actx || muted) return;
    try {
      const bufSize = Math.floor(actx.sampleRate * decay);
      const buf = actx.createBuffer(1, bufSize, actx.sampleRate);
      const data = buf.getChannelData(0);
      let b0=0,b1=0,b2=0;
      for (let i = 0; i < bufSize; i++) {
        const wh = Math.random()*2-1;
        b0=0.99886*b0+wh*0.0555179; b1=0.99332*b1+wh*0.0750759; b2=0.96900*b2+wh*0.1538520;
        data[i]=(b0+b1+b2+wh*0.5362)*0.11;
      }
      const src = actx.createBufferSource();
      src.buffer = buf;
      const g = actx.createGain(); g.connect(masterGain); src.connect(g);
      const t = actx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      src.start(t);
    } catch(e) {}
  }

  function playPadChord(freqs) {
    if (!actx || muted) return;
    try {
      const chordGain = actx.createGain();
      chordGain.gain.value = 0;
      chordGain.connect(masterGain);
      const delay = actx.createDelay(2.0);
      delay.delayTime.value = 0.35;
      const feedback = actx.createGain(); feedback.gain.value = 0.45;
      const wetGain = actx.createGain(); wetGain.gain.value = 0.3;
      chordGain.connect(delay); delay.connect(feedback); feedback.connect(delay);
      delay.connect(wetGain); wetGain.connect(masterGain);
      freqs.forEach(freq => {
        const o = actx.createOscillator();
        o.type = "sine"; o.frequency.value = freq;
        const mod = actx.createOscillator();
        const modGain = actx.createGain();
        mod.frequency.value = freq * 1.5;
        modGain.gain.value = freq * 0.08;
        mod.connect(modGain); modGain.connect(o.frequency);
        o.connect(chordGain); mod.start(); o.start();
        o.stop(actx.currentTime + 8); mod.stop(actx.currentTime + 8);
      });
      const t = actx.currentTime;
      chordGain.gain.setValueAtTime(0, t);
      chordGain.gain.linearRampToValueAtTime(0.12, t + 1.2);
      chordGain.gain.setValueAtTime(0.12, t + 5);
      chordGain.gain.linearRampToValueAtTime(0, t + 8);
    } catch(e) {}
  }

  _a = {
    ok: false,
    async init() {
      if (this.ok) return;
      actx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = actx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(actx.destination);
      this.ok = true;
      const chords = [
        [65.41,98.00,82.41],[55.00,82.41,65.41],
        [43.65,65.41,55.00],[36.71,55.00,43.65],
      ];
      let ci = 0;
      const playNext = () => { playPadChord(chords[ci++ % chords.length]); };
      playNext();
      padInterval = setInterval(playNext, 8000);
    },
    dispose() {
      try {
        if (padInterval) { clearInterval(padInterval); padInterval = null; }
        if (masterGain) masterGain.disconnect();
        if (actx) actx.close();
      } catch(_) {}
      _a = null;
    },
    mute(v) { muted = v; if (masterGain) masterGain.gain.value = v ? 0 : 0.5; },
    click()   { beep(180,"sine",0.25,0.002,0.06); },
    mine()    { beep(120,"sawtooth",0.12,0.01,0.18); },
    extract() { beep(800,"square",0.08,0.001,0.05); },
    sell()    { beep(660,"sine",0.18,0.005,0.12); beep(880,"sine",0.14,0.005,0.10); },
    buy()     { beep(440,"sine",0.16,0.005,0.12); },
    warn()    { beep(920,"square",0.15,0.003,0.08); },
    hit()     { noise(0.4,0.12); },
    boom()    { noise(0.6,0.22); },
    event()   { beep(523,"sine",0.14,0.005,0.14); beep(659,"sine",0.10,0.005,0.12); },
    warp()    { beep(80,"sine",0.20,0.02,0.30); },
    alert()   { beep(1046,"square",0.12,0.002,0.06); beep(1046,"square",0.10,0.002,0.06); },
    releaseAll() {},
  };
  return _a;
}

// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════
const ORES = [
  { id: 0, n: "Ferrite",   c: "#8a7a6a", val: 8   },
  { id: 1, n: "Calite",    c: "#b8956a", val: 20  },
  { id: 2, n: "Brinite",   c: "#cc8844", val: 42  },
  { id: 3, n: "Orvium",    c: "#ddaa55", val: 75  },
  { id: 4, n: "Novacite",  c: "#55cc88", val: 120 },
  { id: 5, n: "Crysolite", c: "#44aacc", val: 165 },
  { id: 6, n: "Voidstone", c: "#cc55ff", val: 215 },
  { id: 7, n: "Driftcore", c: "#ff4466", val: 195 },
];

// ═══════════════════════════════════════════
// SHIPS
// ═══════════════════════════════════════════
const SHIPS = [
  {
    id: "drifter",
    name: "Drifter",
    icon: "◈",
    desc: "Balanced starter vessel. Jack of all trades.",
    cost: 0,
    color: "#88ccee",
    stats: { speed: 1.2, maxFuel: 100, fuelUse: 0.008, maxHull: 100, maxCargo: 30, miningRate: 1, miningRange: 50 },
    passive: "Workhorse — 35% faster heat dissipation. Built for the long haul.",
    passiveFn: () => 1,
    heatDissipation: 1.35,
  },
  {
    id: "hauler",
    name: "Hauler",
    icon: "▣",
    desc: "Massive cargo hold but slow. Sell runs are worth more.",
    cost: 2000,
    color: "#ddaa44",
    stats: { speed: 0.7, maxFuel: 120, fuelUse: 0.006, maxHull: 130, maxCargo: 60, miningRate: 0.9, miningRange: 45 },
    passive: "+20% ore sell value.",
    passiveFn: (g, ctx) => { if (ctx === "sell") return 1.2; return 1; },
  },
  {
    id: "specter",
    name: "Specter",
    icon: "◇",
    desc: "Fast and fuel-efficient. Tiny hold — sprint between fields.",
    cost: 5000,
    color: "#44ddaa",
    stats: { speed: 2.2, maxFuel: 80, fuelUse: 0.004, maxHull: 70, maxCargo: 20, miningRate: 1.1, miningRange: 55 },
    passive: "Speed burst on movement — leaves a turquoise trail.",
    passiveFn: () => 1,
  },
  {
    id: "ravager",
    name: "Ravager",
    icon: "◉",
    desc: "Brutal drill power. Fragile hull — events hit harder.",
    cost: 9000,
    color: "#ff6644",
    stats: { speed: 1.0, maxFuel: 90, fuelUse: 0.010, maxHull: 60, maxCargo: 35, miningRate: 2.2, miningRange: 50 },
    passive: "Each asteroid gives +1 bonus ore on depletion.",
    passiveFn: () => 1,
  },
  {
    id: "beacon",
    name: "Beacon",
    icon: "✦",
    desc: "Wide scanner. Sees ore quality. Contract rewards +40%.",
    cost: 12000,
    color: "#cc55ff",
    stats: { speed: 1.0, maxFuel: 100, fuelUse: 0.007, maxHull: 90, maxCargo: 30, miningRate: 0.9, miningRange: 90 },
    passive: "+40% contract rewards. Ore labels show value.",
    passiveFn: (g, ctx) => { if (ctx === "contract") return 1.4; return 1; },
  },
];

// ═══════════════════════════════════════════
// UPGRADE PATHS
// ═══════════════════════════════════════════
const UPGRADE_SLOTS = [
  {
    slot: "drill",
    label: "Drill",
    paths: [
      {
        id: "drill_fast", name: "Rapid Drill", desc: "Mine faster. Less time per ore unit.",
        costs: [300, 900, 2500],
        levels: [
          (g) => { g.miningRate += 0.4; },
          (g) => { g.miningRate += 0.5; },
          (g) => { g.miningRate += 0.7; },
        ],
      },
      {
        id: "drill_quality", name: "Deep Core", desc: "Each strike yields 2 ore instead of 1.",
        costs: [400, 1200, 3000],
        levels: [
          (g) => { g.drillBonus = (g.drillBonus || 0) + 1; },
          (g) => { g.drillBonus = (g.drillBonus || 0) + 1; },
          (g) => { g.drillBonus = (g.drillBonus || 0) + 2; },
        ],
      },
    ],
  },
  {
    slot: "engine",
    label: "Engine",
    paths: [
      {
        id: "engine_speed", name: "Afterburner", desc: "Move significantly faster.",
        costs: [300, 900, 2500],
        levels: [
          (g) => { g.speed += 0.5; },
          (g) => { g.speed += 0.6; },
          (g) => { g.speed += 0.8; },
        ],
      },
      {
        id: "engine_efficiency", name: "Fuel Cell", desc: "Drastically reduces fuel burn.",
        costs: [250, 750, 2000],
        levels: [
          (g) => { g.fuelUse = Math.max(0.001, (g.fuelUse || 0.008) * 0.7); },
          (g) => { g.fuelUse = Math.max(0.001, (g.fuelUse || 0.008) * 0.7); },
          (g) => { g.fuelUse = Math.max(0.001, (g.fuelUse || 0.008) * 0.6); },
        ],
      },
    ],
  },
  {
    slot: "cargo",
    label: "Cargo",
    paths: [
      {
        id: "cargo_expand", name: "Expanded Hold", desc: "Increases cargo capacity.",
        costs: [300, 900, 2500],
        levels: [
          (g) => { g.maxCargo += 15; },
          (g) => { g.maxCargo += 20; },
          (g) => { g.maxCargo += 30; },
        ],
      },
      {
        id: "cargo_compress", name: "Ore Compressor", desc: "Compress cargo — capacity unchanged but each unit worth +25%.",
        costs: [400, 1200, 3000],
        levels: [
          (g) => { g.cargoBonus = (g.cargoBonus || 1) * 1.25; },
          (g) => { g.cargoBonus = (g.cargoBonus || 1) * 1.25; },
          (g) => { g.cargoBonus = (g.cargoBonus || 1) * 1.30; },
        ],
      },
    ],
  },
  {
    slot: "hull",
    label: "Hull",
    paths: [
      {
        id: "hull_armor", name: "Plating", desc: "Increases max hull and event damage resistance.",
        costs: [300, 900, 2500],
        levels: [
          (g) => { g.maxHull += 25; g.hull = Math.min(g.hull + 25, g.maxHull); },
          (g) => { g.maxHull += 30; g.hull = Math.min(g.hull + 30, g.maxHull); },
          (g) => { g.maxHull += 40; g.hull = Math.min(g.hull + 40, g.maxHull); },
        ],
      },
      {
        id: "hull_regen", name: "Nano-repair", desc: "Hull slowly self-repairs over time.",
        costs: [400, 1200, 3000],
        levels: [
          (g) => { g.hullRegen = (g.hullRegen || 0) + 0.002; },
          (g) => { g.hullRegen = (g.hullRegen || 0) + 0.003; },
          (g) => { g.hullRegen = (g.hullRegen || 0) + 0.005; },
        ],
      },
    ],
  },
  {
    slot: "scanner",
    label: "Scanner",
    paths: [
      {
        id: "scanner_range", name: "Long Range", desc: "Mine from much further away.",
        costs: [300, 900, 2500],
        levels: [
          (g) => { g.miningRange += 20; },
          (g) => { g.miningRange += 25; },
          (g) => { g.miningRange += 35; },
        ],
      },
      {
        id: "scanner_detect", name: "Ore Sense", desc: "Minimap shows ore type. Rare ores glow brighter.",
        costs: [250, 750, 2000],
        levels: [
          (g) => { g.oreSense = (g.oreSense || 0) + 1; },
          (g) => { g.oreSense = (g.oreSense || 0) + 1; },
          (g) => { g.oreSense = (g.oreSense || 0) + 1; },
        ],
      },
    ],
  },
];

function makeAsteroid(x, y, id, tier) {
  const oid = Math.min(7, tier + Math.floor(Math.random() * 3));
  const r = 18 + Math.random() * 22;
  const nv = 6 + Math.floor(Math.random() * 5);
  const shape = Array.from({ length: nv }, (_, i) => {
    const a = (i / nv) * Math.PI * 2;
    return {
      x: Math.cos(a) * r * (0.75 + Math.random() * 0.5),
      y: Math.sin(a) * r * (0.75 + Math.random() * 0.5),
    };
  });
  const yieldAmt = 3 + Math.floor(Math.random() * 6) + tier * 2;
  const roll = Math.random();
  let special = null;
  if (tier >= 1 && roll < 0.06) special = "golden";
  if (tier >= 2 && roll < 0.04) special = "crystal";
  if (tier >= 3 && roll < 0.025) special = "radioactive";
  return {
    id, x, y, r, ore: oid, shape,
    hp: yieldAmt, maxHp: yieldAmt,
    rot: Math.random() * Math.PI * 2,
    rs: (Math.random() - 0.5) * 0.003,
    miningProg: 0,
    special,
  };
}

function makeField(gen = 0) {
  const asts = [];
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2,
      d = 100 + Math.random() * 350;
    const tier = Math.min(4, Math.floor(Math.random() * 3) + gen);
    asts.push(makeAsteroid(500 + Math.cos(a) * d, 400 + Math.sin(a) * d, i, tier));
  }
  return asts;
}

function makeContract(fieldGen = 0) {
  const oreId = Math.min(7, fieldGen + Math.floor(Math.random() * 3));
  const ore = ORES[oreId];
  const qty = 3 + Math.floor(Math.random() * 4) + Math.floor(fieldGen / 2);
  const rawReward = qty * ore.val * (1.8 + Math.random() * 0.8);
  const reward = Math.round(rawReward / 5) * 5;
  const timer = 1800 + fieldGen * 300;
  return { ore: oreId, qty, reward, timer };
}

// ═══════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════
const SAVE_KEY = "driftcore_v1";

function saveGame(g) {
  if (!g) return;
  try {
    const save = {
      cr: g.cr, shipId: g.shipId, upgrades: g.upgrades,
      drillBonus: g.drillBonus, cargoBonus: g.cargoBonus,
      hullRegen: g.hullRegen, oreSense: g.oreSense,
      speed: g.speed, fuelUse: g.fuelUse,
      maxFuel: g.maxFuel, maxHull: g.maxHull,
      maxCargo: g.maxCargo, miningRate: g.miningRate,
      miningRange: g.miningRange, fieldGen: g.fieldGen,
      cargo: g.cargo, contract: g.contract,
      market: g.market,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch(_) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(_) { return null; }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch(_) {}
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
export default function DriftCore() {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const [ui, setUi] = useState({
    cr: 200, fuel: 100, hull: 100, cargo: 0, maxCargo: 30,
    ore: {}, docked: false, event: null, eventResult: null,
    contract: null, surgeMult: 1, surgeTimer: 0, miningTarget: null,
  });
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stationTab, setStationTab] = useState("cargo");

  const initGame = useCallback((savedData) => {
    const shipId = savedData?.shipId || "drifter";
    const ship = SHIPS.find(s => s.id === shipId) || SHIPS[0];
    const base = {
      sx: 500, sy: 400, tx: 500, ty: 400, moving: false, sa: 0,
      speed: ship.stats.speed,
      fuelUse: ship.stats.fuelUse,
      fuel: ship.stats.maxFuel, maxFuel: ship.stats.maxFuel,
      hull: ship.stats.maxHull, maxHull: ship.stats.maxHull,
      miningRate: ship.stats.miningRate,
      miningRange: ship.stats.miningRange,
      shipId: ship.id,
      upgrades: {},
      drillBonus: 0, cargoBonus: 1, hullRegen: 0, oreSense: 0,
      asteroids: makeField(), particles: [],
      miningTarget: null, miningProg: 0,
      cargo: {}, maxCargo: ship.stats.maxCargo,
      cr: 200,
      cx: 0, cy: 0,
      stars: Array.from({ length: 60 }, () => ({
        x: Math.random() * 1200, y: Math.random() * 1000,
        s: 0.5 + Math.random() * 1.5, b: 0.2 + Math.random() * 0.6,
      })),
      station: { x: 500, y: 400, r: 24 }, docked: false,
      surgeMult: 1, surgeTimer: 0,
      contract: null,
      market: Object.fromEntries(ORES.map(o => [o.id, 1.0])),
      marketHistory: Object.fromEntries(ORES.map(o => [o.id, [1.0]])),
      time: 0,
      selected: true,
      nearStation: false,
      fieldGen: 0,
      fieldClearTimer: 0,
      hullBreached: false, hullBreachTimer: 0,
      stranded: false,
      miningHeat: 0, heatOverload: false, heatOverloadTimer: 0,
      contractFailed: false, contractFailTimer: 0,
      screenShake: 0,
      richVein: false,
      richVeinTimer: 0,
      sectorFlash: 0,
      nebula: Array.from({ length: 6 }, () => ({
        x: Math.random() * 1200,
        y: Math.random() * 900,
        rx: 120 + Math.random() * 180,
        ry: 80 + Math.random() * 120,
        hue: [200, 260, 180, 300, 220, 240][Math.floor(Math.random() * 6)],
        alpha: 0.04 + Math.random() * 0.05,
        drift: (Math.random() - 0.5) * 0.008,
      })),
    };
    if (savedData) {
      Object.assign(base, {
        cr: savedData.cr ?? base.cr,
        shipId: savedData.shipId ?? base.shipId,
        upgrades: savedData.upgrades ?? base.upgrades,
        drillBonus: savedData.drillBonus ?? base.drillBonus,
        cargoBonus: savedData.cargoBonus ?? base.cargoBonus,
        hullRegen: savedData.hullRegen ?? base.hullRegen,
        oreSense: savedData.oreSense ?? base.oreSense,
        speed: savedData.speed ?? base.speed,
        fuelUse: savedData.fuelUse ?? base.fuelUse,
        maxFuel: savedData.maxFuel ?? base.maxFuel,
        maxHull: savedData.maxHull ?? base.maxHull,
        maxCargo: savedData.maxCargo ?? base.maxCargo,
        miningRate: savedData.miningRate ?? base.miningRate,
        miningRange: savedData.miningRange ?? base.miningRange,
        fieldGen: savedData.fieldGen ?? base.fieldGen,
        cargo: savedData.cargo ?? base.cargo,
        contract: savedData.contract ?? base.contract,
        market: savedData.market ?? base.market,
        asteroids: makeField(savedData.fieldGen ?? 0),
        fuel: savedData.maxFuel ?? base.maxFuel,
        hull: savedData.maxHull ?? base.maxHull,
      });
    }
    return base;
  }, []);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const saved = loadGame();
    let g = gRef.current || initGame(saved);
    gRef.current = g;
    let animId, cW, cH;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      cW = rect.width;
      cH = rect.height;
      canvas.width = cW * dpr;
      canvas.height = cH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const onUnload = () => saveGame(gRef.current);
    window.addEventListener("beforeunload", onUnload);

    let uiTick = 0;

    function addCR(amount) {
      const n = Math.floor(amount);
      if (isFinite(n)) g.cr = Math.max(0, g.cr + n);
    }

    function tick() {
      g.time++;
      if (!isFinite(g.cr) || isNaN(g.cr)) g.cr = 0;
      if (g.docked) { render(); animId = requestAnimationFrame(tick); return; }

      // SHIP MOVEMENT
      if (g.moving) {
        const dx = g.tx - g.sx, dy = g.ty - g.sy, dist = Math.hypot(dx, dy);
        if (dist > 3 && g.fuel > 0) {
          const mx = (dx / dist) * g.speed, my = (dy / dist) * g.speed;
          g.sx += mx; g.sy += my;
          g.sa = Math.atan2(dy, dx);
          g.fuel = Math.max(0, g.fuel - (g.fuelUse || 0.008));
          const isSpecter = g.shipId === "specter";
          const trailFreq = isSpecter ? 1 : 3;
          if (g.time % trailFreq === 0) {
            g.particles.push({
              x: g.sx - Math.cos(g.sa) * 10 + (Math.random() - 0.5) * 4,
              y: g.sy - Math.sin(g.sa) * 10 + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              life: isSpecter ? 28 : 15,
              c: isSpecter ? "#44ffcc" : "#44aaee",
              r: isSpecter ? 2.5 + Math.random() : 1.5 + Math.random(),
            });
          }
        } else {
          g.moving = false;
        }
      }

      // AUTO-MINING
      if (g.miningTarget !== null) {
        const ast = g.asteroids.find((a) => a.id === g.miningTarget);
        if (!ast || ast.hp <= 0) { g.miningTarget = null; g.miningProg = 0; }
        else {
          const dist = Math.hypot(g.sx - ast.x, g.sy - ast.y);
          if (dist <= g.miningRange + ast.r) {
            const targetAngle = Math.atan2(ast.y - g.sy, ast.x - g.sx);
            const angleDiff = ((targetAngle - g.sa + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            g.sa += angleDiff * 0.08;

            const ore = ORES[ast.ore];
            const heatRate = 0.10 + (ore.val / 215) * 0.45;
            if (!g.heatOverload) {
              g.miningHeat = Math.min(100, (g.miningHeat || 0) + heatRate);
              if (g.miningHeat >= 100) {
                g.heatOverload = true;
                A().warn();
              }
            } else {
              const diss = (SHIPS.find(s=>s.id===g.shipId)||SHIPS[0]).heatDissipation || 1;
              g.miningHeat = Math.max(0, g.miningHeat - 1.0 * diss);
              if (g.miningHeat <= 0) g.heatOverload = false;
            }
            const rate = g.heatOverload ? 0 : g.miningRate * g.surgeMult;
            g.miningProg += rate;

            if (ast.special === "radioactive") g.hull = Math.max(1, g.hull - 0.08);
            if (ast.special === "radioactive" && g.time % 120 === 0) A().hit();

            if (!g.heatOverload && g.time % 4 === 0) {
              g.particles.push({
                x: ast.x + (Math.random() - 0.5) * ast.r * 0.6,
                y: ast.y + (Math.random() - 0.5) * ast.r * 0.6,
                vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                life: 12, c: ore.c, r: 2 + Math.random() * 2,
              });
            }

            if (g.miningProg >= 60) {
              g.miningProg = 0;
              ast.hp--;
              const bonus = g.drillBonus || 0;
              const totalC = Object.values(g.cargo).reduce((a, b) => a + b, 0);
              let oreToAdd = 1 + bonus;

              const richStrike = Math.random() < 0.12;
              if (richStrike) {
                oreToAdd += 1;
                g.richVein = true;
                g.richVeinTimer = 60;
                A().sell();
              }

              if (totalC < g.maxCargo) {
                g.cargo[ast.ore] = (g.cargo[ast.ore] || 0) + Math.min(oreToAdd, g.maxCargo - totalC);
              }
              A().extract();

              for (let i = 0; i < 6; i++)
                g.particles.push({
                  x: ast.x + (Math.random() - 0.5) * ast.r,
                  y: ast.y + (Math.random() - 0.5) * ast.r,
                  vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                  life: 18, c: ore.c, r: 2 + Math.random() * 3,
                });

              if (ast.hp <= 0) {
                if (g.shipId === "ravager") {
                  const tc2 = Object.values(g.cargo).reduce((a, b) => a + b, 0);
                  if (tc2 < g.maxCargo) g.cargo[ast.ore] = (g.cargo[ast.ore] || 0) + 1;
                }
                g.miningTarget = null; g.miningProg = 0;
                g.screenShake = 10 + Math.floor(ore.val / 50);
                A().boom();
                const oreC = ore.c;
                for (let i = 0; i < 30; i++)
                  g.particles.push({
                    x: ast.x + (Math.random() - 0.5) * ast.r * 2.5,
                    y: ast.y + (Math.random() - 0.5) * ast.r * 2.5,
                    vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7,
                    life: 35 + Math.random() * 20, c: oreC, r: 1.5 + Math.random() * 4,
                  });
                for (let i = 0; i < 12; i++)
                  g.particles.push({
                    x: ast.x, y: ast.y,
                    vx: Math.cos(i/12*Math.PI*2) * (4 + Math.random()*3),
                    vy: Math.sin(i/12*Math.PI*2) * (4 + Math.random()*3),
                    life: 20, c: "#ffffff", r: 2 + Math.random() * 2,
                  });
              }
            }
          } else {
            if (!g.moving) { g.tx = ast.x; g.ty = ast.y; g.moving = true; }
          }
        }
      }

      if (g.screenShake > 0) g.screenShake = Math.max(0, g.screenShake - 0.8);
      if (g.richVeinTimer > 0) g.richVeinTimer--;
      else g.richVein = false;

      if (g.miningTarget === null && g.miningHeat > 0) {
        const diss = (SHIPS.find(s=>s.id===g.shipId)||SHIPS[0]).heatDissipation || 1;
        g.miningHeat = Math.max(0, g.miningHeat - 0.5 * diss);
        if (g.miningHeat <= 0) g.heatOverload = false;
      }

      if (g.hullRegen && g.hull < g.maxHull) {
        g.hull = Math.min(g.maxHull, g.hull + g.hullRegen);
      }

      if (g.hull <= 0 && !g.hullBreached) {
        g.hullBreached = true;
        g.hullBreachTimer = 180;
        g.cr = Math.max(0, Math.floor(g.cr * 0.7));
        g.hull = 20;
        g.miningTarget = null; g.miningProg = 0; g.moving = false;
        g.sx = g.station.x + 40; g.sy = g.station.y;
        g.cx = g.sx - (typeof cW !== 'undefined' ? cW/2 : 500);
        g.cy = g.sy - (typeof cH !== 'undefined' ? cH/2 : 400);
        g.docked = true;
        A().boom();
      }
      if (g.hullBreachTimer > 0) g.hullBreachTimer--;
      else g.hullBreached = false;

      if (g.fuel <= 0 && !g.moving && g.miningTarget === null) {
        g.stranded = true;
      } else if (g.fuel > 0) {
        g.stranded = false;
      }

      if (g.surgeTimer > 0) { g.surgeTimer--; if (g.surgeTimer <= 0) g.surgeMult = 1; }

      if (g.contract) {
        g.contract.timer--;
        if (g.contract.timer <= 0) {
          g.contract = null;
          g.cr = Math.max(0, g.cr - 50);
          g.contractFailed = true;
          g.contractFailTimer = 120;
        }
      }
      if (g.contractFailTimer > 0) g.contractFailTimer--;
      else g.contractFailed = false;

      g.nearStation = Math.hypot(g.sx - g.station.x, g.sy - g.station.y) < 50;

      g.particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life--; p.vx *= 0.95; p.vy *= 0.95; });
      g.particles = g.particles.filter((p) => p.life > 0);
      if (g.particles.length > 60) g.particles = g.particles.slice(-60);

      g.nebula.forEach(n => { n.x += n.drift; if (n.x > 1300) n.x = -200; if (n.x < -200) n.x = 1300; });
      if (g.sectorFlash > 0) g.sectorFlash--;

      g.asteroids.forEach((a) => {
        a.rot += a.rs;
        if (a.hp <= 0) {
          a.respawnTimer = (a.respawnTimer || 0) + 1;
          if (a.respawnTimer >= 1800) {
            const tier = Math.floor(Math.random() * (1 + g.fieldGen));
            const fresh = makeAsteroid(a.x, a.y, a.id, Math.min(tier, 4));
            Object.assign(a, fresh);
          }
        }
      });

      if (g.asteroids.every((a) => a.hp <= 0)) {
        g.fieldClearTimer = (g.fieldClearTimer || 0) + 1;
        if (g.fieldClearTimer >= 300) {
          g.fieldGen = (g.fieldGen || 0) + 1;
          g.sectorFlash = 40;
          g.fieldClearTimer = 0;
          g.asteroids = makeField(g.fieldGen);
          g.miningTarget = null;
          g.miningProg = 0;
        }
      } else {
        g.fieldClearTimer = 0;
      }

      // RANDOM EVENTS — roll every ~900 ticks with ~18% chance
      if (!g.docked && g.surgeMult <= 1) {
        if (g.time % 900 === 0 && Math.random() < 0.18) {
          {
            const events = ["surge", "storm", "salvage", "pirates", "wormhole"];
            const id = events[Math.floor(Math.random() * events.length)];
            let name, msg;
            if (id === "surge") {
              name = "Ore Surge";
              g.surgeMult = 2;
              g.surgeTimer = 600;
              msg = "Mining yield doubled for 20s!";
              A().event();
            } else if (id === "storm") {
              const dmg = 8 + Math.random() * 12;
              g.hull = Math.max(1, g.hull - dmg);
              name = "Cosmic Storm";
              msg = `Hull took ${Math.floor(dmg)} damage!`;
              A().hit();
            } else if (id === "salvage") {
              const cr = 40 + Math.floor(Math.random() * 60);
              addCR(cr);
              name = "Derelict Pod";
              msg = `Recovered ${cr} CR from wreckage!`;
              A().event();
            } else if (id === "pirates") {
              const stolen = Math.floor(g.cr * 0.12);
              g.cr = Math.max(0, g.cr - stolen);
              g.hull = Math.max(1, g.hull - 10);
              name = "Pirate Ambush";
              msg = `Lost ${stolen} CR and 10 hull!`;
              A().alert();
            } else if (id === "wormhole") {
              const alive = g.asteroids.filter(a => a.hp > 0);
              if (alive.length > 0) {
                const target = alive[Math.floor(Math.random() * alive.length)];
                g.sx = target.x + (Math.random() - 0.5) * 60;
                g.sy = target.y + (Math.random() - 0.5) * 60;
                g.cx = g.sx - cW / 2;
                g.cy = g.sy - cH / 2;
                g.moving = false;
              }
              name = "Wormhole";
              msg = "Teleported to asteroid cluster!";
              A().warp();
            }
            g.activeEvent = { id, name, msg, timer: 180 };
          }
        }
      }
      if (g.activeEvent && g.activeEvent.timer > 0) {
        g.activeEvent.timer--;
        if (g.activeEvent.timer <= 0) g.activeEvent = null;
      }

      g.cx += (g.sx - cW / 2 - g.cx) * 0.06;
      g.cy += (g.sy - cH / 2 - g.cy) * 0.06;

      uiTick++;
      if (uiTick % 8 === 0) {
        const tc = Object.values(g.cargo).reduce((a, b) => a + b, 0);
        setUi({
          cr: g.cr, fuel: Math.floor(g.fuel), hull: Math.floor(g.hull),
          cargo: tc, maxCargo: g.maxCargo, ore: { ...g.cargo },
          docked: g.docked, event: null, eventResult: null,
          contract: g.contract, surgeMult: g.surgeMult, surgeTimer: g.surgeTimer,
          miningTarget: g.miningTarget, nearStation: g.nearStation, richVein: g.richVein,
          stranded: g.stranded, hullBreached: g.hullBreached, hullBreachTimer: g.hullBreachTimer,
          contractFailed: g.contractFailed, miningHeat: g.miningHeat, heatOverload: g.heatOverload,
          fieldGen: g.fieldGen, activeEvent: g.activeEvent,
        });
      }

      render();
      animId = requestAnimationFrame(tick);
    }

    function render() {
      ctx.clearRect(0, 0, cW, cH);
      ctx.fillStyle = "#060a12";
      ctx.fillRect(0, 0, cW, cH);
      if (g.docked) return;

      ctx.fillStyle = "#fff";
      g.stars.forEach((st) => {
        const sx = ((st.x - g.cx * 0.2) % cW + cW) % cW;
        const sy = ((st.y - g.cy * 0.2) % cH + cH) % cH;
        ctx.globalAlpha = st.b;
        ctx.fillRect(sx, sy, st.s, st.s);
      });
      ctx.globalAlpha = 1;

      g.nebula.forEach(n => {
        const nx = ((n.x - g.cx * 0.05) % cW + cW * 2) % cW - cW * 0.5;
        const ny = ((n.y - g.cy * 0.05) % cH + cH * 2) % cH - cH * 0.5;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.rx);
        grad.addColorStop(0, `hsla(${n.hue},60%,40%,${n.alpha})`);
        grad.addColorStop(1, 'transparent');
        ctx.save();
        ctx.scale(1, n.ry / n.rx);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny * (n.rx / n.ry), n.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const shakeX = g.screenShake > 0 ? (Math.random() - 0.5) * g.screenShake : 0;
      const shakeY = g.screenShake > 0 ? (Math.random() - 0.5) * g.screenShake : 0;
      ctx.save();
      ctx.translate(-g.cx + shakeX, -g.cy + shakeY);

      if (g.miningTarget !== null) {
        const ast = g.asteroids.find((a) => a.id === g.miningTarget);
        if (ast && ast.hp > 0) {
          ctx.beginPath();
          ctx.arc(g.sx, g.sy, g.miningRange + ast.r, 0, Math.PI * 2);
          ctx.strokeStyle = "#44aaee11";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.beginPath();
      ctx.arc(g.station.x, g.station.y, g.station.r, 0, Math.PI * 2);
      ctx.fillStyle = "#0c1a28"; ctx.fill();
      ctx.strokeStyle = "#44aaee66"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath();
      ctx.arc(g.station.x, g.station.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#1a2a3a"; ctx.fill();
      ctx.strokeStyle = "#44aaee"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#44aaee";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("DOCK", g.station.x, g.station.y + g.station.r + 12);
      ctx.beginPath();
      ctx.arc(g.station.x, g.station.y, 50, 0, Math.PI * 2);
      ctx.strokeStyle = "#44aaee15"; ctx.lineWidth = 1; ctx.stroke();

      // Rotating docking ring
      ctx.save();
      ctx.translate(g.station.x, g.station.y);
      ctx.rotate(g.time * 0.008);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 28, Math.sin(a) * 28, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = g.nearStation ? "#44aaeebb" : "#44aaee44";
        ctx.fill();
      }
      ctx.restore();

      // Pulse ring
      const pulse = 0.3 + 0.2 * Math.sin(g.time * 0.05);
      ctx.beginPath();
      ctx.arc(g.station.x, g.station.y, g.station.r + 6 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(68,170,238,${pulse * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      g.asteroids.forEach((ast) => {
        if (ast.hp <= 0) {
          ctx.globalAlpha = 0.15;
          ctx.beginPath();
          ast.shape.forEach((v, i) => {
            if (i === 0) ctx.moveTo(ast.x + v.x * 0.5, ast.y + v.y * 0.5);
            else ctx.lineTo(ast.x + v.x * 0.5, ast.y + v.y * 0.5);
          });
          ctx.closePath();
          ctx.fillStyle = "#1a1e28"; ctx.fill();
          ctx.globalAlpha = 1;
          return;
        }
        const ore = ORES[ast.ore];
        const isMT = g.miningTarget === ast.id;
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rot);
        ctx.beginPath();
        ast.shape.forEach((v, i) => {
          if (i === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        });
        ctx.closePath();
        ctx.fillStyle = isMT ? "#1a2230" : "#141820"; ctx.fill();
        ctx.strokeStyle = isMT ? ore.c : `${ore.c}44`;
        ctx.lineWidth = isMT ? 2 : 1; ctx.stroke();
        const oreValNorm = ore.val / 550;
        const glowBase = 0.15 + oreValNorm * 0.5;
        const pulse = glowBase + 0.15 * Math.sin(g.time * 0.04 + ast.id);
        const glowR = ast.r * (0.3 + oreValNorm * 0.35);
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fillStyle = `${ore.c}${Math.floor(pulse * 50).toString(16).padStart(2, "0")}`;
        ctx.fill();
        if (ore.val >= 150) {
          ctx.beginPath();
          ctx.arc(0, 0, ast.r * 0.8, 0, Math.PI * 2);
          ctx.strokeStyle = `${ore.c}${Math.floor(pulse * 20).toString(16).padStart(2, "0")}`;
          ctx.lineWidth = 2 + oreValNorm * 3;
          ctx.stroke();
        }
        ctx.restore();
        const pct = ast.hp / ast.maxHp;
        ctx.fillStyle = "#000000aa";
        ctx.fillRect(ast.x - ast.r * 0.6, ast.y + ast.r + 4, ast.r * 1.2, 3);
        ctx.fillStyle = ore.c;
        ctx.fillRect(ast.x - ast.r * 0.6, ast.y + ast.r + 4, ast.r * 1.2 * pct, 3);
        ctx.fillStyle = isMT ? ore.c : `${ore.c}88`;
        ctx.font = "8px monospace"; ctx.textAlign = "center";
        const oreLabel = (g.oreSense > 0) ? `${ore.n} ${ore.val}CR` : ore.n;
        ctx.fillText(oreLabel, ast.x, ast.y - ast.r - 4);
        if (isMT) {
          const prog = g.miningProg / 60;
          ctx.beginPath();
          ctx.arc(ast.x, ast.y, ast.r + 7, 0, Math.PI * 2);
          ctx.strokeStyle = "#ffffff11"; ctx.lineWidth = 4; ctx.stroke();
          ctx.beginPath();
          ctx.arc(ast.x, ast.y, ast.r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
          ctx.strokeStyle = g.heatOverload ? "#ff4444" : ore.c;
          ctx.lineWidth = 4; ctx.stroke();
        }
      });

      if (g.miningTarget !== null) {
        const ast = g.asteroids.find((a) => a.id === g.miningTarget);
        if (ast && ast.hp > 0) {
          const d = Math.hypot(g.sx - ast.x, g.sy - ast.y);
          if (d <= g.miningRange + ast.r) {
            ctx.beginPath();
            ctx.moveTo(g.sx + Math.cos(g.sa) * 10, g.sy + Math.sin(g.sa) * 10);
            ctx.lineTo(ast.x, ast.y);
            const ore = ORES[ast.ore];
            ctx.strokeStyle = `${ore.c}${Math.floor(40 + Math.random() * 30).toString(16)}`;
            ctx.lineWidth = 1.5 + Math.random() * 0.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ast.x, ast.y, 4 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fillStyle = `${ore.c}44`; ctx.fill();
          }
        }
      }

      g.particles.forEach((p) => {
        ctx.globalAlpha = Math.min(1, p.life / 8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.r * (p.life / 20)), 0, Math.PI * 2);
        ctx.fillStyle = p.c; ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (g.moving) {
        ctx.beginPath();
        ctx.arc(g.tx, g.ty, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#44ddaa44"; ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(g.sx, g.sy); ctx.lineTo(g.tx, g.ty);
        ctx.strokeStyle = "#44ddaa15"; ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([]);
      }

      ctx.save();
      ctx.translate(g.sx, g.sy);
      ctx.rotate(g.sa);
      const shipCol = (SHIPS.find(s=>s.id===g.shipId)||SHIPS[0]).color;
      ctx.beginPath();
      if (g.shipId === 'hauler') {
        ctx.moveTo(10,0); ctx.lineTo(-6,-10); ctx.lineTo(-10,-10);
        ctx.lineTo(-10,10); ctx.lineTo(-6,10); ctx.closePath();
      } else if (g.shipId === 'specter') {
        ctx.moveTo(18,0); ctx.lineTo(-4,-3); ctx.lineTo(-10,0); ctx.lineTo(-4,3); ctx.closePath();
      } else if (g.shipId === 'ravager') {
        ctx.moveTo(14,0); ctx.lineTo(0,-10); ctx.lineTo(-10,-6);
        ctx.lineTo(-6,0); ctx.lineTo(-10,6); ctx.lineTo(0,10); ctx.closePath();
      } else if (g.shipId === 'beacon') {
        ctx.moveTo(12,0); ctx.lineTo(0,-8); ctx.lineTo(-8,0); ctx.lineTo(0,8); ctx.closePath();
      } else {
        ctx.moveTo(12,0); ctx.lineTo(-8,-7); ctx.lineTo(-4,0); ctx.lineTo(-8,7); ctx.closePath();
      }
      ctx.fillStyle = shipCol + "cc"; ctx.fill();
      ctx.strokeStyle = shipCol; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      if (g.selected) {
        ctx.beginPath();
        ctx.arc(g.sx, g.sy, 16, 0, Math.PI * 2);
        ctx.strokeStyle = "#44ddaa44"; ctx.lineWidth = 1; ctx.stroke();
      }

      if (g.surgeTimer > 0) {
        ctx.fillStyle = "#ddaa44";
        ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
        ctx.fillText(
          `\u{1F4A0} ORE SURGE ${Math.ceil(g.surgeTimer / 30)}s \u2014 ${g.surgeMult}x YIELD`,
          g.sx, g.sy - 28
        );
      }

      if (g.richVein && g.richVeinTimer > 0) {
        const alpha = Math.min(1, g.richVeinTimer / 20);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#ffdd44";
        ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
        ctx.fillText("\u2726 RICH VEIN \u2014 BONUS ORE!", g.sx, g.sy - 58);
        ctx.globalAlpha = 1;
      }

      if (g.activeEvent && g.activeEvent.timer > 0) {
        const evColors = { surge: "#ddaa44", storm: "#ff6644", salvage: "#44ddaa", pirates: "#ff4444", wormhole: "#cc55ff" };
        const evColor = evColors[g.activeEvent.id] || "#88ccee";
        const fadeAlpha = Math.min(1, g.activeEvent.timer / 30);
        const bW = 260, bH = 42;
        const bX = g.cx + cW / 2 - bW / 2, bY = g.cy + cH * 0.18;
        ctx.globalAlpha = fadeAlpha * 0.88;
        ctx.fillStyle = "#060a12";
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 4);
        ctx.fill();
        ctx.strokeStyle = evColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 4);
        ctx.stroke();
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = evColor;
        ctx.font = "bold 11px 'Share Tech Mono',monospace"; ctx.textAlign = "center";
        ctx.fillText(g.activeEvent.name.toUpperCase(), g.cx + cW / 2, bY + 16);
        ctx.fillStyle = "#b0c0d0";
        ctx.font = "9px monospace";
        ctx.fillText(g.activeEvent.msg, g.cx + cW / 2, bY + 32);
        ctx.globalAlpha = 1;
      }

      const _tc = Object.values(g.cargo).reduce((a, b) => a + b, 0);
      if (_tc >= g.maxCargo) {
        const flash = Math.sin(g.time * 0.15) > 0;
        if (flash) {
          ctx.fillStyle = "#ff4444";
          ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
          ctx.fillText("CARGO FULL \u2014 DOCK TO SELL", g.sx, g.sy - 44);
        }
      }

      if (g.hullBreached && g.hullBreachTimer > 60) {
        ctx.fillStyle = `rgba(255,40,40,${(g.hullBreachTimer-60)/120 * 0.55})`;
        ctx.fillRect(g.cx, g.cy, cW, cH);
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 18px 'Share Tech Mono',monospace"; ctx.textAlign = "center";
        ctx.fillText("\u26A0 HULL BREACH \u2014 EMERGENCY DOCK", g.cx + cW/2, g.cy + cH/2);
        ctx.font = "10px monospace"; ctx.fillStyle = "#ff8888";
        ctx.fillText("-30% CR PENALTY", g.cx + cW/2, g.cy + cH/2 + 20);
      }

      if (g.stranded) {
        const flash2 = Math.sin(g.time * 0.2) > 0;
        if (flash2) {
          ctx.fillStyle = "#ffaa44";
          ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
          ctx.fillText("\u26FD STRANDED \u2014 OUT OF FUEL", g.sx, g.sy - 60);
        }
      }

      if (g.contractFailed) {
        ctx.fillStyle = "#ff4444cc";
        ctx.fillRect(g.cx + cW/2 - 100, g.cy + cH/2 - 18, 200, 28);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
        ctx.fillText("CONTRACT FAILED  -50 CR", g.cx + cW/2, g.cy + cH/2 - 1);
      }

      ctx.restore();

      // Sector transition flash (screen space)
      if (g.sectorFlash > 0) {
        ctx.fillStyle = `rgba(100,160,255,${g.sectorFlash / 40 * 0.35})`;
        ctx.fillRect(0, 0, cW, cH);
      }

      // HUD
      ctx.fillStyle = "#ee8844";
      ctx.font = "bold 11px 'Share Tech Mono',monospace"; ctx.textAlign = "left";
      ctx.fillText("\u25C6 DRIFT CORE", 8, 16);
      const _ship = SHIPS.find(s => s.id === g.shipId) || SHIPS[0];
      ctx.fillStyle = _ship.color; ctx.font = "9px monospace";
      ctx.fillText(`${_ship.icon} ${_ship.name.toUpperCase()}`, 8, 27);
      ctx.fillStyle = "#ddcc66"; ctx.font = "10px monospace";
      ctx.fillText(`\u25C8 ${g.cr} CR`, 8, 38);
      drawBar(ctx, 8, 44, 90, 7, g.hull / g.maxHull, g.hull < 30 ? "#ee4444" : "#44aa66", "Hull");
      drawBar(ctx, 8, 58, 90, 7, g.fuel / g.maxFuel, "#44aaee", "Fuel");
      const tc = Object.values(g.cargo).reduce((a, b) => a + b, 0);
      const cargoFull = tc >= g.maxCargo;
      const cargoColor = cargoFull ? (Math.sin(g.time * 0.15) > 0 ? "#ff4444" : "#aa2222") : "#ddaa44";
      drawBar(ctx, 8, 72, 90, 7, tc / g.maxCargo, cargoColor, `Cargo ${tc}/${g.maxCargo}`);

      if (g.miningTarget !== null || (g.miningHeat || 0) > 0) {
        const heatCol = g.heatOverload ? "#ff4444" : (g.miningHeat > 70 ? "#ff8844" : "#44ddaa");
        drawBar(ctx, 8, 86, 90, 7, (g.miningHeat||0)/100, heatCol, g.heatOverload ? "OVERHEAT" : `Heat ${Math.floor(g.miningHeat||0)}%`);
      }

      const sectorNames = ["FERRITE BELT","CALITE RING","BRINITE FIELDS","ORVIUM DEEP","NOVACITE EXPANSE","CRYSOLITE REACH","VOIDSTONE ABYSS","DRIFTCORE SINGULARITY"];
      const sectorIdx = Math.min(g.fieldGen || 0, sectorNames.length - 1);
      ctx.fillStyle = "#2a3a4a"; ctx.font = "7px monospace"; ctx.textAlign = "left";
      ctx.fillText(`SECTOR ${(g.fieldGen||0)+1} \u2014 ${sectorNames[sectorIdx]}`, 8, 108);

      if (g.contract) {
        const ore = ORES[g.contract.ore];
        const have = g.cargo[g.contract.ore] || 0;
        ctx.fillStyle = "#44ddaa"; ctx.font = "9px monospace"; ctx.textAlign = "left";
        ctx.fillText(`\u{1F4CB} ${g.contract.qty}\u00D7 ${ore.n} \u2192 ${g.contract.reward} CR`, 8, 120);
        ctx.fillText(`   Have: ${have}/${g.contract.qty} \u2014 ${Math.ceil(g.contract.timer / 30)}s`, 8, 130);
      }

      // MINIMAP
      const mmS = 80, mmX = cW - mmS - 8, mmY = 8, mmSc = 0.09;
      ctx.fillStyle = "#060a12cc"; ctx.fillRect(mmX, mmY, mmS, mmS);
      ctx.strokeStyle = "#1a2a35"; ctx.lineWidth = 1; ctx.strokeRect(mmX, mmY, mmS, mmS);
      ctx.fillStyle = "#2a3a4a"; ctx.font = "6px monospace"; ctx.textAlign = "left";
      ctx.fillText("MAP", mmX + 2, mmY + 8);
      const mc = mmX + mmS / 2, mmy = mmY + mmS / 2;
      ctx.save();
      ctx.beginPath(); ctx.rect(mmX, mmY, mmS, mmS); ctx.clip();
      ctx.beginPath();
      ctx.arc(mc + (g.station.x - g.sx) * mmSc, mmy + (g.station.y - g.sy) * mmSc, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#44aaee"; ctx.fill();
      g.asteroids.forEach((a) => {
        if (a.hp <= 0) return;
        ctx.beginPath();
        ctx.arc(mc + (a.x - g.sx) * mmSc, mmy + (a.y - g.sy) * mmSc, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = ORES[a.ore].c + "88"; ctx.fill();
      });
      ctx.beginPath(); ctx.arc(mc, mmy, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ddeeff"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(mc, mmy);
      ctx.lineTo(mc + Math.cos(g.sa) * 6, mmy + Math.sin(g.sa) * 6);
      ctx.strokeStyle = "#88ccee66"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();

      const stD = Math.hypot(g.station.x - g.sx, g.station.y - g.sy);
      if (stD > 70) {
        const stA = Math.atan2(g.station.y - g.sy, g.station.x - g.sx);
        const ad = Math.min(cW, cH) * 0.38;
        const ax = cW / 2 + Math.cos(stA) * ad, ay = cH / 2 + Math.sin(stA) * ad;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(stA);
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -4); ctx.lineTo(-2, 0); ctx.lineTo(-4, 4);
        ctx.closePath(); ctx.fillStyle = "#44aaee66"; ctx.fill(); ctx.restore();
        ctx.fillStyle = "#44aaee44"; ctx.font = "7px monospace"; ctx.textAlign = "center";
        ctx.fillText(`${Math.floor(stD)}m`, ax, ay + 12);
      }

      ctx.fillStyle = "#1a2a35"; ctx.font = "8px monospace"; ctx.textAlign = "center";
      ctx.fillText(
        "Click/tap to move \u00B7 Click asteroid to mine \u00B7 Near station: click to dock",
        cW / 2, cH - 6
      );
    }

    function drawBar(ctx, x, y, w, h, pct, c, label) {
      ctx.fillStyle = "#0a101888"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = c; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
      ctx.strokeStyle = "#1a2a3566"; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#6a7a8a"; ctx.font = "7px monospace"; ctx.textAlign = "left";
      ctx.fillText(label, x + 2, y + h - 1);
    }

    // INPUT
    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left + g.cx, my = e.clientY - rect.top + g.cy;
      if (Math.hypot(mx - g.station.x, my - g.station.y) < 50 && g.nearStation) {
        g.docked = true; g.moving = false; g.miningTarget = null;
        if (!g.contract) g.contract = makeContract(g.fieldGen || 0);
        A().click();
        saveGame(g);
        setUi((p) => ({ ...p, docked: true }));

        return;
      }
      for (const ast of g.asteroids) {
        if (ast.hp <= 0) continue;
        if (Math.hypot(mx - ast.x, my - ast.y) < ast.r + 8) {
          if (g.miningTarget === ast.id && g.heatOverload) {
            const dissV = (SHIPS.find(s=>s.id===g.shipId)||SHIPS[0]).heatDissipation || 1;
            g.miningHeat = Math.max(0, g.miningHeat - 30 * dissV);
            if (g.miningHeat <= 0) g.heatOverload = false;
            A().extract();
            return;
          }
          if (g.miningTarget !== ast.id) {
            g.miningTarget = ast.id; g.miningProg = 0;
          }
          const d = Math.hypot(g.sx - ast.x, g.sy - ast.y);
          if (d > g.miningRange + ast.r) { g.tx = ast.x; g.ty = ast.y; g.moving = true; }
          A().click(); return;
        }
      }
      if (g.stranded) { A().warn(); return; }
      g.tx = mx; g.ty = my; g.moving = true;
      A().click();
    };

    const onTouch = (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      onClick({ clientX: t.clientX, clientY: t.clientY });
    };

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("beforeunload", onUnload);
      saveGame(gRef.current);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouch);
      A().dispose();
    };
  }, [started, initGame]);

  const doStart = async () => {
    if (started) return;
    await A().init();
    setStarted(true);
  };
  const g = gRef.current;

  const doUndock = () => {
    if (!g) return;
    g.docked = false; g.moving = false;
    if (!g.contract) g.contract = makeContract(g.fieldGen || 0);
    saveGame(g);
    A().click();
    setUi((p) => ({ ...p, docked: false, contract: g.contract }));
    setStationTab("cargo");
  };
  const doRefuel = () => {
    if (!g) return;
    const c = Math.ceil((g.maxFuel - g.fuel) * 1.5);
    if (g.cr < c) { A().warn(); return; }
    g.cr -= c; g.fuel = g.maxFuel; A().click();
    setUi((p) => ({ ...p, cr: g.cr, fuel: Math.floor(g.fuel) }));
  };
  const doRepair = () => {
    if (!g) return;
    const c = Math.ceil((g.maxHull - g.hull) * 2);
    if (g.cr < c) { A().warn(); return; }
    g.cr -= c; g.hull = g.maxHull; A().click();
    setUi((p) => ({ ...p, cr: g.cr, hull: Math.floor(g.hull) }));
  };
  const doSellAll = () => {
    if (!g) return;
    const ship = SHIPS.find(s => s.id === g.shipId) || SHIPS[0];
    const shipMult = ship.passiveFn(g, "sell");
    const cbonus = g.cargoBonus || 1;
    let t = 0;
    Object.entries(g.cargo).forEach(([k, v]) => { t += v * ORES[k].val * shipMult * cbonus; });
    if (!isFinite(t)) t = 0;
    g.cr += Math.floor(t); g.cargo = {};
    if (t > 0) { A().click(); saveGame(g); }
    setUi((p) => ({ ...p, cr: g.cr, cargo: 0, ore: {} }));
  };
  const doSellOre = (k) => {
    if (!g) return;
    const q = g.cargo[k] || 0;
    if (!q) return;
    const ship = SHIPS.find(s => s.id === g.shipId) || SHIPS[0];
    const shipMult = ship.passiveFn(g, "sell");
    const cbonus = g.cargoBonus || 1;
    const earned = Math.floor(q * ORES[k].val * shipMult * cbonus);
    g.cr += isFinite(earned) ? earned : 0;
    delete g.cargo[k];
    A().click();
    const tc = Object.values(g.cargo).reduce((a, b) => a + b, 0);
    setUi((p) => ({ ...p, cr: g.cr, cargo: tc, ore: { ...g.cargo } }));
  };
  const doFillContract = () => {
    if (!g || !g.contract) return;
    const have = g.cargo[g.contract.ore] || 0;
    if (have < g.contract.qty) { A().warn(); return; }
    g.cargo[g.contract.ore] -= g.contract.qty;
    if (g.cargo[g.contract.ore] <= 0) delete g.cargo[g.contract.ore];
    const ship = SHIPS.find(s => s.id === g.shipId) || SHIPS[0];
    const mult = ship.passiveFn(g, "contract");
    const contractEarned = Math.floor(g.contract.reward * (isFinite(mult) ? mult : 1));
    if (isFinite(contractEarned)) g.cr += contractEarned;
    A().click();
    g.contract = null;
    const tc = Object.values(g.cargo).reduce((a, b) => a + b, 0);
    setUi((p) => ({ ...p, cr: g.cr, cargo: tc, ore: { ...g.cargo }, contract: null }));
  };
  const doUpgradePath = (slot, pathId) => {
    if (!g) return;
    const slotDef = UPGRADE_SLOTS.find(s => s.slot === slot);
    if (!slotDef) return;
    const path = slotDef.paths.find(p => p.id === pathId);
    if (!path) return;
    const cur = g.upgrades[slot];
    if (cur && cur.pathId !== pathId) { A().warn(); return; }
    const level = cur ? cur.level : 0;
    if (level >= path.costs.length) { A().warn(); return; }
    const cost = path.costs[level];
    if (g.cr < cost) { A().warn(); return; }
    g.cr -= cost;
    path.levels[level](g);
    g.upgrades[slot] = { pathId, level: level + 1 };
    A().click();
    saveGame(g);
    setUi((p) => ({ ...p, cr: g.cr }));
  };
  const doBuyShip = (shipId) => {
    if (!g) return;
    if (g.shipId === shipId) return;
    const ship = SHIPS.find(s => s.id === shipId);
    if (!ship || g.cr < ship.cost) { A().warn(); return; }
    g.cr -= ship.cost;
    g.shipId = shipId;
    g.speed = ship.stats.speed;
    g.fuelUse = ship.stats.fuelUse;
    g.maxFuel = ship.stats.maxFuel;
    g.fuel = Math.min(g.fuel, g.maxFuel);
    g.maxHull = ship.stats.maxHull;
    g.hull = Math.min(g.hull, g.maxHull);
    g.maxCargo = ship.stats.maxCargo;
    g.miningRate = ship.stats.miningRate;
    g.miningRange = ship.stats.miningRange;
    Object.entries(g.upgrades).forEach(([slot, { pathId, level }]) => {
      const slotDef = UPGRADE_SLOTS.find(s => s.slot === slot);
      const path = slotDef?.paths.find(p => p.id === pathId);
      if (path) for (let i = 0; i < level; i++) path.levels[i](g);
    });
    A().buy();
    saveGame(g);
    setUi((p) => ({ ...p, cr: g.cr }));
  };

  const P = {
    background: "#0c1520", border: "1px solid #1a2a35",
    borderRadius: 4, padding: 10, marginBottom: 8,
  };
  const B = (c, dis) => ({
    padding: "6px 14px",
    border: `1px solid ${dis ? "#1a2a30" : c + "66"}`,
    background: dis ? "#0a1018" : `${c}18`,
    color: dis ? "#2a3a40" : c,
    borderRadius: 4, cursor: dis ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontSize: 11, transition: "all .15s",
  });
  const Bs = (c, dis) => ({ ...B(c, dis), padding: "4px 10px", fontSize: 9 });

  return (
    <div style={{
      width: "100%", height: "100vh", background: "#060a12",
      display: "flex", flexDirection: "column",
      fontFamily: "'Share Tech Mono',monospace", color: "#b0c0d0",
      overflow: "hidden", position: "relative",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}canvas{display:block;touch-action:none}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1a2a35;border-radius:2px}`}</style>

      {/* Title screen */}
      {!started && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 100,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#060a12",
        }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 28, fontWeight: 700, color: "#ee8844", letterSpacing: 4, marginBottom: 8 }}>
            DRIFT CORE
          </div>
          <div style={{ fontSize: 10, color: "#4a5a6a", marginBottom: 20, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
            Command your mining vessel through asteroid fields. Click to move, click asteroids to mine. Manage cargo, handle random events, and trade at the station.
          </div>
          <div style={{ fontSize: 9, color: "#3a4a5a", marginBottom: 16, textAlign: "center", lineHeight: 1.8 }}>
            <strong style={{ color: "#6a7a8a" }}>Controls:</strong> Click/tap to move &middot; Click asteroid to mine<br />
            Click station to dock &middot; Events pop up &mdash; choose wisely
          </div>
          {loadGame() && (
            <div style={{ fontSize: 9, color: "#44aaee", marginBottom: 8 }}>
              &#9672; Save detected &mdash; progress will be restored
            </div>
          )}
          <button onClick={doStart} style={{
            padding: "14px 40px", border: "2px solid #ee8844",
            background: "#ee884422", color: "#ee8844", borderRadius: 6,
            cursor: "pointer", fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, letterSpacing: 3,
            marginBottom: 8,
          }}>&#9654; LAUNCH</button>
          {loadGame() && (
            <button onClick={() => { clearSave(); window.location.reload(); }} style={{
              padding: "6px 20px", border: "1px solid #2a3a4a",
              background: "none", color: "#3a4a5a", borderRadius: 4,
              cursor: "pointer", fontFamily: "inherit", fontSize: 9,
            }}>New Game</button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ flex: 1, width: "100%", cursor: "crosshair" }} />

      {/* Docked overlay */}
      {started && ui.docked && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "#080c14ee", overflow: "auto", padding: 12, paddingBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, color: "#ee8844", letterSpacing: 2 }}>&#9670; STATION</div>
              <div style={{ fontSize: 11, color: "#ddcc66" }}>&#9672; {ui.cr} CR</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={doRefuel} style={Bs("#44aaee")}>&#9981; Refuel</button>
              <button onClick={doRepair} style={Bs("#66aa55")}>&#128295; Repair</button>
              <button onClick={doUndock} style={Bs("#44ddaa")}>&#9654; Launch</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {["cargo","upgrades","ships"].map(tab => (
              <button key={tab} onClick={() => setStationTab(tab)} style={{
                padding: "5px 12px", fontSize: 9, fontFamily: "inherit", borderRadius: 3, cursor: "pointer",
                border: `1px solid ${stationTab === tab ? "#44aaee" : "#1a2a35"}`,
                background: stationTab === tab ? "#44aaee22" : "#0a1018",
                color: stationTab === tab ? "#44aaee" : "#4a5a6a",
              }}>{tab.toUpperCase()}</button>
            ))}
          </div>

          {stationTab === "cargo" && (<>
            {ui.contract ? (
              <div style={{ ...P, borderLeft: "3px solid #44ddaa" }}>
                <div style={{ fontSize: 10, color: "#44ddaa", fontWeight: 600, marginBottom: 6 }}>&#128203; CONTRACT</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ORES[ui.contract.ore].c, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: ORES[ui.contract.ore].c, fontWeight: 600 }}>{ORES[ui.contract.ore].n}</span>
                  <span style={{ fontSize: 10, color: "#8a9aaa" }}>&times;{ui.contract.qty}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#ddcc66" }}>{ui.contract.reward} CR</span>
                </div>
                <div style={{ fontSize: 9, color: "#4a6a7a", marginBottom: 6 }}>
                  Have: {ui.ore[ui.contract.ore] || 0}/{ui.contract.qty} &mdash; {Math.ceil(ui.contract.timer / 30)}s remaining
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={doFillContract} style={{ ...Bs("#44ddaa", (ui.ore[ui.contract.ore] || 0) < ui.contract.qty) }}>
                    Fill ({ui.ore[ui.contract.ore] || 0}/{ui.contract.qty})
                  </button>
                  <button onClick={() => {
                    if (!g || g.cr < 25) { A().warn(); return; }
                    g.contract = makeContract(g.fieldGen || 0);
                    g.cr -= 25;
                    A().click();
                    setUi((p) => ({ ...p, cr: g.cr, contract: g.contract }));
                  }} style={Bs("#ee8844", !g || g.cr < 25)}>Skip -25 CR</button>
                </div>
              </div>
            ) : (
              <div style={{ ...P, borderLeft: "3px solid #2a4a3a" }}>
                <div style={{ fontSize: 10, color: "#4a6a5a", marginBottom: 6 }}>&#128203; NO CONTRACT</div>
                <button onClick={() => {
                  if (!g) return;
                  g.contract = makeContract(g.fieldGen || 0);
                  A().click();
                  setUi((p) => ({ ...p, contract: g.contract }));
                }} style={Bs("#44ddaa")}>Generate Contract</button>
              </div>
            )}
            <div style={P}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#88ccee", fontFamily: "'Rajdhani'", fontWeight: 600 }}>CARGO ({ui.cargo}/{ui.maxCargo})</div>
                <button onClick={doSellAll} style={Bs("#ddaa44")}>&#128176; Sell All</button>
              </div>
              {Object.keys(ui.ore || {}).length === 0 && <div style={{ fontSize: 10, color: "#2a3a4a" }}>Empty</div>}
              {Object.entries(ui.ore || {}).map(([k, v]) => {
                const ore = ORES[k];
                const ship = SHIPS.find(s => s.id === g?.shipId) || SHIPS[0];
                const mult = ship.passiveFn(g, "sell") * (g?.cargoBonus || 1);
                return v > 0 && (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", marginBottom: 3, background: "#0a1018", borderRadius: 3, border: "1px solid #141e28" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: ore.c }} />
                    <span style={{ flex: 1, fontSize: 10, color: ore.c }}>{ore.n}</span>
                    <span style={{ fontSize: 9, color: "#7a8a9a" }}>&times;{v}</span>
                    <span style={{ fontSize: 8, color: "#4a5a6a" }}>{Math.floor(v * ore.val * mult)} CR</span>
                    <button onClick={() => doSellOre(parseInt(k))} style={Bs("#ddaa44")}>Sell</button>
                  </div>
                );
              })}
            </div>
            {ui.activeEvent && (
              <div style={{ ...P, borderLeft: "3px solid #cc55ff" }}>
                <div style={{ fontSize: 10, color: "#cc55ff", fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>EVENTS LOG</div>
                {(() => {
                  const evColors = { surge: "#ddaa44", storm: "#ff6644", salvage: "#44ddaa", pirates: "#ff4444", wormhole: "#cc55ff" };
                  const evColor = evColors[ui.activeEvent.id] || "#88ccee";
                  return (
                    <div style={{ fontSize: 10, color: evColor }}>
                      {ui.activeEvent.name} &mdash; <span style={{ color: "#8a9aaa" }}>{ui.activeEvent.msg}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </>)}

          {stationTab === "upgrades" && (
            <div style={P}>
              <div style={{ fontSize: 11, color: "#88ccee", marginBottom: 8, fontFamily: "'Rajdhani'", fontWeight: 600 }}>UPGRADES</div>
              {UPGRADE_SLOTS.map(slot => {
                const cur = g?.upgrades?.[slot.slot];
                return (
                  <div key={slot.slot} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "#4a5a6a", marginBottom: 4, letterSpacing: 1 }}>{slot.label.toUpperCase()}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {slot.paths.map(path => {
                        const chosen = cur?.pathId === path.id;
                        const locked = cur && cur.pathId !== path.id;
                        const level = chosen ? cur.level : 0;
                        const maxed = level >= path.costs.length;
                        const cost = maxed ? 0 : path.costs[level];
                        const canAfford = !locked && !maxed && (g?.cr || 0) >= cost;
                        return (
                          <div key={path.id} style={{ flex: 1, padding: "6px 8px", background: chosen ? "#0a1828" : "#0a1018", borderRadius: 3, border: `1px solid ${chosen ? "#44aaee44" : locked ? "#1a1a1a" : "#141e28"}`, opacity: locked ? 0.35 : 1 }}>
                            <div style={{ fontSize: 9, color: chosen ? "#88ccee" : "#6a7a8a", fontWeight: 600, marginBottom: 2 }}>{path.name}</div>
                            <div style={{ fontSize: 8, color: "#3a4a5a", marginBottom: 4, lineHeight: 1.4 }}>{path.desc}</div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", gap: 2 }}>
                                {path.costs.map((_, i) => (
                                  <div key={i} style={{ width: 6, height: 6, borderRadius: 1, background: i < level ? "#44aaee" : "#1a2a35" }} />
                                ))}
                              </div>
                              {maxed
                                ? <span style={{ fontSize: 8, color: "#2a5a3a" }}>MAX</span>
                                : <button onClick={() => doUpgradePath(slot.slot, path.id)} style={Bs("#ee8844", !canAfford)}>{cost} CR</button>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {stationTab === "ships" && (
            <div style={P}>
              <div style={{ fontSize: 11, color: "#88ccee", marginBottom: 8, fontFamily: "'Rajdhani'", fontWeight: 600 }}>SHIPS</div>
              {SHIPS.map(ship => {
                const owned = g?.shipId === ship.id;
                const canBuy = !owned && (g?.cr || 0) >= ship.cost;
                return (
                  <div key={ship.id} style={{ padding: "8px 10px", marginBottom: 6, background: owned ? "#0a1828" : "#0a1018", borderRadius: 4, border: `1px solid ${owned ? ship.color + "66" : "#141e28"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16, color: ship.color }}>{ship.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, color: ship.color, fontFamily: "'Rajdhani'", fontWeight: 700 }}>{ship.name}</div>
                          <div style={{ fontSize: 8, color: "#4a5a6a" }}>{ship.desc}</div>
                        </div>
                      </div>
                      {owned
                        ? <span style={{ fontSize: 9, color: ship.color }}>ACTIVE</span>
                        : <button onClick={() => doBuyShip(ship.id)} style={Bs(ship.color, !canBuy)}>{ship.cost === 0 ? "FREE" : `${ship.cost} CR`}</button>
                      }
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                      {[
                        ["SPD", ship.stats.speed.toFixed(1)],
                        ["FUEL", (ship.stats.fuelUse * 1000).toFixed(1)],
                        ["HULL", ship.stats.maxHull],
                        ["HOLD", ship.stats.maxCargo],
                        ["DRILL", ship.stats.miningRate.toFixed(1)],
                        ["RANGE", ship.stats.miningRange],
                      ].map(([k, v]) => (
                        <div key={k} style={{ fontSize: 8, color: "#4a6a8a" }}>
                          <span style={{ color: "#2a4a6a" }}>{k} </span>{v}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 8, color: "#44ddaa88" }}>&#10022; {ship.passive}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: 8, color: "#1a2a3a", textAlign: "center", marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
            <span>Field Gen {g?.fieldGen || 0} &middot; {g?.asteroids?.filter((a) => a.hp <= 0).length || 0} asteroids mined &middot; {ui.cr} CR</span>
            <button onClick={() => { clearSave(); gRef.current = null; window.location.reload(); }} style={{ fontSize: 7, color: "#2a3a4a", background: "none", border: "1px solid #1a2a35", borderRadius: 2, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}>Reset Save</button>
          </div>
        </div>
      )}

      {started && (
        <button
          onClick={() => { setMuted((m) => { const n = !m; A().mute(n); return n; }); }}
          style={{
            position: "absolute", top: 8, right: ui.docked ? 12 : 100, zIndex: 60,
            background: "none", border: "1px solid #44aaee33", borderRadius: 3,
            color: muted ? "#cc4444" : "#44aaee", fontSize: 12, cursor: "pointer", padding: "2px 6px",
          }}
        >{muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}</button>
      )}
    </div>
  );
}
