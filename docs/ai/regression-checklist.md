# Pre-implementation regression checklist

Before writing code for any non-trivial change (anything beyond a typo, doc tweak, or single-line local fix), produce a regression checklist and include it in your response to the user. Optimise for **impact analysis**, not diff completion: a change to a shared hook, selector, component, slice, or API endpoint touches many user journeys, and plain text search is not enough to find them.

## Build the checklist in this order

1. **Map the surface.** Identify what you are touching: the primary file(s), plus any shared hooks, components, selectors, Redux slices, RTK Query endpoints, feature flags, routes, or persisted state involved.
2. **Find consumers with symbol-aware search** — LSP `findReferences`, not plain text search (see [code-navigation.md](code-navigation.md)).
3. **Translate consumers into flows.** For each consumer, name the user journey it belongs to (create / edit / delete / retry / empty / error / offline / permission / feature-flag-off / mobile variant).
4. **List tests to add or run.** Happy path, each neighbouring flow, regression-sensitive paths, and invariant properties. Prefer targeted tests around shared contracts over broad E2E sweeps.
5. **State what you will not verify.** Be explicit. This exposes false confidence.

## Format (paste into your response before implementing)

```
### Regression checklist

**Primary flow changed:** <one sentence>

**Surfaces touched:**
- <shared hook / component / selector / slice / endpoint / flag / route>

**Neighbouring flows to verify:**
- <flow A> — <why it could be affected>
- <flow B> — <why it could be affected>

**Tests to add/run:**
- <test name or description>

**Not verified (risks):**
- <what you are skipping and why>
```

## Rules

- Don't start editing code until this checklist exists in the conversation. For small, strictly local changes, a one-line "local change, no shared surfaces touched" note is sufficient.
- When you open the PR, carry the relevant lines into the "Affected flows", "Blast radius", and "Risks / not checked" fields of the PR template.
- If the checklist reveals that a shared abstraction has many unknown consumers, slow down and investigate before coding — that is the signal this process is designed to surface.
