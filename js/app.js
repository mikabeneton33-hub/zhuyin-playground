import { GROUPS, SYMBOLS, TONES, SYLLABLES, INITIALS, MEDIALS, FINALS, bySymbol } from "./data.js";
import { tts, sfx } from "./audio.js";
import { burst } from "./confetti.js";
import { store } from "./store.js";
import { ANIMALS, TONE_MARK, sylText, sylKey, readingText } from "./animals.js";
import { BOOK, UNITS, TONE_LESSON, findItem } from "./textbook.js";

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
const groupColor = g => GROUPS.find(x => x.id === g).color;
// 插圖：OpenMoji（CC BY-SA 4.0），所有裝置風格一致。檔名 = 去掉 FE0F 的 codepoint。
const emojiHex = e => [...e].map(c => c.codePointAt(0)).filter(cp => cp !== 0xFE0F).map(cp => cp.toString(16).toUpperCase()).join("-");
const pic = (emoji, cls = "") => `<img class="pic ${cls}" src="img/openmoji/${emojiHex(emoji)}.svg" alt="" draggable="false" onerror="this.replaceWith(document.createTextNode('${emoji}'))">`;
const wait = ms => new Promise(r => setTimeout(r, ms));

let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800); }
function say(text) { tts.warmup(); return tts.speak(text); }
function saySym(s) { tts.warmup(); return tts.speakSymbol(s.s, s.say); }
function renderStars() { $("#stars").textContent = store.get().stars; }
addEventListener("zp:progress", renderStars);

// ================================================================= 注音表
function viewLearn() {
  const v = $("#v-learn"); v.innerHTML = "";
  v.append(el("h2", "h2", "注音表"), el("p", "sub", "點一下符號，聽發音、看例字。"));
  for (const g of GROUPS) {
    const list = SYMBOLS.filter(s => s.g === g.id);
    v.append(el("div", "group-title", `<span class="bar" style="background:var(--${g.color})"></span>${g.name}<span class="n">${list.length} 個・${g.desc}</span>`));
    const grid = el("div", "grid");
    for (const s of list) {
      const t = el("button", `tile ${g.color}`, s.s);
      t.setAttribute("aria-label", `${s.s}，例字${s.word}`);
      if (store.get().learned[s.s]) { t.classList.add("learned"); t.append(el("span", "dot", "⭐")); }
      t.onclick = () => { sfx.tap(); openSheet(s); };
      grid.append(t);
    }
    v.append(grid);
  }
}

function openSheet(s) {
  const sh = $("#sheet"), c = groupColor(s.g);
  sh.innerHTML = `<div class="grab"></div>
    <div class="big ${c}">${s.s}</div>
    <div class="word"><div class="emoji">${pic(s.emoji, "pic-lg")}</div><div class="wz"><b>${s.word}</b><span>${s.zy}</span></div></div>
    <div class="actions">
      <button class="btn ${c}" id="sh-sym">🔊 唸 ${s.s}</button>
      <button class="btn ghost" id="sh-word">🗣️ 唸「${s.word}」</button>
    </div>`;
  $("#sh-sym", sh).onclick = () => saySym(s);
  $("#sh-word", sh).onclick = () => say(s.word);
  sh.classList.add("open"); $("#backdrop").classList.add("open");
  const first = !store.get().learned[s.s];
  store.learn(s.s);
  if (first) { store.addStars(1); toast("⭐ 學到新符號 +1"); }
  saySym(s).then(() => wait(250)).then(() => say(s.word));
  viewLearn();
}
function closeSheet() { $("#sheet").classList.remove("open"); $("#backdrop").classList.remove("open"); tts.stop(); }

