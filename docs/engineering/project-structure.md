# Project Structure

Use this before making code changes. This guide describes the repo-wide
structure and the conventions that apply across the whole monorepo.

For app-specific guidance, read the relevant project guide:

- Web — [web/project-structure.md](./web/project-structure.md)
- Mobile — [mobile/project-structure.md](./mobile/project-structure.md)

Pre-PR rules live in [rules.json](./rules.json), with a generated
human-readable view in [rules.generated.md](./rules.generated.md).
Generate `pr-self-review-checklist.generated.md` before opening or
finishing a PR.

## Workspaces

| Path                        | Workspace                 | Stack                    | What goes here                                              |
| --------------------------- | ------------------------- | ------------------------ | ----------------------------------------------------------- |
| `apps/web/`                 | `@safe-global/web`        | Next.js + MUI + Tailwind | Web client; lazy-loaded feature folders                     |
| `apps/mobile/`              | `@safe-global/mobile`     | Expo + Tamagui           | Mobile client; Tamagui screens, Expo router                 |
| `apps/tx-builder/`          | `@safe-global/tx-builder` | Vite + React             | Transaction builder app                                     |
| `packages/store/`           | `@safe-global/store`      | RTK + RTK Query          | Shared Redux store, CGW endpoints, AUTO_GENERATED CGW types |
| `packages/utils/`           | `@safe-global/utils`      | Pure TS                  | Shared utilities and Safe SDK adapters                      |
| `packages/theme/`           | `@safe-global/theme`      | Pure TS                  | Tokens; generates MUI theme + Tamagui tokens                |
| `config/test/msw/fixtures/` | n/a                       | MSW                      | Static CGW response fixtures                                |
| `apps/web/cypress/`         | n/a                       | Cypress                  | Web E2E suite                                               |

When code is shared across web and mobile, it lives in `packages/`.
Anything that imports `next/*` belongs in web; anything that imports
`expo*`, `react-native`, or `tamagui` belongs in mobile.

## Multi-Chain Identity

Every Safe is identified by `(chainId, address)`. The same address can
exist on multiple chains via deterministic deployments. Per-Safe state
must always carry both fields together — pinned lists, curated trust
flags, RTK Query args, persistence keys, recipient selections,
analytics events. Treat the address alone as an unsafe identifier.

## Shared Redux And RTK Query Conventions

Slice files colocate reducer, selectors, and tests. Shared slices live
in `packages/store/`; web and mobile mount the store at their respective
entry points.

Generated CGW types live at `packages/store/src/gateway/AUTO_GENERATED/`
and are regenerated via `yarn workspace @safe-global/store build:dev`.
They are never hand-edited; CI fails if AUTO_GENERATED files do not
match `schema.json`. When schema entries are removed, search direct
imports, dynamic property access, fixtures, and both apps for consumers
— the type checker can be silent on JSON fixtures and dynamic property
reads.

For arg-scoped reads, prefer `currentData` over `data` — `data` can
hold the previous arg's result while `safeAddress`, `chainId`,
`chainIds`, or `fiatCode` change. Cache keys are JSON-stringified, so a
single string arg `"MOBILE"` is keyed as `getX("MOBILE")` (with
quotes), and a `usd` vs `USD` casing mismatch produces two separate
entries.

Mutations resolve with `{ data, error }` and do not throw on HTTP
errors. Either call `.unwrap()` (so `try/catch` works) or check
`result.error` explicitly. Sync gates (boolean flags such as
`cfSafeSynced` that suppress errors or extend loading) must be set on
both success and failure paths and reset intentionally on hydration /
auth changes.

## Authentication And Sessions

Session authentication uses CGW's OIDC flow. Treat
`/v1/auth/oidc/authorize` and `/v1/auth/logout/redirect` as top-level
browser navigation targets, not fetch endpoints. Mark the user
authenticated only after a server-confirmed signal (such as a
successful `/v1/auth/me` probe) — never based on a `sessionStorage`
flag alone.

For redirect URLs: default to a sanitized pathname-only redirect, and
on the verification side enforce `https`, reject `username` /
`password`, and reject non-default ports.

## Testing

Unit tests use builders from `apps/web/src/tests/Builder.ts` and shared
shapes under `apps/web/src/tests/builders/*`. Integration-style tests
that exercise the network layer use the static CGW snapshots in
`config/test/msw/fixtures/`. Do not import fixture JSON into unit tests
— fixtures are heavy and tied to specific Safes.

