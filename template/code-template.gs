{{CODE_CONFIG}}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    const payload = JSON.parse(raw || "{}");

    if (!payload || payload.secret !== SHARED_SECRET) {
      return jsonOut({ ok: false, error: "Unauthorized" });
    }

    const data = normalizeData_(payload.data || {});
    const sigDataUrl = String(payload.signatureDataUrl || "");
    const contractText = String(payload.contractText || "");

    const ownerEmail = safe_(data.ownerEmail);
    if (!ownerEmail) return jsonOut({ ok: false, error: "Missing ownerEmail" });
    if (!isValidEmail_(ownerEmail)) return jsonOut({ ok: false, error: "Invalid ownerEmail" });

    const pdfBlob = buildContractPdf_(data, sigDataUrl, contractText);
    pdfBlob.setName(makePdfFileName_(data));

    if (SAVE_PDF_TO_DRIVE) {
      try {
        DriveApp.createFile(pdfBlob);
      } catch (err) {
        console.warn("SAVE_PDF_TO_DRIVE failed:", err);
      }
    }

    const bodyText = buildEmailBody_(data);

    MailApp.sendEmail({
      to: ownerEmail,
      bcc: BACKUP_EMAIL,
      replyTo: BACKUP_EMAIL,
      subject: `${STORE_NAME}｜${safe_(data.petName) || "毛孩"}｜定型化契約副本`,
      body: bodyText,
      name: STORE_COMPANY_NAME || STORE_NAME,
      attachments: [pdfBlob]
    });

    return jsonOut({ ok: true });

  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function makePdfFileName_(data) {
  const dn = safe_(data.signDate) || Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd");
  const pet = safe_(data.petName) || "毛孩";
  const owner = safe_(data.ownerName) || "飼主";
  const ts = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyyMMdd_HHmmss");
  return `${STORE_NAME}_資料卡+契約_${dn}_${owner}_${pet}_${ts}.pdf`;
}

