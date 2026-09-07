# Git, commit, and PR conventions

Read this before committing, pushing, opening a PR, or reviewing one. Nothing in this document is needed while writing code — it is loaded on demand at git/PR time.

Rules are addressable as `<doc>.<section>.<rule>` — General Principles is 1, Testing Conventions is 2, When to Extract a Function is 3, Nomenclature is 4, this document is 5. Numbers are append-only: a new rule takes the next free number in its section, and nothing is ever renumbered, so a reference stays valid.

## 5.1 Citing the PR

- **5.1.1 — Every reference to the PR under review is a markdown link to the exact lines.** If a review points at something in the diff, I have to be able to click it and land on it. "`it.each` appears four times" is not usable as plain text: I would have to go and find all four myself. Link each one. This holds for anything the review names — code, test names, comments, the PR description, commit messages.

  Use a permalink to the head commit with a line range: `https://github.com/<owner>/<repo>/blob/<head-sha>/<path>#L<from>-L<to>`. A blob link at a SHA still resolves after new commits land; a link into the PR's Files tab does not. Link a commit by its own SHA URL.

  One link per place, not one link for the group. If a claim covers four sites, that is four links.

## 5.2 Commits

- **5.2.1 — Pre-commit hooks (Husky):** **pre-commit** runs `lint-staged` (**prettier only — no type-check at commit time**); **pre-push** runs linting (set `RUN_TESTS_ON_PUSH=true` to also run tests).
- **5.2.2 — Commit messages** use [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/) as described in [CONTRIBUTING.md](../../CONTRIBUTING.md).
- **5.2.3 — CI/CD changes always use `chore:`** — CI, workflows, build configs (NEVER `feat:` or `fix:`).
- **5.2.4 — Test changes always use `tests:`** — changes in unit or e2e tests (NEVER `feat:` or `fix:`).

## 5.3 Pull requests

- **5.3.1 — Fill the GitHub PR template completely.** [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) owns the section skeleton — every PR uses its structure, no sections skipped, and all checks must pass. How to fill each section:
  - **What it solves** — link the issue or ticket (`Resolves #<n>` / the Linear ID), one sentence on the user-visible problem.
  - **How this PR fixes it** — the approach and any non-obvious decision, a few sentences; not a file-by-file diff narration.
  - **How to test it** — concrete steps a reviewer can follow, starting from which Safe/chain/state to use.
  - **Affected flows / Blast radius / Risks — not checked** — carry these over from the pre-implementation regression checklist (root [AGENTS.md](../../AGENTS.md), Workflow section); do not re-derive them from the diff.
  - **Checklist** — tick honestly; an unticked box with a reason beats a false tick.
- **5.3.2 — Visual summary is required.** Every PR must include a visual in the `## Visual summary` section — mandatory, not optional:
  - **Architecture/logic changes** → Mermaid diagram (flowchart, sequence, or class diagram) showing what changed — GitHub renders mermaid natively
  - **UI changes** → Screenshot of the result (use Chrome DevTools MCP if the app is running, or describe how to capture manually)
  - **Both** if the PR includes UI + logic changes