// ================================================================= 拼音練習
const spell = { i: null, m: null, f: null, t: 1 };
function spellKey() { return (spell.i || "") + (spell.m || "") + (spell.f || ""); }
function spellChar() { const r = SYLLABLES[spellKey()]; return r ? r[spell.t - 1] : null; }
function validFor(part, val) { // 選了這個，是否還能拼出任何字？
  const n = { ...spell, [part]: val };
  const k = (n.i || "") + (n.m || "") + (n.f || "");
  if (!k) return true;
  return Object.keys(SYLLABLES).some(s => s.startsWith(k) && (part !== "f" || s === k) && (part !== "m" || !n.f || s === k));
}
function viewSpell() {
  const v = $("#v-spell"); v.innerHTML = "";
  v.append(el("h2", "h2", "拼拼看"), el("p", "sub", "選聲母、介音、韻母和聲調，拼出一個字！"));
  const stage = el("div", "spell-stage");
  const slots = el("div", "spell-slots");
  const mk = (val, c, lab) => { const s = el("div", `slot ${c}${val ? " filled" : ""}`, val || "·"); s.append(el("small", "", lab)); return s; };
  const ch = spellChar(); const k = spellKey();
  slots.append(mk(spell.i, "coral", "聲母"), mk(spell.m, "mint", "介音"), mk(spell.f, "sunny", "韻母"));
  const ts = el("div", `slot tone violet${spell.t ? " filled" : ""}`, TONES[spell.t - 1].mark || "ˉ"); ts.append(el("small", "", "聲調")); slots.append(ts);
  slots.append(el("div", "equals", "="));
  const res = el("div", `result${ch ? "" : " empty"}`, ch || (k ? "這個音<br>沒有字" : "選一選"));
  slots.append(res); stage.append(slots);
  const act = el("div", "row", ""); act.style.marginTop = "16px";
  const speak = el("button", "btn violet", "🔊 唸出來"); speak.disabled = !ch;
  speak.onclick = () => { res.classList.remove("pop"); void res.offsetWidth; res.classList.add("pop"); say(ch).then(() => { store.spelled(); if (store.get().spell.count % 5 === 0) { store.addStars(1); toast("⭐ 拼了 5 個字 +1"); } }); };
  const clear = el("button", "btn ghost", "清除"); clear.style.flex = "0 0 auto";
  clear.onclick = () => { Object.assign(spell, { i: null, m: null, f: null, t: 1 }); sfx.tap(); viewSpell(); };
  act.append(speak, clear); stage.append(act); v.append(stage);

  const row = (title, c, items, part, isTone) => {
    const w = el("div", "spell-row"); w.append(el("h4", "", `<span class="bar" style="width:8px;height:16px;border-radius:4px;background:var(--${c});display:inline-block"></span>${title}`));
    const chips = el("div", "chips");
    for (const it of items) {
      const val = isTone ? it.n : it;
      const chip = el("button", `chip ${c}${isTone ? " tone-chip" : ""}`, isTone ? `${it.mark || "ˉ"}<small>${it.name}</small>` : it);
      if ((isTone ? spell.t : spell[part]) === val) chip.classList.add("on");
      if (!isTone && spell[part] !== val && !validFor(part, val)) chip.classList.add("dim");
      chip.onclick = () => { sfx.tap(); if (isTone) spell.t = val; else spell[part] = spell[part] === val ? null : val; viewSpell(); const c2 = spellChar(); if (c2) say(c2); };
      chips.append(chip);
    }
    w.append(chips); return w;
  };
  v.append(row("聲母", "coral", INITIALS, "i"), row("介音", "mint", MEDIALS, "m"), row("韻母", "sunny", FINALS, "f"), row("聲調", "violet", TONES, "t", true));
}

