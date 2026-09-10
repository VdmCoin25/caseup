import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Package, Coins, Bell, Menu, Plus, User, Trophy, Gift, ArrowLeft,
} from "lucide-react";

/* ---------------------------------- tokens ---------------------------------- */
const C = {
  bg: "#070B14",
  bgDeep: "#04060B",
  bgElevated: "#0F1830",
  bgCard: "#152140",
  bgInset: "#0A1224",
  ember: "#2E9BFF",
  emberHot: "#5CB6FF",
  gold: "#FFC93C",
  text: "#F2F6FC",
  textDim: "#8CA0C2",
  danger: "#FF4D4D",
  border: "#22335A",
  borderSoft: "#1A2745",
};

const RARITY = [
  { id: "consumer",   label: "Обычное",       color: "#A8998A", min: 0 },
  { id: "industrial", label: "Промышленное",  color: "#6E9BD6", min: 40 },
  { id: "milspec",    label: "Армейское",     color: "#6178DE", min: 120 },
  { id: "restricted", label: "Закрытое",      color: "#A265DE", min: 350 },
  { id: "classified", label: "Засекреченное", color: "#D4568C", min: 900 },
  { id: "covert",     label: "Тайное",        color: "#D14E2C", min: 2200 },
  { id: "legendary",  label: "Легендарное",   color: "#F0B94A", min: 5000 },
];
const rarityForValue = (v) => RARITY.reduce((acc, t) => (v >= t.min ? t : acc), RARITY[0]);

