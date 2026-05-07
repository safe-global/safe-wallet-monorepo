# Data Integrity

Use these examples when changing address-book merges, Safe identity, RTK
mutations, or UI predicates derived from multiple collections.

## rtk-mutation-results

Use this when a mutation result controls success UI or local deletion.

Prefer:

```ts
const result = await deletePrivate(args)
if ('error' in result) {
  showError()
  return
}

setRemoved(true)
showSuccess()
```

Also acceptable:

```ts
try {
  await deletePrivate(args).unwrap()
  setRemoved(true)
  showSuccess()
} catch {
  showError()
}
```

Avoid:

```ts
await deletePrivate(args)
setRemoved(true)
showSuccess()
```

Why:

RTK Query mutation triggers do not throw by default. They resolve to an object
that can contain `error`.

## per-chain-contact-merges

Use this when merging space, private, and local contacts.

Prefer:

```ts
const spaceChainIds = new Set(
  spaceContacts
    .filter((space) => sameAddress(space.address, privateContact.address))
    .flatMap((space) => space.chainIds),
)

const remainingChainIds = privateContact.chainIds.filter((chainId) => {
  return !spaceChainIds.has(chainId)
})
```

Avoid:

```ts
const filteredPrivate = privateContacts.filter((privateContact) => {
  return !spaceContacts.some((space) => sameAddress(space.address, privateContact.address))
})
```

Why:

Address-only dedupe drops private contacts on chains that are not covered by
the higher-priority space contact.

## loading-vs-fetching

Use this when RTK Query state controls whether existing content disappears.

Prefer:

```tsx
const { data, isLoading, isFetching } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)

if (isLoading) return <Spinner />

return <Accounts data={data} isRefreshing={isFetching} />
```

Avoid:

```tsx
const { data, isFetching } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)

if (isFetching) return <Spinner />

return <Accounts data={data} />
```

Why:

`isFetching` becomes true on refetch. Use it to show refresh affordances, not
to hide already-loaded content unless that is the intended UX.

## fallback-preserving-maps

Use this when adding a new upstream response shape beside legacy fields.

Prefer:

```ts
return {
  [StatusGroup.THREAT]: threatAnalysis?.THREAT
    ? mapThreat(threatAnalysis.THREAT)
    : mapLegacyThreat(findings.THREAT_ANALYSIS),
  [StatusGroup.BALANCE_CHANGE]: threatAnalysis?.BALANCE_CHANGE
    ? mapBalance(threatAnalysis.BALANCE_CHANGE)
    : mapLegacyBalance(balanceChanges),
}
```

Avoid:

```ts
if (threatAnalysis) {
  return transformThreatAnalysisResponse(threatAnalysis)
}
```

Why:

New response objects are often partial. Returning early can drop legacy fields
that still contain the data the UI needs.

## DATA-02 — Empty-state gating across multiple collections

Source: PR #7654 (RL-20260415-002)

### Avoid

```tsx
{
  addressBookItems.length === 0 ? (
    <EmptyAddressBook />
  ) : (
    <Tabs>
      <TabPanel value="workspace">{/* workspaceContacts */}</TabPanel>
      <TabPanel value="local">{/* localContacts */}</TabPanel>
    </Tabs>
  )
}
```

### Prefer

```tsx
const isEmpty = workspaceContacts.length === 0 && localContacts.length === 0

{
  isEmpty ? <EmptyAddressBook /> : <Tabs>{/* both tabs */}</Tabs>
}
```

### Why

Gating the empty state on a single collection hides every other tab on the
page. Combine the count of every collection the page renders, or always render
the tabs container so each tab can show its own data.

## RTK-02 — Skip queries until the resource ID is resolved

Source: PR #7613 (RL-20260415-006)

### Avoid

```ts
const resourceId = paramId ?? currentId
const isSignedIn = useAppSelector(selectIsAuthenticated)

const { data } = useGetMembersQuery({ resourceId: Number(resourceId) }, { skip: !isSignedIn })
```

### Prefer

```ts
const resourceId = paramId ?? currentId
const numericId = Number(resourceId)
const isSignedIn = useAppSelector(selectIsAuthenticated)

const { data } = useGetMembersQuery(
  { resourceId: numericId },
  { skip: !isSignedIn || !Number.isFinite(numericId) || numericId <= 0 },
)
```

### Why

Auth-only `skip` lets queries fire with `0` or `NaN` IDs during route
hydration, producing avoidable failing requests and a flash of empty state.
Add a validity guard on the ID itself to the `skip` predicate.
