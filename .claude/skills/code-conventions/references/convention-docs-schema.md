# Convention Docs Schema

Use this schema as the shared contract for all `code-conventions` workflows.
Adapt sections and examples to the repository. The invariant is the split
between active docs for daily work and working docs for maintenance.

## Output Classes

Active docs are read by normal coding agents (live under `conventions/`):

- `docs/engineering/README.md`
- `docs/engineering/conventions/project-structure.md`
- `docs/engineering/conventions/<project>/project-structure.md` for
  project-specific structure (optional, where the monorepo separates them)
- `docs/engineering/conventions/<topic>.md` for the organized per-topic
  reference (e.g. `conventions/testing.md`)

Sources are committed audit-trail artifacts, read for backref but not by daily
coding agents:

- `docs/engineering/sources/rules.json` (canonical PR rule checklist)
- `docs/engineering/sources/rules.generated.md` (generated from `rules.json`;
  do not edit by hand)
- `docs/engineering/sources/examples/**/*.md` for cross-project code shape
  examples
- `docs/engineering/sources/<project>/examples/**/*.md` for project-specific
  code shape examples
- `docs/engineering/sources/rules.schema.json` (schema for `rules.json`)
- `docs/engineering/sources/working/review-learnings.schema.json` (schema for
  review learnings)

Working docs are read by this convention skill (bot-only):

- `docs/engineering/sources/working/module-inventory.md`
- `docs/engineering/sources/working/open-question-options.md`
- `docs/engineering/sources/working/review-learnings.json`
- `docs/engineering/sources/working/review-learning-ledger.json`
- raw or legacy review-learning files such as `REVIEW_LEARNINGS.md`

Normal-agent routing should point to `conventions/*` only. Sources and
`sources/working/*` are evidence/audit-trail, not daily coding guides.

## Recommended Directory Structure

```text
docs/engineering/
  README.md
  conventions/
    project-structure.md
    testing.md
    web/
      project-structure.md
    mobile/
      project-structure.md
  sources/
    rules.json
    rules.schema.json
    rules.generated.md
    examples/
      general/
        schemas-and-validation.md
        testing.md
        mocks.md
        database.md
    web/
      examples/
        features.md
    mobile/
      examples/
        permissions.md
    working/
      module-inventory.md
      open-question-options.md
      review-learnings.json
      review-learnings.schema.json
      review-learning-ledger.json
```

`conventions/` is the action layer (what to read when coding). `sources/` is
the audit trail (rules + examples + working). Monorepos add supplementary
placement guides under `conventions/<project>/project-structure.md`; keep the
rule checklist centralized in `sources/rules.json`; put project-specific
examples inside that project's folder under `sources/`, for example
`sources/web/examples/feature-boundaries.md`.

The `examples/` filenames above are recommendations, not a fixed taxonomy.
Adapt the example files to the repo's framework and review surface. A backend
might use `sources/examples/repositories.md` and `sources/examples/testing.md`;
a wallet monorepo might use `sources/examples/general/hooks-and-state.md`,
`sources/web/examples/features.md`, `sources/mobile/examples/permissions.md`,
and `sources/examples/general/testing.md`.

## Invariants

- Active docs are for daily coding work.
- Working docs are for research, evidence, unresolved questions, and ledger
  state.
- Normal coding agents read `project-structure.md` before coding and run the
  all-rules checklist before opening or finishing a PR.
- `rules.json` is the canonical active rule checklist. Each object owns both
  the durable rule and the executable pre-PR check.
- `rules.schema.json` validates the rule data contract. It is a machine
  contract, not a normal active reading doc.
- `rules.generated.md` is generated from `rules.json`, committed, and used for
  human reading. Do not edit it by hand; edit `rules.json`, then regenerate
  `rules.generated.md`.
- Generated PR checklist Markdown is temporary. Agents use it to mark off
  checks during PR review. Do not commit generated checklist output.
- Rules may point to richer Markdown examples when a sentence is not enough.
  Keep multiline code snippets in Markdown example files, not in JSON fields.
- This skill owns working docs, rules updates, and review-learning
  distillation.
