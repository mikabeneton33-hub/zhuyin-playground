// 數學科目：闖關（curriculum.js 的單元地圖）、練習（各題型自由選）。
// 題目全部由程式即時產生；一題 = { html, speak, ans, opts:[{val, html}], wide?, stack?, after? }。
import { tts, sfx, voice } from "../../core/audio.js";
import { burst } from "../../core/confetti.js";
import { store, registerTasks } from "../../core/store.js";
import { $, el, shuffle, wait, pic, toast, rint, drawMapPath } from "../../core/ui.js";
import { registerSubject } from "../../core/router.js";
import { dailyCard } from "../../core/daily.js";
import { BOOK, UNITS, STAGES } from "./curriculum.js";

const N = 8; // 一回合題數
const M = () => store.sub("math", { played: 0, correct: 0, games: 0 });
const pick = a => a[rint(0, a.length - 1)];

// ---------------------------------------------------------------- 數字唸法
const CH = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const ZY = ["ㄌㄧㄥˊ", "ㄧ", "ㄦˋ", "ㄙㄢ", "ㄙˋ", "ㄨˇ", "ㄌㄧㄡˋ", "ㄑㄧ", "ㄅㄚ", "ㄐㄧㄡˇ", "ㄕˊ"];
const zh = n => n <= 10 ? CH[n] : n < 20 ? "十" + CH[n - 10] : CH[Math.floor(n / 10)] + "十" + (n % 10 ? CH[n % 10] : "");
// 0–10 用教育部辭典真人錄音（「真人」模式時），其他用合成語音
function sayNum(n) { tts.warmup(); return n <= 10 ? voice.word(CH[n], ZY[n], String(n)) : tts.speak(zh(n)); }
function say(text) { tts.warmup(); voice.stop(); return tts.speak(text); }
const speakable = s => s.replace(/−/g, "減").replace(/\+/g, "加").replace(/=/g, "等於");

// ---------------------------------------------------------------- 素材（emoji 需在 img/openmoji 有檔案）
// [emoji, 名稱, 量詞]
const THINGS = [
  ["🍎", "蘋果", "顆"], ["🍓", "草莓", "顆"], ["🍇", "葡萄", "串"], ["🍑", "桃子", "顆"], ["🍐", "梨子", "顆"], ["🍊", "橘子", "顆"],
  ["🐤", "小雞", "隻"], ["🐟", "魚", "條"], ["🐸", "青蛙", "隻"], ["🐱", "貓咪", "隻"], ["🐶", "小狗", "隻"], ["🐰", "兔子", "隻"],
  ["🐞", "瓢蟲", "隻"], ["🦋", "蝴蝶", "隻"], ["🐝", "蜜蜂", "隻"], ["⭐", "星星", "顆"], ["🎈", "氣球", "個"], ["🚗", "汽車", "輛"],
  ["🍬", "糖果", "顆"], ["🌸", "花", "朵"], ["🐢", "烏龜", "隻"], ["🐷", "小豬", "隻"], ["🦆", "鴨子", "隻"], ["🍪", "餅乾", "片"],
];
const ANIMALS = THINGS.filter(t => t[2] === "隻");
const SOLIDS = {
  box: { name: "方盒", items: ["📦", "🎁", "🎲", "🧊", "🧱"] },
  can: { name: "圓罐", items: ["🥫", "🥁", "🧻", "🔋"] },
  ball: { name: "球", items: ["⚽", "🏀", "🏐", "🎾", "🎱"] },
};
const thing = () => pick(THINGS);
const pics = (t, k, cls = "") => `<div class="m-objs ${cls}">${Array.from({ length: k }, () => pic(t[0], "pic-md")).join("")}</div>`;
// 超過 10 個：每 10 個一排，方便數
const tensPics = (t, k) => `<div class="m-tens">${Array.from({ length: Math.ceil(k / 10) }, (_, r) => `<div>${Array.from({ length: Math.min(10, k - r * 10) }, () => pic(t[0], "pic-md")).join("")}</div>`).join("")}</div>`;
const objs = (t, k, cls = "") => k > 10 ? tensPics(t, k) : k === 0 ? `<div class="m-empty">（沒有）</div>` : pics(t, k, cls);
function numOpts(ans, lo, hi) {
  const s = new Set([ans]); const pool = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(x => x !== ans)).sort((a, b) => Math.abs(a - ans) - Math.abs(b - ans));
  for (const x of pool) { if (s.size >= 4) break; s.add(x); }
  return shuffle([...s]).map(v => ({ val: v, html: String(v) }));
}
const COLORS = ["#FF6B6B", "#2BC4B6", "#FFC94A", "#6C5CE7", "#54A0FF"];

