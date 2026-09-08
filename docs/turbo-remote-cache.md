# Turborepo Remote Cache Setup

One-time administrative setup for the Turborepo remote cache. Day-to-day turbo usage is documented in the root [AGENTS.md](../AGENTS.md).

CI reads `TURBO_TOKEN` (repo secret) and `TURBO_TEAM` (repo variable) via `.github/actions/yarn`. These must be configured once per Vercel team:

1. Create or pick a Vercel team; copy the team slug → set repo variable `TURBO_TEAM`.
2. Create a Vercel personal access token with access to that team → set repo secret `TURBO_TOKEN`.
3. Locally: `yarn turbo login && yarn turbo link` to enable remote cache in development.

Self-hosted cache (e.g. [ducktors/turborepo-remote-cache](https://github.com/ducktors/turborepo-remote-cache)) can be wired by setting `TURBO_API`, `TURBO_TOKEN`, `TURBO_TEAM` — the same env vars the Vercel backend uses.
