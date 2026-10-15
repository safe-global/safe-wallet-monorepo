# PR reviewer eval: wallet

How good are AI code reviewers on our own PRs, and against what? This folder holds the full eval for wallet: the PR set, every reviewer run, the judging pipeline, and the final scores. The combined write-up for wallet and CGW is the "What does good mean for an AI reviewer?" report (Claude artifact, shared in the org: https://claude.ai/artifact/UpPisuzY3smjVTSS2fTXq4). The CGW eval lives on the same branch name in safe-client-gateway.

Everything here is reproducible from the files in this folder plus `gh` and the Claude CLI. Every script skips work that already exists, so an interrupted step can simply be run again.

## The problem: there is no ground truth

Nobody has the full list of real problems in a PR. Human reviewers miss things, and AI reviewers raise things a human never would. So the eval uses two imperfect benchmarks and reads them together:

1. **Human reviews (primary).** Of the issues human reviewers raised and authors accepted, how many did each AI reviewer also raise?
2. **Absolute findings.** How many issues does each reviewer raise, and how many does a blind judge confirm against the code?

There is deliberately no "pooled recall" (the share of all issues any reviewer found): a reviewer that raises more issues grows the pool it is scored against, which makes the metric circular. `judge/metrics.js` is that original scorer, kept only for history.

## Candidates

| ID | Reviewer | Source | Pin |
|---|---|---|---|
| A | `code-conventions` skill, `--review-pr` mode | run locally by `run.sh` | skill and rules at `73bf04408` on `valentin/pr-review-learnings-skill` |
| B | `safe-engineering-plugin:safe-code-review` | run locally by `run.sh` | plugin version recorded in each run file |
| C | `@claude review` GitHub workflow | existing PR comments, collected | only on PRs where it ran (`hasC`) |
| E | Human reviewers, first review round | existing PR comments, collected | — |

**A is a held-out snapshot.** A learns its rules from closed PRs' review comments. The pinned snapshot covers review history up to 2026-06-02 only, and every eval PR closed after that date, so A was never scored on PRs it learned from. Do not re-run A with a newer snapshot on these PRs: it would be tested on its own training data.

**B** ran in its default (full) mode on every wallet PR.

## PR set: `prs.json`

61 wallet PRs closed between 2026-06-02 and 2026-09-22, sampled in three size bands. @claude review (C) ran on 24 of them.

Fields: `pr`, `batch`, `band` (size band S/M/L), `lines`, `reviewSha`, `baseSha`, `reviewShaSource`, `hasC`, `title`.

**Review SHA.** Every reviewer is scored on one commit per PR:
1. where an AI reviewer already commented (C), the commit it saw, so all candidates see the same code;
2. otherwise the commit the first human review was left on;
3. with no review at all, the head at merge.

**Force-push correction.** After a force-push GitHub rewrites commit dates, so the first guess was wrong for 7 PRs. `judge/c-commit.js` rebuilds the head the bot saw from the `HeadRefForcePushedEvent.beforeCommit` history (`git rev-list -1 --before=<comment time> <beforeCommit>`). Those PRs were corrected in `prs.json` and A and B were re-run on them.

## Step 1: run the reviewers

```bash
export CLAUDE_BIN=$(which claude)                      # or the path to the Claude CLI
export SAFE_ENG_PLUGIN_DIR=<path to safe-engineering-plugin>
eval/run.sh <pr> ["A B"]      # one PR
eval/run-batch.sh <batch>     # all PRs of a batch; skips PRs that already have both run files
```

`run.sh` checks the review SHA out in a throwaway worktree, runs A and B headless (`claude -p --output-format json`) in review-only mode (no edits, no GitHub comments), and writes `runs/<pr>/A.json` and `B.json`:

```json
{ "pr": 0, "reviewSha": "…", "baseSha": "…", "system": "A", "version": "…", "model": "…", "runner": "<github handle>",
  "usage": { "inputTokens": 0, "outputTokens": 0, "cacheReadTokens": 0, "cacheWriteTokens": 0, "turns": 0, "wallSeconds": 0, "apiEquivalentUsd": 0 },
  "output": "<the reviewer's raw report>" }
```

`apiEquivalentUsd` is the CLI's `total_cost_usd`. The runs used a Claude subscription, so it is an estimate for comparing cost, not money spent.

## Step 2: judge (central, after all runs)

Run from the repo root, in this order. Models are set in each script; `JOBS` sets parallelism. In zsh, pass multi-PR arguments through `bash -c` (zsh does not word-split `$VAR`).

| # | Script | Model | Reads | Writes | What it does |
|---|---|---|---|---|---|
| 1 | `collect.js` | — (`gh`) | GitHub | `runs/<pr>/C.json`, `E.json` | Collects the bot reviews and the first human review round: comments on the first reviewed commit, cut off at the next push. Automated accounts and the PR author are excluded. |
| 2 | `c-commit.js <owner/repo>` | — (`gh`, `git`) | `prs.json` | stdout | Prints PRs whose review SHA is wrong after a force-push. Fix `prs.json`, delete those PRs' A/B runs and results, and re-run them. |
| 3 | `extract.js [pr…]` | Sonnet, no tools | run files | `results/<pr>/findings/<sys>.json` | Rewrites every review into `{file, line, claim}` findings in one neutral voice, so the judge cannot recognise a reviewer by style. |
| 4 | `blind.js` | — | findings | `results/<pr>/blind.json`, `key.json` | Pools all findings of a PR under shuffled ids (seeded by PR number, stable on re-runs) and adds the PR title and description. `key.json` maps id → source and is never shown to the judge. |
| 5 | `judge.js [pr…]` | Opus, read-only on the review SHA | `blind.json` | `results/<pr>/issues.json` | Groups findings about the same problem into issues and labels each against the code: high, medium, low, nit, wrong or unverifiable, with file:line evidence. |
| 6 | `classify.js` | Sonnet, no tools | `issues.json` | adds `category` | Tags each issue (correctness, tests, convention, style, design, docs, product, security, performance), still source-blind. |
| 7 | `humans.js <owner/repo> [pr…]` | Opus, PR conversation + final head | issues, GitHub | `results/<pr>/humans.json` | For every issue raised by E, or raised only by C: did the author accept it (fixed before merge or agreed), reject it, or leave it open; and was it already present at the review SHA? |
| 8 | `score.js` | — | all of the above | `results/score.json`, stdout | Scores both benchmarks and every combination of reviewers. |

To redo a step for a PR, delete its output file and run the step again.

## Scoring (`score.js`)

**Benchmark 1, human reviews.**
- *Strict key*: issues raised by E, accepted by the author, and present at the review SHA. Score = share of the key a reviewer also raised.
- *Broad key*: the same, but also counting issues left open.
- *C-endorsed* (`withC`): adds issues only C raised that the author accepted. C commented before human reviewers on most PRs, and humans rarely repeat what C already said, so the strict key under-counts C; `withC` includes C's own findings and is its upper bound.
- *Combinations*: an issue counts if any member raised it. Combinations with C or D use only the PRs where those ran, so their denominator is smaller.

**Benchmark 2, findings.** Per reviewer: findings, distinct issues, issues per PR, and the share labelled valid, nit or wrong. Counted per issue, so splitting one problem into many findings does not pay.

**Valid** means the judge labelled the issue `medium` or `low`. Known quirk: `high` is not counted as valid (1 issue in wallet, 3 in CGW). The effect is small, but if you re-score, consider adding `high`.

**Judge check.** As a sanity check, the judge's labels on human-accepted issues were compared with the human verdict: it called many of them nits, so it is stricter than our reviewers and the valid shares are conservative. Claude judges Claude reviewers here; neutral extraction reduces, but does not remove, style bias.

## Results (wallet, final)

| Reviewer | Human benchmark (strict) | Issues / PR | Valid / PR | Valid share | Nit | Wrong | $ / PR (est.) |
|---|---|---|---|---|---|---|---|
| A | 9 / 42 (21%) | 6.8 | 4.0 | 59% | 30% | 10% | 1.27 |
| B | 12 / 42 (29%) | 7.5 | 5.7 | 76% | 16% | 7% | 3.84 |
| A + B | 15 / 42 (36%) | 11.4 | 7.3 | 64% | 25% | 9% | 5.11 |
| C (24 PRs) | 6 / 24 (25%); 78% incl. C-endorsed | 6.5 | 2.3 | 36% | 50% | 13% | – |
| E humans | – | 1.1 | 0.4 | 33% | 31% | 21% | – |

Human benchmark: 89 human review comments on 25 PRs gave 67 issues, 52 accepted, 42 of them present at the review SHA. Authors fixed 56 of the 115 issues only C raised (49%) without a human comment.

## Layout

```
eval/
  README.md          this file
  prs.json           PR set and review/base SHAs
  run.sh             runs A and B for one PR
  run-batch.sh       runs a batch
  runs/<pr>/         A.json, B.json (run.sh); C.json, E.json (collect.js)
  results/<pr>/      findings/<sys>.json, blind.json, key.json, issues.json, humans.json,
                     conversation.txt (the PR conversation humans.js reads)
  results/score.json final scores
  judge/             the pipeline scripts above (metrics.js is the superseded pooled-recall scorer)
```

## Extending the eval

- **Another reviewer:** give it a new letter, write `runs/<pr>/<X>.json` in the run-file format, add the letter to the `systems` list in `blind.js` and to the `bots` list in `score.js`, then delete `blind.json`, `key.json` and `issues.json` for the affected PRs and re-run steps 4–8. Adding a reviewer re-groups the issues, so re-judge all of them, not just the new findings.
- **More PRs:** append to `prs.json` with a review SHA chosen by the rules above, run step 1, then steps 1–8 of the judging.
- **Another model for A or B:** change the model in `run.sh`, write the runs under a new letter, and treat them as another reviewer.
- **Next steps** we proposed: build and score a merged A+B reviewer, compare models, have engineers check a sample of the judge's labels, tune B's subagents, test today's A against the Jun 2 snapshot on PRs closed after Sep 22, shadow-run on live PRs, grow the human benchmark, and measure run-to-run variance.
