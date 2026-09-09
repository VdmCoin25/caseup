import React, { useState, useEffect, useRef } from "react";
import { Users, Swords, Loader2, Trophy, Check } from "lucide-react";
import { C, sfx, ItemBadge, CrateArt, CASES, fmt, TopBar, battleSync } from "./lib.jsx";

function BattleScreen({ coins, setCoins, addItem, tgUser, initData }) {
  const [pick, setPick] = useState(null);
  const [phase, setPhase] = useState("setup"); // setup | searching | lobby | opening | done
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [myReady, setMyReady] = useState(false);
  const pollRef = useRef(null);
  const openedRef = useRef(false);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startPolling = (roomId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const updated = await battleSync("get", initData, { roomId });
        if (!updated) return;
        setRoom(updated);
        if (updated.status === "matched") setPhase((p) => (p === "searching" ? "lobby" : p));
        if (updated.status === "done") {
          clearInterval(pollRef.current);
          if (!openedRef.current) { openedRef.current = true; setPhase("opening"); }
        }
      } catch {}
    }, 1200);
  };

  const startSearch = async (c) => {
    if (!tgUser || !initData) { setError("Открой это внутри Telegram, чтобы играть онлайн"); return; }
    if (coins < c.cost) { setError("Недостаточно монет"); return; }
    setPick(c); setError(""); setMyReady(false); openedRef.current = false;
    try {
      const r = await battleSync("enter", initData, { caseId: c.id });
      setRoom(r);
      setCoins((v) => v - c.cost);
      setPhase(r.status === "matched" ? "lobby" : "searching");
      startPolling(r.id);
    } catch (e) {
      setError(e.message); setPhase("setup");
    }
  };

  const pressReady = async () => {
    if (!room || myReady) return;
    setMyReady(true);
    sfx.tap();
    try {
      const r = await battleSync("ready", initData, { roomId: room.id });
      setRoom(r);
      if (r.status === "done" && !openedRef.current) {
        openedRef.current = true;
        clearInterval(pollRef.current);
        setPhase("opening");
      }
    } catch (e) {
      setError(e.message);
    }
  };

  // Local "opening" beat: both clients hit this at roughly the same time
  // (the winner was already decided server-side the instant both pressed
  // ready), so this is purely a shared-feeling animation before the reveal.
  // If I won, the server already merged both items into my server-side
  // inventory — mirror that into local state too, otherwise the next
  // periodic save would push my (stale) local inventory back and wipe out
  // the win.
  useEffect(() => {
    if (phase !== "opening") return;
    sfx.open();
    const t = setTimeout(() => {
      const iWon = room?.winner_id === tgUser?.id;
      if (iWon && room?.p1_item && room?.p2_item) {
        addItem(room.p1_id === tgUser?.id ? room.p1_item : room.p2_item);
        addItem(room.p1_id === tgUser?.id ? room.p2_item : room.p1_item);
      }
      iWon ? sfx.win() : sfx.lose();
      setPhase("done");
    }, 1800);
    return () => clearTimeout(t);
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
          <span className="text-[11px]" style={{ color: C.textDim }}>Против живого игрока — оба жмут «Готов» в лобби, кейсы открываются синхронно, победитель забирает оба предмета</span>
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
  const myName = p1Me ? room?.p1_name : room?.p2_name;
  const oppName = p1Me ? room?.p2_name : room?.p1_name;
  const myReadyFlag = p1Me ? room?.p1_ready : room?.p2_ready;
  const oppReadyFlag = p1Me ? room?.p2_ready : room?.p1_ready;
  const myItem = p1Me ? room?.p1_item : room?.p2_item;
  const oppItem = p1Me ? room?.p2_item : room?.p1_item;
  const iWon = (phase === "opening" || phase === "done") && room?.winner_id === tgUser?.id;

  if (phase === "lobby") {
    return (
      <div className="flex flex-col h-full px-4 pt-5 pb-2">
        <TopBar sub={pick?.name} title="Лобби" />
        <div className="flex-1 flex flex-col justify-center gap-3">
          {[["Вы", myName, myReadyFlag || myReady], ["Соперник", oppName, oppReadyFlag]].map(([label, name, ready], i) => (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: C.bgElevated, border: `1.5px solid ${ready ? C.gold : C.border}` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.bgCard, border: `1px solid ${ready ? C.gold : C.border}` }}>
                {ready ? <Check size={18} color={C.gold} /> : <Users size={16} color={C.textDim} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDim }}>{label}</div>
                <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{name || "Игрок"}</div>
              </div>
              <div className="text-[11px] font-semibold flex-shrink-0" style={{ color: ready ? C.gold : C.textDim }}>
                {ready ? "Готов" : "Ждём"}
              </div>
            </div>
          ))}
        </div>
        <button onClick={pressReady} disabled={myReady} className="w-full rounded-xl py-4 font-bold tracking-wide mt-3"
          style={{ background: myReady ? C.bgCard : `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`, color: myReady ? C.gold : C.bgDeep, border: myReady ? `1px solid ${C.gold}55` : "none" }}>
          {myReady ? "Ждём соперника…" : "Готов"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2">
      <TopBar sub={pick?.name} title={phase === "done" ? "Итог" : "Батл идёт"} />
      <div className="flex-1 flex flex-col justify-center gap-3">
        {[{ label: "Вы", name: myName, item: myItem, mine: true }, { label: "Соперник", name: oppName, item: oppItem, mine: false }].map((p, i) => (
          <div key={i} className="rounded-2xl p-4 flex flex-col items-center gap-2"
            style={{ background: C.bgElevated, border: `1.5px solid ${phase === "done" && (p.mine === iWon) ? C.gold : C.border}` }}>
            <div className="text-[12px] font-semibold" style={{ color: p.mine ? C.ember : C.textDim }}>{p.mine ? "Вы" : p.name || "Соперник"}</div>
            {phase === "done" && p.item ? (
              <>
                <ItemBadge item={p.item} size={56} />
                <div className="text-[13px] font-bold" style={{ color: p.item.rarity.color }}>{fmt(p.item.value)}</div>
              </>
            ) : (
              <div className="py-2"><Loader2 size={22} color={C.textDim} className="animate-spin" /></div>
            )}
            {phase === "done" && (p.mine === iWon) && <Trophy size={16} color={C.gold} />}
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

export { BattleScreen };
