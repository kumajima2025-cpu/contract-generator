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

function validateInput(data){
  const missing = [];
  if(!data.contractTitle) missing.push("契約標題");
  if(!data.storeName) missing.push("店名");
  if(!data.storeAddress) missing.push("店家地址");
  if(!data.storeLine) missing.push("官方 LINE");
  if(!data.backupEmail) missing.push("店家 Email / 備份信箱");
  if(!data.sharedSecret) missing.push("sharedSecret");
  return missing;
}

function collectData(){
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
    repoName: getVal("repoName")
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
    REPO_NAME: data.repoName || ""
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

  $("indexOut").value = "";
  $("codeOut").value = "";
  $("readmeOut").value = "";
  setStatus("");
}

function fillSample(){
  setVal("contractTitle", "寵物美容服務定型化契約");
  setVal("storeName", "熊嶼寵物有限公司");
  setVal("storeAddress", "新北市板橋區文化路一段100號");
  setVal("storeLine", "@kumajima");
  setVal("backupEmail", "kumajima2025@gmail.com");
  setVal("liffId", "");
  setVal("googleScriptUrl", "");
  setVal("sharedSecret", randomSecret(12));
  setVal("debugMode", "false");
  setVal("zipName", "kumajima-contract-template");
  setVal("repoName", "kumajima-contract");
}

async function copyTarget(id){
  const text = $(id).value || "";
  if(!text) return;
  await navigator.clipboard.writeText(text);
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

  $("storeName").addEventListener("input", () => {
    if(!getVal("zipName")){
      setVal("zipName", slugify(getVal("storeName")) + "-contract-template");
    }
    if(!getVal("repoName")){
      setVal("repoName", slugify(getVal("storeName")) + "-contract");
    }
  });

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
});
