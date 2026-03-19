# Agentic Feedback Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fast, parallel verify system with incremental mode, missing-test detection, test scaffolding, and a Claude Code auto-verify hook so agents get immediate quality feedback.

**Architecture:** A single `scripts/verify.mjs` Node script handles all verification modes (full, changed, compact). A thin hook wrapper delegates to it. A separate `scripts/test-scaffold.mjs` generates test skeletons. AGENTS.md gets two new sections (fast feedback loop + test decision matrix).

**Tech Stack:** Node.js (ESM), `child_process.execFileSync`/`spawn`, git CLI, Jest `--findRelatedTests`, regex-based file parsing

**Spec:** `docs/superpowers/specs/2026-03-19-agentic-feedback-loop-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/verify.mjs` | Core verify script: parallel check runner with `--changed`, `--workspace`, `--compact` flags |
| `scripts/verify-changed-hook.mjs` | Claude Code stop hook: thin wrapper that checks for changes then delegates to verify.mjs |
| `scripts/test-scaffold.mjs` | Test skeleton generator: reads source file, determines test type, writes test file |
| `package.json` | Root: add `verify`, `verify:web`, `verify:changed`, `verify:changed:web` scripts |
| `apps/web/package.json` | Web workspace: add `test:scaffold` script |
| `.claude/settings.json` | Add `stop` hook configuration |
| `AGENTS.md` | Add "Fast Feedback Loop" section and "Test Decision Matrix" section |

---

### Task 1: Create `scripts/verify.mjs` — parallel full verify

**Files:**
- Create: `scripts/verify.mjs`
- Modify: `package.json` (root)

- [ ] **Step 1: Create the verify script with parallel execution**

Create `scripts/verify.mjs`. This script:
- Parses `--workspace`, `--changed`, and `--compact` flags from `process.argv`
- Defines the four checks as workspace-scoped commands
- Spawns all four in parallel using `child_process.spawn`
- Streams output with `[types]`, `[lint]`, `[prettier]`, `[tests]` prefixes
- Collects exit codes and exits non-zero if any check failed
- Uses `spawn` (not `exec`) to avoid shell injection — all arguments are passed as arrays

**IMPORTANT: `--workspace` is required.** Running `yarn verify` without `--workspace` invokes root-level scripts which don't propagate flags correctly through `yarn workspaces foreach`. The root `verify` alias exists for convenience but internally defaults to `--workspace=web`. The primary commands are `yarn verify:web` and `yarn verify:changed:web`.

```javascript
// scripts/verify.mjs
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const workspace = args.find((a) => a.startsWith('--workspace='))?.split('=')[1] || 'web'
const changed = args.includes('--changed')
const compact = args.includes('--compact')

function runCheck(label, cmd, cmdArgs, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, cmdArgs, { stdio: opts.pipe ? 'pipe' : 'inherit', ...opts })
    let stdout = ''
    let stderr = ''
    if (opts.pipe) {
      child.stdout?.on('data', (d) => { stdout += d })
      child.stderr?.on('data', (d) => { stderr += d })
    }
    child.on('close', (code) => resolve({ label, code, stdout, stderr }))
  })
}

async function main() {
  const pipe = compact

  // IMPORTANT: In full mode, use named scripts (type-check, lint, prettier, test).
  // In --changed mode, call tools directly (eslint, prettier) so we can pass file args.
  // See Task 2 for --changed implementation.
  const checks = [
    runCheck('types', 'yarn', ['workspace', `@safe-global/${workspace}`, 'type-check'], { pipe }),
    runCheck('lint', 'yarn', ['workspace', `@safe-global/${workspace}`, 'lint'], { pipe }),
    runCheck('prettier', 'yarn', ['workspace', `@safe-global/${workspace}`, 'prettier'], { pipe }),
    runCheck('tests', 'yarn', ['workspace', `@safe-global/${workspace}`, 'test', '--', '--watchAll=false'], { pipe }),
  ]

  const results = await Promise.all(checks)
  const failed = results.filter((r) => r.code !== 0)

  if (compact) {
    // Print failed check output first so the agent can see errors
    for (const r of results.filter((r) => r.code !== 0)) {
      console.log(`\n--- ${r.label} output ---`)
      if (r.stdout) process.stdout.write(r.stdout)
      if (r.stderr) process.stderr.write(r.stderr)
    }
    console.log('-- verify ' + '-'.repeat(30))
    for (const r of results) {
      const status = r.code === 0 ? 'PASS' : 'FAIL'
      process.stdout.write(`${status} ${r.label}    `)
    }
    console.log()
    console.log('-'.repeat(40))
  }

  process.exit(failed.length > 0 ? 1 : 0)
}

main()
```

