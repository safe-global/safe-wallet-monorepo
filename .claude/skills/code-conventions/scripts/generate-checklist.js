#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

function usage() {
  console.error('Usage: generate-checklist.js [--root <repo-root>] [--out <path>] [--project <project> ...]')
}

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    out: 'docs/engineering/pr-self-review-checklist.generated.md',
    projects: [],
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') {
      args.root = argv[i + 1]
      i += 1
    } else if (arg === '--out') {
      args.out = argv[i + 1]
      i += 1
    } else if (arg === '--project') {
      args.projects.push(argv[i + 1])
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

function formatList(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return ''
  }
  return values.join(', ')
}

function getGroup(rule) {
  return rule.project ? `${rule.project} / ${rule.area}` : rule.area
}

function ruleMatchesProjects(rule, projects) {
  if (projects.length === 0) {
    return true
  }

  return !rule.project || rule.project === 'general' || projects.includes(rule.project)
}

function renderChecklist(rules, projects) {
  const selectedRules = rules.filter((rule) => ruleMatchesProjects(rule, projects))
  const lines = []

  lines.push('# PR Self-Review Checklist')
  lines.push('')
  lines.push('Generated from `docs/engineering/sources/rules.json`. Do not commit this file.')
  if (projects.length > 0) {
    lines.push(`Projects: general + ${projects.join(', ')}`)
  }
  lines.push('Review every generated rule before opening or finishing a PR, then mark each item checked.')
  lines.push('')

  let currentGroup = null
  for (const rule of selectedRules) {
    const group = getGroup(rule)
    if (group !== currentGroup) {
      currentGroup = group
      lines.push(`## ${group}`)
      lines.push('')
    }

    lines.push(`### ${rule.id} ${rule.title}`)
    lines.push('')
    lines.push('- [ ] Checked')
    lines.push(`- Rule: ${rule.rule}`)
    lines.push(`- Check: ${rule.check}`)
    const exampleRefs = formatList(rule.exampleRefs)
    if (exampleRefs) {
      lines.push(`- Examples: ${exampleRefs}`)
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function main() {
  const { root, out, projects } = parseArgs(process.argv)
  const resolvedRoot = path.resolve(root)
  const rulesPath = path.join(resolvedRoot, 'docs', 'engineering', 'sources', 'rules.json')

  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Missing required file: ${rulesPath}`)
  }

  const rules = readJson(rulesPath)
  const checklist = renderChecklist(rules, projects)

  const outPath = path.resolve(resolvedRoot, out)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, checklist)
  console.log(`Wrote ${path.relative(resolvedRoot, outPath)}`)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
