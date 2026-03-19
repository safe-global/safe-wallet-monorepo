# Agentic Feedback Loop — Design Spec

**Date:** 2026-03-19
**Status:** Draft
**Goal:** Tighten the agentic coding feedback loop in the web app so agents get fast, automatic quality feedback and write the right tests proactively.

## Problem

AI coding agents working in this repo suffer from three feedback problems:

1. **Slow sequential checks** — Agents run type-check, lint, prettier, and tests one at a time. Each takes time, failures cascade, and agents waste cycles.
2. **No automatic feedback** — Agents don't run checks until the end (or not at all), then get hit with a wall of errors they have to untangle. They iterate in circles — fix one thing, break another.
3. **Missing/wrong tests** — Agents skip tests unless explicitly told. When they do write them, they pick the wrong type (e.g., E2E when a unit test would do) or fight boilerplate instead of writing meaningful assertions.

## Non-Goals

- Changing pre-commit hooks (developers find them slow enough already)
- Enforcing test coverage as a hard gate in CI
- Building new CI workflows
- Changing the existing test infrastructure (Jest, MSW, builders, etc.)

## Solution Overview

Seven pieces that work together:

| Piece | What | Who |
|---|---|---|
| `yarn verify` / `verify:web` | Parallel full quality check | Everyone |
| `yarn verify:changed` / `verify:changed:web` | Incremental check scoped to diff | Everyone, especially agents |
| Missing test detection | Warns about changed files without tests | Agents (warning only) |
| Test decision matrix | Lookup table in AGENTS.md | Agents |
| `yarn test:scaffold` | Generates test skeletons from source files | Everyone |
| Claude Code `stop` hook | Auto-runs verify:changed after agent edits | Agents only |
| AGENTS.md workflow update | Documents the feedback loop and agent rules | Agents |

## Detailed Design

### 1. `yarn verify` — Parallel Full Check

A Node script (`scripts/verify.mjs`) that runs all four quality checks in parallel:

- `type-check` (web workspace)
- `lint` (web workspace)
- `prettier --check`
- `test` (web workspace)

Behavior:
- All four spawn concurrently as child processes
- Output is streamed with prefixed labels (`[types]`, `[lint]`, `[prettier]`, `[tests]`)
- If any process fails, the script reports the failure immediately (does not kill others — let them finish so you see all errors at once)
- Exit code is non-zero if any check failed

A `--compact` flag produces a one-line-per-check summary instead of streaming full output. Used by the hook script (section 6).

Registered in root `package.json`:
```json
"verify": "node scripts/verify.mjs",
"verify:web": "node scripts/verify.mjs --workspace=web"
```

### 2. `yarn verify:changed` — Incremental Mode

Same script with a `--changed` flag (the `:changed` variants are convenience aliases).

**Changed file detection:**
```bash
# Merge base with fallback chain (handles missing dev ref, new branches, etc.)
MERGE_BASE=$(git merge-base HEAD dev 2>/dev/null \
  || git merge-base HEAD origin/dev 2>/dev/null \
  || git merge-base HEAD main 2>/dev/null \
  || echo "")

# Files changed vs merge base (skip if no merge base found)
if [ -n "$MERGE_BASE" ]; then
  git diff --name-only --diff-filter=d "$MERGE_BASE" HEAD
fi

# Plus unstaged/staged changes in working tree
git diff --name-only --diff-filter=d
git diff --name-only --diff-filter=d --cached
```

Union of all lists, deduplicated, filtered to `.ts/.tsx/.js/.jsx` files.

**Zero changed files:** If no source files are detected, print "No changed files detected" and exit 0.

**Scoped checks:**
- **Prettier:** Runs only on changed files (pass file list directly)
- **Lint:** Runs ESLint only on changed `.ts/.tsx` files (pass file list directly)
- **Type-check:** Runs full `tsc --noEmit` (cannot scope to individual files). Uses TypeScript's incremental mode (`.tsbuildinfo` cache) so subsequent runs complete in ~2-5 seconds.
- **Tests:** Uses `jest --findRelatedTests <changed-files>` to run only tests that import or depend on changed files. File paths must be **workspace-relative** (e.g., `src/features/...` not `apps/web/src/features/...`). Files outside the target workspace are filtered out before passing to Jest. If zero test-related files remain after filtering, the test step is skipped.

**Large diffs:** If more than 50 files are changed, fall back to running the full (non-incremental) check and print a note: "50+ files changed — running full verify."

