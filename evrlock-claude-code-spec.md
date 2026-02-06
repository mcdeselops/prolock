# Claude Code Execution Spec

## Summary

Implement the EVRlock microsite as a single-page React application with dual-brand theming (Rocky Mountain Steel Mills / Interpro Pipe + Steel), a conversational chat-style UI, resource shelf, performance data display, and PDF document listing.

---

## Design Reference

The complete design mockup is in `evrlock-layout.jsx` (attached alongside this spec). It is a working React component that renders the full page at pixel fidelity — use it as the source of truth for layout, spacing, colors, typography, and interaction behavior. Every hex code, font pairing, and component structure in this spec is extracted from that file.

---

## Architecture Overview

```
src/
├── components/
│   ├── Header.jsx              # Logo + skin swap + contact + resources icon
│   ├── ResourceShelf.jsx       # Slide-from-right document shelf
│   ├── ChatMessage.jsx         # User / AI message bubbles
│   ├── SuggestedPrompts.jsx    # Pill-style follow-up chips
│   ├── ChatInput.jsx           # Input bar with send button
│   ├── PerformanceDataCard.jsx # USC/Metric toggle + data grids
│   ├── DocumentCard.jsx        # PDF file list
│   └── logos/
│       ├── RockyLogo.jsx       # Inline SVG — Rocky Mountain Steel Mills
│       └── InterproLogo.jsx    # Inline SVG — Interpro Pipe + Steel
├── themes/
│   └── index.js                # Theme objects (rocky, interpro)
├── data/
│   ├── shelfData.js            # Resource shelf document list per connection
│   └── sampleChat.js           # Placeholder conversation + performance data
├── hooks/
│   └── useTheme.js             # React context for skin state
├── App.jsx                     # Root layout, theme provider
└── index.css                   # Google Fonts import, CSS reset, transitions
```

---

## Files to Create

### `src/themes/index.js`
**Action:** Create
**Changes:**
- Export the two theme objects exactly as defined in the mockup (lines 13–59 of `evrlock-layout.jsx`)
- Each theme contains: `name`, `accent`, `accentDark`, `accentDim`, `accentMid`, `bg`, `bgCard`, `bgInput`, `border`, `borderLight`, `textPrimary`, `textSecondary`, `textMuted`, `navText`, `fontDisplay`, `fontBody`, `fontMono`

**Rocky Mountain theme:**
```js
{
  name: "Rocky Mountain",
  accent: "#fcb53f",        // gold — from logo
  accentDark: "#d9982e",
  accentDim: "#fcb53f12",
  accentMid: "#fcb53f25",
  bg: "#070e17",            // deep navy
  bgCard: "#0d1926",
  bgInput: "#0a1420",
  border: "#1a3050",
  borderLight: "#1a305025",
  textPrimary: "#dce4ec",
  textSecondary: "#8b98a2",
  textMuted: "#4a6070",
  navText: "#5a7080",
  fontDisplay: "'Libre Baskerville', 'Georgia', serif",
  fontBody: "'Source Sans 3', 'Helvetica Neue', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
}
```

**Interpro theme:**
```js
{
  name: "Interpro",
  accent: "#f27f20",        // orange — from logo
  accentDark: "#d06a18",
  accentDim: "#f27f2012",
  accentMid: "#f27f2025",
  bg: "#081620",            // deep teal-navy
  bgCard: "#0f2231",
  bgInput: "#0a1a28",
  border: "#1a3a4e",
  borderLight: "#1a3a4e25",
  textPrimary: "#dce4ec",
  textSecondary: "#8b98a2",
  textMuted: "#4a6878",
  navText: "#5a7888",
  fontDisplay: "'DM Serif Display', 'Georgia', serif",
  fontBody: "'DM Sans', 'Helvetica Neue', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
}
```

### `src/hooks/useTheme.js`
**Action:** Create
**Changes:**
- React context + provider that holds `skin` state (`"rocky"` | `"interpro"`)
- Default skin: `"interpro"`
- Exports `useTheme()` hook returning `{ skin, setSkin, t }` where `t` is the active theme object
- `toggleSkin()` helper that swaps between the two

### `src/components/logos/RockyLogo.jsx`
**Action:** Create
**Changes:**
- Copy the `RockyLogo` inline SVG component verbatim from mockup (lines 64–71)
- Props: `h` (height, default 34), `textColor` (default `"#dce4ec"`), `subtitleColor` (default `"#8b98a2"`)
- Mountain icon fill: `#fcb53f` (gold), text paths fill: `#102b45` (navy)
- The full SVG `d` path data is in the mockup — copy it exactly