The full implementation should be ~80 lines for this first pass (full mode only, no `--changed` yet).

- [ ] **Step 2: Register scripts in root `package.json`**

Add to the `"scripts"` section of `package.json`:

```json
"verify": "node scripts/verify.mjs",
"verify:web": "node scripts/verify.mjs --workspace=web",
"verify:changed": "node scripts/verify.mjs --changed",
"verify:changed:web": "node scripts/verify.mjs --changed --workspace=web"
```

- [ ] **Step 3: Test `yarn verify:web` manually**

Run: `yarn verify:web`

Expected: All four checks run in parallel with prefixed output. All pass on a clean working tree. The script exits 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify.mjs package.json
git commit -m "chore: add parallel verify script for fast quality checks"
```

---

### Task 2: Add `--changed` flag (incremental mode)

**Files:**
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Add `getChangedFiles()` function**

Add to `scripts/verify.mjs` a function that uses `execFileSync` (not `exec` — avoids shell injection) to:
1. Compute merge base with fallback chain: `dev` -> `origin/dev` -> `main` -> empty
2. Run `git diff --name-only --diff-filter=d` for merge-base diff, unstaged, and staged
3. Union and deduplicate all file lists
4. Filter to `.ts/.tsx/.js/.jsx` files only
5. If `--workspace` is set, filter to files under `apps/<workspace>/` and strip that prefix
6. Log count of files outside the workspace as a note

```javascript
import { execFileSync } from 'node:child_process'

