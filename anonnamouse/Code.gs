/* =========================================================
   AnonnaMouse — Anonymous Classroom Backchannel
   Google Apps Script Backend (Code.gs)
   ========================================================= */

// ─── Run once from script editor to create sheets ─────────
function setupSheets() { routeSetupSheets({}); }

// ─── Spreadsheet / Sheet helpers ───────────────────────────

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

// ─── Config helpers ────────────────────────────────────────

function readConfigMap() {
  var sheet = getSheet("Config");
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    if (key !== "" && key !== "key") {
      map[key] = data[i][1];
    }
  }
  return map;
}

function writeConfigValue(key, value) {
  var sheet = getSheet("Config");
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  // Key not found — append
  sheet.appendRow([key, value]);
}

function writeConfigValues(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      writeConfigValue(key, obj[key]);
    }
  }
}

// ─── Generic record helpers ────────────────────────────────

function getSheetRecords(sheetName) {
  var sheet = getSheet(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var rec = {};
    for (var j = 0; j < headers.length; j++) {
      rec[String(headers[j]).trim()] = data[i][j];
    }
    rec._row = i + 1; // 1-based sheet row
    records.push(rec);
  }
  return records;
}

function appendRecord(sheetName, headers, values) {
  var sheet = getSheet(sheetName);
  if (!sheet) return;
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(values.hasOwnProperty(headers[i]) ? values[headers[i]] : "");
  }
  sheet.appendRow(row);
}

function updateCellByRow(sheetName, row, colIndex, value) {
  var sheet = getSheet(sheetName);
  if (!sheet) return;
  sheet.getRange(row, colIndex + 1).setValue(value);
}

function getColumnIndex(sheetName, colName) {
  var sheet = getSheet(sheetName);
  if (!sheet) return -1;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === colName) return i;
  }
  return -1;
}

// ─── Response helpers ──────────────────────────────────────

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(data) {
  return jsonResponse({ ok: true, data: data });
}

function errorResponse(msg) {
  return jsonResponse({ ok: false, error: msg });
}

/**
 * Verify the admin passphrase from a payload.
 * Returns true if valid, false otherwise.
 */
function verifyPassphrase(payload) {
  if (!payload || !payload.passphrase) return false;
  var config = readConfigMap();
  return String(payload.passphrase) === String(config.adminPassphrase);
}

// ─── UUID ──────────────────────────────────────────────────

function generateId() {
  return Utilities.getUuid();
}

// ─── Server-side moderation (basic blocklist) ─────────────
// This is a safety net — never trust client-supplied scores.
// Normalizes text and checks against a compact blocklist of severe terms.

var SERVER_BLOCKLIST = [
  'fuck', 'shit', 'cunt', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'retarded', 'cocksucker', 'motherfucker', 'bitch',
  'asshole', 'whore', 'slut', 'kike', 'spic', 'chink', 'gook',
  'wetback', 'dyke', 'tranny', 'pedo', 'pedophile', 'rape',
  'rapist', 'kys', 'porn', 'dick', 'cock', 'pussy', 'twat',
  'wanker', 'bollocks', 'blowjob', 'handjob', 'dildo', 'cum',
  'jizz', 'tits', 'penis', 'vagina'
];

function serverSideCheck(text) {
  if (!text) return false;
  // Basic normalization: lowercase, leet decode, strip common obfuscation chars
  var s = String(text).toLowerCase();
  s = s.replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
       .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
       .replace(/@/g, 'a').replace(/\$/g, 's');
  s = s.replace(/[^a-z\s]/g, ''); // strip all non-alpha except spaces
  var tokens = s.split(/\s+/);
  for (var i = 0; i < tokens.length; i++) {
    for (var j = 0; j < SERVER_BLOCKLIST.length; j++) {
      if (tokens[i] === SERVER_BLOCKLIST[j]) return true;
      // Also check if token contains a blocklist word (catches concatenated obfuscation)
      if (tokens[i].length > SERVER_BLOCKLIST[j].length && tokens[i].indexOf(SERVER_BLOCKLIST[j]) !== -1) return true;
    }
  }
  return false;
}

