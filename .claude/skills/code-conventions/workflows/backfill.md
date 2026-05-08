# Backfill Workflow

Use backfill mode with compound mode for historical review-learning
compounding.

Read `workflows/compound.md` first. Backfill uses the same fetch, load,
review-learning distillation, and rule-mapping workflow. Only the window
direction and ledger update differ.

## Window

Move backward from the current covered range. Do not fetch more comments than
can be fully read, distilled, written back to the repo, and validated in one
invocation.

1. Start from `coveredClosedAtRange.start` if present, otherwise use the
   current UTC timestamp as the first boundary.
2. `until = coveredClosedAtRange.start + overlapHours`
3. Choose a bounded `since` before `until` that can be read fully.
4. Fetch closed PRs by exact `closedAt` timestamp for that window.

Use overlap intentionally. Duplicate PRs/comments across overlapping windows
are expected and should be de-duplicated during distillation.

## Batch Contract

Backfill must proceed one batch at a time. Do not fetch the next historical
window until the current window has been fully processed:

- fetched corpus read completely
- learnings distilled and mapped
- needed docs/JSON updates written
- ledger moved backward to the processed `since`
- validation passed

If a proposed window produces too many PRs or comments to process carefully,
discard that window, choose a smaller `since`/`until` range, and fetch again.
Never keep expanding the corpus while postponing distillation.
Prefer small batches, typically one week of closed PRs. Increase the batch size
only after a completed batch proves the repo had very few PRs/comments in that
period.

## Ledger Update

After a successful backfill run:

- Update `coveredClosedAtRange.start` to `<since>`.
- Leave `coveredClosedAtRange.end` unchanged if it already exists.
- If the ledger is new, set `coveredClosedAtRange` to the analyzed window.
- Do not store PR-number ranges. Use date windows only.

## Output Discipline

Use the same output discipline as compound mode.

## Validate

Run the validation commands from `SKILL.md`. The run is not complete until they
pass.
