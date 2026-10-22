#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname)
const DOCS_DIR = path.join(ROOT, 'docs')
const OUT_DIR = process.env.OUT_DIR
  ? path.resolve(process.env.OUT_DIR)
  : path.join(ROOT, 'site')

const PAGES = [
  { src: 'index.md', nav: 'Home' },
  { src: 'chat-assistants.md', nav: 'Chat assistants' },
  { src: 'image-tools.md', nav: 'Image tools' },
  { src: 'voice-tools.md', nav: 'Voice tools' },
  { src: 'writing-tools.md', nav: 'Writing tools' },
  { src: 'search-tools.md', nav: 'Search tools' },
  { src: 'study-help.md', nav: 'Study help' },
  { src: 'everyday-safety.md', nav: 'Everyday safety' },
  { src: 'common-mistakes.md', nav: 'Common mistakes' },
  { src: 'glossary.md', nav: 'Glossary' }
]

const SITE_TITLE = "The Beginner's Field Guide to AI Tools"
const SITE_SUB = 'A plain-English companion to The Massive AI Manual'

function escapeHtml (s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeUrl (s) {
  return s.replace(/ /g, '%20')
}

function inline (text) {
  let s = escapeHtml(text)
  const codes = []
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push('<code>' + c + '</code>')
    return '\u0000CODE' + (codes.length - 1) + '\u0000'
  })

  const links = []
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    links.push('<a href="' + safeUrl(href) + '">' + label + '</a>')
    return '\u0000LINK' + (links.length - 1) + '\u0000'
  })

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*($|[^*\w])/g, '$1<em>$2</em>$3')

  s = s.replace(/\u0000LINK(\d+)\u0000/g, (_, i) => links[Number(i)])
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => codes[Number(i)])
  return s
}

function isBlank (line) {
  return /^\s*$/.test(line)
}

function itemMarker (line) {
  const m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/)
  if (!m) return null
  return { indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] }
}

function parseList (lines, i, out) {
  let ordered = false
  let whileOpen = true
  const items = []
  let current = null

  while (i < lines.length) {
    const line = lines[i]
    if (isBlank(line) && whileOpen) {
      let j = i + 1
      while (j < lines.length && isBlank(lines[j])) j++
      const next = lines[j]
      if (next !== undefined && (itemMarker(next) !== null || /^\s+\S/.test(next))) {
        i = j
        continue
      }
      break
    }

    const marker = itemMarker(line)
    if (marker !== null) {
      if (current !== null && marker.ordered !== ordered) {
        break
      }
      whileOpen = true
      ordered = marker.ordered
      current = { html: [inline(marker.text)] }
      items.push(current)
      i++
      continue
    }

    if (current !== null && /^\s+\S/.test(line)) {
      const trimmed = line.trim()
      if (trimmed.startsWith('>')) {
        current.html.push('<blockquote><p>' + inline(trimmed.replace(/^>\s?/, '')) + '</p></blockquote>')
      } else {
        current.html.push('<p>' + inline(trimmed) + '</p>')
      }
      i++
      continue
    }

    break
  }

  if (items.length === 0) return i
  const tag = ordered ? 'ol' : 'ul'
  out.push('<' + tag + '>' + items.map(it => '<li>' + it.html.join('') + '</li>').join('') + '</' + tag + '>')
  // The blank line used to peek ahead has been passed already.
  return i
}

function parseTable (lines, i, out) {
  const rows = []
  let header = null
  while (i < lines.length) {
    const line = lines[i]
    if (!line.includes('|')) break
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    if (cells.every(c => /^:?-{3,}:?$/.test(c)) && header !== null) {
      i++
      continue
    }
    if (header === null) {
      header = cells
    } else {
      rows.push(cells)
    }
    i++
  }
  if (header === null) return i
  const tr = cells => '<tr>' + cells.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>'
  out.push(
    '<table><thead><tr>' +
    header.map(c => '<th>' + inline(c) + '</th>').join('') +
    '</tr></thead><tbody>' + rows.map(tr).join('') + '</tbody></table>'
  )
  return i
}

