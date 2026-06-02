#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

function usage() {
  console.error('Usage: generate-rules-md.js [--root <repo-root>] [--out <path>]')
}

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    out: 'docs/engineering/sources/rules.generated.md',
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') {
      args.root = argv[i + 1]
      i += 1
    } else if (arg === '--out') {
      args.out = argv[i + 1]
      i += 1
    } else if (arg === '-h' || arg === '--help') {
      usage()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return args
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ruleAnchor(id) {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findHeadings(lines) {
  const headings = []
  let inFence = false
  let fenceMarker = null
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (inFence) {
      const close = line.match(/^\s*(```+|~~~+)\s*$/)
      if (close && close[1].startsWith(fenceMarker)) {
        inFence = false
        fenceMarker = null
      }
      continue
    }
    const open = line.match(/^\s*(```+|~~~+)/)
    if (open) {
      inFence = true
      fenceMarker = open[1]
      continue
    }
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (m) {
      headings.push({ line: i, level: m[1].length, text: m[2].trim() })
    }
  }
  return headings
}

function parseExampleRef(ref) {
  const idx = ref.indexOf('#')
  if (idx === -1) {
    return { filePath: ref, anchor: null }
  }
  return { filePath: ref.slice(0, idx), anchor: ref.slice(idx + 1) }
}

function loadExampleSection(engineeringRoot, ref) {
  const { filePath, anchor } = parseExampleRef(ref)
  const absPath = path.resolve(engineeringRoot, filePath)
  if (!fs.existsSync(absPath)) {
    throw new Error(
      `exampleRef "${ref}" points to a missing file (resolved to ${absPath}). Fix rules.json or the example doc.`,
    )
  }
  const text = fs.readFileSync(absPath, 'utf8')

  if (!anchor) {
    return { headingText: null, body: text.replace(/^\n+|\n+$/g, '') }
  }

  const lines = text.split('\n')
  const headings = findHeadings(lines)
  const matchIdx = headings.findIndex((h) => slugify(h.text) === anchor)
  if (matchIdx === -1) {
    const available = headings.map((h) => slugify(h.text)).join(', ') || '(none)'
    throw new Error(`exampleRef "${ref}" anchor "${anchor}" not found in ${absPath}. Available anchors: ${available}.`)
  }

  const start = headings[matchIdx]
  let end = lines.length
  for (let j = matchIdx + 1; j < headings.length; j += 1) {
    if (headings[j].level <= start.level) {
      end = headings[j].line
      break
    }
  }

  const body = lines
    .slice(start.line + 1, end)
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
  return { headingText: start.text, body }
}

function getGroup(rule) {
  return rule.project ? `${rule.project} / ${rule.area}` : rule.area
}

function groupHeading(rule) {
  if (rule.project) {
    return `🌐 ${rule.project} › ${rule.area}`
  }
  return `📂 ${rule.area}`
}

function metaLine(rule) {
  const parts = []
  if (rule.project) {
    parts.push(`**${rule.project}**`)
  }
  parts.push(rule.area)
  const exampleCount = (rule.exampleRefs || []).length
  if (exampleCount > 0) {
    parts.push(`${exampleCount} ${exampleCount === 1 ? 'example' : 'examples'}`)
  }
  const learnings = rule.reviewLearningIds || []
  if (learnings.length > 0) {
    const chips = learnings.map((id) => `\`${id}\``).join(' · ')
    parts.push(`↩ ${chips}`)
  }
  return parts.join(' · ')
}

function renderExample(ref, idx, total, engineeringRoot) {
  const { filePath, anchor } = parseExampleRef(ref)
  const { headingText, body } = loadExampleSection(engineeringRoot, ref)
  const counter = total === 1 ? 'Example' : `Example ${idx + 1} of ${total}`
  const summaryAnchor = anchor ? ` § <em>${anchor}</em>` : ''
  const lines = []
  lines.push('<details>')
  lines.push(`<summary><strong>💡 ${counter}</strong> — <code>${filePath}</code>${summaryAnchor}</summary>`)
  lines.push('')
  lines.push('<br>')
  lines.push('')
  if (headingText) {
    lines.push(`**${headingText}**`)
    lines.push('')
  }
  if (body) {
    lines.push(body)
    lines.push('')
  }
  lines.push(`<sub>Source: <a href="${ref}">${ref}</a></sub>`)
  lines.push('')
  lines.push('</details>')
  return lines.join('\n')
}

function renderQuickIndex(rules) {
  const lines = []
  lines.push('## 📑 Quick Index')
  lines.push('')
  lines.push('| ID | Title | Group |')
  lines.push('| --- | --- | --- |')
  for (const rule of rules) {
    lines.push(`| [\`${rule.id}\`](#${ruleAnchor(rule.id)}) | ${rule.title} | ${getGroup(rule)} |`)
  }
  lines.push('')
  lines.push('---')
  return lines.join('\n')
}

// Format through the repo's Prettier so the output matches a pre-commit
// `prettier --write` and the validator won't flag it stale. Falls back to raw
// Markdown when Prettier is unavailable; the validator shares this path.
async function formatMarkdown(markdown, filePath) {
  let prettier
  try {
    prettier = await import('prettier')
  } catch {
    return markdown
  }
  try {
    const config = (await prettier.resolveConfig(filePath)) || {}
    return await prettier.format(markdown, { ...config, parser: 'markdown', filepath: filePath })
  } catch {
    return markdown
  }
}

export async function renderRulesMarkdown(rules, engineeringRoot) {
  if (!engineeringRoot) {
    throw new Error('renderRulesMarkdown requires engineeringRoot to resolve exampleRefs')
  }

  const lines = []

  lines.push('# Engineering Rules')
  lines.push('')
  lines.push('> Generated from `rules.json`. Do not edit by hand; edit `rules.json`, then regenerate this file.')
  lines.push('')

  if (rules.length > 0) {
    lines.push(renderQuickIndex(rules))
    lines.push('')
  }

  let currentGroup = null
  for (const rule of rules) {
    const group = getGroup(rule)
    if (group !== currentGroup) {
      currentGroup = group
      lines.push(`## ${groupHeading(rule)}`)
      lines.push('')
    }

    lines.push(`<a id="${ruleAnchor(rule.id)}"></a>`)
    lines.push(`### \`${rule.id}\` ${rule.title}`)
    lines.push('')
    lines.push(`> ${metaLine(rule)}`)
    lines.push('')
    lines.push('**📜 Rule**\\')
    lines.push(rule.rule)
    lines.push('')
    lines.push('**✅ Check**\\')
    lines.push(`> ${rule.check}`)
    lines.push('')

    const exampleRefs = rule.exampleRefs || []
    for (let i = 0; i < exampleRefs.length; i += 1) {
      lines.push(renderExample(exampleRefs[i], i, exampleRefs.length, engineeringRoot))
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  }

  const raw = `${lines.join('\n').replace(/\n+$/u, '')}\n`
  return formatMarkdown(raw, path.join(engineeringRoot, 'rules.generated.md'))
}

async function main() {
  const { root, out } = parseArgs(process.argv)
  const resolvedRoot = path.resolve(root)
  const sourcesRoot = path.join(resolvedRoot, 'docs', 'engineering', 'sources')
  const rulesPath = path.join(sourcesRoot, 'rules.json')

  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Missing required file: ${rulesPath}`)
  }

  const markdown = await renderRulesMarkdown(readJson(rulesPath), sourcesRoot)
  const outPath = path.resolve(resolvedRoot, out)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, markdown)
  console.log(`Wrote ${path.relative(resolvedRoot, outPath)}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