// ================================================================= 聽音辨認
const QUIZ_N = 8;
let quiz = null;
function newQuiz() {
  const pool = shuffle(SYMBOLS).slice(0, QUIZ_N);
  quiz = { qs: pool.map(ans => ({ ans, opts: shuffle([ans, ...shuffle(SYMBOLS.filter(s => s !== ans && s.g === ans.g)).slice(0, 3)]) })), idx: 0, correct: 0, locked: false };
}
function viewQuiz() {
  const v = $("#v-quiz"); v.innerHTML = "";
  if (!quiz) newQuiz();
  if (quiz.idx >= quiz.qs.length) return quizSummary(v);
  const q = quiz.qs[quiz.idx];
  v.append(el("h2", "h2", "聽聽看"), el("p", "sub", "聽聲音，點出正確的注音符號。"));
  v.append(el("div", "quiz-top", `<span>第 ${quiz.idx + 1} / ${quiz.qs.length} 題</span><span>答對 ${quiz.correct}</span>`));
  const pb = el("div", "progressbar", `<i style="width:${quiz.idx / quiz.qs.length * 100}%"></i>`); v.append(pb);
  const sp = el("button", "speaker", "🔊"); sp.setAttribute("aria-label", "再聽一次");
  const play = async () => { sp.classList.add("playing"); await saySym(q.ans); await wait(200); await say(q.ans.word); sp.classList.remove("playing"); };
  sp.onclick = play; v.append(sp, el("div", "speaker-hint", "點喇叭再聽一次"));
  const opts = el("div", "options");
  for (const o of q.opts) {
    const b = el("button", "opt", o.s);
    b.onclick = async () => {
      if (quiz.locked) return; quiz.locked = true;
      [...opts.children].forEach(x => x.disabled = true);
      if (o === q.ans) {
        b.classList.add("ok"); sfx.correct(); quiz.correct++;
        const r = b.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 50 });
        await wait(800);
      } else {
        b.classList.add("bad"); sfx.wrong();
        [...opts.children].find(x => x.textContent === q.ans.s).classList.add("ok");
        await say(`是 ${q.ans.say}，${q.ans.word}`); await wait(500);
      }
      quiz.idx++; quiz.locked = false; viewQuiz();
    };
    opts.append(b);
  }
  v.append(opts);
  setTimeout(play, 350);
}
function quizSummary(v) {
  const c = quiz.correct, n = quiz.qs.length, stars = c === n ? 3 : c >= n * .6 ? 2 : 1;
  store.quizResult(c, n); store.addStars(stars);
  if (c === n) { sfx.win(); burst({ n: 160 }); } else sfx.correct();
  const s = el("div", "summary", `<div class="big-emoji">${c === n ? "🏆" : c >= n * .6 ? "🎉" : "💪"}</div>
    <h3>${c === n ? "全部答對！" : c >= n * .6 ? "好厲害！" : "再試一次吧"}</h3><p>${n} 題答對 ${c} 題</p>
    <div class="earned">${"⭐".repeat(stars)}</div>`);
  const b = el("button", "btn coral", "再玩一次"); b.onclick = () => { sfx.tap(); newQuiz(); viewQuiz(); };
  s.append(b); v.append(s);
}

// ================================================================= 配對遊戲
let match = null;
function newMatch() {
  const n = innerWidth >= 640 ? 9 : 6;
  const picks = shuffle(SYMBOLS).slice(0, n);
  const cards = shuffle([...picks.map(s => ({ k: s.s, type: "sym", s }), ), ...picks.map(s => ({ k: s.s, type: "pic", s }))]);
  match = { cards, open: [], done: new Set(), moves: 0, lock: false };
}
function viewMatch() {
  const v = $("#v-match"); v.innerHTML = "";
  if (!match) newMatch();
  v.append(el("h2", "h2", "翻翻樂"), el("p", "sub", "把注音符號和它的例字配成一對。"));
  const top = el("div", "match-top", `<span>翻了 ${match.moves} 次</span><span>配對 ${match.done.size} / ${match.cards.length / 2}</span>`);
  const re = el("button", "pill", "🔄 重新開始"); re.onclick = () => { sfx.tap(); newMatch(); viewMatch(); }; top.append(re); v.append(top);
  const board = el("div", "board");
  match.cards.forEach((c, i) => {
    const card = el("button", "card"); card.setAttribute("aria-label", c.type === "sym" ? `卡片 ${c.s.s}` : `卡片 ${c.s.word}`);
    const front = c.type === "sym" ? `<span>${c.s.s}</span>` : `<span class="em">${pic(c.s.emoji, "pic-md")}</span><span class="w">${c.s.word}</span>`;
    card.innerHTML = `<div class="inner"><div class="face back"></div><div class="face front">${front}</div></div>`;
    if (match.done.has(c.k)) card.classList.add("done");
    if (match.open.includes(i)) card.classList.add("flipped");
    card.onclick = async () => {
      if (match.lock || match.done.has(c.k) || match.open.includes(i)) return;
      sfx.flip(); card.classList.add("flipped"); match.open.push(i);
      c.type === "sym" ? saySym(c.s) : say(c.s.word);
      if (match.open.length < 2) return;
      match.lock = true; match.moves++;
      const [a, b] = match.open.map(j => match.cards[j]);
      await wait(650);
      if (a.k === b.k && a.type !== b.type) {
        match.done.add(a.k); sfx.correct();
        const r = card.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 30, spread: 6 });
      } else sfx.wrong();
      match.open = []; match.lock = false;
      if (match.done.size === match.cards.length / 2) {
        store.matchWin(match.moves); store.addStars(2); sfx.win(); burst({ n: 160 });
        await wait(600);
        v.innerHTML = "";
        const s = el("div", "summary", `<div class="big-emoji">🥳</div><h3>全部配對成功！</h3><p>一共翻了 ${match.moves} 次${store.get().match.bestMoves === match.moves ? "，新紀錄！" : ""}</p><div class="earned">⭐⭐</div>`);
        const bb = el("button", "btn mint", "再玩一次"); bb.onclick = () => { sfx.tap(); newMatch(); viewMatch(); }; s.append(bb); v.append(s);
        return;
      }
      viewMatch();
    };
    board.append(card);
  });
  v.append(board);
}


