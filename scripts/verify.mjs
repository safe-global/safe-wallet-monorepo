#!/usr/bin/env node

/**
 * Parallel verify script for running all quality checks simultaneously.
 *
 * Usage:
 *   node scripts/verify.mjs [--workspace=web] [--changed] [--compact]
 *
 * Flags:
 *   --workspace=<name>  Workspace to check (default: "web")
 *   --changed           Only check files changed since the base branch (TODO)
 *   --compact           Capture output and print summary instead of streaming
 */

import { spawn } from 'node:child_process'
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

// TODO: implement --changed incremental mode (Task 2)
if (isChanged) {
  // Placeholder — will filter checks to only changed files in a future task.
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
// Check definitions
// ---------------------------------------------------------------------------

const checks = [
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

  if (isCompact) {
    console.log('-- verify -----')

    // Print failed check output first so errors are visible
    for (const r of failed) {
      console.log(`\n--- ${r.label} (exit ${r.code}) ---`)
      console.log(r.output.trimEnd())
    }

    // Summary line
    const summary = results.map((r) => (r.code === 0 ? `PASS ${r.label}` : `FAIL ${r.label}`)).join('    ')
    console.log(`\n${summary}`)
    console.log('--------')
  } else if (!allPassed) {
    // In non-compact mode output was already streamed; just print summary
    console.log('')
    for (const r of failed) {
      console.error(`FAIL: ${r.label} (exit ${r.code})`)
    }
  }

  process.exit(allPassed ? 0 : 1)
}

main()
