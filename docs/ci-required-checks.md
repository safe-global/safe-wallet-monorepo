# Required CI checks

Branch protection can require a check only if it reports on every pull request. A workflow with a `pull_request` `paths` filter does not run on unrelated pull requests, so its required check stays pending and blocks the merge. A required workflow therefore has no `paths` filter on `pull_request` and uses two shared actions:

- [`pr-changes`](../.github/actions/pr-changes/action.yml) says whether the pull request changes a file that matches the given globs. Other events, such as `push`, always count as relevant, so a `paths` filter on `push` can stay.
- [`required-result`](../.github/actions/required-result/action.yml) fails unless every needed job succeeded. A skipped job passes only when nothing relevant changed.

Require the result job, not the jobs it checks: its name stays the same when jobs are added, renamed or sharded.

```yaml
on:
  pull_request:
  push:
    branches: [dev]
    paths: [apps/web/**]

jobs:
  changes:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    outputs:
      relevant: ${{ steps.changes.outputs.relevant }}
    steps:
      - id: changes
        uses: $/.github/actions/pr-changes
        with:
          paths: |
            apps/web/**
            packages/**
            yarn.lock

  lint:
    needs: changes
    if: needs.changes.outputs.relevant == 'true'
    # ...

  result:
    name: Web lint result
    if: always()
    needs: [changes, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: $/.github/actions/required-result
        with:
          needs: ${{ toJSON(needs) }}
          relevant: ${{ needs.changes.outputs.relevant }}
```

List in `needs` of the result job only the jobs that must pass; leave out jobs that skip on purpose, such as push-only steps. [`web-isolated-e2e-backend.yml`](../.github/workflows/web-isolated-e2e-backend.yml) uses this pattern and also fails fork pull requests, which get no secrets for its backend.

## Checks to require

Set these job names as required status checks in branch protection for `dev`:

| Check                        | Workflow                                                           | Runs when the pull request changes                                |
| ---------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `Web checks result`          | `web-checks.yml` (lint, prettier, type-check, unused exports)      | `apps/web`, `apps/web-tanstack`, `packages`, dependencies         |
| `Web unit tests result`      | `web-unit-tests.yml`                                               | `apps/web`, `packages`, dependencies                              |
| `Web TanStack checks result` | `web-tanstack-checks.yml` (build, verify)                          | `apps/web-tanstack`, `apps/web`, `packages`, dependencies         |
| `Mobile checks result`       | `mobile-checks.yml` (lint, prettier, type-check)                   | `apps/mobile`, `packages`, dependencies                           |
| `Mobile unit tests result`   | `mobile-unit-tests.yml`                                            | `apps/mobile`, `packages`, dependencies                           |
| `tx-builder checks result`   | `tx-builder-checks.yml` (lint, prettier, type-check, tests, build) | `apps/tx-builder`, `packages`, dependencies                       |
| `Utils unit tests result`    | `package-utils-unit-tests.yml`                                     | `packages/utils`, `packages/store`, dependencies                  |
| `Isolated E2E result`        | `web-isolated-e2e-backend.yml`                                     | `apps/web`, `apps/tx-builder`, `packages`, `config`, dependencies |

"Dependencies" means `yarn.lock`, `package.json`, `.yarnrc.yml` and `.yarn/patches`. Each workflow also runs when its own file or the shared actions it uses change. The `pr-changes` step of each workflow holds the exact list.
