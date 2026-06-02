#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { renderRulesMarkdown } from './generate-rules-md.js'

const SOURCE_WINDOW_ID_PATTERN = /^(?:CLOSED-\d{8}-\d{8}|HIST-\d{8})$/
const LEGACY_SOURCE_ID_PATTERN =
  /\b(?:HIST-\d{4}-\d{2}-\d{2}|REVIEW-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}|COMPOUND-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}|BACKFILL-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2})\b/g
const REVIEW_LEARNING_ID_PATTERN = /^RL-\d{8}-\d{3}$/
const RULE_ID_PATTERN = /^[A-Z][A-Z0-9]{1,9}-\d{2}$/
const GENERATED_CHECKLIST_PATH = 'docs/engineering/pr-self-review-checklist.generated.md'

function usage() {
  console.error('Usage: validate-convention-docs.js [--root <repo-root>]')
}

function parseArgs(argv) {
  const args = { root: process.cwd() }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') {
      args.root = argv[i + 1]
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

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`)
  }
  return fs.readFileSync(filePath, 'utf8')
}

function parseJsonFile(filePath) {
  try {
    return JSON.parse(readRequired(filePath))
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`)
  }
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walkFiles(entryPath)
    }
    return [entryPath]
  })
}

function unique(values) {
  return [...new Set(values)].sort()
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function assertIsoTimestamp(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp`)
  }
}

function validateLedger(ledgerPath) {
  const ledger = parseJsonFile(ledgerPath)
  if (ledger.dateField !== 'closedAt') {
    throw new Error('ledger.dateField must be "closedAt"')
  }
  if (ledger.state !== 'closed') {
    throw new Error('ledger.state must be "closed"')
  }
  if (!ledger.coveredClosedAtRange) {
    throw new Error('ledger.coveredClosedAtRange is required')
  }

  const { start, end } = ledger.coveredClosedAtRange
  assertIsoTimestamp(start, 'ledger.coveredClosedAtRange.start')
  assertIsoTimestamp(end, 'ledger.coveredClosedAtRange.end')

  if (Date.parse(start) > Date.parse(end)) {
    throw new Error('ledger.coveredClosedAtRange.start must be before end')
  }

  const sourceWindowId = ledger.lastRun?.sourceWindowId
  if (sourceWindowId && !/^CLOSED-\d{8}-\d{8}$/.test(sourceWindowId)) {
    throw new Error('ledger.lastRun.sourceWindowId must use CLOSED-YYYYMMDD-YYYYMMDD')
  }
}

function validateOpenQuestions(root, openQuestionsPath) {
  const docsDir = path.join(root, 'docs', 'engineering')
  const markdownFiles = walkFiles(docsDir).filter((file) => file.endsWith('.md'))
  const errors = []

  for (const file of markdownFiles) {
    if (path.resolve(file) === path.resolve(openQuestionsPath)) {
      continue
    }

    const text = fs.readFileSync(file, 'utf8')
    const relative = path.relative(root, file)
    const lines = text.split('\n')

    lines.forEach((line, index) => {
      if (/^#{1,4}\s+Open Questions?\b/i.test(line)) {
        errors.push(
          `${relative}:${index + 1}: open-question heading belongs in docs/engineering/sources/working/open-question-options.md`,
        )
      }
      if (/^Question:\s*$/i.test(line)) {
        errors.push(
          `${relative}:${index + 1}: question block belongs in docs/engineering/sources/working/open-question-options.md`,
        )
      }
      if (/^Decision Needed:\s*$/i.test(line)) {
        errors.push(
          `${relative}:${index + 1}: decision-needed block belongs in docs/engineering/sources/working/open-question-options.md`,
        )
      }
    })
  }

  return errors
}

function validateActiveDocRouting(root) {
  const docsDir = path.join(root, 'docs', 'engineering')
  const files = ['AGENTS.md']
  for (const file of walkFiles(docsDir)) {
    const relative = path.relative(root, file)
    if (!file.endsWith('.md')) {
      continue
    }
    if (path.relative(docsDir, file).startsWith(`sources${path.sep}`)) {
      continue
    }
    files.push(relative)
  }
  const errors = []

  for (const relative of files) {
    const file = path.join(root, relative)
    if (!fs.existsSync(file)) {
      continue
    }

    const text = fs.readFileSync(file, 'utf8')
    if (/\]\([^)]*REVIEW_LEARNINGS\.md\)|\bread\s+[`"]?REVIEW_LEARNINGS\.md\b/i.test(text)) {
      errors.push(`${relative}: active docs must not route or link to raw REVIEW_LEARNINGS.md`)
    }
    if (
      /\]\([^)]*(docs\/engineering\/sources\/working|sources\/working\/)[^)]*\)|\bread\s+[`"]?(docs\/engineering\/sources\/working|sources\/working\/)/i.test(
        text,
      )
    ) {
      errors.push(`${relative}: active docs must not route normal agents to docs/engineering/sources/working`)
    }
  }

  return errors
}

function validateProjectStructureShape(projectStructureText) {
  const errors = []
  const headingPattern = /^#{2,4}\s+([A-Z][A-Z0-9]+-\d{2,})\b/gm
  let match
  while ((match = headingPattern.exec(projectStructureText)) !== null) {
    const line = projectStructureText.slice(0, match.index).split('\n').length
    errors.push(
      `docs/engineering/conventions/project-structure.md:${line}: project structure headings must not be rule-ID based (${match[1]})`,
    )
  }

  const checklistBlocks = projectStructureText.match(/^Checklist:\s*$/gm) ?? []
  if (checklistBlocks.length > 0) {
    errors.push('project-structure.md must not contain repeated "Checklist:" blocks; put checks in rules.json')
  }

  const ruleCardLabels = projectStructureText.match(/^(Rule|Check|Why):\s*$/gm) ?? []
  if (ruleCardLabels.length > 4) {
    errors.push('project-structure.md looks like a rule-card registry; keep it as a directory and placement guide')
  }

  return errors
}

function assertObject(value, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object`)
    return false
  }
  return true
}

