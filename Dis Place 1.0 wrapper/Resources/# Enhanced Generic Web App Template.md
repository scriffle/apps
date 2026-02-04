# Enhanced Generic Web App Template

Here's your template significantly expanded with modern features, accessibility, performance optimizations, and polished UX patterns:

---

## Layout & Responsiveness
- Single HTML file with embedded CSS and JavaScript
- Dynamically resizes to fill available viewport (no wasted space)
- Uses `clamp()`, viewport units (`vw`/`vh`/`dvh`), CSS Grid, and Flexbox
- Mobile-first with proper viewport meta tag
- Minimum 375px width support, scales gracefully to desktop
- No fixed pixel dimensions for main containers
- **Container queries for component-level responsiveness**
- **CSS `aspect-ratio` for media containers**
- **Safe area insets for notched devices (`env(safe-area-inset-*)`)**
- **Logical properties (`margin-inline`, `padding-block`) for RTL support**
- **`prefers-reduced-data` media query respect for low-bandwidth users**

---

## Accessibility (A11y) — NEW SECTION
- WCAG 2.1 AA compliance minimum
- Semantic HTML5 landmarks (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`)
- Proper heading hierarchy (h1 → h2 → h3, no skips)
- ARIA labels, roles, and live regions for dynamic content
- `aria-live="polite"` for status updates, `"assertive"` for errors
- Focus management: trap focus in modals/panels, restore on close
- Visible focus indicators (never `outline: none` without replacement)
- Skip-to-content link as first focusable element
- Color contrast ratio ≥4.5:1 for text, ≥3:1 for UI components
- Never convey information by color alone (use icons, patterns, text)
- `prefers-reduced-motion` media query respected throughout
- `prefers-contrast` support for high-contrast mode
- Screen reader testing with VoiceOver/NVDA expected
- Form inputs with associated `<label>` elements (never placeholder-only)
- Error messages linked to inputs via `aria-describedby`
- Disabled elements use `aria-disabled` when interaction feedback needed

---

## Touch & Input Interface
- Full touch support: tap, drag, swipe gestures
- Pinch-to-zoom where appropriate
- Minimum 44px touch targets (48px preferred)
- Touch and mouse event parity
- Keyboard shortcuts for power users (document in help section)
- Escape key cancels/closes any open panel or action
- Enter key confirms/submits
- Prevent unwanted key repeats on critical actions
- **Pointer Events API for unified mouse/touch/pen handling**
- **`touch-action` CSS for gesture control**
- **Haptic feedback via Vibration API where supported**
- **Long-press detection for context menus (500ms threshold)**
- **Swipe gesture thresholds: 50px minimum, velocity-aware**
- **Double-tap prevention on buttons (300ms debounce)**
- **Right-click/long-press context menus with keyboard equivalents**

---

## Keyboard Navigation — NEW SECTION
- Full app operability without mouse
- Logical tab order following visual layout
- Arrow key navigation within component groups (tabs, menus, grids)
- Home/End keys jump to first/last items in lists
- Page Up/Page Down for large scrollable areas
- Type-ahead search in lists and dropdowns
- Keyboard shortcut overlay (toggle with `?` key)
- Modifier keys shown with platform awareness (⌘ vs Ctrl)
- No keyboard traps (except intentional focus traps in modals)
- Roving tabindex pattern for composite widgets

---

## Non-Modal UI Philosophy
- No `alert()`, `confirm()`, or `prompt()` dialogs ever
- Use inline panels, slide-out drawers, and expandable sections
- Inline editing with save/cancel controls
- Two-click delete pattern (first click shows "Confirm?", second deletes)
- Toast notifications for transient feedback (auto-dismiss 3-5s)
- Settings in a sliding panel from screen edge
- **Toasts stack with newest on top, max 3 visible**
- **Toast actions: dismiss, undo (where applicable)**
- **Non-blocking confirmations with timeout auto-proceed option**
- **Inline contextual help expandable with `?` icons**
- **Bottom sheets for mobile, side panels for desktop**
- **Escape closes topmost layer only, not entire stack**

---

## State Management
- Full undo/redo system with ~100 state history
- Deep clone snapshots of application state
- Undo/Redo includes UI state, not just data
- Keyboard shortcuts: Ctrl+Z / Ctrl+Y (or Cmd on Mac)
- Visual indication of undo/redo availability
- **Command pattern for reversible operations**
- **State diffing for memory-efficient history**
- **Branch history preservation (redo survives after new actions optionally)**
- **Named checkpoints for complex workflows**
- **State serialization for URL sharing where appropriate**
- **Optimistic updates with rollback on failure**

---

## Persistence & Recovery
- `localStorage` for all user data and preferences
- Auto-save on every meaningful change (debounced 500ms)
- Save on `beforeunload` and `visibilitychange` events
- Crash recovery: restore full state on reload
- Named save slots where appropriate
- CSV or JSON export/import for data backup
- **IndexedDB for large datasets (>5MB)**
- **Storage quota detection and graceful handling**
- **Data versioning with migration logic for schema changes**
- **Conflict resolution for multi-tab edits**
- **Export includes app version for import compatibility**
- **Import validation with preview before committing**
- **Clear data option with confirmation and backup prompt**

---

## Offline & PWA Support — NEW SECTION
- Service Worker for offline capability
- Cache-first strategy for static assets
- Network-first for dynamic data with fallback
- Offline indicator in status bar
- Queue actions when offline, sync when online
- `manifest.json` for installability
- App icons at required sizes (192px, 512px minimum)
- Splash screen configuration
- `display: standalone` for app-like experience
- Background sync for pending operations
- Push notification readiness (opt-in only)

---

## Multi-Tab Architecture
- Tab-based navigation for distinct functional areas
- Tabs remember their scroll position and state
- Clean tab switching without data loss
- Visual indication of active tab
- Keyboard navigation between tabs (arrow keys or number keys)
- **Tab overflow handling: scrollable or dropdown menu**
- **Tab reordering via drag-and-drop**
- **Closeable tabs with unsaved changes warning**
- **Tab badges for notifications/counts**
- **Lazy tab content loading for performance**
- **URL hash or History API sync with active tab**
- **Cross-browser-tab sync via BroadcastChannel API**

---

## Dynamic Updates
- UI updates reactively when data changes
- No manual refresh required after actions
- Smooth transitions between states
- Loading indicators for async operations
- Optimistic UI updates where appropriate
- **Skeleton screens during initial load**
- **Progressive content hydration**
- **Intersection Observer for lazy-loaded sections**
- **Mutation Observer for DOM-driven updates**
- **requestAnimationFrame for smooth visual updates**
- **Debounced/throttled handlers for high-frequency events**

---

## Visual Feedback & Polish
- CSS transitions on all interactive elements (0.15-0.3s)
- Hover states (with touch device fallbacks)
- Active/pressed states for buttons
- Disabled states clearly visible (not just opacity)
- Tooltips with 0.5-1s delay, hide on interaction
- Subtle animations for state changes
- **CSS custom properties for consistent timing/easing**
- **`will-change` hints for animated properties**
- **GPU-accelerated transforms over layout properties**
- **Micro-interactions on success (checkmarks, confetti, etc.)**
- **Loading spinners with minimum display time (300ms) to prevent flicker**
- **Empty states with illustrations and helpful actions**
- **Scroll shadows indicating overflow content**
- **Rubber-band/bounce effects on overscroll (CSS `overscroll-behavior`)**

---

## Theming & Appearance — NEW SECTION
- Light and dark mode support
- `prefers-color-scheme` system preference detection
- Manual theme toggle with preference persistence
- CSS custom properties for all theme colors
- Smooth theme transitions (0.3s on `background-color`, `color`)
- High contrast mode via `prefers-contrast`
- Accent color customization option
- Typography scale with `--font-size-*` variables
- Consistent spacing scale (`--space-1` through `--space-8`)
- Theme-aware images/icons (light/dark variants)
- Avoid pure black (`#000`) and pure white (`#fff`) for reduced eye strain

---

## Animation & Motion — NEW SECTION
- `prefers-reduced-motion: reduce` disables non-essential animation
- Essential motion preserved (loading indicators, critical state changes)
- View Transitions API for page/state transitions where supported
- Staggered animations for list items (50-100ms delay increment)
- Spring-based easing for natural feel (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Exit animations before element removal
- Interruptible animations (can reverse mid-animation)
- Scroll-driven animations for parallax/progress indicators
- No infinite animations except intentional loaders

---

## Drag & Drop
- Visual feedback during drag (opacity, shadow, cursor change)
- Drop zone highlighting with valid/invalid states
- Escape cancels drag operation
- Drag off-canvas to delete (where appropriate)
- Snap-to-grid or snap-to-position options
- **Drag handle affordance for touch devices**
- **Keyboard alternative: select + arrow keys to reorder**
- **Auto-scroll when dragging near container edges**
- **Multi-select drag support**
- **Ghost preview follows cursor at offset**
- **Drop placeholder shows insertion point**
- **Smooth animation of items shifting during drag**

---

## Data Handling — NEW SECTION
- Client-side search with debounced input (200-300ms)
- Sortable columns/lists with visual indicators
- Filter UI with clear active filter indication
- Pagination or infinite scroll for large datasets
- Virtual scrolling for 1000+ item lists
- Batch operations with multi-select
- Bulk delete with count confirmation
- Form validation: inline, real-time, on blur
- Validation messages beneath fields, not in alerts
- Required field indicators before submission attempt
- Data formatting: localized dates, numbers, currencies

---

## Settings & Preferences
- Sliding settings panel
- Grouped, logical settings sections
- All settings persist in localStorage
- Settings apply immediately (live preview)
- Reset to defaults option with confirmation
- **Search/filter within settings for large panels**
- **Recently changed settings section**
- **Import/export settings as JSON**
- **Settings sync across tabs via BroadcastChannel**
- **Dangerous settings (delete all, reset) require explicit action**

---

## Inline Editing
- Click-to-edit pattern for editable fields
- Clear visual edit mode (border, background change)
- Save/Cancel button pair
- Validation before save with inline error display
- Escape cancels edit, Enter saves (for single-line fields)
- **Shift+Enter for newlines in multi-line inline edits**
- **Autosave draft during long edits**
- **Markdown or rich text support where appropriate**
- **Character/word count for limited fields**
- **Resize handles for multi-line editors**

---

## Status Communication
- Persistent status bar or area for contextual messages
- Clear feedback for all user actions
- Error states with red/warning styling and icons
- Success confirmations (green, checkmark)
- Processing/loading states
- **Connection status indicator (online/offline)**
- **Last saved timestamp ("Saved 2 minutes ago")**
- **Progress bars for multi-step operations**
- **Collapsible error details for technical info**
- **Copy error details button for support requests**

---

## Help & Onboarding — NEW SECTION
- First-run welcome with feature highlights
- Optional guided tour (skippable, resumable)
- Contextual help icons (`?`) with expandable explanations
- Keyboard shortcut reference (`?` key to toggle)
- "What's new" changelog for returning users
- Empty state guidance ("No items yet. Click + to add one")
- Searchable help content
- Link to documentation or support
- Feedback mechanism (integrated or link)

---

## Error Handling & Resilience — NEW SECTION
- Global error boundary with friendly fallback UI
- "Something went wrong" with retry and report options
- Automatic retry with exponential backoff for network errors
- Graceful degradation: features fail independently
- Console errors caught and logged, never shown to users
- Validation errors prevent data corruption
- Malformed import files rejected with explanation
- Storage quota exceeded: prompt cleanup or export
- Service Worker update notification

---

## Security Considerations — NEW SECTION
- All user input sanitized before rendering (prevent XSS)
- `textContent` over `innerHTML` where possible
- Content Security Policy-ready (no inline event handlers in HTML)
- No `eval()` or `Function()` constructor
- localStorage data treated as untrusted on load
- JSON.parse wrapped in try/catch
- No sensitive data in client storage
- External links use `rel="noopener noreferrer"`

---

## Performance Optimization — NEW SECTION
- DOM operations batched via DocumentFragment
- Event delegation for repeated elements
- Passive event listeners for scroll/touch
- Debounced resize/scroll handlers
- Web Workers for heavy computation
- Lazy load images and below-fold content
- Preload critical resources
- CSS containment (`contain: layout style paint`)
- `content-visibility: auto` for off-screen sections
- Bundle size consciousness (no unused dependencies)
- Target 100ms response to user input

---

## Print Support — NEW SECTION
- `@media print` stylesheet
- Hide navigation, controls, decorative elements
- Expand collapsed sections for full content
- Page break hints (`break-inside: avoid`)
- Print-friendly colors (dark text, light background)
- Include URLs inline for links
- Print button with preview
- PDF export option via browser print dialog

---

## URL & Sharing — NEW SECTION
- URL reflects app state where sensible (hash or History API)
- Shareable URLs for specific views/items
- Copy-link-to-clipboard with toast confirmation
- URL parameters validated and sanitized on load
- Invalid URLs show helpful error, not crash
- Deep linking to specific tabs, items, or search results
- QR code generation for sharing (optional)

---

## Internationalization Readiness — NEW SECTION
- Text externalized (no hardcoded strings in logic)
- Template literals or tagged templates for interpolation
- RTL layout support via `dir="rtl"` and logical properties
- Date/time via `Intl.DateTimeFormat`
- Numbers via `Intl.NumberFormat`
- Pluralization rules considered
- No text in images/icons
- Expandable UI for longer translations (German, Finnish)

---

## Easter Eggs
- Include at least one hidden feature or fun surprise
- Discoverable through unusual interaction patterns
- Document internally with `// EASTER EGG:` comments
- Should delight without disrupting functionality
- **Konami code or secret keystroke triggers welcome**
- **Holiday or date-based themes (optional)**
- **Developer credits hidden but findable**

---

## Code Quality & Standards
- Clean, readable, well-commented code
- Consistent naming conventions (camelCase JS, kebab-case CSS)
- Logical function organization
- No console errors in normal operation
- Graceful error handling with user-friendly messages
- **Strict mode (`'use strict'`)**
- **No global namespace pollution (IIFE or module pattern)**
- **JSDoc comments for public functions**
- **CSS organized: reset, variables, layout, components, utilities**
- **Consistent formatting (2 or 4 space indent, choose one)**
- **Feature detection over user-agent sniffing**
- **Semantic versioning for your app (`data-version` attribute)**
- **Performance budgets: <3s first load, <100ms interactions**

---

## Browser & Device Support — NEW SECTION
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari and Android Chrome mobile browsers
- Progressive enhancement: core functionality without JS where possible
- Feature detection with fallbacks
- Test on actual devices, not just emulators
- Minimum iOS 15, Android 10 (or graceful messaging for older)

---

## Testing Checklist — NEW SECTION
- Manual testing across breakpoints (375px, 768px, 1024px, 1440px)
- Keyboard-only navigation test
- Screen reader walkthrough
- Slow network simulation (3G)
- Offline mode behavior
- localStorage disabled handling
- Multi-tab conflict scenarios
- Long content/edge case text
- Rapid repeated actions (spam clicking)
- Browser back/forward button behavior

---

## Meta & Documentation — NEW SECTION
- Descriptive `<title>` tag
- Meta description for link previews
- Open Graph tags for social sharing
- Favicon at multiple sizes
- Version number accessible in UI (footer or about)
- Internal code documentation for maintainability
- README or inline guide for future developers
- Changelog for version history

---

*This template prioritizes inclusivity, resilience, and user delight. Every feature degrades gracefully. The app should feel fast, forgiving, and familiar.*