function safe_(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(safe_).filter(Boolean).join("、");
  return String(v).trim();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function esc_(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function joinList_(v) {
  if (!v) return "—";
  const arr = Array.isArray(v) ? v : [v];
  const clean = arr.map(x => safe_(x)).filter(Boolean);
  return clean.length ? clean.join("、") : "—";
}

function normalizeData_(d) {
  const out = Object.assign({}, d);

  out.petBirthday = safe_(d.petBirthday) || safe_(d.petBirth);
  out.petAge = safe_(d.petAge);
  out.petSex = safe_(d.petSex) || safe_(d.sex) || "—";
  out.treatAllowed = safe_(d.treatAllowed) || safe_(d.snackOK);

  if (Array.isArray(d.medicalHistory)) out.medicalHistory = d.medicalHistory;
  else if (Array.isArray(d.history)) out.medicalHistory = d.history;
  else if (safe_(d.medicalHistory)) out.medicalHistory = [safe_(d.medicalHistory)];
  else if (safe_(d.history)) out.medicalHistory = [safe_(d.history)];
  else out.medicalHistory = [];

  out.medicalNote = safe_(d.medicalNote) || safe_(d.historyNote);
  out.otherInjuryNote = safe_(d.otherInjuryNote);

  if (Array.isArray(d.petTemperament)) out.petTemperament = d.petTemperament;
  else if (Array.isArray(d.temperament)) out.petTemperament = d.temperament;
  else if (safe_(d.petTemperament)) out.petTemperament = [safe_(d.petTemperament)];
  else if (safe_(d.temperament)) out.petTemperament = [safe_(d.temperament)];
  else out.petTemperament = [];

  out.petTemperamentNote = safe_(d.petTemperamentNote) || safe_(d.temperamentNote);

  const fa = safe_(d.foodAllergy);
  const ad = safe_(d.allergyDetail);
  out.foodAllergyText =
    (fa === "有") ? (ad ? `有（${ad}）` : "有（未填內容）")
    : (fa ? fa : "—");

  const ch = safe_(d.chipHas);
  const cn = safe_(d.chipNo);
  out.chipText =
    (ch === "有") ? (cn ? `有（${cn}）` : "有（未填號碼）")
    : (ch ? ch : "—");

  const vm = safe_(d.vetMode);
  out.vetMode = vm || "—";

  if (vm === "乙方指定") {
    out.vetName = safe_(typeof STORE_VET_NAME !== "undefined" ? STORE_VET_NAME : "") || "—";
    out.vetPhone = safe_(typeof STORE_VET_PHONE !== "undefined" ? STORE_VET_PHONE : "") || "—";
    out.vetAddress = safe_(typeof STORE_VET_ADDRESS !== "undefined" ? STORE_VET_ADDRESS : "") || "—";
    out.vetText = `乙方指定：${out.vetName} / ${out.vetPhone} / ${out.vetAddress}`;
  } else {
    out.vetName = safe_(d.vetName) || "—";
    out.vetPhone = safe_(d.vetPhone) || "—";
    out.vetAddress = safe_(d.vetAddress) || "—";
    out.vetText = `甲方指定：${out.vetName} / ${out.vetPhone} / ${out.vetAddress}`;
  }

  return out;
}

function buildEmailBody_(data) {
  const temperament = joinList_(data.petTemperament);
  const history = joinList_(data.medicalHistory);

  const historyHasOther = Array.isArray(data.medicalHistory) && data.medicalHistory.includes("其他外傷");
  const otherLine = historyHasOther
    ? `其他外傷：${safe_(data.otherInjuryNote) || "（未填）"}\n`
    : "";

  return (
    "您好，\n\n" +
    "附件為您本次線上簽署之「毛孩資料卡＋定型化契約」副本（含簽名）。\n\n" +
    "【毛孩資料卡摘要】\n" +
    `飼主姓名：${safe_(data.ownerName) || "—"}\n` +
    `身分證字號：${safe_(data.ownerIdNo) || "—"}\n` +
    `聯絡電話：${safe_(data.ownerPhone) || "—"}\n` +
    `Email：${safe_(data.ownerEmail) || "—"}\n` +
    `通訊地址：${safe_(data.ownerAddress) || "—"}\n` +
    `緊急聯絡人：${safe_(data.emergencyName) || "—"}\n` +
    `電話：${safe_(data.emergencyPhone) || "—"}\n` +
    `飼主本人：${safe_(data.isOwnerSelf) || "—"}\n` +
    (
      String(data.isOwnerSelf || "").trim() === "否" && safe_(data.ownerRelation)
        ? `飼主關係：${safe_(data.ownerRelation)}\n`
        : ""
    ) +
    "\n" +
    `寵物姓名：${safe_(data.petName) || "—"}\n` +
    `寵物品種：${safe_(data.petBreed) || "—"}\n` +
    `寵物性別：${safe_(data.petSex) || "—"}\n` +
    `寵物生日：${safe_(data.petBirthday) || "—"}\n` +
    `寵物年齡：${safe_(data.petAge) || "—"}\n` +
    `體重：${safe_(data.petWeight) || "—"} kg\n` +
    `晶片：${safe_(data.chipText) || "—"}\n` +
    `食物過敏：${safe_(data.foodAllergyText) || "—"}\n` +
    `零食：${safe_(data.treatAllowed) || "—"}\n` +
    `寵物個性：${temperament}\n` +
    `其他應注意：${safe_(data.petTemperamentNote) || "—"}\n` +
    `病史：${history}\n` +
    otherLine +
    `其他病史：${safe_(data.medicalNote) || "—"}\n\n` +
    `就醫機構：${safe_(data.vetMode) || "—"}\n` +
    `醫院名稱：${safe_(data.vetName) || "—"}\n` +
    `醫院電話：${safe_(data.vetPhone) || "—"}\n` +
    `醫院地址：${safe_(data.vetAddress) || "—"}\n\n` +
    `簽署日期：${safe_(data.signDate) || "—"}\n\n` +
    `如有任何疑問或意見，歡迎透過官方LINE：${STORE_LINE} 聯繫我們！\n\n` +
    `${STORE_COMPANY_NAME || STORE_NAME}`
  );
}

function buildContractPdf_(data, sigDataUrl, contractText) {
  const temperament = joinList_(data.petTemperament);
  const history = joinList_(data.medicalHistory);

  const historyHasOther = Array.isArray(data.medicalHistory) && data.medicalHistory.includes("其他外傷");
  const otherInjuryNote = historyHasOther ? (safe_(data.otherInjuryNote) || "（未填）") : "—";

  const contractHtml = `<pre class="contract">${esc_(contractText || "")}</pre>`;

  const html = `
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @page { margin: 16mm 14mm; }

      body{
        font-family: Arial, "Microsoft JhengHei", sans-serif;
        color:#2F201B;
        font-size:11.2pt;
        line-height:1.55;
      }

      .topTitle{
        font-size:16.2pt;
        font-weight:800;
        margin:0 0 6px;
      }

      .topMeta{
        color:#8B6F61;
        font-size:10.2pt;
        margin:0 0 12px;
      }

      .panel{
        border:1px solid #E6C9B1;
        border-radius:12px;
        background:#FFFBF6;
        margin:0 0 10px;
        overflow:hidden;
      }

      .panelHead{
        font-weight:900;
        font-size:12.6pt;
        padding:10px 12px;
        background:#FFF3E8;
        border-bottom:1px solid #E6C9B1;
      }

      .panelBody{
        padding:12px;
        background:#FFFBF6;
      }

      .grid2{
        width:100%;
        border-collapse:collapse;
      }

      .grid2 td{
        vertical-align:top;
        width:50%;
        padding:0 6px 0 0;
      }

      .colTitle{
        font-weight:900;
        margin:0 0 6px;
        font-size:12pt;
      }

      .kv{
        width:100% !important;
        border-collapse:collapse !important;
        table-layout:fixed !important;
      }

      .kv td{
        padding:3px 0 !important;
        vertical-align:top !important;
        word-break:break-word !important;
        overflow-wrap:anywhere !important;
      }

      .k{
        width:88px !important;
        padding-right:8px !important;
        white-space:nowrap !important;
        text-align:left !important;
        color:#8B6F61 !important;
        font-weight:700 !important;
      }

      .v{
        width:auto !important;
      }

      .chipOneLine{
        white-space:normal;
        word-break:break-word;
        overflow-wrap:anywhere;
      }

      .contract{
        margin:0;
        white-space:pre-wrap;
        word-break:break-word;
        overflow-wrap:anywhere;
        line-height:1.75;
        font-size:10.8pt;
        background:transparent;
        padding:0;
        border:none;
      }

      .sigBlock{
        page-break-inside:avoid;
        break-inside:avoid;
      }

      img.sig{
        border:1px solid #E6C9B1;
        border-radius:8px;
        display:block;
      }

      .footer{
        margin-top:8px;
        color:#8B6F61;
        font-size:10pt;
      }
    </style>
  </head>
  <body>

    <div class="topTitle">${esc_(STORE_NAME)}｜寵物美容服務定型化契約簽署副本</div>
    <div class="topMeta">地址：${esc_(STORE_ADDRESS)}　｜　官方LINE：${esc_(STORE_LINE)}</div>

    <div class="panel">
      <div class="panelHead">一、毛孩資料卡（契約附件）</div>
      <div class="panelBody">
        <table class="grid2">
          <tr>
            <td>
              <div class="colTitle">甲方資料</div>
              <table class="kv">
                <tr><td class="k">飼主姓名</td><td class="v">${esc_(safe_(data.ownerName) || "—")}</td></tr>
                <tr><td class="k">身分證字號</td><td class="v">${esc_(safe_(data.ownerIdNo) || "—")}</td></tr>
                <tr><td class="k">聯絡電話</td><td class="v">${esc_(safe_(data.ownerPhone) || "—")}</td></tr>
                <tr><td class="k">Email</td><td class="v">${esc_(safe_(data.ownerEmail) || "—")}</td></tr>
                <tr><td class="k">通訊地址</td><td class="v">${esc_(safe_(data.ownerAddress) || "—")}</td></tr>
                <tr><td class="k">緊急聯絡人</td><td class="v">${esc_(safe_(data.emergencyName) || "—")}</td></tr>
                <tr><td class="k">電話</td><td class="v">${esc_(safe_(data.emergencyPhone) || "—")}</td></tr>
                <tr><td class="k">飼主本人</td><td class="v">${esc_(safe_(data.isOwnerSelf) || "—")}</td></tr>
                <tr><td class="k">飼主關係</td><td class="v">${esc_(safe_(data.ownerRelation) || "—")}</td></tr>
              </table>
            </td>

            <td>
              <div class="colTitle">毛孩資料</div>
              <table class="kv">
                <tr><td class="k">寵物姓名</td><td class="v">${esc_(safe_(data.petName) || "—")}</td></tr>
                <tr><td class="k">寵物品種</td><td class="v">${esc_(safe_(data.petBreed) || "—")}</td></tr>
                <tr><td class="k">寵物性別</td><td class="v">${esc_(safe_(data.petSex) || "—")}</td></tr>
                <tr><td class="k">寵物生日</td><td class="v">${esc_(safe_(data.petBirthday) || "—")}</td></tr>
                <tr><td class="k">寵物年齡</td><td class="v">${esc_(safe_(data.petAge) || "—")}</td></tr>
                <tr><td class="k">體重（公斤）</td><td class="v">${esc_(safe_(data.petWeight) || "—")}</td></tr>
                <tr><td class="k">寵物個性</td><td class="v">${esc_(temperament)}</td></tr>
                <tr><td class="k">其他應注意</td><td class="v">${esc_(safe_(data.petTemperamentNote) || "—")}</td></tr>
                <tr><td class="k">晶片</td><td class="v"><span class="chipOneLine">${esc_(safe_(data.chipText) || "—")}</span></td></tr>
                <tr><td class="k">食物過敏</td><td class="v">${esc_(safe_(data.foodAllergyText) || "—")}</td></tr>
                <tr><td class="k">零食</td><td class="v">${esc_(safe_(data.treatAllowed) || "—")}</td></tr>
                <tr><td class="k">病史</td><td class="v">${esc_(history)}</td></tr>
                <tr><td class="k">其他外傷</td><td class="v">${esc_(otherInjuryNote)}</td></tr>
                <tr><td class="k">其他病史</td><td class="v">${esc_(safe_(data.medicalNote) || "—")}</td></tr>
                <tr><td class="k">緊急就醫</td><td class="v">${esc_(safe_(data.vetMode) || "—")}</td></tr>
                <tr><td class="k">醫院名稱</td><td class="v">${esc_(safe_(data.vetName) || "—")}</td></tr>
                <tr><td class="k">醫院電話</td><td class="v">${esc_(safe_(data.vetPhone) || "—")}</td></tr>
                <tr><td class="k">醫院地址</td><td class="v">${esc_(safe_(data.vetAddress) || "—")}</td></tr>
                <tr><td class="k">簽署日期</td><td class="v">${esc_(safe_(data.signDate) || "—")}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="footer">※ 本資料卡為契約附件之一部分，供日後查證留存。</div>
      </div>
    </div>

    <div class="panel">
      <div class="panelHead">二、定型化契約全文</div>
      <div class="panelBody">
        ${contractHtml}
      </div>
    </div>

    <div class="panel sigBlock">
      <div class="panelHead">三、甲方簽名</div>
      <div class="panelBody">
        ${sigDataUrl ? `<img class="sig" src="${sigDataUrl}" width="320">` : `<div class="footer">（未附簽名圖）</div>`}
        <div class="footer">此文件為線上簽署之副本（含簽名），供日後查證留存。</div>
      </div>
    </div>

  </body>
  </html>
  `;

  const pdfBlob = HtmlService
    .createHtmlOutput(html)
    .getBlob()
    .getAs(MimeType.PDF);

  return pdfBlob;
}