// Real, publicly known CS2 weapon + skin name pairs, picked as short
// (weapon, finish) strings rather than pulled from Valve's API — no Steam
// calls, no OpenID, nothing that touches their service at all.
// Static, hand-picked reference prices (approximate USD, illustrative — not
// a live feed) so a cheap-tier drop always gets an appropriately "cheap"
// looking real skin name and an expensive tier always gets something that
// actually looks expensive, instead of names being assigned at random.
const SKIN_CATALOG = [
  { type: "rifle",  name: "AK-47 | Redline", usd: 15 },
  { type: "rifle",  name: "AK-47 | Vulcan", usd: 40 },
  { type: "rifle",  name: "AK-47 | Case Hardened", usd: 55 },
  { type: "rifle",  name: "AK-47 | Fire Serpent", usd: 400 },
  { type: "rifle",  name: "AK-47 | Asiimov", usd: 60 },
  { type: "rifle",  name: "AK-47 | Neon Rider", usd: 45 },
  { type: "rifle",  name: "AK-47 | Bloodsport", usd: 30 },
  { type: "rifle",  name: "AK-47 | Wild Lotus", usd: 1500 },
  { type: "rifle",  name: "M4A4 | Asiimov", usd: 70 },
  { type: "rifle",  name: "M4A4 | Howl", usd: 2500 },
  { type: "rifle",  name: "M4A4 | Neo-Noir", usd: 35 },
  { type: "rifle",  name: "M4A4 | The Emperor", usd: 25 },
  { type: "rifle",  name: "M4A1-S | Hyper Beast", usd: 20 },
  { type: "rifle",  name: "M4A1-S | Icarus Fell", usd: 25 },
  { type: "rifle",  name: "M4A1-S | Golden Coil", usd: 15 },
  { type: "rifle",  name: "FAMAS | Afterimage", usd: 10 },
  { type: "rifle",  name: "Galil AR | Chatterbox", usd: 8 },
  { type: "sniper", name: "AWP | Dragon Lore", usd: 8000 },
  { type: "sniper", name: "AWP | Asiimov", usd: 70 },
  { type: "sniper", name: "AWP | Neo-Noir", usd: 60 },
  { type: "sniper", name: "AWP | Gungnir", usd: 3000 },
  { type: "sniper", name: "AWP | Hyper Beast", usd: 40 },
  { type: "sniper", name: "AWP | Wildfire", usd: 45 },
  { type: "sniper", name: "SSG 08 | Dragonfire", usd: 10 },
  { type: "pistol", name: "Desert Eagle | Blaze", usd: 300 },
  { type: "pistol", name: "Desert Eagle | Printstream", usd: 80 },
  { type: "pistol", name: "Desert Eagle | Code Red", usd: 150 },
  { type: "pistol", name: "USP-S | Kill Confirmed", usd: 40 },
  { type: "pistol", name: "USP-S | Neo-Noir", usd: 30 },
  { type: "pistol", name: "Glock-18 | Fade", usd: 250 },
  { type: "pistol", name: "Glock-18 | Water Elemental", usd: 15 },
  { type: "pistol", name: "P250 | Asiimov", usd: 8 },
  { type: "pistol", name: "Five-SeveN | Case Hardened", usd: 10 },
  { type: "smg",    name: "MP9 | Hydra", usd: 10 },
  { type: "smg",    name: "MAC-10 | Neon Rider", usd: 15 },
  { type: "smg",    name: "P90 | Asiimov", usd: 8 },
  { type: "smg",    name: "UMP-45 | Primal Saber", usd: 10 },
  { type: "shotgun", name: "Nova | Hyper Beast", usd: 5 },
  { type: "shotgun", name: "XM1014 | Tranquility", usd: 5 },
  { type: "shotgun", name: "Sawed-Off | The Kraken", usd: 5 },
  { type: "knife",  name: "Karambit | Doppler", usd: 900 },
  { type: "knife",  name: "Karambit | Fade", usd: 1200 },
  { type: "knife",  name: "Karambit | Tiger Tooth", usd: 700 },
  { type: "knife",  name: "Butterfly Knife | Marble Fade", usd: 1000 },
  { type: "knife",  name: "M9 Bayonet | Autotronic", usd: 600 },
  { type: "knife",  name: "Bayonet | Case Hardened", usd: 500 },
  { type: "knife",  name: "Talon Knife | Doppler", usd: 800 },
  { type: "gloves", name: "Sport Gloves | Pandora's Box", usd: 600 },
  { type: "gloves", name: "Specialist Gloves | Crimson Kimono", usd: 700 },
  { type: "gloves", name: "Driver Gloves | King Snake", usd: 300 },
  { type: "gloves", name: "Hand Wraps | Cobalt Skulls", usd: 400 },
].sort((a, b) => a.usd - b.usd);
// 1 in-game coin roughly tracks $0.05 of reference price — purely for
// picking a name that "feels" right for the coin amount rolled, not an
// actual currency conversion.
const PRICE_SCALE = 20;
function skinsNear(targetCoinValue) {
  let best = SKIN_CATALOG[0], bestDiff = Infinity;
  const near = [];
  for (const s of SKIN_CATALOG) {
    const diff = Math.abs(Math.log(s.usd * PRICE_SCALE) - Math.log(Math.max(1, targetCoinValue)));
    if (diff < bestDiff) { bestDiff = diff; best = s; }
    near.push({ s, diff });
  }
  near.sort((a, b) => a.diff - b.diff);
  return near.slice(0, 4).map((n) => n.s);
}
const WEARS = [
  { label: "Прямо с завода", mult: 1.18 },
  { label: "Немного поношенное", mult: 1.05 },
  { label: "После полевых испытаний", mult: 0.92 },
  { label: "Поношенное", mult: 0.8 },
  { label: "Видавшее виды", mult: 0.68 },
];

let _uid = 0;
function makeItem(seedValue, id) {
  const wear = WEARS[(Math.random() * WEARS.length) | 0];
  const st = Math.random() < 0.1;
  const value = Math.round(seedValue * (0.85 + Math.random() * 0.3) * wear.mult * (st ? 1.15 : 1));
  // Pick the name from real skins whose reference price is close to the
  // value actually rolled, so a cheap drop never wears an absurdly
  // expensive-sounding name (or vice versa) — game balance (odds, the 8x
  // cap per case) stays exactly as tuned; only the *label* is price-matched.
  const candidates = skinsNear(value);
  const s = candidates[(Math.random() * candidates.length) | 0];
  return {
    id: id ?? `it-${++_uid}-${Date.now()}`,
    name: `${st ? "StatTrak™ " : ""}${s.name} (${wear.label})`,
    short: s.name,
    type: s.type,
    wear: wear.label,
    value,
    rarity: rarityForValue(value),
  };
}

/* ---------------------------------- sound ---------------------------------- */
let soundEnabled = true;
export function isSoundOn() { return soundEnabled; }
export function setSoundOn(v) { soundEnabled = v; }

let _forceRerenderFns = [];
export function registerRerender(fn) { _forceRerenderFns.push(fn); }
export function forceRerender() { _forceRerenderFns.forEach((f) => f()); }