- A review learning is one reusable lesson distilled from review feedback. Do
  not mechanically map one comment to one learning: split a comment when it
  contains unrelated lessons, or merge nearby comments when they express the
  same lesson.
- Concrete PRs and comments are source evidence in
  `working/review-learnings.json`, not daily documentation.
- Every review learning maps to at least one rule ID in `rules.json`.
  Prefer mapping to an existing rule. If the learning is almost covered, tighten
  that rule/check. Add a new rule only when no existing rule can honestly cover
  the learning.
- Active-doc updates explain where/how a rule applies. Open questions are for
  unsettled team preferences that cannot become an actionable rule yet.

## Source Window IDs

Use source-window IDs for fetch windows, not for review learnings:

- `CLOSED-YYYYMMDD-YYYYMMDD` for a closed-at PR range.
- `HIST-YYYYMMDD` for historical/manual/user-provided input that was not
  fetched from a closed-at PR range.

Source-window IDs belong in the ledger and in `working/review-learnings.json`.
Do not use them as learning IDs, rule IDs, or active-doc headings.

## Review Learning IDs

Use stable review-learning IDs in `working/review-learnings.json`:

- `RL-YYYYMMDD-NNN`

The date is the PR closed date. `NNN` is a zero-padded sequence for learnings
from PRs closed on that date. For manual or historical inputs without a PR
closed date, use the input/source date. Keep IDs stable after assignment.
References to learnings should stay short: use the `RL-*` ID in `rules.json`,
`rules.generated.md`, generated checklists, and PR review output. The full
source context lives in `review-learnings.json` and can be fetched with
`review-learning-lookup.js`.

## Rule IDs

Use stable rule/check IDs in `rules.json`, such as `MOD-01`, `DB-02`, or
`API-03`. The prefix should match a review trigger or coding area in the repo.

Rule IDs belong in:

- `rules.json`
- `rules.generated.md`
- `working/review-learnings.json` `ruleIds`
- generated checklist output

Rule IDs do not belong in `project-structure.md` headings.

## JSON Files

`docs/engineering/sources/rules.json` is the canonical active rule checklist.
It is an array of objects:

```json
[
  {
    "id": "TYPE-02",
    "area": "schemas",
    "title": "Prefer union schemas for alternate request shapes",
    "rule": "Model distinct request shapes as a union instead of cross-field refine when possible.",
    "check": "Did I model alternate request shapes as a union?",
    "exampleRefs": ["examples/schemas.md#union-shapes"],
    "reviewLearningIds": ["RL-20260507-001"]
  }
]
```

Field intent:

- `id`: stable rule/check ID, for example `MOD-01`
- `project`: optional monorepo project or subtree, such as `web`, `mobile`,
  `tx-builder`, or `packages`. Omit it in single-project repos or when the repo
  has no useful project split. Use `general` for cross-cutting monorepo rules
  when that is clearer than omitting the field.
- `area`: short grouping such as `modules`, `database`, `api`, `cache`
- `title`: human-readable title
- `rule`: durable repo preference
- `check`: executable question/action to run before PR
- `exampleRefs`: compact refs relative to `docs/engineering/sources/`, such as
  `examples/general/testing.md#faker-values` or
  `mobile/examples/permissions.md#settings-button`; empty array if no example
  is needed. In monorepos, project-specific examples live under the matching
  project folder under `sources/` (e.g. `sources/web/examples/`,
  `sources/mobile/examples/`).
- `reviewLearningIds`: `RL-*` IDs that informed this rule

`docs/engineering/sources/working/review-learnings.json` is the source learning store.
It is an array of objects.

Example for a learning derived from a fetched window of closed PRs (`CLOSED-*`):

```json
[
  {
    "id": "RL-20260507-001",
    "title": "Use union schema for address-or-email invite shapes",
    "sourceWindowId": "CLOSED-20260505-20260507",
    "prNumbers": [3065],
    "prState": "merged",
    "reviewCommentIds": [2147483601, 2147483602],
    "reviewIds": [987654321],
    "issueCommentIds": [],
    "learning": "When a DTO accepts address-or-email alternatives, a union schema expresses the wire contract better than cross-field refine.",
    "ruleIds": ["TYPE-02"]
  }
]
```

