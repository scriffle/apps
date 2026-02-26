# Google Sheets Web App — Architecture Template

Use this template when building a multi-client web app that uses a Google Spreadsheet as its backend database, served via Google Apps Script as a web app.

---

## Overview

```
 ┌─────────────┐       HTTPS GET/POST        ┌──────────────────┐
 │  Client A    │ ◄──────────────────────────► │                  │
 │  (browser)   │                              │  Google Apps     │
 ├─────────────┤       HTTPS GET/POST         │  Script Web App  │
 │  Client B    │ ◄──────────────────────────► │  (Code.gs)       │
 │  (browser)   │                              │                  │
 ├─────────────┤       HTTPS GET/POST         │  reads/writes    │
 │  Client C    │ ◄──────────────────────────► │        ▼         │
 │  (browser)   │                              │  Google Sheet    │
 └─────────────┘                              └──────────────────┘
```

- **Server**: A single `Code.gs` file deployed as a Google Apps Script web app. Serves HTML and handles all API requests.
- **Client**: A single self-contained `.html` file (HTML + CSS + JS, no build tools). Served by the Apps Script `doGet()` or hosted separately.
- **Database**: A Google Spreadsheet. Each logical data entity gets its own sheet (tab). One sheet acts as a key-value config store for live application state.
- **Communication**: Clients poll the server at intervals. No WebSockets, no SSE — just HTTP fetch calls. The Google Sheet is the single source of truth.

---

## Timing Model — Choose One

### Option A: Asynchronous (event-driven, no shared clock)

Use this when actions happen in response to user input and there is no time pressure. Clients poll for state changes and react when they detect them.

- Clients poll the server periodically (e.g. every 5 seconds) to check for state changes.
- State transitions happen when a user takes an action (e.g. submits an answer, clicks a button).
- An admin or the system advances the state when a condition is met (e.g. all players have submitted).
- No timers, no deadlines, no clock synchronisation needed.

**Config sheet stores:**
```
currentPhase        — e.g. 'waiting', 'active', 'complete'
currentRoundId      — integer round counter
```

**Client polling loop:**
```js
setInterval(function() {
  fetch(API_URL + '?action=getState')
    .then(r => r.json())
    .then(data => reconcileState(data));
}, POLL_INTERVAL);
```

### Option B: Synchronous (absolute timestamps, deterministic clock)

Use this when phases must run on a shared timer across all devices — e.g. timed rounds, countdowns, simultaneous reveals. Each device uses its own clock against server-provided deadlines.

- When a phase begins, the server computes and stores **absolute ISO timestamps** for when each phase ends.
- Clients read these timestamps once, then count down locally using `Date.now()`.
- When a client's timer reaches 0, it **locally transitions the UI** immediately (no server round-trip needed) and then polls the server in the background for authoritative results.
- Phases tile seamlessly: the end of phase N is the start of phase N+1. Zero gaps.

**Config sheet stores:**
```
currentPhase        — e.g. 'guessing', 'reveal'
phaseAEndsAt        — ISO timestamp: '2026-02-25T09:02:00.000Z'
phaseBEndsAt        — ISO timestamp: '2026-02-25T09:02:30.000Z'
roundEvaluated      — 'true' / 'false'
currentRoundId      — integer round counter
```

**Server computes timestamps on phase start:**
```js
var now = new Date();
var phaseAEndsAt = new Date(now.getTime() + phaseADuration * 1000).toISOString();
var phaseBEndsAt = new Date(now.getTime() + (phaseADuration + phaseBDuration) * 1000).toISOString();
```

**Client countdown:**
```js
function getTimeRemaining() {
  var endMs = new Date(state.currentPhaseEndsAt).getTime();
  return Math.max(0, (endMs - Date.now()) / 1000);
}
```

**Seamless tiling — next round starts exactly when previous ends:**
```js
// Server-side: tile from previous phase end, not from 'now'
var tileFrom = new Date(config.phaseBEndsAt);  // previous round's end
var nextPhaseAEndsAt = new Date(tileFrom.getTime() + phaseADuration * 1000);
var nextPhaseBEndsAt = new Date(tileFrom.getTime() + (phaseADuration + phaseBDuration) * 1000);
```

