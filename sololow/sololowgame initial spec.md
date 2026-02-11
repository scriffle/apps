# Lowest Unique Number — Classroom Game Specification

## Overview

A real-time, rolling classroom game where players compete to pick the **lowest unique number**. The game runs on continuous timed cycles with a guessing phase and reveal phase. Designed for classroom display (projector) with students entering guesses on their own devices.

---

## Core Game Mechanics

### Objective
Pick the lowest number that **no one else picks**. If your number is duplicated by another player, you're out for that round. The player with the lowest *unique* number wins.

### Round Structure
Each round has two phases that cycle continuously:

| Phase | Default Duration | Description |
|-------|------------------|-------------|
| **Guessing** | 2 minutes | Players select a number. Can change selection until phase ends. |
| **Reveal** | 30 seconds | Entries locked. Animated replay shown. Winner announced. |

Rounds continue indefinitely until manually stopped by admin.

### Valid Round Requirement
- **Minimum 5 players** must have submitted a guess for the round to count
- If fewer than 5 guesses: round is declared void, no points awarded, immediate transition to next guessing phase

### Win Condition
- The player who picked the **lowest number that appears exactly once** wins
- If **no number is unique** (every picked number has duplicates): **no winner** for that round

### Number Range
- Default: **1–50**
- Admin configurable (suggest options: 1–20, 1–50, 1–100)

---

## Scoring System

Two parallel scoring systems run simultaneously, displayed separately on leaderboard:

### 1. Simple Score
- **1 point per win**, regardless of winning number

### 2. Strategy Score (Logarithmic)
Points awarded based on winning number — lower numbers are harder to win with (more likely to be picked by others), so they're worth more.

| Winning Number | Points |
|----------------|--------|
| 1 | 10 |
| 2 | 9 |
| 3 | 7 |
| 4 | 6 |
| 5 | 5 |
| 6 | 4 |
| 7 | 4 |
| 8 | 3 |
| 9 | 2 |
| 10 | 1 |
| 11+ | 1 |

*Formula: `Math.round(10 - 9 * Math.log10(n) / Math.log10(10))` clamped to minimum 1, where n is the winning number. Integers 1–10 map to 10→1 on a log curve, 11+ all equal 1.*

---

## User Interface — Tabbed Layout

The app uses a **persistent tabbed interface**. All tabs are accessible at all times (except Admin, which requires passphrase).

### Tab 1: Pick (Entry)

**Purpose:** Players select their guess for the current round.

**Layout:**
- Player name input field (persisted to localStorage after first entry)
- Grid of number buttons: 1 to N (where N = max number from config)
  - Suggested layout: 10 columns × 5 rows for 1–50
  - Buttons are large, touch-friendly (mobile-first)
- Currently selected number highlighted prominently
- **No submit button** — selection is auto-recorded on tap
- Players can change selection any time during guessing phase (latest selection counts)
- Display: current phase, countdown timer, "Your pick: X" confirmation

**Phase Behaviour:**
- During **Guessing phase**: buttons active, selection allowed
- During **Reveal phase**: buttons disabled/greyed, message "Round in progress — wait for next round"

**Local Storage:**
- Store player name so they don't re-enter each round
- Optionally store a session ID / player ID for tracking

---

### Tab 2: Results / Replay

**Purpose:** Show the outcome of each round with an animated replay of guesses.

**Reveal Phase Animation:**
A fast-forward replay of how guesses came in during the guessing phase, compressed into **2/3 of the reveal duration** (default: 20 seconds of animation, 10 seconds for winner announcement).

**Replay Visualisation:**
- Horizontal row of number slots: **1 to 20** displayed (or 1 to N if smaller range)
  - For ranges > 20, show 1–20 prominently; numbers 21+ shown in a secondary condensed row or indicated numerically only
- Each number slot shows state:
  - **Unpicked**: empty/dim
  - **Picked once**: highlighted (green), player name appears **vertically underneath**
  - **Picked twice+**: marked as duplicate (red/crossed), all names shown vertically (stacked or scrolling if many)
- Guesses animate in chronologically (but compressed time), building tension
- After replay completes:
  - Winning number + player name displayed prominently with celebration animation
  - Points awarded shown
  - If no winner: "No unique number — no winner this round"

