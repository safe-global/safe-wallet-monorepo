# Compound Workflow

Use compound mode for forward maintenance from closed PR review discussions
after the currently covered range.

## Non-Negotiables

- Read every fetched comment. Do not sample, summarize by top-N PRs, or rely on
  a subagent summary instead of reading the corpus.
- Include closed PRs, not only merged PRs. Closed-unmerged PRs often contain
  useful negative evidence, abandoned approaches, or review friction.
- Use PR lifecycle state only as context. Read the comments and infer what
  happened; do not mechanically classify merged PRs as "prefer" and unmerged
  PRs as "avoid."
- **Bot review comments are evidence ONLY when a human accepted the
  suggestion.** Bots include `cursor[bot]`, `chatgpt-codex-connector[bot]`,
  `claude[bot]`, `coderabbitai[bot]`, `Copilot`, and similar reviewers. A bot
  finding without human acceptance must not be cited as
  `reviewCommentIds`/`reviewIds`/`issueCommentIds` and must not become a
  learning on its own. See "Bot Acceptance" below for what counts as
  acceptance.
- Generalize each concrete review issue into a reusable engineering rule/check
  that can be checked before PR review.
- Prefer mapping to an existing `rules.json` ID and active-doc section. If a
  learning is already covered, map it or tighten the existing rule/check instead
  of adding a near-duplicate rule.
- Never duplicate guidance. Tighten, merge, or add examples to existing
  sections when possible.
- Keep `rules.json` finite. It should contain durable pre-PR checks, not every
  review comment.
- Never delete existing guidance silently. Flag obsolete guidance to the user
  instead.

## Bot Acceptance

Bot review comments often surface real lessons but they are not durable on
their own. A bot finding becomes evidence only when a human accepted it. Treat
any of the following as acceptance:

1. **Author or human reviewer reply** confirming the change in the same thread:
   `addressed in <sha>`, `good catch`, `fixed`, `done`, or equivalent.
2. **Follow-up commit** visible in the PR thread that touches the file or area
   the bot pointed at, posted after the bot comment. Verify the commit exists
   (`gh api repos/<repo>/pulls/<PR>/commits`) and that its diff matches the
   bot's recommendation.
3. **Merged PR with the suggested fix in the diff.** Verify with
   `gh api repos/<repo>/pulls/<PR>/files`; the merged code must actually carry
   the change the bot proposed. A merged PR alone is not enough — the fix has
   to be there.
4. **Replacement PR with the fix.** When a closed-unmerged PR was replaced by
   another PR (look for "superseded by", "replaces #N", or the next PR in
   the same series), check the replacement PR's merged diff. If the bot's
   suggestion landed there, treat the original as accepted via replacement.

What does NOT count as acceptance:

- The bot's own follow-up summary or "potential issues" tally.
- The author rebutting or dismissing the comment.
- A merged PR whose diff does not actually contain the suggested change
  (silent dismissal).
- A closed-unmerged PR whose replacement took a different architectural path
  rather than landing the bot's specific fix.

When in doubt, discard. The system tolerates missing learnings; it does not
tolerate fabricated authority. If a bot comment contains a clearly reusable
lesson but you cannot confirm acceptance, leave it out and move on.

## Args

- `--repo owner/repo` - default: detect from `git remote get-url origin`
- `--since ISO-8601` - override the ledger-derived start timestamp
- `--until ISO-8601` - default: current UTC timestamp

## Covered Range

Use bounded windows that can be fully read. The default window size may be seven
days, but that is an execution choice, not the ledger model. Shrink or expand
the window based on comment volume. Use a higher overlap rather than risking
missed PRs. The default overlap should be at least two hours.

Forward mode:

1. `since = coveredClosedAtRange.end - overlapHours`
2. `until = --until` if passed, otherwise current UTC timestamp
3. If the window is too large to read fully, choose a bounded `until` inside
   that range and continue in a later run.

## Fetch Comments

Run:

```bash
bash .claude/skills/code-conventions/scripts/fetch-pr-comments.sh \
  --repo "<repo>" \
  --since "<since>" \
  --until "<until>" \
  --out "<tmpfile>"
```

