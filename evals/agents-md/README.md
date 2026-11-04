# AGENTS.md evals

Every rule in `AGENTS.md` must change what an agent does. These evals check that. Each case runs the same prompt twice with Claude Code:

- **Control:** every `AGENTS.md` and `CLAUDE.md` file is removed from the checkout.
- **Experiment:** the checkout is left as it is.

A second Claude call, run outside the repository and not told which run it is looking at, grades the diff of each run against the case's expected behaviour. A case passes only when the control fails and the experiment passes. If the control already passes, the model does the right thing without the rule, and the rule is not needed.

## Changing AGENTS.md

A pull request that changes an `AGENTS.md` or `CLAUDE.md` file must also add or change at least 5 cases in `cases/`, and all cases must pass. The `AGENTS.md evals result` check enforces both. When the model changes, cases may start to fail; update the rules or the cases until they pass again.

To add a rule:

1. Pick a rule ID in capitals, such as `MARKUP_IN_PACKAGES_VIEWS`, and start the rule's line in `AGENTS.md` with it: ``- `MARKUP_IN_PACKAGES_VIEWS` **Put as much markup…**``.
2. Write at least 5 prompts that make it likely the agent breaks the rule without it. Each prompt is one case.
3. Write the expected behaviour that the judge checks the diff against, including when to fail.
4. Commit, and run the evals.

The runner stops before calling the model when a rule has no case folder, a case folder has no rule, or a rule has fewer than 5 cases.

## Case format

One JSON file per case in `cases/<RULE_ID>/`. Results show a case as `<RULE_ID>/<file name>`, for example `MARKUP_IN_PACKAGES_VIEWS/chain-badge`.

```json
{
  "prompt": "The task given to the agent.",
  "expectation": "What the diff must do to pass, and when it fails."
}
```

## Running

The runner needs the `claude` CLI and an `ANTHROPIC_API_KEY`. It checks out `HEAD` into temporary git worktrees, so commit your changes first. Each case runs the agent twice and the judge twice.

```bash
node evals/agents-md/run.mjs                                          # all cases
node evals/agents-md/run.mjs MARKUP_IN_PACKAGES_VIEWS                 # all cases of one rule
node evals/agents-md/run.mjs MARKUP_IN_PACKAGES_VIEWS/chain-badge     # one case
AGENTS_EVAL_MODEL=sonnet node evals/agents-md/run.mjs
```

The agent may only use `Read`, `Edit`, `Write`, `Glob` and `Grep`, so it cannot run commands.
