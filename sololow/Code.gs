/**
 * Lowest Unique Number — Google Apps Script Backend
 *
 * Deployed as a web app to serve as the game server.
 * Manages game state, round evaluation, scoring, and data persistence
 * via Google Sheets.
 *
 * Sheet ID: 1WUdH5d9gQ_3pMDKJ3oPI1GiKSuFHwPWZBo2KuwKtHOk
 *
 * Sheet Structure:
 *   Config  — key/value pairs for game settings and live state
 *   Rounds  — one row per completed round
 *   Players — one row per known player with cumulative scores
 */

// ─── Constants ───────────────────────────────────────────────────────────────

var SHEET_ID = '1WUdH5d9gQ_3pMDKJ3oPI1GiKSuFHwPWZBo2KuwKtHOk';

var DEFAULT_CONFIG = {
  maxNumber: 50,
  guessingDuration: 120,
  revealDuration: 30,
  minPlayers: 5,
  adminPassphrase: 'teacher',
  currentPhase: 'idle',
  phaseStartTime: '',
  currentRoundId: 0,
  currentGuesses: '[]',
  replayDurationRatio: 0.67
};

// ─── HTTP Handlers ───────────────────────────────────────────────────────────

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var result;

  try {
    switch (action) {
      case 'getGameState':
        result = getGameState();
        break;
      case 'getLeaderboard':
        var scoreType = (e.parameter && e.parameter.scoreType) || 'strategy';
        result = getLeaderboard(scoreType);
        break;
      case 'getRoundHistory':
        var limit = parseInt(e.parameter && e.parameter.limit, 10) || 10;
        result = getRoundHistory(limit);
        break;
      case 'getConfig':
        result = getConfig();
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Invalid JSON body' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var action = body.action || '';
  var result;

  try {
    switch (action) {
      case 'submitGuess':
        result = submitGuess(body);
        break;
      case 'advancePhase':
        result = advancePhase(body);
        break;
      case 'startGame':
        result = startGame(body);
        break;
      case 'pauseGame':
        result = pauseGame(body);
        break;
      case 'setConfig':
        result = setConfig(body);
        break;
      case 'resetGame':
        result = resetGame(body);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Sheet Helpers ───────────────────────────────────────────────────────────

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getConfigSheet() {
  return getSpreadsheet().getSheetByName('Config');
}

function getRoundsSheet() {
  return getSpreadsheet().getSheetByName('Rounds');
}

function getPlayersSheet() {
  return getSpreadsheet().getSheetByName('Players');
}

/**
 * Read all config key-value pairs into an object.
 */
function readConfigMap() {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    var value = data[i][1];
    if (key) {
      config[key] = value;
    }
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
 * Write multiple config values at once.
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

// ─── Game State ──────────────────────────────────────────────────────────────

function getGameState() {
  var config = readConfigMap();
  var guesses = [];
  try {
    guesses = JSON.parse(config.currentGuesses || '[]');
  } catch (e) {
    guesses = [];
  }

  var lastRoundResult = null;
  try {
    if (config.lastRoundResult) {
      lastRoundResult = JSON.parse(config.lastRoundResult);
    }
  } catch (e) {
    lastRoundResult = null;
  }

  return {
    success: true,
    currentPhase: config.currentPhase || 'idle',
    phaseStartTime: config.phaseStartTime || '',
    currentRoundId: parseInt(config.currentRoundId, 10) || 0,
    guessCount: guesses.length,
    lastRoundResult: lastRoundResult,
    config: {
      maxNumber: parseInt(config.maxNumber, 10) || 50,
      guessingDuration: parseInt(config.guessingDuration, 10) || 120,
      revealDuration: parseInt(config.revealDuration, 10) || 30,
      minPlayers: parseInt(config.minPlayers, 10) || 5,
      replayDurationRatio: parseFloat(config.replayDurationRatio) || 0.67
    }
  };
}

function getConfig() {
  var config = readConfigMap();
  var safeConfig = {};
  for (var k in config) {
    if (config.hasOwnProperty(k) && k !== 'adminPassphrase') {
      safeConfig[k] = config[k];
    }
  }
  return { success: true, config: safeConfig };
}

// ─── Guess Submission ────────────────────────────────────────────────────────

function submitGuess(body) {
  var playerId = String(body.playerId || '').trim();
  var playerName = String(body.playerName || '').trim();
  var number = parseInt(body.number, 10);

  if (!playerId || !playerName) {
    return { success: false, error: 'Missing playerId or playerName' };
  }

  var config = readConfigMap();

  if (config.currentPhase !== 'guessing') {
    return { success: false, error: 'Not in guessing phase' };
  }

  var maxNumber = parseInt(config.maxNumber, 10) || 50;
  if (isNaN(number) || number < 1 || number > maxNumber) {
    return { success: false, error: 'Invalid number. Must be 1-' + maxNumber };
  }

  var guesses = [];
  try {
    guesses = JSON.parse(config.currentGuesses || '[]');
  } catch (e) {
    guesses = [];
  }

  // Upsert: replace existing guess for this player, or add new
  var found = false;
  for (var i = 0; i < guesses.length; i++) {
    if (guesses[i].playerId === playerId) {
      guesses[i].number = number;
      guesses[i].playerName = playerName;
      guesses[i].timestamp = new Date().toISOString();
      found = true;
      break;
    }
  }
  if (!found) {
    guesses.push({
      playerId: playerId,
      playerName: playerName,
      number: number,
      timestamp: new Date().toISOString()
    });
  }

  writeConfigValue('currentGuesses', JSON.stringify(guesses));

  // Ensure player exists in Players sheet
  ensurePlayer(playerId, playerName);

  return { success: true, guessCount: guesses.length };
}

/**
 * Ensure a player row exists in the Players sheet.
 */
function ensurePlayer(playerId, playerName) {
  var sheet = getPlayersSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === playerId) {
      // Update name and last_active
      sheet.getRange(i + 1, 2).setValue(playerName);
      sheet.getRange(i + 1, 7).setValue(new Date().toISOString());
      return;
    }
  }

  // New player: playerId, playerName, totalWins, simpleScore, strategyScore, roundsPlayed, lastActive
  sheet.appendRow([playerId, playerName, 0, 0, 0, 0, new Date().toISOString()]);
}

// ─── Game Control ────────────────────────────────────────────────────────────

function startGame(body) {
  var passphrase = String(body.passphrase || '');
  if (!verifyPassphrase(passphrase)) {
    return { success: false, error: 'Invalid passphrase' };
  }

  var config = readConfigMap();
  var currentPhase = config.currentPhase || 'idle';

  if (currentPhase === 'guessing' || currentPhase === 'reveal') {
    return { success: false, error: 'Game already running' };
  }

  var roundId = (parseInt(config.currentRoundId, 10) || 0) + 1;

  writeConfigValues({
    currentPhase: 'guessing',
    phaseStartTime: new Date().toISOString(),
    currentRoundId: roundId,
    currentGuesses: '[]'
  });

  return { success: true, phase: 'guessing', roundId: roundId };
}

function pauseGame(body) {
  var passphrase = String(body.passphrase || '');
  if (!verifyPassphrase(passphrase)) {
    return { success: false, error: 'Invalid passphrase' };
  }

  writeConfigValues({
    currentPhase: 'idle',
    phaseStartTime: ''
  });

  return { success: true, phase: 'idle' };
}

function advancePhase(body) {
  var passphrase = String(body.passphrase || '');
  if (!verifyPassphrase(passphrase)) {
    return { success: false, error: 'Invalid passphrase' };
  }

  return performPhaseTransition();
}

/**
 * Core phase transition logic.
 * Called by admin advancePhase or by the time trigger checkPhaseExpiry.
 */
function performPhaseTransition() {
  var config = readConfigMap();
  var currentPhase = config.currentPhase || 'idle';

  if (currentPhase === 'idle') {
    return { success: false, error: 'Game is not running' };
  }

  if (currentPhase === 'guessing') {
    // Transition guessing → reveal: evaluate the round
    return transitionToReveal(config);
  }

  if (currentPhase === 'reveal') {
    // Transition reveal → guessing: start next round
    return transitionToGuessing(config);
  }

  return { success: false, error: 'Unknown phase: ' + currentPhase };
}

function transitionToReveal(config) {
  var guesses = [];
  try {
    guesses = JSON.parse(config.currentGuesses || '[]');
  } catch (e) {
    guesses = [];
  }

  var minPlayers = parseInt(config.minPlayers, 10) || 5;
  var roundId = parseInt(config.currentRoundId, 10) || 1;

  // Check minimum players
  if (guesses.length < minPlayers) {
    // Void round — skip directly to next guessing phase
    var nextRoundId = roundId + 1;
    writeConfigValues({
      currentPhase: 'guessing',
      phaseStartTime: new Date().toISOString(),
      currentRoundId: nextRoundId,
      currentGuesses: '[]'
    });
    return {
      success: true,
      phase: 'guessing',
      roundId: nextRoundId,
      voidRound: true,
      reason: 'Not enough players (' + guesses.length + '/' + minPlayers + ')'
    };
  }

  // Evaluate the round
  var result = evaluateRound(guesses);

  // Write round to Rounds sheet
  var roundsSheet = getRoundsSheet();
  roundsSheet.appendRow([
    roundId,
    new Date().toISOString(),
    guesses.length,
    result.uniqueCount,
    result.winningNumber !== null ? result.winningNumber : '',
    result.winnerName || '',
    result.simplePoints,
    result.strategyPoints,
    JSON.stringify(guesses)
  ]);

  // Update winner in Players sheet
  if (result.winnerId) {
    updatePlayerScore(result.winnerId, result.simplePoints, result.strategyPoints, roundId);
  }

  // Update rounds played for all participants
  updateRoundsPlayed(guesses);

  // Store last round result in config for clients to read during reveal
  writeConfigValues({
    currentPhase: 'reveal',
    phaseStartTime: new Date().toISOString(),
    lastRoundResult: JSON.stringify({
      roundId: roundId,
      winningNumber: result.winningNumber,
      winnerId: result.winnerId,
      winnerName: result.winnerName,
      simplePoints: result.simplePoints,
      strategyPoints: result.strategyPoints,
      totalGuesses: guesses.length,
      uniqueCount: result.uniqueCount,
      guesses: guesses
    })
  });

  return {
    success: true,
    phase: 'reveal',
    roundId: roundId,
    result: result
  };
}

function transitionToGuessing(config) {
  var nextRoundId = (parseInt(config.currentRoundId, 10) || 0) + 1;

  writeConfigValues({
    currentPhase: 'guessing',
    phaseStartTime: new Date().toISOString(),
    currentRoundId: nextRoundId,
    currentGuesses: '[]'
  });

  return { success: true, phase: 'guessing', roundId: nextRoundId };
}

// ─── Round Evaluation ────────────────────────────────────────────────────────

/**
 * Find the lowest unique number from an array of guesses.
 * Returns { winningNumber, winnerId, winnerName, simplePoints, strategyPoints, uniqueCount }
 */
function evaluateRound(guesses) {
  // Count occurrences of each number
  var counts = {};
  var playerByNumber = {};

  for (var i = 0; i < guesses.length; i++) {
    var num = guesses[i].number;
    counts[num] = (counts[num] || 0) + 1;
    if (!playerByNumber[num]) {
      playerByNumber[num] = guesses[i];
    }
  }

  // Find unique numbers (count === 1) sorted ascending
  var uniqueNumbers = [];
  for (var n in counts) {
    if (counts.hasOwnProperty(n) && counts[n] === 1) {
      uniqueNumbers.push(parseInt(n, 10));
    }
  }
  uniqueNumbers.sort(function(a, b) { return a - b; });

  var uniqueCount = uniqueNumbers.length;

  if (uniqueNumbers.length === 0) {
    return {
      winningNumber: null,
      winnerId: null,
      winnerName: null,
      simplePoints: 0,
      strategyPoints: 0,
      uniqueCount: uniqueCount
    };
  }

  var winningNumber = uniqueNumbers[0];
  var winner = playerByNumber[winningNumber];
  var strategyPoints = calculateStrategyScore(winningNumber);

  return {
    winningNumber: winningNumber,
    winnerId: winner.playerId,
    winnerName: winner.playerName,
    simplePoints: 1,
    strategyPoints: strategyPoints,
    uniqueCount: uniqueCount
  };
}

/**
 * Logarithmic strategy scoring.
 * Lower winning numbers are worth more points (harder to win with).
 */
function calculateStrategyScore(winningNumber) {
  if (winningNumber <= 0) return 0;
  if (winningNumber >= 11) return 1;
  var raw = Math.round(10 - 9 * Math.log(winningNumber) / Math.log(10));
  return Math.max(1, Math.min(10, raw));
}

// ─── Player Score Updates ────────────────────────────────────────────────────

function updatePlayerScore(playerId, simplePoints, strategyPoints, roundId) {
  var sheet = getPlayersSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === playerId) {
      var row = i + 1;
      var currentWins = parseInt(data[i][2], 10) || 0;
      var currentSimple = parseInt(data[i][3], 10) || 0;
      var currentStrategy = parseInt(data[i][4], 10) || 0;

      sheet.getRange(row, 3).setValue(currentWins + 1);
      sheet.getRange(row, 4).setValue(currentSimple + simplePoints);
      sheet.getRange(row, 5).setValue(currentStrategy + strategyPoints);
      sheet.getRange(row, 7).setValue(new Date().toISOString());
      return;
    }
  }
}

function updateRoundsPlayed(guesses) {
  var sheet = getPlayersSheet();
  var data = sheet.getDataRange().getValues();

  var playerRowMap = {};
  for (var i = 1; i < data.length; i++) {
    playerRowMap[String(data[i][0]).trim()] = {
      row: i + 1,
      roundsPlayed: parseInt(data[i][5], 10) || 0
    };
  }

  for (var j = 0; j < guesses.length; j++) {
    var pid = guesses[j].playerId;
    if (playerRowMap[pid]) {
      var info = playerRowMap[pid];
      sheet.getRange(info.row, 6).setValue(info.roundsPlayed + 1);
      sheet.getRange(info.row, 7).setValue(new Date().toISOString());
    }
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function getLeaderboard(scoreType) {
  var sheet = getPlayersSheet();
  var data = sheet.getDataRange().getValues();
  var players = [];

  for (var i = 1; i < data.length; i++) {
    players.push({
      playerId: String(data[i][0]).trim(),
      playerName: String(data[i][1]).trim(),
      totalWins: parseInt(data[i][2], 10) || 0,
      simpleScore: parseInt(data[i][3], 10) || 0,
      strategyScore: parseInt(data[i][4], 10) || 0,
      roundsPlayed: parseInt(data[i][5], 10) || 0,
      lastActive: String(data[i][6] || '')
    });
  }

  // Sort by requested score type descending
  var sortKey = scoreType === 'simple' ? 'simpleScore' : 'strategyScore';
  players.sort(function(a, b) { return b[sortKey] - a[sortKey]; });

  return { success: true, players: players, scoreType: scoreType };
}

// ─── Round History ───────────────────────────────────────────────────────────

function getRoundHistory(limit) {
  var sheet = getRoundsSheet();
  var data = sheet.getDataRange().getValues();
  var rounds = [];

  // Skip header row, read from bottom (most recent) up to limit
  for (var i = data.length - 1; i >= 1 && rounds.length < limit; i--) {
    rounds.push({
      roundId: parseInt(data[i][0], 10) || 0,
      timestamp: String(data[i][1] || ''),
      totalGuesses: parseInt(data[i][2], 10) || 0,
      uniqueCount: parseInt(data[i][3], 10) || 0,
      winningNumber: data[i][4] !== '' ? parseInt(data[i][4], 10) : null,
      winnerName: String(data[i][5] || ''),
      simplePoints: parseInt(data[i][6], 10) || 0,
      strategyPoints: parseInt(data[i][7], 10) || 0,
      guesses: data[i][8] || '[]'
    });
  }

  return { success: true, rounds: rounds };
}

// ─── Config Management ───────────────────────────────────────────────────────

function setConfig(body) {
  var passphrase = String(body.passphrase || '');
  if (!verifyPassphrase(passphrase)) {
    return { success: false, error: 'Invalid passphrase' };
  }

  var allowedKeys = ['maxNumber', 'guessingDuration', 'revealDuration', 'minPlayers', 'adminPassphrase', 'replayDurationRatio'];
  var updates = {};

  for (var i = 0; i < allowedKeys.length; i++) {
    var key = allowedKeys[i];
    if (body.hasOwnProperty(key) && body[key] !== undefined && body[key] !== null) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No valid config keys provided' };
  }

  writeConfigValues(updates);
  return { success: true, updated: Object.keys(updates) };
}

function resetGame(body) {
  var passphrase = String(body.passphrase || '');
  if (!verifyPassphrase(passphrase)) {
    return { success: false, error: 'Invalid passphrase' };
  }

  // Clear Rounds sheet (keep header)
  var roundsSheet = getRoundsSheet();
  if (roundsSheet.getLastRow() > 1) {
    roundsSheet.deleteRows(2, roundsSheet.getLastRow() - 1);
  }

  // Clear Players sheet (keep header)
  var playersSheet = getPlayersSheet();
  if (playersSheet.getLastRow() > 1) {
    playersSheet.deleteRows(2, playersSheet.getLastRow() - 1);
  }

  // Reset game state in config
  writeConfigValues({
    currentPhase: 'idle',
    phaseStartTime: '',
    currentRoundId: 0,
    currentGuesses: '[]',
    lastRoundResult: ''
  });

  return { success: true };
}

// ─── Auth Helper ─────────────────────────────────────────────────────────────

function verifyPassphrase(input) {
  var config = readConfigMap();
  var stored = String(config.adminPassphrase || 'teacher');
  return input === stored;
}

// ─── Time Trigger: Phase Expiry Check ────────────────────────────────────────

/**
 * Called by a 1-minute time trigger.
 * Checks if the current phase has expired and transitions automatically.
 *
 * To set up: In Apps Script editor, go to Triggers (clock icon) →
 * Add Trigger → checkPhaseExpiry → Time-driven → Minutes timer → Every minute
 */
function checkPhaseExpiry() {
  var config = readConfigMap();
  var currentPhase = config.currentPhase || 'idle';

  if (currentPhase === 'idle') return;

  var phaseStartTime = config.phaseStartTime;
  if (!phaseStartTime) return;

  var startMs = new Date(phaseStartTime).getTime();
  var nowMs = new Date().getTime();

  var durationSec;
  if (currentPhase === 'guessing') {
    durationSec = parseInt(config.guessingDuration, 10) || 120;
  } else if (currentPhase === 'reveal') {
    durationSec = parseInt(config.revealDuration, 10) || 30;
  } else {
    return;
  }

  var elapsedSec = (nowMs - startMs) / 1000;

  if (elapsedSec >= durationSec) {
    performPhaseTransition();
  }
}

// ─── Sheet Setup Helper ──────────────────────────────────────────────────────

/**
 * Run this function ONCE manually to set up the sheet structure.
 * In the Apps Script editor: Run → setupSheets
 */
function setupSheets() {
  var ss = getSpreadsheet();

  // Config sheet
  var configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
  }
  configSheet.clear();
  configSheet.appendRow(['key', 'value']);
  for (var k in DEFAULT_CONFIG) {
    if (DEFAULT_CONFIG.hasOwnProperty(k)) {
      configSheet.appendRow([k, DEFAULT_CONFIG[k]]);
    }
  }

  // Rounds sheet
  var roundsSheet = ss.getSheetByName('Rounds');
  if (!roundsSheet) {
    roundsSheet = ss.insertSheet('Rounds');
  }
  roundsSheet.clear();
  roundsSheet.appendRow([
    'round_id', 'timestamp', 'total_guesses', 'unique_count',
    'winning_number', 'winner_name', 'simple_points', 'strategy_points',
    'all_guesses_json'
  ]);

  // Players sheet
  var playersSheet = ss.getSheetByName('Players');
  if (!playersSheet) {
    playersSheet = ss.insertSheet('Players');
  }
  playersSheet.clear();
  playersSheet.appendRow([
    'player_id', 'player_name', 'total_wins', 'simple_score',
    'strategy_score', 'rounds_played', 'last_active'
  ]);

  // Remove default Sheet1 if it exists and is empty
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 3) {
    try {
      ss.deleteSheet(sheet1);
    } catch (e) {
      // Ignore if can't delete
    }
  }

  return 'Setup complete. Sheets created: Config, Rounds, Players';
}