// ---------------------------------------------------------------- SVG 小圖
function lineSVG(curve, seed) {
  const d = curve
    ? ["M8 30 C 40 4, 60 56, 92 30", "M8 44 Q 50 -4 92 44", "M8 30 C 25 8, 35 52, 50 30 S 75 8, 92 30", "M14 52 C 14 8, 86 8, 86 52"][seed % 4]
    : ["M8 30 L92 30", "M10 52 L90 8", "M10 8 L90 52", "M24 54 L76 6"][seed % 4];
  return `<svg class="m-line" viewBox="0 0 100 60"><path d="${d}"/></svg>`;
}
function shapeSVG(kind) {
  const c = pick(COLORS), r = rint(-20, 20);
  const body = {
    circle: `<circle cx="50" cy="50" r="${rint(26, 38)}"/>`,
    triangle: `<polygon points="50,12 ${rint(84, 92)},84 ${rint(8, 16)},84"/>`,
    square: `<rect x="20" y="20" width="60" height="60" rx="3"/>`,
    rect: Math.random() < 0.5 ? `<rect x="8" y="30" width="84" height="40" rx="3"/>` : `<rect x="30" y="8" width="40" height="84" rx="3"/>`,
  }[kind];
  return `<svg class="m-shape" viewBox="0 0 100 100"><g fill="${c}" transform="rotate(${kind === "circle" ? 0 : r} 50 50)">${body}</g></svg>`;
}
function clockSVG(h, half) {
  const ang = d => (d - 90) * Math.PI / 180;
  const xy = (d, L) => [50 + L * Math.cos(ang(d)), 50 + L * Math.sin(ang(d))].map(v => v.toFixed(2));
  const nums = Array.from({ length: 12 }, (_, i) => { const [x, y] = xy((i + 1) * 30, 36); return `<text x="${x}" y="${(+y + 4).toFixed(2)}">${i + 1}</text>`; }).join("");
  const ticks = Array.from({ length: 60 }, (_, i) => { const [a, b] = xy(i * 6, 46), [c, d] = xy(i * 6, i % 5 ? 44 : 42); return `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`; }).join("");
  const [hx, hy] = xy((h % 12) * 30 + (half ? 15 : 0), 22), [mx, my] = xy(half ? 180 : 0, 36);
  return `<svg class="m-clock" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" class="face"/><g class="ticks">${ticks}</g><g class="nums">${nums}</g>
    <line class="hh" x1="50" y1="50" x2="${hx}" y2="${hy}"/><line class="mh" x1="50" y1="50" x2="${mx}" y2="${my}"/><circle cx="50" cy="50" r="3" class="dot"/></svg>`;
}
const clockLabel = (h, half) => `${h} 點${half ? "半" : ""}`;

// ---------------------------------------------------------------- 做造型、時間的先後和長短 素材
const PLANE = { circle: "圓形", triangle: "三角形", square: "正方形", rect: "長方形" };
const OBJ = { "🥫": "罐頭", "🥁": "鼓", "🧻": "衛生紙", "🔋": "電池", "🎲": "骰子", "🧊": "冰塊", "📦": "紙箱", "🧱": "磚塊", "🧀": "起司", "🍰": "蛋糕", "⚽": "足球" };
// 描得出這個形狀的東西；clash = 也可能描出相同形狀、不能當錯誤選項的類別
const FACES = {
  circle: { name: "圓形", items: ["🥫", "🥁", "🧻", "🔋"] },
  square: { name: "正方形", items: ["🎲", "🧊"], clash: ["rect"] },
  rect: { name: "長方形", items: ["📦", "🧱"], clash: ["square"] },
  triangle: { name: "三角形", items: ["🧀", "🍰"] },
};
// 用平面圖形拼成的機器人，回傳 SVG 與各形狀數量
function robot() {
  const count = { circle: 0, triangle: 0, square: 0, rect: 0 }, parts = [];
  const add = (k, x, y, w, h, c) => {
    count[k]++;
    const col = c || pick(COLORS);
    parts.push(k === "circle" ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" fill="${col}"/>`
      : k === "square" ? `<rect x="${x + (w - Math.min(w, h)) / 2}" y="${y + (h - Math.min(w, h)) / 2}" width="${Math.min(w, h)}" height="${Math.min(w, h)}" fill="${col}"/>`
      : k === "triangle" ? `<polygon points="${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}" fill="${col}"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/>`);
  };
  const ant = rint(0, 2), ak = pick(["triangle", "circle"]);
  if (ant === 1) add(ak, 92, 2, 16, 16); if (ant === 2) { add(ak, 72, 2, 16, 16); add(ak, 112, 2, 16, 16); }
  const head = pick(["square", "circle"]); add(head, 66, 18, 68, 68, "#54A0FF");
  const ek = pick(["circle", "square", "triangle"]); add(ek, 80, 38, 14, 14, "#fff"); add(ek, 106, 38, 14, 14, "#fff");
  if (Math.random() < 0.5) add("rect", 86, 64, 28, 8, "#FF6B6B");
  add("rect", 56, 92, 88, 72, "#6C5CE7");
  add("rect", 22, 102, 32, 12, "#2BC4B6"); add("rect", 146, 102, 32, 12, "#2BC4B6");
  const bn = rint(1, 3), bk = pick(["circle", "square", "triangle"]);
  for (let i = 0; i < bn; i++) add(bk, 92, 100 + i * 20, 16, 16, "#FFC94A");
  const fk = pick(["triangle", "square", "rect"]);
  if (fk === "rect") { add(fk, 54, 172, 40, 18, "#FF6B6B"); add(fk, 106, 172, 40, 18, "#FF6B6B"); } else { add(fk, 62, 168, 30, 26, "#FF6B6B"); add(fk, 108, 168, 30, 26, "#FF6B6B"); }
  return { svg: `<svg class="m-robot" viewBox="0 0 200 200">${parts.join("")}</svg>`, count };
}
// 事情的先後（依發生順序）
const SEQS = [
  { name: "早上去上學", steps: [["🛏", "起床"], ["🪥", "刷牙"], ["🍳", "吃早餐"], ["🏫", "上學"]] },
  { name: "小雞長大", steps: [["🥚", "雞蛋"], ["🐣", "破殼"], ["🐤", "小雞"], ["🐔", "大雞"]] },
  { name: "種向日葵", steps: [["🌰", "種子"], ["🌱", "發芽"], ["🌿", "長葉子"], ["🌻", "開花"]] },
  { name: "吃晚餐", steps: [["🧼", "洗手"], ["🍚", "吃飯"], ["🪥", "刷牙"]] },
  { name: "一天", steps: [["🌅", "早上"], ["☀", "中午"], ["🌙", "晚上"]] },
  { name: "準備睡覺", steps: [["🛁", "洗澡"], ["👕", "換衣服"], ["😴", "睡覺"]] },
  { name: "出門", steps: [["🧦", "穿襪子"], ["👟", "穿鞋子"], ["🚶", "出門"]] },
];
// 時間的長短：[花的時間短, 花的時間長]
const DURS = [
  [["👁", "眨一下眼睛"], ["😴", "睡一晚覺"]], [["🧼", "洗手"], ["🛁", "洗澡"]], [["🍬", "吃一顆糖"], ["🍚", "吃一頓飯"]],
  [["🧦", "穿襪子"], ["🏫", "上一天學"]], [["🚪", "走到門口"], ["✈", "坐飛機出國"]], [["🥛", "喝一口牛奶"], ["🎬", "看一場電影"]],
  [["🪥", "刷牙"], ["📝", "寫完作業"]], [["🍞", "吃一片麵包"], ["🌻", "種子長成花"]], [["🧹", "掃一下地"], ["🧺", "洗全家的衣服"]],
];

