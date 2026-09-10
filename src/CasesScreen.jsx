import React, { useState, useEffect, useRef, useMemo } from "react";
import { Coins, Search, Zap } from "lucide-react";
import { C, RARITY, sfx, ItemBadge, Case3D, ConfettiBurst, CASES, weightedPick, makeItem, fmt, TopBar, ITEM_W, REEL_LEN, WIN_INDEX, CaseTile } from "./lib.jsx";

function CasesScreen({ coins, setCoins, addItem, removeItem, onDrop }) {
  const [active, setActive] = useState(null);
  const [q, setQ] = useState("");
  const [qty, setQty] = useState(1);
  const [phase, setPhase] = useState("idle");
  const [reel, setReel] = useState([]);
  const [won, setWon] = useState(null);
  const [multiWon, setMultiWon] = useState([]);
  const [revealed, setRevealed] = useState(0);
  const [soldIds, setSoldIds] = useState(() => new Set());
  const [fast, setFast] = useState(false);
  const [burst, setBurst] = useState(0);
  const trackRef = useRef(null);
  const timers = useRef([]);
  const rafRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => () => { timers.current.forEach(clearTimeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const totalCost = active ? active.cost * qty : 0;
  const rollOne = () => makeItem(weightedPick(active.pool).seed);

  const openSingle = () => {
    setCoins((c) => c - active.cost);
    sfx.open();
    const winItem = rollOne();
    const items = Array.from({ length: REEL_LEN }, (_, i) => (i === WIN_INDEX ? winItem : rollOne()));
    setReel(items); setWon(winItem); setPhase("spinning");

    const durMs = (fast ? 1.4 : 6.4) * 1000;
    const el = trackRef.current;
    const jitter = (Math.random() - 0.5) * (ITEM_W - 58);
    const target = -(WIN_INDEX * ITEM_W + ITEM_W / 2) + jitter;
    const startTime = performance.now();
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / durMs);
      if (el) el.style.transform = `translateX(calc(50% + ${target * easeOutQuart(t)}px))`;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        busyRef.current = false;
        setPhase("result");
        if (winItem.rarity.min >= 900) { sfx.win(); setBurst((b) => b + 1); } else sfx.tap();
        addItem(winItem);
        onDrop && onDrop(winItem, active);
      }
    };
    if (el) el.style.transform = "translateX(calc(50% + 0px))";
    rafRef.current = requestAnimationFrame(step);
  };

  const openMulti = () => {
    setCoins((c) => c - totalCost);
    setPhase("burst");
    sfx.open();
    const dur = fast ? 500 : 1500;
    timers.current.push(setTimeout(() => {
      busyRef.current = false;
      const wonItems = Array.from({ length: qty }, () => rollOne());
      setMultiWon(wonItems);
      setSoldIds(new Set());
      setRevealed(0);
      setPhase("multiResult");
      wonItems.forEach((it, i) => {
        timers.current.push(setTimeout(() => setRevealed((r) => r + 1), 260 * (i + 1)));
        addItem(it);
        onDrop && onDrop(it, active);
      });
      if (wonItems.some((it) => it.rarity.min >= 900)) setBurst((b) => b + 1);
    }, dur));
  };

  const open = () => {
    if (busyRef.current) return;
    if (!active || coins < totalCost || phase === "spinning" || phase === "burst") return;
    busyRef.current = true;
    qty === 1 ? openSingle() : openMulti();
  };

  const keepOne = () => { sfx.tap(); setPhase("idle"); };
  const sellOne = () => {
    setCoins((c) => c + won.value);
    removeItem(won.id);
    sfx.tap();
    setPhase("idle");
  };
  const sellMultiItem = (it) => {
    setCoins((c) => c + it.value);
    removeItem(it.id);
    sfx.tap();
    setSoldIds((s) => new Set(s).add(it.id));
  };
  const keepRestMulti = () => { sfx.tap(); closeMulti(); };
  const sellRestMulti = () => {
    const rest = multiWon.filter((it) => !soldIds.has(it.id));
    const sum = rest.reduce((s, it) => s + it.value, 0);
    setCoins((c) => c + sum);
    rest.forEach((it) => removeItem(it.id));
    sfx.win();
    closeMulti();
  };
  const closeMulti = () => { setPhase("idle"); setMultiWon([]); setSoldIds(new Set()); setQty(1); };

  const filtered = CASES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const multiTotal = multiWon.reduce((s, it) => s + it.value, 0);

  const previewItems = useMemo(() => {
    if (!active) return [];
    return [...active.pool]
      .sort((a, b) => a.seed - b.seed)
      .flatMap((tier, i) => [
        makeItem(tier.seed, `preview-${active.id}-${i}a`),
        makeItem(tier.seed, `preview-${active.id}-${i}b`),
      ]);
  }, [active?.id]);
  const multiRemaining = multiWon.filter((it) => !soldIds.has(it.id));

  if (!active) {
    return (
      <div className="flex flex-col h-full px-4 pt-5 pb-2 overflow-y-auto">
        <TopBar sub="Витрина" title="Кейсы" />
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3.5"
          style={{ background: C.bgInset, border: `1px solid ${C.border}` }}>
          <Search size={15} color={C.textDim} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск кейса"
            className="bg-transparent outline-none text-[13px] w-full" style={{ color: C.text }} />
        </div>
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {filtered.map((c) => <CaseTile key={c.id} c={c} coins={coins} onOpen={(cc) => { setActive(cc); setQty(1); }} />)}
          {!filtered.length && (
            <div className="col-span-2 text-center py-12 text-[13px]" style={{ color: C.textDim }}>Ничего не найдено</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2 relative overflow-y-auto">
      <TopBar sub="Кейс" title={active.name} onBack={() => phase === "idle" && setActive(null)} />

      <div className="flex flex-col items-center justify-center mb-1 relative" style={{ minHeight: 220, zIndex: 0, isolation: "isolate", overflow: "hidden" }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(55% 75% at 50% 45%, ${active.accent}22, transparent 72%)` }} />
        <div className="absolute" style={{
          width: 220, height: 220, borderRadius: "50%",
          background: `conic-gradient(from 0deg, transparent 0deg, ${active.accent}55 60deg, transparent 140deg, transparent 220deg, ${active.accent}33 300deg, transparent 360deg)`,
          animation: "wheelGlow 7s linear infinite", filter: "blur(2px)",
        }} />
        <div className="absolute rounded-full" style={{
          width: 236, height: 236, border: `1px solid ${active.accent}33`,
          boxShadow: `inset 0 0 30px ${active.accent}22`,
        }} />
        <div style={{ animation: phase === "burst" ? "crateBurst 1s ease-in-out infinite" : "none" }}>
          <Case3D accent={active.accent} size={190} />
        </div>
        <style>{`
          @keyframes crateBurst{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
          @keyframes wheelGlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        `}</style>
        <div className="relative -mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[13px]"
          style={{ background: C.bgElevated, border: `1px solid ${active.accent}66`, color: C.gold, boxShadow: `0 4px 16px ${active.accent}33` }}>
          <Coins size={13} /> {active.cost} за кейс
        </div>
      </div>

      {qty === 1 ? (
        <div className="relative rounded-2xl overflow-hidden mb-4 mt-3"
          style={{ height: 104, background: C.bgInset, border: `1px solid ${C.border}`, position: "relative", zIndex: 5 }}>
          <div className="absolute left-1/2 top-0 bottom-0 z-20"
            style={{ width: 2, background: C.ember, transform: "translateX(-50%)", boxShadow: `0 0 12px ${C.ember}` }} />
          <div className="absolute left-1/2 top-0 z-20"
            style={{ transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `9px solid ${C.ember}` }} />
          <div className="absolute inset-y-0 left-0 z-10 w-10" style={{ background: `linear-gradient(90deg, ${C.bgInset}, transparent)` }} />
          <div className="absolute inset-y-0 right-0 z-10 w-10" style={{ background: `linear-gradient(270deg, ${C.bgInset}, transparent)` }} />
          <div ref={trackRef} className="flex h-full items-center" style={{ transform: "translateX(calc(50% + 0px))" }}>
            {reel.map((it, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl mx-1"
                style={{ width: ITEM_W - 8, height: 86, background: C.bgCard, border: `1.5px solid ${it.rarity.color}77`, boxShadow: `inset 0 -3px 0 ${it.rarity.color}` }}>
                <ItemBadge item={it} size={40} />
                <div className="text-[9px] font-bold mt-1.5" style={{ color: it.rarity.color }}>{fmt(it.value)}</div>
              </div>
            ))}
            {!reel.length && <div className="text-[12px] px-6" style={{ color: C.textDim }}>Нажми «Открыть», чтобы запустить</div>}
          </div>
        </div>
      ) : (
        <div className="text-center text-[12px] mb-4 mt-3" style={{ color: C.textDim }}>
          {phase === "burst" ? "Вскрываем…" : `Откроется сразу ${qty} кейсов`}
        </div>
      )}

      <div className="text-[10px] tracking-[0.14em] uppercase mb-1.5" style={{ color: C.textDim }}>Количество</div>
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} disabled={phase !== "idle"} onClick={() => { sfx.tap(); setQty(n); }}
            className="rounded-lg py-2 text-[13px] font-bold"
            style={{
              background: qty === n ? C.ember : C.bgElevated, border: `1px solid ${qty === n ? C.ember : C.border}`,
              color: qty === n ? C.bgDeep : C.text, opacity: phase === "idle" ? 1 : 0.5,
            }}>
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={() => setFast((f) => !f)} disabled={phase !== "idle"}
          className="w-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: fast ? C.ember : C.bgElevated, border: `1px solid ${fast ? C.ember : C.border}`, opacity: phase === "idle" ? 1 : 0.6 }}>
          <Zap size={16} color={fast ? C.bgDeep : C.textDim} />
        </button>
        <button onClick={open} disabled={coins < totalCost || phase !== "idle"}
          className="flex-1 rounded-xl py-4 font-bold tracking-wide transition-transform active:scale-[0.98]"
          style={{
            background: `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`, color: C.bgDeep,
            opacity: coins < totalCost || phase !== "idle" ? 0.4 : 1, boxShadow: `0 6px 20px ${C.ember}44`,
          }}>
          {phase === "spinning" || phase === "burst" ? "Открывается…" : `Открыть за ${totalCost}`}
        </button>
      </div>

      <div className="text-[10px] tracking-[0.14em] uppercase mb-1.5" style={{ color: C.textDim }}>Что может выпасть</div>
      <div className="grid grid-cols-3 gap-2 pb-4">
        {previewItems.map((it, i) => (
          <div key={i} className="rounded-xl p-2 flex flex-col items-center gap-1"
            style={{ background: C.bgElevated, border: `1px solid ${it.rarity.color}33` }}>
            <ItemBadge item={it} size={36} />
            <div className="text-[9px] text-center leading-tight truncate w-full" style={{ color: C.textDim }}>{it.short}</div>
            <div className="text-[10px] font-bold" style={{ color: it.rarity.color }}>{fmt(it.value)}</div>
          </div>
        ))}
      </div>

      <ConfettiBurst trigger={burst} colors={[C.ember, C.gold, "#fff", "#D14E2C"]} />

      {phase === "result" && won && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(10,7,5,.9)" }}>
          <div className="w-full max-w-sm rounded-3xl p-6 text-center relative"
            style={{ background: C.bgElevated, border: `1px solid ${won.rarity.color}66`, boxShadow: `0 0 60px ${won.rarity.color}33` }}>
            <div className="text-[10px] mb-4 tracking-[0.18em] uppercase" style={{ color: won.rarity.color }}>{won.rarity.label}</div>
            <div className="flex justify-center mb-4"><ItemBadge item={won} size={92} /></div>
            <div className="font-semibold mb-1 text-[15px]" style={{ color: C.text }}>{won.name}</div>
            <div className="text-[11px] mb-2" style={{ color: C.textDim }}>{won.wear}</div>
            <div className="text-[15px] font-bold mb-2" style={{ color: C.gold }}>{fmt(won.value)}</div>
            <div className="text-[10px] mb-4" style={{ color: C.textDim }}>Предмет уже сохранён в инвентаре</div>
            <div className="flex gap-2">
              <button onClick={keepOne} className="flex-1 rounded-xl py-3.5 font-semibold"
                style={{ background: `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`, color: C.bgDeep }}>
                Оставить
              </button>
              <button onClick={sellOne} className="flex-1 rounded-xl py-3.5 font-semibold"
                style={{ background: C.bgCard, color: C.gold, border: `1px solid ${C.gold}55` }}>
                Продать за {fmt(won.value)}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "multiResult" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center px-4" style={{ background: "rgba(10,7,5,.94)" }}>
          <div className="text-center mb-3">
            <div className="text-[10px] tracking-[0.18em] uppercase mb-1" style={{ color: C.textDim }}>Открыто {multiWon.length} кейсов</div>
            <div className="text-[20px] font-bold" style={{ color: C.gold }}>{fmt(multiTotal)}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4 overflow-y-auto" style={{ maxHeight: 300 }}>
            {multiWon.map((it, i) => {
              const on = i < revealed;
              const sold = soldIds.has(it.id);
              return (
                <div key={it.id} className="rounded-xl p-2 flex flex-col items-center gap-1 transition-all duration-300"
                  style={{ background: C.bgElevated, border: `1.5px solid ${it.rarity.color}55`, opacity: on ? (sold ? 0.4 : 1) : 0 }}>
                  <ItemBadge item={it} size={38} />
                  <div className="text-[9px] font-bold" style={{ color: it.rarity.color }}>{fmt(it.value)}</div>
                  {!sold ? (
                    <button onClick={() => sellMultiItem(it)} className="text-[9px] font-semibold rounded-md px-1.5 py-0.5"
                      style={{ background: C.bgCard, color: C.gold, border: `1px solid ${C.border}` }}>Продать</button>
                  ) : (
                    <div className="text-[9px]" style={{ color: C.textDim }}>продано</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={keepRestMulti} className="flex-1 rounded-xl py-3.5 font-semibold text-[13px]"
              style={{ background: `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`, color: C.bgDeep }}>
              Оставить ({multiRemaining.length})
            </button>
            <button onClick={sellRestMulti} disabled={!multiRemaining.length} className="flex-1 rounded-xl py-3.5 font-semibold text-[13px]"
              style={{ background: C.bgCard, color: C.gold, border: `1px solid ${C.gold}55`, opacity: multiRemaining.length ? 1 : 0.4 }}>
              Продать остальное
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { CasesScreen };