When a test expectation depends on a fixture value (an address from
`safe-deployments`, a token decimal, etc.), assert the fixture has that
value first (`expect(expectedAddress).toBeDefined()`) so a missing
fixture fails loudly instead of silently turning the test into a no-op.

Web Cypress conventions live in
[web/project-structure.md](./web/project-structure.md). Mobile testing
conventions live in
[mobile/project-structure.md](./mobile/project-structure.md).

## CI And Workflows

`.github/workflows/*.yml` contains both web and mobile workflows. Each
workflow's `paths:` filter must include the workflow file itself,
otherwise edits to the workflow do not run it and cannot be validated
in the PR that introduces the change.

Jobs triggered by `pull_request_target` with `contents: write` or
`actions: write` must gate on
`github.event.pull_request.head.repo.full_name == github.repository`,
especially when conditions expand beyond `merged == true`.
`pull_request` triggers do not inherit secrets on fork PRs — gate
secret-dependent jobs to same-repo PRs or move them behind
`pull_request_target` with the same guard.

`concurrency.group` should always include `${{ github.ref }}` so a
`workflow_dispatch` on one branch does not cancel a scheduled run on
another. The last command in a `run:` block determines the step's exit
code, so a trailing `[ -n "$VAR" ] && echo ...` makes the step fail
when `$VAR` is empty — use `if`/`fi` instead, or append `|| true`.

For multiline `$GITHUB_ENV` values, use the heredoc form
`KEY<<EOF / value / EOF` with a dynamic delimiter (such as `uuidgen`)
when the value could itself contain `EOF`. Use
`${{ strategy.job-total }}` for matrix shard counts; embedding a
constant desyncs silently when someone adds a container.

When constructing constrained values (DNS labels, URLs, slug envelopes)
that get a fixed suffix appended, truncate against the _full_ envelope
length, not the bare slug. When introducing a new tag namespace
(`web-v*` alongside legacy `v*`), check both namespaces for collisions
before creating a new release tag, and pin tool versions in lint-staged
so the resolved binary matches what CI uses. Prefer
`yarn workspace ... prettier:fix` over `prettier --write` so the
resolved binary is the workspace-pinned one.

Release jobs that need the previous tag or changelog range must compute
that previous state before creating the new tag. Otherwise the tag
created by the current run becomes the latest tag and the generated
range is empty.

## Code Hygiene Conventions

These habits apply across web and mobile:

- Compare addresses with `sameAddress()` from
  `@safe-global/utils/utils/addresses` — never with
  `.toLowerCase() === .toLowerCase()` against checksum-cased input.
- Normalize Safe version strings with `getCleanSafeVersion()` (or
  equivalent) before calling `safe-deployments` getters; the `+L2`
  suffix breaks lookups.
- Use `semverSatisfies(candidate, '<=requested')` for version-range
  checks. `indexOf(unknown) === -1` silently lets unknown versions
  through.
- Format numeric strings to fixed-point before passing into
  decimal-only parsers. `value.toString()` produces `1e-7` for tiny
  values, which `safeParseUnits` and friends reject.
- Block submit until token decimals (and similar precondition data)
  are loaded. `decimals ?? 18` falls back to the wrong scale for
  ERC-20s like USDC.
- Use `useRef(false)` for concurrent-submission guards. `useState`
  cannot stop two rapid taps in the same tick.
- Async effects that may set state or navigate must be cancellable.
  Set a `let cancelled = false` flag in the effect and bail on stale
  resolutions; do the same for debounced handlers.
- For dynamic dictionary lookups keyed by user input, use
  `Object.hasOwn(map, key) ? map[key] : undefined`,
  `Object.create(null)`, or a `Map`. Plain objects expose `__proto__`
  and `toString` to prototype-pollution attacks.
- Distinguish miss from error in lookup caching, or add a TTL on the
  error case.
- Avoid `as T` casts on union or shape mismatches. Fix the types or
  narrow with a type guard.
- Avoid `typeof X` on `X` from `import type`. Type-only imports are
  erased at runtime; use the imported type directly or switch to a
  value import.
- Move pure-of-props derivations (regex literals, color helpers,
  constants) to module scope or `useMemo`, not inline in the render
  path.
- Reset provider/context state when its condition turns off — every
  `setSomething(value)` inside `if (condition)` needs a matching reset
  in the `else` branch (or in cleanup).
- Replace long `x !== A && x !== B && x !== C` chains with
  `![A, B, C].includes(x)` and hoist the values to a named `const`.
