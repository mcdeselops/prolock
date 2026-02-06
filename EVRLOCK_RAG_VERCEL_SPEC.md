# Claude Code Execution Spec

## Summary

Build and deploy an EVRlock OCTG connections RAG (Retrieval-Augmented Generation) web app on Vercel using Next.js. The app provides a chat interface for querying technical documentation about EVRlock EB, QB2, and QB1-HT premium OCTG connections. It uses BM25 search over a pre-built knowledge base (88 text chunks from 23 PDFs + 5 Excel files) and sends retrieved context to the Anthropic Claude API for answer generation.

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Next.js App (Vercel)               │
│                                     │
│  ┌──────────┐   ┌────────────────┐  │
│  │ React UI │──▶│ /api/chat      │  │
│  │ (Chat)   │◀──│ (Route Handler)│  │
│  └──────────┘   └───────┬────────┘  │
│                         │           │
│  ┌──────────────────────▼────────┐  │
│  │ lib/knowledge-base.ts         │  │
│  │ (88 chunks, BM25 search)     │  │
│  └──────────────────────┬────────┘  │
│                         │           │
│                         ▼           │
│               Anthropic Claude API  │
└─────────────────────────────────────┘
```

**Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Vercel deployment
**API:** Anthropic Claude Sonnet (`claude-sonnet-4-20250514`) via `@anthropic-ai/sdk`

---

## Files to Create

### `package.json`
**Action:** Create
**Changes:**
```json
{
  "name": "evrlock-rag",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "react-markdown": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

### `next.config.js`
**Action:** Create
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
};
module.exports = nextConfig;
```

---

### `tsconfig.json`
**Action:** Create
**Changes:** Standard Next.js TypeScript config with `@/` path alias mapped to `./src/`.

---

### `tailwind.config.ts`
**Action:** Create
**Changes:**
- Content paths: `./src/**/*.{ts,tsx}`
- Extend theme with custom colors:
  - `navy`: `{ 900: '#0a0e14', 800: '#111820', 700: '#1a2332' }`
  - `steel`: `{ 100: '#e2e8f0', 200: '#c8d0db', 400: '#94a3b8', 600: '#64748b', 800: '#475569' }`
- Add custom fonts: `sans: ['DM Sans', ...defaults]`, `mono: ['JetBrains Mono', ...defaults]`

---

### `postcss.config.js`
**Action:** Create (standard Tailwind PostCSS config)

---

### `.env.local`
**Action:** Create
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```
> **User must fill in their real Anthropic API key here.**

---

### `.env.example`
**Action:** Create
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

### `.gitignore`
**Action:** Create
**Changes:** Standard Next.js `.gitignore` — include `.env.local`, `node_modules/`, `.next/`, `out/`.

---

### `src/app/layout.tsx`
**Action:** Create
**Changes:**
- Import Google Fonts: DM Sans (400, 500, 600, 700) and JetBrains Mono (400, 500)
- Set metadata: title = "EVRlock Knowledge Base", description = "RAG-powered technical assistant for EVRlock OCTG connections"
- Dark background body: `bg-navy-900 text-steel-200`
- Include `<link>` for Google Fonts or use `next/font/google`

---

### `src/app/globals.css`
**Action:** Create
**Changes:**
- Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
- Custom scrollbar styles (thin, dark themed)
- Pulse animation keyframes for loading dots
- Custom utility class `.glass` for `backdrop-filter: blur(12px); background: rgba(10,14,20,0.8)`

---

### `src/app/page.tsx`
**Action:** Create
**Changes:**
- This is a thin wrapper: renders `<ChatInterface />` full-viewport
- `"use client"` directive at top

---

### `src/lib/knowledge-base.ts`
**Action:** Create
**This is the critical data file.** Contains:

1. **The knowledge base array** — 88 chunk objects, each with this shape:
```typescript
interface KBChunk {
  id: string;        // e.g. "4b98ed_1a0cdcdb...pdf_p1"
  source: string;    // original filename
  title: string;     // extracted document title
  page: number | string; // page number or "Sheet: EB Gen2"
  type: "document" | "spreadsheet";
  content: string;   // the actual text content
  doc_name: string;  // human-readable document name
}
```

2. **The full JSON data** — Embed the entire contents of the attached `knowledge_base.json` file (88 objects, ~160KB). This file will be provided alongside this spec.

3. **Exported constant:**
```typescript
export const KNOWLEDGE_BASE: KBChunk[] = [ /* ...88 chunks... */ ];
```