Example for a manual historical learning (`HIST-*`) with no GitHub source:

```json
[
  {
    "id": "RL-20251201-001",
    "title": "Stable ordering for batched signature requests",
    "sourceWindowId": "HIST-20251201",
    "prNumbers": [],
    "prState": "n/a",
    "reviewCommentIds": [],
    "reviewIds": [],
    "issueCommentIds": [],
    "learning": "...",
    "ruleIds": ["BATCH-01"]
  }
]
```

Field intent:

- `id`: stable `RL-*` ID
- `title`: short human label used by generated views and lookup output
- `sourceWindowId`: `CLOSED-*` for entries derived from a fetched window, or
  `HIST-*` for manually authored historical learnings
- `prNumbers`: PR numbers. Required non-empty for `CLOSED-*` learnings; may be
  empty for `HIST-*` entries that don't link to any PR
- `prState`: lifecycle context such as `merged` or `closed`. Use `n/a` for
  `HIST-*` entries with no PR
- `reviewCommentIds`: GitHub review comment IDs (from `/pulls/{pr}/comments`)
- `reviewIds`: GitHub review IDs (from `/pulls/{pr}/reviews`)
- `issueCommentIds`: GitHub issue comment IDs (from `/issues/{pr}/comments`)
- `learning`: concrete review issue plus the reusable interpretation
- `ruleIds`: `rules.json` IDs that integrate the learning

For every `CLOSED-*` learning, **at least one of `reviewCommentIds`,
`reviewIds`, or `issueCommentIds` must be non-empty** so the learning is
traceable to its source feedback. This is enforced by
`validate-convention-docs.js`. `HIST-*` learnings have no GitHub source and
may leave all three arrays (and `prNumbers`) empty.

The mapping is intentionally bidirectional: every `review-learnings.json`
`ruleIds` value must appear in the corresponding `rules.json`
`reviewLearningIds` array, and every `rules.json` `reviewLearningIds` value
must point back to the rule from the learning object. This keeps rules
searchable without loading the whole review-learning file.

Do not store full GitHub URLs or fetched comment bodies in JSON. Agents and
humans can use `prNumbers` and the GitHub source ID arrays to reconstruct URLs
or fetch source details with `gh api`.

## JSON Schemas

Commit JSON Schema files next to their data files:

- `docs/engineering/sources/rules.schema.json`
- `docs/engineering/sources/working/review-learnings.schema.json`

The schema files are the machine-readable contract for humans, agents, and
validators. Keep them strict: required fields, typed arrays, ID patterns, and
`additionalProperties: false`.

## Ledger Shape

Store one contiguous covered closed-at range, not PR-number ranges:

```json
{
  "dateField": "closedAt",
  "state": "closed",
  "coveredClosedAtRange": {
    "start": "2026-04-28T11:48:12Z",
    "end": "2026-05-05T13:48:12Z"
  },
  "overlapHours": 2,
  "lastRun": {
    "mode": "backfill",
    "repo": "safe-global/safe-client-gateway",
    "sourceWindowId": "CLOSED-20260428-20260505",
    "since": "2026-04-28T11:48:12Z",
    "until": "2026-05-05T13:48:12Z",
    "prs": 12,
    "comments": 189,
    "learnings": 17,
    "fetchedAt": "2026-05-05T13:48:27Z"
  }
}
```

Backfill expands `coveredClosedAtRange.start` backward. Forward compound runs
expand `coveredClosedAtRange.end` forward. Keep fetch windows bounded to what
can be fully read, but do not encode "weekly" as the ledger model.

## Active Doc Responsibilities

`README.md`:

- route normal agents to `project-structure.md`
- tell agents to run the all-rules checklist before opening or finishing a PR
- do not route normal agents to raw review-learning files or `working/*`

`project-structure.md`:

- daily project structure and placement guide
- describes where code belongs and which existing shapes are safe to copy
- changes only when guidance affects daily placement or structure decisions
- may be supplemented by app/package-specific structure guides in monorepos

`rules.json`:

- canonical finite active rule checklist
- one object per durable rule/check
- includes enough metadata for agents to run all active checks and trace rules
  back to review learnings
