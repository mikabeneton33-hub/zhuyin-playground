import { GROUPS, SYMBOLS, TONES, SYLLABLES, INITIALS, MEDIALS, FINALS, bySymbol } from "./data.js";
import { tts, sfx } from "./audio.js";
import { burst } from "./confetti.js";
import { store } from "./store.js";

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
const groupColor = g => GROUPS.find(x => x.id === g).color;
const wait = ms => new Promise(r => setTimeout(r, ms));

let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800); }
function say(text) { tts.warmup(); return tts.speak(text); }
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
    <div class="word"><div class="emoji">${s.emoji}</div><div class="wz"><b>${s.word}</b><span>${s.zy}</span></div></div>
    <div class="actions">
      <button class="btn ${c}" id="sh-sym">🔊 唸 ${s.s}</button>
      <button class="btn ghost" id="sh-word">🗣️ 唸「${s.word}」</button>
    </div>`;
  $("#sh-sym", sh).onclick = () => say(s.say);
  $("#sh-word", sh).onclick = () => say(s.word);
  sh.classList.add("open"); $("#backdrop").classList.add("open");
  const first = !store.get().learned[s.s];
  store.learn(s.s);
  if (first) { store.addStars(1); toast("⭐ 學到新符號 +1"); }
  say(s.say).then(() => wait(250)).then(() => say(s.word));
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
  const play = async () => { sp.classList.add("playing"); await say(q.ans.say); await wait(200); await say(q.ans.word); sp.classList.remove("playing"); };
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
    const front = c.type === "sym" ? `<span>${c.s.s}</span>` : `<span class="em">${c.s.emoji}</span><span class="w">${c.s.word}</span>`;
    card.innerHTML = `<div class="inner"><div class="face back"></div><div class="face front">${front}</div></div>`;
    if (match.done.has(c.k)) card.classList.add("done");
    if (match.open.includes(i)) card.classList.add("flipped");
    card.onclick = async () => {
      if (match.lock || match.done.has(c.k) || match.open.includes(i)) return;
      sfx.flip(); card.classList.add("flipped"); match.open.push(i);
      say(c.type === "sym" ? c.s.say : c.s.word);
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

// ================================================================= 我的進度
function viewProgress() {
  const v = $("#v-progress"); v.innerHTML = ""; const d = store.get();
  v.append(el("h2", "h2", "我的星星"), el("p", "sub", "進度只存在這台裝置上。"));
  const acc = d.quiz.played ? Math.round(d.quiz.correct / d.quiz.played * 100) : 0;
  v.append(el("div", "statgrid", `
    <div class="stat"><div class="v">⭐ ${d.stars}</div><div class="k">總星星</div></div>
    <div class="stat"><div class="v">${store.learnedCount()}<span style="font-size:16px;color:var(--ink-2)"> / 37</span></div><div class="k">學過的符號</div></div>
    <div class="stat"><div class="v">${acc}%</div><div class="k">聽音答對率（${d.quiz.played} 題）</div></div>
    <div class="stat"><div class="v">${d.match.wins}</div><div class="k">翻翻樂完成次數${d.match.bestMoves != null ? `・最佳 ${d.match.bestMoves} 次` : ""}</div></div>`));
  v.append(el("div", "group-title", "學過的符號"));
  const g = el("div", "learned-grid"); for (const s of SYMBOLS) g.append(el("span", d.learned[s.s] ? "y" : "", s.s)); v.append(g);
  const r = el("button", "btn ghost", "清除所有進度"); r.style.marginTop = "22px";
  r.onclick = () => { if (confirm("確定要清除所有星星和進度嗎？")) { store.reset(); viewProgress(); viewLearn(); toast("已清除"); } };
  v.append(r);
}

// ================================================================= 路由 / 啟動
const VIEWS = { learn: viewLearn, spell: viewSpell, quiz: viewQuiz, match: viewMatch, progress: viewProgress };
function go(name, push = true) {
  tts.stop(); closeSheet();
  document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x.id === "v-" + name));
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x.dataset.v === name));
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
  const m = $("#mute"); const paint = () => m.textContent = sfx.muted ? "🔇" : "🔊";
  paint(); m.onclick = () => { sfx.toggle(); paint(); toast(sfx.muted ? "音效已關閉（發音仍會播放）" : "音效已開啟"); };
  go(location.hash.replace("#", "") in VIEWS ? location.hash.slice(1) : "learn", false);
  if (!tts.supported) toast("這個瀏覽器不支援語音，請改用 Chrome / Safari");
  else setTimeout(() => { if (!tts.hasZhVoice) toast("找不到中文語音，請到系統設定安裝「中文（台灣）」語音"); }, 1500);
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
}
boot();
