# Before you write a Playwright test

Answer these 4 questions before you write any Playwright test, whether it comes from a ticket, a bug, a PR or a feature. Put the answers in the plan or the PR description. They stop a wrong test before it exists; the rules for the code itself are in [README.md](README.md).

1. **What behaviour does the test show, and what breaks for the user without it?** One sentence each. If nothing meaningful breaks, do not write the test.
2. **Why does it need Playwright?** Name what needs a real browser or several real services together. If nothing does, write a Jest test: [Choose the test level](../../AGENTS.md#choose-the-test-level). If the test mocks with `page.route`, name the path the isolated stack cannot produce.
3. **What data does it need, and where does it come from?** A Safe that the test seeds, a Safe that a scenario prepares, a Safe that the test creates in the UI, or no Safe. If the test seeds or changes a Safe, name its owners and threshold and who is connected at each step; no other test may read that Safe.
4. **What does it not verify?** Name the paths, chains and states the test leaves out, and which lower-level tests cover them.

A missing accessible name, label or loading state that makes a locator hard is a gap in the app, not in the test. Fix it in the app, or list it in the PR ([Developer Testability Contract](developer-testability-contract.md)).
