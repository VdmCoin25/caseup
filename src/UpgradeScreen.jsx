import React, { useState, useEffect, useRef } from "react";
import { Package, TrendingUp, X, Check, Search, SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import { C, sfx, ItemBadge, ConfettiBurst, CATALOG, fmt, TopBar, isSoundOn, setSoundOn, forceRerender } from "./lib.jsx";

let _uid = 200000;
const WHEEL = 212, RING = 26;

function UpgradeWheel({ chance, arrowRef }) {
  const deg = (chance / 100) * 360;
  const half = deg / 2;
  const goldStart = 180 - half, goldEnd = 180 + half;
  const ticks = Array.from({ length: 60 });
  return (
    <div className="relative mx-auto" style={{ width: WHEEL, height: WHEEL }}>
      {ticks.map((_, i) => {
        const angle = i * 6;
        const major = angle % 90 === 0;
        return (
          <div key={i} className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${angle}deg)`, zIndex: 1 }}>
            <div style={{
              position: "absolute", left: "50%", top: 1, transform: "translateX(-50%)",
              width: major ? 2.5 : 1, height: major ? 10 : 5,
              background: major ? C.ember : C.border, borderRadius: 1,
              boxShadow: major ? `0 0 4px ${C.ember}99` : "none",
            }} />
          </div>
        );
      })}
      <div className="absolute rounded-full" style={{
        inset: 22, zIndex: 2,
        background: `conic-gradient(${C.bgInset} 0deg ${goldStart}deg, ${C.gold} ${goldStart}deg ${goldEnd}deg, ${C.bgInset} ${goldEnd}deg 360deg)`,
        boxShadow: `0 0 40px ${C.ember}22`,
      }} />
      <div className="absolute font-extrabold" style={{
        zIndex: 5, top: 4, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, letterSpacing: "0.03em", color: C.text,
        textShadow: "0 1px 2px rgba(0,0,0,.9), 0 0 8px rgba(0,0,0,.7)",
      }}>100%</div>
      <div className="absolute font-extrabold" style={{
        zIndex: 5, left: 2, top: "50%", transform: "translateY(-50%)",
        fontSize: 11, letterSpacing: "0.03em", color: C.text,
        textShadow: "0 1px 2px rgba(0,0,0,.9), 0 0 8px rgba(0,0,0,.7)",
      }}>50%</div>
      <div className="absolute font-extrabold" style={{
        zIndex: 5, right: 2, top: "50%", transform: "translateY(-50%)",
        fontSize: 11, letterSpacing: "0.03em", color: C.text,
        textShadow: "0 1px 2px rgba(0,0,0,.9), 0 0 8px rgba(0,0,0,.7)",
      }}>50%</div>
      <div className="absolute rounded-full flex flex-col items-center justify-center" style={{
        inset: 22 + RING, zIndex: 4,
        background: `radial-gradient(circle at 50% 30%, ${C.bgCard}, ${C.bgDeep})`,
        border: `2px solid ${C.borderSoft}`,
      }}>
        <div className="text-[30px] font-bold leading-none tabular-nums" style={{ color: C.text }}>
          {chance.toFixed(2)}<span className="text-[18px]">%</span>
        </div>
        <div className="text-[10px] mt-1.5 tracking-[0.12em] uppercase" style={{ color: C.textDim }}>шанс успеха</div>
      </div>
      <div ref={arrowRef} className="absolute inset-0" style={{ transform: "rotate(0deg)", zIndex: 6 }}>
        <svg width="26" height="24" viewBox="0 0 26 24"
          style={{ position: "absolute", left: "50%", bottom: -6, transform: "translateX(-50%)", filter: `drop-shadow(0 0 7px ${C.emberHot})` }}>
          <path d="M13 2 23 21H3z" fill={C.bgDeep} />
          <path d="M13 5 20 19H6z" fill={C.emberHot} />
        </svg>
      </div>
    </div>
  );
}

function SlotCard({ item, label, accent, onClear }) {
  if (!item) {
    return (
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-1.5 py-5"
        style={{ background: C.bgInset, border: `1.5px dashed ${C.border}` }}>
        <Package size={18} color={C.textDim} />
        <span className="text-[11px]" style={{ color: C.textDim }}>{label}</span>
      </div>
    );
  }
  return (
    <div className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-2 relative"
      style={{ background: C.bgElevated, border: `1.5px solid ${accent}66` }}>
      {onClear && <button onClick={onClear} className="absolute top-1.5 right-1.5"><X size={13} color={C.textDim} /></button>}
      <ItemBadge item={item} size={46} />
      <div className="text-[10px] text-center leading-tight line-clamp-2" style={{ color: C.text }}>{item.short}</div>
      <div className="text-[12px] font-bold" style={{ color: item.rarity.color }}>{fmt(item.value)}</div>
    </div>
  );
}

const PRESETS = [
  { id: "x2", label: "x2", mult: 2 }, { id: "x5", label: "x5", mult: 5 }, { id: "x10", label: "x10", mult: 10 },
  { id: "p30", label: "30%", chance: 30 }, { id: "p50", label: "50%", chance: 50 }, { id: "p75", label: "75%", chance: 75 },
];

function UpgradeScreen({ inventory, setInventory }) {
  const [stakeId, setStakeId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [tab, setTab] = useState("mine");
  const [phase, setPhase] = useState("idle");
  const [outcome, setOutcome] = useState(null);
  const [lockedStake, setLockedStake] = useState(null);
  const [burst, setBurst] = useState(0);
  const arrowRef = useRef(null);
  const pending = useRef(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const liveStake = inventory.find((i) => i.id === stakeId) || null;
  const stake = phase === "idle" ? liveStake : lockedStake;
  const target = CATALOG.find((i) => i.id === targetId) || null;
  const chance = stake && target ? Math.max(1, Math.min(92, (stake.value / target.value) * 100 * 0.92)) : 0;
  const targets = liveStake ? CATALOG.filter((c) => c.value > liveStake.value * 1.15 && c.value < liveStake.value * 20) : CATALOG;

  const applyPreset = (p) => {
    if (!liveStake) return;
    sfx.tap();
    const want = p.mult ? liveStake.value * p.mult : (liveStake.value * 100 * 0.92) / p.chance;
    const best = targets.reduce((a, b) => (Math.abs(b.value - want) < Math.abs(a.value - want) ? b : a), targets[0]);
    if (best) { setTargetId(best.id); setTab("wanted"); }
  };

  const spin = () => {
    if (!liveStake || !target || phase === "spinning") return;
    setPhase("spinning");
    setLockedStake(liveStake);
    sfx.open();
    const deg = (chance / 100) * 360;
    const half = deg / 2;
    const goldStart = 180 - half, goldEnd = 180 + half;
    const win = Math.random() * 100 <= chance;
    const pad = Math.min(4, deg / 4);
    let stopAngle;
    if (win) stopAngle = goldStart + pad + Math.random() * Math.max(0.1, deg - pad * 2);
    else if (Math.random() < 0.5) stopAngle = pad + Math.random() * Math.max(0.1, goldStart - pad * 2);
    else stopAngle = goldEnd + pad + Math.random() * Math.max(0.1, (360 - goldEnd) - pad * 2);
    pending.current = { win, target };

    setInventory((inv) => inv.filter((i) => i.id !== liveStake.id));

    const el = arrowRef.current;
    const SPIN_MS = 6000;
    if (el) {
      el.style.transition = "none";
      el.style.transform = "rotate(0deg)";
      void el.offsetHeight;
      requestAnimationFrame(() => {
        const relative = (stopAngle - 180 + 360) % 360;
        el.style.transition = `transform ${SPIN_MS / 1000}s cubic-bezier(.65,0,.35,1)`;
        el.style.transform = `rotate(${(5 + ((Math.random() * 2) | 0)) * 360 + relative}deg)`;
      });
    }
    // ticking sound that spaces out over time, like a wheel slowing down
    const TICKS = 30;
    for (let i = 1; i <= TICKS; i++) {
      const p = i / TICKS;
      const at = SPIN_MS * (1 - Math.pow(1 - p, 2));
      timers.current.push(setTimeout(() => sfx.tick(), at));
    }

    timers.current.push(setTimeout(() => {
      const { win: w, target: t } = pending.current;
      if (w) {
        setInventory((inv) => [{ ...t, id: `it-${++_uid}-${Date.now()}` }, ...inv]);
        sfx.win();
        if (t.value >= 900) setBurst((b) => b + 1);
      } else sfx.lose();
      setOutcome({ win: w, target: t });
      setPhase("done");
    }, SPIN_MS + 150));
  };

  const reset = () => {
    setPhase("idle"); setOutcome(null); setStakeId(null); setTargetId(null); setTab("mine"); setLockedStake(null);
    if (arrowRef.current) { arrowRef.current.style.transition = "none"; arrowRef.current.style.transform = "rotate(0deg)"; }
  };

  const [query, setQuery] = useState("");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const rawList = tab === "mine" ? inventory : targets;
  const list = rawList
    .filter((it) => it.short.toLowerCase().includes(query.toLowerCase()))
    .filter((it) => (minP === "" ? true : it.value >= Number(minP)))
    .filter((it) => (maxP === "" ? true : it.value <= Number(maxP)))
    .sort((a, b) => (sortDesc ? b.value - a.value : a.value - b.value));

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2 overflow-y-auto relative">
      <TopBar sub="Апгрейд" title="Рулетка" />

      <div className="relative -mx-4 px-4 pt-1 pb-2 mb-1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position: "absolute", left: "10%", top: "10%", width: 130, height: 130, borderRadius: "50%", background: C.ember, opacity: 0.16, filter: "blur(38px)" }} />
          <div style={{ position: "absolute", right: "8%", bottom: 0, width: 110, height: 110, borderRadius: "50%", background: C.gold, opacity: 0.14, filter: "blur(34px)" }} />
        </div>
        <UpgradeWheel chance={chance} arrowRef={arrowRef} />
        <div className="relative flex items-center justify-center gap-2 mt-3">
          <button onClick={() => { setSoundOn(!isSoundOn()); forceRerender(); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isSoundOn() ? C.bgCard : C.bgElevated, border: `1px solid ${C.border}` }}>
            {isSoundOn() ? <Volume2 size={16} color={C.text} /> : <VolumeX size={16} color={C.textDim} />}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mt-1 mb-3">
        <SlotCard item={stake} label="Ваш предмет" accent={C.ember} onClear={phase === "idle" ? () => setStakeId(null) : null} />
        <div className="flex items-center"><TrendingUp size={16} color={C.textDim} /></div>
        <SlotCard item={target} label="Желаемый" accent={C.gold} onClear={phase === "idle" ? () => setTargetId(null) : null} />
      </div>

      <ConfettiBurst trigger={burst} colors={[C.gold, C.ember, "#fff"]} />

      {phase !== "done" ? (
        <>
          <button onClick={spin} disabled={!stake || !target || phase === "spinning"}
            className="w-full rounded-xl py-4 font-bold tracking-[0.1em] uppercase mb-3 transition-transform active:scale-[0.98]"
            style={{
              background: !stake || !target ? C.bgElevated : `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`,
              color: !stake || !target ? C.textDim : C.bgDeep,
              border: `1px solid ${!stake || !target ? C.border : "transparent"}`,
              boxShadow: !stake || !target ? "none" : `0 6px 20px ${C.ember}44`,
            }}>
            {phase === "spinning" ? "Крутится…" : "Апгрейд"}
          </button>

          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => applyPreset(p)} disabled={!liveStake || phase !== "idle"}
                className="rounded-lg py-2 text-[11px] font-bold"
                style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: liveStake ? C.text : C.textDim, opacity: liveStake && phase === "idle" ? 1 : 0.5 }}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 mb-2.5">
            {[["mine", "Мои предметы"], ["wanted", "Желаемые"]].map(([id, label]) => (
              <button key={id} onClick={() => { sfx.tap(); phase === "idle" && setTab(id); }} disabled={phase !== "idle"}
                className="flex-1 rounded-lg py-2 text-[12px] font-semibold"
                style={{
                  background: tab === id ? C.bgCard : "transparent", border: `1px solid ${tab === id ? C.ember + "66" : C.border}`,
                  color: tab === id ? C.text : C.textDim, opacity: phase === "idle" ? 1 : 0.5,
                }}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mb-2.5">
            <button onClick={() => setSortDesc((v) => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
              <SlidersHorizontal size={13} color={C.textDim} style={{ transform: sortDesc ? "none" : "scaleY(-1)" }} />
            </button>
            <input value={minP} onChange={(e) => setMinP(e.target.value.replace(/\D/g, ""))} placeholder="От" inputMode="numeric"
              className="w-14 rounded-lg px-2 py-1.5 text-[11px] bg-transparent outline-none"
              style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text }} />
            <input value={maxP} onChange={(e) => setMaxP(e.target.value.replace(/\D/g, ""))} placeholder="До" inputMode="numeric"
              className="w-14 rounded-lg px-2 py-1.5 text-[11px] bg-transparent outline-none"
              style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text }} />
            <div className="flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 min-w-0" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
              <Search size={12} color={C.textDim} className="flex-shrink-0" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск"
                className="bg-transparent outline-none text-[11px] w-full" style={{ color: C.text }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pb-2" style={{ opacity: phase === "idle" ? 1 : 0.5, pointerEvents: phase === "idle" ? "auto" : "none" }}>
            {!list.length && (
              <div className="col-span-3 text-center py-8 text-[12px]" style={{ color: C.textDim }}>
                {tab === "mine" ? "Инвентарь пуст — открой кейс" : "Сначала выбери свой предмет"}
              </div>
            )}
            {list.slice(0, 24).map((it) => {
              const sel = tab === "mine" ? stakeId === it.id : targetId === it.id;
              return (
                <button key={it.id} onClick={() => { sfx.tap(); tab === "mine" ? setStakeId(it.id) : setTargetId(it.id); }}
                  className="rounded-xl p-2 flex flex-col items-center gap-1"
                  style={{ background: C.bgElevated, border: `1.5px solid ${sel ? it.rarity.color : C.border}` }}>
                  <ItemBadge item={it} size={34} />
                  <div className="text-[9px] font-bold" style={{ color: it.rarity.color }}>{fmt(it.value)}</div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-2xl p-5 text-center mb-4" style={{ background: C.bgElevated, border: `1px solid ${outcome.win ? C.gold : C.danger}66` }}>
          {outcome.win ? (
            <>
              <Check size={22} color={C.gold} className="mx-auto mb-2" />
              <div className="font-semibold mb-1" style={{ color: C.text }}>Апгрейд удался</div>
              <div className="text-[12px] mb-4" style={{ color: C.gold }}>{outcome.target.short} · {fmt(outcome.target.value)}</div>
            </>
          ) : (
            <>
              <X size={22} color={C.danger} className="mx-auto mb-2" />
              <div className="font-semibold mb-4" style={{ color: C.text }}>Предмет сгорел</div>
            </>
          )}
          <button onClick={reset} className="w-full rounded-xl py-3 font-semibold" style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}` }}>
            Ещё раз
          </button>
        </div>
      )}
    </div>
  );
}
/* ---------------------------------- battle (online only) ---------------------------------- */

export { UpgradeScreen };
