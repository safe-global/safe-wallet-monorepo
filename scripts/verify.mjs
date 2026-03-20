#!/usr/bin/env node

/**
 * Parallel verify script for running all quality checks simultaneously.
 *
 * Usage:
 *   node scripts/verify.mjs [--workspace=web] [--changed] [--compact]
 *
 * Flags:
 *   --workspace=<name>  Workspace to check (default: "web")
 *   --changed           Only check files changed since the base branch
 *   --compact           Capture output and print summary instead of streaming
 */

import { spawn, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

function getFlag(name) {
  const prefix = `--${name}=`
  const entry = args.find((a) => a.startsWith(prefix))
  if (entry) return entry.slice(prefix.length)
  return undefined
}

const workspace = getFlag('workspace') ?? 'web'
const isCompact = args.includes('--compact')
const isChanged = args.includes('--changed')

// ---------------------------------------------------------------------------
// Changed-file detection (--changed mode)
// ---------------------------------------------------------------------------

function gitDiff(...diffArgs) {
  try {
    const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=d', ...diffArgs], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out
      .trim()
      .split('\n')
      .filter((l) => l.length > 0)
  } catch (err) {
    console.warn(`verify: git diff failed (${diffArgs.join(' ')}):`, err.message)
    return []
  }
}

function getMergeBase() {
  const targets = ['dev', 'origin/dev', 'main']
  for (const target of targets) {
    try {
      return execFileSync('git', ['merge-base', 'HEAD', target], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    } catch {
      // target branch not found, try next
    }
  }
  return ''
}

const SOURCE_EXT_RE = /\.(ts|tsx|js|jsx)$/

function getChangedFiles(ws, { quiet = false } = {}) {
  const mergeBase = getMergeBase()
  const committed = mergeBase ? gitDiff(`${mergeBase}...HEAD`) : []
  const unstaged = gitDiff()
  const staged = gitDiff('--cached')

  const all = [...new Set([...committed, ...unstaged, ...staged])].filter((f) => SOURCE_EXT_RE.test(f))

  if (!ws) return all

  const prefix = `apps/${ws}/`
  const outside = all.filter((f) => !f.startsWith(prefix))
  const inside = all.filter((f) => f.startsWith(prefix)).map((f) => f.slice(prefix.length))

  if (outside.length > 0 && !quiet) {
    console.log(`ℹ ${outside.length} changed file(s) outside apps/${ws}/ — skipped`)
  }

  return inside
}

// ---------------------------------------------------------------------------
// Workspace name mapping
// ---------------------------------------------------------------------------

const WORKSPACE_NAMES = {
  web: '@safe-global/web',
  mobile: '@safe-global/mobile',
}

const workspacePkg = WORKSPACE_NAMES[workspace] ?? `@safe-global/${workspace}`

// ---------------------------------------------------------------------------
// Missing test detection
// ---------------------------------------------------------------------------

function detectMissingTests(changedFiles, workspace) {
  const wsRoot = workspace ? path.join('apps', workspace) : ''
  const warnings = []

  const testablePatterns = [
    /hooks\/use.+\.tsx?$/,
    /services\/.+\.ts$/,
    /components\/.+\.tsx$/,
    /store\/.+Slice\.ts$/,
    /utils\/.+\.ts$/,
  ]

  const skipPatterns = [
    /\.d\.ts$/,
    /index\.ts$/,
    /\.stories\.tsx?$/,
    /\.test\.tsx?$/,
    /constants\.ts$/,
    /types\.ts$/,
    /AUTO_GENERATED/,
  ]

  for (const file of changedFiles) {
    if (skipPatterns.some((p) => p.test(file))) continue
    if (!testablePatterns.some((p) => p.test(file))) continue

    const dir = path.dirname(file)
    const base = path.basename(file, path.extname(file))
    const ext = file.endsWith('.tsx') ? '.tsx' : '.ts'

    const candidates = [
      path.join(wsRoot, dir, `${base}.test${ext}`),
      path.join(wsRoot, dir, '__tests__', `${base}.test${ext}`),
    ]

    const testExists = candidates.some((c) => existsSync(c))
    if (!testExists) {
      warnings.push({ file, message: `expected ${base}.test${ext}` })
    } else {
      const testModified = changedFiles.some(
        (f) => f.endsWith(`${base}.test${ext}`) && (f.includes(dir) || f.includes('__tests__')),
      )
      if (!testModified) {
        warnings.push({ file, message: 'test exists but was not updated' })
      }
    }
  }

  return warnings
}

// ---------------------------------------------------------------------------
// Check definitions
// ---------------------------------------------------------------------------

function buildChecks() {
  if (isChanged) {
    const changedFiles = getChangedFiles(workspace, { quiet: isCompact })

    if (changedFiles.length === 0) {
      console.log('No changed files detected — nothing to verify.')
      process.exit(0)
    }

    if (changedFiles.length > 50) {
      console.log(`Note: 50+ files changed (${changedFiles.length}) — running full verify.`)
      return { checks: buildFullChecks(), changedFiles }
    }

    const lintableFiles = changedFiles.filter((f) => SOURCE_EXT_RE.test(f))
    const testableFiles = changedFiles.filter((f) => !f.endsWith('.d.ts'))

    const checks = [
      {
        label: 'types',
        cmd: 'yarn',
        args: ['workspace', workspacePkg, 'type-check'],
      },
    ]

    if (lintableFiles.length > 0) {
      checks.push({
        label: 'lint',
        cmd: 'yarn',
        args: ['workspace', workspacePkg, 'eslint', ...lintableFiles],
      })
    }

    if (changedFiles.length > 0) {
      checks.push({
        label: 'prettier',
        cmd: 'yarn',
        args: ['workspace', workspacePkg, 'prettier', '--check', ...changedFiles],
      })
    }

    if (testableFiles.length > 0) {
      checks.push({
        label: 'tests',
        cmd: 'yarn',
        args: [
          'workspace',
          workspacePkg,
          'test',
          '--findRelatedTests',
          ...testableFiles,
          '--watchAll=false',
          '--passWithNoTests',
        ],
      })
    }

    return { checks, changedFiles }
  }

  return { checks: buildFullChecks(), changedFiles: null }
}

function buildFullChecks() {
  return [
    {
      label: 'types',
      cmd: 'yarn',
      args: ['workspace', workspacePkg, 'type-check'],
    },
    {
      label: 'lint',
      cmd: 'yarn',
      args: ['workspace', workspacePkg, 'lint'],
    },
    {
      label: 'prettier',
      cmd: 'yarn',
      args: ['workspace', workspacePkg, 'prettier'],
    },
    {
      label: 'tests',
      cmd: 'yarn',
      args: ['workspace', workspacePkg, 'test', '--watchAll=false'],
    },
  ]
}

const { checks, changedFiles } = buildChecks()

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function runCheck(check) {
  return new Promise((resolve) => {
    const stdio = isCompact ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe']
    const child = spawn(check.cmd, check.args, { stdio })

    const chunks = []

    if (isCompact) {
      // Capture all output silently
      child.stdout.on('data', (d) => chunks.push(d))
      child.stderr.on('data', (d) => chunks.push(d))
    } else {
      // Stream with prefixed lines
      const prefix = `[${check.label}]`

      const rlOut = createInterface({ input: child.stdout })
      rlOut.on('line', (line) => {
        process.stdout.write(`${prefix} ${line}\n`)
      })

      const rlErr = createInterface({ input: child.stderr })
      rlErr.on('line', (line) => {
        process.stderr.write(`${prefix} ${line}\n`)
      })
    }

    child.on('close', (code) => {
      resolve({
        label: check.label,
        code: code ?? 1,
        output: Buffer.concat(chunks).toString(),
      })
    })
  })
}

async function main() {
  const results = await Promise.all(checks.map(runCheck))

  const failed = results.filter((r) => r.code !== 0)
  const allPassed = failed.length === 0

  // Detect missing tests when running in --changed mode
  const testWarnings = changedFiles ? detectMissingTests(changedFiles, workspace) : []

  if (isCompact) {
    console.log('-- verify -----')

    // Print failed check output first so errors are visible
    for (const r of failed) {
      console.log(`\n--- ${r.label} (exit ${r.code}) ---`)
      console.log(r.output.trimEnd())
    }

    // Print missing test warnings (one line each)
    for (const w of testWarnings) {
      console.log(`WARN Missing test: ${w.file}`)
    }

    // Summary line
    const summary = results.map((r) => (r.code === 0 ? `PASS ${r.label}` : `FAIL ${r.label}`)).join('    ')
    console.log(`\n${summary}`)
    console.log('--------')
  } else {
    if (!allPassed) {
      // In non-compact mode output was already streamed; just print summary
      console.log('')
      for (const r of failed) {
        console.error(`FAIL: ${r.label} (exit ${r.code})`)
      }
    }

    // Print missing test warnings block
    if (testWarnings.length > 0) {
      console.log('')
      console.log('WARN Missing tests:')
      for (const w of testWarnings) {
        console.log(`  ${w.file} -> ${w.message}`)
      }
      console.log(`  ${testWarnings.length} changed file(s) have no corresponding tests.`)
      console.log('  Run: yarn test:scaffold <file> to generate a test skeleton.')
    }
  }

  process.exit(allPassed ? 0 : 1)
}

main()