function mdToHtml (md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  let title = null
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (title === null && /^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, '').trim()
      out.push('<h1>' + inline(title) + '</h1>')
      i++
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      out.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>')
      i++
      continue
    }

    if (/^```/.test(line)) {
      i++
      const code = []
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i])
        i++
      }
      i++
      out.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>')
      continue
    }

    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
      out.push('<hr>')
      i++
      continue
    }

    if (/^>(\s|$)/.test(line)) {
      const quote = []
      while (i < lines.length && /^>(\s|$)/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push('<blockquote><p>' + inline(quote.join(' ')) + '</p></blockquote>')
      continue
    }

    if (itemMarker(line) !== null) {
      i = parseList(lines, i, out)
      continue
    }

    if (line.includes('|') && lines[i + 1] !== undefined && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      i = parseTable(lines, i, out)
      continue
    }

    if (isBlank(line)) {
      i++
      continue
    }

    const para = []
    while (i < lines.length && !isBlank(lines[i])) {
      para.push(lines[i].trim())
      i++
    }
    out.push('<p>' + inline(para.join(' ')) + '</p>')
  }

  return { title, html: out.join('\n') }
}

function getPage (name) {
  return PAGES.find(p => p.src === name)
}

function navFor (current) {
  return PAGES.map(p => {
    const href = p.src.replace(/\.md$/, '.html')
    const label = p.nav
    if (p.src === current) {
      return '<span class="nav-here" aria-current="page">' + label + '</span>'
    }
    return '<a href="' + href + '">' + label + '</a>'
  }).join(' ')
}

function template (title, navName, content, prev, next) {
  const nav = navFor(navName)
  const prevNext = [
    prev ? '<a class="pager pager-prev" href="' + prev.href + '">&larr; ' + prev.label + '</a>' : '<span class="pager pager-prev"></span>',
    next ? '<a class="pager pager-next" href="' + next.href + '">' + next.label + ' &rarr;</a>' : '<span class="pager pager-next"></span>'
  ].join('\n    ')

  return '<!DOCTYPE html>\n' +
`<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} &#183; ${SITE_TITLE}</title>
<link rel="stylesheet" href="styles.css">
<link rel="icon" href="data:,">
</head>
<body>
<header class="site-header">
  <a class="site-title" href="index.html">${SITE_TITLE}</a>
  <p class="site-sub">${SITE_SUB}</p>
</header>
<nav class="site-nav" aria-label="Lessons">
  ${nav}
</nav>
<main class="content">
${content}
</main>
<footer class="site-footer">
  <div class="pager-row">
    ${prevNext}
  </div>
  <p class="credit">
    Companion to <a href="https://dylanasdale.github.io">The Massive AI Manual</a> &#183;
    Copyright (c) 2026 Asdale Dynamics, LLC &#183;
    Local-first: no accounts, no keys, no tracking.
  </p>