---

### `src/lib/bm25.ts`
**Action:** Create
**Changes:** BM25 search engine implementation:

```typescript
// Stop words set
const STOP_WORDS = new Set(["the","a","an","and","or","but","in","on","at","to","for",
  "of","with","by","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "it","its","this","that","these","those","i","you","he","she","we","they","me",
  "him","her","us","them","my","your","his","our","their","what","which","who",
  "whom","when","where","how","not","no","nor","if","then","than","so","as",
  "from","up","about","into"]);

// tokenize(text: string): string[]
//   - lowercase, replace non-alphanumeric (keep . and -) with spaces
//   - split on whitespace, filter tokens length > 1, remove stop words

// interface BM25Index { df: Record<string,number>; docTokens: {tf: Record<string,number>; len: number}[]; N: number; }

// buildIndex(docs: KBChunk[]): BM25Index
//   - Tokenize each doc's content + doc_name + title
//   - Compute term frequencies per doc and document frequencies across corpus

// bm25Search(query: string, index: BM25Index, docs: KBChunk[], k?: number): (KBChunk & {score: number})[]
//   - BM25 parameters: k1=1.5, b=0.75
//   - Returns top k results (default 10) sorted by score descending
//   - IDF formula: log((N - df + 0.5) / (df + 0.5) + 1)
```

Export: `buildIndex`, `bm25Search`, `KBChunk` type.

---

### `src/app/api/chat/route.ts`
**Action:** Create
**Changes:** Next.js Route Handler (POST):

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";
import { buildIndex, bm25Search } from "@/lib/bm25";

// Build index once at module level (cached across requests in serverless)
const index = buildIndex(KNOWLEDGE_BASE);

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert technical assistant for EVRlock premium OCTG (Oil Country Tubular Goods) connections by EVRAZ North America. You answer questions based ONLY on the provided knowledge base context.

Key products include:
- EVRlock EB (and EB Gen2) - premium connection
- EVRlock QB2 - semi-premium connection
- EVRlock QB1-HT - high torque connection

When answering:
- Be specific and cite which document/source the information comes from
- If the context doesn't contain enough info, say so clearly
- Use technical terminology appropriate for oilfield engineers
- Format data tables clearly when presenting numerical specs
- Be concise but thorough`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // 1. BM25 search for relevant chunks
    const results = bm25Search(message, index, KNOWLEDGE_BASE, 10);

    // 2. Build context string
    const context = results.map((r, i) =>
      `[Source ${i + 1}: ${r.doc_name} | Page ${r.page}]\n${r.content}`
    ).join("\n\n---\n\n");

    // 3. Build messages array (include last 4 turns of history for continuity)
    const messages = [];
    if (history && history.length > 0) {
      const recent = history.slice(-8); // last 4 pairs
      messages.push(...recent);
    }
    messages.push({
      role: "user" as const,
      content: `KNOWLEDGE BASE CONTEXT:\n${context}\n\n---\n\nUSER QUESTION: ${message}\n\nAnswer based on the context above. Reference specific sources when possible.`,
    });

    // 4. Call Claude API
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const answer = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // 5. Return answer + sources
    return Response.json({
      answer,
      sources: results.map((r) => ({
        name: r.doc_name,
        page: r.page,
        score: Math.round(r.score * 100) / 100,
        snippet: r.content.substring(0, 150) + "...",
      })),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### `src/components/ChatInterface.tsx`
**Action:** Create
**Changes:** Main chat UI component (`"use client"`):

**State:**
- `messages: { role: "user"|"assistant"; content: string; sources?: Source[] }[]`
- `input: string`
- `loading: boolean`
- `showSidebar: boolean`
- `expandedSources: number | null` (index of message whose sources are expanded)

**Layout (3 sections):**

1. **Header bar** (fixed top):
   - Left: Blue gradient logo "EV" + "EVRlock Knowledge Base" title + subtitle "88 chunks • 20 documents • RAG-powered" in mono font
   - Right: "📄 Sources" toggle button for sidebar

2. **Chat area** (scrollable middle):
   - Empty state: centered icon + "EVRlock Technical Assistant" heading + description + 4 clickable suggestion chips:
     - "What are the EVRlock QB2 running procedures?"
     - "Show me EB performance data for 7\" casing"
     - "What torque values for QB1-HT?"
     - "Heavy wall vs light wall compatibility?"
   - Messages: user messages right-aligned (blue gradient bg, rounded), assistant messages left-aligned (dark bg with border)
   - After each assistant message: collapsible "📎 N sources ▸" button that expands to show source cards (name, page, score, snippet)
   - Loading state: 3 pulsing dots animation

3. **Input bar** (fixed bottom):
   - Textarea with auto-resize (max 120px), placeholder "Ask about EVRlock connections..."
   - Send button (blue gradient arrow, disabled when empty/loading)
   - Footer text: "BM25 retrieval → Claude Sonnet → 88 indexed chunks"

4. **Sidebar** (conditional, right side, 300px):
   - Lists all 20 indexed documents with name, type icon (📄/📊), and chunk count
   - Scrollable, dark background

**API call pattern:**
```typescript
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: input,
    history: messages.map(m => ({ role: m.role, content: m.content })),
  }),
});
const data = await res.json();
// append assistant message with data.answer and data.sources
```

**Keyboard:** Enter sends (without Shift), Shift+Enter for newline.

**Design theme (IMPORTANT — follow this precisely):**
- Background: `#0a0e14` → `#111820` vertical gradient
- Subtle grid overlay: blue lines at 40px spacing, 3% opacity
- User bubbles: `linear-gradient(135deg, #1e40af, #2563eb)`, rounded `14px 14px 4px 14px`
- Assistant bubbles: `rgba(255,255,255,0.04)` with `1px solid rgba(255,255,255,0.06)`, rounded `14px 14px 14px 4px`
- Accent color: `#3b82f6` (blue-500), highlights: `#60a5fa`, `#93c5fd`
- Text: primary `#e2e8f0`, secondary `#94a3b8`, muted `#64748b`, dim `#475569`
- Fonts: DM Sans for body, JetBrains Mono for metadata/technical info
- Header/input bars: glassmorphism with `backdrop-filter: blur(12px)`
- All interactive elements: `transition: all 0.2s` hover states