// ================================================================= 小一動物復習
const ANIMAL_TONES = [...TONES, { n: 5, mark: "˙", name: "輕聲", hint: "輕輕的" }];
const ANIMAL_N = 8;
let an = null; // { mode: "pick"|"spell", list, idx, correct, ... }
function zyHTML(syls, cls = "") {
  return `<div class="zy ${cls}">${syls.map(sy => `<div class="zy-syl${sy.t === 5 ? " light" : ""}">
    ${sy.t === 5 ? `<i class="tone top">˙</i>` : ""}
    <span class="zy-col">${[sy.i, sy.m, sy.f].filter(Boolean).map(ch => `<b>${ch}</b>`).join("")}</span>
    ${sy.t > 1 && sy.t < 5 ? `<i class="tone">${TONE_MARK[sy.t]}</i>` : ""}</div>`).join("")}</div>`;
}
function newAnimals(mode) {
  an = { mode, list: shuffle(ANIMALS).slice(0, ANIMAL_N), idx: 0, correct: 0, locked: false, cur: null, sylIdx: 0, done: [] };
}
function mutateReading(syls) { // 產生一個「像但不對」的注音
  const out = syls.map(x => ({ ...x }));
  const k = Math.random() * out.length | 0, sy = out[k];
  const r = Math.random();
  if (r < 0.4) { const ts = [1, 2, 3, 4].filter(t => t !== sy.t); sy.t = ts[Math.random() * ts.length | 0]; }
  else if (r < 0.7 && sy.f) { const fs = FINALS.filter(f => f !== sy.f); sy.f = fs[Math.random() * fs.length | 0]; }
  else if (sy.i) { const is = INITIALS.filter(i => i !== sy.i); sy.i = is[Math.random() * is.length | 0]; }
  else { const ms = MEDIALS.filter(m => m !== sy.m); sy.m = ms[Math.random() * ms.length | 0]; }
  return out;
}
function pickOptions(a) {
  const key = x => x.map(sylKey).join(" ");
  const seen = new Set([key(a.syl)]); const opts = [a.syl];
  let guard = 0;
  while (opts.length < 3 && guard++ < 50) {
    let cand = Math.random() < 0.3 ? ANIMALS[Math.random() * ANIMALS.length | 0].syl : mutateReading(a.syl);
    if (cand.length !== a.syl.length) cand = mutateReading(a.syl);
    if (!seen.has(key(cand))) { seen.add(key(cand)); opts.push(cand); }
  }
  return shuffle(opts);
}
function viewAnimals() {
  const v = $("#v-animals"); v.innerHTML = "";
  v.append(el("h2", "h2", "小一動物復習"), el("p", "sub", "課本裡的動物，拼音都記得嗎？"));
  const pills = el("div", "pills");
  for (const [m, label, c] of [["pick", "👀 選一選", "coral"], ["spell", "⌨️ 拼一拼", "violet"]]) {
    const b = el("button", `pill ${c}${an?.mode === m ? " on" : ""}`, label);
    b.onclick = () => { sfx.tap(); newAnimals(m); viewAnimals(); }; pills.append(b);
  }
  v.append(pills);
  if (!an) { v.append(el("div", "empty-hint", "選一種玩法開始：<b>選一選</b>看動物挑出正確注音；<b>拼一拼</b>自己用注音鍵盤拼出來。")); return; }
  if (an.idx >= an.list.length) return animalsSummary(v);
  const a = an.list[an.idx];
  v.append(el("div", "quiz-top", `<span>第 ${an.idx + 1} / ${an.list.length} 題</span><span>答對 ${an.correct}</span>`));
  v.append(el("div", "progressbar", `<i style="width:${an.idx / an.list.length * 100}%"></i>`));
  const hero = el("button", "animal-hero", `<span class="em">${pic(a.emoji, "pic-xl")}</span><span class="nm">${a.name}</span><span class="hint">🔊 點我聽</span>`);
  hero.onclick = () => say(a.say); v.append(hero);
  if (an.mode === "pick") animalsPick(v, a); else animalsSpell(v, a);
  if (an.idx === 0 && !an.spoke) { an.spoke = true; setTimeout(() => say(a.say), 300); }
}
function animalsPick(v, a) {
  if (!an.opts) an.opts = pickOptions(a);
  const wrap = el("div", "zy-options");
  const correctKey = a.syl.map(sylKey).join(" ");
  for (const o of an.opts) {
    const b = el("button", "zy-opt", zyHTML(o));
    b.onclick = async () => {
      if (an.locked) return; an.locked = true; [...wrap.children].forEach(x => x.disabled = true);
      const ok = o.map(sylKey).join(" ") === correctKey;
      if (ok) { b.classList.add("ok"); sfx.correct(); an.correct++; const r = b.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 50 }); await say(a.say); await wait(300); }
      else { b.classList.add("bad"); sfx.wrong(); [...wrap.children].find(x => x.dataset.k === correctKey).classList.add("ok"); await say(a.say); await wait(900); }
      an.idx++; an.opts = null; an.locked = false; say(an.list[an.idx]?.say); viewAnimals();
    };
    b.dataset.k = o.map(sylKey).join(" "); wrap.append(b);
  }
  v.append(wrap);
}
function animalsSpell(v, a) {
  if (!an.cur) { an.cur = { i: null, m: null, f: null, t: 1 }; an.sylIdx = 0; an.done = []; }
  const target = a.syl[an.sylIdx];
  const stage = el("div", "spell-stage");
  // 已完成的字 + 目前的字
  const line = el("div", "zy-progress");
  line.innerHTML = a.syl.map((sy, i) => i < an.sylIdx ? zyHTML([sy], "small done") : i === an.sylIdx ? `<div class="zy small now">第 ${i + 1} 個字</div>` : `<div class="zy small todo">?</div>`).join("");
  stage.append(line);
  const slots = el("div", "spell-slots");
  const mk = (val, c, lab) => { const sl = el("div", `slot ${c}${val ? " filled" : ""}`, val || "·"); sl.append(el("small", "", lab)); return sl; };
  const c = an.cur;
  slots.append(mk(c.i, "coral", "聲母"), mk(c.m, "mint", "介音"), mk(c.f, "sunny", "韻母"));
  const ts = el("div", "slot tone violet filled", ANIMAL_TONES[c.t - 1].mark || "ˉ"); ts.append(el("small", "", "聲調")); slots.append(ts);
  stage.append(slots);
  const act = el("div", "row"); act.style.marginTop = "6px";
  const ok = el("button", "btn violet", an.sylIdx + 1 < a.syl.length ? "✓ 下一個字" : "✓ 完成");
  ok.disabled = !(c.i || c.m || c.f);
  ok.onclick = async () => {
    const right = (c.i || "") === target.i && (c.m || "") === target.m && (c.f || "") === target.f && c.t === target.t;
    if (!right) {
      sfx.wrong(); stage.classList.add("shake"); setTimeout(() => stage.classList.remove("shake"), 450);
      an.miss = (an.miss || 0) + 1;
      if (an.miss >= 2) { toast(`提示：第 ${an.sylIdx + 1} 個字是 ${sylText(target)}`); }
      return;
    }
    sfx.correct(); an.miss = 0; an.sylIdx++; an.cur = { i: null, m: null, f: null, t: 1 };
    if (an.sylIdx >= a.syl.length) {
      an.correct++; burst({ n: 90 }); await say(a.say); await wait(400);
      an.idx++; an.cur = null; say(an.list[an.idx]?.say);
    }
    viewAnimals();
  };
  const clr = el("button", "btn ghost", "清除"); clr.style.flex = "0 0 auto"; clr.onclick = () => { an.cur = { i: null, m: null, f: null, t: 1 }; viewAnimals(); };
  act.append(ok, clr); stage.append(act); v.append(stage);
  const row = (title, col, items, part, isTone) => {
    const w = el("div", "spell-row"); w.append(el("h4", "", `<span style="width:8px;height:16px;border-radius:4px;background:var(--${col});display:inline-block"></span>${title}`));
    const chips = el("div", "chips");
    for (const it of items) {
      const val = isTone ? it.n : it;
      const chip = el("button", `chip ${col}${isTone ? " tone-chip" : ""}`, isTone ? `${it.mark || "ˉ"}<small>${it.name}</small>` : it);
      if ((isTone ? c.t : c[part]) === val) chip.classList.add("on");
      chip.onclick = () => { sfx.tap(); if (isTone) c.t = val; else c[part] = c[part] === val ? null : val; viewAnimals(); };
      chips.append(chip);
    }
    w.append(chips); return w;
  };
  v.append(row("聲母", "coral", INITIALS, "i"), row("介音", "mint", MEDIALS, "m"), row("韻母", "sunny", FINALS, "f"), row("聲調", "violet", ANIMAL_TONES, "t", true));
}
function animalsSummary(v) {
  const c = an.correct, n = an.list.length, stars = c === n ? 3 : c >= n * .6 ? 2 : 1;
  store.addStars(stars); store.animals(an.mode, c, n);
  if (c === n) { sfx.win(); burst({ n: 160 }); } else sfx.correct();
  const s = el("div", "summary", `<div class="big-emoji">${c === n ? "🏆" : "🐾"}</div><h3>${c === n ? "全部答對！" : "做得好！"}</h3><p>${n} 隻動物答對 ${c} 隻</p><div class="earned">${"⭐".repeat(stars)}</div>`);
  const b = el("button", "btn coral", "再來一輪"); b.onclick = () => { sfx.tap(); newAnimals(an.mode); viewAnimals(); }; s.append(b); v.append(s);
}


