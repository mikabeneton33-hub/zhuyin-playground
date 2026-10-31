# 小一學習樂園 · Playground（repo：zhuyin-playground）

給學齡前到國小低年級小朋友的學習網站，目前有**國語（注音）**與**數學**兩科。純靜態、免安裝、免登入，手機、平板、電腦都能玩，第一次開過之後離線也能用。

頂端切換科目，底部分頁隨科目變換。星星、貼紙、每日任務、連續天數全科共用。

## 國語（注音）

底部五個分頁：

| 分頁 | 內容 |
|---|---|
| 注音表 | 37 個符號分聲母、介音、韻母。點一下唸符號和例字。 |
| 闖關 | 南一版國語首冊闖關地圖。每課有新符號、自編練習詞、選一選與拼一拼；答對 6 成過關並解鎖下一課。 |
| 拼拼看 | 選聲母、介音、韻母、聲調拼出國字。 |
| 遊戲 | 遊戲樂園，見下表。上方顯示今日任務。 |
| 我的 | 今日任務、連續天數、貼紙收集冊（94 種動物）、學習統計、家長設定（解鎖全部課程）。 |

遊戲樂園：

| 遊戲 | 玩法 |
|---|---|
| 聲調耳朵 | 聽真人唸一個字，選一到四聲，答完顯示聲調曲線。 |
| 注音打地鼠 | 45 秒內聽音打地鼠，有連擊分數；出題範圍依課本進度，速度可選慢／一般／快。 |
| 找不同 | 四張圖裡找出開頭聲母不同的一張，刻意搭配易混淆的音（ㄅ/ㄆ、ㄉ/ㄊ、ㄓ/ㄗ…）。 |
| 寫寫看 | 手指描寫注音，依覆蓋率判定完成，亂塗不算。 |
| 我也會唸 | 聽老師唸，再錄自己的聲音對照。錄音只留在裝置記憶體，不上傳。 |
| 聽聽看、翻翻樂、動物復習 | 原有的聽音選符號、配對遊戲、94 種動物注音。 |

獎勵：每日三個任務、連續天數、課本過關／全對／任務完成可得動物貼紙。

## 數學（一上）

| 分頁 | 內容 |
|---|---|
| 闖關 | 8 關：數到 5、數到 10、比多少、數字排排站、分與合、加法、減法、加減大挑戰。答對 6 成過關解鎖下一關。 |
| 練習 | 8 種題型自由選，範圍 5／10／20 以內。 |
| 我的 | 與國語共用，加上數學過關數與答對率。 |

題目全部由程式即時產生（`js/subjects/math/index.js` 的 `GEN`）。0–10 的數字在「真人」模式用教育部辭典錄音，算式用合成語音。

> 目前關卡是**通用版**，尚未對照特定出版社課本。課本單元對照只要改 `js/subjects/math/curriculum.js`（`BOOK`、`STAGES`），程式不用動。

## 架構與新增科目

```
js/
  app.js                 殼層：載入科目、頂欄、啟動
  core/                  全科共用
    router.js            科目註冊、分頁列、#hash 路由
    store.js             進度（localStorage）；新科目紀錄放 data.subj[<id>]
    daily.js             每日任務卡
    audio.js voice_map.js 真人／合成發音、音效
    ui.js confetti.js    DOM 小工具、插圖、彩帶
  subjects/
    zhuyin/              國語：data / textbook / animals / play / index
    math/                數學：curriculum（關卡資料）/ index（題型與畫面）
```

新增一科（例：小一下數學、生活、英語）：

1. 建 `js/subjects/<id>/index.js`，呼叫 `registerSubject({ id, name, logo, home, tabs, views, progressSection? })`。view 名稱即網址 `#hash`，全站唯一，請加科目前綴。
2. 需要每日任務就 `registerTasks([{ id, goal, icon, label, go, subj: "<id>" }])`；每天自動從注音抽 2 個、其他科各抽 1 個。
3. 在 `js/app.js` 加一行 `import "./subjects/<id>/index.js";`。
4. 把新檔案加進 `sw.js` 的 `ASSETS`，並把 `CACHE` 版本號 +1。

其他年級、學期（一下、二上…）放同一科目資料夾，用不同 curriculum 檔切換，不要另開 repo。

## 技術

- 單純 HTML / CSS / JavaScript（ES modules），沒有框架、沒有建置步驟。原本 `#learn`、`#book` 等網址與舊進度都不變。
- 發音有兩種模式，右上角「真人／合成」切換：
  - **真人**（預設）：教育部《國語辭典簡編本》的真人錄音，經萌典取得，CC BY-ND 3.0 TW。只收錄讀音與本站注音完全一致的錄音，並只擷取開頭朗讀詞目的段落，不更動內容。約 97% 的字詞有錄音，其餘自動改用合成語音。
  - **合成**：瀏覽器內建 `speechSynthesis`（zh-TW）。
- 音效用 WebAudio 即時合成。插圖採用 [OpenMoji](https://openmoji.org)（CC BY-SA 4.0）的 SVG，隨 repo 自帶，所有裝置風格一致，可離線。
- PWA：含 manifest 和 service worker，可「加到主畫面」並離線使用。
- 支援 `prefers-reduced-motion`，所有可點元素最小 44px，鍵盤可操作。

## 部署到 GitHub Pages

1. Repo → **Settings → Pages**。
2. Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾 `/ (root)`，按 Save。
3. 約一分鐘後網址為 `https://<帳號>.github.io/zhuyin-playground/`。

## 本機預覽

```bash
python3 -m http.server 8000
# 開 http://localhost:8000
```

語音合成在部分瀏覽器需要 https 或 localhost 才會作用，直接雙擊 index.html 可能沒有聲音。

## 授權

程式碼 MIT。插圖 OpenMoji，CC BY-SA 4.0，© OpenMoji 貢獻者。真人發音錄音 © 中華民國教育部《國語辭典簡編本》，CC BY-ND 3.0 TW。