function gitDiff(...diffArgs) {
  try {
    return execFileSync('git', ['diff', '--name-only', '--diff-filter=d', ...diffArgs], {
      encoding: 'utf8',
    }).trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function getMergeBase() {
  for (const ref of ['dev', 'origin/dev', 'main']) {
    try {
      return execFileSync('git', ['merge-base', 'HEAD', ref], { encoding: 'utf8' }).trim()
    } catch {}
  }
  return ''
}

function getChangedFiles(workspace, { quiet = false } = {}) {
  const mergeBase = getMergeBase()
  const files = new Set()

  if (mergeBase) {
    gitDiff(mergeBase, 'HEAD').forEach((f) => files.add(f))
  }
  gitDiff().forEach((f) => files.add(f))
  gitDiff('--cached').forEach((f) => files.add(f))

  let allFiles = [...files].filter((f) => /\.[tj]sx?$/.test(f))

  if (workspace) {
    const prefix = `apps/${workspace}/`
    const outside = allFiles.filter((f) => !f.startsWith(prefix))
    if (outside.length > 0 && !quiet) {
      console.log(`Note: ${outside.length} files changed outside apps/${workspace}/ — run workspace-specific checks manually.`)
    }
    allFiles = allFiles.filter((f) => f.startsWith(prefix)).map((f) => f.slice(prefix.length))
  }

  return allFiles
}
// Call as: getChangedFiles(workspace, { quiet: compact })
```

- [ ] **Step 2: Wire `--changed` flag into check execution**

When `--changed` is set:
- Call `getChangedFiles(workspace)` to get the file list
- If zero files: print "No changed files detected" and exit 0
- If >50 files: print note and fall back to full checks
- Otherwise, scope lint/prettier/tests to only changed files:
  - **Lint: call `eslint` directly (NOT the `lint` script)**. The `lint` script runs `eslint src` — appending file args would run `eslint src file1.ts`, not `eslint file1.ts`. Use: `yarn workspace @safe-global/${workspace} eslint <...files>`
  - **Prettier: call `prettier --check` directly (NOT the `prettier` script)**. Same issue — the script has its own args. Use: `yarn workspace @safe-global/${workspace} prettier --check <...files>`
  - **Tests: use `--findRelatedTests` with the file list** (filter out `.d.ts`). Paths are workspace-relative (e.g. `src/features/...`) which is correct since `yarn workspace` sets CWD to `apps/web/`. **Include `--watchAll=false`** alongside `--findRelatedTests` since the base test script doesn't include it.
  - **Type-check: always runs full** (no scoping possible), same as full mode

```javascript
// In --changed mode, build commands that call tools directly with file args
function getChangedChecks(changedFiles, workspace, pipe) {
  const ws = ['workspace', `@safe-global/${workspace}`]
  const lintFiles = changedFiles.filter((f) => /\.[tj]sx?$/.test(f))
  const testFiles = changedFiles.filter((f) => !f.endsWith('.d.ts'))

  return [
    // Type-check always runs full
    runCheck('types', 'yarn', [...ws, 'type-check'], { pipe }),
    // Lint: call eslint directly with file args
    lintFiles.length > 0
      ? runCheck('lint', 'yarn', [...ws, 'eslint', ...lintFiles], { pipe })
      : Promise.resolve({ label: 'lint', code: 0, stdout: '', stderr: 'skipped (no lint-able files)' }),
    // Prettier: call prettier directly with file args
    runCheck('prettier', 'yarn', [...ws, 'prettier', '--check', ...changedFiles], { pipe }),
    // Tests: use --findRelatedTests
    testFiles.length > 0
      ? runCheck('tests', 'yarn', [...ws, 'test', '--', '--findRelatedTests', ...testFiles, '--watchAll=false'], { pipe })
      : Promise.resolve({ label: 'tests', code: 0, stdout: '', stderr: 'skipped (no testable files)' }),
  ]
}
```

- [ ] **Step 3: Test incrementally**

Make a trivial change to a file (add a blank line to any `.ts` file under `apps/web/src/`), then run:

```bash
yarn verify:changed:web
```

Expected: Only affected tests run. Prettier/lint check only the changed file. Type-check runs full but is fast (incremental `.tsbuildinfo`).

Revert the change after testing.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify.mjs
git commit -m "chore: add incremental verify mode with --changed flag"
```

---

### Task 3: Add missing test detection

**Files:**
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Add `detectMissingTests()` function**

Add to `scripts/verify.mjs`. Uses `existsSync` to check for test files. No shell commands.

```javascript
import { existsSync } from 'node:fs'
import path from 'node:path'

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
    /\.d\.ts$/, /index\.ts$/, /\.stories\.tsx?$/, /\.test\.tsx?$/,
    /constants\.ts$/, /types\.ts$/, /AUTO_GENERATED/,
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
        (f) => f.endsWith(`${base}.test${ext}`) && (f.includes(dir) || f.includes('__tests__'))
      )
      if (!testModified) {
        warnings.push({ file, message: 'test exists but was not updated' })
      }
    }
  }

  return warnings
}
```

- [ ] **Step 2: Integrate into verify output**

Call `detectMissingTests()` after checks complete. In normal mode, print the full warning block. In compact mode, print one `WARN` line per file. Warnings never affect exit code.

- [ ] **Step 3: Test with a temp file**

```bash
echo 'export function useTestHook() { return null }' > apps/web/src/hooks/useTestHook.ts
yarn verify:changed:web
```

Expected: Warning about missing test for `useTestHook.ts`.

Clean up: `rm apps/web/src/hooks/useTestHook.ts`

- [ ] **Step 4: Commit**

```bash
git add scripts/verify.mjs
git commit -m "chore: add missing test detection to verify script"
```

---

### Task 4: Create `scripts/test-scaffold.mjs`

**Files:**
- Create: `scripts/test-scaffold.mjs`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Create the scaffold script**

Create `scripts/test-scaffold.mjs`. Takes one argument: a file path relative to `apps/web/`. Uses `readFileSync` to read source, regex to extract exports and imports, then generates and writes the test file. No shell commands.

Key behaviors:
- Determines test type from file name: `use*.ts` -> renderHook, `*.tsx` -> render, `*Slice.ts` -> store, other `.ts` -> function
- Extracts exported names via regex (`/export\s+(?:default\s+)?(?:const|function|class)\s+(\w+)/g`)
- Detects common mockable imports (`@/hooks/useSafeInfo`, `@/hooks/useChainId`, `@/store`, etc.)
- Uses `@/tests/test-utils` for render/renderHook imports (not `@testing-library/react`)
- Checks if `__tests__/` dir exists alongside source to decide test location
- Never overwrites existing test files

- [ ] **Step 2: Register in web workspace `package.json`**

Add to `apps/web/package.json` scripts:
```json
"test:scaffold": "node ../../scripts/test-scaffold.mjs"
```

- [ ] **Step 3: Test with a temp file**

```bash
echo 'export function useVerifyTest() { return 42 }' > apps/web/src/hooks/useVerifyTest.ts
yarn workspace @safe-global/web test:scaffold src/hooks/useVerifyTest.ts
cat apps/web/src/hooks/useVerifyTest.test.ts
```

Expected: Generated test file with `renderHook` pattern, correct imports.

Clean up: `rm apps/web/src/hooks/useVerifyTest.ts apps/web/src/hooks/useVerifyTest.test.ts 2>/dev/null`

- [ ] **Step 4: Commit**

```bash
git add scripts/test-scaffold.mjs apps/web/package.json
git commit -m "chore: add test scaffolding command"
```

---

### Task 5: Create Claude Code stop hook

**Files:**
- Create: `scripts/verify-changed-hook.mjs`
- Modify: `.claude/settings.json`

- [ ] **Step 1: Create the hook wrapper script**

Create `scripts/verify-changed-hook.mjs`. A thin wrapper that:
1. Uses `execFileSync('git', ['diff', '--name-only'])` to check for unstaged changes
2. Uses `execFileSync('git', ['diff', '--name-only', '--cached'])` to check for staged changes
3. Filters to `.ts/.tsx` files
4. If none found, exits silently (exit 0, no output)
5. If found, spawns `node scripts/verify.mjs --changed --workspace=web --compact` with `stdio: 'inherit'`

```javascript
// scripts/verify-changed-hook.mjs
import { execFileSync, spawn } from 'node:child_process'

function hasChangedSourceFiles() {
  try {
    const unstaged = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' })
    const staged = execFileSync('git', ['diff', '--name-only', '--cached'], { encoding: 'utf8' })
    return [...unstaged.trim().split('\n'), ...staged.trim().split('\n')]
      .filter(Boolean)
      .some((f) => /\.[tj]sx?$/.test(f))
  } catch {
    return false
  }
}

if (!hasChangedSourceFiles()) {
  process.exit(0)
}

const child = spawn('node', ['scripts/verify.mjs', '--changed', '--workspace=web', '--compact'], {
  stdio: 'inherit',
})

child.on('close', (code) => {
  process.exit(code ?? 1)
})
```

- [ ] **Step 2: Add stop hook to `.claude/settings.json`**

Update `.claude/settings.json` to:
```json
{
  "hooks": {
    "stop": [
      {
        "matcher": "",
        "command": "node scripts/verify-changed-hook.mjs"
      }
    ]
  }
}
```

- [ ] **Step 3: Test the hook manually**

On clean tree: `node scripts/verify-changed-hook.mjs` — should exit silently.

With a change: make a trivial edit, run again — should output compact verify summary.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-changed-hook.mjs .claude/settings.json
git commit -m "chore: add Claude Code stop hook for automatic verification"
```

---

### Task 6: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add test decision matrix**

Insert after the `### Test Coverage` section (around line 351), before `## Mobile Development`:

The table from the spec with 8 rows mapping change types to required tests, plus a "What NOT to test" sub-section.

- [ ] **Step 2: Add "Fast Feedback Loop" sub-section**

Insert at the start of the `## Workflow` section (after line 244), before the existing step 1. Include:
- Description of automatic hook behavior
- Manual `yarn verify:changed:web` and `yarn verify:web` commands
- `yarn test:scaffold` usage
- Rules for agents (4 bullet points)

- [ ] **Step 3: Format and verify**

```bash
yarn prettier:fix
```

Skim the modified sections to ensure they flow with existing content.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add fast feedback loop and test decision matrix to AGENTS.md"
```

---

### Task 7: End-to-end validation

- [ ] **Step 1: Full verify on clean tree**

```bash
yarn verify:web
```

Expected: All four checks pass, no warnings, exit 0.

- [ ] **Step 2: Incremental verify with temp file**

```bash
echo 'export function useVerifyTest() { return 42 }' > apps/web/src/hooks/useVerifyTest.ts
yarn verify:changed:web
```

Expected: Checks run on changed files only. Missing test warning for `useVerifyTest.ts`.

- [ ] **Step 3: Scaffold and re-verify**

```bash
yarn workspace @safe-global/web test:scaffold src/hooks/useVerifyTest.ts
yarn verify:changed:web
```

Expected: Missing test warning gone.

- [ ] **Step 4: Compact mode**

```bash
node scripts/verify.mjs --changed --workspace=web --compact
```

Expected: Summary block with PASS/FAIL/WARN labels.

- [ ] **Step 5: Hook wrapper**

```bash
node scripts/verify-changed-hook.mjs
```

Expected: Detects changes, runs compact verify, shows results.

- [ ] **Step 6: Clean up**

```bash
rm apps/web/src/hooks/useVerifyTest.ts apps/web/src/hooks/useVerifyTest.test.ts 2>/dev/null
```

- [ ] **Step 7: Fix any issues and commit**

If any fixes were needed:
```bash
git add -A
git commit -m "fix: address issues found during end-to-end validation"
```