// ================================================================= 課本（南一首冊）
function parseZy(z) { // "˙ㄇㄚ" / "ㄊㄚˊ" -> {i,m,f,t}
  let t = 1;
  if (z.startsWith("˙")) { t = 5; z = z.slice(1); }
  const last = z.slice(-1), tm = { "ˊ": 2, "ˇ": 3, "ˋ": 4 };
  if (tm[last]) { t = tm[last]; z = z.slice(0, -1); }
  const o = { i: "", m: "", f: "", t };
  for (const ch of z) { if (INITIALS.includes(ch)) o.i = ch; else if (MEDIALS.includes(ch)) o.m = ch; else if (FINALS.includes(ch)) o.f = ch; }
  return o;
}
const zyLine = z => z.trim().split(/\s+/).filter(Boolean).map(parseZy);
let bookAt = null; // null = 目錄；否則 item id
function viewBook() {
  const v = $("#v-book"); v.innerHTML = "";
  if (bookAt) return bookDetail(v, findItem(bookAt));
  v.append(el("h2", "h2", "課本"), el("p", "sub", `${BOOK.name}・${BOOK.grade}`));
  for (const u of UNITS) {
    const t = el("div", "group-title", `<span class="bar" style="background:var(--violet)"></span>${u.title}`);
    if (u.zy) t.insertAdjacentHTML("beforeend", `<span class="unit-zy">${zyHTML(zyLine(u.zy), "tiny")}</span>`);
    v.append(t);
    const list = el("div", "book-list");
    for (const it of u.items) {
      const c = el("button", `book-item ${it.kind}${it.todo ? " todo" : ""}`);
      const tag = it.no ? `<span class="no">第${it.no}課</span>` : `<span class="no ic">${it.kind === "tones" ? "🎵" : it.kind === "review" ? "⭐" : "🏠"}</span>`;
      c.innerHTML = `${tag}<span class="ttl">${it.zy ? zyHTML(zyLine(it.zy), "row") : `<span class="pending">課名待補</span>`}</span><span class="pg">p.${it.page}</span>`;
      c.onclick = () => { sfx.tap(); if (it.kind === "link") return go(it.to); bookAt = it.id; viewBook(); scrollTo({ top: 0 }); if (it.say) say(it.say); };
      list.append(c);
    }
    v.append(list);
  }
  v.append(el("p", "credit", "課名與練習依南一版國語首冊整理，僅收錄注音練習所需的短句。"));
}
function backBtn(v) { const b = el("button", "pill", "← 回目錄"); b.onclick = () => { sfx.tap(); bookAt = null; tts.stop(); viewBook(); }; v.append(b); }
function bookDetail(v, it) {
  backBtn(v);
  if (it.kind === "tones") return bookTones(v);
  const head = el("div", "lesson-head");
  head.innerHTML = `<div class="kicker">${it.no ? `第${it.no}課` : it.kind === "review" ? "複習" : ""}・課本 p.${it.page}</div>`;
  if (it.zy) {
    const title = el("button", "lesson-title", zyHTML(zyLine(it.zy), "big"));
    title.onclick = () => say(it.say); head.append(title, el("div", "hint-s", "點標題聽一次"));
  } else head.append(el("div", "empty-hint", "這一課的課名照片看不清楚，請拍課本這一頁給我補上。"));
  v.append(head);
  if (it.kind === "review") return bookReview(v, it);
  const lines = it.lines || [];
  if (!lines.length) { v.append(el("div", "empty-hint", "這一課的練習句還沒加入。拍課本這一課的內容頁給我，就能做成跟讀和拼音練習。")); return; }
  v.append(el("div", "group-title", "跟著唸"));
  const wrap = el("div", "lines");
  lines.forEach((ln, i) => {
    const row = el("button", "line", `<span class="ln">${i + 1}</span>${zyHTML(zyLine(ln.zy), "row")}<span class="play">🔊</span>`);
    row.onclick = async () => { sfx.tap(); row.classList.add("playing"); await say(ln.say); row.classList.remove("playing"); };
    wrap.append(row);
  });
  v.append(wrap);
  const all = el("button", "btn violet", "▶ 全部唸一次"); all.style.marginTop = "14px";
  all.onclick = async () => { for (const [i, ln] of lines.entries()) { const r = wrap.children[i]; r.classList.add("playing"); await say(ln.say); r.classList.remove("playing"); await wait(350); } };
  v.append(all);
}
function bookTones(v) {
  v.append(el("h2", "h2", "聲調教學"), el("p", "sub", "跟著動作一起唸：ㄇㄚ、ㄇㄚˊ、ㄇㄚˇ、ㄇㄚˋ、˙ㄇㄚ"));
  const g = el("div", "tone-grid");
  for (const t of TONE_LESSON) {
    const c = el("button", `tone-card t${t.n}`);
    c.innerHTML = `<div class="tc-top"><span class="tc-mark">${t.mark}</span><span class="tc-name">${t.name}</span></div>
      <svg class="tc-curve" viewBox="0 0 100 100" aria-hidden="true"><path d="${t.path}"/></svg>
      <div class="tc-shape">聲調${t.shape}</div><div class="tc-move">${t.move}</div>
      <div class="tc-ex">${zyHTML([parseZy(t.ex)], "tiny")}</div>`;
    c.onclick = () => { sfx.tap(); c.classList.remove("go"); void c.offsetWidth; c.classList.add("go"); say(t.say); };
    g.append(c);
  }
  v.append(g);
  const all = el("button", "btn violet", "▶ 一到四聲連著唸"); all.style.marginTop = "14px";
  all.onclick = async () => { for (const [i, t] of TONE_LESSON.slice(0, 4).entries()) { const c = g.children[i]; c.classList.add("go"); await say(t.say); c.classList.remove("go"); await wait(250); } };
  v.append(all);
}
function bookReview(v, it) {
  const ls = it.lessons.map(findItem).filter(x => x?.zy);
  v.append(el("div", "group-title", "這個單元的課"));
  const list = el("div", "book-list");
  for (const l of ls) { const c = el("button", "book-item lesson", `<span class="no">第${l.no}課</span><span class="ttl">${zyHTML(zyLine(l.zy), "row")}</span>`); c.onclick = () => { bookAt = l.id; viewBook(); say(l.say); }; list.append(c); }
  v.append(list);
  const q = el("button", "btn coral", "👂 去聽聽看測驗"); q.style.marginTop = "14px"; q.onclick = () => go("quiz"); v.append(q);
}

