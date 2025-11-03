# Frugal Five - Curriculum Data Structure

## ✅ What's Been Created

### 8 Curriculum JSON Files (100 categories × 10 words each = 1000 words per file)

1. **VCE Biology Year 11 Unit 1 AOS 2** - Cell Biology
   - Path: `curricula/vce/biology/year-11/unit-01/area-of-study-02/cell-biology.json`
   - Colors: Blue-green theme
   - 100 categories covering cellular structures, functions, and processes

2. **VCE Specialist Mathematics Year 12 Unit 3** - Complex Numbers
   - Path: `curricula/vce/specialist-mathematics/year-12/unit-03/complex-numbers.json`
   - Colors: Purple theme
   - 100 categories covering complex number operations and applications

3. **HSC Physics Year 12 Module 6** - Electromagnetism
   - Path: `curricula/hsc/physics/year-12/module-06/electromagnetism.json`
   - Colors: Dark blue theme
   - 100 categories covering electromagnetic induction and related topics

4. **HSC Chemistry Year 11 Module 2** - Quantitative Chemistry
   - Path: `curricula/hsc/chemistry/year-11/module-02/quantitative-chemistry.json`
   - Colors: Orange-red theme
   - 100 categories covering mole concept, stoichiometry, and calculations

5. **Victorian Curriculum Years 7-8 Science** - Forces
   - Path: `curricula/vic-curriculum/years-07-08/science/topics/forces.json`
   - Colors: Teal theme
   - 100 categories covering types of forces, Newton's laws, and motion

6. **Victorian Curriculum Years 9-10 History** - Industrial Revolution
   - Path: `curricula/vic-curriculum/years-09-10/history/topics/industrial-revolution.json`
   - Colors: Brown theme
   - 100 categories covering inventions, social changes, and impacts

7. **Australian Curriculum Year 9 Geography** - Climate Change
   - Path: `curricula/australian-curriculum/year-09/geography/topics/climate-change.json`
   - Colors: Green theme
   - 100 categories covering greenhouse effect, impacts, and solutions

8. **Australian Curriculum Year 10 Humanities** - World War 2
   - Path: `curricula/australian-curriculum/year-10/humanities/topics/world-war-2.json`
   - Colors: Red theme
   - 100 categories covering causes, major events, and consequences

### Manifest File

- **manifest.json** - Central registry of all curricula
  - Contains metadata for all 8 curricula
  - Includes display names, paths, colors, and breadcrumbs
  - Auto-generated display names from file paths

## 📁 Directory Structure

```
frugal-five-refactored/
├── manifest.json (5KB)
├── curricula/
│   ├── vce/
│   │   ├── biology/year-11/unit-01/area-of-study-02/cell-biology.json (18KB)
│   │   └── specialist-mathematics/year-12/unit-03/complex-numbers.json (26KB)
│   ├── hsc/
│   │   ├── physics/year-12/module-06/electromagnetism.json (26KB)
│   │   └── chemistry/year-11/module-02/quantitative-chemistry.json (26KB)
│   ├── vic-curriculum/
│   │   ├── years-07-08/science/topics/forces.json (26KB)
│   │   └── years-09-10/history/topics/industrial-revolution.json (26KB)
│   └── australian-curriculum/
│       ├── year-09/geography/topics/climate-change.json (26KB)
│       └── year-10/humanities/topics/world-war-2.json (26KB)
├── js/ (empty - for future JavaScript files)
└── css/ (empty - for future CSS files)
```

## 🎨 Color Schemes

Each curriculum has a unique 4-color Material Design palette:

- **VCE Biology**: `#1e3c72 → #2a5298 → #00a86b → #008855` (Blue-green)
- **VCE Specialist Maths**: `#4A148C → #6A1B9A → #8E24AA → #9C27B0` (Purple)
- **HSC Physics**: `#0D47A1 → #1565C0 → #1976D2 → #1E88E5` (Deep blue)
- **HSC Chemistry**: `#BF360C → #D84315 → #E64A19 → #FF5722` (Orange-red)
- **Vic Curriculum Science**: `#004D40 → #00695C → #00897B → #26A69A` (Teal)
- **Vic Curriculum History**: `#5D4037 → #6D4C41 → #795548 → #8D6E63` (Brown)
- **Aus Curriculum Geography**: `#1B5E20 → #2E7D32 → #388E3C → #43A047` (Green)
- **Aus Curriculum Humanities**: `#B71C1C → #C62828 → #D32F2F → #E53935` (Red)