**Client local phase advance (no server wait):**
```js
// When timer hits 0, switch UI locally, then poll for server data
if (remaining <= 0) {
  state.currentPhase = 'nextPhase';
  updateUI();
  pollServer();  // background fetch for authoritative data
}
```

**Auto-transition in getState (server-side):**
```js
// Before returning state, check if deadlines have passed
if (phase === 'active' && now > phaseAEndsAt) {
  evaluateAndTransition();
  config = readConfigMap();  // re-read after transition
}
```

**Clock skew mitigation:**
- Student phones auto-sync via NTP; typical drift is <1 second.
- Add a 1-2 second server-side grace period for submissions near deadlines.
- The server is always the authority for evaluation — clients only anticipate the UI transition.

---

## Google Sheet Structure

### Config Sheet (key-value store for live state)

| Column A (key) | Column B (value) |
|---|---|
| `currentPhase` | `'idle'` |
| `currentRoundId` | `0` |
| `settingA` | `50` |
| `settingB` | `120` |
| `adminPassphrase` | `'teacher'` |
| `liveDataJSON` | `'[]'` |

- One row per config key.
- Supports any type: strings, numbers, JSON blobs.
- Read all at once into a JS object with `readConfigMap()`.
- Write individual keys or batch-write multiple keys.

### Data Sheets (one per entity)

Each entity (players, rounds, submissions, etc.) gets its own sheet tab with a header row and one row per record.

```
Sheet: Players
| player_id | player_name | score | rounds_played | last_active |

Sheet: Rounds
| round_id | timestamp | result_json | winner | ...

Sheet: Submissions
| round_id | player_id | value | timestamp |
```

---

## Server Architecture (Code.gs)

### HTTP Handlers

Google Apps Script provides two entry points: `doGet(e)` and `doPost(e)`.

**CORS workaround**: Google Apps Script redirects POST requests (302), which breaks CORS for browser `fetch()`. Two solutions:

1. **Route everything through GET** — encode the action and payload as URL parameters. Simple, works for small payloads (<2KB).
2. **Use POST normally** — handle the redirect by using `mode: 'no-cors'` or `redirect: 'follow'` on the client. Less reliable across browsers.

Recommended: **Use GET for everything** with a JSON payload parameter.

```js
// ─── doGet: handles all actions ──────────────────────────
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var payload = {};
  try {
    if (e.parameter && e.parameter.payload) {
      payload = JSON.parse(decodeURIComponent(e.parameter.payload));
    }
  } catch (err) {}

  var result;
  try {
    switch (action) {
      case 'getState':     result = getState(); break;
      case 'submit':       result = handleSubmit(payload); break;
      case 'adminAction':  result = handleAdmin(payload); break;
      default:             result = { success: false, error: 'Unknown action' };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Config Read/Write Helpers

```js
var SHEET_ID = 'YOUR_SHEET_ID_HERE';

function getSpreadsheet() { return SpreadsheetApp.openById(SHEET_ID); }
function getConfigSheet() { return getSpreadsheet().getSheetByName('Config'); }

/**
 * Read all config key-value pairs into a plain JS object.
 */
function readConfigMap() {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    if (key) config[key] = data[i][1];
  }
  return config;
}

/**
 * Write a single config value by key. Updates existing row or appends.
 */
function writeConfigValue(key, value) {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

/**
 * Batch-write multiple config values at once.
 */
function writeConfigValues(obj) {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();
  var keyRowMap = {};
  for (var i = 1; i < data.length; i++) {
    keyRowMap[String(data[i][0]).trim()] = i + 1;
  }
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      if (keyRowMap[k]) {
        sheet.getRange(keyRowMap[k], 2).setValue(obj[k]);
      } else {
        sheet.appendRow([k, obj[k]]);
        keyRowMap[k] = sheet.getLastRow();
      }
    }
  }
}
```

### Entity CRUD Pattern

```js
/**
 * Upsert a record into a data sheet.
 * Finds by primary key in column A, updates or appends.
 */
