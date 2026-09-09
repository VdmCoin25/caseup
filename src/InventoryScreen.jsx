import React, { useState, useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { C, sfx, ItemBadge, fmt, TopBar } from "./lib.jsx";

function InventoryScreen({ inventory, setInventory, setCoins, coins }) {
  const [sort, setSort] = useState("value");
  const [confirmAll, setConfirmAll] = useState(false);
  const confirmTimer = useRef(null);
  const SELL_RATE = 1;

  const sell = (it) => { setCoins((c) => c + Math.round(it.value * SELL_RATE)); setInventory((inv) => inv.filter((x) => x.id !== it.id)); sfx.tap(); };
  const sellAllClick = () => {
    if (!confirmAll) {
      setConfirmAll(true); clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmAll(false), 3000);
      return;
    }
    clearTimeout(confirmTimer.current); setConfirmAll(false);
    const sum = inventory.reduce((s, i) => s + Math.round(i.value * SELL_RATE), 0);
    setCoins((c) => c + sum); setInventory([]); sfx.win();
  };
  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const list = [...inventory].sort((a, b) => (sort === "value" ? b.value - a.value : a.short.localeCompare(b.short)));
  const total = inventory.reduce((s, i) => s + i.value, 0);

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2">
      <TopBar sub="Инвентарь" title={`${inventory.length} предметов`} />
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 rounded-xl px-3 py-2" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textDim }}>Оценка</div>
          <div className="text-[15px] font-bold" style={{ color: C.gold }}>{fmt(total)}</div>
        </div>
        <button onClick={() => setSort((s) => (s === "value" ? "name" : "value"))} className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
          <SlidersHorizontal size={15} color={C.textDim} />
        </button>
        <button onClick={sellAllClick} disabled={!inventory.length} className="rounded-xl px-3 h-11 text-[12px] font-semibold transition-colors"
          style={{ background: confirmAll ? C.danger : C.bgElevated, border: `1px solid ${confirmAll ? C.danger : C.border}`, color: confirmAll ? C.text : C.gold, opacity: inventory.length ? 1 : 0.4 }}>
          {confirmAll ? "Точно всё?" : "Продать всё"}
        </button>
      </div>
      <div className="text-[10px] mb-3 -mt-1.5" style={{ color: C.textDim }}>Продажа возвращает 100% стоимости предмета</div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {!list.length && <div className="text-center py-16 text-[13px]" style={{ color: C.textDim }}>Пусто — открой кейс, чтобы получить первый предмет</div>}
        {list.map((it) => (
          <div key={it.id} className="rounded-2xl p-2.5 flex items-center gap-3"
            style={{ background: C.bgElevated, border: `1px solid ${it.rarity.color}3A`, boxShadow: `inset 3px 0 0 ${it.rarity.color}` }}>
            <ItemBadge item={it} size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate" style={{ color: C.text }}>{it.name}</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>{it.wear}</div>
              <div className="text-[11px] font-bold" style={{ color: it.rarity.color }}>{fmt(it.value)}</div>
            </div>
            <button onClick={() => sell(it)} className="rounded-lg px-3 py-2 text-[11px] font-semibold flex-shrink-0" style={{ background: C.bgCard, color: C.gold, border: `1px solid ${C.border}` }}>
              {fmt(Math.round(it.value * SELL_RATE))}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- profile / leaderboard / referral ---------------------------------- */

export { InventoryScreen };