// ---------------------------------------------------------------- 題型
// d = 單一 drill 設定 { type, max, min, ... }（見 curriculum.js）
const GEN = {
  count(d) {
    const lo = d.min ?? 1, hi = d.max, t = thing();
    const k = d.zeroRate && Math.random() < d.zeroRate ? 0 : rint(Math.max(lo, 1), hi);
    return { html: objs(t, k), speak: `數數看，有幾${t[2]}${t[1]}？`, ans: k, opts: numOpts(k, Math.max(0, Math.min(lo, hi - 3)), Math.max(hi, 4)) };
  },
  listen(d) {
    const lo = d.min ?? 1, k = rint(lo, d.max);
    return { html: `<div class="m-big">🔊</div>`, sayAns: k, ans: k, opts: numOpts(k, Math.max(0, Math.min(lo, d.max - 3)), Math.max(d.max, 4)), hint: "聽一聽，是哪個數字？" };
  },
  tens(d) { // 十個一排：幾個十和幾個一
    const k = rint(11, d.max), t = thing(), tens = Math.floor(k / 10), ones = k % 10;
    return { html: tensPics(t, k), speak: `一排有十${t[2]}，一共有幾${t[2]}${t[1]}？`, ans: k, opts: numOpts(k, 10, d.max), after: `${tens} 個十和 ${ones} 個一，是 ${k}` };
  },
  compare(d) {
    let a = rint(1, d.max), b = rint(1, d.max); while (b === a) b = rint(1, d.max);
    const more = Math.random() < 0.5, t1 = thing(), t2 = Math.random() < 0.5 ? t1 : thing();
    const ans = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
    return {
      html: `<div class="m-q">哪一邊比較<b class="${more ? "m-more" : "m-less"}">${more ? "多" : "少"}</b>？</div>`, speak: `哪一邊比較${more ? "多" : "少"}？`, ans,
      opts: [{ val: 0, html: pics(t1, a, "sm") }, { val: 1, html: pics(t2, b, "sm") }], wide: true, after: `${a} 和 ${b}，${more ? Math.max(a, b) : Math.min(a, b)} 比較${more ? "多" : "少"}`,
    };
  },
  diff(d) { // 多多少、少多少
    let a = rint(2, d.max), b = rint(1, d.max); while (b === a) b = rint(1, d.max);
    const [t1, t2] = shuffle(ANIMALS).slice(0, 2), more = Math.random() < 0.5, ans = Math.abs(a - b);
    const big = a > b ? t1 : t2, small = a > b ? t2 : t1, [x, y] = more ? [big, small] : [small, big];
    return {
      html: `<div class="m-rows">${pics(t1, a, "sm row")}${pics(t2, b, "sm row")}</div><div class="m-q">${x[1]}比${y[1]}<b class="${more ? "m-more" : "m-less"}">${more ? "多" : "少"}</b>幾隻？</div>`,
      speak: `${x[1]}比${y[1]}${more ? "多" : "少"}幾隻？`, ans, opts: numOpts(ans, 1, d.max), after: `${Math.max(a, b)} − ${Math.min(a, b)} = ${ans}`,
    };
  },
  bigger(d) { // 數字比大小
    const n = rint(2, 3), s = new Set(); while (s.size < n) s.add(rint(1, d.max));
    const arr = shuffle([...s]), big = Math.random() < 0.5, ans = big ? Math.max(...arr) : Math.min(...arr);
    return { html: `<div class="m-q">哪一個數比較<b class="${big ? "m-more" : "m-less"}">${big ? "大" : "小"}</b>？</div>`, speak: `哪一個數比較${big ? "大" : "小"}？`, ans, opts: arr.map(v => ({ val: v, html: String(v) })) };
  },
  order(d) {
    const len = Math.min(5, d.max), lo = d.min ?? 1, st = rint(lo, d.max - len + 1), seq = Array.from({ length: len }, (_, i) => st + i);
    const down = d.max >= 10 && Math.random() < 0.25; if (down) seq.reverse();
    const hole = rint(0, len - 1), ans = seq[hole];
    const row = seq.map((x, i) => `<span class="m-cell${i === hole ? " hole" : ""}">${i === hole ? "?" : x}</span>`).join("");
    return { html: `<div class="m-seq">${row}</div>`, speak: down ? "倒著數，問號是多少？" : "數字排排站，問號是多少？", ans, opts: numOpts(ans, Math.max(0, lo - 1), d.max) };
  },
  ordinal(d) { // 排在第幾個
    const len = d.len ?? rint(5, 7), row = shuffle(ANIMALS).slice(0, len), fromL = Math.random() < 0.5, side = fromL ? "左" : "右";
    const k = rint(1, len), who = fromL ? row[k - 1] : row[len - k];
    const html = `<div class="m-lineup"><span class="m-side">左</span><div>${row.map(t => pic(t[0], "pic-md")).join("")}</div><span class="m-side">右</span></div>`;
    if (Math.random() < 0.5) {
      const others = shuffle(row.filter(t => t !== who)).slice(0, 3);
      return { html: html + `<div class="m-q">從<b class="m-more">${side}</b>邊數來，第 ${k} 個是誰？</div>`, speak: `從${side}邊數來，第${zh(k)}個是誰？`, ans: who[1],
        opts: shuffle([who, ...others]).map(t => ({ val: t[1], html: pic(t[0], "pic-lg") })), after: `從${side}邊數來，第 ${k} 個是${who[1]}` };
    }
    return { html: html + `<div class="m-q">${who[1]}從<b class="m-more">${side}</b>邊數來排第幾個？</div>`, speak: `${who[1]}從${side}邊數來排第幾個？`, ans: k, opts: numOpts(k, 1, len), after: `${who[1]}從${side}邊數來排第 ${k} 個` };
  },
  nth(d) { // 第幾個 vs 幾個
    const len = rint(6, 8), k = rint(2, len - 2), t = thing(), askNth = Math.random() < 0.5;
    const row = only => `<div class="m-objs row">${Array.from({ length: len }, (_, i) => `<span class="${(only ? i === k - 1 : i < k) ? "hl" : "dim"}">${pic(t[0], "pic-md")}</span>`).join("")}</div>`;
    return {
      html: `<div class="m-q">從左邊數，哪一排圈的是「<b class="m-more">${askNth ? `第 ${k} 個` : `${k} 個`}</b>」？</div>`, speak: `從左邊數，哪一排圈的是${askNth ? `第${zh(k)}個` : `${zh(k)}個`}？`,
      ans: askNth ? 1 : 0, opts: shuffle([{ val: 1, html: row(true) }, { val: 0, html: row(false) }]), wide: true, stack: true,
      after: askNth ? `第 ${k} 個只有 1 個` : `${k} 個要圈 ${k} 個`,
    };
  },
  length(d) { // 比長短／高矮／厚薄
    const mode = d.mode || "long", vals = shuffle([rint(30, 45), rint(55, 70), rint(80, 98)]);
    const wantMax = Math.random() < 0.5, ansI = vals.indexOf(wantMax ? Math.max(...vals) : Math.min(...vals));
    const word = { long: wantMax ? "長" : "短", tall: wantMax ? "高" : "矮", thick: wantMax ? "厚" : "薄" }[mode];
    const item = (v, i) => mode === "long" ? `<div class="m-barbox h"><div class="m-bar" style="width:${v}%;background:${COLORS[i]}"></div></div>`
      : mode === "tall" ? `<div class="m-barbox v"><div class="m-bar" style="height:${v}%;background:${COLORS[i]}"></div></div>`
      : `<div class="m-barbox v"><div class="m-book" style="height:${Math.round(v * .6)}px;background:${COLORS[i]}"></div></div>`;
    const lead = mode === "long" ? "左邊對齊，" : mode === "tall" ? "站在同一條線上，" : "";
    return {
      html: `<div class="m-q">${lead}哪一個比較<b class="${wantMax ? "m-more" : "m-less"}">${word}</b>？</div>`, speak: `哪一個比較${word}？`, ans: ansI,
      opts: vals.map((v, i) => ({ val: i, html: item(v, i) })), wide: true, stack: mode === "long", cls: "three",
    };
  },
  line() {
    const curve = Math.random() < 0.5, target = { val: 1, html: lineSVG(curve, rint(0, 3)) };
    const others = shuffle([0, 1, 2, 3]).slice(0, 2).map(s => ({ val: 0, html: lineSVG(!curve, s) }));
    return { html: `<div class="m-q">哪一條是<b class="m-more">${curve ? "曲線" : "直線"}</b>？</div>`, speak: `哪一條是${curve ? "曲線" : "直線"}？`, ans: 1, opts: shuffle([target, ...others]), wide: true, cls: "three" };
  },
  solid() {
    const key = pick(Object.keys(SOLIDS)), e = pick(SOLIDS[key].items);
    const why = { box: "可以堆疊，不容易滾動", can: "可以堆疊，躺著會滾動", ball: "不能堆疊，很會滾動" }[key];
    return { html: `<div class="m-solid">${pic(e, "pic-xl")}</div><div class="m-q">這個像哪一種形狀？</div>`, speak: "這個像哪一種形狀？", ans: key,
      opts: Object.entries(SOLIDS).map(([k, s]) => ({ val: k, html: `<span class="m-optlbl">${pic(s.items[0], "pic-md")}${s.name}</span>` })), after: `${SOLIDS[key].name}：${why}`, cls: "three" };
  },
  plane() {
    const K = { circle: "圓形", triangle: "三角形", square: "正方形", rect: "長方形" }, k = pick(Object.keys(K));
    return { html: `<div class="m-solid">${shapeSVG(k)}</div><div class="m-q">這是什麼形狀？</div>`, speak: "這是什麼形狀？", ans: k,
      opts: Object.entries(K).map(([v, n]) => ({ val: v, html: `<span class="m-optlbl txt">${n}</span>` })), after: K[k] };
  },
  split(d) { // 分一分
    const tot = d.tot ?? rint(2, d.max), a = rint(1, tot - 1), ans = tot - a;
    const dots = Array.from({ length: tot }, (_, i) => `<i class="${i < a ? "on" : ""}"></i>`).join("");
    return { html: `<div class="m-dots">${dots}</div><div class="m-eq">${tot} 可以分成 ${a} 和 <span class="hole">?</span></div>`,
      speak: `${zh(tot)}可以分成${zh(a)}和多少？`, ans, opts: numOpts(ans, 1, Math.max(tot - 1, 4)), after: `${tot} 可以分成 ${a} 和 ${ans}` };
  },
  join(d) { // 合一合
    const tot = d.tot ?? rint(2, d.max), a = rint(1, tot - 1), b = tot - a;
    if (d.tot) { // a 和幾合起來是 tot
      return { html: `<div class="m-dots">${Array.from({ length: tot }, (_, i) => `<i class="${i < a ? "on" : ""}"></i>`).join("")}</div><div class="m-eq">${a} 和 <span class="hole">?</span> 合起來是 ${tot}</div>`,
        speak: `${zh(a)}和多少合起來是${zh(tot)}？`, ans: b, opts: numOpts(b, 1, tot - 1), after: `${a} 和 ${b} 合起來是 ${tot}` };
    }
    return { html: `<div class="m-dots">${"<i class=on></i>".repeat(a)}<span class="gap"></span>${"<i></i>".repeat(b)}</div><div class="m-eq">${a} 和 ${b} 合起來是 <span class="hole">?</span></div>`,
      speak: `${zh(a)}和${zh(b)}合起來是多少？`, ans: tot, opts: numOpts(tot, 2, Math.max(d.max, 5)), after: `${a} 和 ${b} 合起來是 ${tot}` };
  },
  add(d) {
    const t = thing(); let a, b;
    if (d.zero) { const s = rint(0, d.max); [a, b] = Math.random() < 0.5 ? [s, 0] : [0, s]; }
    else { const s = rint(2, d.max); a = rint(1, s - 1); b = s - a; }
    const s = a + b, showPics = d.pics || Math.random() < 0.5;
    return {
      html: `${showPics ? `<div class="m-pics">${objs(t, a, "sm")}<span class="m-op">+</span>${objs(t, b, "sm")}</div>` : ""}<div class="m-eq">${a} + ${b} = <span class="hole">?</span></div>`,
      speak: `${zh(a)}加${zh(b)}等於多少？`, ans: s, opts: numOpts(s, 0, d.max), after: `${a} + ${b} = ${s}`,
    };
  },
  sub(d) {
    const a = rint(1, d.max), r = Math.random(), b = r < 0.1 ? 0 : r < 0.18 ? a : rint(1, a), ans = a - b, t = thing();
    const showPics = d.pics || Math.random() < 0.5;
    const o = `<div class="m-objs sm">${Array.from({ length: a }, (_, i) => `<span class="${i >= a - b ? "gone" : ""}">${pic(t[0], "pic-md")}</span>`).join("")}</div>`;
    return { html: `${showPics ? o : ""}<div class="m-eq">${a} − ${b} = <span class="hole">?</span></div>`, speak: `${zh(a)}減${zh(b)}等於多少？`, ans, opts: numOpts(ans, 0, d.max), after: `${a} − ${b} = ${ans}` };
  },
  mix(d) { return Math.random() < 0.5 ? GEN.add(d) : GEN.sub(d); },
  trace() { // 做造型：用哪一個東西的面可以描出這個形狀
    const k = pick(Object.keys(FACES)), ok = pick(FACES[k].items);
    const pool = Object.entries(FACES).filter(([x]) => x !== k && !(FACES[k].clash || []).includes(x)).flatMap(([, f]) => f.items);
    const opts = shuffle([ok, ...shuffle(pool).slice(0, 1), "⚽"]).map(e => ({ val: e, html: `<span class="m-optlbl">${pic(e, "pic-lg")}${OBJ[e]}</span>` }));
    return { html: `<div class="m-solid">${shapeSVG(k)}</div><div class="m-q">用哪一個東西的面，可以描出這個${FACES[k].name}？</div>`,
      speak: `用哪一個東西的面，可以描出這個${FACES[k].name}？`, ans: ok, opts, cls: "three", after: `${OBJ[ok]}有一面是${FACES[k].name}；球沒有平平的面` };
  },
  design() { // 做造型：數一數造型裡每種形狀有幾個
    const { svg, count } = robot(), kinds = Object.keys(count).filter(x => count[x] > 0), k = pick(kinds), ans = count[k];
    return { html: `<div class="m-solid">${svg}</div><div class="m-q">這個造型裡，<b class="m-more">${PLANE[k]}</b>有幾個？</div>`,
      speak: `這個造型裡，${PLANE[k]}有幾個？`, ans, opts: numOpts(ans, 1, Math.max(ans + 2, 5)), after: kinds.map(x => `${PLANE[x]} ${count[x]} 個`).join("、") };
  },
  sequence() { // 時間的先後
    const sq = pick(SEQS), n = sq.steps.length, order = shuffle(sq.steps.map((_, i) => i));
    const card = (i, j) => ({ val: i, html: `<span class="m-ev"><i>${"ㄅㄆㄇㄈ"[j]}</i>${pic(sq.steps[i][0], "pic-lg")}<b>${sq.steps[i][1]}</b></span>` });
    const r = Math.random(); let q, ans;
    if (r < 0.35) { q = "最先發生的是哪一個？"; ans = 0; }
    else if (r < 0.65) { q = "最後發生的是哪一個？"; ans = n - 1; }
    else { const x = rint(0, n - 2); q = `「${sq.steps[x][1]}」的下一步是哪一個？`; ans = x + 1; }
    return { html: `<div class="m-q">${sq.name}：${q}</div>`, speak: `${sq.name}，${q}`, ans, opts: order.map(card), wide: true, cls: n === 3 ? "three" : "",
      after: sq.steps.map(x => x[1]).join(" → ") };
  },
  seqorder() { // 時間的先後：依序點卡片排出整串順序
    const sq = pick(SEQS), n = sq.steps.length, order = shuffle(sq.steps.map((_, i) => i));
    const slots = `<div class="m-slots">${sq.steps.map(() => "<span>?</span>").join("")}</div>`;
    return { mode: "order", html: `<div class="m-q">${sq.name}：先發生的先點，依順序點一點</div>${slots}`, speak: `${sq.name}，先發生的先點，依順序點一點。`,
      ans: sq.steps.map((_, i) => i), opts: order.map((i, j) => ({ val: i, say: sq.steps[i][1], slot: pic(sq.steps[i][0], "pic-md"),
        html: `<span class="m-ev"><i>${"ㄅㄆㄇㄈ"[j]}</i>${pic(sq.steps[i][0], "pic-lg")}<b>${sq.steps[i][1]}</b></span>` })),
      wide: true, cls: n === 3 ? "three" : "", after: sq.steps.map(x => x[1]).join(" → ") };
  },
  duration() { // 時間的長短
    const [a, b] = pick(DURS), long = Math.random() < 0.5, ans = long ? 1 : 0;
    const card = (x, i) => ({ val: i, html: `<span class="m-ev">${pic(x[0], "pic-lg")}<b>${x[1]}</b></span>` });
    return { html: `<div class="m-q">哪一件事花的時間比較<b class="${long ? "m-more" : "m-less"}">${long ? "長" : "短"}</b>？</div>`, speak: `哪一件事花的時間比較${long ? "長" : "短"}？`, ans,
      opts: shuffle([card(a, 0), card(b, 1)]), wide: true, after: `${b[1]}比${a[1]}花的時間長` };
  },
  clock(d) {
    const h = rint(1, 12), half = d.half ? Math.random() < 0.6 : false;
    if (d.mode === "hands") {
      return { html: `<div class="m-solid">${clockSVG(h, false)}</div><div class="m-q">長針指著 12，<b class="m-less">短針</b>指著幾？</div>`, speak: "長針指著十二，短針指著幾？", ans: h, opts: numOpts(h, 1, 12), after: `短針指著 ${h}，是 ${h} 點` };
    }
    const s = new Set([clockLabel(h, half)]);
    const near = [[h, !half], [h % 12 + 1, half], [(h + 10) % 12 + 1, half], [h % 12 + 1, !half], [(h + 5) % 12 + 1, half]];
    for (const [x, hf] of shuffle(near)) { if (s.size >= 4) break; if (!d.half && hf) continue; s.add(clockLabel(x, hf)); }
    while (s.size < 4) s.add(clockLabel(rint(1, 12), !!d.half && Math.random() < 0.5));
    return { html: `<div class="m-solid">${clockSVG(h, half)}</div><div class="m-q">現在是幾點鐘？</div>`, speak: "現在是幾點鐘？", ans: clockLabel(h, half),
      opts: shuffle([...s]).map(v => ({ val: v, html: `<span class="m-optlbl txt">${v}</span>` })),
      after: half ? `短針在 ${h} 和 ${h % 12 + 1} 中間，長針指著 6，是 ${h} 點半` : `短針指著 ${h}，長針指著 12，是 ${h} 點` };
  },
};
// 練習頁的題型清單（ranged：可選數字範圍）
const TYPES = [
  { type: "count", icon: "🐤", name: "數一數", desc: "有幾個？", color: "sunny", ranged: true },
  { type: "listen", icon: "👂", name: "聽數字", desc: "聽到幾，就點幾", color: "violet", ranged: true },
  { type: "compare", icon: "⚖️", name: "比多少", desc: "哪一邊比較多／少", color: "mint", ranged: true },
  { type: "order", icon: "🚂", name: "排數字", desc: "找出不見的數字", color: "sky", ranged: true },
  { type: "ordinal", icon: "🏁", name: "排第幾個", desc: "從左邊、右邊數", color: "coral" },
  { type: "nth", icon: "👆", name: "第幾個和幾個", desc: "分清楚「第3個」和「3個」", color: "sunny" },
  { type: "length", icon: "📏", name: "比長短", desc: "長短、高矮、厚薄", color: "mint", drills: [{ type: "length", mode: "long" }, { type: "length", mode: "tall" }, { type: "length", mode: "thick" }] },
  { type: "line", icon: "〰️", name: "直線和曲線", desc: "哪一條是直的？", color: "sky" },
  { type: "split", icon: "🔵", name: "分與合", desc: "幾可以分成幾和幾", color: "coral", drills: [{ type: "split", max: 10 }, { type: "join", max: 10 }] },
  { type: "solid", icon: "📦", name: "方盒圓罐球", desc: "立體和平面圖形", color: "violet", drills: [{ type: "solid" }, { type: "plane" }] },
  { type: "design", icon: "🤖", name: "做造型", desc: "描形狀、數一數圖形", color: "mint", drills: [{ type: "trace" }, { type: "design" }] },
  { type: "tens", icon: "🔟", name: "30 以內的數", desc: "十個一排、比大小", color: "sunny", drills: [{ type: "tens", max: 30 }, { type: "bigger", max: 30 }] },
  { type: "add", icon: "➕", name: "加法", desc: "合起來是多少", color: "mint", ranged: true },
  { type: "sub", icon: "➖", name: "減法", desc: "拿走後剩多少", color: "violet", ranged: true },
  { type: "diff", icon: "🐾", name: "多多少、少多少", desc: "兩排比一比", color: "sky", ranged: true },
  { type: "sequence", icon: "🐣", name: "先後和長短", desc: "誰先誰後、哪個比較久", color: "sunny", drills: [{ type: "seqorder" }, { type: "sequence" }, { type: "duration" }] },
  { type: "clock", icon: "🕒", name: "幾點鐘", desc: "幾點、幾點半", color: "coral", drills: [{ type: "clock", half: true }] },
];

