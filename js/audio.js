// 發音：瀏覽器內建 zh-TW 語音合成（免費、免檔案）。音效：WebAudio 合成（免檔案）。
const synth = globalThis.speechSynthesis;
let voices = [];
let ready = false;

function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices();
  ready = voices.length > 0;
}
loadVoices();
synth?.addEventListener?.("voiceschanged", loadVoices);

function pickVoice() {
  const zh = voices.filter(v => /^zh([-_](TW|Hant))/i.test(v.lang));
  // 偏好：台灣 + 非遠端(本機) + 名稱含 Mei-Jia/Yating/Hanhan/Google 國語
  const score = v => (/^zh[-_]TW/i.test(v.lang) ? 4 : 0) + (v.localService ? 2 : 0) +
    (/Mei|Yating|Hanhan|國語|Taiwan/i.test(v.name) ? 1 : 0);
  return zh.sort((a, b) => score(b) - score(a))[0]
    || voices.find(v => /^zh/i.test(v.lang)) || null;
}

export const tts = {
  get supported() { return !!synth; },
  get hasZhVoice() { return !!pickVoice(); },
  /** 唸一段中文。回傳 Promise，結束或失敗都會 resolve。 */
  speak(text, { rate = 0.85, pitch = 1.05 } = {}) {
    return new Promise(resolve => {
      if (!synth || !text) return resolve(false);
      try { synth.cancel(); } catch {}
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-TW";
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = rate; u.pitch = pitch;
      let done = false;
      const finish = ok => { if (!done) { done = true; resolve(ok); } };
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      // Safari 偶爾不觸發 onend，保險用 timeout
      setTimeout(() => finish(true), Math.max(1500, text.length * 600));
      synth.speak(u);
    });
  },
  /** 唸單一注音符號：先試符號本身（較乾淨），引擎若跳過沒出聲（onstart→onend < 150ms）就退回呼讀音字。 */
  speakSymbol(symbol, fallbackText, opts = {}) {
    return new Promise(resolve => {
      if (!synth) return resolve(false);
      try { synth.cancel(); } catch {}
      const u = new SpeechSynthesisUtterance(symbol);
      u.lang = "zh-TW"; const v = pickVoice(); if (v) u.voice = v;
      u.rate = opts.rate ?? 0.8; u.pitch = opts.pitch ?? 1.05;
      let t0 = 0, done = false;
      const fallback = () => { if (done) return; done = true; this.speak(fallbackText, opts).then(resolve); };
      const finish = () => { if (done) return; done = true; resolve(true); };
      u.onstart = () => { t0 = performance.now(); };
      u.onend = () => { (t0 && performance.now() - t0 >= 150) ? finish() : fallback(); };
      u.onerror = fallback;
      setTimeout(() => { if (!done) (t0 ? finish() : fallback()); }, 2500);
      synth.speak(u);
    });
  },
  stop() { try { synth?.cancel(); } catch {} },
  /** iOS 需要在使用者手勢中「暖機」一次才會出聲。 */
  warmup() {
    if (!synth || ready) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0; synth.speak(u);
  },
};

// ---- 音效（合成，不用檔案） ----
let ctx = null;
function ac() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}
function tone(freq, t0, dur, type = "sine", gain = 0.18) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + t0);
  g.gain.setValueAtTime(0, c.currentTime + t0);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
}
let muted = false;
try { muted = localStorage.getItem("zp.muted") === "1"; } catch {}
export const sfx = {
  get muted() { return muted; },
  toggle() { muted = !muted; try { localStorage.setItem("zp.muted", muted ? "1" : "0"); } catch {} return muted; },
  tap()     { if (!muted) tone(880, 0, 0.08, "triangle", 0.08); },
  correct() { if (!muted) { tone(523, 0, 0.12); tone(659, 0.1, 0.12); tone(784, 0.2, 0.2); } },
  wrong()   { if (!muted) { tone(220, 0, 0.18, "sawtooth", 0.08); tone(180, 0.15, 0.22, "sawtooth", 0.08); } },
  win()     { if (!muted) [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.18)); },
  flip()    { if (!muted) tone(660, 0, 0.06, "square", 0.04); },
};