// ================================================================= 我的進度
function viewProgress() {
  const v = $("#v-progress"); v.innerHTML = ""; const d = store.get();
  v.append(el("h2", "h2", "我的星星"), el("p", "sub", "進度只存在這台裝置上。"));
  const acc = d.quiz.played ? Math.round(d.quiz.correct / d.quiz.played * 100) : 0;
  v.append(el("div", "statgrid", `
    <div class="stat"><div class="v">⭐ ${d.stars}</div><div class="k">總星星</div></div>
    <div class="stat"><div class="v">${store.learnedCount()}<span style="font-size:16px;color:var(--ink-2)"> / 37</span></div><div class="k">學過的符號</div></div>
    <div class="stat"><div class="v">${acc}%</div><div class="k">聽音答對率（${d.quiz.played} 題）</div></div>
    <div class="stat"><div class="v">${(d.animals?.correct) || 0}<span style="font-size:16px;color:var(--ink-2)"> / ${(d.animals?.played) || 0}</span></div><div class="k">動物復習答對</div></div>
    <div class="stat"><div class="v">${d.match.wins}</div><div class="k">翻翻樂完成次數${d.match.bestMoves != null ? `・最佳 ${d.match.bestMoves} 次` : ""}</div></div>`));
  v.append(el("div", "group-title", "學過的符號"));
  const g = el("div", "learned-grid"); for (const s of SYMBOLS) g.append(el("span", d.learned[s.s] ? "y" : "", s.s)); v.append(g);
  v.append(el("p", "credit", '插圖：<a href="https://openmoji.org" target="_blank" rel="noopener">OpenMoji</a>（CC BY-SA 4.0）・發音：裝置內建語音'));
  const r = el("button", "btn ghost", "清除所有進度"); r.style.marginTop = "22px";
  r.onclick = () => { if (confirm("確定要清除所有星星和進度嗎？")) { store.reset(); viewProgress(); viewLearn(); toast("已清除"); } };
  v.append(r);
}

