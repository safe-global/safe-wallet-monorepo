#!/usr/bin/env node
/**
 * Advisory Stop hook: reminds the agent to add tests for code it changed.
 *
 * Two independent, advisory checks (this hook NEVER blocks — always exits 0):
 *   1. One-shot e2e: web app source changed but no Playwright one-shot
 *      clickthrough (apps/web/e2e/tests/one-shots/) did.
 *   2. Unit test: significant source code changed but no colocated unit test
 *      (*.test.ts(x) / *.spec.ts(x)) did.
 *
 * Each reminder fires at most once per distinct set of changed files
 * (fingerprint markers), so it nudges when fresh untested code appears rather
 * than nagging every turn.
 *
 * Disable with SKIP_TEST_REMINDERS=1. See apps/web/e2e/docs/README.md and
 * apps/web/docs/TESTING.md.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

if (process.env.SKIP_TEST_REMINDERS === '1') process.exit(0)

// Run git with an argument array (no shell → no injection surface).
const git = (...gitArgs) => {
  try {
    return execFileSync('git', gitArgs, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

// Resolve the base commit this branch diverged from (dev preferred, then main).
const base =
  git('merge-base', 'HEAD', 'origin/dev') ||
  git('merge-base', 'HEAD', 'dev') ||
  git('merge-base', 'HEAD', 'origin/main') ||
  git('merge-base', 'HEAD', 'main')
if (!base) process.exit(0) // can't determine a base → don't guess

// Files changed on this branch (committed) + uncommitted working-tree changes.
const committed = git('diff', '--name-only', base, 'HEAD')
const working = git('status', '--porcelain')
  .split('\n')
  .map((l) => l.slice(3).split(' -> ').pop()) // handle "R  old -> new"
  .join('\n')

const files = [
  ...new Set(
    (committed + '\n' + working)
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean),
  ),
]
if (files.length === 0) process.exit(0)

const isUnitTest = (f) => /\.(test|spec)\.[tj]sx?$/.test(f)
const isStory = (f) => /\.stories\.[tj]sx?$/.test(f)

// Remind once per distinct set of source files (keyed marker), then print.
const remindOnce = (key, sourceFiles, lines) => {
  const sig = createHash('sha1').update(sourceFiles.slice().sort().join('\n')).digest('hex')
  const marker = `.git/.test-reminder-${key}`
  if (existsSync(marker) && readFileSync(marker, 'utf8').trim() === sig) return
  try {
    writeFileSync(marker, sig)
  } catch {
    // best-effort; still print the reminder
  }
  console.log(['', ...lines, ''].join('\n'))
}

// --- Check 1: web app source → Playwright one-shot clickthrough ---
const isWebSrc = (f) =>
  f.startsWith('apps/web/src/') && /\.(ts|tsx|js|jsx)$/.test(f) && !isUnitTest(f) && !isStory(f) && !f.endsWith('.d.ts')
const webFiles = files.filter(isWebSrc)
const oneShotChanged = files.some((f) => f.startsWith('apps/web/e2e/tests/one-shots/'))
if (webFiles.length > 0 && !oneShotChanged) {
  remindOnce('oneshot', webFiles, [
    '🎬 One-shot reminder',
    `You changed web app code (${webFiles.length} file${webFiles.length > 1 ? 's' : ''} under apps/web/src/) but added no Playwright one-shot clickthrough.`,
    'Add a happy-path one-shot under apps/web/e2e/tests/one-shots/ for this change:',
    '  yarn workspace @safe-global/web pw:oneshot:record',
    "CI records it and posts the clickthrough GIF on the PR. If a one-shot genuinely doesn't apply (pure refactor/config), note that in the PR.",
    'Docs: apps/web/e2e/docs/README.md#one-shot-clickthroughs',
  ])
}

// --- Check 2: significant source code → colocated unit test ---
const isSourceCode = (f) =>
  /\.(ts|tsx|js|jsx)$/.test(f) &&
  !isUnitTest(f) &&
  !isStory(f) &&
  !f.endsWith('.d.ts') &&
  !/(^|\/)(AUTO_GENERATED|__generated__|generated)\//.test(f) &&
  !f.includes('/types/contracts/') &&
  (f.startsWith('apps/web/src/') || f.startsWith('apps/mobile/src/') || /^packages\/[^/]+\/src\//.test(f))
const sourceFiles = files.filter(isSourceCode)
const unitTestChanged = files.some(isUnitTest)
if (sourceFiles.length > 0 && !unitTestChanged) {
  remindOnce('unit', sourceFiles, [
    '🧪 Unit test reminder',
    `You changed ${sourceFiles.length} source file${sourceFiles.length > 1 ? 's' : ''} but added/updated no unit test (*.test.ts(x)).`,
    'Any significant code change should come with a new or updated colocated unit test.',
    'Cover new logic, services, hooks, parsers, and reducers. See apps/web/docs/TESTING.md',
    "(yarn test:scaffold <file> generates a skeleton). If a test genuinely doesn't apply, note why in the PR.",
  ])
}

process.exit(0)
