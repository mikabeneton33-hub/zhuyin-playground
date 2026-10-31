// 進度：存瀏覽器本機，不用登入。
// 星星、貼紙、每日任務、連續天數為全站共用；各科目自己的紀錄放 data.subj[<科目 id>]（用 store.sub(id) 取）。
// 注音的欄位歷史上放在最上層，為了相容舊進度不搬動。
let STICKERS = [];

const KEY = "zp.progress.v1";
const def = () => ({
  stars: 0, learned: {}, quiz: { played: 0, correct: 0, best: 0 }, match: { wins: 0, bestMoves: null },
  spell: { count: 0 }, animals: { played: 0, correct: 0 },
  lessons: {},            // { L1: 最高星數 }
  stickers: [],           // 已收集的動物名稱
  daily: null,            // { date, tasks:[{id,goal,n}], rewarded }
  streak: { count: 0, last: null },
  unlockAll: false,
  subj: {},               // 新科目的紀錄：{ math: {...} }
  mole: { best: 0, games: 0 }, tone: { played: 0, correct: 0 }, odd: { games: 0 }, write: { count: 0 }, echo: { count: 0 },
});
let data = def();
try { data = { ...def(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
data.subj ||= {};
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} dispatchEvent(new CustomEvent("zp:progress")); }

// ---- 每日任務 ----
export const TASK_POOL = [
  { id: "tone", goal: 5, icon: "👂", label: "聲調耳朵答對 5 題", go: "tone" },
  { id: "mole", goal: 1, icon: "🔨", label: "玩 1 場注音打地鼠", go: "mole" },
  { id: "spell", goal: 3, icon: "⌨️", label: "拼對 3 個詞", go: "book" },
  { id: "learn", goal: 3, icon: "🔤", label: "在注音表聽 3 個符號", go: "learn" },
  { id: "echo", goal: 3, icon: "🎙️", label: "跟讀錄音 3 次", go: "echo" },
  { id: "write", goal: 2, icon: "✍️", label: "寫好 2 個符號", go: "write" },
  { id: "odd", goal: 1, icon: "🔍", label: "完成 1 場找不同", go: "odd" },
  { id: "quiz", goal: 1, icon: "🎧", label: "完成 1 場聽聽看", go: "quiz" },
  { id: "book", goal: 1, icon: "📘", label: "完成 1 場課本練習", go: "book" },
];
// 其他科目用 registerTasks() 加入自己的任務（subj 欄位標示科目）。每天：注音 2 個＋其他科目各 1 個。
export function registerTasks(list) { for (const t of list) if (!TASK_POOL.some(x => x.id === t.id)) TASK_POOL.push(t); }
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function seeded(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }
function ensureDaily() {
  const t = today();
  if (data.daily?.date === t) return data.daily;
  const rnd = seeded(t); const tasks = [];
  const groups = new Map();
  for (const x of TASK_POOL) { const k = x.subj || "zhuyin"; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
  const take = (pool, n) => { pool = [...pool]; for (let k = 0; k < n && pool.length; k++) { const i = Math.floor(rnd() * pool.length); tasks.push({ id: pool[i].id, goal: pool[i].goal, n: 0 }); pool.splice(i, 1); } };
  const others = [...groups.keys()].filter(k => k !== "zhuyin");
  take(groups.get("zhuyin") || [], Math.max(1, 3 - others.length));
  for (const k of others) take(groups.get(k), 1);
  data.daily = { date: t, tasks, rewarded: false };
  return data.daily;
}

export const store = {
  get() { return data; },
  sub(id, init = {}) { data.subj[id] = { ...init, ...(data.subj[id] || {}) }; return data.subj[id]; },
  save,
  setStickers(list) { STICKERS = list; },
  stickerCatalog() { return STICKERS; },
  addStars(n) { data.stars += n; save(); },
  learn(sym) { data.learned[sym] = (data.learned[sym] || 0) + 1; save(); },
  learnedCount() { return Object.keys(data.learned).length; },
  quizResult(correct, total) {
    data.quiz.played += total; data.quiz.correct += correct;
    data.quiz.best = Math.max(data.quiz.best, correct); save();
  },
  matchWin(moves) {
    data.match.wins++;
    data.match.bestMoves = data.match.bestMoves == null ? moves : Math.min(data.match.bestMoves, moves); save();
  },
  animals(mode, correct, total) { data.animals.played += total; data.animals.correct += correct; save(); },
  spelled() { data.spell.count++; save(); },
  count(key, field = "count", n = 1) { data[key][field] = (data[key][field] || 0) + n; save(); },

  // 課本闖關：回傳 { firstPass }
  lessonResult(id, stars) {
    const prev = data.lessons[id] || 0;
    data.lessons[id] = Math.max(prev, stars); save();
    return { firstPass: prev < 1 && stars >= 1 };
  },
  lessonStars(id) { return data.lessons[id] || 0; },
  setUnlockAll(v) { data.unlockAll = !!v; save(); },

  // 貼紙
  awardSticker() {
    const left = STICKERS.filter(a => !data.stickers.includes(a.name));
    if (!left.length) return null;
    const a = left[Math.floor(Math.random() * left.length)];
    data.stickers.push(a.name); save();
    dispatchEvent(new CustomEvent("zp:sticker", { detail: a }));
    return a;
  },

  // 每日任務
  daily() { const d = ensureDaily(); save(); return d; },
  event(type, n = 1) {
    const d = ensureDaily(); let changed = false;
    for (const t of d.tasks) if (t.id === type && t.n < t.goal) { t.n = Math.min(t.goal, t.n + n); changed = true; }
    if (changed && !d.rewarded && d.tasks.every(t => t.n >= t.goal)) {
      d.rewarded = true;
      data.streak.count = data.streak.last === yesterday() ? data.streak.count + 1 : (data.streak.last === today() ? data.streak.count : 1);
      data.streak.last = today();
      save();
      dispatchEvent(new CustomEvent("zp:daily-done"));
      return;
    }
    if (changed) save();
  },
  reset() { data = def(); save(); },
};