// ================================================================= 路由 / 啟動
const VIEWS = { learn: viewLearn, book: viewBook, spell: viewSpell, quiz: viewQuiz, match: viewMatch, animals: viewAnimals, progress: viewProgress };
function go(name, push = true) {
  tts.stop(); closeSheet();
  document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x.id === "v-" + name));
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x.dataset.v === name));
  if (name === "book" && push) bookAt = null;
  VIEWS[name]?.();
  if (push) history.replaceState(null, "", "#" + name);
  scrollTo({ top: 0, behavior: "smooth" });
}
function inAppBrowser() {
  const ua = navigator.userAgent;
  return /\bLine\//i.test(ua) || /FBAN|FBAV|Instagram|MicroMessenger/i.test(ua) || (/\bwv\b/.test(ua) && /Android/.test(ua));
}
function showBrowserBanner() {
  if (!inAppBrowser() || location.search.includes("openExternalBrowser")) return;
  const u = new URL(location.href); u.searchParams.set("openExternalBrowser", "1");
  const b = el("div", "empty-hint", `🔈 在 LINE 等 App 內建瀏覽器裡可能沒有聲音。<br><a href="${u.href}" target="_blank" rel="noopener" style="color:inherit;font-weight:900;text-decoration:underline">用 Chrome / Safari 開啟 →</a>`);
  $("main").prepend(b);
}
function boot() {
  renderStars();
  showBrowserBanner();
  document.querySelectorAll(".tab").forEach(t => t.onclick = () => { sfx.tap(); go(t.dataset.v); });
  $("#backdrop").onclick = closeSheet;
  $("#starsbtn").onclick = () => { sfx.tap(); go("progress"); };
  const m = $("#mute"); const paint = () => m.textContent = sfx.muted ? "🔇" : "🔊";
  paint(); m.onclick = () => { sfx.toggle(); paint(); toast(sfx.muted ? "音效已關閉（發音仍會播放）" : "音效已開啟"); };
  go(location.hash.replace("#", "") in VIEWS ? location.hash.slice(1) : "learn", false);
  if (!tts.supported) toast("這個瀏覽器不支援語音，請改用 Chrome / Safari");
  else setTimeout(() => { if (!tts.hasZhVoice) toast("找不到中文語音，請到系統設定安裝「中文（台灣）」語音"); }, 1500);
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
}
boot();
