(function () {
  "use strict";

  // =========================
  // 基本工具
  // =========================
  function $(id) {
    return document.getElementById(id);
  }

  function getVal(id) {
    const el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function setVal(id, value) {
    const el = $(id);
    if (el) el.value = value == null ? "" : String(value);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escJsString(str) {
    return String(str || "")
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
  }

  function escSingleQuote(str) {
    return String(str || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
  }

  function slugify(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function randomSecret(length = 16) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars[arr[i] % chars.length];
    }
    return out;
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }

  function setStatus(text, isError = false) {
    const el = $("status");
    if (!el) return;
    el.textContent = text || "";
    el.className = "status " + (isError ? "err" : "ok");
  }

  // =========================
  // 主題
  // =========================
  const THEME_PRESETS = {
    cream: {
      name: "奶油暖白",
      main: "#B88A68",
      bg: "#FBF8F3",
      card: "#FFFFFF",
      border: "#E8E0D6",
      text: "#3A332D",
      muted: "#857B70",
      soft: "#F4EEE7",
      btn: "#B88A68",
      btnText: "#FFFFFF",
      previewBg: "#FFFDFC"
    },
    mori: {
      name: "莫蘭迪灰",
      main: "#8C8A86",
      bg: "#F5F4F2",
      card: "#FFFFFF",
      border: "#DDD9D3",
      text: "#353330",
      muted: "#7A7772",
      soft: "#ECE9E4",
      btn: "#8C8A86",
      btnText: "#FFFFFF",
      previewBg: "#FAF9F7"
    },
    teal: {
      name: "質感青綠",
      main: "#6F8F88",
      bg: "#F3F7F5",
      card: "#FFFFFF",
      border: "#D9E4DF",
      text: "#2F3835",
      muted: "#6F7F79",
      soft: "#E7EFEC",
      btn: "#6F8F88",
      btnText: "#FFFFFF",
      previewBg: "#F8FBFA"
    },
    pink: {
      name: "朝氣粉嫩",
      main: "#D59B9F",
      bg: "#FFF7F7",
      card: "#FFFFFF",
      border: "#F0DCDD",
      text: "#433536",
      muted: "#8D7678",
      soft: "#FAECEC",
      btn: "#D59B9F",
      btnText: "#FFFFFF",
      previewBg: "#FFFDFD"
    },
    mono: {
      name: "簡單黑白",
      main: "#2F2F2F",
      bg: "#F7F7F6",
      card: "#FFFFFF",
      border: "#DDDDDA",
      text: "#262626",
      muted: "#737373",
      soft: "#EFEFEC",
      btn: "#2F2F2F",
      btnText: "#FFFFFF",
      previewBg: "#FFFFFF"
    },
    forest: {
      name: "森林大地",
      main: "#6E7B5D",
      bg: "#F5F4EE",
      card: "#FFFFFF",
      border: "#D9D8CB",
      text: "#35382F",
      muted: "#767B6D",
      soft: "#EAEBDD",
      btn: "#6E7B5D",
      btnText: "#FFFFFF",
      previewBg: "#FAFAF6"
    }
  };

  // =========================
  // 收資料
  // =========================
  function collectFormData() {
    const themeKey = getVal("themePreset") || "cream";
    const preset = THEME_PRESETS[themeKey] || THEME_PRESETS.cream;

    const contractTitle = getVal("contractTitle") || "寵物美容服務定型化契約";
    const storeName = getVal("storeName");
    const storeCompanyName = getVal("storeCompanyName") || storeName;
    const storeAddress = getVal("storeAddress");
    const storeLine = getVal("storeLine");
    const backupEmail = getVal("backupEmail");
    const storeVetName = getVal("storeVetName");
    const storeVetPhone = getVal("storeVetPhone");
    const storeVetAddress = getVal("storeVetAddress");
    const liffId = getVal("liffId");
    const googleScriptUrl = getVal("googleScriptUrl");
    const sharedSecret = getVal("sharedSecret");
    const debugMode = getVal("debugMode") || "false";
    const zipName = getVal("zipName") || slugify(storeName || "pet-contract-generator");
    const repoName = getVal("repoName") || slugify(storeName || "pet-contract");
    const mainColor = getVal("mainColor") || preset.main;
    const bgColor = getVal("bgColor") || preset.bg;

    return {
      themeKey,
      theme: {
        ...preset,
        main: mainColor,
        bg: bgColor
      },
      contractTitle,
      storeName,
      storeCompanyName,
      storeAddress,
      storeLine,
      backupEmail,
      storeVetName,
      storeVetPhone,
      storeVetAddress,
      liffId,
      googleScriptUrl,
      sharedSecret,
      debugMode,
      zipName,
      repoName
    };
  }

  // =========================
  // 主題套用
  // =========================
  function updatePrimaryButtonColor(theme) {
    document.querySelectorAll(".btnPrimary").forEach((btn) => {
      btn.style.background = theme.btn || theme.main;
      btn.style.color = theme.btnText || "#FFFFFF";
    });
  }

  function applyThemePreset(presetKey) {
    const theme = THEME_PRESETS[presetKey];
    if (!theme) return;

    setVal("mainColor", theme.main);
    setVal("bgColor", theme.bg);

    document.documentElement.style.setProperty("--bg", theme.bg);
    document.documentElement.style.setProperty("--card", theme.card);
    document.documentElement.style.setProperty("--border", theme.border);
    document.documentElement.style.setProperty("--text", theme.text);
    document.documentElement.style.setProperty("--muted", theme.muted);
    document.documentElement.style.setProperty("--latte", theme.main);
    document.documentElement.style.setProperty("--danger", "#8A4B4B");
    document.documentElement.style.setProperty("--ok", "#355B45");
    document.documentElement.style.setProperty("--shadow", "0 14px 34px rgba(0,0,0,.06)");

    updatePrimaryButtonColor(theme);
    renderPreview();
  }

  function applyCustomColors() {
    const presetKey = getVal("themePreset") || "cream";
    const preset = THEME_PRESETS[presetKey] || THEME_PRESETS.cream;
    const main = getVal("mainColor") || preset.main;
    const bg = getVal("bgColor") || preset.bg;

    document.documentElement.style.setProperty("--bg", bg);
    document.documentElement.style.setProperty("--latte", main);

    document.querySelectorAll(".btnPrimary").forEach((btn) => {
      btn.style.background = main;
      btn.style.color = "#FFFFFF";
    });

    renderPreview();
  }

  // =========================
  // 即時預覽
  // =========================
  function renderPreview() {
    const data = collectFormData();
    const theme = data.theme;

    const html = `
<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box}
  body{
    margin:0;
    padding:22px;
    background:${theme.bg};
    color:${theme.text};
    font-family:"Noto Sans TC",-apple-system,BlinkMacSystemFont,"PingFang TC","Microsoft JhengHei",sans-serif;
  }
  .card{
    max-width:860px;
    margin:0 auto;
    background:${theme.card};
    border:1px solid ${theme.border};
    border-radius:24px;
    padding:24px;
    box-shadow:0 10px 30px rgba(0,0,0,.05);
  }
  .title{
    font-size:28px;
    font-weight:900;
    margin:0 0 8px;
  }
  .bar{
    width:60px;
    height:6px;
    border-radius:999px;
    background:${theme.main};
    margin:0 0 16px;
  }
  .chip{
    display:inline-block;
    padding:8px 12px;
    border-radius:999px;
    background:${theme.soft};
    color:${theme.text};
    font-size:12px;
    font-weight:900;
    margin-bottom:18px;
  }
  .grid{
    display:grid;
    gap:12px;
    margin-top:6px;
  }
  .box{
    background:${theme.previewBg};
    border:1px solid ${theme.border};
    border-radius:16px;
    padding:14px 16px;
  }
  .label{
    font-size:12px;
    color:${theme.muted};
    font-weight:800;
    margin-bottom:6px;
  }
  .value{
    font-size:15px;
    font-weight:800;
    line-height:1.7;
  }
  .sectionTitle{
    margin:24px 0 10px;
    font-size:18px;
    font-weight:900;
  }
  .paragraph{
    font-size:14px;
    line-height:1.9;
  }
  .btn{
    display:inline-block;
    margin-top:18px;
    background:${theme.main};
    color:#fff;
    border:none;
    border-radius:14px;
    padding:12px 18px;
    font-size:14px;
    font-weight:900;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="title">${escapeHtml(data.contractTitle || "寵物美容服務定型化契約")}</div>
    <div class="bar"></div>
    <div class="chip">${escapeHtml(theme.name)}</div>

    <div class="grid">
      <div class="box">
        <div class="label">店名</div>
        <div class="value">${escapeHtml(data.storeName || "ＯＯ寵物美容")}</div>
      </div>
      <div class="box">
        <div class="label">公司名稱</div>
        <div class="value">${escapeHtml(data.storeCompanyName || data.storeName || "ＯＯ寵物有限公司")}</div>
      </div>
      <div class="box">
        <div class="label">店家地址</div>
        <div class="value">${escapeHtml(data.storeAddress || "台北市ＯＯ區ＯＯ路123號")}</div>
      </div>
      <div class="box">
        <div class="label">官方 LINE</div>
        <div class="value">${escapeHtml(data.storeLine || "@example1234")}</div>
      </div>
      <div class="box">
        <div class="label">指定動物醫院</div>
        <div class="value">${escapeHtml(
          data.storeVetName
            ? `${data.storeVetName}${data.storeVetPhone ? "｜" + data.storeVetPhone : ""}${data.storeVetAddress ? "｜" + data.storeVetAddress : ""}`
            : "尚未填寫"
        )}</div>
      </div>
    </div>

    <div class="sectionTitle">契約畫面預覽</div>
    <div class="paragraph">
      本契約頁面將提供飼主線上填寫基本資料、審閱定型化契約內容，並於送出前完成簽名確認。
      目前預覽已同步你選擇的品牌主題與主色設定。
    </div>

    <button class="btn" type="button">送出契約資料</button>
  </div>
</body>
</html>
    `.trim();

    const frame = $("previewFrame");
    if (frame) frame.srcdoc = html;
  }

  // =========================
  // 產出 index.html
  // =========================
  function buildGeneratedIndexHtml(data) {
    const t = data.theme;
    return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escapeHtml(data.contractTitle)}</title>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700;800;900&display=swap');

    :root{
      --bg:${t.bg};
      --card:${t.card};
      --border:${t.border};
      --text:${t.text};
      --muted:${t.muted};
      --main:${t.main};
      --soft:${t.soft};
      --danger:#8A4B4B;
      --ok:#355B45;
      --radius:22px;
      --radius-sm:16px;
      --shadow:0 10px 28px rgba(0,0,0,.06);
    }

    *{ box-sizing:border-box; }
    html,body{
      margin:0;
      padding:0;
      background:var(--bg);
      color:var(--text);
      font-family:"Noto Sans TC",-apple-system,BlinkMacSystemFont,"PingFang TC","Microsoft JhengHei",sans-serif;
    }

    .wrap{
      max-width:920px;
      margin:0 auto;
      padding:24px 16px 36px;
    }

    .card{
      background:var(--card);
      border:1px solid var(--border);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:20px;
    }

    .title{
      font-size:30px;
      font-weight:900;
      margin:0 0 8px;
      text-align:center;
    }

    .sub{
      color:var(--muted);
      text-align:center;
      line-height:1.8;
      margin:0 0 22px;
      font-size:14px;
      font-weight:700;
    }

    .section{
      margin-top:18px;
      padding-top:6px;
    }

    .sectionTitle{
      font-size:18px;
      font-weight:900;
      margin:0 0 12px;
      display:flex;
      align-items:center;
      gap:10px;
    }

    .sectionTitle::before{
      content:"";
      display:block;
      width:8px;
      height:24px;
      border-radius:999px;
      background:var(--main);
    }

    .label{
      font-size:14px;
      font-weight:900;
      margin:14px 0 8px;
    }

    .input, .textarea{
      width:100%;
      border:1.4px solid var(--border);
      border-radius:14px;
      background:#fff;
      color:var(--text);
      padding:12px 14px;
      font-size:15px;
      outline:none;
    }

    .textarea{
      min-height:180px;
      resize:vertical;
      line-height:1.8;
    }

    .row2{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }

    .agreeBox{
      margin-top:14px;
      padding:14px;
      border-radius:16px;
      background:var(--soft);
      border:1px solid var(--border);
      line-height:1.8;
      font-size:14px;
    }

    .checkRow{
      display:flex;
      align-items:flex-start;
      gap:10px;
      margin-top:12px;
      font-size:14px;
      line-height:1.8;
      font-weight:700;
    }

    .sigWrap{
      margin-top:12px;
      border:1.4px solid var(--border);
      border-radius:16px;
      background:#fff;
      overflow:hidden;
    }

    #sig{
      width:100%;
      height:220px;
      display:block;
      touch-action:none;
      background:#fff;
    }

    .sigBar{
      display:flex;
      justify-content:flex-end;
      padding:10px;
      border-top:1px solid var(--border);
      background:#FCFCFB;
    }

    .btnRow{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-top:16px;
    }

    .btn{
      border:none;
      border-radius:14px;
      padding:14px 16px;
      font-size:15px;
      font-weight:900;
      cursor:pointer;
    }

    .btnPrimary{
      background:var(--main);
      color:#fff;
    }

    .btnLight{
      background:#EFEDE9;
      color:#222;
    }

    .status{
      margin-top:14px;
      font-size:14px;
      font-weight:800;
      white-space:pre-line;
      line-height:1.8;
    }

    .tiny{
      margin-top:10px;
      font-size:12px;
      color:var(--muted);
      line-height:1.8;
    }

    @media (max-width:720px){
      .row2, .btnRow{
        grid-template-columns:1fr;
      }
      .title{
        font-size:25px;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1 class="title">${escapeHtml(data.contractTitle)}</h1>
      <p class="sub">
        請於服務前填寫基本資料、審閱契約內容，並完成電子簽名後送出。<br>
        店家：${escapeHtml(data.storeName || "未設定店名")}
      </p>

      <div class="section">
        <div class="sectionTitle">店家資訊</div>
        <div class="row2">
          <div>
            <div class="label">店名</div>
            <input class="input" value="${escapeHtml(data.storeName)}" readonly>
          </div>
          <div>
            <div class="label">公司名稱</div>
            <input class="input" value="${escapeHtml(data.storeCompanyName)}" readonly>
          </div>
        </div>

        <div class="label">店家地址</div>
        <input class="input" value="${escapeHtml(data.storeAddress)}" readonly>

        <div class="row2">
          <div>
            <div class="label">官方 LINE</div>
            <input class="input" value="${escapeHtml(data.storeLine)}" readonly>
          </div>
          <div>
            <div class="label">備份 Email</div>
            <input class="input" value="${escapeHtml(data.backupEmail)}" readonly>
          </div>
        </div>

        <div class="label">指定動物醫院</div>
        <input class="input" value="${escapeHtml(
          data.storeVetName
            ? `${data.storeVetName}${data.storeVetPhone ? "｜" + data.storeVetPhone : ""}${data.storeVetAddress ? "｜" + data.storeVetAddress : ""}`
            : ""
        )}" readonly>
      </div>

      <div class="section">
        <div class="sectionTitle">飼主與毛孩基本資料</div>
        <div class="row2">
          <div>
            <div class="label">飼主姓名</div>
            <input id="ownerName" class="input" placeholder="請輸入飼主姓名">
          </div>
          <div>
            <div class="label">聯絡電話</div>
            <input id="ownerPhone" class="input" placeholder="請輸入電話">
          </div>
        </div>

        <div class="label">Email</div>
        <input id="ownerEmail" class="input" placeholder="請輸入 Email">

        <div class="row2">
          <div>
            <div class="label">毛孩姓名</div>
            <input id="petName" class="input" placeholder="請輸入毛孩姓名">
          </div>
          <div>
            <div class="label">品種</div>
            <input id="petBreed" class="input" placeholder="例：比熊、貴賓">
          </div>
        </div>

        <div class="row2">
          <div>
            <div class="label">性別</div>
            <input id="petSex" class="input" placeholder="例：公 / 母">
          </div>
          <div>
            <div class="label">年齡</div>
            <input id="petAge" class="input" placeholder="例：3歲">
          </div>
        </div>
      </div>

      <div class="section">
        <div class="sectionTitle">契約內容</div>
        <textarea id="contractText" class="textarea">一、甲方已知悉並同意乙方所提供之寵物美容服務內容與相關風險。
二、乙方於美容過程中，若發現寵物有明顯身體不適，得視情況暫停服務並通知甲方。
三、如遇緊急狀況而甲方無法即時聯繫，甲方同意乙方得逕送指定動物醫院處理。
四、甲方確認所填資料皆為真實，並同意本契約以電子方式簽署存證。</textarea>

        <div class="agreeBox">
          甲方已獲合理審閱期間，並同意以電子方式簽署本契約。送出後，系統將寄送一份契約副本至飼主 Email 與店家備份信箱。
        </div>

        <label class="checkRow">
          <input id="agree" type="checkbox">
          <span>我已閱讀並同意以上契約內容</span>
        </label>
      </div>

      <div class="section">
        <div class="sectionTitle">電子簽名</div>
        <div class="sigWrap">
          <canvas id="sig"></canvas>
          <div class="sigBar">
            <button id="clearBtn" class="btn btnLight" type="button">清除簽名</button>
          </div>
        </div>
      </div>

      <div class="btnRow">
        <button id="submitBtn" class="btn btnPrimary" type="button">送出契約</button>
        <button id="debugBtn" class="btn btnLight" type="button">測試連線</button>
      </div>

      <div id="msg" class="status"></div>

      <div class="tiny">
        LIFF ID：${escapeHtml(data.liffId || "尚未設定")}<br>
        GAS：${escapeHtml(data.googleScriptUrl || "尚未設定")}<br>
        Debug：${escapeHtml(data.debugMode)}
      </div>
    </div>
  </div>

  <script>
    const LIFF_ID = '${escSingleQuote(data.liffId)}';
    const GOOGLE_SCRIPT_URL = '${escSingleQuote(data.googleScriptUrl)}';
    const SHARED_SECRET = '${escSingleQuote(data.sharedSecret)}';
    const DEBUG_MODE = ${data.debugMode === "true" ? "true" : "false"};

    function $(id){ return document.getElementById(id); }

    function setMsg(text, isError){
      const el = $('msg');
      el.textContent = text || '';
      el.style.color = isError ? 'var(--danger)' : 'var(--ok)';
    }

    function isCanvasBlank(canvas){
      const ctx = canvas.getContext('2d');
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for(let i=0; i<pixels.length; i+=4){
        if(pixels[i+3] !== 0 && !(pixels[i] === 255 && pixels[i+1] === 255 && pixels[i+2] === 255)){
          return false;
        }
      }
      return true;
    }

    const canvas = $('sig');
    const ctx = canvas.getContext('2d');
    let drawing = false;

    function resizeCanvas(){
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = '#333333';
    }

    function point(e){
      const rect = canvas.getBoundingClientRect();
      const t = e.touches && e.touches[0] ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }

    function down(e){
      e.preventDefault();
      drawing = true;
      const p = point(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }

    function move(e){
      if(!drawing) return;
      e.preventDefault();
      const p = point(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    function up(){
      drawing = false;
    }

    function getData(){
      return {
        ownerName: $('ownerName').value.trim(),
        ownerPhone: $('ownerPhone').value.trim(),
        ownerEmail: $('ownerEmail').value.trim(),
        petName: $('petName').value.trim(),
        petBreed: $('petBreed').value.trim(),
        petSex: $('petSex').value.trim(),
        petAge: $('petAge').value.trim()
      };
    }

    function validate(data){
      if(!data.ownerName) return '請填寫飼主姓名';
      if(!data.ownerPhone) return '請填寫聯絡電話';
      if(!data.ownerEmail) return '請填寫 Email';
      if(!data.petName) return '請填寫毛孩姓名';
      if(!$('agree').checked) return '請先勾選同意契約內容';
      if(isCanvasBlank(canvas)) return '請先簽名';
      if(!GOOGLE_SCRIPT_URL) return '尚未設定 Google Script URL';
      if(!SHARED_SECRET) return '尚未設定 sharedSecret';
      return '';
    }

    async function submitData(){
      const data = getData();
      const err = validate(data);
      if(err){
        setMsg(err, true);
        return;
      }

      setMsg('資料送出中，請稍候...', false);

      try{
        const payload = {
          secret: SHARED_SECRET,
          data,
          contractText: $('contractText').value || '',
          signatureDataUrl: canvas.toDataURL('image/png')
        };

        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const text = await res.text();
        let json = null;
        try{ json = JSON.parse(text); }catch(_){}

        if(!res.ok){
          throw new Error('HTTP ' + res.status);
        }

        if(json && json.ok){
          setMsg('送出成功，契約已完成。', false);
        }else{
          setMsg('送出失敗：' + (json && json.error ? json.error : text), true);
        }
      }catch(err){
        setMsg('送出失敗：' + (err && err.message ? err.message : err), true);
      }
    }

    async function debugPing(){
      if(!GOOGLE_SCRIPT_URL){
        setMsg('尚未設定 Google Script URL', true);
        return;
      }
      setMsg('測試連線中...', false);
      try{
        const res = await fetch(GOOGLE_SCRIPT_URL);
        const text = await res.text();
        setMsg('連線成功：' + text, false);
      }catch(err){
        setMsg('連線失敗：' + (err && err.message ? err.message : err), true);
      }
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('DOMContentLoaded', resizeCanvas);

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);

    canvas.addEventListener('touchstart', down, { passive:false });
    canvas.addEventListener('touchmove', move, { passive:false });
    window.addEventListener('touchend', up);

    $('clearBtn').addEventListener('click', resizeCanvas);
    $('submitBtn').addEventListener('click', submitData);
    $('debugBtn').addEventListener('click', debugPing);
  </script>
</body>
</html>`;
  }

  // =========================
  // 產出 Code.gs
  // =========================
  function buildGeneratedCodeGs(data) {
    return `const SHARED_SECRET = '${escSingleQuote(data.sharedSecret)}';
const BACKUP_EMAIL = '${escSingleQuote(data.backupEmail)}';
const SAVE_PDF_TO_DRIVE = false;

const STORE_NAME = '${escSingleQuote(data.storeName)}';
const STORE_DISPLAY_NAME = '${escSingleQuote(data.storeName)}';
const STORE_COMPANY_NAME = '${escSingleQuote(data.storeCompanyName)}';
const STORE_ADDRESS = '${escSingleQuote(data.storeAddress)}';
const STORE_LINE = '${escSingleQuote(data.storeLine)}';

const STORE_VET = {
  name: '${escSingleQuote(data.storeVetName)}',
  phone: '${escSingleQuote(data.storeVetPhone)}',
  address: '${escSingleQuote(data.storeVetAddress)}'
};

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'GAS is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    const payload = JSON.parse(raw || '{}');

    if (!payload || payload.secret !== SHARED_SECRET) {
      return jsonOut({ ok: false, error: 'Unauthorized' });
    }

    const data = normalizeData_(payload.data || {});
    const sigDataUrl = String(payload.signatureDataUrl || '');
    const contractText = String(payload.contractText || '');

    const ownerEmail = safe_(data.ownerEmail);
    if (!ownerEmail) return jsonOut({ ok: false, error: 'Missing ownerEmail' });
    if (!isValidEmail_(ownerEmail)) return jsonOut({ ok: false, error: 'Invalid ownerEmail' });

    const subject = '【' + STORE_NAME + '】寵物美容電子契約';
    const htmlBody = buildHtmlMail_(data, contractText);
    const plainBody = buildPlainMail_(data, contractText);

    const attachments = [];
    if (sigDataUrl && /^data:image\\/png;base64,/.test(sigDataUrl)) {
      try {
        const base64 = sigDataUrl.replace(/^data:image\\/png;base64,/, '');
        const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/png', 'signature.png');
        attachments.push(blob);
      } catch (err) {
        Logger.log('signature parse failed: ' + err);
      }
    }

    MailApp.sendEmail({
      to: ownerEmail,
      bcc: BACKUP_EMAIL || undefined,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      attachments: attachments
    });

    return jsonOut({
      ok: true,
      message: 'Mail sent',
      storeName: STORE_NAME
    });

  } catch (err) {
    return jsonOut({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function buildHtmlMail_(data, contractText) {
  const vetLine = [
    STORE_VET.name || '',
    STORE_VET.phone || '',
    STORE_VET.address || ''
  ].filter(Boolean).join('｜');

  return ''
    + '<div style="font-family:Arial,\\'Noto Sans TC\\',sans-serif;line-height:1.9;color:#333;">'
    + '<h2 style="margin:0 0 12px;">' + esc_(STORE_NAME) + '｜寵物美容電子契約</h2>'
    + '<p>您好，以下為本次電子契約留存資料：</p>'
    + '<table style="border-collapse:collapse;width:100%;max-width:700px;">'
    + rowHtml_('飼主姓名', data.ownerName)
    + rowHtml_('聯絡電話', data.ownerPhone)
    + rowHtml_('Email', data.ownerEmail)
    + rowHtml_('毛孩姓名', data.petName)
    + rowHtml_('品種', data.petBreed)
    + rowHtml_('性別', data.petSex)
    + rowHtml_('年齡', data.petAge)
    + rowHtml_('店名', STORE_NAME)
    + rowHtml_('公司名稱', STORE_COMPANY_NAME)
    + rowHtml_('店家地址', STORE_ADDRESS)
    + rowHtml_('官方 LINE', STORE_LINE)
    + rowHtml_('指定動物醫院', vetLine)
    + '</table>'
    + '<div style="margin-top:18px;padding:14px;border:1px solid #ddd;border-radius:12px;background:#fafafa;white-space:pre-wrap;">'
    + esc_(contractText || '')
    + '</div>'
    + '<p style="margin-top:18px;">此信件由系統自動寄出，請勿直接回覆。</p>'
    + '</div>';
}

function buildPlainMail_(data, contractText) {
  const lines = [
    STORE_NAME + '｜寵物美容電子契約',
    '',
    '飼主姓名：' + safe_(data.ownerName),
    '聯絡電話：' + safe_(data.ownerPhone),
    'Email：' + safe_(data.ownerEmail),
    '毛孩姓名：' + safe_(data.petName),
    '品種：' + safe_(data.petBreed),
    '性別：' + safe_(data.petSex),
    '年齡：' + safe_(data.petAge),
    '',
    '店名：' + STORE_NAME,
    '公司名稱：' + STORE_COMPANY_NAME,
    '店家地址：' + STORE_ADDRESS,
    '官方 LINE：' + STORE_LINE,
    '指定動物醫院：' + [STORE_VET.name || '', STORE_VET.phone || '', STORE_VET.address || ''].filter(Boolean).join('｜'),
    '',
    '契約內容：',
    contractText || '',
    '',
    '此信件由系統自動寄出，請勿直接回覆。'
  ];
  return lines.join('\\n');
}

function rowHtml_(label, value) {
  return ''
    + '<tr>'
    + '<td style="border:1px solid #ddd;padding:8px 10px;background:#f5f5f5;font-weight:bold;width:160px;">' + esc_(label) + '</td>'
    + '<td style="border:1px solid #ddd;padding:8px 10px;">' + esc_(value || '') + '</td>'
    + '</tr>';
}

function normalizeData_(data) {
  return {
    ownerName: safe_(data.ownerName),
    ownerPhone: safe_(data.ownerPhone),
    ownerEmail: safe_(data.ownerEmail),
    petName: safe_(data.petName),
    petBreed: safe_(data.petBreed),
    petSex: safe_(data.petSex),
    petAge: safe_(data.petAge)
  };
}

function safe_(v) {
  return String(v || '').trim();
}

function isValidEmail_(email) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(email || '').trim());
}

function esc_(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
  }

  // =========================
  // 產出 README.md
  // =========================
  function buildGeneratedReadme(data) {
    return `# ${data.repoName || "pet-contract"}

## 專案內容
此專案為「${data.storeName || "寵物美容店"}」使用的寵物美容電子契約範本，包含：

- \`index.html\`：前端電子契約頁面
- \`Code.gs\`：Google Apps Script 後端收件與寄信程式
- \`README.md\`：部署說明

---

## 店家資訊
- 契約標題：${data.contractTitle || ""}
- 店名：${data.storeName || ""}
- 公司名稱：${data.storeCompanyName || ""}
- 店家地址：${data.storeAddress || ""}
- 官方 LINE：${data.storeLine || ""}
- 備份信箱：${data.backupEmail || ""}
- 指定動物醫院：${[
      data.storeVetName || "",
      data.storeVetPhone || "",
      data.storeVetAddress || ""
    ].filter(Boolean).join("｜")}

---

## 部署流程

### 1. GitHub Pages
1. 建立新的 GitHub Repo
2. 上傳 \`index.html\`
3. 到 **Settings → Pages**
4. Branch 選 \`main\`，資料夾選 \`/root\`
5. 儲存後取得公開網址

### 2. Google Apps Script
1. 建立新的 Apps Script 專案
2. 將 \`Code.gs\` 全部貼上覆蓋
3. 儲存後部署為 **網頁應用程式**
4. 權限建議：
   - Execute as：Me
   - Who has access：Anyone
5. 複製部署網址，填回前端的 \`GOOGLE_SCRIPT_URL\`

### 3. LINE LIFF
1. 到 LINE Developers 建立 LIFF
2. Endpoint URL 填入 GitHub Pages 的網址
3. 將取得的 LIFF ID 填回前端 \`LIFF_ID\`

---

## 目前設定
- LIFF ID：${data.liffId || "(尚未填寫)"}
- GAS URL：${data.googleScriptUrl || "(尚未填寫)"}
- sharedSecret：${data.sharedSecret || "(尚未填寫)"}
- Debug 模式：${data.debugMode || "false"}

---

## 注意事項
- 寄信會寄到飼主 Email，並 BCC 到店家備份信箱
- 簽名檔目前以 PNG 附件方式寄出
- 若之後要擴充成 PDF、Google Sheet 紀錄、LIFF 登入，可再往下接

---
本檔由「寵物美容電子契約生成器」自動產生。`;
  }

  // =========================
  // build
  // =========================
  function buildAll() {
    const data = collectFormData();

    if (!data.storeName) {
      setStatus("請先填寫店名。", true);
      return;
    }

    if (!data.sharedSecret) {
      setVal("sharedSecret", randomSecret(16));
      data.sharedSecret = getVal("sharedSecret");
    }

    if (!data.zipName) {
      const autoZip = slugify(data.storeName || "pet-contract-template");
      setVal("zipName", autoZip);
      data.zipName = autoZip;
    }

    if (!data.repoName) {
      const autoRepo = slugify(data.storeName || "pet-contract");
      setVal("repoName", autoRepo);
      data.repoName = autoRepo;
    }

    const indexHtml = buildGeneratedIndexHtml(data);
    const codeGs = buildGeneratedCodeGs(data);
    const readmeMd = buildGeneratedReadme(data);

    setVal("indexOut", indexHtml);
    setVal("codeOut", codeGs);
    setVal("readmeOut", readmeMd);

    renderPreview();
    setStatus("已成功生成 index.html、Code.gs、README.md");
  }

  async function downloadZip() {
    try {
      const indexOut = getVal("indexOut");
      const codeOut = getVal("codeOut");
      const readmeOut = getVal("readmeOut");
      const zipName = getVal("zipName") || "pet-contract-template";

      if (!indexOut || !codeOut || !readmeOut) {
        buildAll();
      }

      const finalIndex = getVal("indexOut");
      const finalCode = getVal("codeOut");
      const finalReadme = getVal("readmeOut");

      if (!finalIndex || !finalCode || !finalReadme) {
        setStatus("尚未生成完成，無法下載 ZIP。", true);
        return;
      }

      if (typeof JSZip === "undefined") {
        setStatus("找不到 JSZip，請確認 CDN 是否正常載入。", true);
        return;
      }

      const zip = new JSZip();
      zip.file("index.html", finalIndex);
      zip.file("Code.gs", finalCode);
      zip.file("README.md", finalReadme);

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 500);

      setStatus("ZIP 已下載完成。");
    } catch (err) {
      setStatus("下載 ZIP 失敗：" + (err && err.message ? err.message : err), true);
    }
  }

  // =========================
  // 範例 / 清空
  // =========================
  function fillSample() {
    setVal("contractTitle", "寵物美容服務定型化契約");
    setVal("storeName", "熊嶼寵物美容");
    setVal("storeCompanyName", "熊嶼寵物有限公司");
    setVal("storeAddress", "新北市板橋區ＯＯ路100號");
    setVal("storeLine", "@kumajima");
    setVal("backupEmail", "kumajima@example.com");
    setVal("storeVetName", "安心動物醫院");
    setVal("storeVetPhone", "02-1234-5678");
    setVal("storeVetAddress", "新北市板橋區ＯＯ街88號");
    setVal("themePreset", "cream");
    setVal("liffId", "2000000000-abcdefgh");
    setVal("googleScriptUrl", "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec");
    setVal("sharedSecret", randomSecret(16));
    setVal("debugMode", "false");
    setVal("zipName", "kumajima-contract-template");
    setVal("repoName", "kumajima-contract");

    applyThemePreset("cream");
    buildAll();
  }

  function resetAll() {
    [
      "contractTitle",
      "storeName",
      "storeCompanyName",
      "storeAddress",
      "storeLine",
      "backupEmail",
      "storeVetName",
      "storeVetPhone",
      "storeVetAddress",
      "liffId",
      "googleScriptUrl",
      "sharedSecret",
      "zipName",
      "repoName",
      "indexOut",
      "codeOut",
      "readmeOut"
    ].forEach((id) => setVal(id, ""));

    setVal("contractTitle", "寵物美容服務定型化契約");
    setVal("themePreset", "cream");
    setVal("debugMode", "false");
    applyThemePreset("cream");
    renderPreview();
    setStatus("已清空。");
  }

  // =========================
  // 複製
  // =========================
  async function copyFrom(targetId) {
    const text = getVal(targetId);
    if (!text) {
      setStatus("目前沒有可複製的內容。", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus(`已複製 ${targetId}`);
    } catch (err) {
      setStatus("複製失敗，請手動複製。", true);
    }
  }

  // =========================
  // 事件
  // =========================
  function bindEvents() {
    $("themePreset")?.addEventListener("change", (e) => {
      applyThemePreset(e.target.value);
    });

    $("mainColor")?.addEventListener("input", applyCustomColors);
    $("bgColor")?.addEventListener("input", applyCustomColors);

    $("genSecret")?.addEventListener("click", () => {
      setVal("sharedSecret", randomSecret(16));
      setStatus("已自動產生 sharedSecret。");
    });

    $("buildBtn")?.addEventListener("click", buildAll);
    $("downloadBtn")?.addEventListener("click", downloadZip);
    $("sampleBtn")?.addEventListener("click", fillSample);
    $("resetBtn")?.addEventListener("click", resetAll);

    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => copyFrom(btn.getAttribute("data-copy")));
    });

    [
      "contractTitle",
      "storeName",
      "storeCompanyName",
      "storeAddress",
      "storeLine",
      "backupEmail",
      "storeVetName",
      "storeVetPhone",
      "storeVetAddress"
    ].forEach((id) => {
      $(id)?.addEventListener("input", renderPreview);
    });
  }

  // =========================
  // 初始化
  // =========================
  window.addEventListener("DOMContentLoaded", () => {
    const preset = getVal("themePreset") || "cream";
    applyThemePreset(preset);
    bindEvents();
    renderPreview();
  });
})();