// ─── doGet router ──────────────────────────────────────────

function doGet(e) {
  var route = (e && e.parameter && e.parameter.route) ? e.parameter.route : "";
  var payloadRaw = (e && e.parameter && e.parameter.payload) ? e.parameter.payload : "{}";

  var payload;
  try {
    payload = JSON.parse(payloadRaw);
  } catch (err) {
    payload = {};
  }

  try {
    switch (route) {
      case "getState":
        return routeGetState(payload);
      case "submit":
        return routeSubmit(payload);
      case "getPending":
        return routeGetPending(payload);
      case "approve":
        return routeApprove(payload);
      case "reject":
        return routeReject(payload);
      case "batchApprove":
        return routeBatchApprove(payload);
      case "getApproved":
        return routeGetApproved(payload);
      case "updateConfig":
        return routeUpdateConfig(payload);
      case "pinComment":
        return routePinComment(payload);
      case "unpinComment":
        return routeUnpinComment(payload);
      case "deleteApproved":
        return routeDeleteApproved(payload);
      case "setupSheets":
        return routeSetupSheets(payload);
      default:
        return errorResponse("Unknown route: " + route);
    }
  } catch (err) {
    return errorResponse("Server error: " + err.message);
  }
}

// ─── Route: setupSheets ────────────────────────────────────

function routeSetupSheets(payload) {
  var ss = getSpreadsheet();

  // Config sheet
  if (!ss.getSheetByName("Config")) {
    var configSheet = ss.insertSheet("Config");
    configSheet.appendRow(["key", "value"]);
    var defaults = [
      ["sessionActive", false],
      ["cooldownMinutes", 1],
      ["adminPassphrase", "changeme"],
      ["autoApproveOn", true],
      ["autoApproveThreshold", 0.5],
      ["maxLength", 280],
      ["displayMode", "cards"],
      ["autoCycle", false],
      ["pinnedCommentId", ""],
      ["cycleSpeed", 8],
      ["historyDepth", 12],
      ["fontSize", "normal"],
      ["displayTheme", "auto"],
      ["displayBlanked", false]
    ];
    for (var i = 0; i < defaults.length; i++) {
      configSheet.appendRow(defaults[i]);
    }
  }

  // Submissions sheet
  if (!ss.getSheetByName("Submissions")) {
    var subSheet = ss.insertSheet("Submissions");
    subSheet.appendRow(["id", "deviceId", "text", "timestamp", "moderationScore", "flagCategories", "status"]);
  }

  // Approved sheet
  if (!ss.getSheetByName("Approved")) {
    var appSheet = ss.insertSheet("Approved");
    appSheet.appendRow(["id", "text", "approvedAt", "pinned"]);
  }

  return successResponse({ message: "Sheets created successfully." });
}

// ─── Route: getState ───────────────────────────────────────

function routeGetState(payload) {
  var config = readConfigMap();
  var pendingCount = 0;
  var records = getSheetRecords("Submissions");
  for (var i = 0; i < records.length; i++) {
    if (String(records[i].status).toLowerCase() === "pending") {
      pendingCount++;
    }
  }
  return successResponse({
    config: config,
    pendingCount: pendingCount
  });
}

// ─── Route: submit ─────────────────────────────────────────