### `src/components/logos/InterproLogo.jsx`
**Action:** Create
**Changes:**
- Copy the `InterproLogo` inline SVG component verbatim from mockup (lines 73–112)
- Props: `h` (height, default 38), `textColor` (default `"#dce4ec"`), `subtitleColor` (default `"#8b98a2"`)
- Orange circle: `#f27f20`, bird/flame paths: `#123549` and `#fff`
- The full SVG path data is in the mockup — copy it exactly

### `src/components/Header.jsx`
**Action:** Create
**Changes:**
- Flex row: logo (left) + controls (right)
- Logo: render `RockyLogo` or `InterproLogo` based on `skin` state
- Controls (right side, row, gap 10):
  1. **Skin swap button**: bordered pill with swap icon (↔ arrows SVG) + label showing the OTHER brand name (`"INTERPRO"` when rocky is active, `"ROCKY MTN"` when interpro is active). `fontMono`, 9px, `textMuted` color, 8px border-radius, `1px solid border`
  2. **CONTACT**: plain text, `fontMono`, 11px, `navText` color
  3. **Resources icon**: 38×38px, rounded 10px, toggles `shelfOpen`. When open: `accent` bg + `×` icon. When closed: `bgCard` bg + document icon. `1px solid border`
- Max width: 900px, centered, padding 16px 40px

### `src/components/ResourceShelf.jsx`
**Action:** Create
**Changes:**
- Fixed position panel, slides from right edge
- Width: 340px
- Background: `bgCard`, left border: `1px solid border`
- Transform: `translateX(0)` when open, `translateX(100%)` when closed
- Transition: `transform 0.35s cubic-bezier(0.22,1,0.36,1)`
- Backdrop overlay: `position: fixed, inset: 0, background: #0009`, fades with shelf
- **Header row**: "RESOURCES" label (fontMono, 10px, accent, letterSpacing 2) + subtitle "All connection documents" + close button (30×30, bgColor bg, × icon)
- **Content**: grouped by connection type, each group has:
  - Connection label: fontMono, 10px, accent, letterSpacing 1, uppercase
  - Document rows: 24×24 icon box + document name (13px, textSecondary) + external link icon (auto margin-left)
  - Rows separated by `1px solid borderLight`

**Shelf data structure** (5 connection groups):
```js
[
  { connection: "QB2 Premium", docs: ["Running Procedures", "Blanking Dimensions", "Field Bulletin", "Supplementary Data", "Heavy Wall — USC", "Heavy Wall — Metric", "7in OD Change Notice"] },
  { connection: "QB2-XL Premium", docs: ["Blanking Dimensions"] },
  { connection: "QB1-HT Semi-Premium", docs: ["Running Procedures", "Blanking Dimensions", "Supplementary Data", "Field Trials", "Heavy Wall — USC", "Heavy Wall — Metric"] },
  { connection: "EB Enhanced Buttress", docs: ["Running Procedures", "Blanking Dimensions", "API BC Accessories Bulletin"] },
  { connection: "EB Gen2", docs: ["Blanking Dimensions", "PC-REP-007 Bulletin", "PC-REP-008 Bulletin"] },
]
```

### `src/components/ChatMessage.jsx`
**Action:** Create
**Changes:**
- Two variants: `role: "user"` and `role: "assistant"`
- **User message**: right-aligned, `bgCard` background, rounded 12px, padding 10px 16px, max-width 400px, 14px `textSecondary`, followed by a 30px circle avatar (👤 emoji)
- **Assistant message**: left-aligned, starts with 28×28 rounded-6 icon with gradient background (`accent` → `accentDark`), white "E" letter inside (fontDisplay, 12px, bold). Message body to the right, flex: 1.
  - Body paragraphs: 15px, `textSecondary`, line-height 1.75, fontBody, 16px margin-bottom
  - **References section** (below body): top border `1px solid border`, paddingTop 16, marginTop 24. Label: "REFERENCES" (fontMono, 10px, textMuted, letterSpacing 2). Reference pills: fontMono, 11px, textSecondary, bgCard background, rounded 20px, padding 6px 14px

### `src/components/SuggestedPrompts.jsx`
**Action:** Create
**Changes:**
- Flex row, flex-wrap, gap 8, paddingLeft 40, marginBottom 20
- Each prompt: fontMono, 11px, textSecondary, `1px solid border`, rounded 20px, padding 7px 16px, cursor pointer
- Prompts end with " →"

