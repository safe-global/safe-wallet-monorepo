# PR reviewer eval: wallet

Which PR reviewer finds the most real problems per unit of cost: one system alone, or a combination?

## Candidates

| ID | Reviewer | Source |
|---|---|---|
| A | `code-conventions` skill, `--review-pr` mode | run locally |
| B | `safe-engineering-plugin:safe-code-review` | run locally |
| C | `@claude review` GitHub workflow | existing PR comments, only where it ran |
| E | Human review | existing PR comments |

(D, `@claude arch-review`, exists only in the CGW repo and is evaluated there.)

**Pins:**
- **A** uses the skill and rules from `valentin/pr-review-learnings-skill` at `73bf04408`. That snapshot covers review history up to 2026-06-02, so it has never seen the eval PRs.
- **B** is recorded by plugin version in each run file.

## PR set

The PR set is the wallet PRs closed between 2026-06-02 and 2026-09-22, listed in `prs.json`.

Each PR is reviewed at one **review SHA**, and A and B run on exactly that commit:
1. **Where C ran:** the commit C reviewed, so all candidates see the same code.
2. **Otherwise:** the commit the first human review was left on.
3. **No review at all:** the head at merge. These PRs measure false positives.

## Running a PR (devs)

1. **Take only your PRs:** we assign each PR to one dev in the ticket checklist. Run only the PRs assigned to you.
2. **Run it:** `eval/run.sh <pr>`. The script:
   - checks out the review SHA in a throwaway worktree;
   - runs A and B in review-only mode, with no edits and no GitHub comments;
   - writes `runs/<pr>/A.json` and `runs/<pr>/B.json`.
3. **Submit:** open a PR into `eval/pr-reviewers` that adds only `runs/<pr>/`, then tick the line in the ticket.

A whole batch runs with `eval/run-batch.sh <batch>`. It skips PRs that already have both run files, so an interrupted batch can simply be started again. The ticket's "Instructions for Claude" section turns this into one prompt: "work on batch N of WA-3632".

Never change prompts, pins or other PRs' folders. Each PR owns its own folder, so parallel PRs never conflict. This branch starts from `dev` and never merges back.

### Run file

```json
{
  "pr": 8363,
  "reviewSha": "…",
  "baseSha": "…",
  "system": "A",
  "version": "73bf04408",
  "model": "claude-opus-5-5",
  "runner": "<github handle>",
  "usage": { "inputTokens": 0, "outputTokens": 0, "cacheReadTokens": 0, "turns": 0, "wallSeconds": 0, "apiEquivalentUsd": 0 },
  "output": "<the reviewer's raw report>"
}
```

`usage` comes from `claude -p --output-format json`. Runs use a Claude Max subscription, so `apiEquivalentUsd` is the comparable cost figure, not money spent.

## Judging (central, after all runs)

1. **Collect:** C and E come from GitHub comments at the review SHA. A and B come from the run files.
2. **Extract findings:** each finding becomes `{ file, line, claim }`, and its source is kept.
3. **Group:** findings about the same problem become one issue, which lists every candidate that found it.
4. **Judge blind:** the judge doesn't see the source and labels each issue real (high, medium or low), nit, or wrong. The judge is checked against about 50 issues a human labels independently.
5. **Escaped defects:** bugs fixed by a later PR in the lines the reviewed PR changed. Did any candidate flag them at review time?

The answer key is every issue judged real, plus the escaped defects. Nobody's comments count as correct by default, humans included.

## Metrics

- **Recall:** the share of real issues a candidate found.
- **Precision:** the share of a candidate's findings that are real.
- **Noise:** findings per PR, and false positives on PRs with no review.
- **Unique catches:** real issues only one candidate found.
- **Overlap and combos:** issues covered and cost for every combination of candidates.
- **Escaped-defect catch rate.**
- **Cost:** tokens and API-equivalent USD for A and B, and time to first review for E.

## Layout

```
eval/
  README.md    this spec
  prs.json     PR number, review SHA, base SHA
  run.sh       runs A and B for one PR
  runs/<pr>/   A.json, B.json (added by devs)
```

Judging scripts and results are added centrally once the runs are in.
