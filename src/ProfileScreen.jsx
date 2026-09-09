import React, { useState, useEffect } from "react";
import { User, Gift, Copy } from "lucide-react";
import { C, ItemBadge, fmt, TopBar, BOT_USERNAME, fetchLeaderboard } from "./lib.jsx";

function timeAgo(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}с назад`;
  const m = Math.round(s / 60); if (m < 60) return `${m}м назад`;
  const h = Math.round(m / 60); if (h < 24) return `${h}ч назад`;
  return `${Math.round(h / 24)}д назад`;
}

function ProfileScreen({ coins, history, spent, opened, tgUser, referralCount }) {
  const [view, setView] = useState("me"); // me | top
  const [board, setBoard] = useState(null);
  const [boardErr, setBoardErr] = useState("");
  const [copied, setCopied] = useState(false);
  const best = history.reduce((a, b) => (!a || b.item.value > a.item.value ? b : a), null);

  useEffect(() => {
    if (view !== "top" || board) return;
    fetchLeaderboard().then(setBoard).catch((e) => setBoardErr(e.message));
  }, [view]);

  const botConfigured = BOT_USERNAME !== "your_bot_username" && !!BOT_USERNAME;
  const inviteLink = tgUser && botConfigured ? `https://t.me/${BOT_USERNAME}?start=${tgUser.id}` : "";
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="flex flex-col h-full px-4 pt-5 pb-2">
      <TopBar sub="Профиль" title="Личный кабинет" />

      <div className="flex gap-1.5 mb-3">
        {[["me", "Я"], ["top", "Топ игроков"]].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} className="flex-1 rounded-lg py-2 text-[12px] font-semibold"
            style={{ background: view === id ? C.bgCard : "transparent", border: `1px solid ${view === id ? C.ember + "66" : C.border}`, color: view === id ? C.text : C.textDim }}>
            {label}
          </button>
        ))}
      </div>

      {view === "me" ? (
        <div className="flex-1 overflow-y-auto">
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.bgCard, border: `1px solid ${C.gold}55` }}>
              <User size={17} color={C.gold} />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{tgUser ? tgUser.first_name : "Гость"}</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>{tgUser ? `Telegram ID: ${tgUser.id}` : "Открой это в Telegram, чтобы связать аккаунт"}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[["Кейсов открыто", opened], ["Потрачено", fmt(spent)], ["Друзей приглашено", referralCount]].map(([l, v]) => (
              <div key={l} className="rounded-xl py-2.5 px-1.5 text-center" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
                <div className="text-[15px] font-bold tabular-nums" style={{ color: C.text }}>{v}</div>
                <div className="text-[9px] mt-0.5" style={{ color: C.textDim }}>{l}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{ background: C.bgElevated, border: `1px solid ${C.gold}44` }}>
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} color={C.gold} />
              <div className="text-[13px] font-semibold" style={{ color: C.text }}>Пригласи друга — получи 100 монет</div>
            </div>
            <div className="text-[11px] mb-3" style={{ color: C.textDim }}>Друг тоже получит 100 монет при первом входе по твоей ссылке</div>
            {!botConfigured ? (
              <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: `${C.danger}22`, color: C.danger, border: `1px solid ${C.danger}55` }}>
                Реферальная ссылка ещё не настроена — в коде нужно указать BOT_USERNAME (реальный @username бота из BotFather)
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg px-3 py-2 text-[11px] truncate" style={{ background: C.bgInset, color: C.textDim, border: `1px solid ${C.border}` }}>
                  {tgUser ? inviteLink : "Доступно внутри Telegram"}
                </div>
                <button onClick={copyLink} disabled={!tgUser} className="rounded-lg px-3 flex items-center gap-1.5 text-[12px] font-semibold flex-shrink-0"
                  style={{ background: C.ember, color: C.bgDeep, opacity: tgUser ? 1 : 0.5 }}>
                  <Copy size={13} /> {copied ? "Скопировано" : "Копировать"}
                </button>
              </div>
            )}
          </div>

          <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: C.textDim }}>Лучший дроп за всё время</div>
          {best ? (
            <div className="rounded-2xl p-4 mb-4 flex items-center gap-3.5" style={{ background: C.bgElevated, border: `1px solid ${best.item.rarity.color}77`, boxShadow: `0 0 30px ${best.item.rarity.color}22` }}>
              <ItemBadge item={best.item} size={58} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: best.item.rarity.color }}>{best.item.rarity.label}</div>
                <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{best.item.name}</div>
                <div className="text-[11px]" style={{ color: C.textDim }}>из «{best.caseName}» · {timeAgo(best.ts)}</div>
              </div>
              <div className="text-[16px] font-bold flex-shrink-0" style={{ color: C.gold }}>{fmt(best.item.value)}</div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 mb-4 text-center text-[12px]" style={{ background: C.bgElevated, border: `1px dashed ${C.border}`, color: C.textDim }}>Пока пусто — открой первый кейс</div>
          )}

          <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: C.textDim }}>История дропов</div>
          <div className="space-y-1.5 pb-4">
            {!history.length && <div className="text-center py-10 text-[12px]" style={{ color: C.textDim }}>История пока пуста</div>}
            {history.slice().reverse().slice(0, 60).map((h) => (
              <div key={h.id} className="rounded-xl p-2 flex items-center gap-2.5" style={{ background: C.bgElevated, border: `1px solid ${h.item.rarity.color}33` }}>
                <ItemBadge item={h.item} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold truncate" style={{ color: C.text }}>{h.item.name}</div>
                  <div className="text-[9.5px]" style={{ color: C.textDim }}>{h.caseName} · {timeAgo(h.ts)}</div>
                </div>
                <div className="text-[12px] font-bold flex-shrink-0" style={{ color: h.item.rarity.color }}>{fmt(h.item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pb-4">
          {boardErr && <div className="text-center py-8 text-[12px]" style={{ color: C.danger }}>{boardErr}</div>}
          {!board && !boardErr && <div className="text-center py-8 text-[12px]" style={{ color: C.textDim }}>Загрузка…</div>}
          {board?.map((p, i) => (
            <div key={p.telegram_id} className="rounded-xl p-2.5 flex items-center gap-3" style={{ background: C.bgElevated, border: `1px solid ${i < 3 ? C.gold + "55" : C.border}` }}>
              <div className="w-6 text-center font-bold text-[13px]" style={{ color: i < 3 ? C.gold : C.textDim }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold truncate" style={{ color: C.text }}>{p.first_name || "Игрок"}</div>
                {p.best_drop && <div className="text-[10px] truncate" style={{ color: C.textDim }}>лучший дроп: {p.best_drop.short}</div>}
              </div>
              <div className="text-[13px] font-bold flex-shrink-0" style={{ color: C.gold }}>{fmt(p.coins)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { ProfileScreen };