let audioCtx = null;
function beep(freq = 440, dur = 0.09, type = "sine", vol = 0.14) {
  if (!soundEnabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur + 0.02);
  } catch {}
}
const sfx = {
  tap: () => beep(520, 0.05, "square", 0.08),
  open: () => beep(300, 0.12, "sawtooth", 0.1),
  tick: () => beep(680 + Math.random() * 60, 0.035, "square", 0.06),
  win: () => { beep(660, 0.1, "triangle", 0.14); setTimeout(() => beep(880, 0.16, "triangle", 0.14), 90); },
  lose: () => beep(160, 0.22, "sine", 0.12),
  // A calm, evenly-spaced clock-like tick for the whole spin, rather than
  // one continuous siren-like tone or a harsh randomized click. Returns a
  // stop() in case the caller wants to cut it short.
  spin: (durationMs) => {
    if (!soundEnabled) return () => {};
    const tickOnce = (vol) => {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(480, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now);
        o.stop(now + 0.06);
      } catch {}
    };
    const timers = [];
    const baseInterval = 190; // ms between ticks, like a calm clock hand
    let elapsed = 0;
    while (elapsed < durationMs) {
      const progress = elapsed / durationMs;
      // gently widen the gap near the very end, like it's settling — no
      // dramatic acceleration, just a soft slow-down
      const interval = baseInterval * (1 + Math.max(0, progress - 0.75) * 3);
      const vol = 0.05 * (1 - progress * 0.4);
      timers.push(setTimeout(() => tickOnce(vol), elapsed));
      elapsed += interval;
    }
    return () => { timers.forEach(clearTimeout); };
  },
};

/* ---------------------------------- artwork ---------------------------------- */
function WeaponGlyph({ type, color, size = 24 }) {
  const dk = "rgba(0,0,0,.35)";
  const P = {
    rifle: (
      <g fill={color}>
        <rect x="3" y="21" width="30" height="4.5" rx="1" />
        <rect x="30" y="17.5" width="9" height="5" rx="1" />
        <polygon points="39,17 45,19 45,24 39,24" opacity=".92" />
        <polygon points="9,25.5 14,25.5 12,37 8,37" />
        <rect x="17" y="25.5" width="6" height="7" rx="1" />
        <rect x="19" y="13" width="3.4" height="8" rx="1" />
        <rect x="24" y="17.5" width="5" height="3.5" fill={dk} />
      </g>
    ),
    sniper: (
      <g fill={color}>
        <rect x="2" y="23" width="36" height="3.6" rx="1" />
        <rect x="9" y="14" width="19" height="4.6" rx="2" />
        <circle cx="10.5" cy="16.3" r="3.6" fill={dk} />
        <circle cx="10.5" cy="16.3" r="2.1" fill={color} />
        <circle cx="26.5" cy="16.3" r="3.2" fill={dk} />
        <polygon points="38,20.5 45,22.5 45,28 38,27" opacity=".92" />
        <rect x="14" y="26.6" width="6" height="8" rx="1" />
        <rect x="6" y="26.6" width="4" height="10" rx="1" />
      </g>
    ),
    pistol: (
      <g fill={color}>
        <rect x="6" y="16" width="24" height="7" rx="2" />
        <rect x="27" y="18.5" width="5" height="3.4" fill={dk} />
        <path d="M15 23h9v6.5c0 5-3.2 9-9 10.5V23z" />
        <rect x="9" y="23" width="6" height="3" rx="1" fill={dk} />
      </g>
    ),
    shotgun: (
      <g fill={color}>
        <rect x="2" y="19.5" width="34" height="3.4" rx="1" />
        <rect x="2" y="24.5" width="34" height="3.4" rx="1" />
        <polygon points="36,18.5 44,20.5 44,27.5 36,27" opacity=".92" />
        <rect x="12" y="28" width="14" height="6" rx="2.5" fill={dk} />
        <polygon points="8,28 22,28 20,38 10,38" />
      </g>
    ),
    knife: (
      <g fill={color}>
        <polygon points="8,32 32,7 37,11 13,39" />
        <polygon points="8,32 13,39 5,40" fill={dk} />
        <rect x="2" y="36" width="10" height="5" rx="2" transform="rotate(-42 7 38)" />
      </g>
    ),
    smg: (
      <g fill={color}>
        <rect x="4" y="22" width="24" height="5" rx="1.5" />
        <rect x="10" y="16.5" width="7" height="5.5" rx="1" />
        <polygon points="28,20.5 38,22 38,29 28,27" opacity=".92" />
        <rect x="14" y="27" width="6" height="9" rx="1" />
        <rect x="6" y="27" width="4" height="6" rx="1" fill={dk} />
      </g>
    ),
    gloves: (
      <g fill={color}>
        <path d="M14 38V21a3 3 0 0 1 6 0v6-8a3 3 0 0 1 6 0v8-6a3 3 0 0 1 6 0v11c0 6-4.5 10.5-10 10.5h-1c-5.5 0-10.3-4.5-10.3-10.5v-5a2.8 2.8 0 0 1 5.6 0v3.5" />
      </g>
    ),
  };
  return <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.4))" }}>{P[type] || P.rifle}</svg>;
}

