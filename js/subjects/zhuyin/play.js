// 遊戲樂園：聲調耳朵、注音打地鼠、找不同、寫寫看、我也會唸，以及每日任務卡。
// 由 app.js 呼叫 makePlay(ctx) 注入共用工具，避免循環 import。
import { dailyCard } from "../../core/daily.js";

export function makePlay(ctx) {
  const { $, el, shuffle, wait, toast, sayW, saySym, sfx, burst, store, pic, zyHTML, zyLine, go, voice,
    SYMBOLS, SYLLABLES, INITIALS, ANIMALS, WORDS, readingText, symbolsUpTo, unlockedUpTo, LESSON_WORDS, LESSON_ORDER, TONE_LESSON } = ctx;
  const MARK = ["", "ˊ", "ˇ", "ˋ"];
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearAll = () => { timers.forEach(clearTimeout); timers.clear(); };

  // ------------------------------------------------------------ 共用：課次選擇
  function rangePicker(cur, onPick) {
    const max = unlockedUpTo();
    const w = el("div", "pills range");
    w.append(el("span", "range-lbl", "範圍"));
    for (let n = 1; n <= 9; n++) {
      const b = el("button", `pill violet${n === cur ? " on" : ""}${n > max ? " locked" : ""}`, n === 9 ? "全部" : `到第${n}課`);
      b.onclick = () => { if (n > max) { sfx.wrong(); return toast("先在課本完成前一課，就能解鎖喔！"); } sfx.tap(); onPick(n); };
      w.append(b);
    }
    return w;
  }

  // ============================================================ 遊戲樂園首頁
  const GAMES = [
    { v: "tone", icon: "👂", name: "聲調耳朵", desc: "聽真人唸一個字，猜是第幾聲", color: "violet" },
    { v: "mole", icon: "🔨", name: "注音打地鼠", desc: "聽到哪個音，就打哪隻地鼠", color: "coral" },
    { v: "odd", icon: "🔍", name: "找不同", desc: "哪一個開頭的音不一樣？", color: "mint" },
    { v: "write", icon: "✍️", name: "寫寫看", desc: "用手指描注音符號", color: "sunny" },
    { v: "echo", icon: "🎙️", name: "我也會唸", desc: "聽老師唸，再錄自己的聲音", color: "sky" },
    { v: "quiz", icon: "🎧", name: "聽聽看", desc: "聽聲音選出注音符號", color: "violet" },
    { v: "match", icon: "🃏", name: "翻翻樂", desc: "符號和圖片配成一對", color: "coral" },
    { v: "animals", icon: "🦁", name: "動物復習", desc: "94 種動物的注音", color: "mint" },
  ];
  function viewGames() {
    const v = $("#v-games"); v.innerHTML = "";
    v.append(el("h2", "h2", "遊戲樂園"), el("p", "sub", "選一個想玩的！"));
    v.append(dailyCard(true));
    const g = el("div", "game-grid");
    for (const it of GAMES) {
      const c = el("button", `game-card ${it.color}`, `<span class="gi">${it.icon}</span><b>${it.name}</b><span>${it.desc}</span>`);
      c.onclick = () => { sfx.tap(); go(it.v); };
      g.append(c);
    }
    v.append(g);
  }

  // ============================================================ 聲調耳朵
  let tonePool = null, tg = null;
  function buildTonePool() {
    if (tonePool) return tonePool;
    const byTone = { 1: [], 2: [], 3: [], 4: [] };
    for (const [k, arr] of Object.entries(SYLLABLES)) arr.forEach((ch, i) => { if (ch && voice.hasHuman(ch, k + MARK[i])) byTone[i + 1].push({ ch, key: k, t: i + 1 }); });
    return (tonePool = byTone);
  }
  function newTone() {
    const p = buildTonePool();
    const order = shuffle([1, 2, 3, 4, 1, 2, 3, 4, 2, 3]);
    tg = { qs: order.map(t => p[t][Math.random() * p[t].length | 0]), idx: 0, correct: 0, locked: false };
  }
  const curve = n => `<svg class="mini-curve t${n}" viewBox="0 0 100 100" aria-hidden="true"><path d="${TONE_LESSON[n - 1].path}"/></svg>`;
  function viewTone() {
    const v = $("#v-tone"); v.innerHTML = "";
    if (!tg) newTone();
    v.append(el("h2", "h2", "聲調耳朵"), el("p", "sub", "聽真人唸一個字，它是第幾聲？"));
    if (tg.idx >= tg.qs.length) return summary(v, tg.correct, tg.qs.length, () => { newTone(); viewTone(); }, "tone");
    const q = tg.qs[tg.idx];
    v.append(el("div", "quiz-top", `<span>第 ${tg.idx + 1} / ${tg.qs.length} 題</span><span>答對 ${tg.correct}</span>`));
    v.append(el("div", "progressbar", `<i style="width:${tg.idx / tg.qs.length * 100}%"></i>`));
    const sp = el("button", "speaker", "🔊");
    const play = async () => { sp.classList.add("playing"); await sayW(q.ch, q.key + MARK[q.t - 1], q.ch, { human: true }); sp.classList.remove("playing"); };
    sp.onclick = play; v.append(sp, el("div", "speaker-hint", "點喇叭再聽一次"));
    const reveal = el("div", "tone-reveal");
    const opts = el("div", "tone-opts");
    for (const t of TONE_LESSON.slice(0, 4)) {
      const b = el("button", `tone-opt t${t.n}`, `<span class="m">${t.mark}</span>${curve(t.n)}<span class="n">${t.name}</span>`);
      b.onclick = async () => {
        if (tg.locked) return; tg.locked = true;
        const ok = t.n === q.t;
        [...opts.children].forEach(x => x.disabled = true);
        b.classList.add(ok ? "ok" : "bad");
        if (!ok) opts.children[q.t - 1].classList.add("ok");
        if (ok) { sfx.correct(); tg.correct++; store.event("tone"); store.count("tone", "correct"); const r = b.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 40 }); }
        else sfx.wrong();
        store.count("tone", "played");
        reveal.innerHTML = `<span class="rc">${q.ch}</span>${zyHTML(zyLine(q.key + MARK[q.t - 1]), "row")}<span class="rt">${TONE_LESSON[q.t - 1].name}・${TONE_LESSON[q.t - 1].shape}</span>`;
        reveal.classList.add("show");
        await sayW(q.ch, q.key + MARK[q.t - 1], q.ch, { human: true });
        await wait(ok ? 500 : 1100);
        tg.idx++; tg.locked = false; viewTone();
      };
      opts.append(b);
    }
    v.append(opts, reveal);
    later(play, 300);
  }

  // ============================================================ 注音打地鼠
  let ml = null; let moleRange = null;
  // 速度：倍率越大越慢。預設「一般」= 原本速度。
  const MOLE_SPEEDS = [{ id: "slow", name: "🐢 慢", k: 1.7 }, { id: "normal", name: "🐰 一般", k: 1 }, { id: "fast", name: "🚀 快", k: 0.7 }];
  let moleSpeed = "normal";
  try { moleSpeed = localStorage.getItem("zp.moleSpeed") || "normal"; } catch {}
  const speedK = () => (MOLE_SPEEDS.find(x => x.id === moleSpeed) || MOLE_SPEEDS[1]).k;
  function viewMole() {
    const v = $("#v-mole"); v.innerHTML = "";
    if (moleRange == null) moleRange = unlockedUpTo();
    v.append(el("h2", "h2", "注音打地鼠"), el("p", "sub", "聽到哪個音，就快打那隻地鼠！"));
    if (!ml || !ml.running) {
      v.append(rangePicker(moleRange, n => { moleRange = n; viewMole(); }));
      const sp = el("div", "pills speed"); sp.append(el("span", "range-lbl", "速度"));
      for (const o of MOLE_SPEEDS) {
        const b = el("button", `pill coral${o.id === moleSpeed ? " on" : ""}`, o.name);
        b.onclick = () => { sfx.tap(); moleSpeed = o.id; try { localStorage.setItem("zp.moleSpeed", o.id); } catch {} viewMole(); };
        sp.append(b);
      }
      v.append(sp);
      const syms = symbolsUpTo(moleRange);
      v.append(el("div", "mole-intro", `<div class="big-emoji">🐹</div><p>這一場會出現 <b>${syms.length}</b> 個符號：</p><div class="mini-syms">${syms.map(s => `<span>${s}</span>`).join("")}</div><p class="best">最高分 ${store.get().mole.best}</p>`));
      if (ml?.over) v.append(el("div", "summary mini", `<h3>${ml.score} 分</h3><p>打中 ${ml.hits} 隻・最高連擊 ${ml.maxCombo}${ml.newBest ? "・新紀錄！" : ""}</p>`));
      const b = el("button", "btn coral", ml?.over ? "再玩一次" : "開始！"); b.onclick = () => { sfx.tap(); startMole(); };
      v.append(b);
      return;
    }
  }
  function startMole() {
    clearAll();
    const syms = symbolsUpTo(moleRange);
    ml = { running: true, score: 0, combo: 0, maxCombo: 0, hits: 0, time: 45, syms, target: null, holes: Array(9).fill(null) };
    const v = $("#v-mole"); v.innerHTML = "";
    const top = el("div", "mole-top");
    const sc = el("span", "ms", "0 分"), cb = el("span", "mc", ""), tm = el("span", "mt", "45");
    const again = el("button", "pill", "🔊 再聽一次"); again.onclick = () => announce();
    top.append(sc, cb, again, tm); v.append(top);
    const bar = el("div", "progressbar"); const bi = el("i"); bi.style.width = "100%"; bar.append(bi); v.append(bar);
    const board = el("div", "mole-board");
    const holes = [];
    for (let i = 0; i < 9; i++) {
      const h = el("button", "hole"); h.innerHTML = `<span class="dirt"></span><span class="mole"><b></b></span>`;
      h.onclick = () => hit(i);
      holes.push(h); board.append(h);
    }
    v.append(board);
    const bySym = s => SYMBOLS.find(x => x.s === s);
    function announce() { if (ml.target) saySym(bySym(ml.target)); }
    function newTarget() { ml.target = syms[Math.random() * syms.length | 0]; announce(); }
    function paint() { sc.textContent = `${ml.score} 分`; cb.textContent = ml.combo >= 2 ? `🔥 ${ml.combo} 連擊` : ""; }
    function show(i, s) {
      ml.holes[i] = s; const h = holes[i]; h.querySelector("b").textContent = s; h.classList.remove("bonk", "miss"); h.classList.add("up");
      const life = Math.max(900, 1700 - ml.hits * 25) * speedK();
      later(() => { if (ml.holes[i] === s) { ml.holes[i] = null; h.classList.remove("up"); } }, life);
    }
    function spawn() {
      if (!ml.running) return;
      const empty = ml.holes.map((x, i) => x ? -1 : i).filter(i => i >= 0);
      if (empty.length) {
        const i = empty[Math.random() * empty.length | 0];
        const hasTarget = ml.holes.includes(ml.target);
        const s = (!hasTarget && Math.random() < 0.55) ? ml.target : syms.filter(x => x !== ml.target)[Math.random() * Math.max(1, syms.length - 1) | 0] || ml.target;
        show(i, s);
      }
      later(spawn, Math.max(420, 760 - ml.hits * 12) * speedK());
    }
    function hit(i) {
      const s = ml.holes[i]; if (!s || !ml.running) return;
      const h = holes[i];
      if (s === ml.target) {
        ml.combo++; ml.maxCombo = Math.max(ml.maxCombo, ml.combo); ml.hits++;
        ml.score += 10 + (ml.combo - 1) * 2; sfx.correct();
        h.classList.add("bonk"); ml.holes[i] = null; later(() => h.classList.remove("up", "bonk"), 250);
        const r = h.getBoundingClientRect(); burst({ x: r.left + r.width / 2, y: r.top + r.height / 3, n: 20, spread: 5 });
        later(newTarget, 350);
      } else { ml.combo = 0; sfx.wrong(); h.classList.add("miss"); later(() => h.classList.remove("miss"), 400); }
      paint();
    }
    const tick = () => {
      if (!ml.running) return;
      ml.time--; tm.textContent = ml.time; bi.style.width = `${ml.time / 45 * 100}%`;
      if (ml.time <= 0) return endMole();
      later(tick, 1000);
    };
    later(newTarget, 300); later(spawn, 900); later(tick, 1000); paint();
  }
  function endMole() {
    clearAll(); ml.running = false; ml.over = true;
    const d = store.get(); d.mole.games++; ml.newBest = ml.score > d.mole.best; if (ml.newBest) d.mole.best = ml.score;
    store.count("mole", "games", 0); store.event("mole");
    const stars = ml.score >= 200 ? 3 : ml.score >= 100 ? 2 : 1; store.addStars(stars);
    sfx.win(); burst({ n: 140 });
    if (ml.newBest && ml.score >= 100) store.awardSticker();
    viewMole();
  }

  // ============================================================ 找不同
  const CONFUSE = { ㄅ: "ㄆ", ㄆ: "ㄅ", ㄉ: "ㄊ", ㄊ: "ㄉ", ㄍ: "ㄎ", ㄎ: "ㄍ", ㄓ: "ㄗ", ㄗ: "ㄓ", ㄔ: "ㄘ", ㄘ: "ㄔ", ㄕ: "ㄙ", ㄙ: "ㄕ", ㄋ: "ㄌ", ㄌ: "ㄋ", ㄈ: "ㄏ", ㄏ: "ㄈ", ㄐ: "ㄑ", ㄑ: "ㄐ", ㄒ: "ㄙ", ㄇ: "ㄋ", ㄖ: "ㄌ" };
  let oddPool = null, od = null;
  function buildOdd() {
    if (oddPool) return oddPool;
    const seen = new Set(); const items = [];
    const push = (name, emoji, syl, say) => { if (!emoji || seen.has(name) || !syl[0]?.i) return; seen.add(name); items.push({ name, emoji, syl, say: say || name }); };
    for (const [n, z, e, s] of WORDS) push(n, e, zyLine(z), s);
    for (const a of ANIMALS) push(a.name, a.emoji, a.syl, a.say);
    const groups = {}; for (const it of items) (groups[it.syl[0].i] ||= []).push(it);
    return (oddPool = groups);
  }
  function newOdd() {
    const g = buildOdd(); const keys = Object.keys(g).filter(k => g[k].length >= 3);
    const rounds = [];
    for (let r = 0; r < 6; r++) {
      const A = keys[Math.random() * keys.length | 0];
      let B = CONFUSE[A]; if (!g[B]?.length) { const others = Object.keys(g).filter(k => k !== A); B = others[Math.random() * others.length | 0]; }
      const three = shuffle(g[A]).slice(0, 3), one = g[B][Math.random() * g[B].length | 0];
      rounds.push({ A, B, cards: shuffle([...three, one]), odd: one });
    }
    od = { rounds, idx: 0, correct: 0, sel: null, locked: false };
  }
  function viewOdd() {
    const v = $("#v-odd"); v.innerHTML = "";
    if (!od) newOdd();
    v.append(el("h2", "h2", "找不同"), el("p", "sub", "點圖片聽聽看，哪一個開頭的音不一樣？"));
    if (od.idx >= od.rounds.length) return summary(v, od.correct, od.rounds.length, () => { newOdd(); viewOdd(); }, "odd");
    const r = od.rounds[od.idx];
    v.append(el("div", "quiz-top", `<span>第 ${od.idx + 1} / ${od.rounds.length} 題</span><span>答對 ${od.correct}</span>`));
    v.append(el("div", "progressbar", `<i style="width:${od.idx / od.rounds.length * 100}%"></i>`));
    const grid = el("div", "odd-grid");
    r.cards.forEach((c, i) => {
      const b = el("button", `odd-card${od.sel === i ? " sel" : ""}`, `${pic(c.emoji, "pic-lg")}<span class="on">${c.name}</span><span class="oz">${zyHTML(c.syl, "tiny")}</span>`);
      b.onclick = () => { if (od.locked) return; od.sel = i; [...grid.children].forEach((x, j) => x.classList.toggle("sel", j === i)); ok.disabled = false; sayW(c.name, readingText(c), c.say); };
      grid.append(b);
    });
    const listen = el("button", "btn ghost", "🔊 四個都聽");
    listen.onclick = async () => { for (const [i, c] of r.cards.entries()) { grid.children[i].classList.add("glow"); await sayW(c.name, readingText(c), c.say); grid.children[i].classList.remove("glow"); await wait(250); } };
    const ok = el("button", "btn mint", "就是它！"); ok.disabled = od.sel == null;
    ok.onclick = async () => {
      if (od.locked || od.sel == null) return; od.locked = true;
      const right = r.cards[od.sel] === r.odd;
      grid.classList.add("revealed");
      [...grid.children].forEach((x, j) => x.classList.add(r.cards[j] === r.odd ? "is-odd" : "is-same"));
      if (right) { od.correct++; sfx.correct(); burst({ n: 60 }); } else sfx.wrong();
      toast(right ? `答對了！其他都是「${r.A}」開頭，它是「${r.B}」` : `再想想：其他三個是「${r.A}」開頭，「${r.odd.name}」是「${r.B}」`);
      await wait(right ? 1500 : 2600);
      od.idx++; od.sel = null; od.locked = false; viewOdd();
    };
    const row = el("div", "row"); row.style.marginTop = "14px"; row.append(listen, ok);
    v.append(grid, row);
  }

  // ============================================================ 寫寫看（描寫，依覆蓋率判定）
  let wr = { sym: null };
  async function viewWrite() {
    const v = $("#v-write"); v.innerHTML = "";
    v.append(el("h2", "h2", "寫寫看"), el("p", "sub", "照著淡淡的字，用手指把它描滿。筆順請跟著課本。"));
    const syms = symbolsUpTo(unlockedUpTo());
    if (!wr.sym || !syms.includes(wr.sym)) wr.sym = syms[0];
    const chips = el("div", "chips write-chips");
    for (const s of syms) { const c = el("button", `chip${s === wr.sym ? " on violet" : ""}`, s); c.onclick = () => { wr.sym = s; sfx.tap(); viewWrite(); }; chips.append(c); }
    const box = el("div", "write-box");
    const cv = el("canvas", "write-cv"); box.append(cv);
    const meter = el("div", "write-meter", `<i></i><span>0%</span>`);
    const row = el("div", "row"); row.style.marginTop = "12px";
    const clear = el("button", "btn ghost", "🧽 擦掉重寫"), hear = el("button", "btn violet", `🔊 唸 ${wr.sym}`), next = el("button", "btn mint", "下一個 ➜");
    row.append(clear, hear, next);
    v.append(chips, box, meter, row);
    const sym = SYMBOLS.find(x => x.s === wr.sym);
    hear.onclick = () => saySym(sym);
    next.onclick = () => { const i = syms.indexOf(wr.sym); wr.sym = syms[(i + 1) % syms.length]; sfx.tap(); viewWrite(); };
    try { await document.fonts.load('900 200px "Noto Sans TC"'); } catch {}
    const size = Math.min(320, box.clientWidth - 8), dpr = devicePixelRatio || 1, W = Math.round(size * dpr);
    cv.width = cv.height = W; cv.style.width = cv.style.height = size + "px";
    const g = cv.getContext("2d");
    const mask = document.createElement("canvas"); mask.width = mask.height = W; const mg = mask.getContext("2d");
    const ink = document.createElement("canvas"); ink.width = ink.height = W; const ig = ink.getContext("2d");
    const font = `900 ${Math.round(W * 0.72)}px "Noto Sans TC", "PingFang TC", sans-serif`;
    function guide() {
      g.clearRect(0, 0, W, W);
      g.strokeStyle = "#F0D9B5"; g.lineWidth = 2 * dpr; g.setLineDash([8 * dpr, 8 * dpr]);
      g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, W); g.moveTo(0, W / 2); g.lineTo(W, W / 2); g.stroke(); g.setLineDash([]);
      g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#E7E3F8"; g.fillText(wr.sym, W / 2, W * 0.53);
      g.drawImage(ink, 0, 0);
    }
    mg.font = font; mg.textAlign = "center"; mg.textBaseline = "middle"; mg.fillStyle = "#000"; mg.fillText(wr.sym, W / 2, W * 0.53);
    const md = mg.getImageData(0, 0, W, W).data; let total = 0; for (let i = 3; i < md.length; i += 4) if (md[i] > 128) total++;
    guide();
    let drawing = false, last = null, done = false;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
    const line = (a, b) => {
      for (const [c, w, col] of [[ig, W * 0.075, "#6C5CE7"]]) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = c.lineJoin = "round"; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
      guide();
    };
    cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e); line(last, last); };
    cv.onpointermove = e => { if (!drawing) return; const p = pos(e); line(last, p); last = p; };
    cv.onpointerup = cv.onpointercancel = () => { if (!drawing) return; drawing = false; check(); };
    function check() {
      const id = ig.getImageData(0, 0, W, W).data; let cov = 0, out = 0, inkN = 0;
      for (let i = 3; i < id.length; i += 4) { if (id[i] > 0) { inkN++; if (md[i] > 128) cov++; else out++; } }
      const pct = Math.round(cov / total * 100);
      meter.querySelector("i").style.width = Math.min(100, pct) + "%"; meter.querySelector("span").textContent = pct + "%";
      const messy = inkN > 0 && out > inkN * 0.55;
      meter.classList.toggle("messy", messy && !done);
      if (messy && !done) meter.querySelector("span").textContent = "塗到字外面太多了，擦掉沿著字描就好";
      if (!done && pct >= 82 && !messy) {
        done = true; sfx.win(); burst({ n: 100 }); saySym(sym); store.event("write"); store.count("write"); store.addStars(1);
        toast(`寫得好棒！「${wr.sym}」完成 ⭐`); meter.classList.add("ok");
      }
    }
    clear.onclick = () => { ig.clearRect(0, 0, W, W); done = false; meter.classList.remove("ok"); meter.querySelector("i").style.width = "0"; meter.querySelector("span").textContent = "0%"; guide(); };
  }

  // ============================================================ 我也會唸（跟讀錄音，只存在本機記憶體）
  let ec = null; let stream = null, rec = null, chunks = [], myUrl = null;
  function echoItems() {
    const n = unlockedUpTo(); const ws = LESSON_ORDER.slice(0, n).flatMap(id => LESSON_WORDS[id]);
    return shuffle(ws.length ? ws : ANIMALS.slice(0, 20));
  }
  function viewEcho() {
    const v = $("#v-echo"); v.innerHTML = "";
    if (!ec) ec = { items: echoItems(), idx: 0 };
    v.append(el("h2", "h2", "我也會唸"), el("p", "sub", "先聽老師唸，再按住麥克風錄自己的聲音。錄音只留在這台裝置，不會上傳。"));
    const w = ec.items[ec.idx % ec.items.length];
    const card = el("div", "echo-card", `${w.emoji ? pic(w.emoji, "pic-xl") : ""}<b>${w.name}</b>${zyHTML(w.syl, "row")}`);
    v.append(card);
    const teach = el("button", "btn violet", "🔊 老師唸"); teach.onclick = () => sayW(w.name, readingText(w), w.say, { human: true });
    const mic = el("button", "btn coral mic", "🎙️ 按住說話");
    const mine = el("button", "btn ghost", "▶ 我的聲音"); mine.disabled = !myUrl;
    const both = el("button", "btn mint", "🔁 老師＋我"); both.disabled = !myUrl;
    const playMine = () => new Promise(res => { if (!myUrl) return res(); const a = new Audio(myUrl); a.onended = res; a.onerror = res; a.play().catch(res); });
    mine.onclick = () => playMine();
    both.onclick = async () => { await sayW(w.name, readingText(w), w.say, { human: true }); await wait(300); await playMine(); };
    const startRec = async e => {
      e.preventDefault();
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("這個瀏覽器不支援錄音，請用 Chrome 或 Safari");
      try { stream ||= await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return toast("沒有麥克風權限，請在瀏覽器設定允許麥克風"); }
      voice.stop(); chunks = []; rec = new MediaRecorder(stream);
      rec.ondataavailable = ev => ev.data.size && chunks.push(ev.data);
      rec.onstop = () => {
        if (myUrl) URL.revokeObjectURL(myUrl);
        myUrl = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        mine.disabled = both.disabled = false; store.event("echo"); store.count("echo");
        playMine();
      };
      rec.start(); mic.classList.add("rec"); mic.textContent = "🔴 錄音中…放開就停";
    };
    const stopRec = () => { if (rec?.state === "recording") { rec.stop(); mic.classList.remove("rec"); mic.textContent = "🎙️ 按住說話"; } };
    mic.onpointerdown = startRec; mic.onpointerup = mic.onpointerleave = mic.onpointercancel = stopRec;
    const g = el("div", "echo-btns"); g.append(teach, mic, mine, both); v.append(g);
    const nav = el("div", "row"); nav.style.marginTop = "12px";
    const prev = el("button", "btn ghost", "← 上一個"), next = el("button", "btn ghost", "下一個 →");
    prev.onclick = () => { ec.idx = (ec.idx - 1 + ec.items.length) % ec.items.length; resetMine(); viewEcho(); };
    next.onclick = () => { ec.idx++; resetMine(); viewEcho(); };
    nav.append(prev, next); v.append(nav);
    later(() => sayW(w.name, readingText(w), w.say, { human: true }), 300);
  }
  function resetMine() { if (myUrl) URL.revokeObjectURL(myUrl); myUrl = null; }

  // ============================================================ 共用：結算
  function summary(v, c, n, again, type) {
    const stars = c === n ? 3 : c >= n * .6 ? 2 : 1;
    store.addStars(stars); store.event(type, type === "tone" ? 0 : 1);
    if (type === "odd") store.count("odd", "games");
    if (c === n) { sfx.win(); burst({ n: 160 }); store.awardSticker(); } else sfx.correct();
    const s = el("div", "summary", `<div class="big-emoji">${c === n ? "🏆" : c >= n * .6 ? "🎉" : "💪"}</div><h3>${c === n ? "全部答對！" : c >= n * .6 ? "好厲害！" : "再試一次吧"}</h3><p>${n} 題答對 ${c} 題${c === n ? "・得到一張貼紙！" : ""}</p><div class="earned">${"⭐".repeat(stars)}</div>`);
    const b = el("button", "btn coral", "再玩一次"); b.onclick = () => { sfx.tap(); again(); };
    s.append(b); v.append(s);
  }

  return {
    views: { games: viewGames, tone: viewTone, mole: viewMole, odd: viewOdd, write: viewWrite, echo: viewEcho },
    dailyCard,
    stop() { clearAll(); if (ml?.running) { ml.running = false; ml = null; } if (rec?.state === "recording") rec.stop(); tg = tg && tg.idx >= tg.qs.length ? null : tg; },
    resetEcho() { ec = null; },
  };
}
