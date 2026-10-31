// 輕量彩帶：canvas 覆蓋全頁，尊重 prefers-reduced-motion。
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let canvas, ctx, parts = [], raf = 0;
const COLORS = ["#FF6B6B", "#FFD166", "#4ECDC4", "#6C5CE7", "#FF9F43", "#54A0FF"];
function ensure() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.className = "confetti"; canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas); ctx = canvas.getContext("2d");
  const fit = () => { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  fit(); addEventListener("resize", fit);
}
function frame() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.y < innerHeight + 40 && p.life > 0);
  for (const p of parts) {
    p.vy += 0.18; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillStyle = p.c; ctx.globalAlpha = Math.min(1, p.life / 30);
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
  }
  raf = parts.length ? requestAnimationFrame(frame) : 0;
}
export function burst({ x = innerWidth / 2, y = innerHeight / 2, n = 90, spread = 9 } = {}) {
  if (reduce) return;
  ensure();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * spread;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: COLORS[i % COLORS.length], life: 90 + Math.random() * 40 });
  }
  if (!raf) raf = requestAnimationFrame(frame);
}
