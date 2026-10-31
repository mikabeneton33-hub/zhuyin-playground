// 每日任務卡（全站共用，任務來自各科目註冊的 TASK_POOL）。
import { TASK_POOL, store } from "./store.js";
import { el } from "./ui.js";
import { sfx } from "./audio.js";
import { go } from "./router.js";

export function dailyCard(compact) {
  const d = store.daily(); const s = store.get().streak;
  const card = el("div", `daily${d.rewarded ? " done" : ""}`);
  card.append(el("div", "daily-head", `<b>今日任務</b><span class="streak">🔥 連續 ${s.last ? s.count : 0} 天</span>`));
  for (const t of d.tasks) {
    const meta = TASK_POOL.find(x => x.id === t.id); if (!meta) continue;
    const row = el("button", `task${t.n >= t.goal ? " ok" : ""}`, `<span class="ti">${t.n >= t.goal ? "✅" : meta.icon}</span><span class="tl">${meta.label}</span><span class="tp">${t.n}/${t.goal}</span><i style="width:${t.n / t.goal * 100}%"></i>`);
    row.onclick = () => { sfx.tap(); go(meta.go); };
    card.append(row);
  }
  if (d.rewarded) card.append(el("div", "daily-ok", "今天的任務都完成了！明天再來挑戰 🎉"));
  else if (!compact) card.append(el("div", "daily-tip", "三個都完成可以得到一張動物貼紙"));
  return card;
}
