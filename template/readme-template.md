# {{CONTRACT_TITLE}}｜安裝教學

## 店家資訊
- 店名：{{STORE_NAME}}
- 地址：{{STORE_ADDRESS}}
- 官方 LINE：{{STORE_LINE}}
- 備份信箱：{{BACKUP_EMAIL}}
- sharedSecret：{{SECRET}}

---

## Step 1｜建立 GitHub Repo
建議 Repo 名稱：
`{{REPO_NAME}}`

1. 建立新的 GitHub Repo
2. 把生成好的 `index.html` 貼上
3. 開啟 GitHub Pages
4. 確認網站網址可以正常打開

---

## Step 2｜建立 LINE LIFF
1. 到 LINE Developers 建立 Channel
2. 新增 LIFF
3. 複製 LIFF ID
4. 貼到 `STORE_CONFIG` 的 `liffId`

---

## Step 3｜建立 Google Apps Script
1. 建立新的 Apps Script 專案
2. 貼上生成好的 `Code.gs`
3. 執行一次授權
4. 部署成 Web App
5. 複製 `/exec` 網址
6. 貼到 `STORE_CONFIG` 的 `googleScriptUrl`

---

## Step 4｜修改 index.html 設定區
請只修改最上方的 `STORE_CONFIG`

不要修改其他主程式。

---

## Step 5｜測試
請實際測試一次：
- 頁面能正常打開
- 可以填資料
- 可以簽名
- 送出後店家有收到信
- 飼主有收到 PDF

---

## 常見錯誤檢查
1. GitHub Pages 是否已成功開啟
2. LIFF ID 是否貼正確
3. GAS `/exec` 網址是否貼正確
4. `sharedSecret` 前後端是否一致
5. Apps Script 是否有重新部署

---

## 問題回報格式
請一次提供：
1. 卡住的步驟
2. 畫面完整截圖
3. GitHub Pages 網址
4. LIFF ID 前後 4 碼
5. GAS `/exec` 網址前後 10 碼
6. sharedSecret 前後 3 碼