function CrateArt({ accent, motif = "hex", size = 128 }) {
  const dark = "#1A120C";
  const Motif = {
    hex: <path d="M64 40l14 8v16l-14 8-14-8V48z" fill="none" stroke={accent} strokeWidth="3" opacity=".85" />,
    fang: <path d="M52 42h24l-6 22-6-10-6 10z" fill={accent} opacity=".8" />,
    leaf: <path d="M64 38c10 6 17 14 17 23a17 17 0 0 1-34 0c0-9 7-17 17-23z" fill={accent} opacity=".75" />,
    burst: <g stroke={accent} strokeWidth="3" opacity=".85" fill="none"><circle cx="64" cy="55" r="9" /><path d="M64 38v8M64 64v8M47 55h8M73 55h8" /></g>,
  }[motif];
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 128 105">
      <defs>
        <linearGradient id={`lid-${motif}-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity=".55" />
          <stop offset="1" stopColor={accent} stopOpacity=".18" />
        </linearGradient>
        <linearGradient id={`bod-${motif}-${accent}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity=".3" />
          <stop offset="1" stopColor={dark} stopOpacity=".95" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="98" rx="42" ry="6" fill="#000" opacity=".45" />
      <path d="M16 40l48-22 48 22v40L64 96 16 80z" fill={`url(#bod-${motif}-${accent})`} stroke={accent} strokeWidth="2.4" strokeLinejoin="round" opacity=".95" />
      <path d="M16 40l48-22 48 22-48 20z" fill={`url(#lid-${motif}-${accent})`} stroke={accent} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M64 60v36" stroke={accent} strokeWidth="2" opacity=".55" />
      <path d="M16 40v40M112 40v40" stroke={accent} strokeWidth="2" opacity=".5" />
      <path d="M34 49v39M94 49v39" stroke={accent} strokeWidth="1.6" opacity=".3" />
      <rect x="56" y="52" width="16" height="9" rx="2" fill={dark} stroke={accent} strokeWidth="2" />
      <rect x="24" y="60" width="9" height="7" rx="1.5" fill={dark} stroke={accent} strokeWidth="1.6" opacity=".8" />
      <rect x="95" y="60" width="9" height="7" rx="1.5" fill={dark} stroke={accent} strokeWidth="1.6" opacity=".8" />
      {Motif}
    </svg>
  );
}

/* Rotating 3D crate — real Three.js geometry, mounted only on the case detail
   screen (one at a time) to keep it light. Falls back silently if three fails to load. */
