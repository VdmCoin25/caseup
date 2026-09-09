import React, { useState, useEffect, useRef } from "react";
import { Package, Swords, TrendingUp, Crosshair, Layers, User } from "lucide-react";
import { C, sfx, SparkField, AppHeader, serverSync, registerRerender } from "./lib.jsx";
import { CasesScreen } from "./CasesScreen.jsx";
import { BattleScreen } from "./BattleScreen.jsx";
import { UpgradeScreen } from "./UpgradeScreen.jsx";
import { RangeScreen } from "./RangeScreen.jsx";
import { InventoryScreen } from "./InventoryScreen.jsx";
import { ProfileScreen } from "./ProfileScreen.jsx";

/* ---------------------------------- root ---------------------------------- */
export default function App() {
  const [tab, setTab] = useState("cases");
  const [coins, setCoins] = useState(900);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [spent, setSpent] = useState(0);
  const [opened, setOpened] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [tgUser, setTgUser] = useState(null);
  const [, setTick] = useState(0);
  const initDataRef = useRef(null);
  const addItem = (i) => setInventory((inv) => [i, ...inv]);
  const removeItem = (id) => setInventory((inv) => inv.filter((x) => x.id !== id));

  useEffect(() => { registerRerender(() => setTick((n) => n + 1)); }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
      tg.setHeaderColor?.(C.bgElevated);
      tg.setBackgroundColor?.(C.bgDeep);
      document.documentElement.style.overscrollBehavior = "none";
      document.body.style.overscrollBehavior = "none";
      initDataRef.current = tg.initData;
      const u = tg.initDataUnsafe?.user;
      if (u) setTgUser(u);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (tgUser && initDataRef.current) {
        try {
          setLoadError(false);
          const tg = window.Telegram?.WebApp;
          const startParam = tg?.initDataUnsafe?.start_param;
          const player = await serverSync("load", initDataRef.current, undefined, startParam);
          setCoins(player.coins);
          setInventory(player.inventory || []);
          setHistory(player.history || []);
          setSpent(player.spent || 0);
          setOpened(player.opened_count || 0);
          setReferralCount(player.referral_count || 0);
          setLoaded(true); // only allow saving after a real, successful load —
          // otherwise a failed load would leave local defaults (900 coins, empty
          // inventory) in place, and the save effect below would push them to the
          // server a moment later, wiping out the player's real progress.
        } catch (e) {
          console.error("sync load failed:", e.message);
          setLoadError(true);
        }
        return;
      }
      try {
        const res = await window.storage?.get("drop-history", false);
        if (res?.value) {
          const parsed = JSON.parse(res.value);
          setHistory(parsed.history || []); setSpent(parsed.spent || 0); setOpened(parsed.opened || 0);
        }
      } catch {} finally { setLoaded(true); }
    })();
  }, [tgUser, retryTick]);

  useEffect(() => {
    if (!loaded) return;
    if (tgUser && initDataRef.current) {
      const t = setTimeout(() => {
        const best = history.reduce((a, b) => (!a || b.item.value > a.item.value ? b : a), null);
        serverSync("save", initDataRef.current, { coins, inventory, history: history.slice(-300), spent, opened, bestDrop: best })
          .catch((e) => console.error("sync save failed:", e.message));
      }, 1200);
      return () => clearTimeout(t);
    }
    try { window.storage?.set("drop-history", JSON.stringify({ history: history.slice(-300), spent, opened }), false); } catch {}
  }, [coins, inventory, history, spent, opened, loaded, tgUser]);

  const onDrop = (item, caseDef) => {
    setHistory((h) => [...h, { id: `h-${Date.now()}-${Math.random()}`, item, caseName: caseDef.name, ts: Date.now() }]);
    setSpent((s) => s + caseDef.cost);
    setOpened((o) => o + 1);
  };

  const tabs = [
    { id: "cases", label: "Кейсы", icon: Package },
    { id: "battle", label: "Батл", icon: Swords },
    { id: "upgrade", label: "Апгрейд", icon: TrendingUp },
    { id: "range", label: "Тир", icon: Crosshair },
    { id: "inv", label: "Вещи", icon: Layers },
    { id: "profile", label: "Профиль", icon: User },
  ];

  return (
    <div className="w-full flex flex-col" style={{ height: "100dvh", background: `radial-gradient(130% 60% at 12% -8%, #3D2612 0%, ${C.bg} 58%)`, overflow: "hidden" }}>
      <SparkField count={7} />
      <AppHeader coins={coins} tgUser={tgUser} notifications={history.slice().reverse()} onNav={setTab} />
      {loadError && (
        <div className="relative z-30 flex items-center gap-2 px-3 py-2" style={{ background: "#3A1418", borderBottom: "1px solid #C0432C55" }}>
          <span className="text-[11px] flex-1" style={{ color: "#FFD5D0" }}>
            Не удалось загрузить прогресс. Играть можно, но он не сохранится, пока не восстановишь связь.
          </span>
          <button onClick={() => setRetryTick((t) => t + 1)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0" style={{ background: "#C0432C", color: "#fff" }}>
            Повторить
          </button>
        </div>
      )}
      <div key={tab} className="flex-1 min-h-0 relative z-10 screen-enter">
        {tab === "cases" && <CasesScreen coins={coins} setCoins={setCoins} addItem={addItem} removeItem={removeItem} onDrop={onDrop} />}
        {tab === "battle" && <BattleScreen coins={coins} setCoins={setCoins} setInventory={setInventory} tgUser={tgUser} initData={initDataRef.current} />}
        {tab === "upgrade" && <UpgradeScreen inventory={inventory} setInventory={setInventory} />}
        {tab === "range" && <RangeScreen coins={coins} setCoins={setCoins} />}
        {tab === "inv" && <InventoryScreen inventory={inventory} setInventory={setInventory} setCoins={setCoins} coins={coins} />}
        {tab === "profile" && <ProfileScreen coins={coins} history={history} spent={spent} opened={opened} tgUser={tgUser} referralCount={referralCount} />}
      </div>
      <div className="relative z-30 flex items-center justify-around py-3 px-0.5" style={{ background: C.bgElevated, borderTop: `1px solid ${C.border}` }}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => { sfx.tap(); setTab(id); }} className="flex flex-col items-center gap-1 px-1.5 py-1 relative flex-1">
              {on && <div className="absolute -top-3 w-7 h-[3px] rounded-full" style={{ background: C.ember }} />}
              <Icon size={19} color={on ? C.ember : C.textDim} />
              <span className="text-[9px] font-semibold" style={{ color: on ? C.ember : C.textDim }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
