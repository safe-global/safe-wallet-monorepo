#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function usage() {
  console.error(
    [
      'Usage: review-learning-lookup.js [--root <repo-root>]',
      '         (--rule <RULE-ID> | --learning <RL-ID> | --search <text>) [--limit <n>] [--github]',
      '',
      'Examples:',
      '  review-learning-lookup.js --rule RTK-03',
      '  review-learning-lookup.js --learning RL-20260506-007 --github',
      '  review-learning-lookup.js --search "cache key missing input"',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const args = { root: process.cwd(), rule: null, learning: null, search: null, limit: 10, github: false }

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
    } else if (arg === '--search') {
      args.search = argv[i + 1]
      i += 1
    } else if (arg === '--limit') {
      args.limit = Number.parseInt(argv[i + 1], 10)
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

  const modes = [args.rule, args.learning, args.search].filter(Boolean)
  if (modes.length !== 1) {
    throw new Error('Pass exactly one of --rule, --learning or --search')
  }
  if (!Number.isInteger(args.limit) || args.limit < 1) {
    throw new Error('--limit must be a positive integer')
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

const SEARCH_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'when', 'from', 'into', 'its', 'not', 'but', 'has',
])

// Scores each learning by how many query terms it contains; title hits count
// twice so a topic match outranks an incidental mention in the body.
function searchTerms(query) {
  const terms = [
    ...new Set(
      String(query)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 2 && !SEARCH_STOPWORDS.has(term)),
    ),
  ]
  if (terms.length === 0) {
    throw new Error('--search needs at least one term longer than two characters')
  }
  return terms
}

function searchLearnings(learnings, query, limit) {
  const terms = searchTerms(query)

  return learnings
    .map((item) => {
      const title = String(item.title || '').toLowerCase()
      const body = `${title} ${String(item.learning || '').toLowerCase()} ${asArray(item.ruleIds).join(' ').toLowerCase()}`
      let score = 0
      for (const term of terms) {
        if (body.includes(term)) {
          score += 1
        }
        if (title.includes(term)) {
          score += 1
        }
      }
      return { item, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit)
}

// Same scoring over rules. A learning almost always belongs on a rule that
// already exists; this is what makes that checkable before adding one.
function searchRules(rules, query, limit) {
  const terms = searchTerms(query)

  return rules
    .map((item) => {
      const title = `${item.id} ${item.title}`.toLowerCase()
      const body = `${title} ${String(item.rule || '').toLowerCase()} ${String(item.check || '').toLowerCase()}`
      let score = 0
      for (const term of terms) {
        if (body.includes(term)) {
          score += 1
        }
        if (title.includes(term)) {
          score += 1
        }
      }
      return { item, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit)
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
  const { root, rule, learning, search, limit, github } = parseArgs(process.argv)
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

  if (search) {
    console.log(`# Matching: ${search}`)
    console.log('')

    const ruleMatches = searchRules(rules, search, limit)
    console.log('## Rules')
    console.log('')
    if (ruleMatches.length === 0) {
      console.log('No existing rule matches these terms. Adding one may be justified — state why in the run summary.')
    } else {
      console.log('Confirm the closest rule (map the learning, leave the text alone) or advance it (tighten `rule`/`check`).')
      console.log('Add a new rule only if none of these can honestly cover the learning.')
      console.log('')
      for (const { item, score } of ruleMatches) {
        console.log(`### ${item.id} ${item.title} (match score ${score}, ${asArray(item.reviewLearningIds).length} learning(s))`)
        console.log('')
        console.log(`- Rule: ${item.rule}`)
        console.log(`- Check: ${item.check}`)
        console.log('')
      }
    }

    const matches = searchLearnings(learnings, search, limit)
    console.log('## Review learnings')
    console.log('')
    if (matches.length === 0) {
      console.log('No existing learning matches these terms. A new RL-* object is justified.')
      return
    }
    console.log(`${matches.length} candidate(s), best match first.`)
    console.log('Extend one of these if it carries the same reusable lesson; only add a new RL-* if none does.')
    console.log('')
    for (const { item, score } of matches) {
      console.log(`(match score ${score})`)
      printLearning(item, repo, github)
    }
    return
  }

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