function assertString(record, key, label, errors, pattern = null) {
  if (typeof record[key] !== 'string' || record[key].trim() === '') {
    errors.push(`${label}: ${key} must be a non-empty string`)
    return
  }
  if (pattern && !pattern.test(record[key])) {
    errors.push(`${label}: ${key} has invalid format: ${record[key]}`)
  }
}

function assertStringArray(record, key, label, errors, pattern = null) {
  if (!Array.isArray(record[key])) {
    errors.push(`${label}: ${key} must be an array`)
    return
  }
  for (const value of record[key]) {
    if (typeof value !== 'string') {
      errors.push(`${label}: ${key} values must be strings`)
    } else if (pattern && !pattern.test(value)) {
      errors.push(`${label}: ${key} has invalid value: ${value}`)
    }
  }
}

function assertNumberArray(record, key, label, errors) {
  if (!Array.isArray(record[key])) {
    errors.push(`${label}: ${key} must be an array`)
    return
  }
  for (const value of record[key]) {
    if (!Number.isInteger(value) || value <= 0) {
      errors.push(`${label}: ${key} values must be positive integers`)
    }
  }
}

function validateNoExtraKeys(record, allowedKeys, label, errors) {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`${label}: unsupported property ${key}`)
    }
  }
}

function validateRulesJson(rules) {
  const errors = []
  if (!Array.isArray(rules)) {
    return ['rules.json must be an array']
  }

  const ids = rules.map((record) => record.id).filter(Boolean)
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  for (const duplicateId of unique(duplicateIds)) {
    errors.push(`rules.json contains duplicate rule ID: ${duplicateId}`)
  }

  const allowedKeys = ['id', 'project', 'area', 'title', 'rule', 'check', 'exampleRefs', 'reviewLearningIds']
  rules.forEach((record, index) => {
    const label = `rules.json[${index}]`
    if (!assertObject(record, label, errors)) {
      return
    }
    validateNoExtraKeys(record, allowedKeys, label, errors)
    assertString(record, 'id', label, errors, RULE_ID_PATTERN)
    if (record.project !== undefined) {
      assertString(record, 'project', label, errors)
    }
    for (const key of ['area', 'title', 'rule', 'check']) {
      assertString(record, key, label, errors)
    }
    assertStringArray(
      record,
      'exampleRefs',
      label,
      errors,
      /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\.md#[A-Za-z0-9][A-Za-z0-9_.-]*$/,
    )
    assertStringArray(record, 'reviewLearningIds', label, errors, REVIEW_LEARNING_ID_PATTERN)
  })

  return errors
}

