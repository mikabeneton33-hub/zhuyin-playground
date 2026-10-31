// 殼層：載入各科目、頂欄（科目切換／發音／星星／音效）、啟動。
// 新增科目：建立 js/subjects/<id>/index.js 呼叫 registerSubject()，在下方 import 一行，並把檔案加進 sw.js 的 ASSETS。
import { tts, sfx, voice } from "./core/audio.js";
import { store } from "./core/store.js";
import { $, el, toast } from "./core/ui.js";
import { go, hasView, currentSubject, mountSubjectSwitch } from "./core/router.js";
import { bindSheet } from "./subjects/zhuyin/index.js";
import "./subjects/math/index.js";

function renderStars() { $("#stars").textContent = store.get().stars; }
addEventListener("zp:progress", renderStars);

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
  mountSubjectSwitch();
  bindSheet();
  $("#starsbtn").onclick = () => { sfx.tap(); go("progress"); };
  const vt = $("#voicetoggle");
  const paintV = () => vt.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.mode === voice.mode));
  vt.querySelectorAll("button").forEach(b => b.onclick = () => { voice.mode = b.dataset.mode; paintV(); sfx.tap(); toast(voice.mode === "human" ? "真人發音：教育部辭典錄音" : "合成語音：裝置內建"); tts.warmup(); voice.word("媽媽", "ㄇㄚ ˙ㄇㄚ"); });
  paintV();
  const m = $("#mute"); const paint = () => m.textContent = sfx.muted ? "🔇" : "🔊";
  paint(); m.onclick = () => { sfx.toggle(); paint(); toast(sfx.muted ? "音效已關閉（發音仍會播放）" : "音效已開啟"); };
  addEventListener("zp:daily-done", () => { toast("🎉 今日任務全部完成！"); setTimeout(() => store.awardSticker(), 900); });
  const h = location.hash.slice(1);
  go(hasView(h) ? h : currentSubject().home, false);
  if (!tts.supported) toast("這個瀏覽器不支援語音，請改用 Chrome / Safari");
  else setTimeout(() => { if (voice.mode === "tts" && !tts.hasZhVoice) toast("找不到中文語音，請到系統設定安裝「中文（台灣）」語音"); }, 1500);
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
}
boot();
