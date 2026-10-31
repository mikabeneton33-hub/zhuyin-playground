// 路由與科目註冊。
// 每個科目（js/subjects/<id>/index.js）呼叫 registerSubject()，宣告：
//   id、name、logo、home（預設頁）、tabs（底部分頁）、views（頁面）、onGo（切頁前清理，可省略）
// view 名稱全站唯一，也就是網址 #hash；新科目請加前綴（例：math-count）。
// subject 為 "shared" 的 view（例：我的）不切換科目，沿用目前科目的分頁列。
import { $, el } from "./ui.js";
import { sfx, voice } from "./audio.js";

const SUBJECTS = new Map();
const VIEWS = {};
let current = null;
try { current = localStorage.getItem("zp.subject"); } catch {}

export function registerSubject(s) {
  SUBJECTS.set(s.id, s);
  for (const [name, def] of Object.entries(s.views)) {
    VIEWS[name] = { subject: s.shared?.includes(name) ? "shared" : s.id, ...def };
    if (!document.getElementById("v-" + name)) $("main").append(Object.assign(el("section", "view"), { id: "v-" + name }));
  }
}
export const subjects = () => [...SUBJECTS.values()];
export const currentSubject = () => SUBJECTS.get(current) || subjects()[0];
export const hasView = name => !!VIEWS[name];

function paintChrome(subj, def, name) {
  document.querySelectorAll("#subjectseg button").forEach(b => b.classList.toggle("on", b.dataset.s === subj.id));
  $(".logo").textContent = subj.logo;
  const bar = $(".tabbar");
  if (bar.dataset.s !== subj.id) {
    bar.dataset.s = subj.id; bar.innerHTML = "";
    for (const t of subj.tabs) {
      const b = el("button", "tab", `<span class="ic">${t.ic}</span>${t.label}`); b.dataset.v = t.v;
      b.onclick = () => { sfx.tap(); go(t.v); };
      bar.append(b);
    }
  }
  const tab = def.tab || name;
  bar.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x.dataset.v === tab));
  const back = $("#backbar");
  back.hidden = !def.back;
  if (def.back) { const b = back.querySelector("button"); b.textContent = "← " + def.back.label; b.onclick = () => { sfx.tap(); go(def.back.to); }; }
}

export function go(name, push = true) {
  if (!VIEWS[name]) name = currentSubject().home;
  const def = VIEWS[name];
  voice.stop();
  for (const s of SUBJECTS.values()) s.onGo?.(name, push);
  if (def.subject !== "shared" && def.subject !== current) {
    current = def.subject; try { localStorage.setItem("zp.subject", current); } catch {}
  }
  document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x.id === "v-" + name));
  paintChrome(currentSubject(), def, name);
  def.render(push);
  if (push) history.replaceState(null, "", "#" + name);
  scrollTo({ top: 0, behavior: "smooth" });
}

// 姊妹站：注音學完的下一站。另一個網站，所以用連結而不是科目按鈕。
const SISTER_SITES = [{ name: "字 國字樂園", url: "https://mikabeneton33-hub.github.io/guozi-playground/", title: "一年級國字：生字卡、描寫、聽寫（另一個網站）" }];

export function mountSubjectSwitch() {
  const seg = $("#subjectseg"); seg.innerHTML = "";
  for (const s of subjects()) {
    const b = el("button", "", s.name); b.dataset.s = s.id;
    b.onclick = () => { sfx.tap(); if (s.id !== currentSubject().id) go(s.home); };
    seg.append(b);
  }
  for (const x of SISTER_SITES) {
    const a = el("a", "sister", `${x.name}<span aria-hidden="true">↗</span>`);
    a.href = x.url; a.title = x.title; a.setAttribute("aria-label", `${x.name}（開啟另一個網站）`);
    a.onclick = () => sfx.tap();
    seg.append(a);
  }
}