function Case3D({ accent, size = 210 }) {
  const mountRef = useRef(null);
  useEffect(() => {
    let renderer, raf, disposed = false;
    (async () => {
      let THREE;
      try {
        THREE = await import("three");
      } catch {
        return;
      }
      if (disposed || !mountRef.current) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0.5, 3.6);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(size, size);
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);

      const group = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(1.7, 1.0, 1.15);
      const bodyMat = new THREE.MeshStandardMaterial({ color: "#1A120C", metalness: 0.5, roughness: 0.45 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(bodyGeo),
        new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9 })
      );
      group.add(edges);

      const bandGeo = new THREE.BoxGeometry(1.76, 0.14, 1.21);
      const bandMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.7, roughness: 0.25, emissive: accent, emissiveIntensity: 0.25 });
      const band1 = new THREE.Mesh(bandGeo, bandMat); band1.position.y = 0.32; group.add(band1);
      const band2 = new THREE.Mesh(bandGeo, bandMat); band2.position.y = -0.32; group.add(band2);

      const latchGeo = new THREE.BoxGeometry(0.22, 0.16, 0.05);
      const latchMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.8, roughness: 0.2 });
      const latch = new THREE.Mesh(latchGeo, latchMat);
      latch.position.set(0, 0, 0.6);
      group.add(latch);

      scene.add(group);
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const dl1 = new THREE.DirectionalLight(0xffffff, 1.1);
      dl1.position.set(2.5, 3, 4);
      scene.add(dl1);
      const dl2 = new THREE.DirectionalLight(accent, 1.0);
      dl2.position.set(-3, -1.5, -2);
      scene.add(dl2);

      const animate = () => {
        if (disposed) return;
        group.rotation.y += 0.0075;
        group.rotation.x = Math.sin(Date.now() * 0.0005) * 0.12;
        group.position.y = Math.sin(Date.now() * 0.0011) * 0.05;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();
    })();
    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (renderer) renderer.dispose();
    };
  }, [accent, size]);
  return <div ref={mountRef} style={{ width: size, height: size }} />;
}

function ItemBadge({ item, size = 44 }) {
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{
        width: size, height: size, borderRadius: size * 0.26,
        background: `radial-gradient(120% 120% at 30% 18%, ${item.rarity.color}4D, ${C.bgInset} 72%)`,
        border: `1.5px solid ${item.rarity.color}80`,
        boxShadow: `0 0 ${size * 0.3}px ${item.rarity.color}44, inset 0 1px 0 rgba(255,255,255,.07)`,
      }}
    >
      <div className="absolute -inset-1" style={{ background: "linear-gradient(115deg,transparent 42%,rgba(255,255,255,.14) 50%,transparent 58%)" }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: item.rarity.color }} />
      <WeaponGlyph type={item.type} color={item.rarity.color} size={size * 0.55} />
    </div>
  );
}

