// 數學・一年級上學期 闖關關卡。
//
// ⚠ 目前是「通用版」：只用各版本一上都會教的核心（10 以內的數、比多少、順序、分與合、加減），
//   尚未對照特定出版社課本。拿到課本素材後，把 BOOK 填上、STAGES 換成課本單元即可，
//   其他程式不用改。
//
// 關卡格式：
//   { id, title, say, page?, unit?, drills: [{ type, max, n? }] }
//   type：count 數一數｜listen 聽數字｜compare 比多少｜order 排排站｜split 分與合｜add 加法｜sub 減法｜mix 加減混合
//   max ：題目數字上限（≤ 10 有真人發音；>10 用合成語音）
//   n   ：這個題型出幾題（預設平均分配，一關共 8 題）
export const BOOK = null; // 例：{ name: "○○版 數學 1上", grade: "一年級上學期" }

export const STAGES = [
  { id: "S1", title: "數到 5", say: "數到五", drills: [{ type: "count", max: 5 }, { type: "listen", max: 5 }] },
  { id: "S2", title: "數到 10", say: "數到十", drills: [{ type: "count", max: 10 }, { type: "listen", max: 10 }] },
  { id: "S3", title: "比多少", say: "比多少", drills: [{ type: "compare", max: 10 }] },
  { id: "S4", title: "數字排排站", say: "數字排排站", drills: [{ type: "order", max: 10 }] },
  { id: "S5", title: "分與合", say: "分與合", drills: [{ type: "split", max: 10 }] },
  { id: "S6", title: "加法", say: "加法", drills: [{ type: "add", max: 10 }] },
  { id: "S7", title: "減法", say: "減法", drills: [{ type: "sub", max: 10 }] },
  { id: "S8", title: "加減大挑戰", say: "加減大挑戰", drills: [{ type: "mix", max: 10 }] },
];
