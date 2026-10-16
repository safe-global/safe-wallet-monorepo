# Open Questions

Single home for unresolved team preferences surfaced by review
feedback. Add an entry here instead of writing a hard rule when the
team has not settled on one option.

## Conventions For Entries

Each entry has:

- a stable ID (`OQ-<CATEGORY>-NN`) so it can be referenced and resolved;
- a one-paragraph question stating the choice;
- two or more concrete options with code examples;
- a "Decision Needed" line describing what would close it.

When an open question is resolved, convert the answer into a manual
historical `RL-*` learning, promote the decision into active docs or
`../rules.json`, and remove the entry from this file.

## Active Questions

### OQ-TEST-01 — Inline test setup or shared test helpers

Question: should a short arrange or assert expression that several tests repeat
be written out in every test, or pulled into a shared helper? On #8816 a
reviewer preferred repeating it ("I wouldn't have made that function DRY"), and
the author inlined the helper in two test files. That cuts against the repo's
reuse guidance: the root AGENTS.md "Follow the DRY principle", CODE-01 (test
utils rebuilt beside a shared one, RL-20260930-002), DATA-04 and the TEST-05
builders.

Evidence: [#8816 r4119528870](https://github.com/safe-global/safe-wallet-monorepo/pull/8816#discussion_r4119528870),
[r4119544905](https://github.com/safe-global/safe-wallet-monorepo/pull/8816#discussion_r4119544905),
[r4119581352](https://github.com/safe-global/safe-wallet-monorepo/pull/8816#discussion_r4119581352).

Option A — inline in each test, so each test reads on its own:

```ts
it('passes the return path', async () => {
  await login()
  expect(new URL(jest.mocked(navigateTo).mock.calls[0][0]).searchParams.get('next')).toBe('/home')
})
```

Option B — one helper per test file, reused by every test:

```ts
const redirectUrl = () => new URL(jest.mocked(navigateTo).mock.calls[0][0])

it('passes the return path', async () => {
  await login()
  expect(redirectUrl().searchParams.get('next')).toBe('/home')
})
```

Option C — test data stays shared (builders, TEST-05), one-line arrange and
assert expressions are inlined, and only multi-step setup gets a helper.

Decision Needed: pick A, B or C, then record it as a manual `RL-*` and add the
clause to TEST-05 or CODE-01.

### OQ-DATA-01 — How defensive to be against CGW responses

Question: should web code trust CGW and its generated types, or keep
client-side fallbacks and retries for values the types allow to be missing? On
#8910 a bot asked to keep the `metadata.planName` fallback for a null plan name
and a 429 retry for the bulk entitlements request; three reviewers declined
("I am against defensive programming against our own backend. Wallet should
trust CGW"). That conflicts with DATA-03 (keep legacy fallback mappings) and
sits next to SEC-03, which explicitly does not trust backend-supplied
recipients.

Evidence: [#8910 r4166505819](https://github.com/safe-global/safe-wallet-monorepo/pull/8910#discussion_r4166505819),
[r4166511949](https://github.com/safe-global/safe-wallet-monorepo/pull/8910#discussion_r4166511949),
[r4166524024](https://github.com/safe-global/safe-wallet-monorepo/pull/8910#discussion_r4166524024),
[r4166538503](https://github.com/safe-global/safe-wallet-monorepo/pull/8910#discussion_r4166538503).

Option A — trust CGW and the generated type; a null field renders as absent:

```ts
const badgeLabel = plan?.status === 'trialing' ? 'Free access' : (plan?.name ?? undefined)
```

Option B — keep the client fallback and retry the shared request centrally:

```ts
const badgeLabel = plan?.status === 'trialing' ? 'Free access' : (plan?.name ?? plan?.metadata?.planName)
```

Option C — trust CGW by default, and keep fallbacks only where a wrong value
moves funds or signs (SEC-03) or where a cutover drops a legacy shape (DATA-03).

Decision Needed: pick A, B or C, then narrow DATA-03 or add the trust boundary
to the rule it belongs to.

### OQ-IMPORT-01 — Alias or relative imports inside a feature

Question: inside one web feature, should a file import a sibling module through
the `@/features/<name>/...` alias or through a relative path? On #7980 a
reviewer asked to keep `@/features/proposers/hooks/...` instead of `../hooks/...`,
and a later commit in the same PR imported `useDelegateMutations` relatively
"inside the feature". The FEAT-03 example "Sibling files inside a feature use
relative imports" (RL-20260220-002) prefers relative paths, though its point is
avoiding the barrel self-import.

Evidence: [#7980 r3342764361](https://github.com/safe-global/safe-wallet-monorepo/pull/7980#discussion_r3342764361),
[r3343179931](https://github.com/safe-global/safe-wallet-monorepo/pull/7980#discussion_r3343179931).

Option A — alias deep path, never the barrel:

```ts
import { useParentSafeThreshold } from '@/features/proposers/hooks/useParentSafeThreshold'
```

Option B — relative path for anything inside the same feature:

```ts
import { useParentSafeThreshold } from '../hooks/useParentSafeThreshold'
```

Decision Needed: pick A or B, then update the FEAT-03 example to state it.

### OQ-FLAG-01 — Legacy path while a feature flag is still loading

Question: may a hook pick the legacy path while a `boolean | undefined` flag
is still `undefined`, when the legacy path is correct on every chain without
the flag? On #7980 a reviewer flagged `isQueueService ? v3 : v2` because the
undefined state falls back to v2; the author first waited for the chain config
and then reverted, arguing the v2 fallback is the right answer while loading
and the only caller runs after configs load. WEB-07 says the undefined state
must not be coerced.

Evidence: [#7980 r4205666384](https://github.com/safe-global/safe-wallet-monorepo/pull/7980#discussion_r4205666384),
[r4206976524](https://github.com/safe-global/safe-wallet-monorepo/pull/7980#discussion_r4206976524),
[r4207438193](https://github.com/safe-global/safe-wallet-monorepo/pull/7980#discussion_r4207438193).

Option A — WEB-07 as written: resolve nothing until the flag is known:

```ts
if (isQueueService === undefined) return undefined
const fetchProposers = isQueueService ? fetchQueueServiceProposers : fetchTransactionServiceProposers
```

Option B — allow the legacy fallback when it is correct for every chain
without the flag:

```ts
const fetchProposers = isQueueService ? fetchQueueServiceProposers : fetchTransactionServiceProposers
```

Decision Needed: keep WEB-07 strict (A) or add the legacy-fallback exception (B)
to it.
