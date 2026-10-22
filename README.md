# The Beginner's Field Guide to AI Tools

A plain-English tour of everyday AI tools — chat assistants, image tools, voice tools, writing help, AI search, and study help — written the way a friend would explain it: warm, step by step, never condescending.

It is the gentle companion to *The Massive AI Manual* by Dylan Asdale ([dylanasdale.github.io](https://dylanasdale.github.io)).

## What's inside

- **docs/** — the manual itself, in Markdown. Friendly lessons (each with hands-on "Try it now" steps), a plain-English glossary, a "common mistakes" page, and a short everyday-safety chapter. No jargon gatekeeping: every term used anywhere is defined in the glossary.
- **build.js** — a dependency-free Node script that turns the Markdown into a static HTML site with navigation, per-page prev/next links, and a warm, readable style.
- **serve.js** — a tiny local preview server (also dependency-free).
- **test.js** — verification: builds to a temp dir and checks pages, nav, links, and the copyright line.

Local-first by design: no accounts, no API keys, no tracking, nothing leaves your machine.

## How to run it

```bash
npm run build   # renders docs/ into site/
npm test        # builds to a temp dir and verifies everything
npm start       # serves site/ at http://localhost:8080 (or: node serve.js)
```

Prefer no commands at all? After `npm run build`, open `site/index.html` directly in any browser — it's plain static HTML.

## Adding or editing lessons

Edit any Markdown file in `docs/`, then re-run `npm run build`. To add a new page, create its `docs/<name>.md` file and list it in the `PAGES` array at the top of `build.js`; navigation and prev/next links pick it up automatically.

## License

MIT — see [LICENSE](LICENSE). © 2026 Asdale Dynamics, LLC. Built by Dylan Asdale for beginner-friendly, local-first AI education.