function validateReviewLearningsJson(learnings) {
  const errors = []
  if (!Array.isArray(learnings)) {
    return ['review-learnings.json must be an array']
  }

  const ids = learnings.map((record) => record.id).filter(Boolean)
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  for (const duplicateId of unique(duplicateIds)) {
    errors.push(`review-learnings.json contains duplicate review-learning ID: ${duplicateId}`)
  }

  const allowedKeys = [
    'id',
    'title',
    'sourceWindowId',
    'prNumbers',
    'prState',
    'reviewCommentIds',
    'reviewIds',
    'issueCommentIds',
    'learning',
    'ruleIds',
  ]
  learnings.forEach((record, index) => {
    const label = `review-learnings.json[${index}]`
    if (!assertObject(record, label, errors)) {
      return
    }
    validateNoExtraKeys(record, allowedKeys, label, errors)
    assertString(record, 'id', label, errors, REVIEW_LEARNING_ID_PATTERN)
    assertString(record, 'title', label, errors)
    assertString(record, 'sourceWindowId', label, errors, SOURCE_WINDOW_ID_PATTERN)
    assertString(record, 'prState', label, errors)
    assertString(record, 'learning', label, errors)
    assertNumberArray(record, 'prNumbers', label, errors)
    assertNumberArray(record, 'reviewCommentIds', label, errors)
    assertNumberArray(record, 'reviewIds', label, errors)
    assertNumberArray(record, 'issueCommentIds', label, errors)
    assertStringArray(record, 'ruleIds', label, errors, RULE_ID_PATTERN)
    if (asArray(record.ruleIds).length === 0) {
      errors.push(`${label}: ruleIds must contain at least one rule ID`)
    }

    // CLOSED-* learnings are derived from a fetched window of closed PRs and
    // must be traceable to GitHub source IDs. HIST-* manual entries skip this
    // because they may not link to any PR or comment.
    if (typeof record.sourceWindowId === 'string' && record.sourceWindowId.startsWith('CLOSED-')) {
      if (asArray(record.prNumbers).length === 0) {
        errors.push(`${label}: prNumbers must contain at least one PR for CLOSED-* learnings`)
      }
      const sourceIdCount =
        asArray(record.reviewCommentIds).length +
        asArray(record.reviewIds).length +
        asArray(record.issueCommentIds).length
      if (sourceIdCount === 0) {
        errors.push(
          `${label}: CLOSED-* learnings must populate at least one of reviewCommentIds, reviewIds, or issueCommentIds`,
        )
      }
    }
  })

  return errors
}

function validateMappings(ruleRecords, learningRecords) {
  const errors = []
  const ruleIds = new Set(ruleRecords.map((record) => record.id))
  const learningIds = new Set(learningRecords.map((record) => record.id))

  for (const learning of learningRecords) {
    for (const ruleId of asArray(learning.ruleIds)) {
      const rule = ruleRecords.find((record) => record.id === ruleId)
      if (!ruleIds.has(ruleId)) {
        errors.push(`review-learnings.json references unknown rule ID: ${learning.id} -> ${ruleId}`)
      } else if (!asArray(rule.reviewLearningIds).includes(learning.id)) {
        errors.push(`rules.json ${ruleId} must include ${learning.id} in reviewLearningIds`)
      }
    }
  }

  for (const rule of ruleRecords) {
    for (const learningId of asArray(rule.reviewLearningIds)) {
      const learning = learningRecords.find((record) => record.id === learningId)
      if (!learningIds.has(learningId)) {
        errors.push(`rules.json references unknown review-learning ID: ${rule.id} -> ${learningId}`)
      } else if (!asArray(learning.ruleIds).includes(rule.id)) {
        errors.push(`review-learnings.json ${learningId} must include ${rule.id} in ruleIds`)
      }
    }
  }

  return errors
}

function validateSchemas(rulesSchema, learningsSchema) {
  const errors = []
  if (rulesSchema?.$schema && typeof rulesSchema.$schema !== 'string') {
    errors.push('rules.schema.json $schema must be a string')
  }
  if (rulesSchema?.type !== 'array') {
    errors.push('rules.schema.json must describe an array')
  }
  if (learningsSchema?.$schema && typeof learningsSchema.$schema !== 'string') {
    errors.push('review-learnings.schema.json $schema must be a string')
  }
  if (learningsSchema?.type !== 'array') {
    errors.push('review-learnings.schema.json must describe an array')
  }
  return errors
}