- links to example docs when code shape, prefer/avoid snippets, or nuanced
  rationale are needed

`rules.generated.md`:

- generated human-readable view of `rules.json`
- committed so humans and agents can scan rules without reading raw JSON
- must be regenerated after editing `rules.json`

## Example Doc Responsibilities

`examples/**/*.md`:

- active docs for small, curated code examples derived from real review
  feedback; this is the implementation shape/code-convention layer of the
  system
- organized by repo-relevant topic, not by `RL-*` ID
- examples come from PR review comments, not from invented prose. When a
  contributing comment ships with a diff or snippet, lift that shape into the
  example. Do not paraphrase a code idea you did not see in the corpus
- every example block must trace back to its source review learning. State
  the originating PR(s) and `RL-*` ID at the top of each block, e.g.
  `Source: PR #2884 (RL-20260506-002)`
- use the `Avoid` / `Prefer` / `Why` structure whenever the source comment
  contributed concrete code. A one-sentence rule plus durable check is rarely
  enough; the example is what an agent reaches for when the rule alone is
  ambiguous
- generalize: strip feature-specific names, types, and module paths; keep the
  structural shape. Replace project-specific identifiers (`SafeV2`,
  `maxSequentialPages`) with neutral placeholders (`Entity`, `maxPageCount`)
  when the lesson is not specific to that name
- include only the minimum code needed to convey the shape. Aim for under
  ~20 lines per `Avoid`/`Prefer` block; if more is needed, the example is
  probably trying to teach two lessons and should be split
- a learning whose source comments are one-sentence prose with no reusable
  code shape does not need an example. Leave the rule's `exampleRefs` empty
  rather than padding with prose
- update `exampleRefs` on every rule whose example is added, renamed, or
  moved, so the rule points at the right anchor
- change only when an example would improve future coding behavior
- do not invent an example when the team preference is unclear; add a concrete
  option to `working/open-question-options.md` instead

Adapt the example structure to the project. Possible topic files include:

- `schemas-and-validation.md`
- `testing.md`
- `mocks.md`
- `database.md`
- `controllers-and-swagger.md`
- `features-and-hooks.md`

## Example Anatomy

Each example block in `examples/**/*.md` should follow this shape:

````markdown
## TEST-01 — Use a builder for repeated entity fixtures

Source: PR #2884, #2883 (RL-20260506-002)

### Avoid

```ts
const entity: Entity = {
  field1: getAddress(faker.finance.ethereumAddress()),
  field2: faker.string.uuid(),
  field3: [getAddress(faker.finance.ethereumAddress())],
}
```

### Prefer

```ts
const entity = entityBuilder().with('field1', specificAddress).build()
```

### Why

Copy-pasted literals drift across tests as the entity shape evolves. The
repo's `Builder<T>.with(field, value)` pattern keeps a single source of truth
for each shape and lets a test override only the fields it cares about.
````

The heading is the rule ID plus a short title. The `Source:` line ties the
example back to the originating PR(s) and `RL-*` so future maintainers can read
the original review feedback without grepping. `Avoid` and `Prefer` blocks
should be paired and small. `Why` is one short paragraph.

## Generated PR Checklist

`docs/engineering/pr-self-review-checklist.generated.md` is a generated,
temporary checklist view of `rules.json`. It is used by `--review-pr` mode so
an agent can mark every rule as checked while reviewing a PR.

Setup must add this path to the repo's `.gitignore`:

```text
docs/engineering/pr-self-review-checklist.generated.md
```

Do not maintain this file by hand and do not commit it. Regenerate it from
`rules.json` whenever running PR review mode.

## Working Doc Responsibilities

`working/module-inventory.md`:

- research inventory used to produce `project-structure.md`

`working/review-learnings.json`:

- durable review-learning objects with stable `RL-*` IDs
- compact GitHub source IDs and a reusable learning
- maps each learning to rule IDs
- also stores manual historical learnings created from answered open questions

`working/review-learning-ledger.json`:

- machine-readable closed-PR range state

`working/open-question-options.md`:

- only unresolved team choices, with concrete options and examples
- when answered, convert the answer into a manual `RL-*` learning, promote the
  decision into active docs/rules/examples, then remove the open question