function upsertRecord(sheetName, primaryKey, rowData) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === primaryKey) {
      // Update existing row
      for (var col = 0; col < rowData.length; col++) {
        sheet.getRange(i + 1, col + 1).setValue(rowData[col]);
      }
      return;
    }
  }
  // Append new row
  sheet.appendRow(rowData);
}
```

### Admin Authentication

```js
function verifyPassphrase(input) {
  var config = readConfigMap();
  var stored = String(config.adminPassphrase || 'defaultpass');
  return input === stored;
}
```

### Time-Driven Trigger (safety net for synchronous timing)

For Option B (synchronous timing), set up a 1-minute trigger as a safety net to advance phases even if no client polls:

```js
/**
 * Set up via: Apps Script editor → Triggers → Add Trigger →
 * checkExpiry → Time-driven → Minutes timer → Every minute
 */
function checkExpiry() {
  var config = readConfigMap();
  if (config.currentPhase === 'idle') return;

  var nowMs = new Date().getTime();
  if (config.phaseAEndsAt && nowMs > new Date(config.phaseAEndsAt).getTime()) {
    performTransition();
  }
}
```

### Sheet Setup Helper

```js
/**
 * Run ONCE manually to create sheet structure.
 * Apps Script editor → Run → setupSheets
 */
function setupSheets() {
  var ss = getSpreadsheet();

  // Config sheet
  var configSheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
  configSheet.clear();
  configSheet.appendRow(['key', 'value']);
  var defaults = {
    currentPhase: 'idle',
    currentRoundId: 0,
    adminPassphrase: 'teacher'
    // ... add your defaults
  };
  for (var k in defaults) {
    if (defaults.hasOwnProperty(k)) configSheet.appendRow([k, defaults[k]]);
  }

  // Data sheets — add as needed
  var dataSheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
  dataSheet.clear();
  dataSheet.appendRow(['id', 'field_a', 'field_b', 'timestamp']);

  return 'Setup complete.';
}
```

---

## Client Architecture (single .html file)

### Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>App Name</title>
  <style>
    /* All CSS here — no external stylesheets */
  </style>
</head>
<body>
  <!-- All HTML here -->
  <script>
  'use strict';
  (function() {
    // All JS here — single IIFE, no modules, no build tools
  })();
  </script>
</body>
</html>
```

### API Layer

```js
var API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

/**
 * All requests go via GET to avoid Apps Script CORS redirect issues.
 */
function apiCall(action, payload) {
  var url = API_URL + '?action=' + encodeURIComponent(action);
  if (payload) {
    url += '&payload=' + encodeURIComponent(JSON.stringify(payload));
  }
  return fetch(url, { method: 'GET' })
    .then(function(resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    });
}
```

### Polling

```js
var POLL_ACTIVE   = 5000;   // ms — during active game
var POLL_IDLE     = 15000;  // ms — when idle
var POLL_BG       = 20000;  // ms — when browser tab is hidden

var pollTimer = null;

function getInterval() {
  if (document.hidden) return POLL_BG;
  if (state.currentPhase === 'idle') return POLL_IDLE;
  return POLL_ACTIVE;
}

function startPolling() {
  poll();
  schedulePoll();
}

function schedulePoll() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(function() { poll(); schedulePoll(); }, getInterval());
}

function poll() {
  apiCall('getState')
    .then(function(data) {
      if (data && data.success) reconcileState(data);
    })
    .catch(function() { /* handle offline */ });
}

// Restore normal polling when tab becomes visible again
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) { poll(); schedulePoll(); }
});
```

### State Reconciliation

```js
function reconcileState(serverData) {
  var prevPhase = state.currentPhase;
  var prevRound = state.currentRoundId;

  // Update local state from server
  state.currentPhase = serverData.currentPhase;
  state.currentRoundId = serverData.currentRoundId;
  // ... update all fields

  // Detect transitions
  if (prevPhase !== state.currentPhase || prevRound !== state.currentRoundId) {
    onPhaseChange(prevPhase, state.currentPhase);
  }

  renderUI();
}
```

### Player Identity Persistence