function validateLegacySourceIds(docsDir) {
  const errors = []
  for (const file of walkFiles(docsDir)) {
    if (!file.endsWith('.md') && !file.endsWith('.json')) {
      continue
    }
    const text = fs.readFileSync(file, 'utf8')
    const matches = unique(Array.from(text.matchAll(LEGACY_SOURCE_ID_PATTERN), (match) => match[0]))
    if (matches.length > 0) {
      errors.push(`${path.relative(docsDir, file)} contains legacy source-window IDs: ${matches.join(', ')}`)
    }
  }
  return errors
}

function validateObsoleteFiles(docsDir) {
  const obsoleteFiles = [
    'rules.csv',
    'rules.tsv',
    'pr-self-review-checklist.md',
    path.join('working', 'review-learnings.csv'),
    path.join('working', 'review-learnings.tsv'),
    path.join('working', 'review-learnings.md'),
    path.join('working', 'review-learning-coverage.md'),
  ]

  return obsoleteFiles
    .map((relative) => path.join(docsDir, relative))
    .filter((file) => fs.existsSync(file))
    .map((file) => `${path.relative(docsDir, file)} is obsolete in the JSON rules model`)
}

function validateGeneratedChecklistIgnore(root) {
  const gitignorePath = path.join(root, '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    return [`.gitignore must ignore ${GENERATED_CHECKLIST_PATH}`]
  }

  const gitignore = fs.readFileSync(gitignorePath, 'utf8')
  const entries = gitignore
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  if (!entries.includes(GENERATED_CHECKLIST_PATH)) {
    return [`.gitignore must include ${GENERATED_CHECKLIST_PATH}`]
  }

  return []
}

async function validateRulesMarkdown(rules, rulesMdPath, engineeringRoot) {
  const expected = await renderRulesMarkdown(rules, engineeringRoot)
  const actual = readRequired(rulesMdPath)
  return actual === expected ? [] : ['rules.generated.md is stale; regenerate it from rules.json']
}

async function main() {
  const { root } = parseArgs(process.argv)
  const resolvedRoot = path.resolve(root)
  const docsDir = path.join(resolvedRoot, 'docs', 'engineering')

  const sourcesDir = path.join(docsDir, 'sources')
  const readmePath = path.join(docsDir, 'README.md')
  const projectStructurePath = path.join(docsDir, 'conventions', 'project-structure.md')
  const rulesPath = path.join(sourcesDir, 'rules.json')
  const rulesSchemaPath = path.join(sourcesDir, 'rules.schema.json')
  const rulesMdPath = path.join(sourcesDir, 'rules.generated.md')
  const workingDir = path.join(sourcesDir, 'working')
  const moduleInventoryPath = path.join(workingDir, 'module-inventory.md')
  const openQuestionsPath = path.join(workingDir, 'open-question-options.md')
  const reviewLearningsPath = path.join(workingDir, 'review-learnings.json')
  const reviewLearningsSchemaPath = path.join(workingDir, 'review-learnings.schema.json')
  const ledgerPath = path.join(workingDir, 'review-learning-ledger.json')

  readRequired(readmePath)
  const projectStructure = readRequired(projectStructurePath)
  const rules = parseJsonFile(rulesPath)
  const rulesSchema = parseJsonFile(rulesSchemaPath)
  const reviewLearnings = parseJsonFile(reviewLearningsPath)
  const reviewLearningsSchema = parseJsonFile(reviewLearningsSchemaPath)
  readRequired(openQuestionsPath)
  readRequired(moduleInventoryPath)

  const errors = []

  try {
    validateLedger(ledgerPath)
  } catch (error) {
    errors.push(error.message)
  }

  errors.push(...validateOpenQuestions(resolvedRoot, openQuestionsPath))
  errors.push(...validateActiveDocRouting(resolvedRoot))
  errors.push(...validateProjectStructureShape(projectStructure))
  errors.push(...validateSchemas(rulesSchema, reviewLearningsSchema))
  errors.push(...validateRulesJson(rules))
  errors.push(...validateReviewLearningsJson(reviewLearnings))
  errors.push(...validateMappings(rules, reviewLearnings))
  errors.push(...(await validateRulesMarkdown(rules, rulesMdPath, sourcesDir)))
  errors.push(...validateLegacySourceIds(sourcesDir))
  errors.push(...validateObsoleteFiles(sourcesDir))
  errors.push(...validateGeneratedChecklistIgnore(resolvedRoot))

  if (errors.length > 0) {
    console.error('\nConvention docs validation failed:')
    for (const error of unique(errors)) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log('Convention docs OK')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