## 📊 Data Statistics

- **Total curricula**: 8
- **Total categories**: 800 (8 × 100)
- **Total words**: 8,000 (800 × 10)
- **Average file size**: ~24KB per curriculum
- **Manifest size**: 5KB
- **Total data size**: ~200KB

## 🔄 Next Steps

### 1. UI Development Required

Create the following UI components:

#### **Curriculum Selection Interface**
- Radio buttons for framework selection (VCE, HSC, Vic Curriculum, Aus Curriculum)
- Cascading dropdowns that adapt based on framework:
  - VCE: Year → Subject → Unit → [AOS] → Topic
  - HSC: Year → Subject → Module → Topic
  - Vic Curriculum: Year Band → Subject → Topic
  - Aus Curriculum: Year → Subject → Topic

#### **Quick Access Section**
- Display last 5 played curricula as clickable buttons
- Show breadcrumb for each (e.g., "VCE > Biology > Year 11 > Unit 1 > AOS 2 > Cell Biology")

#### **Settings Panel**
- Timer duration selector (2, 3, 4, or 5 minutes)
- Current curriculum display
- Progress indicator per curriculum

### 2. JavaScript Modules to Create

#### `js/curriculum-loader.js`
- Load manifest.json on app init
- Fetch selected curriculum JSON
- Cache curriculum in memory
- Manage curriculum switching

#### `js/game-engine.js`
- Game logic (unchanged from original)
- Progress tracking per curriculum
- Score calculation
- Category cycling (1-100 before repeat)

#### `js/ui-controller.js`
- DOM manipulation
- Dropdown population based on manifest
- Color theme application (CSS variable updates)
- Event handlers for curriculum selection

### 3. CSS Updates

Apply color theming via CSS variables:
```css
:root {
  --color-primary-dark: /* Color 1 */;
  --color-primary: /* Color 2 */;
  --color-secondary: /* Color 3 */;
  --color-secondary-light: /* Color 4 */;
}
```

### 4. LocalStorage Schema

```javascript
{
  "settings": {
    "timerDuration": 300,
    "lastPlayedCurriculum": "vce-biology-y11-u01-aos02-cell-biology"
  },
  "recentCurricula": [
    {
      "id": "vce-biology-y11-u01-aos02-cell-biology",
      "breadcrumb": "VCE > Biology > Year 11 > Unit 1 > AOS 2 > Cell Biology",
      "lastPlayed": "2025-01-15T10:30:00Z"
    }
  ],
  "progress": {
    "vce-biology-y11-u01-aos02-cell-biology": {
      "usedCategories": [0, 5, 12, 23, ...],
      "gamesPlayed": 15,
      "bestScore": 8
    }
  }
}
```

## ✅ Validation Checklist

- [x] All 8 curriculum files created (100 categories each)
- [x] Each category has exactly 10 words
- [x] All words are lowercase
- [x] All words are minimum 5 letters
- [x] Manifest includes all curricula with proper metadata
- [x] File paths match directory structure
- [x] Color schemes follow Material Design
- [x] Display names use proper capitalization
- [x] Breadcrumbs are human-readable

## 🚀 Deployment

1. Copy entire `frugal-five-refactored/` folder to web server
2. Ensure `manifest.json` is at root level
3. Host on GitHub Pages or similar static host
4. No backend required - pure client-side application

## 📝 Notes

- Game logic remains **unchanged** from original
- Timer presets: 2, 3, 4, 5 minutes (user selects)
- Progress tracked separately per curriculum
- Each curriculum can be played 100 times before categories repeat
- Typical teacher uses 5-10 different curricula
- Total data transfer per session: ~450KB (manifest + 5 curricula)
