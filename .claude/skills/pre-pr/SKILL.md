---
name: pre-pr
description: Run the repo's before-you-open-a-PR checklist (verify pass, tests, regression checklist fields, AGENTS.md updates, self-review, no secrets, visual summary). Use before opening or updating a pull request in this repo.
---

Work through the "Before you open a PR" list in [docs/ai/git-conventions.md](../../../docs/ai/git-conventions.md), in order. For step 1 use the `verify-runner` agent. For step 5 run `/safe-code-review` when that skill is available. Report each step as done, skipped (with the reason) or failed, and don't open the PR while any step has failed.
