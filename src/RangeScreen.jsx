import React, { useState, useEffect, useRef, useCallback } from "react";
import { Crosshair } from "lucide-react";
import { C, sfx, TopBar } from "./lib.jsx";

function RangeScreen({ coins, setCoins }) {
  const [run, setRun] = useState(false);
  const [t, setT] = useState(20);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [tgt, setTgt] = useState(null);
  const spawn = useRef(null), tick = useRef(null), hide = useRef(null);

  const place = useCallback(() => {
    const id = Date.now();
    setTgt({ id, x: 8 + Math.random() * 76, y: 12 + Math.random() * 62, small: Math.random() < 0.3 });
    clearTimeout(hide.current);
    hide.current = setTimeout(() => setTgt((c) => { if (c && c.id === id) { setStreak(0); return null; } return c; }), 800);
  }, []);

  const start = () => {
    setScore(0); setStreak(0); setT(20); setRun(true); place();
    spawn.current = setInterval(place, 880);
    tick.current = setInterval(() => setT((v) => {
      if (v <= 1) { clearInterval(spawn.current); clearInterval(tick.current); clearTimeout(hide.current); setRun(false); setTgt(null); return 0; }
      return v - 1;
    }), 1000);
  };

  useEffect(() => () => { clearInterval(spawn.current); clearInterval(tick.current); clearTimeout(hide.current); }, []);

  const hit = () => {
    if (!tgt) return;
    sfx.tap();
    const bonus = tgt.small ? 30 : 15;
    const mult = 1 + Math.min(streak, 5) * 0.2;
    const gain = Math.round(bonus * mult);
    setScore((s) => s + gain); setCoins((c) => c + gain);
    setStreak((s) => { const n = s + 1; setBest((b) => Math.max(b, n)); return n; });
    setTgt(null); clearTimeout(hide.current);
  };

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2">
      <TopBar sub="Тир" title="Быстрый прицел" />
      <div className="flex gap-2 mb-3">
        {[["Время", `${t}с`, run ? C.ember : C.text], ["Серия", `x${(1 + Math.min(streak, 5) * 0.2).toFixed(1)}`, C.gold], ["Лучшая", best, C.text]].map(([l, v, col]) => (
          <div key={l} className="flex-1 rounded-xl py-2 text-center" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textDim }}>{l}</div>
            <div className="text-[15px] font-bold tabular-nums" style={{ color: col }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="relative flex-1 rounded-2xl overflow-hidden mb-3" style={{ background: "radial-gradient(circle at 50% 35%, #33230F, #120C08)", border: `1px solid ${C.border}` }}>
        {!run && t === 20 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Crosshair size={28} color={C.textDim} />
            <div className="text-[12px] text-center px-8" style={{ color: C.textDim }}>Мелкие цели дороже. Серия без промахов увеличивает множитель</div>
          </div>
        )}
        {!run && t === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="text-[11px]" style={{ color: C.textDim }}>Раунд окончен</div>
            <div className="text-3xl font-bold" style={{ color: C.text }}>+{score}</div>
            <div className="text-[12px]" style={{ color: C.gold }}>серия {best}</div>
          </div>
        )}
        {tgt && (
          <button onClick={hit} className="absolute rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{
              left: `${tgt.x}%`, top: `${tgt.y}%`, width: tgt.small ? 34 : 52, height: tgt.small ? 34 : 52,
              background: `radial-gradient(circle, ${tgt.small ? C.gold : C.danger} 0%, #5C1F14 72%)`, boxShadow: `0 0 18px ${tgt.small ? C.gold : C.danger}99`,
            }}>
            <div className="rounded-full bg-white" style={{ width: tgt.small ? 8 : 12, height: tgt.small ? 8 : 12 }} />
          </button>
        )}
      </div>
      <button onClick={start} disabled={run} className="w-full rounded-xl py-4 font-bold"
        style={{ background: `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`, color: C.bgDeep, opacity: run ? 0.5 : 1 }}>
        {run ? "Идёт раунд…" : t === 0 ? "Ещё раз" : "Начать"}
      </button>
    </div>
  );
}

/* ---------------------------------- inventory ---------------------------------- */

export { RangeScreen };