**Multi-workspace limitation:** Currently, `verify:changed` only runs checks for the web workspace. Changed files in `packages/` or `apps/mobile/` are detected but not checked — they appear as a note in the output: "N files changed outside apps/web/ — run workspace-specific checks manually." Future enhancement: auto-detect affected workspaces and run checks for each.

Registered as:
```json
"verify:changed": "node scripts/verify.mjs --changed",
"verify:changed:web": "node scripts/verify.mjs --changed --workspace=web"
```

### 3. Missing Test Detection

A warning pass built into the verify script. Runs after computing the changed files list.

**Detection rules:**

| Changed file pattern | Expected test location | Severity |
|---|---|---|
| `hooks/use*.ts(x)` | `use*.test.ts(x)` or `__tests__/use*.test.ts(x)` | warn |
| `services/*.ts` | `*.test.ts` colocated or in `__tests__/` | warn |
| `components/*/*.tsx` | `*.test.tsx` colocated or in `__tests__/` | warn |
| `store/*Slice.ts` or `store/slices/*.ts` | `*.test.ts` | warn |
| `utils/*.ts` | `*.test.ts` | warn |
| Type-only files (`.d.ts`), constants, barrels (`index.ts` with only re-exports) | — | skip |

All `.tsx` component files trigger a warning — no "has logic" heuristic. If it's truly layout-only, the agent can ignore the warning. Simpler and avoids false negatives.

**Scope:** Detection rules apply to files under `apps/web/src/`. Files in `packages/` or `apps/mobile/` are noted but not checked (see multi-workspace limitation in section 2).

**Additional check:** If a source file changed but its existing test file was *not* modified, emit a softer warning: "Test file exists but was not updated — verify tests still pass."

**Output format:**
```
⚠ Missing tests:
  src/features/earn/hooks/useEarnData.ts → expected useEarnData.test.ts
  src/features/earn/services/utils.ts → expected utils.test.ts

  2 changed files have no corresponding tests.
  Run: yarn test:scaffold <file> to generate a test skeleton.
```

Warnings only — never blocks, never fails the verify run.

### 4. Test Decision Matrix (AGENTS.md)

New section added after "Testing Guidelines" in AGENTS.md:

```markdown
## Test Decision Matrix

| What you changed | Required tests | Test type | Example |
|---|---|---|---|
| New hook (`use*.ts`) | Unit test with `renderHook` | `hooks/__tests__/useX.test.ts` | Mock dependencies, test return values and state changes |
| New utility/service (`*.ts`) | Unit test | `utils.test.ts` colocated | Pure function tests, edge cases, error paths |
| New component with logic | Unit test + Storybook story | `Component.test.tsx` + `Component.stories.tsx` | Render with providers, test interactions, story for visual states |
| New component (layout only) | Storybook story only | `Component.stories.tsx` | No unit test needed — story covers visual correctness |
| Redux slice | State transition test | `mySlice.test.ts` | Test reducers by dispatching actions and asserting resulting state |
| RTK Query endpoint | MSW integration test | `api.test.ts` | Use MSW to mock API, test cache behavior |
| Bug fix (any file) | Regression test | Add to existing test file | Write a test that fails without the fix, passes with it |
| Feature (new feature dir) | All of the above as applicable | Per-file rules above | Plus: add feature flag test showing disabled state |

### What NOT to test
- Type-only files, barrel re-exports, constants
- Auto-generated files (`AUTO_GENERATED/`, contract types)
- Storybook stories themselves (covered by snapshot workflow)
```

### 5. Test Scaffolding Command

A Node script (`scripts/test-scaffold.mjs`) that generates test files from source files.

```bash
yarn test:scaffold src/features/earn/hooks/useEarnData.ts
```

**Behavior:**
1. Determines test type from file name/path:
   - `use*.ts` → `renderHook` template
   - `*.tsx` → `render` template
   - `*Slice.ts` → store dispatch template
   - Other `.ts` → direct function call template
2. Extracts the file's exported names and import paths using regex (no TypeScript compiler API — keeps the script lightweight with zero extra dependencies)
3. Generates a test file with:
   - Correct imports from `@/tests/test-utils` (not `@testing-library/react`)
   - `jest.mock()` stubs for common hook imports (e.g., `useSafeInfo`, `useAppSelector`)
   - One `describe` block, one `it` per detected export with `// TODO: add assertions`