function makeRound(drills) {
  const qs = []; const per = drills.map((d, i) => d.n ?? Math.floor(N / drills.length) + (i < N % drills.length ? 1 : 0));
  drills.forEach((d, i) => {
    const seen = new Set();
    for (let guard = 0; per[i] > 0 && guard < 80; guard++) {
      const q = GEN[d.type](d); const k = q.html + q.opts.map(o => o.html).join("|");
      if (seen.has(k) && guard < 60) continue;
      seen.add(k); qs.push(q); per[i]--;
    }
  });
  return shuffle(qs);
}

// ---------------------------------------------------------------- 作答畫面（闖關、練習共用）
let round = null; // { qs, idx, correct, locked, title, stageId?, host, drills }
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
  if (q.hint) card.prepend(el("div", "m-q", q.hint));
  const tools = el("div", "row m-tools"); const sp = el("button", "pill", "🔊 再聽一次"); sp.onclick = () => { sfx.tap(); speakQ(q); }; tools.append(sp);
  v.append(card, tools);
  const opts = el("div", `options m-opts${q.wide ? " wide" : ""}${q.stack ? " stack" : ""} ${q.cls || ""}`);
  const finish = async ok => {
    if (ok) round.correct++;
    card.querySelectorAll(".hole").forEach(h => { h.textContent = q.ans; h.classList.add("filled"); });
    if (q.after) { card.append(el("div", "m-after", q.after)); await wait(300); await say(speakable(q.after)); }
    else if (typeof q.ans === "number" && !q.wide) await sayNum(q.ans);
    await wait(ok ? 500 : 900);
    round.idx++; round.locked = false; renderRound();
  };
  if (q.mode === "order") orderOptions(q, card, opts, finish);
  else for (const o of q.opts) {
    const b = el("button", "opt", o.html);
    b.onclick = () => {
      if (round.locked) return; round.locked = true;
      [...opts.children].forEach(x => x.disabled = true);
      const ok = o.val === q.ans;
      if (ok) {
        b.classList.add("ok"); sfx.correct();
        const r = b.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 50 });
      } else {
        b.classList.add("bad"); sfx.wrong();
        q.opts.forEach((x, i) => { if (x.val === q.ans) opts.children[i].classList.add("ok"); });
      }
      finish(ok);
    };
    opts.append(b);
  }
  v.append(opts);
  speakQ(q);
}
// 依序點卡片：q.ans = 正確順序的 val 陣列。點錯會搖一下、可以再點，但這題不算答對。
function orderOptions(q, card, opts, finish) {
  let step = 0, missed = false;
  const slots = card.querySelector(".m-slots");
  q.opts.forEach(o => {
    const b = el("button", "opt", o.html);
    b.onclick = () => {
      if (round.locked || b.classList.contains("ok")) return;
      if (o.val !== q.ans[step]) {
        missed = true; sfx.wrong(); b.classList.remove("bad"); void b.offsetWidth; b.classList.add("bad");
        return;
      }
      b.classList.remove("bad"); b.classList.add("ok"); b.append(el("span", "m-step", String(step + 1)));
      const sl = slots?.children[step]; if (sl) { sl.innerHTML = o.slot; sl.classList.add("filled"); }
      say(o.say); step++;
      if (step < q.ans.length) { sfx.tap(); return; }
      round.locked = true;
      if (!missed) { sfx.correct(); const r = card.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 60 }); }
      setTimeout(() => finish(!missed), 400);
    };
    opts.append(b);
  });
}
function summary(v) {
  const c = round.correct, n = round.qs.length, stars = c === n ? 3 : c >= n * .6 ? 2 : 1;
  const m = M(); m.played += n; m.correct += c; m.games++; store.save();
  store.addStars(stars); store.event("math"); store.event("math-ok", c);
  let msg = "";
  if (round.stageId) {
    store.event("math-book");
    const pass = c >= Math.ceil(n * 0.6);
    const { firstPass } = store.lessonResult("math:" + round.stageId, pass ? stars : 0);
    if (firstPass) { store.awardSticker(); const i = STAGES.findIndex(s => s.id === round.stageId); msg = `<p class="unlock">${i < STAGES.length - 1 ? `🔓 解鎖「${STAGES[i + 1].title}」！` : "🎉 全部過關！"}</p>`; }
    else if (!pass) msg = `<p class="unlock dim">答對 6 成以上就能過關喔</p>`;
  } else if (c === n) store.awardSticker();
  if (c === n) { sfx.win(); burst({ n: 160 }); } else sfx.correct();
  const s = el("div", "summary", `<div class="big-emoji">${c === n ? "🏆" : c >= n * .6 ? "🎉" : "💪"}</div><h3>${c === n ? "全部答對！" : c >= n * .6 ? "好厲害！" : "再試一次吧"}</h3><p>${n} 題答對 ${c} 題</p><div class="earned">${"⭐".repeat(stars)}</div>${msg}`);
  const row = el("div", "row m-sumbtns");
  const again = el("button", "btn coral", "再來一輪"); again.onclick = () => { sfx.tap(); startRound(round.host, round.title, round.drills, round.stageId); };
  const back = el("button", "btn ghost", round.stageId ? "回地圖" : "換一個");
  back.onclick = () => { sfx.tap(); const h = round.host; round = null; h === "#v-math" ? viewMap() : viewPlay(); };
  row.append(again, back); s.append(row); v.append(s);
}

