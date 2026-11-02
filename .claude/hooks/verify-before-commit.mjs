#!/usr/bin/env node
// PreToolUse hook: blocks `git commit` (exit 2) when the scoped check fails for a workspace with staged changes.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const COMMIT_RE = /(^|[\s;&|(])git(\s+-[cC]\s+\S+)*\s+commit(\s|$)/
const APP_WORKSPACES = ['web', 'mobile', 'web-tanstack', 'tx-builder']

const input = JSON.parse(readFileSync(0, 'utf-8'))
const command = input.tool_input?.command ?? ''
if (!COMMIT_RE.test(command)) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf-8' }).split('\n').filter(Boolean)

const commitsTracked = /\s(-[a-zA-Z]*a[a-zA-Z]*|--all)(\s|$)/.test(command)
const files = new Set([
  ...git('diff', '--cached', '--name-only', '--diff-filter=d'),
  ...(commitsTracked ? git('diff', '--name-only', '--diff-filter=d') : []),
])

const checks = new Map()
for (const file of files) {
  const [top, name] = file.split('/')
  if (top === 'apps' && APP_WORKSPACES.includes(name)) {
    checks.set(name, ['node', ['scripts/verify.mjs', '--changed', '--compact', `--workspace=${name}`]])
  } else if (top === 'packages' && existsSync(path.join(root, 'packages', name, 'package.json'))) {
    const pkg = JSON.parse(readFileSync(path.join(root, 'packages', name, 'package.json'), 'utf-8'))
    for (const script of ['type-check', 'lint', 'test']) {
      if (pkg.scripts?.[script]) checks.set(`${name}:${script}`, ['yarn', ['workspace', pkg.name, script]])
    }
  }
}

const failures = []
for (const [label, [cmd, args]] of checks) {
  const run = spawnSync(cmd, args, { cwd: root, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 })
  if (run.status !== 0) failures.push(`--- ${label} ---\n${`${run.stdout}${run.stderr}`.slice(-4000)}`)
}

if (failures.length > 0) {
  process.stderr.write(
    `Commit blocked: the scoped check failed. Fix the errors below, then commit again.\n\n${failures.join('\n\n')}\n`,
  )
  process.exit(2)
}