### `src/components/ChatInput.jsx`
**Action:** Create
**Changes:**
- Container: bgCard, rounded 12px, padding 12px 16px, flex row, gap 12, marginLeft 40, `1px solid border`
- Input: transparent bg, no border/outline, 14px, textPrimary, fontBody, flex: 1, placeholder "Ask me anything..."
- Send button: 32px circle, gradient bg (accent → accentDark), white arrow icon, cursor pointer

### `src/components/PerformanceDataCard.jsx`
**Action:** Create
**Changes:**
- Outer: bgCard, rounded 12, `1px solid border`, overflow hidden
- **Header row**: left side = numbered label (fontMono, 10px, accent) + title (15px, textPrimary, fontWeight 500, fontDisplay); right side = USC/METRIC toggle pills + divider + "Print Data Sheet" button with printer SVG icon
- **Data sections** (3 groups, separated by `1px solid borderLight`):
  1. PHYSICAL PROPERTIES — 4-column grid
  2. MECHANICAL PROPERTIES — 4-column grid
  3. MAKE-UP TORQUE — 3-column grid
- Each data cell: bg color = `bg` (page background), rounded 6px, padding 6px 8px. Label: fontMono 9px textMuted. Value: fontMono 13px textPrimary

**Sample performance data (QB2 7" P110):**
```
Physical: OD 7.000in, Wall 0.362in, ID 6.276in, Weight 26.00 lb/ft, Drift 6.151in, Coupling OD 7.656in, Coupling Len 9.500in, M/U Loss 7.09in
Mechanical: Collapse 8,600 psi, Burst 12,350 psi, Joint(UTS) 625 kip, Joint(YS) 540 kip
Torque: Optimal 8,100 ft·lb, Window(±) 700 ft·lb, Yield 12,750 ft·lb
```

### `src/components/DocumentCard.jsx`
**Action:** Create
**Changes:**
- Same outer container style as PerformanceDataCard
- Header: numbered label (accent) + title "QB2 Technical Documents" (fontDisplay)
- Document rows: flex row, space-between. Left = 28×28 rounded-6 "PDF" badge (bg, fontMono 8px, accent color) + document name (13px, textSecondary, fontBody). Right = file size (fontMono, 10px, textMuted)
- 5 documents, separated by `1px solid borderLight`

### `src/App.jsx`
**Action:** Create
**Changes:**
- ThemeProvider wrapper
- Main layout div: `minHeight: 100vh`, `background: t.bg`, `fontFamily: t.fontBody`, `position: relative`, `transition: all 0.5s ease`
- **Decorative vertical lines**: fixed div at left: 40px, 120px wide, 6 vertical gradient lines at offsets [0, 20, 44, 60, 85, 105], each 1px wide, color = `textSecondary` with gradient fade top/bottom, opacity 0.04, pointerEvents none, z-index 0. These lines transition color with theme
- **Component stack** (max-width 760px, centered, z-index 1):
  1. `<Header />`
  2. User `<ChatMessage role="user" />`
  3. AI `<ChatMessage role="assistant" />`
  4. `<SuggestedPrompts />`
  5. `<ChatInput />`
  6. Section label: "Referenced Performance Data" (fontMono, 10px, textMuted, uppercase, letterSpacing 2)
  7. `<PerformanceDataCard />`
  8. `<DocumentCard />`
- `<ResourceShelf />` (fixed overlay, z-index 100)

### `src/index.css`
**Action:** Create
**Changes:**
- Google Fonts import: Libre Baskerville (400, 700), Source Sans 3 (400, 600), DM Serif Display, DM Sans (400, 500), JetBrains Mono (400, 500)
- CSS reset (box-sizing border-box, margin 0, etc.)
- Global transition on `background`, `color`, `border-color`: `0.5s ease` — this enables smooth skin swaps
- Scrollbar styling for dark theme

---

## Implementation Details

### Skin Swap Behavior
- State: `const [skin, setSkin] = useState("interpro")`
- All themed elements use `transition: all 0.5s ease` — background, color, border-color all animate smoothly when skin toggles
- The Google Fonts link must load ALL fonts for both skins upfront (Libre Baskerville + Source Sans 3 for Rocky; DM Serif Display + DM Sans for Interpro; JetBrains Mono shared)
- Logo SVGs swap instantly (no crossfade needed — the mount/unmount is fine)
- Swap button label dynamically shows the OTHER brand's name

### Decorative Lines (Left Edge)
- 6 vertical lines, fixed position, left: 40px
- Each line: 1px wide, uses `linear-gradient(180deg, transparent 0%, textSecondary N%, textSecondary M%, transparent 100%)` where N and M vary per line to stagger the gradient
- Container opacity: 0.04
- These transition their color with the theme change

### Resource Shelf Overlay
- Backdrop: `position: fixed, inset: 0, background: #000000 opacity 0.6`, fades in/out with `opacity 0.3s ease`
- Shelf panel: `position: fixed, top: 0, right: 0, bottom: 0, width: 340px`
- Clicking backdrop closes shelf
- Close button in shelf header also closes shelf
- Shelf has `overflowY: auto` for scrolling when content overflows

### Font Loading Strategy
Use a single `<link>` tag in `index.html` (or `<style>` import):
```
https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600&family=DM+Serif+Display&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap
```

### Data Source
Performance data in the mockup is hardcoded sample data for QB2 7" P110. The real data lives in Excel files:
- `Updated_Evrlock_Perf_Data.xlsx` (5 sheets — one per connection type)
- Individual files: `Evrlock_Perf_Data_QB2.xlsx`, `Evrlock_Perf_Data_QB2XL.xlsx`, `Evrlock_Perf_Data_QB1HT.xlsx`, `Evrlock_Perf_Data_EB.xlsx`

For this implementation, hardcode the sample data shown in the mockup. The data integration will be a separate task.

### PDF Documents
The project directory contains ~20 PDF files. For now, hardcode the 5 documents shown in the mockup with placeholder file sizes. Future integration will wire these to actual download URLs.

---

## Validation

After making changes:
1. Run `npm run dev` — page renders without errors
2. Default skin is Interpro (orange accent, teal-navy backgrounds, DM Sans + DM Serif Display fonts)
3. Click skin swap button → smoothly transitions to Rocky Mountain (gold accent, navy backgrounds, Source Sans 3 + Libre Baskerville fonts)
4. Logo changes from Interpro to Rocky Mountain on swap
5. Swap button label changes from "ROCKY MTN" to "INTERPRO" accordingly
6. All text, backgrounds, borders, and accents animate with 0.5s ease transition
7. Resources shelf opens from right with 0.35s slide animation
8. Backdrop overlay appears behind shelf, clicking it closes shelf
9. Decorative vertical lines visible on left edge at low opacity
10. Performance data card shows Physical / Mechanical / Torque grids
11. USC/METRIC toggle is visible (can be static for now — USC active)
12. Print Data Sheet button visible with printer icon
13. Document card lists 5 PDFs with file sizes
14. Suggested prompt pills render below the AI response
15. Input bar renders with placeholder text and gradient send button
16. Layout is centered at max-width 760px (main content) / 900px (header)
17. All fonts load correctly from Google Fonts (check: Libre Baskerville renders for Rocky display titles, DM Serif Display for Interpro display titles)

---

## Git

```
git add .
git commit -m "feat: implement EVRlock dual-brand microsite with skin swap"
git push
```

---

## Notes for Claude Code

- **The mockup file is the source of truth.** If this spec and the mockup disagree on any visual detail (spacing, color, radius, etc.), follow the mockup. The file is `evrlock-layout.jsx` — it's a single working React component with all styles inline.
- The inline SVG logos contain complex path data (the Rocky Mountain mountain icon has ~15 polygon/path elements, the Interpro bird has ~8). Copy the full SVG markup verbatim from the mockup — do not simplify or regenerate the paths.
- All styling in the mockup uses inline `style={}` objects. You may convert these to CSS modules, Tailwind, styled-components, or whatever the project's existing styling approach is — as long as the visual output matches.
- The `transition: "all 0.5s ease"` on themed elements is critical to the skin swap feel. Every element that uses a theme color needs this transition.
- The chat interface is currently static/presentational (no AI backend). The input bar, messages, and prompts are all hardcoded UI. Future task will wire to an API.
- Both brand sites (rockymountainsteelmills.com and interprosteel.com) are Wix-based. This microsite is NOT built on Wix — it's a standalone React app.
- Parent company is Orion Steel (both Rocky Mountain and Interpro are subsidiaries). This context is FYI only — don't add Orion branding.
- The performance data sample values in the mockup are real engineering values extracted from the Excel files. Don't change them.