/* ambient background particles */
function SparkField({ count = 8 }) {
  const sparks = useMemo(
    () => Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, size: 3 + Math.random() * 4,
      color: ["#2E9BFF", "#5CB6FF", "#FFC93C", "#7FC4FF"][i % 4],
      dur: 6 + Math.random() * 8, delay: -(Math.random() * 12),
      sway: 10 + Math.random() * 14,
      op: 0.35 + Math.random() * 0.4,
    })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <style>{`
        @keyframes spRise{0%{transform:translateY(10%);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-110%);opacity:0}}
        @keyframes spSway{0%,100%{margin-left:0}50%{margin-left:var(--sw)}}
      `}</style>
      {sparks.map((s) => (
        <div key={s.id} style={{ position: "absolute", left: `${s.left}%`, bottom: 0, width: s.size, height: s.size, animation: `spRise ${s.dur}s linear infinite`, animationDelay: `${s.delay}s` }}>
          <div style={{ animation: `spSway ${s.dur / 2.1}s ease-in-out infinite`, "--sw": `${s.sway}px` }}>
            <div style={{ width: s.size, height: s.size, borderRadius: "50%", background: s.color, opacity: s.op, boxShadow: `0 0 ${s.size * 2.5}px ${s.color}` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* confetti burst for big wins */
function ConfettiBurst({ trigger, colors }) {
  const [bits, setBits] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const arr = Array.from({ length: 26 }).map((_, i) => ({
      id: i, x: 50 + (Math.random() - 0.5) * 20, rot: Math.random() * 360,
      dx: (Math.random() - 0.5) * 220, dy: -(160 + Math.random() * 160),
      color: colors[i % colors.length], size: 5 + Math.random() * 5, delay: Math.random() * 0.15,
    }));
    setBits(arr);
    const t = setTimeout(() => setBits([]), 1400);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!bits.length) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
      <style>{`@keyframes confettiPop{0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot));opacity:0}}`}</style>
      {bits.map((b) => (
        <div key={b.id} style={{
          position: "absolute", left: `${b.x}%`, top: "45%", width: b.size, height: b.size * 2.2,
          background: b.color, animation: `confettiPop 1.1s ease-out forwards`, animationDelay: `${b.delay}s`,
          "--dx": `${b.dx}px`, "--dy": `${b.dy}px`, "--rot": `${b.rot}deg`, borderRadius: 1,
        }} />
      ))}
    </div>
  );
}

/* ---------------------------------- data ---------------------------------- */
const CATALOG = [12, 16, 21, 28, 37, 49, 65, 86, 114, 150, 200, 265, 350, 465, 615, 815, 1080, 1430, 1890, 2500, 3300, 4400, 5800, 7700, 10200, 13500, 18000, 24000]
  .flatMap((s, i) => [makeItem(s, `cat-${i}a`), makeItem(s, `cat-${i}b`), makeItem(s, `cat-${i}c`), makeItem(s, `cat-${i}d`)])
  .sort((a, b) => a.value - b.value);

const CASES = [
  { id: "debut",   name: "Дебют",     tagline: "Первый шаг",       cost: 60,   accent: "#6E9BD6", motif: "hex",
    pool: [{ seed: 8, weight: 42 }, { seed: 17, weight: 30 }, { seed: 37, weight: 17 }, { seed: 85, weight: 8 }, { seed: 213, weight: 2.5 }, { seed: 480, weight: 0.5 }] },
  { id: "harvest", name: "Прорыв",    tagline: "Хит продаж",       cost: 120,  accent: "#E3B33D", motif: "leaf", isNew: true,
    pool: [{ seed: 3, weight: 40 }, { seed: 9, weight: 28 }, { seed: 23, weight: 16 }, { seed: 64, weight: 9 }, { seed: 166, weight: 4.5 }, { seed: 410, weight: 2 }, { seed: 960, weight: 0.5 }] },
  { id: "fang",    name: "Клык",      tagline: "Для рискующих",    cost: 320,  accent: "#A265DE", motif: "fang",
    pool: [{ seed: 17, weight: 28 }, { seed: 43, weight: 25 }, { seed: 114, weight: 20 }, { seed: 256, weight: 15 }, { seed: 569, weight: 8.5 }, { seed: 1195, weight: 3 }, { seed: 2560, weight: 0.5 }] },
  { id: "ember",   name: "Пепелище",  tagline: "Высокий разброс",  cost: 750,  accent: "#D14E2C", motif: "burst",
    pool: [{ seed: 90, weight: 24 }, { seed: 210, weight: 24 }, { seed: 450, weight: 22 }, { seed: 900, weight: 16 }, { seed: 1800, weight: 9.5 }, { seed: 3300, weight: 4 }, { seed: 6000, weight: 0.5 }] },
  { id: "crown",   name: "Корона",    tagline: "Топовые дропы",    cost: 1800, accent: "#F0B94A", motif: "burst",
    pool: [{ seed: 256, weight: 26 }, { seed: 576, weight: 24 }, { seed: 1152, weight: 21 }, { seed: 2240, weight: 16 }, { seed: 4160, weight: 9 }, { seed: 7680, weight: 3.4 }, { seed: 14400, weight: 0.6 }] },
  { id: "eclipse", name: "Затмение",  tagline: "Только легенды",   cost: 4200, accent: "#D4568C", motif: "hex",
    pool: [{ seed: 778, weight: 28 }, { seed: 1592, weight: 25 }, { seed: 2830, weight: 20 }, { seed: 5305, weight: 15 }, { seed: 9903, weight: 8 }, { seed: 19452, weight: 3.4 }, { seed: 33600, weight: 0.6 }] },
  { id: "relic",   name: "Реликвия",  tagline: "Для коллекционеров", cost: 9000, accent: "#57D6C2", motif: "burst",
    pool: [{ seed: 2000, weight: 30 }, { seed: 4000, weight: 24 }, { seed: 7200, weight: 19 }, { seed: 12800, weight: 14 }, { seed: 22000, weight: 8 }, { seed: 40000, weight: 4.4 }, { seed: 72000, weight: 0.6 }] },
  { id: "absolute", name: "Абсолют",  tagline: "Максимальная ставка", cost: 20000, accent: "#F0F0F5", motif: "hex",
    pool: [{ seed: 4800, weight: 32 }, { seed: 8800, weight: 24 }, { seed: 16000, weight: 18 }, { seed: 28000, weight: 13 }, { seed: 48000, weight: 8 }, { seed: 88000, weight: 4.3 }, { seed: 160000, weight: 0.7 }] },
];

function weightedPick(pool) {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of pool) { if (r < p.weight) return p; r -= p.weight; }
  return pool[0];
}
const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(2) + "K" : Math.round(n).toString());

/* ---------------------------------- levels ---------------------------------- */
const LEVEL_THRESHOLDS = Array.from({ length: 60 }, (_, i) => Math.round(120 * Math.pow(i + 1, 1.32)));

function xpForCase(cost) { return Math.max(3, Math.round(cost / 6)); }

function levelForXp(xp) {
  let lvl = 1;
  for (const t of LEVEL_THRESHOLDS) { if (xp >= t) lvl++; else break; }
  return lvl;
}
function levelProgress(xp) {
  const lvl = levelForXp(xp);
  const prev = lvl === 1 ? 0 : LEVEL_THRESHOLDS[lvl - 2];
  const next = LEVEL_THRESHOLDS[lvl - 1] ?? prev + 999999;
  const pct = Math.max(0, Math.min(100, Math.round(((xp - prev) / (next - prev)) * 100)));
  return { lvl, prev, next, pct, isMax: lvl > LEVEL_THRESHOLDS.length };
}
function levelPrize(lvl) { return lvl * 120; }

/* ---------------------------------- backend ---------------------------------- */
const SUPABASE_URL = "https://sjyrjeaghkkqkpkhlhhv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zGLwpCSxsbBS2TZaPHzO6A_ViS-m_I0";
const SYNC_FN = `${SUPABASE_URL}/functions/v1/telegram-sync`;

// Fill in your bot's @username after you create it in BotFather.
const BOT_USERNAME = "Caseeup_bot";

async function serverSync(action, initData, payload, startParam) {
  const res = await fetch(SYNC_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ action, initData, payload, startParam }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "sync failed");
  return data.player;
}
async function battleSync(action, initData, extra) {
  const res = await fetch(`${SYNC_FN}/battle-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ action, initData, ...extra }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "battle sync failed");
  return data.room;
}
async function fetchLeaderboard() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/caseup_leaderboard?select=*&order=coins.desc&limit=50`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error("leaderboard fetch failed");
  return res.json();
}

// Cosmetic on the client — only decides whether to render the admin tab at
// all. The real gate lives server-side in telegram-sync (checks the verified
// Telegram ID before doing anything), so this constant being visible in the
// bundle isn't a security issue.
const ADMIN_TELEGRAM_ID = 721141865;

async function adminSync(action, initData, extra) {
  const res = await fetch(`${SYNC_FN}/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ action, initData, ...extra }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "admin request failed");
  return data;
}

/* ---------------------------------- shared UI ---------------------------------- */
function LogoMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill={C.bgCard} stroke={C.ember} strokeWidth="1.6" />
      <path d="M9 16.5l7-3.6 7 3.6" fill="none" stroke={C.gold} strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="9" y="16.2" width="14" height="8.4" rx="1.6" fill={C.bgDeep} stroke={C.gold} strokeWidth="1.4" />
      <rect x="14.6" y="18.6" width="2.8" height="3.6" rx="0.6" fill={C.gold} />
      <path d="M11.5 10.2l1.7 1.9 2.3-3 2.3 3 1.7-1.9-0.9 3.6h-6.2z" fill={C.gold} />
    </svg>
  );
}

function AppHeader({ coins, tgUser, onNav, notifications }) {
  const [openPanel, setOpenPanel] = useState(null); // 'bell' | 'menu' | null
  return (
    <div className="relative z-30 flex items-center justify-between px-4 py-3"
      style={{ background: C.bgElevated, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 min-w-0">
        <LogoMark size={26} />
        <div className="min-w-0">
          <span className="font-black tracking-wide text-[15px] block leading-none" style={{ color: C.text }}>
            CASE<span style={{ color: C.gold }}>UP</span>
          </span>
          {tgUser && (
            <span className="text-[9px] truncate block leading-none mt-0.5" style={{ color: C.textDim }}>
              {tgUser.first_name}{tgUser.username ? ` · @${tgUser.username}` : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: C.bgCard, border: `1px solid ${C.gold}44` }}>
          <Coins size={13} color={C.gold} />
          <span className="text-[12px] font-bold tabular-nums glow-gold" style={{ color: C.gold }}>{fmt(coins)}</span>
        </div>
        <button onClick={() => { sfx.tap(); onNav("range"); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.ember }} title="Заработать монеты">
          <Plus size={15} color={C.bgDeep} />
        </button>
        <div className="relative">
          <button onClick={() => { sfx.tap(); setOpenPanel((p) => (p === "bell" ? null : "bell")); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center relative" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <Bell size={13} color={C.textDim} />
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: C.danger, color: "#fff" }}>
                {notifications.length}
              </div>
            )}
          </button>
          {openPanel === "bell" && (
            <div className="absolute right-0 top-9 w-56 rounded-xl p-2 z-40" style={{ background: C.bgElevated, border: `1px solid ${C.border}`, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}>
              <div className="text-[10px] uppercase tracking-wide px-1.5 pb-1.5" style={{ color: C.textDim }}>Последние дропы</div>
              {!notifications.length && <div className="text-[11px] px-1.5 py-2" style={{ color: C.textDim }}>Пока пусто</div>}
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg" style={{ color: C.text }}>
                  <ItemBadge item={n.item} size={26} />
                  <div className="text-[11px] truncate flex-1">{n.item.short}</div>
                  <div className="text-[11px] font-bold flex-shrink-0" style={{ color: n.item.rarity.color }}>{fmt(n.item.value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => { sfx.tap(); setOpenPanel((p) => (p === "menu" ? null : "menu")); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <Menu size={13} color={C.textDim} />
          </button>
          {openPanel === "menu" && (
            <div className="absolute right-0 top-9 w-44 rounded-xl p-1.5 z-40" style={{ background: C.bgElevated, border: `1px solid ${C.border}`, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}>
              {[["profile", "Профиль", User], ["profile", "Топ игроков", Trophy], ["profile", "Пригласить друга", Gift]].map(([tab, label, Icon], i) => (
                <button key={i} onClick={() => { setOpenPanel(null); onNav(tab); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[12px]" style={{ color: C.text }}>
                  <Icon size={14} color={C.textDim} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({ title, sub, onBack }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0 mb-4">
      {onBack && (
        <button onClick={() => { sfx.tap(); onBack(); }} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
          <ArrowLeft size={16} color={C.textDim} />
        </button>
      )}
      <div className="min-w-0">
        {sub && <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: C.textDim }}>{sub}</div>}
        <div className="text-xl font-bold truncate" style={{ color: C.text }}>{title}</div>
      </div>
    </div>
  );
}

/* ---------------------------------- cases ---------------------------------- */
const ITEM_W = 88, REEL_LEN = 56, WIN_INDEX = 47;

function CaseTile({ c, coins, onOpen }) {
  const afford = coins >= c.cost;
  return (
    <button onClick={() => { sfx.tap(); onOpen(c); }} className="relative rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.97]"
      style={{ background: C.bgElevated, border: `1px solid ${c.accent}3A` }}>
      {c.isNew && (
        <div className="absolute top-2 left-2 z-10 text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wide"
          style={{ background: c.accent, color: C.bgDeep }}>NEW</div>
      )}
      <div className="flex items-center justify-center pt-3 pb-1"
        style={{ background: `radial-gradient(75% 60% at 50% 45%, ${c.accent}26, transparent 70%)` }}>
        <CrateArt accent={c.accent} motif={c.motif} size={112} />
      </div>
      <div className="px-3 pb-2.5 pt-1">
        <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{c.name}</div>
        <div className="text-[10px] mb-1.5 truncate" style={{ color: C.textDim }}>{c.tagline}</div>
        <div className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: afford ? C.gold : C.textDim, background: `${C.bgDeep}99`, border: `1px solid ${afford ? C.gold + "55" : C.border}` }}>
          <Coins size={12} />{c.cost}
        </div>
      </div>
    </button>
  );
}

export {
  C, RARITY, rarityForValue, SKIN_CATALOG, WEARS, makeItem,
  sfx, WeaponGlyph, CrateArt, Case3D, ItemBadge, SparkField, ConfettiBurst,
  CATALOG, CASES, weightedPick, fmt,
  xpForCase, levelForXp, levelProgress, levelPrize,
  SUPABASE_URL, SUPABASE_ANON_KEY, BOT_USERNAME, serverSync, battleSync, fetchLeaderboard,
  ADMIN_TELEGRAM_ID, adminSync,
  LogoMark, AppHeader, TopBar, ITEM_W, REEL_LEN, WIN_INDEX, CaseTile,
};
