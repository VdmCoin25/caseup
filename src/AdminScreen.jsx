import React, { useState, useEffect } from "react";
import { Search, Coins, ShieldCheck, RefreshCw } from "lucide-react";
import { C, fmt, TopBar, adminSync } from "./lib.jsx";

function AdminScreen({ initData }) {
  const [players, setPlayers] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("grant"); // grant | set
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    setErr(""); setPlayers(null);
    adminSync("list", initData, {}).then((r) => setPlayers(r.players)).catch((e) => setErr(e.message));
  };
  useEffect(load, []);

  const filtered = (players || []).filter((p) => {
    const s = q.toLowerCase();
    return !s || String(p.telegram_id).includes(s) || (p.first_name || "").toLowerCase().includes(s) || (p.username || "").toLowerCase().includes(s);
  });

  const submit = async () => {
    const id = Number(targetId);
    const amt = Number(amount);
    if (!id || !Number.isFinite(amt)) { setMsg("Заполни ID и сумму"); return; }
    setBusy(true); setMsg("");
    try {
      await adminSync(mode, initData, { targetId: id, amount: amt });
      setMsg(`Готово: игроку ${id} ${mode === "set" ? "выставлен баланс" : "начислено"} ${amt}`);
      setAmount("");
      load();
    } catch (e) {
      setMsg("Ошибка: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const pick = (p) => { setTargetId(String(p.telegram_id)); setMsg(""); };

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2 overflow-y-auto">
      <TopBar sub="Только для тебя" title="Админ-панель" />

      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ background: `${C.gold}1A`, border: `1px solid ${C.gold}44` }}>
        <ShieldCheck size={15} color={C.gold} />
        <span className="text-[11px]" style={{ color: C.gold }}>Доступ проверяется на сервере по твоему Telegram ID — у остальных этот экран не откроется, даже если найдут в коде</span>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
        <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: C.textDim }}>Выдать / установить баланс</div>
        <div className="flex gap-2 mb-2">
          <input value={targetId} onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ""))} placeholder="Telegram ID игрока" inputMode="numeric"
            className="flex-1 rounded-lg px-3 py-2.5 text-[13px] bg-transparent outline-none"
            style={{ background: C.bgInset, border: `1px solid ${C.border}`, color: C.text }} />
        </div>
        <div className="flex gap-2 mb-2">
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))} placeholder="Сумма" inputMode="numeric"
            className="flex-1 rounded-lg px-3 py-2.5 text-[13px] bg-transparent outline-none"
            style={{ background: C.bgInset, border: `1px solid ${C.border}`, color: C.text }} />
          <button onClick={() => setMode("grant")} className="rounded-lg px-3 text-[12px] font-semibold"
            style={{ background: mode === "grant" ? C.ember : C.bgInset, color: mode === "grant" ? C.bgDeep : C.textDim, border: `1px solid ${mode === "grant" ? C.ember : C.border}` }}>
            +/-
          </button>
          <button onClick={() => setMode("set")} className="rounded-lg px-3 text-[12px] font-semibold"
            style={{ background: mode === "set" ? C.ember : C.bgInset, color: mode === "set" ? C.bgDeep : C.textDim, border: `1px solid ${mode === "set" ? C.ember : C.border}` }}>
            =
          </button>
        </div>
        <div className="text-[10px] mb-3" style={{ color: C.textDim }}>
          {mode === "grant" ? "«+/-» прибавляет (или отнимает, если со знаком минус) к текущему балансу" : "«=» выставляет баланс ровно в указанное число"}
        </div>
        <button onClick={submit} disabled={busy} className="w-full rounded-xl py-3 font-bold"
          style={{ background: `linear-gradient(180deg, ${C.emberHot}, ${C.ember})`, color: C.bgDeep, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Отправляю…" : "Применить"}
        </button>
        {msg && <div className="text-[11px] mt-2" style={{ color: msg.startsWith("Ошибка") ? C.danger : C.gold }}>{msg}</div>}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-1.5 rounded-lg px-3 py-2" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
          <Search size={13} color={C.textDim} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: ID, имя, @username"
            className="bg-transparent outline-none text-[12px] w-full" style={{ color: C.text }} />
        </div>
        <button onClick={load} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
          <RefreshCw size={14} color={C.textDim} />
        </button>
      </div>

      {err && <div className="text-[12px] px-3 py-2 rounded-lg mb-3" style={{ background: `${C.danger}22`, color: C.danger, border: `1px solid ${C.danger}55` }}>{err}</div>}
      {!players && !err && <div className="text-center py-8 text-[12px]" style={{ color: C.textDim }}>Загрузка…</div>}

      <div className="space-y-1.5 pb-4">
        {filtered.map((p) => (
          <button key={p.telegram_id} onClick={() => pick(p)} className="w-full text-left rounded-xl p-2.5 flex items-center gap-3"
            style={{ background: C.bgElevated, border: `1px solid ${targetId === String(p.telegram_id) ? C.ember : C.border}` }}>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate" style={{ color: C.text }}>{p.first_name || "Игрок"}{p.username ? ` · @${p.username}` : ""}</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>ID: {p.telegram_id} · кейсов: {p.opened_count ?? 0} · друзей: {p.referral_count ?? 0}</div>
            </div>
            <div className="flex items-center gap-1 text-[13px] font-bold flex-shrink-0" style={{ color: C.gold }}>
              <Coins size={12} />{fmt(p.coins)}
            </div>
          </button>
        ))}
        {players && !filtered.length && <div className="text-center py-8 text-[12px]" style={{ color: C.textDim }}>Ничего не найдено</div>}
      </div>
    </div>
  );
}

export { AdminScreen };
