# Testing conventions

Cross-cutting unit-test conventions for every workspace — read this before writing or changing any test. Platform-specific test matrices and tooling live in [apps/web/AGENTS.md](../../apps/web/AGENTS.md) (Web Testing) and [apps/mobile/AGENTS.md](../../apps/mobile/AGENTS.md) (Mobile-specific testing); web templates and mock patterns in [apps/web/docs/TESTING.md](../../apps/web/docs/TESTING.md).

- When writing Redux tests, verify resulting state changes rather than checking that specific actions were dispatched.
- **Avoid `any` type assertions** – create properly typed test helpers instead of using `as any` (templates in [apps/web/docs/TESTING.md](../../apps/web/docs/TESTING.md)).
- Use [Mock Service Worker](https://mswjs.io/) (MSW) for tests involving network requests instead of mocking `fetch`. Use MSW for mocking blockchain RPC calls instead of mocking ethers.js directly.
- Create test data with helpers using [faker](https://fakerjs.dev/).
- Test files should be colocated with source files using the `*.test.ts(x)` naming convention.
- No comments above test cases — the `it(...)` name carries the intent, even for regression tests.
