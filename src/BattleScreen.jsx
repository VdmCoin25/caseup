import React, { useState, useEffect, useRef } from "react";
import { Users, Swords, Loader2, Trophy, X } from "lucide-react";
import { C, sfx, ItemBadge, CrateArt, CASES, fmt, TopBar, battleSync } from "./lib.jsx";

function BattleScreen({ coins, setCoins, setInventory, tgUser, initData }) {
  const [pick, setPick] = useState(null);
  const [phase, setPhase] = useState("setup"); // setup | searching | live | done
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const pollRef = useRef(null);
  const revealedRef = useRef(false);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startSearch = async (c) => {
    if (!tgUser || !initData) { setError("Открой это внутри Telegram, чтобы играть онлайн"); return; }
    if (coins < c.cost) { setError("Недостаточно монет"); return; }
    setPick(c); setError(""); setPhase("searching"); revealedRef.current = false;
    try {
      const r = await battleSync("enter", initData, { caseId: c.id });
      setRoom(r);
      setCoins((v) => v - c.cost);
      if (r.status === "ready") setPhase("live");
      pollRef.current = setInterval(async () => {
        try {
          const updated = await battleSync("get", initData, { roomId: r.id });
          if (!updated) return;
          setRoom(updated);
          if (updated.status === "ready" && phase !== "live") setPhase("live");
          if (updated.status === "done") { clearInterval(pollRef.current); setPhase("done"); }
        } catch {}
      }, 1500);
    } catch (e) {
      setError(e.message); setPhase("setup");
    }
  };

  useEffect(() => {
    if (phase === "live" && room && !revealedRef.current) {
      revealedRef.current = true;
      sfx.open();
      battleSync("reveal", initData, { roomId: room.id, caseId: pick.id }).then((r) => {
        setRoom(r);
        if (r.status === "done") { clearInterval(pollRef.current); setPhase("done"); }
      }).catch((e) => setError(e.message));
    }
  }, [phase, room?.id]);

  useEffect(() => {
    if (phase === "done" && room) {
      const iWon = room.winner_id === tgUser?.id;
      iWon ? sfx.win() : sfx.lose();
    }
  }, [phase]);

  const cancel = async () => {
    clearInterval(pollRef.current);
    if (room?.status === "waiting") {
      try { await battleSync("cancel", initData, { roomId: room.id, caseId: pick.id }); setCoins((v) => v + pick.cost); } catch {}
    }
    setPhase("setup"); setRoom(null); setPick(null);
  };

  if (phase === "setup") {
    return (
      <div className="flex flex-col h-full px-4 pt-5 pb-2 overflow-y-auto">
        <TopBar sub="Кейсбатл · Онлайн" title="Забирает победитель" />
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
          <Users size={14} color={C.textDim} />
          <span className="text-[11px]" style={{ color: C.textDim }}>Против живого игрока — оба открывают один кейс, кому больше выпало — забирает оба предмета</span>
        </div>
        {error && <div className="text-[12px] mb-3 px-3 py-2 rounded-lg" style={{ background: `${C.danger}22`, color: C.danger, border: `1px solid ${C.danger}55` }}>{error}</div>}
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {CASES.map((c) => (
            <button key={c.id} onClick={() => startSearch(c)} disabled={coins < c.cost}
              className="rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.97]"
              style={{ background: C.bgElevated, border: `1px solid ${c.accent}3A`, opacity: coins < c.cost ? 0.45 : 1 }}>
              <div className="flex items-center justify-center pt-3 pb-1" style={{ background: `radial-gradient(75% 60% at 50% 45%, ${c.accent}26, transparent 70%)` }}>
                <CrateArt accent={c.accent} motif={c.motif} size={92} />
              </div>
              <div className="px-3 pb-2.5 pt-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: C.text }}>{c.name}</div>
                <div className="flex items-center gap-1 text-[12px] font-bold mt-1" style={{ color: C.gold }}><Swords size={11} />{c.cost}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "searching") {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center">
        <Loader2 size={30} color={C.ember} className="animate-spin mb-4" />
        <div className="font-semibold mb-1" style={{ color: C.text }}>Ищем соперника…</div>
        <div className="text-[12px] mb-6" style={{ color: C.textDim }}>{pick?.name} · ставка {pick?.cost}</div>
        <button onClick={cancel} className="rounded-xl px-5 py-2.5 text-[13px] font-semibold" style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}` }}>
          Отменить
        </button>
      </div>
    );
  }

  const p1Me = room?.p1_id === tgUser?.id;
  const me = p1Me ? { name: room.p1_name, item: room.p1_item } : { name: room.p2_name, item: room.p2_item };
  const opp = p1Me ? { name: room.p2_name, item: room.p2_item } : { name: room.p1_name, item: room.p1_item };
  const iWon = phase === "done" && room?.winner_id === tgUser?.id;

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2">
      <TopBar sub={pick?.name} title={phase === "done" ? "Итог" : "Батл идёт"} />
      <div className="flex-1 flex flex-col justify-center gap-3">
        {[me, opp].map((p, i) => (
          <div key={i} className="rounded-2xl p-4 flex flex-col items-center gap-2"
            style={{ background: C.bgElevated, border: `1.5px solid ${phase === "done" && ((i === 0) === iWon) ? C.gold : C.border}` }}>
            <div className="text-[12px] font-semibold" style={{ color: i === 0 ? C.ember : C.textDim }}>{i === 0 ? "Вы" : p.name || "Соперник"}</div>
            {p.item ? (
              <>
                <ItemBadge item={p.item} size={56} />
                <div className="text-[13px] font-bold" style={{ color: p.item.rarity.color }}>{fmt(p.item.value)}</div>
              </>
            ) : (
              <Loader2 size={22} color={C.textDim} className="animate-spin my-2" />
            )}
            {phase === "done" && (i === 0) === iWon && <Trophy size={16} color={C.gold} />}
          </div>
        ))}
      </div>
      {phase === "done" && (
        <div className="rounded-2xl p-4 text-center mt-3" style={{ background: C.bgElevated, border: `1px solid ${iWon ? C.gold : C.danger}66` }}>
          <div className="font-semibold mb-3" style={{ color: C.text }}>{iWon ? "Победа — забираешь оба предмета" : "Соперник забрал банк"}</div>
          <button onClick={() => { setPhase("setup"); setRoom(null); setPick(null); }} className="w-full rounded-xl py-3 font-semibold"
            style={{ background: `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`, color: C.bgDeep }}>
            Продолжить
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- range ---------------------------------- */

export { BattleScreen };
