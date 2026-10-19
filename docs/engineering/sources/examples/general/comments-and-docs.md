# Comments and Docs

Use these examples when adding a code comment, a JSDoc block, or a test name.

## DOC-01 — One line of why, no narration or ticket IDs

Source: PR #9093, #9075, #8980 (RL-20261015-001)

### Avoid

```ts
/**
 * Step-up authentication for the sensitive Workspace actions that start outside a Workspace: from a Safe page and
 * from the Workspace creation wizard. These flows send the step-up back to their own page, not the page the user
 * left, so that the replay can move the user on.
 */
```

```ts
// The user confirms this transaction with these critical findings. Analyses can deliver later or as new objects,
// so only a change of the transaction or of the findings asks for the confirmation again.
```

### Prefer

```ts
// These flows start outside a Workspace and return the step-up to their own page, not the page the user left.
```

```ts
// A confirmation covers one transaction with one set of critical findings; any change asks again.
```

### Why

The multi-line versions narrate what the code and its names already say, and drift when the code changes. One line keeps only the invariant the code cannot show. Ticket IDs belong in the PR description, not in a comment.

## DOC-01 — Name E2E tests with should and when

Source: PR #9075 (RL-20261014-002)

### Avoid

```ts
test('that a Safe is added to the Workspace after the code', async ({ safePage, safes }) => {
```

### Prefer

```ts
test('should add the Safe to the Workspace when the step-up succeeds', async ({ safePage, safes }) => {
```

### Why

The E2E guidance requires `should [expected behavior] when [condition]`, so a CI failure names the broken behavior and the condition that triggers it.