Store the player ID redundantly so clearing one storage method doesn't let students rejoin as a different identity:

```js
function loadPlayerId() {
  var id = localStorage.getItem('app_pid')
        || getCookie('app_pid')
        || sessionStorage.getItem('app_pid');
  if (!id) id = crypto.randomUUID();
  savePlayerId(id);
  return id;
}

function savePlayerId(id) {
  try { localStorage.setItem('app_pid', id); } catch(e) {}
  try { sessionStorage.setItem('app_pid', id); } catch(e) {}
  setCookie('app_pid', id, 30);
}
```

### Optimistic UI Updates

For user actions (e.g. submitting a guess), update the local UI immediately, then send to the server. If the server rejects it, roll back:

```js
function handleUserAction(value) {
  // Optimistic local update
  state.myValue = value;
  renderUI();

  // Debounced server submission
  clearTimeout(submitTimer);
  submitTimer = setTimeout(function() {
    apiCall('submit', { playerId: state.playerId, value: value })
      .then(function(data) {
        if (!data.success) {
          // Roll back
          state.myValue = null;
          renderUI();
        }
      });
  }, 1000);
}
```

---

## Deployment Checklist

1. **Create the Google Sheet** — note the Sheet ID from the URL.
2. **Create the Apps Script project** — Extensions → Apps Script from the sheet, or standalone at script.google.com.
3. **Paste `Code.gs`** — update `SHEET_ID`.
4. **Run `setupSheets()`** once manually to create the sheet structure.
5. **Deploy as web app**:
   - Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Anyone** (for public apps) or **Anyone with link**
   - Copy the deployment URL — this is your `API_URL`.
6. **Set up the time trigger** (if using synchronous timing):
   - Triggers → Add Trigger → `checkExpiry` → Time-driven → Minutes → Every minute.
7. **Host the client HTML**:
   - Option A: Serve via `doGet()` using `HtmlService.createHtmlOutputFromFile('index')`.
   - Option B: Host the `.html` file anywhere (GitHub Pages, school server, OneDrive, etc.) and point `API_URL` to the Apps Script deployment URL.
8. **Test on two devices** — verify polling, state sync, and (if applicable) timer synchronisation.

---

## Constraints and Gotchas

| Constraint | Detail |
|---|---|
| **Apps Script execution time** | Max 6 minutes per execution. Keep operations fast. |
| **Concurrent writes** | Google Sheets has no row-level locking. Two simultaneous writes can clobber each other. For low-frequency writes (classroom games), this is rarely a problem. For high-frequency writes, store submissions as JSON in a single config cell and upsert by player ID. |
| **CORS with POST** | Apps Script 302-redirects POST requests, breaking browser CORS. Route everything through GET with URL-encoded payloads instead. |
| **Payload size** | URL parameters have practical limits (~2KB safe, ~8KB max). For large payloads, use actual POST with `mode: 'no-cors'` (fire-and-forget) or split into multiple calls. |
| **Polling latency** | Clients see updates at most every `POLL_INTERVAL` seconds. Acceptable for classroom tools; not suitable for real-time competitive games. |
| **Clock skew** | Phone clocks can drift 1-2 seconds from the server. Add grace periods for deadline enforcement. Not an issue for async timing. |
| **Cold starts** | First Apps Script call after inactivity takes 2-5 seconds (JIT compilation). Subsequent calls are ~0.5-1.5s. Consider a warm-up poll on page load. |
| **Quota limits** | Free Google accounts: ~20,000 Apps Script URL fetches/day, ~50,000 Sheets reads/day. Paid Workspace accounts have higher limits. Fine for classroom use. |
| **No push notifications** | There is no way to push state to clients. All sync is client-initiated polling. |

---

## Scaling Notes

This architecture is designed for **10-50 concurrent users** in a classroom setting. For larger scale:

- Increase poll intervals to reduce server load.
- Batch-read the entire Config sheet in one call rather than reading individual cells.
- Store per-round submissions as a JSON array in one config cell rather than individual sheet rows (avoids concurrent append conflicts).
- Consider moving to Firebase Realtime Database or Supabase if you need true real-time push with >100 users.
