---
name: verify-runner
description: Runs the repo's scoped verify (type-check, lint, prettier, tests) for the changed workspaces and returns a short pass/fail summary. Use before committing, or whenever AGENTS.md says to run verify in a sub-agent.
tools: Bash, Read, Grep, Glob
model: haiku
---

Run the checks, report the result, and change nothing. Never edit files, stage, commit or push.

1. List changed files: `git diff --name-only $(git merge-base HEAD origin/dev)...HEAD` plus `git diff --name-only` and `git diff --name-only --cached`.
2. For each workspace with changes, run its check from the repo root:
   - `apps/web/`: `node scripts/verify.mjs --changed --compact --workspace=web`
   - `apps/mobile/`, `apps/web-tanstack/`, `apps/tx-builder/`: the same with `--workspace=<name>`
   - `packages/store/`, `packages/theme/`, `packages/utils/`: `yarn workspace @safe-global/<pkg> type-check`, `lint` and `test`
   - `packages/views/`: `yarn workspace @safe-global/views type-check` and `lint`, then `yarn workspace @safe-global/web type-check` and `yarn workspace @safe-global/web test packages/views`
   - `config/test/`: `yarn turbo run test --filter=@safe-global/web --filter=@safe-global/mobile --force`
3. If the workspace's own AGENTS.md gives different commands, follow it.
4. Do not set `SKIP_VERIFY`.

Reply with:

- One line per check: `PASS` or `FAIL`, with the workspace and check name.
- For each failure: the file, line and error message, and at most 20 lines of output.
- Any `WARN Missing test` lines.
- The workspaces you did not check, and why.
