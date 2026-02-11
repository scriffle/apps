# Comprehensive Web App Specification & Standards

> A complete specification for modern web application development. Every feature degrades gracefully. The app should feel fast, forgiving, and familiar.

---

## Table of Contents

1. [Architecture & Code Quality](#1-architecture--code-quality)
2. [Layout & Responsiveness](#2-layout--responsiveness)
3. [Accessibility](#3-accessibility)
4. [Keyboard Navigation](#4-keyboard-navigation)
5. [Touch & Input Interface](#5-touch--input-interface)
6. [Non-Modal UI Philosophy](#6-non-modal-ui-philosophy)
7. [State Management](#7-state-management)
8. [Persistence & Recovery](#8-persistence--recovery)
9. [Offline & PWA Support](#9-offline--pwa-support)
10. [Multi-Tab Architecture](#10-multi-tab-architecture)
11. [Dynamic Updates](#11-dynamic-updates)
12. [Visual Feedback & Polish](#12-visual-feedback--polish)
13. [Theming & Appearance](#13-theming--appearance)
14. [Animation & Motion](#14-animation--motion)
15. [Drag & Drop](#15-drag--drop)
16. [Data Handling](#16-data-handling)
17. [Settings & Preferences](#17-settings--preferences)
18. [Inline Editing](#18-inline-editing)
19. [Status Communication](#19-status-communication)
20. [Help & Onboarding](#20-help--onboarding)
21. [Error Handling & Resilience](#21-error-handling--resilience)
22. [Security](#22-security)
23. [Performance Optimization](#23-performance-optimization)
24. [Print Support](#24-print-support)
25. [URL & Sharing](#25-url--sharing)
26. [Internationalization Readiness](#26-internationalization-readiness)
27. [Browser & Device Support](#27-browser--device-support)
28. [Easter Eggs](#28-easter-eggs)
29. [Meta & Documentation](#29-meta--documentation)
30. [Verification Checklist](#30-verification-checklist)

---

## 1. Architecture & Code Quality

### File Structure
- Single HTML file with embedded CSS and JavaScript
- Clean, readable, well-commented code
- Logical function organization
- No console errors in normal operation
- Graceful error handling with user-friendly messages

### Module Organization
- IIFE or ES modules used (no global namespace pollution)
- `'use strict'` at top of all scripts
- Clear separation: state, render, handlers, utils
- Single source of truth for app state
- No circular dependencies between modules

### State Architecture
- Centralized state object (not scattered variables)
- State mutations go through single update function
- Deep clone on state snapshots (`structuredClone()` or equivalent)
- State shape documented at top of file

### Naming & Structure
- Consistent naming conventions (camelCase JS, kebab-case CSS)
- Functions do one thing
- Names describe intent, not implementation
- Constants for magic numbers/strings
- No single-letter variables except loops
- Comments explain "why", not "what"

### Code Cleanliness
- No commented-out code
- No unused variables/functions
- No console.logs in production (except errors)
- No debugger statements
- TODO comments have context

### Maintainability
- Complex logic has explanatory comments
- Config values at top, not buried
- Pure functions where possible
- Side effects isolated and explicit
- Functions <50 lines, files <500 lines

### Standards
- JSDoc comments for public functions
- CSS organized: reset, variables, layout, components, utilities
- Consistent formatting (2 or 4 space indent, choose one)
- Feature detection over user-agent sniffing
- Semantic versioning for your app (`data-version` attribute)
- Performance budgets: <3s first load, <100ms interactions

---

## 2. Layout & Responsiveness

### Core Principles
- Dynamically resizes to fill available viewport (no wasted space)
- Uses `clamp()`, viewport units (`vw`/`vh`/`dvh`), CSS Grid, and Flexbox
- Mobile-first with proper viewport meta tag
- Minimum 375px width support, scales gracefully to desktop
- No fixed pixel dimensions for main containers
- No horizontal scroll at any breakpoint

### Modern CSS Features
- Container queries for component-level responsiveness
- CSS `aspect-ratio` for media containers
- Safe area insets for notched devices (`env(safe-area-inset-*)`)
- Logical properties (`margin-inline`, `padding-block`) for RTL support
- `prefers-reduced-data` media query respect for low-bandwidth users
- `dvh` used for full-height on mobile (not `vh`)

### Text & Readability
- Text readable without zoom on mobile
- Text resizable to 200% without breaking layout

---

## 3. Accessibility

### Compliance Target
- WCAG 2.1 AA compliance minimum
- Screen reader testing with VoiceOver/NVDA expected

### Semantic Structure
- Semantic HTML5 landmarks (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`)
- Single `<main>` landmark per page
- Proper heading hierarchy (h1 â†’ h2 â†’ h3, no skipped levels)
- Lists use `<ul>`/`<ol>`, not divs
- Buttons are `<button>`, links are `<a>`
- Tables have proper headers

### ARIA Implementation
- ARIA labels, roles, and live regions for dynamic content
- `aria-live="polite"` for status updates, `"assertive"` for errors
- `aria-label` on icon-only buttons
- `aria-expanded` on toggles
- `aria-describedby` links errors to inputs
- `role` attributes where semantics unclear

### Focus Management
- Trap focus in modals/panels, restore on close
- Visible focus indicators (never `outline: none` without replacement)
- Focus indicators visible with 3:1 contrast minimum
- Skip-to-content link as first focusable element
- All interactive elements focusable
- Tab order matches visual order

### Visual Accessibility
- Color contrast ratio â‰¥4.5:1 for text, â‰¥3:1 for UI components
- Never convey information by color alone (use icons, patterns, text)
- `prefers-reduced-motion` media query respected throughout
- `prefers-contrast` support for high-contrast mode

### Form Accessibility
- Form inputs with associated `<label>` elements (never placeholder-only)
- Error messages linked to inputs via `aria-describedby`
- Disabled elements use `aria-disabled` when interaction feedback needed
- Required field indicators before submission attempt

---

## 4. Keyboard Navigation

### Core Requirements
- Full app operability without mouse
- Logical tab order following visual layout
- No keyboard traps (except intentional focus traps in modals)

### Navigation Keys
- Arrow key navigation within component groups (tabs, menus, grids)
- Home/End keys jump to first/last items in lists
- Page Up/Page Down for large scrollable areas
- Escape closes modals/panels (topmost layer only, not entire stack)
- Enter activates buttons, submits forms

### Advanced Patterns
- Type-ahead search in lists and dropdowns
- Keyboard shortcut overlay (toggle with `?` key)
- Modifier keys shown with platform awareness (âŒ˜ vs Ctrl)
- Roving tabindex pattern for composite widgets
- Keyboard shortcuts for power users (document in help section)

---

## 5. Touch & Input Interface

### Touch Targets
- Minimum 44px touch targets (48px preferred)
- Adequate spacing between targets (8px minimum)
- No hover-only interactions on touch devices

### Touch Support
- Full touch support: tap, drag, swipe gestures
- Pinch-to-zoom where appropriate
- Touch and mouse event parity
- Pointer Events API for unified mouse/touch/pen handling
- `touch-action` CSS for gesture control
- No 300ms tap delay (`touch-action: manipulation`)

### Gesture Handling
- Haptic feedback via Vibration API where supported
- Long-press detection for context menus (500ms threshold)
- Swipe gesture thresholds: 50px minimum, velocity-aware
- Double-tap prevention on buttons (300ms debounce)
- Right-click/long-press context menus with keyboard equivalents

### Keyboard Shortcuts
- Escape key cancels/closes any open panel or action
- Enter key confirms/submits
- Prevent unwanted key repeats on critical actions
- Ctrl+Z / Ctrl+Y (or Cmd on Mac) for undo/redo

---

## 6. Non-Modal UI Philosophy

### Prohibited Patterns
- No `alert()`, `confirm()`, or `prompt()` dialogs ever

### Preferred Patterns
- Use inline panels, slide-out drawers, and expandable sections
- Inline editing with save/cancel controls
- Two-click delete pattern (first click shows "Confirm?", second deletes)
- Settings in a sliding panel from screen edge
- Bottom sheets for mobile, side panels for desktop

### Toast Notifications
- Toast notifications for transient feedback
- Auto-dismiss 3-5 seconds
- Toasts stack with newest on top, max 3 visible
- Toast actions: dismiss, undo (where applicable)

### Confirmations & Help
- Non-blocking confirmations with timeout auto-proceed option
- Inline contextual help expandable with `?` icons
- Escape closes topmost layer only, not entire stack

---

## 7. State Management

### Undo/Redo System
- Full undo/redo system with ~100 state history maximum (prevents memory leak)
- Deep clone snapshots of application state
- Undo/Redo includes UI state, not just data
- Keyboard shortcuts: Ctrl+Z / Ctrl+Y (or Cmd on Mac)
- Visual indication of undo/redo availability
- Undo restores complete state, not partial
- Redo stack cleared on new action
- Grouped actions undone as one (batch)
- Undo available immediately after action

### Advanced State Patterns
- Command pattern for reversible operations
- State diffing for memory-efficient history
- Branch history preservation (redo survives after new actions optionally)
- Named checkpoints for complex workflows
- State serialization for URL sharing where appropriate
- Optimistic updates with rollback on failure

---

## 8. Persistence & Recovery

### Storage Strategy
- `localStorage` for all user data and preferences
- IndexedDB for large datasets (>5MB)
- Storage quota detection and graceful handling

### Auto-Save
- Auto-save on every meaningful change (debounced 500ms)
- Save on `beforeunload` and `visibilitychange` events
- Crash recovery: restore full state on reload

### Data Management
- Named save slots where appropriate
- CSV or JSON export/import for data backup
- Data versioning with migration logic for schema changes
- Export includes app version for import compatibility
- Import validation with preview before committing
- Clear data option with confirmation and backup prompt

### Multi-Tab Data
- Conflict resolution for multi-tab edits
- BroadcastChannel or storage event for sync
- Newer data wins or merge logic defined
- User notified of external changes

### Load Validation
- Load validates data structure
- Version stored with data for migration
- Corrupt data detected on load
- Corrupt state detected and reset option offered

---

## 9. Offline & PWA Support

### Service Worker
- Service Worker for offline capability
- Cache-first strategy for static assets
- Network-first for dynamic data with fallback
- Background sync for pending operations
- Service Worker update notification

### Offline UX
- Offline indicator in status bar
- Queue actions when offline, sync when online

### PWA Configuration
- `manifest.json` for installability
- App icons at required sizes (192px, 512px minimum)
- Splash screen configuration
- `display: standalone` for app-like experience
- Push notification readiness (opt-in only)

---

## 10. Multi-Tab Architecture

### Tab Navigation
- Tab-based navigation for distinct functional areas
- Tabs remember their scroll position and state
- Clean tab switching without data loss
- Visual indication of active tab
- Keyboard navigation between tabs (arrow keys or number keys)

### Tab Features
- Tab overflow handling: scrollable or dropdown menu
- Tab reordering via drag-and-drop
- Closeable tabs with unsaved changes warning
- Tab badges for notifications/counts
- Lazy tab content loading for performance
- URL hash or History API sync with active tab

### Cross-Browser-Tab Sync
- Cross-browser-tab sync via BroadcastChannel API
- Conflict resolution strategy defined
- Multiple tabs don't corrupt shared storage

---

## 11. Dynamic Updates

### Reactivity
- UI updates reactively when data changes
- No manual refresh required after actions
- Smooth transitions between states

### Loading States
- Loading indicators for async operations
- Skeleton screens during initial load
- Spinner has minimum display time (300ms) to prevent flash

### Optimization Techniques
- Optimistic UI updates where appropriate
- Progressive content hydration
- Intersection Observer for lazy-loaded sections
- Mutation Observer for DOM-driven updates
- `requestAnimationFrame` for smooth visual updates
- Debounced/throttled handlers for high-frequency events

---

## 12. Visual Feedback & Polish

### Interactive States
- CSS transitions on all interactive elements (0.15-0.3s)
- Hover states (with touch device fallbacks)
- Active/pressed states for buttons
- Disabled states clearly visible (not just opacity)

### Tooltips
- Tooltips with 0.5-1s delay
- Hide tooltips on interaction

### Animations & Effects
- CSS custom properties for consistent timing/easing
- `will-change` hints for animated properties
- GPU-accelerated transforms over layout properties
- Micro-interactions on success (checkmarks, confetti, etc.)
- Subtle animations for state changes

### Empty & Loading States
- Empty states with illustrations and helpful actions
- Loading state shown, not blank

### Scroll Behavior
- Scroll shadows indicating overflow content
- Rubber-band/bounce effects on overscroll (CSS `overscroll-behavior`)

### Consistency
- Spacing scale consistent (4/8px base)
- Typography scale consistent
- Color palette defined and used consistently
- Border radius consistent
- Icons same style/weight

---

## 13. Theming & Appearance

### Color Modes
- Light and dark mode support
- `prefers-color-scheme` system preference detection
- Manual theme toggle with preference persistence
- High contrast mode via `prefers-contrast`

### Theme Implementation
- CSS custom properties for all theme colors
- Smooth theme transitions (0.3s on `background-color`, `color`)
- Theme-aware images/icons (light/dark variants)
- Avoid pure black (`#000`) and pure white (`#fff`) for reduced eye strain

### Design Tokens
- Accent color customization option
- Typography scale with `--font-size-*` variables
- Consistent spacing scale (`--space-1` through `--space-8`)

---

## 14. Animation & Motion

### Reduced Motion
- `prefers-reduced-motion: reduce` disables non-essential animation
- Essential motion preserved (loading indicators, critical state changes)
- No infinite animations except intentional loaders

### Animation Patterns
- View Transitions API for page/state transitions where supported
- Staggered animations for list items (50-100ms delay increment)
- Spring-based easing for natural feel (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Exit animations before element removal
- Interruptible animations (can reverse mid-animation)
- Scroll-driven animations for parallax/progress indicators

### Quality
- No janky/stuttering animations
- Transitions use `transform`/`opacity` only (GPU-accelerated)

---

## 15. Drag & Drop

### Visual Feedback
- Visual feedback during drag (opacity, shadow, cursor change)
- Drop zone highlighting with valid/invalid states
- Ghost preview follows cursor at offset
- Drop placeholder shows insertion point
- Smooth animation of items shifting during drag

### Behavior
- Escape cancels drag operation
- Drag off-canvas to delete (where appropriate)
- Snap-to-grid or snap-to-position options
- Auto-scroll when dragging near container edges
- Multi-select drag support

### Accessibility
- Drag handle affordance for touch devices
- Keyboard alternative: select + arrow keys to reorder

---

## 16. Data Handling

### Search & Filter
- Client-side search with debounced input (200-300ms)
- Sortable columns/lists with visual indicators
- Filter UI with clear active filter indication

### Large Datasets
- Pagination or infinite scroll for large datasets
- Virtual scrolling for lists >100 items

### Batch Operations
- Batch operations with multi-select
- Bulk delete with count confirmation

### Form Validation
- Form validation: inline, real-time, on blur
- Validation messages beneath fields, not in alerts
- All user inputs validated (type, length, format)
- Numeric inputs checked for NaN, Infinity

### Data Formatting
- Data formatting: localized dates, numbers, currencies

---

## 17. Settings & Preferences

### Settings Panel
- Sliding settings panel
- Grouped, logical settings sections
- Search/filter within settings for large panels
- Recently changed settings section

### Persistence
- All settings persist in localStorage
- Settings apply immediately (live preview)
- Reset to defaults option with confirmation
- Import/export settings as JSON
- Settings sync across tabs via BroadcastChannel

### Safety
- Dangerous settings (delete all, reset) require explicit action

---

## 18. Inline Editing

### Edit Mode
- Click-to-edit pattern for editable fields
- Clear visual edit mode (border, background change)
- Save/Cancel button pair

### Behavior
- Validation before save with inline error display
- Escape cancels edit, Enter saves (for single-line fields)
- Shift+Enter for newlines in multi-line inline edits
- Autosave draft during long edits

### Features
- Markdown or rich text support where appropriate
- Character/word count for limited fields
- Resize handles for multi-line editors

---

## 19. Status Communication

### Status Area
- Persistent status bar or area for contextual messages
- Clear feedback for all user actions
- Connection status indicator (online/offline)
- Last saved timestamp ("Saved 2 minutes ago")

### Feedback Types
- Error states with red/warning styling and icons
- Success confirmations (green, checkmark)
- Processing/loading states
- Progress bars for multi-step operations

### Error Details
- Error messages are human-readable
- Collapsible error details for technical info
- Copy error details button for support requests
- Error state shows retry option

---

## 20. Help & Onboarding

### First-Run Experience
- First-run welcome with feature highlights
- Optional guided tour (skippable, resumable)
- "What's new" changelog for returning users

### Contextual Help
- Contextual help icons (`?`) with expandable explanations
- Keyboard shortcut reference (`?` key to toggle)
- Empty state guidance ("No items yet. Click + to add one")

### Support
- Searchable help content
- Link to documentation or support
- Feedback mechanism (integrated or link)

---

## 21. Error Handling & Resilience

### Global Error Handling
- Global error boundary with friendly fallback UI
- "Something went wrong" with retry and report options
- Console errors caught and logged, never shown to users

### Try/Catch Coverage
- All `JSON.parse()` wrapped in try/catch
- All `localStorage` operations wrapped (quota/disabled)
- All `fetch()` calls have error handling
- All async functions have catch blocks
- File/import operations validate before processing

### Network Resilience
- Automatic retry with exponential backoff for network errors
- Failed operations are retryable
- Race conditions handled (stale responses ignored)

### Graceful Degradation
- Features fail independently
- App loads if localStorage disabled
- App works if network unavailable
- Missing/corrupt saved data doesn't crash app
- Invalid URL params show error, not white screen
- Feature detection before using modern APIs

### Data Protection
- Validation errors prevent data corruption
- Malformed import files rejected with explanation
- Storage quota exceeded: prompt cleanup or export
- Partial failures don't corrupt good data
- Version mismatch on import handled with migration or rejection
- Auto-save failure notifies user

---

## 22. Security

### XSS Prevention
- All user input sanitized before rendering (prevent XSS)
- `textContent` used over `innerHTML` for user data
- If `innerHTML` needed, sanitize with DOMPurify or equivalent
- No `eval()`, `Function()`, or `setTimeout(string)`
- User input not used in `document.write()`
- Template literals escape HTML entities for user content

### Data Validation
- All user inputs validated (type, length, format)
- Numeric inputs checked for NaN, Infinity
- Array operations check bounds before access
- Object property access uses optional chaining (`?.`)
- Imported data schema validated before use

### Storage Security
- No sensitive data in localStorage (tokens, passwords)
- Data from storage treated as untrusted
- JSON.parse wrapped in try/catch

### External Resources
- External links use `rel="noopener noreferrer"`
- No inline event handlers in HTML (CSP-ready)
- Content Security Policy-ready

---

## 23. Performance Optimization

### DOM Operations
- DOM operations batched via DocumentFragment
- Event delegation for repeated elements
- No DOM queries in loops (cache references)
- `requestAnimationFrame` for visual updates
- Avoid layout thrashing (read then write, not interleaved)

### Event Handling
- Scroll/resize handlers debounced (100-200ms)
- Input handlers debounced for search (200-300ms)
- Touch/wheel events use `{ passive: true }`
- Event listeners removed on component cleanup
- No memory leaks from orphaned listeners

### Rendering Optimization
- Large lists use virtual scrolling (>100 items)
- Images lazy-loaded below fold
- Heavy computation offloaded to Web Worker
- CSS `contain` used on independent components
- `content-visibility: auto` for off-screen sections
- Animations use `transform`/`opacity` only (GPU-accelerated)

### Loading Performance
- Critical CSS inlined or loaded first
- Non-critical JS deferred
- Skeleton/placeholder shown during load
- Preload critical resources
- Bundle size consciousness (no unused dependencies)
- First meaningful paint <1s, interactive <3s
- Target 100ms response to user input

---

## 24. Print Support

### Print Stylesheet
- `@media print` stylesheet
- Hide navigation, controls, decorative elements
- Expand collapsed sections for full content
- Page break hints (`break-inside: avoid`)
- Print-friendly colors (dark text, light background)
- Include URLs inline for links

### Print Features
- Print button with preview
- PDF export option via browser print dialog

---

## 25. URL & Sharing

### URL State
- URL reflects app state where sensible (hash or History API)
- Shareable URLs for specific views/items
- Deep linking to specific tabs, items, or search results

### Validation
- URL parameters validated and sanitized on load
- Invalid URLs show helpful error, not crash

### Sharing Features
- Copy-link-to-clipboard with toast confirmation
- QR code generation for sharing (optional)

### Browser Navigation
- Browser back/forward buttons work correctly

---

## 26. Internationalization Readiness

### Text Handling
- Text externalized (no hardcoded strings in logic)
- Template literals or tagged templates for interpolation
- No text in images/icons
- Expandable UI for longer translations (German, Finnish)
- Pluralization rules considered

### Layout
- RTL layout support via `dir="rtl"` and logical properties

### Formatting
- Date/time via `Intl.DateTimeFormat`
- Numbers via `Intl.NumberFormat`

---

## 27. Browser & Device Support

### Target Browsers
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari and Android Chrome mobile browsers
- Minimum iOS 15, Android 10 (or graceful messaging for older)

### Development Approach
- Progressive enhancement: core functionality without JS where possible
- Feature detection with fallbacks
- Test on actual devices, not just emulators

---

## 28. Easter Eggs

### Requirements
- Include at least one hidden feature or fun surprise
- Discoverable through unusual interaction patterns
- Document internally with `// EASTER EGG:` comments
- Should delight without disrupting functionality

### Ideas
- Konami code or secret keystroke triggers welcome
- Holiday or date-based themes (optional)
- Developer credits hidden but findable

---

## 29. Meta & Documentation

### HTML Meta
- Descriptive `<title>` tag
- Meta description for link previews
- Open Graph tags for social sharing
- Favicon at multiple sizes
- Proper viewport meta tag

### Documentation
- Version number accessible in UI (footer or about)
- App version in `data-version` attribute
- Key functions have JSDoc comments
- Easter eggs marked with `// EASTER EGG:`
- Complex algorithms explained inline
- Data schema documented at top
- Keyboard shortcuts listed in help
- Internal code documentation for maintainability
- README or inline guide for future developers
- Changelog for version history

---

## 30. Verification Checklist

> Check every box or document why skipped. Ship nothing that crashes.

### Architecture & Structure

#### Module Organization
- [ ] IIFE or ES modules used (no global pollution)
- [ ] `'use strict'` at top of all scripts
- [ ] Clear separation: state, render, handlers, utils
- [ ] Single source of truth for app state
- [ ] No circular dependencies between modules

#### State Management
- [ ] Centralized state object (not scattered variables)
- [ ] State mutations go through single update function
- [ ] Deep clone on state snapshots (`structuredClone()` or equivalent)
- [ ] Undo/redo stack has ~100 state max limit (prevent memory leak)
- [ ] State shape documented at top of file

---

### Error Handling & Resilience

#### Try/Catch Coverage
- [ ] All `JSON.parse()` wrapped in try/catch
- [ ] All `localStorage` operations wrapped (quota/disabled)
- [ ] All `fetch()` calls have error handling
- [ ] All async functions have catch blocks
- [ ] File/import operations validate before processing

#### Graceful Degradation
- [ ] App loads if localStorage disabled
- [ ] App works if network unavailable
- [ ] Missing/corrupt saved data doesn't crash app
- [ ] Invalid URL params show error, not white screen
- [ ] Feature detection before using modern APIs

#### Recovery Mechanisms
- [ ] Corrupt state detected and reset option offered
- [ ] Auto-save failure notifies user
- [ ] Failed operations are retryable
- [ ] Partial failures don't corrupt good data
- [ ] Version mismatch on import handled with migration or rejection

---

### Security

#### XSS Prevention
- [ ] `textContent` used over `innerHTML` for user data
- [ ] If `innerHTML` needed, sanitize with DOMPurify or equivalent
- [ ] No `eval()`, `Function()`, or `setTimeout(string)`
- [ ] User input not used in `document.write()`
- [ ] Template literals escape HTML entities for user content

#### Data Validation
- [ ] All user inputs validated (type, length, format)
- [ ] Numeric inputs checked for NaN, Infinity
- [ ] Array operations check bounds before access
- [ ] Object property access uses optional chaining (`?.`)
- [ ] Imported data schema validated before use

#### Storage Security
- [ ] No sensitive data in localStorage (tokens, passwords)
- [ ] Data from storage treated as untrusted
- [ ] External links have `rel="noopener noreferrer"`
- [ ] No inline event handlers in HTML (CSP-ready)

---

### Performance

#### DOM Operations
- [ ] Batch DOM updates (DocumentFragment or single innerHTML)
- [ ] Event delegation used for repeated elements
- [ ] No DOM queries in loops (cache references)
- [ ] `requestAnimationFrame` for visual updates
- [ ] Avoid layout thrashing (read then write, not interleaved)

#### Event Handling
- [ ] Scroll/resize handlers debounced (100-200ms)
- [ ] Input handlers debounced for search (200-300ms)
- [ ] Touch/wheel events use `{ passive: true }`
- [ ] Event listeners removed on component cleanup
- [ ] No memory leaks from orphaned listeners

#### Rendering Optimization
- [ ] Large lists use virtual scrolling (>100 items)
- [ ] Images lazy-loaded below fold
- [ ] Heavy computation offloaded to Web Worker
- [ ] CSS `contain` used on independent components
- [ ] Animations use `transform`/`opacity` only (GPU)

#### Loading Performance
- [ ] Critical CSS inlined or loaded first
- [ ] Non-critical JS deferred
- [ ] Skeleton/placeholder shown during load
- [ ] Spinner has min display time (300ms) to prevent flash
- [ ] First meaningful paint <1s, interactive <3s

---

### Edge Cases

#### Input Boundaries
- [ ] Empty string inputs handled
- [ ] Whitespace-only inputs trimmed/rejected
- [ ] Maximum length enforced with feedback
- [ ] Zero and negative numbers handled appropriately
- [ ] Very long text doesn't break layout

#### Data Limits
- [ ] Empty state UI shown when no data
- [ ] Single item works (no "items[0]" assumptions)
- [ ] Very large datasets don't freeze UI
- [ ] localStorage quota exceeded handled
- [ ] Maximum items/entries enforced

#### Timing Edge Cases
- [ ] Rapid repeated clicks don't double-submit
- [ ] Double-click doesn't fire conflicting actions
- [ ] Pending async operations tracked and deduplicated
- [ ] Race conditions handled (stale responses ignored)
- [ ] User can't navigate away during critical save

#### Browser State
- [ ] Page refresh preserves state
- [ ] Back/forward buttons work correctly
- [ ] Multiple tabs don't corrupt shared storage
- [ ] Visibility change triggers save
- [ ] `beforeunload` saves pending changes

---

### Accessibility

#### Semantic Structure
- [ ] Single `<main>` landmark
- [ ] Heading hierarchy intact (no skipped levels)
- [ ] Lists use `<ul>`/`<ol>`, not divs
- [ ] Buttons are `<button>`, links are `<a>`
- [ ] Tables have proper headers

#### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Tab order matches visual order
- [ ] Focus visible on all elements (not just outline:none)
- [ ] Escape closes modals/panels
- [ ] Enter activates buttons, submits forms
- [ ] Arrow keys work in menus/tabs/grids

#### Screen Readers
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-live` regions for dynamic content
- [ ] `aria-expanded` on toggles
- [ ] `aria-describedby` links errors to inputs
- [ ] `role` attributes where semantics unclear
- [ ] Form inputs have visible `<label>` elements

#### Visual Accessibility
- [ ] Color contrast â‰¥4.5:1 for text
- [ ] Information not conveyed by color alone
- [ ] Focus indicators visible (3:1 contrast)
- [ ] Text resizable to 200% without breaking
- [ ] `prefers-reduced-motion` respected

---

### Responsive & Touch

#### Layout
- [ ] Works at 375px width minimum
- [ ] No horizontal scroll at any breakpoint
- [ ] Text readable without zoom on mobile
- [ ] `dvh` used for full-height on mobile (not `vh`)
- [ ] Safe area insets for notched devices

#### Touch Targets
- [ ] Minimum 44px touch targets (48px preferred)
- [ ] Adequate spacing between targets (8px min)
- [ ] No hover-only interactions on touch devices
- [ ] Long-press detected for context menus
- [ ] Swipe thresholds account for scrolling

#### Input Handling
- [ ] Touch and mouse events both handled
- [ ] Pointer Events API used where supported
- [ ] No 300ms tap delay (touch-action: manipulation)
- [ ] Pinch-to-zoom doesn't break app
- [ ] Virtual keyboard doesn't obscure inputs

---

### UI Polish

#### Visual Feedback
- [ ] Hover states on all clickables
- [ ] Active/pressed states on buttons
- [ ] Disabled states visually distinct (not just opacity)
- [ ] Loading states for async operations
- [ ] Success/error states clearly differentiated

#### Transitions & Animation
- [ ] Transitions on interactive elements (0.15-0.3s)
- [ ] No janky/stuttering animations
- [ ] Exit animations before removal
- [ ] Reduced motion: only essential animation
- [ ] No infinite animations except loaders

#### Empty & Error States
- [ ] Empty state has helpful message + action
- [ ] Error messages are human-readable
- [ ] Error state shows retry option
- [ ] Loading state shown, not blank
- [ ] Offline state clearly indicated

#### Consistency
- [ ] Spacing scale consistent (4/8px base)
- [ ] Typography scale consistent
- [ ] Color palette defined and used consistently
- [ ] Border radius consistent
- [ ] Icons same style/weight

---

### Persistence

#### Save/Load Cycle
- [ ] Auto-save debounced (500ms)
- [ ] Save on visibility change
- [ ] Save on beforeunload
- [ ] Load validates data structure
- [ ] Version stored with data for migration

#### Data Integrity
- [ ] Save is atomic (all or nothing)
- [ ] Corrupt data detected on load
- [ ] Import validates before applying
- [ ] Export includes version info
- [ ] Clear data requires confirmation

#### Multi-Tab Handling
- [ ] BroadcastChannel or storage event for sync
- [ ] Conflict resolution strategy defined
- [ ] Newer data wins or merge logic
- [ ] User notified of external changes

---

### Defensive Coding

#### Null Safety
- [ ] Optional chaining on nested access (`a?.b?.c`)
- [ ] Nullish coalescing for defaults (`??`)
- [ ] Array methods check array exists first
- [ ] `typeof` checks before operations
- [ ] Default parameters on functions

#### Type Coercion Awareness
- [ ] Strict equality (`===`) used, not `==`
- [ ] Number parsing uses `Number()` or `parseInt` with radix
- [ ] Boolean coercion explicit when needed
- [ ] String concatenation vs math clear

#### Array/Object Safety
- [ ] Spread/clone before mutation
- [ ] `Array.isArray()` before array methods
- [ ] `Object.hasOwn()` or `in` before property access
- [ ] Index bounds checked before array access
- [ ] Empty arrays handled in `.reduce()`

---

### Code Quality

#### Naming & Structure
- [ ] Functions do one thing
- [ ] Names describe intent, not implementation
- [ ] Constants for magic numbers/strings
- [ ] No single-letter variables except loops
- [ ] Comments explain "why", not "what"

#### Dead Code & Cleanliness
- [ ] No commented-out code
- [ ] No unused variables/functions
- [ ] No console.logs in production (except errors)
- [ ] No debugger statements
- [ ] TODO comments have context

#### Maintainability
- [ ] Complex logic has explanatory comments
- [ ] Config values at top, not buried
- [ ] Pure functions where possible
- [ ] Side effects isolated and explicit
- [ ] Functions <50 lines, files <500 lines

---

### Undo/Redo System

- [ ] State history has ~100 max limit (memory)
- [ ] Undo restores complete state, not partial
- [ ] Redo stack cleared on new action
- [ ] Keyboard shortcuts work (Ctrl/Cmd+Z/Y)
- [ ] UI indicates undo/redo availability
- [ ] Grouped actions undone as one (batch)
- [ ] Undo available immediately after action

---

### Documentation Embedded

- [ ] App version in data-version attribute
- [ ] Key functions have JSDoc comments
- [ ] Easter eggs marked with `// EASTER EGG:`
- [ ] Complex algorithms explained inline
- [ ] Data schema documented at top
- [ ] Keyboard shortcuts listed in help

---

### Pre-Ship Smoke Test

#### Happy Path
- [ ] Core workflow completes without error
- [ ] Data persists across refresh
- [ ] All buttons/links functional
- [ ] Forms submit correctly
- [ ] Navigation works as expected

#### Failure Path
- [ ] Offline mode handled
- [ ] Invalid input rejected gracefully
- [ ] Errors shown, not swallowed
- [ ] Recovery from error possible
- [ ] No console errors in normal use

#### Device Matrix
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Mobile iOS Safari
- [ ] Mobile Android Chrome
- [ ] Keyboard-only navigation
- [ ] 375px viewport
- [ ] 1920px viewport

---

### Testing Procedures

- [ ] Manual testing across breakpoints (375px, 768px, 1024px, 1440px)
- [ ] Keyboard-only navigation test
- [ ] Screen reader walkthrough
- [ ] Slow network simulation (3G)
- [ ] Offline mode behavior
- [ ] localStorage disabled handling
- [ ] Multi-tab conflict scenarios
- [ ] Long content/edge case text
- [ ] Rapid repeated actions (spam clicking)
- [ ] Browser back/forward button behavior

---

*This specification prioritizes inclusivity, resilience, and user delight. Every feature degrades gracefully. The app should feel fast, forgiving, and familiar.*