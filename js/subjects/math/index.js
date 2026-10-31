// 數學科目：闖關（curriculum.js 的關卡）、練習（各題型自由選範圍）。
// 題目全部由程式即時產生；一題 = { html, speak, ans, opts:[{val, html}] }。
import { tts, sfx, voice } from "../../core/audio.js";
import { burst } from "../../core/confetti.js";
import { store, registerTasks } from "../../core/store.js";
import { $, el, shuffle, wait, pic, toast, rint, drawMapPath } from "../../core/ui.js";
import { go, registerSubject } from "../../core/router.js";
import { dailyCard } from "../../core/daily.js";
import { BOOK, STAGES } from "./curriculum.js";

const N = 8; // 一回合題數
const M = () => store.sub("math", { played: 0, correct: 0, games: 0 });

// ---------------------------------------------------------------- 數字唸法
const CH = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const ZY = ["ㄌㄧㄥˊ", "ㄧ", "ㄦˋ", "ㄙㄢ", "ㄙˋ", "ㄨˇ", "ㄌㄧㄡˋ", "ㄑㄧ", "ㄅㄚ", "ㄐㄧㄡˇ", "ㄕˊ"];
const zh = n => n <= 10 ? CH[n] : n < 20 ? "十" + CH[n - 10] : CH[Math.floor(n / 10)] + "十" + (n % 10 ? CH[n % 10] : "");
// 0–10 用教育部辭典真人錄音（「真人」模式時），其他用合成語音
function sayNum(n) { tts.warmup(); return n <= 10 ? voice.word(CH[n], ZY[n], String(n)) : tts.speak(zh(n)); }
function say(text) { tts.warmup(); voice.stop(); return tts.speak(text); }

// ---------------------------------------------------------------- 素材
// [emoji, 名稱, 量詞]；emoji 需在 img/openmoji 有檔案
const THINGS = [
  ["🍎", "蘋果", "顆"], ["🍓", "草莓", "顆"], ["🍇", "葡萄", "串"], ["🍑", "桃子", "顆"], ["🍐", "梨子", "顆"], ["🍉", "西瓜", "片"],
  ["🐤", "小雞", "隻"], ["🐟", "魚", "條"], ["🐸", "青蛙", "隻"], ["🐱", "貓咪", "隻"], ["🐶", "小狗", "隻"], ["🐰", "兔子", "隻"],
  ["🐞", "瓢蟲", "隻"], ["🦋", "蝴蝶", "隻"], ["🐝", "蜜蜂", "隻"], ["⭐", "星星", "顆"], ["🎈", "氣球", "個"], ["🚗", "汽車", "輛"],
  ["🍬", "糖果", "顆"], ["🌸", "花", "朵"], ["🐢", "烏龜", "隻"], ["🐷", "小豬", "隻"], ["🦆", "鴨子", "隻"], ["⚽", "足球", "顆"],
];
const thing = () => THINGS[rint(0, THINGS.length - 1)];
const pics = (t, k, cls = "") => `<div class="m-objs ${cls}">${Array.from({ length: k }, () => pic(t[0], "pic-md")).join("")}</div>`;
// 選項：答案 + 3 個鄰近的數，限制在 [lo, hi]
function numOpts(ans, lo, hi) {
  const s = new Set([ans]); const pool = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(x => x !== ans)).sort((a, b) => Math.abs(a - ans) - Math.abs(b - ans));
  for (const x of pool) { if (s.size >= 4) break; s.add(x); }
  return shuffle([...s]).map(v => ({ val: v, html: String(v) }));
}

