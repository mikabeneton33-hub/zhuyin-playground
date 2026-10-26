# ㄅㄆㄇ 注音樂園 · Zhuyin Playground

給學齡前到國小低年級小朋友的注音符號學習網站。純靜態、免安裝、免登入，手機、平板、電腦都能玩，第一次開過之後離線也能用。

## 功能

| 分頁 | 內容 |
|---|---|
| 注音表 | 37 個符號分聲母、介音、韻母三區。點一下唸出符號和例字，例字配插圖。 |
| 拼拼看 | 選聲母、介音、韻母和聲調，拼出一個國字並唸出來。拼不出字的選項會自動變淡。 |
| 聽聽看 | 播放一個音，從 4 個選項點出正確符號。8 題一回合，答對有彩帶和音效。 |
| 翻翻樂 | 符號和例字的翻牌配對遊戲，手機 6 對、平板和電腦 9 對。 |
| 動物 | 小一動物復習，94 種國小一二年級常見動物（讀音依教育部重編國語辭典）。「選一選」看動物從三組注音挑正確的；「拼一拼」用注音鍵盤逐字拼出讀音，含輕聲。 |
| 我的 | 星星數、學過的符號、答對率。進度存在瀏覽器本機。 |

## 技術

- 單純 HTML / CSS / JavaScript（ES modules），沒有框架、沒有建置步驟。
- 發音用瀏覽器內建的 `speechSynthesis`（zh-TW）。免費，但音質依裝置而異；裝置沒有中文語音時會提示到系統設定安裝。
- 單一符號先讓引擎唸符號本身，引擎跳過沒出聲時退回呼讀音字（ㄅ→玻、ㄈ→佛）。語音引擎無法發出孤立子音，所以聲母一定帶一個母音。
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

程式碼 MIT。插圖 OpenMoji，CC BY-SA 4.0，© OpenMoji 貢獻者。
