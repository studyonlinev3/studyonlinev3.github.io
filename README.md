# 學測練習小卡 (Study Cards)

這是一個靜態的前端網站樣板，專為學測生設計，功能包括：

- 把重點做成一張張小卡（可新增）
- 可以篩選科目：國文、英文、數學、化學、生物、物理、地科、社會
- 加入 / 取消星號（儲存於 localStorage）
- 假登入功能（任意帳號，儲存在 localStorage，僅作 UI 示範）

部署與測試
1. 將 index.html、css/styles.css、js/app.js 與 README.md 加入 repository（或直接把整個資料夾放到 GitHub Pages）。
2. 本機快速測試：
   - 於專案根目錄啟動簡單伺服器（例如 Python）：`python -m http.server 8000`
   - 開啟瀏覽器到 `http://localhost:8000/`
3. 若使用 GitHub Pages：將檔案推到 main 分支後到 GitHub repo 設定啟用 Pages（branch: main / root）。

可能的擴充（建議）
- 把卡片資料儲存在後端 API 或 JSON 檔，支援跨裝置同步。
- 正式登入 / 帳號系統（OAuth / 自己的 Auth），並把使用者的 starred 與筆記同步到伺服器。
- 加入標籤、題目型態（選擇題、問答題）、複習排程（間隔重複 / SRS）。
- 匯入匯出（CSV / JSON）、分享卡片或建立題庫。

授權
隨意修改並部署於 GitHub Pages 或其他靜態站台服務。歡迎你告訴我想要的額外功能，我可以幫你擴充前端或設計 API 規格。