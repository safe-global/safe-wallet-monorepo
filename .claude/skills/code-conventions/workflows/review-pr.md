# PR Review Workflow

Use review-pr mode before opening, finishing, or reviewing a PR in a repository
that has code-convention docs.

This mode starts from the active docs. It zooms into review-learning history
only when a rule is unclear or the agent needs source evidence.

## Inputs

Read the active docs defined in `references/convention-docs-schema.md`.

Do not read `docs/engineering/sources/working/*` unless a specific rule needs
source context or the user asks for traceability.

## Generate Checklist

Regenerate the temporary all-rules checklist file:

```bash
node .claude/skills/code-conventions/scripts/generate-checklist.js
```

The renderer includes every rule in `rules.json`. There is intentionally no
changed-file or area filtering in this mode. Filtering creates a risk that
agents miss cross-cutting rules.

For a focused review, only when the user asks for it, pass explicit projects.
The generated checklist still includes cross-cutting rules with no `project`
or with `project: "general"`:

```bash
node .claude/skills/code-conventions/scripts/generate-checklist.js \
  --project web
```

Default PR review should still generate every rule.

## Step Through Checklist

Open `docs/engineering/pr-self-review-checklist.generated.md` and work through
it from top to bottom. For each rendered rule:

1. Read the rule and check.
2. Decide whether the PR touches that concern.
3. If the rule has `exampleRefs` and the rule applies or is unclear, read the
   referenced example section before deciding.
4. If it applies, answer the check against the actual diff.
5. If the check fails, change the code or document the unresolved issue for the
   user.
6. Mark the generated checklist item as checked after considering it by
   changing `- [ ] Checked` to `- [x] Checked`.
7. Continue until every checklist item is checked.

The goal is not to prove every rule applies. The goal is to make sure every
rule was considered before review.

## Zoom In

Use two levels of zoom only when needed. Do not load the full
`review-learnings.json` into context.

### Level 1: Rule Learnings

If a rule is unclear, fetch only the review learnings mapped to that rule:

```bash
node .claude/skills/code-conventions/scripts/review-learning-lookup.js \
  --rule <RULE-ID>
```

This prints the rule, check, and mapped `RL-*` learning objects. Usually this is
enough context.

### Level 2: GitHub Source

If the distilled learning is still ambiguous, ask the lookup script for GitHub
source commands:

```bash
node .claude/skills/code-conventions/scripts/review-learning-lookup.js \
  --rule <RULE-ID> \
  --github
```

Or for one specific learning:

```bash
node .claude/skills/code-conventions/scripts/review-learning-lookup.js \
  --learning <RL-ID> \
  --github
```

Run only the printed `gh` command that corresponds to the source you need. This
keeps PR review context small while preserving traceability to the original
GitHub discussion.

## Final Response

Tell the user:

- that the generated checklist was completed
- which rules applied
- which rules led to code/doc changes, if any
- any rule IDs where you used Level 1 or Level 2 zoom
- any unresolved rule failures or questions

Keep this concise. Do not paste the full generated checklist unless the user
asks for it.