// ---------------------------------------------------------------- 闖關地圖
const stageStars = id => store.lessonStars("math:" + id);
const stageOpen = id => { const i = STAGES.findIndex(s => s.id === id); return store.get().unlockAll || i <= 0 || stageStars(STAGES[i - 1].id) >= 1; };
const UCOL = ["sunny", "coral", "mint", "violet", "sky"];
const CIRCLED = "①②③④⑤⑥⑦⑧⑨";
function viewMap() {
  const v = $("#v-math");
  if (round?.host === "#v-math") return renderRound();
  v.innerHTML = "";
  v.append(el("h2", "h2", "數學闖關"), el("p", "sub", `${BOOK.name}・每關答對 6 成就能解鎖下一關`));
  const map = el("div", "map"); const nodes = []; let k = 0;
  UNITS.forEach((u, ui) => {
    const col = u.exam ? "sky" : UCOL[ui % UCOL.length];
    map.append(el("div", `map-unit ${col}`, `<b>${u.exam ? "📝 " : `${u.no}・`}${u.title}</b><span class="pg">p.${u.page}</span>`));
    u.items.forEach((st, si) => {
      const lock = !stageOpen(st.id), stars = stageStars(st.id);
      const node = el("div", `map-node ${["c", "r", "c", "l"][k++ % 4]}`);
      const label = st.review ? "★" : `${u.no}-${si + 1}`;
      const btn = el("button", `node-btn ${col}${lock ? " locked" : ""}${stars ? " cleared" : ""}`, lock ? "🔒" : `<span class="m-nlabel">${label}</span>`);
      node.append(btn, el("div", "node-cap", `<b class="m-cap">${st.review ? "" : CIRCLED[si] + " "}${st.title}</b><div class="node-stars">${[1, 2, 3].map(x => x <= stars ? "★" : "☆").join("")}</div>`));
      btn.onclick = () => {
        if (lock) { sfx.wrong(); btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake"); return toast("先完成前面的關卡，就能解鎖喔！"); }
        sfx.tap(); scrollTo({ top: 0 }); startRound("#v-math", st.title, st.drills, st.id);
      };
      map.append(node); nodes.push(btn);
    });
  });
  v.append(map);
  drawMapPath(map, nodes);
  v.append(el("p", "credit", `單元與小節依《${BOOK.name} ${BOOK.src}》目次與學習地圖，頁碼為該書頁碼。題目由本站程式產生，未收錄書中題目與插圖。`));
}

// ---------------------------------------------------------------- 自由練習
let range = 10;
try { range = +localStorage.getItem("zp.math.range") || 10; } catch {}
function viewPlay() {
  const v = $("#v-math-play");
  if (round?.host === "#v-math-play") return renderRound();
  v.innerHTML = "";
  v.append(el("h2", "h2", "數學練習"), el("p", "sub", "選一個想玩的！有 🔢 的可以選數字範圍。"));
  v.append(dailyCard(true));
  const pills = el("div", "pills range"); pills.append(el("span", "range-lbl", "🔢 範圍"));
  for (const r of [5, 10, 20, 30]) {
    const b = el("button", `pill violet${r === range ? " on" : ""}`, `${r} 以內`);
    b.onclick = () => { sfx.tap(); range = r; try { localStorage.setItem("zp.math.range", r); } catch {} viewPlay(); };
    pills.append(b);
  }
  v.append(pills);
  const g = el("div", "game-grid");
  for (const t of TYPES) {
    const c = el("button", `game-card ${t.color}`, `<span class="gi">${t.icon}</span><b>${t.name}${t.ranged ? " 🔢" : ""}</b><span>${t.desc}</span>`);
    c.onclick = () => { sfx.tap(); scrollTo({ top: 0 }); startRound("#v-math-play", t.name, t.drills || [{ type: t.type, max: t.ranged ? range : 10 }]); };
    g.append(c);
  }
  v.append(g);
}

// ---------------------------------------------------------------- 註冊
registerTasks([
  { id: "math", goal: 1, icon: "🔢", label: "完成 1 場數學練習", go: "math-play", subj: "math" },
  { id: "math-ok", goal: 6, icon: "➕", label: "數學答對 6 題", go: "math", subj: "math" },
  { id: "math-book", goal: 1, icon: "🗺️", label: "玩 1 關數學闖關", go: "math", subj: "math" },
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