**After Reveal:**
- Shows static final state of the replay board until next reveal phase
- Quick stats: total guesses, how many unique numbers, winning number

---

### Tab 3: Leaderboard

**Purpose:** Running totals across all rounds in the session.

**Display:**
- Two leaderboard columns (or toggle between views):
  1. **Simple Score** — ranked by total wins
  2. **Strategy Score** — ranked by log-scale points
- Each row: Rank, Player Name, Score, Wins (count), Last Win (round #)
- Top 3 highlighted (gold/silver/bronze)
- Current round number displayed
- "Your position" indicator if player has entered a name

**Update Timing:**
- Updates immediately after each reveal phase completes

---

### Tab 4: History / Analytics

**Purpose:** Visualise pick patterns over time to inform strategy.

**Primary Visualisation — Number Frequency Plot:**
- X-axis: Number (1 to N)
- Y-axis: Times picked (cumulative across all rounds)
- Bar chart or heatmap showing which numbers are "hot" (over-picked) vs "cold" (under-picked)
- Helps students identify meta-game patterns

**Secondary Data:**
- Table of recent rounds (last 10):
  - Round #, Winning Number, Winner, Total Guesses, Unique Count
- "Most picked number overall" stat
- "Number that has never been picked" (if any)
- Average winning number

---

### Tab 5: Admin Config (Passphrase Protected)

**Access:**
- Passphrase prompt on tab open
- Passphrase stored in a `config.json` file (read client-side)
- **Not secure** — theatrical/casual protection only, not for sensitive data

**Configurable Parameters:**

| Parameter | Default | Type | Notes |
|-----------|---------|------|-------|
| `maxNumber` | 50 | int | Upper bound of pick range (1 to maxNumber) |
| `guessingDuration` | 120 | int (seconds) | Length of guessing phase |
| `revealDuration` | 30 | int (seconds) | Length of reveal phase |
| `minPlayersForValidRound` | 5 | int | Minimum guesses required |
| `adminPassphrase` | "teacher" | string | Access phrase for admin tab |

**Admin Controls:**
- Start / Pause / Reset game
- Manual "force next phase" button (skip to reveal early, or skip reveal to start new guessing)
- Clear all data (with confirmation)
- Export session data to Google Sheets (manual trigger)
- View/edit connected Google Sheet ID

---

## Data Persistence — Google Sheets Integration

### Purpose
- Persist game data beyond browser session
- Allow data analysis / record keeping
- Enable multi-device sync (e.g., teacher dashboard separate from student entry)

### Architecture
Use **Google Apps Script Web App** as a simple API layer:
- Deployed as public web app (anyone can access, or anyone with link)
- Receives POST requests from game client
- Reads/writes to a designated Google Sheet

### Google Sheet Structure

**Sheet 1: `Rounds`**
| Column | Description |
|--------|-------------|
| round_id | Auto-increment integer |
| timestamp | ISO datetime when round ended |
| total_guesses | Count of entries |
| unique_count | Count of numbers picked exactly once |
| winning_number | The lowest unique number (null if no winner) |
| winner_name | Player who won (null if no winner) |
| simple_points | Points awarded (simple) |
| strategy_points | Points awarded (log scale) |
| all_guesses_json | JSON string of all guesses: `[{name, number, timestamp}, ...]` |

**Sheet 2: `Players`**
| Column | Description |
|--------|-------------|
| player_id | Unique identifier (generated client-side, stored in localStorage) |
| player_name | Display name |
| total_wins | Count |
| simple_score | Running total |
| strategy_score | Running total |
| rounds_played | Count |
| last_active | ISO datetime |

**Sheet 3: `Config`**
| Column | Description |
|--------|-------------|
| key | Parameter name |
| value | Parameter value |

Stores current admin config so it persists and can sync across devices.

### API Endpoints (Apps Script)

**POST `/submitGuess`**
```json
{
  "player_id": "uuid",
  "player_name": "Alice",
  "number": 7,
  "round_id": 12,
  "timestamp": "2025-02-03T10:45:30Z"
}
```
Writes to a staging area (or directly to Rounds.all_guesses_json).

**POST `/endRound`**
```json
{
  "round_id": 12,
  "winning_number": 3,
  "winner_player_id": "uuid",
  "winner_name": "Bob",
  "simple_points": 1,
  "strategy_points": 7,
  "total_guesses": 24,
  "unique_count": 8,
  "all_guesses": [...]
}
```
Finalises round, updates Players sheet with new scores.

**GET `/getLeaderboard`**
Returns sorted player list with scores.

**GET `/getConfig`**
Returns current config values.

**POST `/setConfig`**
Updates config (requires passphrase in body).

### Sync Strategy
- **During guessing phase:** Client collects guesses locally, optionally streams to Sheets for live backup
- **On phase end:** Client sends complete round data to Sheets
- **On load:** Client fetches leaderboard + config from Sheets to restore state
- **Offline fallback:** If Sheets unavailable, game runs locally only with warning displayed

---

## Technical Requirements

### Client-Side
- Single HTML file (or minimal file structure) for easy deployment
- Vanilla JS or lightweight framework (no heavy dependencies)
- Mobile-responsive (students on phones)
- Works on school networks (no blocked ports/services)
- LocalStorage for player identity persistence

### Timing & Sync
- All timing controlled client-side with JavaScript intervals
- Countdown timer prominent on all tabs
- Phase transitions trigger events:
  - `onGuessingStart`: enable inputs, reset current round data
  - `onGuessingEnd`: lock inputs, prepare replay data
  - `onRevealStart`: play replay animation
  - `onRevealEnd`: show final results, update leaderboard, send data to Sheets

### Display Considerations
- **Projector mode**: Results/Replay tab designed for large display
- **Colour-blind friendly**: use patterns/icons in addition to colour for picked/duplicate/winner states
- **Large text**: timer and winning number should be readable from back of classroom

---

## User Flows

### Student Flow
1. Open game URL on phone
2. Enter name (first time only — saved to localStorage)
3. See Pick tab with countdown timer
4. Tap a number to select (can tap different number to change)
5. Wait for phase to end
6. Switch to Results tab to watch reveal (or it auto-switches)
7. Check Leaderboard tab to see standings
8. Repeat from step 4

### Teacher Flow
1. Open game URL on classroom computer (connected to projector)
2. Enter admin passphrase
3. Configure game parameters if needed
4. Start game
5. Display Results tab on projector during reveal phases
6. Display Leaderboard tab between games or at end of session
7. Export data to Sheets for records

---

## Edge Cases & Rules

| Scenario | Behaviour |
|----------|-----------|
| Player submits, then closes browser | Last recorded guess stands |
| Player changes name mid-session | Treated as new player (old name retains old scores) |
| Two players same name | Allowed (differentiated by player_id internally) |
| Player joins during reveal phase | Must wait for next guessing phase |
| Network fails during round | Local game continues; Sheets sync retries on reconnect |
| All numbers are duplicates | No winner, no points awarded |
| Tie for lowest unique (impossible) | By definition can't happen — "unique" means exactly one |
| Fewer than min players | Round void, skip to next guessing phase immediately |

---

## Future Enhancements (Out of Scope for V1)

- Sound effects (countdown beeps, winner fanfare)
- Team mode (players grouped, team scores aggregated)
- Tournaments (bracket structure across multiple sessions)
- QR code display for easy student join
- Real-time "X players have guessed" counter during guessing phase (without revealing numbers)
- "Streak bonus" for consecutive wins
- Historical analytics across multiple sessions (requires persistent player accounts)

---

## File Structure (Suggested)

```
/lowest-unique-game
├── index.html          # Main game interface
├── style.css           # Styling (or embedded in HTML)
├── game.js             # Core game logic
├── sheets-api.js       # Google Sheets integration
├── config.json         # Local config + passphrase
└── apps-script/
    └── Code.gs         # Google Apps Script for Sheets API
```

---

## Summary of Configurable Defaults

```json
{
  "maxNumber": 50,
  "guessingDurationSeconds": 120,
  "revealDurationSeconds": 30,
  "minPlayersForValidRound": 5,
  "adminPassphrase": "teacher",
  "googleSheetId": "YOUR_SHEET_ID_HERE",
  "replayDurationRatio": 0.67
}
```

---

*Specification v1.0 — February 2025*