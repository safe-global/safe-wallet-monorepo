# Testing conventions

Cross-cutting test conventions for every workspace — read this before writing or changing any test. Platform-specific test matrices and tooling live in [apps/web/AGENTS.md](../../apps/web/AGENTS.md) (Web Testing) and [apps/mobile/AGENTS.md](../../apps/mobile/AGENTS.md) (Mobile-specific testing); web templates and mock patterns in [apps/web/docs/TESTING.md](../../apps/web/docs/TESTING.md).

- When writing Redux tests, verify resulting state changes rather than checking that specific actions were dispatched.
- **Avoid `any` type assertions** – create properly typed test helpers instead of using `as any` (templates in [apps/web/docs/TESTING.md](../../apps/web/docs/TESTING.md)).
- Use [Mock Service Worker](https://mswjs.io/) (MSW) for tests involving network requests instead of mocking `fetch`. Use MSW for mocking blockchain RPC calls instead of mocking ethers.js directly.
- Create test data with helpers using [faker](https://fakerjs.dev/).
- Test files should be colocated with source files using the `*.test.ts(x)` naming convention.

## Clean tests

Hold a test to the same standard as production code: a reader understands it without opening another file. The rules follow chapter 9 of _Clean Code_ and apply to Jest and Playwright alike.

1. **The name is the specification.** It states the behaviour and the condition, so a CI failure says what broke: `returns false when a multiSend sets the official 1.4.1 fallback handler`.
2. **One behaviour per test.** A unit or component test has three parts — build, operate, check — with a blank line between them.
3. **One level of abstraction.** The body reads as the steps of the user or the caller. Locators, polls, render setup and report annotations live in page objects, fixtures and helpers.
4. **No hidden facts.** The test names every fact its result depends on: who is connected, who owns the Safe, which value matters. Shared setup holds only defaults that no result depends on; a test that depends on a value sets it in its body.
5. **Name the data that matters; make the rest random.** A named constant or a small builder for a relevant value (`OFFICIAL_HANDLER`, `singleCallSetting(handler)`), faker for everything else.
6. **Assertions stay in the test.** Helpers and page objects build, find and act; they do not assert. Check the outcome the user or the system cares about, not each step on the way.
7. **No comments.** The name carries the intent, even for regression tests. A test that needs a comment to explain its setup has the setup in the wrong place.
8. **Extract a copy on the second or third time,** into a shared helper — not before. Do not split a long flow only to shorten it: the order of the steps is what the test checks.
9. **Independent and repeatable.** A test sets up all it needs and passes alone, in any order and in parallel. A Playwright test that changes a Safe uses a Safe that no other test reads: one it seeds or creates.

Examples: [UntrustedFallbackHandlerTxAlert.test.ts](../../apps/web/src/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert.test.ts) (unit), [TxShareLink.test.tsx](../../apps/web/src/components/transactions/TxShareLink/TxShareLink.test.tsx) (component), [multisig-confirm.spec.ts](../../apps/web/e2e/tests/e2e/multisig-confirm.spec.ts) (Playwright journey).
