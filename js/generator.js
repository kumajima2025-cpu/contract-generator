function $(id){ return document.getElementById(id); }

function getVal(id){
  return String($(id).value || "").trim();
}

function setVal(id, value){
  $(id).value = value;
}

function escJsString(str){
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function randomSecret(length = 12){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for(let i = 0; i < length; i++){
    out += chars[arr[i] % chars.length];
  }
  return out;
}

function slugify(str){
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadTemplate(path){
  const res = await fetch(path, { cache:"no-store" });
  if(!res.ok){
    throw new Error(`模板讀取失敗：${path}`);
  }
  return await res.text();
}

function getPresetTheme(preset){
  const themes = {
    latte: {
      mainColor: "#C35A2E",
      bgColor: "#FFF7ED",
      textColor: "#2F201B",
      mutedColor: "#8B6F61",
      stoneColor: "#EFE6DD",
      dustyColor: "#E9B18F"
    },
    sage: {
      mainColor: "#4F6F52",
      bgColor: "#F5F3EF",
      textColor: "#223127",
      mutedColor: "#667A6B",
      stoneColor: "#E7ECE7",
      dustyColor: "#A7B8A8"
    },
    mori: {
      mainColor: "#6B7280",
      bgColor: "#F7F7F6",
      textColor: "#2E3136",
      mutedColor: "#6B7280",
      stoneColor: "#ECECEC",
      dustyColor: "#C9CDD3"
    },
    rose: {
      mainColor: "#B76E79",
      bgColor: "#FFF8F8",
      textColor: "#4A2C33",
      mutedColor: "#8C6670",
      stoneColor: "#F3E6E8",
      dustyColor: "#D9A8B0"
    },
    wood: {
      mainColor: "#8B5E3C",
      bgColor: "#FBF7F2",
      textColor: "#3E2A1F",
      mutedColor: "#7A6253",
      stoneColor: "#EFE5DB",
      dustyColor: "#C9A891"
    }
  };

  return themes[preset] || themes.latte;
}

function validateInput(data){
  const missing = [];
  if(!data.contractTitle) missing.push("契約標題");
  if(!data.storeName) missing.push("店名");
  if(!data.storeAddress) missing.push("店家地址");
  if(!data.storeLine) missing.push("官方 LINE");
  if(!data.backupEmail) missing.push("店家 Email / 備份信箱");
  if(!data.sharedSecret) missing.push("sharedSecret");
  if(!data.mainColor) missing.push("主題色");
  if(!data.bgColor) missing.push("背景色");
  return missing;
}

function collectData(){
  const preset = getVal("themePreset") || "latte";
  const theme = getPresetTheme(preset);

  return {
    contractTitle: getVal("contractTitle"),
    storeName: getVal("storeName"),
    storeAddress: getVal("storeAddress"),
    storeLine: getVal("storeLine"),
    backupEmail: getVal("backupEmail"),
    liffId: getVal("liffId"),
    googleScriptUrl: getVal("googleScriptUrl"),
    sharedSecret: getVal("sharedSecret"),
    debugMode: getVal("debugMode"),
    zipName: getVal("zipName"),
    repoName: getVal("repoName"),
    themePreset: preset,
    mainColor: $("mainColor").value || theme.mainColor,
    bgColor: $("bgColor").value || theme.bgColor,
    textColor: theme.textColor,
    mutedColor: theme.mutedColor,
    stoneColor: theme.stoneColor,
    dustyColor: theme.dustyColor
  };
}

function buildStoreConfig(data){
  return `<script>
window.STORE_CONFIG = {
  contractTitle: "${escJsString(data.contractTitle)}",
  storeName: "${escJsString(data.storeName)}",
  storeAddress: "${escJsString(data.storeAddress)}",
  storeLine: "${escJsString(data.storeLine)}",
  backupEmail: "${escJsString(data.backupEmail)}",
  liffId: "${escJsString(data.liffId)}",
  googleScriptUrl: "${escJsString(data.googleScriptUrl)}",
  sharedSecret: "${escJsString(data.sharedSecret)}",
  debugMode: ${data.debugMode}
};
</script>`;
}

function buildCodeConfig(data){
  return `const SHARED_SECRET = "${escJsString(data.sharedSecret)}";
const BACKUP_EMAIL = "${escJsString(data.backupEmail)}";
const STORE_NAME = "${escJsString(data.storeName)}";
const STORE_ADDRESS = "${escJsString(data.storeAddress)}";
const STORE_LINE = "${escJsString(data.storeLine)}";
const SAVE_PDF_TO_DRIVE = false;`;
}

function applyTemplate(template, map){
  let result = String(template || "");
  for(const key of Object.keys(map)){
    const token = `{{${key}}}`;
    result = result.replaceAll(token, map[key]);
  }
  return result;
}

async function generateFiles(data){
  const indexTemplate = await loadTemplate("./template/index-template.html");
  const codeTemplate = await loadTemplate("./template/code-template.gs");
  const readmeTemplate = await loadTemplate("./template/readme-template.md");

  const storeConfig = buildStoreConfig(data);
  const codeConfig = buildCodeConfig(data);

  const indexHtml = applyTemplate(indexTemplate, {
    STORE_CONFIG: storeConfig,
    STORE_NAME: data.storeName,
    STORE_ADDRESS: data.storeAddress,
    STORE_LINE: data.storeLine,
    BACKUP_EMAIL: data.backupEmail,
    CONTRACT_TITLE: data.contractTitle,
    SECRET: data.sharedSecret,
    REPO_NAME: data.repoName || "",
    MAIN_COLOR: data.mainColor,
    BG_COLOR: data.bgColor,
    TEXT_COLOR: data.textColor,
    MUTED_COLOR: data.mutedColor,
    STONE_COLOR: data.stoneColor,
    DUSTY_COLOR: data.dustyColor
  });

  const codeGs = applyTemplate(codeTemplate, {
    CODE_CONFIG: codeConfig,
    STORE_NAME: data.storeName,
    STORE_ADDRESS: data.storeAddress,
    STORE_LINE: data.storeLine,
    BACKUP_EMAIL: data.backupEmail,
    CONTRACT_TITLE: data.contractTitle,
    SECRET: data.sharedSecret
  });

  const readme = applyTemplate(readmeTemplate, {
    STORE_NAME: data.storeName,
    STORE_ADDRESS: data.storeAddress,
    STORE_LINE: data.storeLine,
    BACKUP_EMAIL: data.backupEmail,
    CONTRACT_TITLE: data.contractTitle,
    SECRET: data.sharedSecret,
    REPO_NAME: data.repoName || "your-contract-repo"
  });

  return { indexHtml, codeGs, readme };
}

function setStatus(text, isError = false){
  const el = $("status");
  el.textContent = text || "";
  el.className = "status " + (isError ? "err" : "ok");
}

async function buildAll(){
  try{
    const data = collectData();
    const missing = validateInput(data);

    if(missing.length){
      setStatus("請先填寫：\n- " + missing.join("\n- "), true);
      $("indexOut").value = "";
      $("codeOut").value = "";
      $("readmeOut").value = "";
      return null;
    }

    const files = await generateFiles(data);

    $("indexOut").value = files.indexHtml;
    $("codeOut").value = files.codeGs;
    $("readmeOut").value = files.readme;

    setStatus("已生成完成。\n可以直接複製，或按「下載 ZIP」。", false);
    return files;
  }catch(err){
    setStatus(err && err.message ? err.message : "生成失敗", true);
    return null;
  }
}

async function downloadZip(){
  const data = collectData();
  const missing = validateInput(data);

  if(missing.length){
    setStatus("請先填寫：\n- " + missing.join("\n- "), true);
    return;
  }

  try{
    const files = await generateFiles(data);
    const zip = new JSZip();

    zip.file("index.html", files.indexHtml);
    zip.file("Code.gs", files.codeGs);
    zip.file("README.md", files.readme);

    const blob = await zip.generateAsync({ type:"blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = (data.zipName || "contract-template") + ".zip";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    setStatus("ZIP 已下載。", false);
  }catch(err){
    setStatus(err && err.message ? err.message : "ZIP 下載失敗", true);
  }
}

function applyPresetToInputs(preset){
  const theme = getPresetTheme(preset);
  $("mainColor").value = theme.mainColor;
  $("bgColor").value = theme.bgColor;
}

function resetAll(){
  setVal("contractTitle", "寵物美容服務定型化契約");
  setVal("storeName", "");
  setVal("storeAddress", "");
  setVal("storeLine", "");
  setVal("backupEmail", "");
  setVal("liffId", "");
  setVal("googleScriptUrl", "");
  setVal("sharedSecret", randomSecret(12));
  setVal("debugMode", "false");
  setVal("zipName", "");
  setVal("repoName", "");
  setVal("themePreset", "latte");
  applyPresetToInputs("latte");

  $("indexOut").value = "";
  $("codeOut").value = "";
  $("readmeOut").value = "";
  setStatus("");
}

function fillSample(){
  setVal("contractTitle", "寵物美容服務定型化契約");
  setVal("storeName", "ＯＯ寵物有限公司");
  setVal("storeAddress", "台北市信義區100號");
  setVal("storeLine", "@abcde12345");
  setVal("backupEmail", "abcde12345@gmail.com");
  setVal("liffId", "");
  setVal("googleScriptUrl", "");
  setVal("sharedSecret", randomSecret(12));
  setVal("debugMode", "false");
  setVal("zipName", "pet-contract-template");
  setVal("repoName", "pet-contract");
  setVal("themePreset", "latte");
  applyPresetToInputs("latte");
}

async function copyTarget(id){
  const text = $(id).value || "";
  if(!text) return;
  await navigator.clipboard.writeText(text);
}
function updatePreview(){
  const mainColor = $("mainColor").value;
  const bgColor = $("bgColor").value;

  const html = `
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      *{
        box-sizing:border-box;
      }

      body{
        margin:0;
        padding:24px;
        font-family:"Noto Sans TC",-apple-system,BlinkMacSystemFont,"PingFang TC","Microsoft JhengHei",sans-serif;
        background:${bgColor};
      }

      .page{
        max-width:420px;
        margin:0 auto;
      }

      .outer{
        background:rgba(255,255,255,.72);
        border-radius:24px;
        padding:24px;
      }

      .card{
        background:#fff;
        padding:32px 24px 28px;
        border-radius:24px;
        border:2px solid ${mainColor};
        box-shadow:0 10px 24px rgba(0,0,0,.06);
      }

      .title{
        color:${mainColor};
        font-size:28px;
        line-height:1.35;
        font-weight:900;
        margin:0 0 28px;
        letter-spacing:.5px;
      }

      .box{
        border:1.5px solid ${mainColor};
        padding:18px 20px;
        border-radius:18px;
        margin-top:16px;
        font-size:17px;
        line-height:1.5;
        background:#fff;
      }

      .btn{
        margin-top:28px;
        padding:14px 24px;
        border:none;
        border-radius:16px;
        background:${mainColor};
        color:white;
        font-weight:900;
        font-size:16px;
        box-shadow:0 8px 18px rgba(0,0,0,.08);
      }

      @media (max-width:480px){
        body{
          padding:16px;
        }

        .outer{
          padding:16px;
          border-radius:20px;
        }

        .card{
          padding:24px 18px 22px;
          border-radius:20px;
        }

        .title{
          font-size:24px;
          margin-bottom:22px;
        }

        .box{
          padding:16px 16px;
          font-size:16px;
          margin-top:14px;
        }

        .btn{
          margin-top:24px;
          width:auto;
          min-width:120px;
        }
      }
    </style>
  </head>

  <body>
    <div class="page">
      <div class="outer">
        <div class="card">
          <div class="title">寵物美容服務<br>定型化契約</div>

          <div class="box">飼主姓名：王小明</div>
          <div class="box">寵物名字：LISA</div>

          <button class="btn">提交簽署</button>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const frame = $("previewFrame");
  frame.srcdoc = html;
}

function initDefaults(){
  if(!$("sharedSecret").value){
    setVal("sharedSecret", randomSecret(12));
  }
  if(!$("zipName").value && $("storeName").value){
    setVal("zipName", slugify(getVal("storeName")) + "-contract-template");
  }
  if(!$("repoName").value && $("storeName").value){
    setVal("repoName", slugify(getVal("storeName")) + "-contract");
  }
  if(!$("themePreset").value){
    setVal("themePreset", "latte");
  }
  applyPresetToInputs(getVal("themePreset") || "latte");
}

window.addEventListener("DOMContentLoaded", () => {
  initDefaults();

  $("genSecret").addEventListener("click", () => {
    setVal("sharedSecret", randomSecret(12));
  });

  $("buildBtn").addEventListener("click", buildAll);
  $("downloadBtn").addEventListener("click", downloadZip);
  $("resetBtn").addEventListener("click", resetAll);
  $("sampleBtn").addEventListener("click", fillSample);

  $("themePreset").addEventListener("change", (e) => {
    const theme = getPresetTheme(e.target.value);
    $("mainColor").value = theme.mainColor;
    $("bgColor").value = theme.bgColor;
    updatePreview();
  });

  $("storeName").addEventListener("input", () => {
    if(!getVal("zipName")){
      setVal("zipName", slugify(getVal("storeName")) + "-contract-template");
    }
    if(!getVal("repoName")){
      setVal("repoName", slugify(getVal("storeName")) + "-contract");
    }
  });

  $("mainColor").addEventListener("input", updatePreview);
  $("bgColor").addEventListener("input", updatePreview);

  document.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-copy");
      try{
        await copyTarget(id);
        const old = btn.textContent;
        btn.textContent = "已複製";
        setTimeout(() => btn.textContent = old, 1200);
      }catch(e){
        alert("複製失敗，請手動複製");
      }
    });
  });

  updatePreview();
});