// ---------------------------------------------------------------- 題型
const GEN = {
  count(max) {
    const k = rint(1, max), t = thing();
    return { html: pics(t, k), speak: `數數看，有幾${t[2]}${t[1]}？`, ans: k, opts: numOpts(k, 1, Math.max(max, 4)) };
  },
  listen(max) {
    const k = rint(1, max);
    return { html: `<div class="m-big">🔊</div>`, speak: null, sayAns: k, ans: k, opts: numOpts(k, 1, Math.max(max, 4)), hint: "聽一聽，是哪個數字？" };
  },
  compare(max) {
    let a = rint(1, max), b = rint(1, max); while (b === a) b = rint(1, max);
    const more = Math.random() < 0.5, t1 = thing(), t2 = Math.random() < 0.5 ? t1 : thing();
    const ans = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
    return {
      html: `<div class="m-q">哪一邊比較<b class="${more ? "m-more" : "m-less"}">${more ? "多" : "少"}</b>？</div>`, speak: `哪一邊比較${more ? "多" : "少"}？`, ans,
      opts: [{ val: 0, html: pics(t1, a, "sm") }, { val: 1, html: pics(t2, b, "sm") }], wide: true, after: `${a} 和 ${b}，${more ? Math.max(a, b) : Math.min(a, b)} 比較${more ? "多" : "少"}`,
    };
  },
  order(max) {
    const len = Math.min(5, max), st = rint(0, max - len + 1) || 1, seq = Array.from({ length: len }, (_, i) => st + i);
    const down = max >= 10 && Math.random() < 0.25; if (down) seq.reverse();
    const hole = rint(0, len - 1), ans = seq[hole];
    const row = seq.map((x, i) => `<span class="m-cell${i === hole ? " hole" : ""}">${i === hole ? "?" : x}</span>`).join("");
    return { html: `<div class="m-seq">${row}</div>`, speak: down ? "倒著數，問號是多少？" : "數字排排站，問號是多少？", ans, opts: numOpts(ans, 0, max) };
  },
  split(max) {
    const tot = rint(2, max), a = rint(1, tot - 1), ans = tot - a;
    const dots = Array.from({ length: tot }, (_, i) => `<i class="${i < a ? "on" : ""}"></i>`).join("");
    return {
      html: `<div class="m-dots">${dots}</div><div class="m-eq">${tot} 可以分成 ${a} 和 <span class="hole">?</span></div>`,
      speak: `${zh(tot)}可以分成${zh(a)}和多少？`, ans, opts: numOpts(ans, 1, Math.max(tot - 1, 4)), after: `${tot} 可以分成 ${a} 和 ${ans}`,
    };
  },
  add(max) {
    const s = rint(1, max), a = Math.random() < 0.1 ? s : rint(0, s), b = s - a, t = thing();
    return {
      html: `<div class="m-pics">${pics(t, a, "sm")}<span class="m-op">+</span>${pics(t, b, "sm")}</div><div class="m-eq">${a} + ${b} = <span class="hole">?</span></div>`,
      speak: `${zh(a)}加${zh(b)}等於多少？`, ans: s, opts: numOpts(s, 0, max), after: `${a} + ${b} = ${s}`,
    };
  },
  sub(max) {
    const a = rint(1, max), b = Math.random() < 0.1 ? 0 : rint(1, a), ans = a - b, t = thing();
    const objs = `<div class="m-objs sm">${Array.from({ length: a }, (_, i) => `<span class="${i >= a - b ? "gone" : ""}">${pic(t[0], "pic-md")}</span>`).join("")}</div>`;
    return {
      html: `${objs}<div class="m-eq">${a} − ${b} = <span class="hole">?</span></div>`,
      speak: `${zh(a)}減${zh(b)}等於多少？`, ans, opts: numOpts(ans, 0, max), after: `${a} − ${b} = ${ans}`,
    };
  },
  mix(max) { return Math.random() < 0.5 ? GEN.add(max) : GEN.sub(max); },
};
const TYPES = [
  { type: "count", icon: "🐤", name: "數一數", desc: "有幾個？", color: "sunny" },
  { type: "listen", icon: "👂", name: "聽數字", desc: "聽到幾，就點幾", color: "violet" },
  { type: "compare", icon: "⚖️", name: "比多少", desc: "哪一邊比較多／少", color: "mint" },
  { type: "order", icon: "🚂", name: "數字排排站", desc: "找出不見的數字", color: "sky" },
  { type: "split", icon: "🔵", name: "分與合", desc: "幾可以分成幾和幾", color: "coral" },
  { type: "add", icon: "➕", name: "加法", desc: "合起來是多少", color: "mint" },
  { type: "sub", icon: "➖", name: "減法", desc: "拿走後剩多少", color: "violet" },
  { type: "mix", icon: "🏆", name: "加減大挑戰", desc: "加法減法混在一起", color: "coral" },
];

function makeRound(drills) {
  const qs = []; const per = drills.map((d, i) => d.n ?? Math.floor(N / drills.length) + (i < N % drills.length ? 1 : 0));
  drills.forEach((d, i) => { let guard = 0; const seen = new Set(); while (per[i] > 0 && guard++ < 60) { const q = GEN[d.type](d.max); const k = q.html + q.opts.map(o => o.html).join("|"); if (seen.has(k)) continue; seen.add(k); qs.push(q); per[i]--; } });
  return shuffle(qs);
}

