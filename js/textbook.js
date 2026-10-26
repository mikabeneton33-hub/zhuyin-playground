// 南一版 國語首冊。首冊課文只有注音，所以畫面只顯示注音；say 是餵給語音引擎的國字（不顯示）。
// 內容依使用者提供的課本照片整理；todo: true = 照片看不清，待確認。
export const BOOK = { name: "南一版 國語首冊", grade: "一年級上學期" };

export const UNITS = [
  { id: "intro", title: "開始之前", items: [
    { id: "home", page: 6, zy: "ㄅ ㄆ ㄇ ˙ㄉㄜ ㄐㄧㄚ", say: "ㄅㄆㄇ的家", kind: "link", to: "learn", desc: "認識 37 個注音符號" },
    { id: "tones", page: 14, zy: "ㄕㄥ ㄉㄧㄠˋ ㄐㄧㄠˋ ㄒㄩㄝˊ", say: "聲調教學", kind: "tones", desc: "一聲、二聲、三聲、四聲、輕聲" },
  ]},
  { id: "u1", title: "第壹單元", todo: true, items: [
    { id: "L1", no: "一", page: 18, zy: "ㄊㄧ ㄊㄚˊ ㄊㄧ", say: "踢踏踢", kind: "lesson",
      lines: [
        { zy: "ㄊㄧ ㄊㄧ ㄊㄚˊ", say: "踢踢踏" },
        { zy: "ㄊㄧ ㄊㄧ ㄊㄚˊ ㄊㄚˊ", say: "踢踢踏踏" },
        { zy: "ㄧㄚ ㄅㄚˋ ˙ㄅㄚ ㄊㄚˊ ㄧˋ ㄊㄚˊ", say: "呀，爸爸踏一踏" },
        { zy: "ㄧㄚ ㄇㄚ ˙ㄇㄚ ㄊㄧ ㄧˋ ㄊㄧ", say: "呀，媽媽踢一踢" },
      ] },
    { id: "L2", no: "二", page: 24, zy: "ㄇㄨˋ ㄇㄚˇ", say: "木馬", kind: "lesson", lines: [] },
    { id: "L3", no: "三", page: 30, zy: "ㄨㄢˇ ㄢ", say: "晚安", kind: "lesson", lines: [] },
    { id: "R1", page: 36, zy: "ㄊㄨㄥˇ ㄓㄥˇ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄧ", say: "統整活動一", kind: "review", lessons: ["L1", "L2", "L3"] },
  ]},
  { id: "u2", title: "第貳單元", zy: "ㄎㄨㄞˋ ㄌㄜˋ ㄕㄡˇ ㄑㄧㄢ ㄕㄡˇ", say: "快樂手牽手", items: [
    { id: "L4", no: "四", page: 42, zy: "ㄓˇ ㄈㄟ ㄐㄧ", say: "紙飛機", kind: "lesson", lines: [] },
    { id: "L5", no: "五", page: 48, zy: "", say: "", kind: "lesson", lines: [], todo: true },
    { id: "L6", no: "六", page: 54, zy: "ㄐㄧㄢˇ ㄉㄠ ㄕˊ ˙ㄊㄡ ㄅㄨˋ", say: "剪刀石頭布", kind: "lesson", lines: [] },
    { id: "R2", page: 60, zy: "ㄊㄨㄥˇ ㄓㄥˇ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄦˋ", say: "統整活動二", kind: "review", lessons: ["L4", "L5", "L6"] },
  ]},
  { id: "u3", title: "第參單元", todo: true, items: [
    { id: "L7", no: "七", page: 66, zy: "ㄅㄨˋ ㄌㄞˊ ㄇㄟˊ ㄩㄝˋ ㄉㄨㄟˋ", say: "不來梅樂隊", kind: "lesson", lines: [], todo: true },
    { id: "L8", no: "八", page: 72, zy: "ㄒㄧㄠˇ ㄎㄜ ㄉㄡˇ ㄓㄠˇ ㄇㄚ ˙ㄇㄚ", say: "小蝌蚪找媽媽", kind: "lesson", lines: [] },
    { id: "L9", no: "九", page: 78, zy: "ㄉㄨㄥˋ ㄨˋ ㄎㄨㄤˊ ㄏㄨㄢ ㄐㄧㄝˊ", say: "動物狂歡節", kind: "lesson", lines: [] },
    { id: "R3", page: 86, zy: "ㄊㄨㄥˇ ㄓㄥˇ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄙㄢ", say: "統整活動三", kind: "review", lessons: ["L7", "L8", "L9"] },
  ]},
  { id: "end", title: "期末", items: [
    { id: "final", page: 90, zy: "ㄗㄨㄥˇ ㄈㄨˋ ㄒㄧˊ", say: "總複習", kind: "review", lessons: ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9"] },
  ]},
];

// 聲調教學（課本 p.14–15 的口訣）
export const TONE_LESSON = [
  { n: 1, mark: "ˉ", name: "一聲", shape: "平平的", move: "立正不動站好好", ex: "ㄇㄚ", say: "媽", path: "M10 20 L90 20" },
  { n: 2, mark: "ˊ", name: "二聲", shape: "上揚的", move: "手臂向上抬高高", ex: "ㄇㄚˊ", say: "麻", path: "M10 70 L90 15" },
  { n: 3, mark: "ˇ", name: "三聲", shape: "先降後升的", move: "右手彎曲打勾勾", ex: "ㄇㄚˇ", say: "馬", path: "M10 45 Q45 95 90 25" },
  { n: 4, mark: "ˋ", name: "四聲", shape: "下降的", move: "斜斜向下甩個手", ex: "ㄇㄚˋ", say: "罵", path: "M10 15 L90 80" },
  { n: 5, mark: "˙", name: "輕聲", shape: "又短又急的", move: "握個拳頭放上頭", ex: "˙ㄇㄚ", say: "媽媽", path: "M45 55 L55 55" },
];

export const allLessons = () => UNITS.flatMap(u => u.items).filter(x => x.kind === "lesson");
export const findItem = id => UNITS.flatMap(u => u.items).find(x => x.id === id);
