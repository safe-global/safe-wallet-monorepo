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

On #9510 another reviewer drew the line at three copies and asked for a test
util for a repeated `afterEach`, an MSW request recorder and a consent
`initialReduxState`; the author moved them into `apps/web/src/tests/whatsNew.ts`.
On #9546 a shared action helper lost its `aria-expanded` assertion, since a
helper that asserts reports failures the test never named. Both lean towards
Option C for setup, with helpers that act and wait but do not assert.

Evidence: [#9510 review 5732489380](https://github.com/safe-global/safe-wallet-monorepo/pull/9510#pullrequestreview-5732489380),
[#9546 r4452761629](https://github.com/safe-global/safe-wallet-monorepo/pull/9546#discussion_r4452761629).

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
On #9187 a reviewer asked for `space?.experimentalFeatures ?? []` so a missing
field does not crash, although the generated type marks it required, and the
author added it. On #9167 a reviewer asked why the frontend fixes an
out-of-range Delay cooldown the app never creates; the author answered that a
contract accepts any value, so the UI must handle it, and the PR merged.
[#9187 r4324263841](https://github.com/safe-global/safe-wallet-monorepo/pull/9187#discussion_r4324263841),
[r4326460622](https://github.com/safe-global/safe-wallet-monorepo/pull/9187#discussion_r4326460622),
[#9167 review 5572227080](https://github.com/safe-global/safe-wallet-monorepo/pull/9167#pullrequestreview-5572227080),
[issuecomment-6270269365](https://github.com/safe-global/safe-wallet-monorepo/pull/9167#issuecomment-6270269365).

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
"inside the feature". The FEAT-01 example "Sibling files inside a feature use
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

Decision Needed: pick A or B, then update the FEAT-01 example to state it.

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

### OQ-E2E-01 — New cases in a legacy Cypress spec

Question: when a PR repairs a Cypress spec and needs to cover a new behavior,
does the new case go into that Cypress spec or into a Playwright spec? The
Cypress guidance at the reviewed commit reserves Cypress for maintenance and asks for
all new E2E tests in Playwright. On #8994 a bot asked to move a new Safe Pro gate
test out of `proposers.cy.js`; the PR merged with the new `it` in Cypress, in a
batch of Cypress repairs by the author of the Playwright setup.

Evidence: [#8994 r4226775226](https://github.com/safe-global/safe-wallet-monorepo/pull/8994#discussion_r4226775226),
[apps/web/cypress/AGENTS.md L1-L3 at that commit](https://github.com/safe-global/safe-wallet-monorepo/blob/3a792ff6b03e3107f53c0e48b484dbe655635237/apps/web/cypress/AGENTS.md#L1-L3).

Option A — any new behavior goes to Playwright, even next to a repaired Cypress spec:

```ts
// apps/web/e2e/tests/regression/proposers.spec.ts
test('should replace the Add proposer button when no Workspace plan grants policies', async ({ safePage }) => {
```

Option B — a case added while repairing an existing Cypress spec counts as
maintenance and may stay there:

```js
// apps/web/cypress/e2e/regression/proposers.cy.js
it('Verify Safe Pro replaces the "Add proposer" button when no Workspace plan grants policies', () => {
```

Option C — Cypress keeps only cases that replace a changed assertion; a gate or
flow the spec never covered goes to Playwright or to a component test.

Decision Needed: pick A, B or C, then state it in the E2E guidance and in a
testing rule.

### OQ-FEAT-01 — Canonical IDs that live inside a lazily loaded feature

Question: when the canonical constant for a value lives in a lazily loaded
feature's internals, does a consumer outside the feature import it, repeat the
literal, or get it through the feature's public surface? On #9076 a bot asked to
reuse the scanner's exported `id` instead of `'contract_version'` in the Spaces
table. The author kept the literal: every other result in that table is read the
same way, and importing the scanner module would pull it and
`@safe-global/safe-deployments` out of the lazily loaded security feature. DATA-04
asks for the canonical constant; FEAT-01 forbids deep imports from outside a
feature.

Evidence: [#9076 issuecomment-6165674918](https://github.com/safe-global/safe-wallet-monorepo/pull/9076#issuecomment-6165674918),
[issuecomment-6166161410](https://github.com/safe-global/safe-wallet-monorepo/pull/9076#issuecomment-6166161410).

Option A — import the constant from where it is defined:

```ts
import { contractVersionScanner } from '@/features/security/data/scanners/contractVersion'

const result = results[contractVersionScanner.id]
```

Option B — repeat the literal, as the rest of the consumer does:

```ts
const result = results['contract_version']
```

Option C — the feature exports its IDs from a dependency-free module of its
public surface, and the scanner reads them from there:

```ts
import { SCANNER_IDS } from '@/features/security'

const result = results[SCANNER_IDS.contractVersion]
```

Decision Needed: pick A, B or C, then add the case to DATA-04 or FEAT-01.

### OQ-TEST-02 — Tests for wiring a shared component into a second app root

Question: when a fix only mounts an existing shared component in another app
root, does it need a regression test? On #9029 the web-tanstack root started
mounting `SafeScopedSubscriptions` from the web `_app`. A bot asked for a test
that the component is mounted; the approving reviewer said such a test would
only check wiring, not the counterfactual-Safe bug, and suggested a follow-up
check that keeps the two roots from drifting. The PR merged without a test.
TEST-02 asks for a test of every new branch.

Evidence: [#9029 r4248180762](https://github.com/safe-global/safe-wallet-monorepo/pull/9029#discussion_r4248180762),
[#9029 review 5491448657](https://github.com/safe-global/safe-wallet-monorepo/pull/9029#pullrequestreview-5491448657).

Option A — a wiring test for the root:

```tsx
it('mounts the shared Safe subscriptions', () => {
  render(<RootComponent />)
  expect(SafeScopedSubscriptions).toHaveBeenCalled()
})
```

Option B — no test: sharing the component is the guard, and the bug is covered
where the subscriptions are tested.

Option C — one parity check that both app roots mount the same shared
subscriptions, instead of a test per root.

Decision Needed: pick A, B or C, then record the exception or the requirement
in TEST-02.

### OQ-TEST-03 — Does every visual or layout fix need a story or test?

Question: TEST-07 asks for a Storybook story for every visual or layout bug fix
(RL-20260827-001), so the visual-regression run catches a recurrence. In this
window reviewers declined that for small fixes. On #9166 (Add member button
stretched to full width) a bot asked for regression coverage and the author
answered "We don't have to test every design detail". On #9136 a request for a test of the Enterprise support copy got
"No.", and on #9170 a story for a nesting fix was called out of scope because
the group never had one.

Evidence: [#9166 r4311900424](https://github.com/safe-global/safe-wallet-monorepo/pull/9166#discussion_r4311900424),
[#9136 r4294992752](https://github.com/safe-global/safe-wallet-monorepo/pull/9136#discussion_r4294992752),
[#9170 issuecomment-6266665879](https://github.com/safe-global/safe-wallet-monorepo/pull/9170#issuecomment-6266665879).

Option A — TEST-07 as written: every visual or layout fix adds or extends a
story for the broken state.

```tsx
export const AdminWithLongName: Story = { args: { isAdmin: true, name: LONG_NAME } }
```

Option B — a story only when the component already has one, or the fix
touches layout that depends on content (long text, nesting, empty states);
one-class tweaks such as `self-start` need neither a story nor a test.

Option C — no story requirement for fixes; stories stay for new components
and new states, and fixes rely on review and Argos runs of existing stories.

Decision Needed: pick A, B or C, then narrow or keep the bug-fix clause of
TEST-07.

### OQ-PKG-01 — Logic helpers already in packages/views

Question: PKG-02 now keeps `packages/views` presentational. On #9257 a reviewer
asked to move all business logic the PR touched into `apps/web`; the author
moved what the PR added but kept its additions to the policy helpers that #8988
had already put in views (`isPendingPolicy`, `getPolicyStatus`,
`getPolicySummary`), because views components call them and moving them would
also change spending-limit code. The thread ended there.

Evidence: [#9257 issuecomment-6340162968](https://github.com/safe-global/safe-wallet-monorepo/pull/9257#issuecomment-6340162968),
[issuecomment-6361256825](https://github.com/safe-global/safe-wallet-monorepo/pull/9257#issuecomment-6361256825).

Option A — move each helper to `apps/web` the next time a PR touches it, and
pass its result to the view as a prop:

```tsx
// apps/web
const status = getPolicyStatus(policy)
return <PolicyRow policy={policy} status={status} />
```

Option B — leave existing helpers in views and move them in one dedicated
follow-up PR; new logic never goes there.

Option C — allow pure status and summary helpers in views, since they read only
the DTO; permission rules and gateway mapping stay in the app.

```tsx
// packages/views: a view may call a pure helper that reads only the DTO
const status = getPolicyStatus(policy)
```

Decision Needed: pick A, B or C, then add the legacy case to PKG-02.

### OQ-CI-01 — Inline `run:` scripts or a script file

Question: when a workflow step needs a few lines of shell, does it stay inline
in `run:` or move to a script file? On #9504 a reviewer found a 5-line inline
block that picks the backend and writes `$GITHUB_OUTPUT` hard to read and asked
for a bash script; the author kept it inline, since a reader would have to jump
to another file for the same lines. The PR merged with the inline block after
the reviewer approved.

Evidence: [#9504 r4451984376](https://github.com/safe-global/safe-wallet-monorepo/pull/9504#discussion_r4451984376),
[r4453625306](https://github.com/safe-global/safe-wallet-monorepo/pull/9504#discussion_r4453625306).

Option A — keep short shell inline, so the workflow reads top to bottom:

```yaml
run: |
  backend="${REQUESTED_BACKEND:-staging}"
  if [ "$HEAD_REF" = release ] && [ "$BASE_REF" = main ]; then backend=production; fi
  images=$(python3 apps/web/e2e/environment/infra/scripts/test_env.py versions --backend "$backend")
```

Option B — any multi-line logic goes to a script the step calls, so it can be
read, linted and run locally:

```yaml
run: .github/scripts/plan-backend.sh
```

Option C — inline up to a fixed size (for example 5 lines without loops or
functions); anything longer, branching more, or reused goes to a script.

Decision Needed: pick A, B or C, then add it to a CI rule.

### OQ-TEST-04 — Is an Argos screenshot enough to replace a deleted E2E check?

Question: TEST-04 asks a replacement to make every assertion the deleted test
made. When Cypress was deleted (#9603), a reviewer found that the queue's "Next"
and "Queued - transaction with nonce N needs to be executed first" labels were
then covered only by Queue stories, proved that removing the labels left every
Jest test green, and proposed a `TxListItem` test. At the time Argos ran only
weekly; #9609 later made it review changed sheets on every PR. The PR merged
without the test.

Evidence: [#9603 review 5826894596](https://github.com/safe-global/safe-wallet-monorepo/pull/9603#pullrequestreview-5826894596),
[#9609 r4522721881](https://github.com/safe-global/safe-wallet-monorepo/pull/9609#discussion_r4522721881).

Option A — a story whose sheet Argos reviews on the PR replaces a deleted visual
check, text included:

```tsx
export const QueuedBatchExpanded: Story = { ...createMockStory({ pathname: '/transactions/queue' }) }
```

Option B — text and labels the deleted test read also get a Jest assertion, and
the story covers layout only:

```tsx
renderLabel(LabelValue.Queued, 4)
expect(screen.getByText('Queued - transaction with nonce 4 needs to be executed first')).toBeInTheDocument()
```

Option C — a screenshot is enough for static copy; anything computed (a nonce,
an amount, a status) gets a Jest assertion.

Decision Needed: pick A, B or C, then state it in TEST-04.
