#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { mdToHtml, PAGES } = require('./build')

const ROOT = path.resolve(__dirname)

const TMP = path.join(ROOT, '.test-site')
let failures = []
let checks = 0

function check (name, ok, detail) {
  checks++
  if (!ok) failures.push(name + (detail ? ' — ' + detail : ''))
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok ? '' : detail ? ' — ' + detail : ''))
}

console.log('Running build into ' + TMP)
fs.rmSync(TMP, { recursive: true, force: true })
execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { env: { ...process.env, OUT_DIR: TMP } })

const expectedPages = PAGES.map(p => p.src.replace(/\.md$/, '.html'))
const html = {}
for (const name of expectedPages) {
  const file = path.join(TMP, name)
  check('site/' + name + ' exists', fs.existsSync(file))
  if (fs.existsSync(file)) html[name] = fs.readFileSync(file, 'utf8')
}

check('site/styles.css exists', fs.existsSync(path.join(TMP, 'styles.css')))

const navCount = PAGES.length
for (const [name, pageHtml] of Object.entries(html)) {
  const navLinks = (pageHtml.match(/site-nav/g) || []).length
  check('site/' + name + ' has nav', navLinks >= 1)
  const navItemMatches = pageHtml.match(/<a href="[a-z-]+\.html">|nav-here/g) || []
  check('site/' + name + ' nav covers ' + navCount + ' pages', navItemMatches.length >= navCount)
  check('site/' + name + ' links stylesheet', pageHtml.includes('<link rel="stylesheet" href="styles.css">'))
  check('site/' + name + ' has main content', pageHtml.includes('<main class="content">'))
  check('site/' + name + ' has copyright credit', pageHtml.includes('Copyright (c) 2026 Asdale Dynamics, LLC'))
  check('site/' + name + ' has no leftover placeholders', !pageHtml.includes('\u0000'))
  check('site/' + name + ' has no unrendered code fences', !pageHtml.includes('```'))
}

for (const [name, pageHtml] of Object.entries(html)) {
  const hrefs = [...pageHtml.matchAll(/href="([^"]+)"/g)].map(m => m[1])
  for (const href of hrefs) {
    if (/^(https?:|mailto:|data:)/.test(href)) continue
    const target = href.split('#')[0]
    if (target === '' || target === 'styles.css') continue
    check('site/' + name + ' link resolves: ' + href, fs.existsSync(path.join(TMP, target)))
  }
}

const lessonPages = ['chat-assistants.html', 'voice-tools.html', 'writing-tools.html', 'search-tools.html', 'study-help.html']
for (const name of lessonPages) {
  if (!html[name]) continue
  check('site/' + name + ' has a Try-it-now step', /Try it now/.test(html[name]))
}

const licenseText = fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8')
check('LICENSE has exact copyright line', licenseText.includes('Copyright (c) 2026 Asdale Dynamics, LLC'))
check('LICENSE contains no secrets-like strings', !/(api[_-]?key|sk-[A-Za-z0-9]{10,}|TODO)/i.test(licenseText))

const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')
check('README credits Asdale Dynamics, LLC', /Asdale Dynamics, LLC/.test(readme))

const unit = mdToHtml([
  '# Unit title',
  '',
  'A **bold** and an *italic* and `inline code` and a [link](foo.md).',
  '',
  '- one',
  '- two',
  '',
  '1. first',
  '2. second',
  '',
  '> quoted thought',
  '',
  '| Col A | Col B |',
  '| --- | --- |',
  '| x | y |',
  '',
  '```',
  'raw code',
  '```'
].join('\n'))

const u = unit.html
const truth = (needle => u.includes(needle))
check('mdToHtml heading rendered', u.includes('<h1>Unit title</h1>'))
check('mdToHtml strong rendered', truth('<strong>bold</strong>'))
check('mdToHtml em rendered', truth('<em>italic</em>'))
check('mdToHtml inline code rendered', truth('<code>inline code</code>'))
check('mdToHtml link rendered', truth('<a href="foo.md">link</a>'))
check('mdToHtml ul rendered', /<ul><li>one<\/li><li>two<\/li><\/ul>/.test(u))
check('mdToHtml ol rendered', /<ol><li>first<\/li><li>second<\/li><\/ol>/.test(u))
check('mdToHtml blockquote rendered', truth('<blockquote><p>quoted thought</p></blockquote>'))
check('mdToHtml table rendered', truth('<th>Col A</th>'))
check('mdToHtml code fence rendered', truth('<pre><code>raw code'))
check('mdToHtml title extracted', unit.title === 'Unit title')

fs.rmSync(TMP, { recursive: true, force: true })

console.log('')
if (failures.length > 0) {
  console.log('TESTS FAILED: ' + failures.length + ' of ' + checks + ' checks failed:')
  for (const f of failures) console.log('  - ' + f)
  process.exit(1)
} else {
  console.log('All ' + checks + ' checks passed.')
}
