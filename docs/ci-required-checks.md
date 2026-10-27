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
