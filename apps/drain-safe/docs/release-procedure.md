# Drain Account Release Procedure

Drain Account is a Safe App served at `https://apps-portal.safe.global/drain-safe`. It has three deployment environments, each triggered automatically by the CI workflow (`.github/workflows/drain-safe-deploy.yml`).

## Environments

| Environment | URL                                             | Trigger            | Base path      |
| ----------- | ----------------------------------------------- | ------------------ | -------------- |
| PR Preview  | `https://{branch}--drain-safe.review.5afe.dev/` | Pull request       | `/`            |
| Staging     | `https://drain-safe.staging.5afe.dev/`          | Push to `dev`      | `/`            |
| Production  | `https://apps-portal.safe.global/drain-safe`    | Manual (see below) | `/drain-safe/` |

## PR Preview

Any pull request that touches `apps/drain-safe/**` or `packages/**` automatically builds and deploys a preview.

- The preview URL is posted as a comment on the PR
- The build uses the default base path (`/`), same as staging
- Previews are cleaned up when the branch is deleted

No action required from developers — this happens automatically.

## Staging

When code is merged to the `dev` branch (and touches drain-safe or shared packages), the staging deployment runs automatically.

- Served at `https://drain-safe.staging.5afe.dev/`
- Uses the default base path (`/`)
- No version bump needed — staging always reflects the latest `dev`

## Production Release

Production releases are a two-step process: the developer prepares a release, then DevOps deploys it.

### Step 1: Prepare the release

1. **Bump the version** in `apps/drain-safe/package.json`
2. **Merge the version bump** to `dev` via PR
3. **Run the workflow**: Go to [Actions > drain-safe Deploy](https://github.com/safe-global/safe-wallet-monorepo/actions/workflows/drain-safe-deploy.yml), click "Run workflow" on the `dev` branch with `release` checked

The workflow will:

- Build the app with `VITE_BASE_PATH=/drain-safe/` (so assets resolve from the `/drain-safe/` subdirectory)
- Create a `.tar.gz` archive of the build
- Create a git tag (`drain-safe-v{VERSION}`)
- Create a GitHub Release with the archive attached and a changelog filtered to drain-safe commits

### Step 2: Deploy to production

Provide the release tag to DevOps for production deployment.

## Base Path

Production serves the app from a subdirectory (`/drain-safe/`), while staging and previews serve from the root (`/`). This is handled by the `VITE_BASE_PATH` environment variable in `vite.config.ts`:

- **Not set** (default): `base: '/'` — staging and PR previews
- **Set to `/drain-safe/`**: assets are prefixed with `/drain-safe/`

Only the `prepare-release` workflow job sets this variable. Staging and preview builds are unaffected.

## Release Tags

All drain-safe releases are tagged as `drain-safe-v{VERSION}` (e.g., `drain-safe-v2.0.0`). This distinguishes them from web app releases (`web-v{VERSION}`) in the shared monorepo.

## Rollback

To roll back to a previous version, ask DevOps to download and deploy the `.tar.gz` from an earlier GitHub Release. All past releases are available at [github.com/safe-global/safe-wallet-monorepo/releases](https://github.com/safe-global/safe-wallet-monorepo/releases) (filter by `drain-safe-v` tags).