---

### `src/components/MarkdownRenderer.tsx`
**Action:** Create
**Changes:**
- Light wrapper around `react-markdown` for rendering assistant responses
- Style code blocks with JetBrains Mono, dark bg
- Style tables with borders and alternating row colors
- Style bold, links, lists appropriately for dark theme

---

### `data/knowledge_base.json`
**Action:** Create
**Changes:** Place the full 88-chunk knowledge base JSON here as a standalone file (for reference/rebuilding). The actual runtime data is embedded in `src/lib/knowledge-base.ts`.

> **IMPORTANT:** This file is provided as an attachment alongside this spec. Copy its contents verbatim into `src/lib/knowledge-base.ts` as the exported array.

---

### `README.md`
**Action:** Create
**Changes:**
```markdown
# EVRlock RAG Knowledge Base

AI-powered technical assistant for EVRlock OCTG (Oil Country Tubular Goods)
connections by EVRAZ North America.

## Features

- **BM25 Search** over 88 pre-indexed text chunks from 23 PDFs + 5 Excel files
- **Claude Sonnet** generates answers grounded in retrieved context
- **Source Attribution** — every answer shows which documents were used
- **Products Covered:** EVRlock EB, EB Gen2, QB2, QB1-HT connections

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Create `.env.local` with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```
4. Run dev server: `npm run dev`
5. Open http://localhost:3000

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel project settings
4. Deploy

## Knowledge Base

