---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
---

# Writing tests

- Read [docs/ai/testing-conventions.md](../../docs/ai/testing-conventions.md) before writing or changing a test; for web also [apps/web/docs/TESTING.md](../../apps/web/docs/TESTING.md) (decision matrix, mock patterns, templates).
- Mock network and RPC calls with MSW, not `fetch` or ethers.js mocks. Build test data with faker.
- For Redux, assert the resulting state, not which actions were dispatched.
- No `any` or `as any`; write typed helpers instead.
- No comments above test cases; the `it(...)` name carries the intent.
- Never name an ordinary unit test `*.integration.test.ts` (those run against a live devnet).
