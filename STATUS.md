# STATUS — The Beginner's Field Guide to AI Tools

**Date:** 2026-10-22 · **Owner:** Asdale Dynamics, LLC (Dylan Asdale)

## What was built

A beginner-friendly, plain-English manual for everyday AI tools, published as a
local-first, dependency-free static site:

- **docs/** — 10 Markdown lessons in a warm, never-condescending voice:
  - `index.md` — welcome/how-to-read (table of contents)
  - `chat-assistants.md`, `image-tools.md`, `voice-tools.md`, `writing-tools.md`,
    `search-tools.md`, `study-help.md` — a lesson per tool type, each with
    hands-on "Try it now" steps (phone built-ins + free tiers, no signup required
    to follow along)
  - `everyday-safety.md` — privacy, hallucination-checking, scam-spotting
  - `common-mistakes.md` — 10 first-month tripwires with quick fixes
  - `glossary.md` — every term used anywhere in the book, in plain English
    (zero jargon gatekeeping: nothing is used before it's defined)
- **build.js** — zero-dependency Node markdown→HTML builder: hand-written parser
  (headings, paragraphs, inline code/bold/italic/links, ordered & unordered
  lists with nested prompt blockquotes, blockquotes, fenced code, pipe tables,
  horizontal rules), sticky nav across all pages, prev/next pager, footer credit
  to Asdale Dynamics, LLC. Output → `site/`.
- **serve.js** — tiny dependency-free local preview server (port 8080, path-traversal safe).
- **test.js** — 256 automated checks (fresh build to a temp dir).
- **LICENSE** — MIT, © 2026 Asdale Dynamics, LLC. **README.md** credits
  Asdale Dynamics, LLC. **package.json** with `build` / `test` / `start` scripts.

## How to run it

```bash
npm run build   # renders docs/ into site/
npm test        # runs the verification suite
npm start       # serves site/ at http://localhost:8080
```

Or after building, open `site/index.html` directly in a browser — fully static,
works offline, no accounts, no keys, no tracking.

## Verification results

- `npm run build` — clean; 10 pages rendered.
- `npm test` — **256/256 checks passed**, including:
  - every page built, styled, and navigable from the shared nav
  - every internal link in every page resolves to a real generated file
  - every lesson page contains its "Try it now" section
  - footer contains the exact credit line `Copyright (c) 2026 Asdale Dynamics, LLC`
  - LICENSE contains the exact line `Copyright (c) 2026 Asdale Dynamics, LLC`
  - README credits Asdale Dynamics, LLC
  - markdown unit tests (bold, italic, inline code, links, lists, ordered lists,
    blockquotes, tables, code fences) all render correctly
  - no unresolved template placeholders, no unrendered code fences
- `node serve.js` — verified live: `index` and lesson pages return HTTP 200,
  unknown paths return 404.
- Manually spot-checked rendered HTML for the trickiest structures (numbered
  try-it-now steps with embedded prompt blockquotes; the search-tools table).

## Known gaps

- **Site section autofrom-docs:** the build's page list is explicit in
  `build.js` (`PAGES`). Adding a new lesson requires adding one line there.
  Documented in the README.
- **No RSS/search box:** fine for a short field guide; a client-side content
  search could be a future add.
- **No images:** all pages are text-first by design; icons/screenshots could be
  added later under the same build (they'd just need a `docs/` copy step).
- **Markdown subset:** the hand-written parser covers the syntax these lessons
  use, not the full CommonMark spec (e.g., no multi-line paragraphs inside
  blockquotes).
- **Naming conventions turn over:** tool names and free tiers (ChatGPT, Gemini,
  Otter, Perplexity, etc.) were written as of Oct 2026 and may change; the
  lessons are written so the *moves* stay valid even if logos shift.