The knowledge base contains technical documentation for:
- Running procedures (EB, EB Gen2, QB2, QB1-HT)
- Performance data (collapse, burst, tensile ratings)
- Coupling dimensions and specifications
- ISO/PAS 12835 TWCCEP qualification reports
- Thermal compression testing results
- Technical bulletins (heavy/light wall compatibility, making-up accessories)
- Field bulletins and memoranda
- ENADATE performance sheets

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API (@anthropic-ai/sdk)
- BM25 text search (custom implementation, no external deps)
```

---

## Implementation Details

### Knowledge Base Content Summary

The 88 chunks cover these document categories:

| Category | Documents | Chunks | Products |
|----------|-----------|--------|----------|
| Running Procedures | 4 docs | ~30 | EB, EB Gen2, QB2, QB1-HT |
| Performance Data | 5 Excel files | ~25 | EB, QB2, QB1-HT, QB2XL |
| Coupling Dimensions | 5 docs | ~5 | EB Gen2, QB2 |
| Technical Bulletins | 4 docs | ~8 | EB, EB Gen2, QB2, QB1-HT |
| Qualification/Testing | 2 docs | ~12 | QB2 (TWCCEP, thermal) |
| Field Bulletins/Memos | 3 docs | ~4 | QB2 |
| ENADATE Sheets | 2 docs | ~2 | L80 HC, P110 EB |
| Other (contacts, etc.) | 1 doc | ~2 | — |

### BM25 Parameters
- **k1:** 1.5 (term frequency saturation)
- **b:** 0.75 (document length normalization)
- **Top-k results:** 10 chunks sent as context to Claude
- **Tokenization:** lowercase, alphanumeric + dots/hyphens, stop word removal

### Claude API Configuration
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 1500
- **System prompt:** Constrains answers to knowledge base context only, instructs source citation
- **History:** Last 4 conversation turns included for continuity

### Vercel-Specific Notes
- The `/api/chat` route handler runs as a Vercel Serverless Function
- The BM25 index is built at module-level and cached across warm invocations
- Knowledge base is embedded in source code (~160KB) — well within serverless bundle limits
- No database needed — everything is self-contained
- Set `ANTHROPIC_API_KEY` in Vercel project environment variables (Settings → Environment Variables)
- Default region is fine; consider `iad1` (US East) for lower latency to Anthropic API
- The function may need up to 10s for cold starts + Claude API response; Vercel's default 10s timeout for Hobby plan may need to be increased to 30s on Pro plan, OR implement streaming (see Enhancement below)

---

## Validation

After making changes:

1. `npm install` completes without errors
2. `npm run build` succeeds with no TypeScript errors
3. `npm run dev` starts and page loads at `http://localhost:3000`
4. Chat interface renders with empty state (suggestion chips visible)
5. Clicking a suggestion chip populates the input field
6. Sending a message shows loading animation, then returns an answer with sources
7. "📄 Sources" button toggles the sidebar with 20 document entries
8. Source attribution button on assistant messages expands/collapses correctly
9. Conversation history works across multiple turns
10. `vercel` CLI or GitHub push deploys successfully
11. Deployed URL loads and chat works end-to-end

---

## Git

```bash
git init
git add .
git commit -m "feat: EVRlock RAG knowledge base app with BM25 search and Claude API"
git remote add origin <your-github-repo-url>
git push -u origin main
```

Then in Vercel:
```
1. Import Git Repository
2. Framework Preset: Next.js (auto-detected)
3. Environment Variable: ANTHROPIC_API_KEY = sk-ant-xxxxx
4. Deploy
```

---

## Notes for Claude Code

1. **The knowledge base JSON file (`knowledge_base.json`) is provided as a separate attachment.** When creating `src/lib/knowledge-base.ts`, import or embed its full contents as the `KNOWLEDGE_BASE` array. Do NOT truncate or summarize the data — all 88 chunks must be present.

2. **No external search/vector DB dependencies.** The BM25 search runs entirely in-process. This keeps the deployment simple and free-tier compatible.

3. **The API key is server-side only.** The Anthropic API call happens in the Route Handler (`/api/chat/route.ts`), never in client code. The `ANTHROPIC_API_KEY` env var is only accessed server-side.

4. **Tailwind dark theme.** There is no light mode. The entire UI is dark. Do NOT add a theme toggle. The color palette is industrial/technical — navy backgrounds, steel grays, blue accents.

5. **Google Fonts.** Import DM Sans and JetBrains Mono via `next/font/google` (preferred) or `<link>` tag. Both must be available.

6. **No authentication.** This is an internal tool. No login, no user accounts, no rate limiting on the frontend (Anthropic API key rate limits apply naturally).

7. **Vercel Hobby plan timeout.** If the 10s function timeout is hit, the simplest fix is to reduce `max_tokens` to 1000 or switch to streaming. For a production enhancement, implement SSE streaming from the Route Handler using `client.messages.stream()` and `ReadableStream` on the response.

8. **File size.** The `knowledge-base.ts` file will be ~160KB. This is fine for Next.js bundling — it's static data that gets tree-shaken to server-only code since it's only imported in the Route Handler.

---

## Optional Enhancements (Future)

These are NOT part of the initial build. Document them in the README under a "Future" section:

- **Streaming responses** — Use Anthropic streaming API + SSE for real-time token display
- **Markdown rendering** — Render Claude responses with proper markdown formatting
- **Search preview** — Show BM25 search results before sending to Claude (for debugging)
- **Admin page** — Upload new PDFs to rebuild the knowledge base
- **Analytics** — Track most-asked questions and least-covered topics
