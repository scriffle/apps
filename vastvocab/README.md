# VastVocab - Dynamic Curriculum Word Game

## 🎯 What's Been Built

A complete refactoring of the Frugal Five word game with dynamic curriculum loading, maintaining 100% of the original gameplay mechanics.

### Files Created:

1. **vastvocab.html** - Main game application
2. **generate-manifest.html** - Manifest generator tool
3. **css/styles.css** - Complete styles with dynamic theming
4. **js/storage-manager.js** - localStorage per-curriculum tracking
5. **js/curriculum-loader.js** - Manifest and JSON loading
6. **js/game-engine.js** - Pure game logic (curriculum-agnostic)
7. **js/ui-controller.js** - DOM manipulation and curriculum selector

## 🚀 Quick Start

### Step 1: Generate Manifest

1. Place all 8 JSON files in the same directory as `generate-manifest.html`
2. Start a local server:
   ```bash
   python -m http.server 8000
   ```
3. Open: `http://localhost:8000/generate-manifest.html`
4. Click "Generate Manifest"
5. Click "Download manifest.json"
6. Save the file to your project root

### Step 2: Run the Game

1. Ensure your directory structure looks like this:
   ```
   /
   ├── vastvocab.html
   ├── manifest.json (generated)
   ├── css/
   │   └── styles.css
   ├── js/
   │   ├── storage-manager.js
   │   ├── curriculum-loader.js
   │   ├── game-engine.js
   │   └── ui-controller.js
   ├── forces.json
   ├── electromagnetism.json
   ├── climate-change.json
   ├── cell-biology.json
   ├── complex-numbers.json
   ├── quantitative-chemistry.json
   ├── industrial-revolution.json
   └── world-war-2.json
   ```

2. Open: `http://localhost:8000/vastvocab.html`

3. Select a curriculum from the dropdown or recent list

4. Play!

## 🎮 How to Use

### For Teachers:

**Class Starts:**
1. Open vastvocab.html
2. Select timer duration (2/3/4/5 minutes)
3. Choose curriculum:
   - Click "Change Topic" → Select framework → Subject → Year → Topic
   - OR click "Recent ▼" → Pick from last 10 curricula
4. Click "Start Game"

**During Gameplay:**
- Selector controls are disabled
- Focus on the game with students

**After Game:**
- Results shown
- Click "New Game" to play again (same curriculum)
- OR click "Change Topic" / "Recent" to switch curricula

### Gameplay Preserved 100%:

✅ 5 words per game  
✅ 10 letters maximum  
✅ 3 wrong guesses limit  
✅ Category reveal costs 2 letters  
✅ First letter always shown  
✅ Timer with customizable duration  
✅ Progress tracking (100 categories before repeat)  
✅ Game history with statistics  
✅ All original animations and feedback  

## 📊 Features

### Dynamic Curriculum Loading
- Manifest-driven architecture
- 8 sample curricula included
- Expandable to hundreds of curricula
- Per-curriculum progress tracking
- Automatic color theming

### Recent Selections
- Last 10 played curricula
- Shows: Name + Time played + Progress (47/100)
- One-click access

### Settings
- Timer: 2, 3, 4, or 5 minutes
- Remembers last used
- Per-curriculum progress tracking
- Category cycling (1-100 before repeat)

### Statistics
- Win rate
- Best score per curriculum
- Game history (last 100 games)
- Detailed per-game breakdown

## 🔧 Technical Details

### Architecture:
- **storage-manager.js**: All localStorage operations
- **curriculum-loader.js**: Manifest parsing, JSON fetching
- **game-engine.js**: Pure game logic (no DOM manipulation)
- **ui-controller.js**: All DOM updates, event handling

### Data Flow:
```
manifest.json → CurriculumLoader → GameEngine → UIController → DOM
                       ↓
                StorageManager (localStorage)
```

### Color Theming:
Each curriculum's colors automatically apply via CSS variables:
- `--color-primary-dark`
- `--color-primary`
- `--color-secondary`
- `--color-secondary-light`

### Storage Schema:
```javascript
{
  settings: {
    timerDuration: 180,
    lastCurriculumId: "vic-y78-science-forces"
  },
  recent: [
    {
      id: "...",
      breadcrumb: "...",
      lastPlayed: "2025-11-03T..."
    }
  ],
  progress: {
    "curriculum-id": {
      usedCategories: [0, 5, 12, ...],
      gamesPlayed: 15,
      bestScore: 8
    }
  },
  history: [
    {
      date: "...",
      curriculumId: "...",
      won: true,
      score: 12,
      category: "...",
      wordsGuessed: 5,
      totalWords: 5
    }
  ]
}
```

## 🔄 Adding New Curricula

1. Add new JSON files to the directory (follow existing format)
2. Re-run `generate-manifest.html`
3. Download updated `manifest.json`
4. Replace old manifest
5. Refresh the game - new curricula appear automatically

### JSON Format:
```json
{
  "metadata": {
    "id": "unique-id",
    "framework": "framework-slug",
    "frameworkName": "Display Name",
    "breadcrumb": "Full > Path > Display",
    "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
    "path": "filename.json"
  },
  "categories": [
    {
      "category": "Category Name",
      "words": ["word1", "word2", ..., "word10"]
    }
    // ... 100 categories
  ]
}
```

## 🎨 Customization

### Colors:
Edit JSON metadata colors array (4 colors required)

### Timer Options:
Modify `vastvocab.html` timer buttons data-duration values

### Styling:
Edit `css/styles.css` (CSS variables for easy theming)

## 📝 Validation Checklist

✅ Manifest generator creates valid manifest.json  
✅ All 8 sample curricula load correctly  
✅ Color theming applies automatically  
✅ Recent list shows last 10 with details  
✅ Progress tracks per-curriculum (100 categories)  
✅ Settings persist (timer, last curriculum)  
✅ Game history saves across all curricula  
✅ Curriculum switching blocked during active game  
✅ All original game mechanics preserved  
✅ Statistics panel shows global + per-curriculum data  

## 🐛 Troubleshooting

**Manifest won't generate:**
- Ensure running on local server (not file://)
- Check all 8 JSON files are in same directory
- Open browser console for errors

**Game won't load:**
- Verify manifest.json exists in root
- Check console for 404 errors
- Ensure all JS files in js/ directory
- Verify CSS file in css/ directory

**Curriculum doesn't load:**
- Check JSON path in manifest matches actual file
- Verify JSON has required metadata fields
- Check browser console for parsing errors

## 📦 Deployment

1. Upload all files to web server
2. Ensure proper directory structure
3. No backend required - pure client-side
4. Works offline after first load (browser cache)

## 🎓 For Developers

### Code Organization:
- **StorageManager**: Pure data layer (no UI)
- **CurriculumLoader**: Data fetching (no game logic)
- **GameEngine**: Pure game logic (no DOM)
- **UIController**: Coordinates everything, handles DOM

### Extending:
- Add new tools: Modify `UIController` event listeners
- Change game rules: Edit `GameEngine` constants
- Custom themes: Add CSS variables in `styles.css`
- New storage features: Extend `StorageManager` methods

## 📄 License

Original game concept: Frugal Five Science
Refactored by: VastVocab Team
Date: November 2025

---

**Questions? Issues?**
Check browser console for errors or open an issue in your repository.
