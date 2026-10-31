// 各科目共用的小工具（DOM、亂數、插圖、提示）。
export const $ = (s, r = document) => r.querySelector(s);
export const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
// 插圖：OpenMoji（CC BY-SA 4.0），所有裝置風格一致。檔名 = 去掉 FE0F 的 codepoint。
export const emojiHex = e => [...e].map(c => c.codePointAt(0)).filter(cp => cp !== 0xFE0F).map(cp => cp.toString(16).toUpperCase()).join("-");
export const pic = (emoji, cls = "") => `<img class="pic ${cls}" src="img/openmoji/${emojiHex(emoji)}.svg" alt="" draggable="false" onerror="this.replaceWith(document.createTextNode('${emoji}'))">`;
let toastT;
export function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800); }
// 闖關地圖：在節點之間畫虛線小路。
export function drawMapPath(map, nodes) {
  requestAnimationFrame(() => {
    const r0 = map.getBoundingClientRect(); const pts = nodes.map(n => { const r = n.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; });
    if (pts.length < 2) return;
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const my = (y0 + y1) / 2; d += ` C${x0} ${my} ${x1} ${my} ${x1} ${y1}`; }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "map-path"); svg.setAttribute("width", r0.width); svg.setAttribute("height", map.scrollHeight);
    svg.innerHTML = `<path d="${d}"/>`; map.prepend(svg);
  });
}