</footer>
</body>
</html>
`
}

function build () {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const built = new Map()
  for (const page of PAGES) {
    const srcPath = path.join(DOCS_DIR, page.src)
    if (!fs.existsSync(srcPath)) {
      throw new Error('Missing doc page: docs/' + page.src)
    }
    const { title, html } = mdToHtml(fs.readFileSync(srcPath, 'utf8'))
    const name = page.src.replace(/\.md$/, '')
    built.set(name, { nav: page.nav, title: title || page.nav, html })
  }

  fs.writeFileSync(path.join(OUT_DIR, 'styles.css'), CSS)

  const names = PAGES.map(p => p.src.replace(/\.md$/, ''))
  for (let index = 0; index < names.length; index++) {
    const name = names[index]
    const page = built.get(name)
    const content = page.html
    const prevP = index > 0
      ? { href: names[index - 1] + '.html', label: built.get(names[index - 1]).title }
      : null
    const nextP = index < names.length - 1
      ? { href: names[index + 1] + '.html', label: built.get(names[index + 1]).title }
      : null

    const full = template(page.title, name, content, prevP, nextP)
    fs.writeFileSync(path.join(OUT_DIR, name + '.html'), full)
  }

  return { outDir: OUT_DIR, pages: built.size }
}

const CSS = `
:root {
  --paper: #faf6f0;
  --ink: #33302c;
  --soft: #6b6256;
  --accent: #b3541e;
  --accent-dark: #8a3f14;
  --card: #ffffff;
  --line: #e6ddcf;
  --code-bg: #f1e9dd;
}
* { box-sizing: border-box; }
html { font-size: 100%; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
  line-height: 1.7;
}
.site-header {
  padding: 2rem 1rem 0.5rem;
  text-align: center;
}
.site-title {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--accent-dark);
  text-decoration: none;
  letter-spacing: 0.02em;
}
.site-sub {
  margin: 0.3rem 0 0;
  color: var(--soft);
  font-style: italic;
  font-size: 0.95rem;
}
.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.9rem;
  justify-content: center;
  padding: 0.75rem 1rem 1rem;
  margin: 1rem auto 0;
  max-width: 52rem;
  border-bottom: 1px solid var(--line);
}
.site-nav a, .site-nav .nav-here {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 0.85rem;
  text-decoration: none;
  color: var(--accent);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}
.site-nav a:hover { color: var(--accent-dark); text-decoration: underline; }
.site-nav .nav-here {
  color: var(--accent-dark);
  background: var(--code-bg);
  font-weight: 600;
}
.content {
  max-width: 46rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 1rem;
  font-size: 1.08rem;
}
.content h1 { font-size: 2rem; line-height: 1.25; margin: 0 0 1rem; color: var(--ink); }
.content h2 { font-size: 1.4rem; margin: 2.2rem 0 0.6rem; color: var(--accent-dark); }
.content h3 { font-size: 1.1rem; margin: 1.6rem 0 0.4rem; }
.content p, .content li { overflow-wrap: break-word; }
.content a { color: var(--accent); }
.content a:hover { color: var(--accent-dark); }
.content blockquote {
  margin: 1.2rem 0;
  padding: 0.7rem 1rem;
  background: var(--card);
  border-left: 4px solid var(--accent);
  border-radius: 0 6px 6px 0;
  font-style: italic;
  color: var(--ink);
}
.content blockquote p { margin: 0; }
.content code {
  background: var(--code-bg);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.88em;
}
.content pre {
  background: var(--code-bg);
  padding: 0.9rem 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
.content pre code { background: none; padding: 0; }
.content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2rem 0;
  font-size: 0.95rem;
  background: var(--card);
}
.content th, .content td {
  border: 1px solid var(--line);
  padding: 0.5rem 0.7rem;
  text-align: left;
  vertical-align: top;
}
.content th { background: var(--code-bg); }
.content hr {
  border: none;
  border-top: 1px solid var(--line);
  margin: 2rem 0;
}
.site-footer {
  max-width: 52rem;
  margin: 0 auto;
  padding: 0 1.25rem 2rem;
}
.pager-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 0.9rem;
}
.pager { text-decoration: none; color: var(--accent); }
.pager:hover { color: var(--accent-dark); }
.credit {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--soft);
  text-align: center;
}
.credit a { color: var(--accent); }
@media (max-width: 640px) {
  .content { font-size: 1rem; }
  .content h1 { font-size: 1.6rem; }
  .pager-row { flex-direction: row; }
}
`

if (require.main === module) {
  try {
    const result = build()
    console.log('Built ' + result.pages + ' pages to ' + result.outDir)
  } catch (err) {
    console.error('Build failed: ' + err.message)
    process.exit(1)
  }
}

module.exports = { build, mdToHtml, PAGES, OUT_DIR }