4. Writes to the expected test location (colocated `*.test.ts(x)` by default, or `__tests__/` if sibling files already use that pattern)
5. **Never overwrites** an existing test file — prints "Test file already exists at <path>" and exits
6. File paths are resolved relative to the web workspace root (`apps/web/`)

**Output example for a hook:**
```typescript
import { renderHook } from '@/tests/test-utils'
import { useEarnData } from '../useEarnData'

jest.mock('@/hooks/useSafeInfo')

const mockUseSafeInfo = jest.requireMock<typeof import('@/hooks/useSafeInfo')>('@/hooks/useSafeInfo')

beforeEach(() => {
  jest.clearAllMocks()
  mockUseSafeInfo.default.mockReturnValue({ /* TODO */ })
})

describe('useEarnData', () => {
  it('should return earn data', () => {
    const { result } = renderHook(() => useEarnData())
    // TODO: add assertions
  })
})
```

Registered in web workspace `package.json`:
```json
"test:scaffold": "node ../../scripts/test-scaffold.mjs"
```

### 6. Claude Code `stop` Hook

A hook in `.claude/settings.json` that auto-runs `verify:changed` after every agent turn that modifies source files.

**Configuration:**
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

**Hook script** (`scripts/verify-changed-hook.mjs`):

A thin wrapper (~30 lines) that:
1. Checks for modified source files (`.ts`, `.tsx`) via both `git diff --name-only` (unstaged) and `git diff --name-only --cached` (staged)
2. If no source files changed → exit silently (no output for non-code turns)
3. If source files changed → delegates to `node scripts/verify.mjs --changed --workspace=web --compact`

The `--compact` flag on verify.mjs produces a summary-only output format:

```
-- verify:changed ------------------
PASS types    PASS lint    PASS prettier
PASS tests (3 ran, 3 passed)
WARN Missing test: src/features/earn/hooks/useEarnData.ts
------------------------------------
```

On failure:
```
-- verify:changed ------------------
FAIL types -- 2 errors in src/features/earn/hooks/useEarnData.ts
PASS lint    PASS prettier
PASS tests (3 ran, 3 passed)
------------------------------------
```

Note: tests run regardless of type-check failures — the agent gets maximum signal from a single run.

**Performance:** Adds ~5-10 seconds to agent turns that modify code. Acceptable given the alternative is discovering errors much later.

**Scope:** Only in `.claude/settings.json` — does not affect human developers at all.

### 7. AGENTS.md Workflow Update

New section added near the top of the Workflow section:

```markdown
## Fast Feedback Loop

The repo provides automated verification that runs after every code change:

1. **Automatic**: A Claude Code hook runs `verify:changed` after every response
   that modifies source files. You'll see a compact summary — fix any errors
   before moving on.

2. **Manual**: Run `yarn verify:changed:web` anytime to check your work.
   Run `yarn verify:web` for a full check before committing.

3. **Test scaffolding**: Run `yarn test:scaffold <file>` to generate a test
   skeleton with the correct imports, mocks, and structure. See the Test
   Decision Matrix below for which files need tests.

### Rules for agents

- Fix all `verify:changed` errors before proceeding to the next task
- If `verify:changed` reports a missing test, write one before committing
- Do NOT run type-check, lint, prettier, and test separately — use `verify`
- Do NOT commit without a clean `verify:changed` pass
```

## File Inventory

New files:
- `scripts/verify.mjs` — parallel verify script with `--changed`, `--workspace`, `--compact` flags (~200 lines)
- `scripts/verify-changed-hook.mjs` — Claude Code hook wrapper, delegates to verify.mjs (~30 lines)
- `scripts/test-scaffold.mjs` — test skeleton generator using regex-based parsing (~150 lines)

Modified files:
- `package.json` — add `verify`, `verify:web`, `verify:changed`, `verify:changed:web` scripts
- `apps/web/package.json` — add `test:scaffold` script
- `AGENTS.md` — add "Fast Feedback Loop" section and "Test Decision Matrix" section
- `.claude/settings.json` — add `stop` hook configuration

## Implementation Order

1. `scripts/verify.mjs` + root package.json scripts (foundation — everything else depends on this)
2. Incremental mode (`--changed` flag) in verify.mjs
3. Missing test detection (built into verify.mjs)
4. Test decision matrix in AGENTS.md (no code dependency, can be done anytime)
5. `scripts/test-scaffold.mjs` + web package.json script
6. `scripts/verify-changed-hook.mjs` + `.claude/settings.json` hook
7. AGENTS.md workflow section update (references all the above, so last)
