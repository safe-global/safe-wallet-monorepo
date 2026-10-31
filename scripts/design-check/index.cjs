#!/usr/bin/env node
/**
 * Checks whether the changes between two git refs are design-only.
 *
 * Usage: node scripts/design-check/index.cjs [--base origin/dev] [--head <ref>] [--json] [--summary <file>]
 * Without --head it checks the working tree, including uncommitted and new files.
 *
 * Exit code 0: design-only. Exit code 1: something else changed; every finding names the file and line.
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const { DesignChecker } = require('./check.cjs')

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : fallback
}
const base = opt('--base', 'origin/dev')
const head = opt('--head')

const git = (...a) =>
  execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
const mergeBase = git('merge-base', base, head ?? 'HEAD').trim()
const show = (ref) => (file) => {
  try {
    return git('show', `${ref}:${file}`)
  } catch {
    return undefined
  }
}

const readWorkingTree = (file) => {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return undefined
  }
}
const untracked = head
  ? []
  : git('ls-files', '--others', '--exclude-standard')
      .split('\n')
      .filter(Boolean)
      .map((file) => `A\t${file}`)

const changes = [...git('diff', '--name-status', '-M', mergeBase, ...(head ? [head] : [])).split('\n'), ...untracked]
  .filter(Boolean)
  .map((line) => {
    const [status, a, b] = line.split('\t')
    return status.startsWith('R') ? { status, from: a, file: b } : { status, file: a }
  })

const checker = new DesignChecker({ readBase: show(mergeBase), readHead: head ? show(head) : readWorkingTree })
const result = checker.check(changes)

if (args.includes('--json')) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
} else {
  for (const f of result.files) console.log(`${f.errors.length ? '✗' : '✓'} ${f.file} (${f.kind})`)
  if (result.errors.length) {
    console.log('\nNot design-only:')
    for (const e of result.errors) console.log(`  ${e}`)
  } else console.log('\nDesign-only: styling, copy and presentational markup.')
}

const summary = opt('--summary')
if (summary) {
  const lines = [
    result.designOnly ? '### ✅ Design-only change' : '### ❌ Not a design-only change',
    '',
    '| File | Kind | Result |',
    '| --- | --- | --- |',
    ...result.files.map((f) => `| \`${f.file}\` | ${f.kind} | ${f.errors.length ? '✗' : '✓'} |`),
  ]
  if (result.errors.length) lines.push('', '**Findings**', '', ...result.errors.map((e) => `- \`${e}\``))
  fs.appendFileSync(summary, lines.join('\n') + '\n')
}

process.exit(result.designOnly ? 0 : 1)
