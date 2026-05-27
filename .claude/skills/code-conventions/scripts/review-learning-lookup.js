#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function usage() {
  console.error(
    [
      'Usage: review-learning-lookup.js [--root <repo-root>] (--rule <RULE-ID> | --learning <RL-ID>) [--github]',
      '',
      'Examples:',
      '  review-learning-lookup.js --rule RTK-03',
      '  review-learning-lookup.js --learning RL-20260506-007 --github',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const args = { root: process.cwd(), rule: null, learning: null, github: false }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') {
      args.root = argv[i + 1]
      i += 1
    } else if (arg === '--rule') {
      args.rule = argv[i + 1]
      i += 1
    } else if (arg === '--learning') {
      args.learning = argv[i + 1]
      i += 1
    } else if (arg === '--github') {
      args.github = true
    } else if (arg === '-h' || arg === '--help') {
      usage()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if ((args.rule && args.learning) || (!args.rule && !args.learning)) {
    throw new Error('Pass exactly one of --rule or --learning')
  }

  return args
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function isNumericId(value) {
  return /^[0-9]+$/.test(String(value))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function detectRepo(root) {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const match = remote.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/)
    const repo = match?.[1]
    if (repo && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
      return repo
    }
    return '<owner>/<repo>'
  } catch {
    return '<owner>/<repo>'
  }
}

function renderGithubCommands(repo, learning) {
  const lines = []
  const prNumbers = asArray(learning.prNumbers).filter(isNumericId)

  for (const prNumber of prNumbers) {
    lines.push(`- PR #${prNumber}: gh pr view ${prNumber} --repo ${repo} --comments`)
  }

  for (const id of asArray(learning.reviewCommentIds).filter(isNumericId)) {
    lines.push(`- Review comment ${id}: gh api repos/${repo}/pulls/comments/${id}`)
  }

  for (const id of asArray(learning.reviewIds).filter(isNumericId)) {
    for (const prNumber of prNumbers) {
      lines.push(`- Review ${id}: gh api repos/${repo}/pulls/${prNumber}/reviews/${id}`)
    }
  }

  for (const id of asArray(learning.issueCommentIds).filter(isNumericId)) {
    lines.push(`- Issue comment ${id}: gh api repos/${repo}/issues/comments/${id}`)
  }

  if (lines.length === 0) {
    lines.push('- No GitHub source IDs are recorded for this learning.')
  }

  return lines
}

function printList(label, values) {
  const list = asArray(values)
  if (list.length > 0) {
    console.log(`- ${label}: ${list.join(', ')}`)
  }
}

function printLearning(learning, repo, includeGithub) {
  console.log(`### ${learning.id}`)
  console.log('')
  console.log(`- Source window: ${learning.sourceWindowId}`)
  printList('PRs', learning.prNumbers)
  console.log(`- PR state: ${learning.prState || '(not recorded)'}`)
  printList('Rule IDs', learning.ruleIds)
  console.log('')
  console.log(learning.learning)
  console.log('')

  if (includeGithub) {
    console.log('GitHub source commands:')
    for (const line of renderGithubCommands(repo, learning)) {
      console.log(line)
    }
    console.log('')
  }
}

function main() {
  const { root, rule, learning, github } = parseArgs(process.argv)
  const resolvedRoot = path.resolve(root)
  const rulesPath = path.join(resolvedRoot, 'docs', 'engineering', 'sources', 'rules.json')
  const learningsPath = path.join(resolvedRoot, 'docs', 'engineering', 'sources', 'working', 'review-learnings.json')

  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Missing required file: ${rulesPath}`)
  }
  if (!fs.existsSync(learningsPath)) {
    throw new Error(`Missing required file: ${learningsPath}`)
  }

  const rules = readJson(rulesPath)
  const learnings = readJson(learningsPath)
  const repo = detectRepo(resolvedRoot)

  if (rule) {
    const selectedRule = rules.find((item) => item.id === rule)
    if (!selectedRule) {
      throw new Error(`Unknown rule ID: ${rule}`)
    }

    console.log(`# ${selectedRule.id} ${selectedRule.title}`)
    console.log('')
    console.log(`Rule: ${selectedRule.rule}`)
    console.log('')
    console.log(`Check: ${selectedRule.check}`)
    console.log('')
    printList('Examples', selectedRule.exampleRefs)
    console.log('')

    const ruleLearnings = learnings.filter((item) => asArray(item.ruleIds).includes(rule))
    if (ruleLearnings.length === 0) {
      console.log('No review learnings are mapped to this rule.')
      return
    }

    console.log('## Review Learnings')
    console.log('')
    for (const item of ruleLearnings) {
      printLearning(item, repo, github)
    }
    return
  }

  const selectedLearning = learnings.find((item) => item.id === learning)
  if (!selectedLearning) {
    throw new Error(`Unknown review-learning ID: ${learning}`)
  }

  printLearning(selectedLearning, repo, github)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
