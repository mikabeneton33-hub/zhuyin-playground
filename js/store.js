// 進度：存瀏覽器本機，不用登入。
const KEY = "zp.progress.v1";
const def = () => ({ stars: 0, learned: {}, quiz: { played: 0, correct: 0, best: 0 }, match: { wins: 0, bestMoves: null }, spell: { count: 0 }, animals: { played: 0, correct: 0 } });
let data = def();
try { data = { ...def(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} dispatchEvent(new CustomEvent("zp:progress")); }
export const store = {
  get() { return data; },
  addStars(n) { data.stars += n; save(); },
  learn(sym) { data.learned[sym] = (data.learned[sym] || 0) + 1; save(); },
  learnedCount() { return Object.keys(data.learned).length; },
  quizResult(correct, total) {
    data.quiz.played += total; data.quiz.correct += correct;
    data.quiz.best = Math.max(data.quiz.best, correct); save();
  },
  matchWin(moves) {
    data.match.wins++;
    data.match.bestMoves = data.match.bestMoves == null ? moves : Math.min(data.match.bestMoves, moves); save();
  },
  animals(mode, correct, total) { data.animals.played += total; data.animals.correct += correct; save(); },
  spelled() { data.spell.count++; save(); },
  reset() { data = def(); save(); },
};
