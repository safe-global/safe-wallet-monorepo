---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
---

# Writing tests

A summary of the docs below. Change a rule there first, then mirror it here.

- Read [docs/ai/testing-conventions.md](../../docs/ai/testing-conventions.md) before writing or changing a test; for web also [apps/web/docs/TESTING.md](../../apps/web/docs/TESTING.md) (decision matrix, mock patterns, templates).
- Mock network and RPC calls with MSW, not `fetch` or ethers.js mocks. Build test data with faker.
- For Redux, assert the resulting state, not which actions were dispatched.
- No comments above test cases; the `it(...)` name carries the intent.
- In `packages/utils`, `*.integration.test.ts` runs against a live devnet; don't use that suffix there for ordinary unit tests (see `packages/AGENTS.md`).