// ---------------------------------------------------------------- 作答畫面（闖關、練習共用）
let round = null; // { qs, idx, correct, locked, title, stageId?, host, again }
function startRound(host, title, drills, stageId) {
  round = { qs: makeRound(drills), idx: 0, correct: 0, locked: false, title, stageId, host, drills };
  renderRound();
}
async function speakQ(q) { if (q.speak) await say(q.speak); if (q.sayAns != null) await sayNum(q.sayAns); }
function renderRound() {
  const v = $(round.host); v.innerHTML = "";
  if (round.idx >= round.qs.length) return summary(v);
  const q = round.qs[round.idx];
  v.append(el("h2", "h2", round.title));
  v.append(el("div", "quiz-top", `<span>第 ${round.idx + 1} / ${round.qs.length} 題</span><span>答對 ${round.correct}</span>`));
  v.append(el("div", "progressbar", `<i style="width:${round.idx / round.qs.length * 100}%"></i>`));
  const card = el("div", "m-card", q.html);
  const sp = el("button", "pill", "🔊 再聽一次"); sp.onclick = () => { sfx.tap(); speakQ(q); };
  if (q.hint) card.prepend(el("div", "m-q", q.hint));
  v.append(card, el("div", "row m-tools", ""));
  v.lastChild.append(sp);
  const opts = el("div", `options m-opts${q.wide ? " wide" : ""}`);
  for (const o of q.opts) {
    const b = el("button", "opt", o.html);
    b.onclick = async () => {
      if (round.locked) return; round.locked = true;
      [...opts.children].forEach(x => x.disabled = true);
      const ok = o.val === q.ans;
      if (ok) {
        b.classList.add("ok"); sfx.correct(); round.correct++;
        const r = b.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 50 });
      } else {
        b.classList.add("bad"); sfx.wrong();
        [...opts.children][q.opts.findIndex(x => x.val === q.ans)].classList.add("ok");
      }
      card.querySelectorAll(".hole").forEach(h => { h.textContent = q.ans; h.classList.add("filled"); });
      if (q.after) { card.append(el("div", "m-after", q.after)); await wait(300); await say(q.after.replace(/−/g, "減").replace(/\+/g, "加").replace(/=/g, "等於")); }
      else if (!q.wide) await sayNum(q.ans);
      await wait(ok ? 500 : 900);
      round.idx++; round.locked = false; renderRound();
    };
    opts.append(b);
  }
  v.append(opts);
  speakQ(q);
}
function summary(v) {
  const c = round.correct, n = round.qs.length, stars = c === n ? 3 : c >= n * .6 ? 2 : 1;
  const m = M(); m.played += n; m.correct += c; m.games++; store.save();
  store.addStars(stars); store.event("math"); store.event("math-ok", c);
  let msg = "";
  if (round.stageId) {
    const pass = c >= Math.ceil(n * 0.6);
    const { firstPass } = store.lessonResult("math:" + round.stageId, pass ? stars : 0);
    if (firstPass) { store.awardSticker(); const i = STAGES.findIndex(s => s.id === round.stageId); msg = `<p class="unlock">${i < STAGES.length - 1 ? `🔓 解鎖「${STAGES[i + 1].title}」！` : "🎉 全部過關！"}</p>`; }
    else if (!pass) msg = `<p class="unlock dim">答對 6 成以上就能過關喔</p>`;
  } else if (c === n) store.awardSticker();
  if (c === n) { sfx.win(); burst({ n: 160 }); } else sfx.correct();
  const s = el("div", "summary", `<div class="big-emoji">${c === n ? "🏆" : c >= n * .6 ? "🎉" : "💪"}</div><h3>${c === n ? "全部答對！" : c >= n * .6 ? "好厲害！" : "再試一次吧"}</h3><p>${n} 題答對 ${c} 題</p><div class="earned">${"⭐".repeat(stars)}</div>${msg}`);
  const again = el("button", "btn coral", "再來一輪"); again.onclick = () => { sfx.tap(); startRound(round.host, round.title, round.drills, round.stageId); };
  const back = el("button", "btn ghost", round.stageId ? "回地圖" : "換一個"); back.style.marginTop = "10px";
  back.onclick = () => { sfx.tap(); const h = round.host; round = null; h === "#v-math" ? viewMap() : viewPlay(); };
  s.append(again, back); v.append(s);
}