function routeSubmit(payload) {
  var config = readConfigMap();

  // Check session active
  if (String(config.sessionActive).toLowerCase() !== "true") {
    return errorResponse("Session is not active.");
  }

  var deviceId = payload.deviceId || "";
  var text = payload.text || "";
  var moderationScore = (payload.moderationScore !== undefined) ? Number(payload.moderationScore) : 0;
  var flagCategories = payload.flagCategories || "";

  if (!deviceId) {
    return errorResponse("Missing deviceId.");
  }

  // Sanitise: keep only letters, digits, spaces, newlines, and ,.'?
  text = text.replace(/[^a-zA-Z0-9 ,.\n'?]+/g, '').replace(/[^\S\n]+/g, ' ').replace(/\n{2,}/g, '\n').trim();

  if (!text) {
    return errorResponse("Missing text.");
  }

  // Enforce maxLength
  var maxLength = Number(config.maxLength) || 280;
  if (text.length > maxLength) {
    return errorResponse("Text exceeds maximum length of " + maxLength + " characters.");
  }

  // Enforce cooldown
  var cooldownMinutes = Number(config.cooldownMinutes) || 0;
  if (cooldownMinutes > 0) {
    var records = getSheetRecords("Submissions");
    var now = new Date().getTime();
    var cooldownMs = cooldownMinutes * 60 * 1000;
    for (var i = records.length - 1; i >= 0; i--) {
      if (String(records[i].deviceId) === String(deviceId)) {
        var ts = new Date(records[i].timestamp).getTime();
        if ((now - ts) < cooldownMs) {
          var remainSec = Math.ceil((cooldownMs - (now - ts)) / 1000);
          return errorResponse("Cooldown active. Please wait " + remainSec + " seconds.");
        }
        break; // only need to check the most recent from this device
      }
    }
  }

  // Server-side moderation check — never trust client score alone
  var serverFlagged = serverSideCheck(text);

  // Determine status
  var autoApproveOn = String(config.autoApproveOn).toLowerCase() === "true";
  var autoApproveThreshold = Number(config.autoApproveThreshold);
  if (isNaN(autoApproveThreshold)) autoApproveThreshold = 0.5;

  // Override client score if server detects issues
  if (serverFlagged) {
    moderationScore = Math.max(moderationScore, 1.0);
    flagCategories = flagCategories || "";
    if (typeof flagCategories === "object") {
      flagCategories.push("server-blocklist");
    } else {
      flagCategories = String(flagCategories) + (flagCategories ? ",server-blocklist" : "server-blocklist");
    }
  }

  var status = "pending";
  var autoApproved = false;

  if (autoApproveOn && moderationScore < autoApproveThreshold && !serverFlagged) {
    status = "approved";
    autoApproved = true;
  }

  var id = generateId();
  var timestamp = new Date().toISOString();

  // Write to Submissions
  var subHeaders = ["id", "deviceId", "text", "timestamp", "moderationScore", "flagCategories", "status"];
  appendRecord("Submissions", subHeaders, {
    id: id,
    deviceId: deviceId,
    text: text,
    timestamp: timestamp,
    moderationScore: moderationScore,
    flagCategories: (typeof flagCategories === "object") ? JSON.stringify(flagCategories) : String(flagCategories),
    status: status
  });

  // If auto-approved, also write to Approved
  if (autoApproved) {
    var appHeaders = ["id", "text", "approvedAt", "pinned"];
    appendRecord("Approved", appHeaders, {
      id: id,
      text: text,
      approvedAt: timestamp,
      pinned: false
    });
  }

  return successResponse({
    id: id,
    status: status,
    autoApproved: autoApproved
  });
}

// ─── Route: getPending ─────────────────────────────────────

function routeGetPending(payload) {
  if (!verifyPassphrase(payload)) return errorResponse("Invalid passphrase.");
  var records = getSheetRecords("Submissions");
  var pending = [];
  for (var i = 0; i < records.length; i++) {
    if (String(records[i].status).toLowerCase() === "pending") {
      pending.push({
        id: records[i].id,
        text: records[i].text,
        timestamp: records[i].timestamp,
        moderationScore: records[i].moderationScore,
        flagCategories: records[i].flagCategories
      });
    }
  }
  return successResponse(pending);
}

// ─── Route: approve ────────────────────────────────────────

function routeApprove(payload) {
  if (!verifyPassphrase(payload)) return errorResponse("Invalid passphrase.");
  var id = payload.id || "";
  if (!id) return errorResponse("Missing id.");

  var records = getSheetRecords("Submissions");
  var statusCol = getColumnIndex("Submissions", "status");
  var found = false;

  for (var i = 0; i < records.length; i++) {
    if (String(records[i].id) === String(id) && String(records[i].status).toLowerCase() === "pending") {
      // Update status in Submissions
      updateCellByRow("Submissions", records[i]._row, statusCol, "approved");

      // Write to Approved
      var appHeaders = ["id", "text", "approvedAt", "pinned"];
      appendRecord("Approved", appHeaders, {
        id: records[i].id,
        text: records[i].text,
        approvedAt: new Date().toISOString(),
        pinned: false
      });

      found = true;
      break;
    }
  }

  if (!found) return errorResponse("Submission not found or not pending.");
  return successResponse({ id: id, status: "approved" });
}

// ─── Route: reject ─────────────────────────────────────────

function routeReject(payload) {
  if (!verifyPassphrase(payload)) return errorResponse("Invalid passphrase.");
  var id = payload.id || "";
  if (!id) return errorResponse("Missing id.");

  var records = getSheetRecords("Submissions");
  var statusCol = getColumnIndex("Submissions", "status");
  var found = false;

  for (var i = 0; i < records.length; i++) {
    if (String(records[i].id) === String(id) && String(records[i].status).toLowerCase() === "pending") {
      updateCellByRow("Submissions", records[i]._row, statusCol, "rejected");
      found = true;
      break;
    }
  }

  if (!found) return errorResponse("Submission not found or not pending.");
  return successResponse({ id: id, status: "rejected" });
}

// ─── Route: batchApprove ───────────────────────────────────

function routeBatchApprove(payload) {
  if (!verifyPassphrase(payload)) return errorResponse("Invalid passphrase.");
  var records = getSheetRecords("Submissions");
  var statusCol = getColumnIndex("Submissions", "status");
  var approvedIds = [];
  var now = new Date().toISOString();
  var appHeaders = ["id", "text", "approvedAt", "pinned"];

  for (var i = 0; i < records.length; i++) {
    if (String(records[i].status).toLowerCase() === "pending") {
      updateCellByRow("Submissions", records[i]._row, statusCol, "approved");
      appendRecord("Approved", appHeaders, {
        id: records[i].id,
        text: records[i].text,
        approvedAt: now,
        pinned: false
      });
      approvedIds.push(records[i].id);
    }
  }

  return successResponse({ approvedCount: approvedIds.length, approvedIds: approvedIds });
}

// ─── Route: getApproved ────────────────────────────────────

function routeGetApproved(payload) {
  var sinceId = payload.sinceId || "";
  var records = getSheetRecords("Approved");
  var config = readConfigMap();
  var pinnedCommentId = String(config.pinnedCommentId || "");

  var results = [];
  var pastSinceId = (sinceId === "");

  for (var i = 0; i < records.length; i++) {
    // Add pinned status based on config
    var isPinned = (String(records[i].id) === pinnedCommentId);

    if (!pastSinceId) {
      if (String(records[i].id) === String(sinceId)) {
        pastSinceId = true;
      }
      continue;
    }

    results.push({
      id: records[i].id,
      text: records[i].text,
      approvedAt: records[i].approvedAt,
      pinned: isPinned
    });
  }

  // Always include the pinned comment even if it was before sinceId
  if (pinnedCommentId && sinceId) {
    var pinnedAlreadyIncluded = false;
    for (var j = 0; j < results.length; j++) {
      if (String(results[j].id) === pinnedCommentId) {
        pinnedAlreadyIncluded = true;
        break;
      }
    }
    if (!pinnedAlreadyIncluded) {
      for (var k = 0; k < records.length; k++) {
        if (String(records[k].id) === pinnedCommentId) {
          results.unshift({
            id: records[k].id,
            text: records[k].text,
            approvedAt: records[k].approvedAt,
            pinned: true
          });
          break;
        }
      }
    }
  }

  return successResponse(results);
}

// ─── Route: deleteApproved ─────────────────────────────────

function routeDeleteApproved(payload) {
  if (!verifyPassphrase(payload)) return errorResponse("Invalid passphrase.");
  var ids = payload.ids;
  if (!ids || !ids.length) return errorResponse("Missing ids array.");

  var sheet = getSheet("Approved");
  if (!sheet || sheet.getLastRow() < 2) return successResponse({ deletedCount: 0 });

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = -1;
  for (var h = 0; h < headers.length; h++) {
    if (String(headers[h]).trim() === "id") { idCol = h; break; }
  }
  if (idCol === -1) return errorResponse("Approved sheet missing id column.");

  // Build a set of IDs to delete
  var idSet = {};
  for (var k = 0; k < ids.length; k++) {
    idSet[String(ids[k])] = true;
  }

  // Collect rows to delete (bottom-up to preserve indices)
  var rowsToDelete = [];
  for (var i = 1; i < data.length; i++) {
    if (idSet[String(data[i][idCol])]) {
      rowsToDelete.push(i + 1); // 1-based sheet row
    }
  }

  // Delete from bottom to top
  for (var r = rowsToDelete.length - 1; r >= 0; r--) {
    sheet.deleteRow(rowsToDelete[r]);
  }

  // If any deleted ID was pinned, clear the pin
  var config = readConfigMap();
  if (idSet[String(config.pinnedCommentId || "")]) {
    var configSheet = getSheet("Config");
    var cfgData = configSheet.getDataRange().getValues();
    for (var c = 0; c < cfgData.length; c++) {
      if (String(cfgData[c][0]).trim() === "pinnedCommentId") {
        configSheet.getRange(c + 1, 2).setValue("");
        break;
      }
    }
  }

  return successResponse({ deletedCount: rowsToDelete.length });
}

// ─── Route: updateConfig ───────────────────────────────────

function routeUpdateConfig(payload) {
  var passphrase = payload.passphrase || "";
  var config = readConfigMap();

  if (String(passphrase) !== String(config.adminPassphrase)) {
    return errorResponse("Invalid passphrase.");
  }

  var settings = payload.settings || {};
  var allowedKeys = [
    "sessionActive", "cooldownMinutes", "adminPassphrase",
    "autoApproveOn", "autoApproveThreshold", "maxLength",
    "displayMode", "autoCycle", "pinnedCommentId",
    "cycleSpeed", "historyDepth", "fontSize", "displayTheme", "displayBlanked"
  ];

  var updated = {};
  for (var key in settings) {
    if (settings.hasOwnProperty(key)) {
      var found = false;
      for (var i = 0; i < allowedKeys.length; i++) {
        if (allowedKeys[i] === key) { found = true; break; }
      }
      if (found) {
        updated[key] = settings[key];
      }
    }
  }

  writeConfigValues(updated);
  return successResponse({ updated: updated });
}

// ─── Route: pinComment ─────────────────────────────────────

function routePinComment(payload) {
  if (!verifyPassphrase(payload)) return errorResponse("Invalid passphrase.");
  var id = payload.id || "";
  if (!id) return errorResponse("Missing id.");

  // Verify the comment exists in Approved
  var records = getSheetRecords("Approved");
  var found = false;
  var pinnedCol = getColumnIndex("Approved", "pinned");

  // Unpin all first
  for (var i = 0; i < records.length; i++) {
    if (String(records[i].pinned).toLowerCase() === "true") {
      updateCellByRow("Approved", records[i]._row, pinnedCol, false);
    }
    if (String(records[i].id) === String(id)) {
      found = true;
    }
  }

  if (!found) return errorResponse("Comment not found in approved list.");

  // Pin the target
  for (var j = 0; j < records.length; j++) {
    if (String(records[j].id) === String(id)) {
      updateCellByRow("Approved", records[j]._row, pinnedCol, true);
      break;
    }
  }

  // Store in config
  writeConfigValue("pinnedCommentId", id);

  return successResponse({ pinnedCommentId: id });
}

// ─── Route: unpinComment ───────────────────────────────────

function routeUnpinComment(payload) {
  if (!verifyPassphrase(payload)) return errorResponse("Invalid passphrase.");
  var config = readConfigMap();
  var pinnedId = String(config.pinnedCommentId || "");

  if (!pinnedId) return successResponse({ message: "No comment was pinned." });

  // Unpin in Approved sheet
  var records = getSheetRecords("Approved");
  var pinnedCol = getColumnIndex("Approved", "pinned");

  for (var i = 0; i < records.length; i++) {
    if (String(records[i].id) === pinnedId) {
      updateCellByRow("Approved", records[i]._row, pinnedCol, false);
      break;
    }
  }

  // Clear from config
  writeConfigValue("pinnedCommentId", "");

  return successResponse({ unpinned: pinnedId });
}