The script fetches full comment history for every closed PR in the window:

- inline review comments from `/pulls/{pr}/comments`
- review bodies from `/pulls/{pr}/reviews`
- PR conversation comments from `/issues/{pr}/comments`

The fetcher must fail on partial corpora. Do not continue if any PR comment
surface fails.

The fetched corpus can contain private review text and code snippets. Keep it
in a private temporary path, do not commit it, and delete it after the
distillation is complete.

## Load Context

Read the active docs, working docs, and raw review-learning inputs defined in
`references/convention-docs-schema.md` before distilling.

Read raw review-learning files when present. They are maintenance inputs only.
Do not add or keep normal-agent routing that tells coding agents to read them
directly.

## Distill

For every reusable learning extracted from the fetched comments:

1. Identify the concrete review issue.
2. Apply the schema-defined review-learning boundary and ID rules.
3. Generalize it into a reusable engineering rule that applies beyond that
   exact PR/module.
4. Prefer updating an existing `RL-*` object when the new feedback is the same
   reusable learning. Add the new PR/comment source IDs to that object instead
   of creating a near-duplicate learning.
5. Create a new `RL-*` object only when the feedback contains a distinct
   reusable lesson.
6. Record the GitHub source IDs that fed this learning. The fetcher prints
   each comment header with `id=<n>`, `<author>`, and `<surface>`
   (`inline-review-comment`, `review-body`, or `pr-conversation-comment`).
   Map each contributing entry to its array on the `RL-*` object:
   - `inline-review-comment` → `reviewCommentIds`
   - `review-body` → `reviewIds`
   - `pr-conversation-comment` → `issueCommentIds`
     At least one of these three arrays must be non-empty for any learning whose
     `sourceWindowId` starts with `CLOSED-`. Also append every cited PR number
     to `prNumbers`. The validator rejects `CLOSED-*` learnings without source
     IDs. **Before recording a bot-authored comment ID** (`*[bot]`, `Copilot`),
     verify a human accepted it per the "Bot Acceptance" rules above. If
     acceptance cannot be confirmed, do not cite the bot comment, and do not
     create a learning whose only evidence is unaccepted bot feedback.
7. Map the learning to an existing rule ID if possible. This is the default
   target for every review learning.
8. If the existing rule/check almost covers the learning, refine it. If no rule
   covers it, create a general rule that would catch the same class of issue
   before PR review. Keep the rule list short and encompassing.
9. If any contributing comment includes a code diff or snippet, lift that
   shape into a generalized example in `examples/<topic>.md` (or
   `<project>/examples/<topic>.md` in monorepos) using the
   `Avoid` / `Prefer` / `Why` structure. Strip feature-specific names but
   keep the structural shape, cap each block at ~20 lines, and reference the
   originating PR(s) and `RL-*` ID at the top of the block. Update
   `exampleRefs` on the matching rule to point at the new heading. Skip this
   step only when the source comments are one-sentence prose with no reusable
   code shape. See `references/convention-docs-schema.md` Example Doc
   Responsibilities and Example Anatomy.
10. Add or update active guide text only when the learning affects daily coding
    behavior.
11. Add or update the rule/check object. Keep `rule` durable and `check`
    action-oriented.
12. Keep rule-to-learning links bidirectional. If a learning's `ruleIds`
    cites a rule, that rule's `reviewLearningIds` must cite the learning, and
    vice versa. Cardinality is unchanged: a rule may have zero, one, or many
    learnings, and a learning may map to multiple rules. Empty
    `reviewLearningIds` is fine — rules can exist without PR evidence yet.
13. If the team preference is unclear, add an entry to
    `working/open-question-options.md` instead of inventing a hard rule. Still
    add a rule only if there is an actionable conservative check.

## Update Ledger

- Forward mode updates `coveredClosedAtRange.end` to `<until>` and leaves
  `coveredClosedAtRange.start` unchanged if it already exists.
- If the ledger is new, set `coveredClosedAtRange` to the analyzed window.
- Do not store PR-number ranges. PR numbers are creation ordered, not closed
  ordered, and they are not needed for resumability.

## Validate

Run the validation commands from `SKILL.md`. The run is not complete until they
pass.
