// 數學・一年級上學期 闖關地圖。
// 單元與小節依康軒版《國小數學 1上 學習自修》目次與各單元「學習地圖」（page = 自修頁碼）。
// 只收錄結構（單元名、小節名、頁碼）；題目全部由本站程式產生，不收錄書中題目與插圖。
//
// 小節格式：{ id, title, drills: [{ type, max, ...參數 }] }，題型見 index.js 的 GEN。
export const BOOK = { name: "康軒版 國小數學 1上", src: "學習自修", grade: "一年級上學期" };

export const UNITS = [
  { id: "U1", no: 1, title: "10以內的數", page: 4, items: [
    { id: "U1-1", title: "認識 1～5", drills: [{ type: "count", max: 5 }, { type: "listen", max: 5 }] },
    { id: "U1-2", title: "認識 6～10", drills: [{ type: "count", min: 6, max: 10 }, { type: "listen", min: 6, max: 10 }] },
    { id: "U1-3", title: "認識 0", drills: [{ type: "count", min: 0, max: 5, zeroRate: 0.4 }] },
    { id: "U1-4", title: "表示數量", drills: [{ type: "count", max: 10 }, { type: "listen", max: 10 }] },
  ]},
  { id: "U2", no: 2, title: "比長短", page: 14, items: [
    { id: "U2-1", title: "比長短", drills: [{ type: "length", mode: "long" }] },
    { id: "U2-2", title: "比高矮、比厚薄", drills: [{ type: "length", mode: "tall" }, { type: "length", mode: "thick" }] },
    { id: "U2-3", title: "直線和曲線", drills: [{ type: "line" }] },
  ]},
  { id: "U3", no: 3, title: "排順序、比多少", page: 28, items: [
    { id: "U3-1", title: "排數字", drills: [{ type: "order", max: 10 }] },
    { id: "U3-2", title: "排在第幾個", drills: [{ type: "ordinal" }] },
    { id: "U3-3", title: "第幾個和幾個", drills: [{ type: "nth" }] },
    { id: "U3-4", title: "比多少", drills: [{ type: "compare", max: 10 }, { type: "diff", max: 10 }] },
  ]},
  { id: "U4", no: 4, title: "分與合", page: 42, items: [
    { id: "U4-1", title: "分一分", drills: [{ type: "split", max: 9 }] },
    { id: "U4-2", title: "合一合", drills: [{ type: "join", max: 9 }] },
    { id: "U4-3", title: "10 的分與合", drills: [{ type: "split", tot: 10 }, { type: "join", tot: 10 }] },
  ]},
  { id: "U5", no: 5, title: "方盒、圓罐、球", page: 56, items: [
    { id: "U5-1", title: "堆疊與分類", drills: [{ type: "solid" }] },
    { id: "U5-2", title: "認識平面圖形", drills: [{ type: "plane" }] },
    { id: "U5-3", title: "做造型", drills: [{ type: "trace" }, { type: "design" }] },
  ]},
  { id: "M1", exam: true, title: "期中評量", page: 70, items: [
    { id: "MID", title: "期中評量", review: true, drills: [
      { type: "count", max: 10, n: 1 }, { type: "length", mode: "long", n: 1 }, { type: "line", n: 1 }, { type: "ordinal", n: 1 },
      { type: "compare", max: 10, n: 1 }, { type: "split", max: 10, n: 1 }, { type: "solid", n: 1 }, { type: "design", n: 1 },
    ]},
  ]},
  { id: "U6", no: 6, title: "30以內的數", page: 74, items: [
    { id: "U6-1", title: "數到 20", drills: [{ type: "count", min: 11, max: 20 }, { type: "order", max: 20, min: 10 }] },
    { id: "U6-2", title: "數到 30", drills: [{ type: "count", min: 18, max: 30 }, { type: "order", max: 30, min: 15 }] },
    { id: "U6-3", title: "表示數量", drills: [{ type: "tens", max: 30 }] },
    { id: "U6-4", title: "排在第幾個", drills: [{ type: "ordinal", len: 10 }] },
    { id: "U6-5", title: "比大小", drills: [{ type: "bigger", max: 30 }] },
  ]},
  { id: "U7", no: 7, title: "10以內的加法", page: 90, items: [
    { id: "U7-1", title: "合起來是多少", drills: [{ type: "add", max: 10, pics: true }] },
    { id: "U7-2", title: "0 的加法", drills: [{ type: "add", max: 10, zero: true }] },
    { id: "U7-3", title: "加加看", drills: [{ type: "add", max: 10 }] },
  ]},
  { id: "U8", no: 8, title: "10以內的減法", page: 102, items: [
    { id: "U8-1", title: "剩下多少", drills: [{ type: "sub", max: 10, pics: true }] },
    { id: "U8-2", title: "多多少、少多少", drills: [{ type: "diff", max: 10 }] },
    { id: "U8-3", title: "減減看", drills: [{ type: "sub", max: 10 }] },
    { id: "U8-4", title: "加加減減", drills: [{ type: "mix", max: 10 }] },
  ]},
  { id: "U9", no: 9, title: "幾點鐘", page: 116, items: [
    { id: "U9-1", title: "時間的先後和長短", drills: [{ type: "seqorder" }, { type: "sequence" }, { type: "duration" }] },
    { id: "U9-2", title: "認識時鐘", drills: [{ type: "clock", mode: "hands" }] },
    { id: "U9-3", title: "幾點鐘", drills: [{ type: "clock", half: false }] },
    { id: "U9-4", title: "幾點半", drills: [{ type: "clock", half: true }] },
  ]},
  { id: "M2", exam: true, title: "期末評量", page: 128, items: [
    { id: "FIN", title: "期末評量", review: true, drills: [
      { type: "tens", max: 30, n: 1 }, { type: "bigger", max: 30, n: 1 }, { type: "order", max: 30, n: 1 }, { type: "add", max: 10, n: 2 },
      { type: "sub", max: 10, n: 1 }, { type: "seqorder", n: 1 }, { type: "clock", half: true, n: 1 },
    ]},
  ]},
];
export const STAGES = UNITS.flatMap(u => u.items);
