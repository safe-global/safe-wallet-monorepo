# TX-Builder Release Procedure

The tx-builder is a Safe App served at `https://apps-portal.safe.global/tx-builder`. It has three deployment environments, each triggered automatically by the CI workflow (`.github/workflows/tx-builder-deploy.yml`).

## Environments

| Environment | URL                                             | Trigger            | Base path      |
| ----------- | ----------------------------------------------- | ------------------ | -------------- |
| PR Preview  | `https://{branch}--tx-builder.review.5afe.dev/` | Pull request       | `/`            |
| Staging     | `https://tx-builder.staging.5afe.dev/`          | Push to `dev`      | `/`            |
| Production  | `https://apps-portal.safe.global/tx-builder`    | Manual (see below) | `/tx-builder/` |

## PR Preview

Any pull request that touches `apps/tx-builder/**` or `packages/**` automatically builds and deploys a preview.

- The preview URL is posted as a comment on the PR
- The build uses the default base path (`/`), same as staging
- Previews are cleaned up when the branch is deleted

No action required from developers — this happens automatically.

## Staging

When code is merged to the `dev` branch (and touches tx-builder or shared packages), the staging deployment runs automatically.

- Served at `https://tx-builder.staging.5afe.dev/`
- Uses the default base path (`/`)
- No version bump needed — staging always reflects the latest `dev`

## Production Release

Production releases are a two-step process: the developer prepares a release, then DevOps deploys it.

### Step 1: Prepare the release

1. **Bump the version** in `apps/tx-builder/package.json`
2. **Merge the version bump** to `dev` via PR
3. **Run the workflow**: Go to [Actions > tx-builder Deploy](https://github.com/safe-global/safe-wallet-monorepo/actions/workflows/tx-builder-deploy.yml), click "Run workflow" on the `dev` branch with `release` checked

The workflow will:

- Build the app with `VITE_BASE_PATH=/tx-builder/` (so assets resolve from the `/tx-builder/` subdirectory)
- Create a `.tar.gz` archive of the build
- Create a git tag (`tx-builder-v{VERSION}`)
- Create a GitHub Release with the archive attached and a changelog filtered to tx-builder commits

### Step 2: Deploy to production

Provide the release tag to DevOps for production deployment.

## Base Path

Production serves the app from a subdirectory (`/tx-builder/`), while staging and previews serve from the root (`/`). This is handled by the `VITE_BASE_PATH` environment variable in `vite.config.ts`:

- **Not set** (default): `base: '/'` — staging and PR previews
- **Set to `/tx-builder/`**: assets are prefixed with `/tx-builder/` and `BrowserRouter basename` adjusts accordingly

Only the `prepare-release` workflow job sets this variable. Staging and preview builds are unaffected.

## Release Tags

All tx-builder releases are tagged as `tx-builder-v{VERSION}` (e.g., `tx-builder-v2.0.0`). This distinguishes them from web app releases (`web-v{VERSION}`) in the shared monorepo.

## Rollback

To roll back to a previous version, ask DevOps to download and deploy the `.tar.gz` from an earlier GitHub Release. All past releases are available at [github.com/safe-global/safe-wallet-monorepo/releases](https://github.com/safe-global/safe-wallet-monorepo/releases) (filter by `tx-builder-v` tags).