// ---------------------------------------------------------------- 闖關地圖
const stageStars = id => store.lessonStars("math:" + id);
const stageOpen = i => store.get().unlockAll || i === 0 || stageStars(STAGES[i - 1].id) >= 1;
const COLORS = ["sunny", "coral", "mint", "violet", "sky"];
function viewMap() {
  const v = $("#v-math");
  if (round?.host === "#v-math") return renderRound();
  v.innerHTML = "";
  v.append(el("h2", "h2", "數學闖關"), el("p", "sub", `${BOOK ? BOOK.name + "・" : ""}每關答對 6 成就能解鎖下一關`));
  if (!BOOK) v.append(el("div", "empty-hint", "目前是通用關卡（10 以內的數與加減），還沒對照課本單元。"));
  const map = el("div", "map"); const nodes = [];
  STAGES.forEach((st, i) => {
    const lock = !stageOpen(i), stars = stageStars(st.id), col = COLORS[i % COLORS.length];
    const node = el("div", `map-node ${["c", "r", "c", "l"][i % 4]}`);
    const btn = el("button", `node-btn ${col}${lock ? " locked" : ""}${stars ? " cleared" : ""}`, lock ? "🔒" : `<span>${i + 1}</span>`);
    node.append(btn, el("div", "node-cap", `<b class="m-cap">${st.title}</b><div class="node-stars">${[1, 2, 3].map(k => k <= stars ? "★" : "☆").join("")}</div>${st.page ? `<span class="pg">p.${st.page}</span>` : ""}`));
    btn.onclick = () => {
      if (lock) { sfx.wrong(); btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake"); return toast("先完成前面的關卡，就能解鎖喔！"); }
      sfx.tap(); scrollTo({ top: 0 }); startRound("#v-math", st.title, st.drills, st.id);
    };
    map.append(node); nodes.push(btn);
  });
  v.append(map);
  drawMapPath(map, nodes);
}

// ---------------------------------------------------------------- 自由練習
let range = 10;
try { range = +localStorage.getItem("zp.math.range") || 10; } catch {}
function viewPlay() {
  const v = $("#v-math-play");
  if (round?.host === "#v-math-play") return renderRound();
  v.innerHTML = "";
  v.append(el("h2", "h2", "數學練習"), el("p", "sub", "選範圍，再選一個想玩的！"));
  v.append(dailyCard(true));
  const pills = el("div", "pills range"); pills.append(el("span", "range-lbl", "範圍"));
  for (const r of [5, 10, 20]) {
    const b = el("button", `pill violet${r === range ? " on" : ""}`, `${r} 以內`);
    b.onclick = () => { sfx.tap(); range = r; try { localStorage.setItem("zp.math.range", r); } catch {} viewPlay(); };
    pills.append(b);
  }
  v.append(pills);
  const g = el("div", "game-grid");
  for (const t of TYPES) {
    const c = el("button", `game-card ${t.color}`, `<span class="gi">${t.icon}</span><b>${t.name}</b><span>${t.desc}</span>`);
    c.onclick = () => { sfx.tap(); scrollTo({ top: 0 }); startRound("#v-math-play", t.name, [{ type: t.type, max: range }]); };
    g.append(c);
  }
  v.append(g);
}

// ---------------------------------------------------------------- 註冊
registerTasks([
  { id: "math", goal: 1, icon: "🔢", label: "完成 1 場數學練習", go: "math-play", subj: "math" },
  { id: "math-ok", goal: 6, icon: "➕", label: "數學答對 6 題", go: "math", subj: "math" },
]);
registerSubject({
  id: "math", name: "① 數學", logo: "1", home: "math",
  tabs: [{ v: "math", ic: "🗺️", label: "闖關" }, { v: "math-play", ic: "🧮", label: "練習" }, { v: "progress", ic: "🏅", label: "我的" }],
  views: { math: { render: push => { if (push) round = null; viewMap(); } }, "math-play": { render: push => { if (push) round = null; viewPlay(); } } },
  progressSection() {
    const m = M(), passed = STAGES.filter(s => stageStars(s.id) >= 1).length, acc = m.played ? Math.round(m.correct / m.played * 100) : 0;
    return [el("div", "group-title", "數學"), el("div", "statgrid", `
      <div class="stat"><div class="v">${passed}<span class="of"> / ${STAGES.length}</span></div><div class="k">數學闖關</div></div>
      <div class="stat"><div class="v">${acc}%</div><div class="k">數學答對率（${m.played} 題）</div></div>`)];
  },
});
