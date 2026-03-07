{{CODE_CONFIG}}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    const payload = JSON.parse(raw || "{}");

    if (!payload || payload.secret !== SHARED_SECRET) {
      return jsonOut_({ ok: false, error: "Unauthorized" });
    }

    const data = normalizeData_(payload.data || {});
    const signatureDataUrl = String(payload.signatureDataUrl || "");
    const contractText = String(payload.contractText || "");

    const ownerEmail = safe_(data.ownerEmail);
    if (!ownerEmail) return jsonOut_({ ok: false, error: "Missing ownerEmail" });
    if (!isValidEmail_(ownerEmail)) return jsonOut_({ ok: false, error: "Invalid ownerEmail" });

    const pdfBlob = buildContractPdf_(data, signatureDataUrl, contractText);
    pdfBlob.setName(makePdfFileName_(data));

    sendContractEmail_(ownerEmail, data, pdfBlob);

    return jsonOut_({ ok: true, message: "Success" });

  } catch (err) {
    return jsonOut_({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

function sendContractEmail_(ownerEmail, data, pdfBlob) {
  const petName = safe_(data.petName);
  const ownerName = safe_(data.ownerName);

  const subject = `${STORE_NAME}｜${petName || "毛孩"}契約副本`;
  const body =
    `${ownerName || "您好"}：\n\n` +
    `附件為您本次簽署之契約 PDF。\n\n` +
    `店家：${STORE_NAME}\n` +
    `地址：${STORE_ADDRESS}\n` +
    `LINE：${STORE_LINE}\n\n` +
    `若有任何問題，歡迎與我們聯繫。`;

  MailApp.sendEmail({
    to: ownerEmail,
    bcc: BACKUP_EMAIL,
    subject: subject,
    body: body,
    attachments: [pdfBlob]
  });
}

function buildContractPdf_(data, signatureDataUrl, contractText) {
  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, "Noto Sans TC", sans-serif;
            padding: 24px;
            line-height: 1.8;
            color: #222;
          }
          h1 {
            font-size: 20px;
            margin: 0 0 16px;
          }
          .block {
            margin-bottom: 18px;
          }
          .label {
            font-weight: bold;
          }
          img.signature {
            max-width: 240px;
            border: 1px solid #ddd;
            margin-top: 8px;
          }
          .contract {
            white-space: pre-wrap;
            border-top: 1px solid #ddd;
            margin-top: 20px;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml_(STORE_NAME)}｜契約副本</h1>

        <div class="block"><span class="label">飼主姓名：</span>${escapeHtml_(safe_(data.ownerName))}</div>
        <div class="block"><span class="label">寵物姓名：</span>${escapeHtml_(safe_(data.petName))}</div>
        <div class="block"><span class="label">Email：</span>${escapeHtml_(safe_(data.ownerEmail))}</div>

        ${signatureDataUrl ? `<div class="block">
          <div class="label">簽名：</div>
          <img class="signature" src="${signatureDataUrl}" />
        </div>` : ""}

        <div class="contract">${escapeHtml_(contractText)}</div>
      </body>
    </html>
  `;

  const blob = HtmlService.createHtmlOutput(html).getBlob().getAs("application/pdf");

  if (SAVE_PDF_TO_DRIVE) {
    DriveApp.createFile(blob);
  }

  return blob;
}

function makePdfFileName_(data) {
  const petName = safe_(data.petName) || "pet";
  const ownerName = safe_(data.ownerName) || "owner";
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
  return `${STORE_NAME}_${petName}_${ownerName}_${date}.pdf`;
}

function normalizeData_(data) {
  const out = {};
  Object.keys(data || {}).forEach(function(key) {
    out[key] = typeof data[key] === "string" ? data[key].trim() : data[key];
  });
  return out;
}

function safe_(value) {
  return value == null ? "" : String(value).trim();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function escapeHtml_(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
