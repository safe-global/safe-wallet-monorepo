# Safe Accounts Page Architecture

## Executive Summary

The Safe Accounts Page is a space-scoped component that displays all Safe accounts within a collaborative space. It provides admins with the ability to add/remove accounts and all users with search, filtering, and transaction creation capabilities. The architecture emphasizes data deduplication through multi-chain account grouping, reuses Safe data hooks from the onboarding flow, and integrates with Redux for state persistence and RTK Query for API calls.

**Key Metrics:**

- Lazy-loaded feature module with proxy-stub pattern
- ~4 levels of component nesting (Page → Main → List → Card)
- 8 Redux selectors + 1 RTK Query endpoint per card
- 5 custom hooks managing data transformation and memoization
- Debounced search (300ms) to reduce query operations

---

## Architectural Diagram

```mermaid
graph TB
    subgraph "Page Layer"
        P["SpaceSafeAccountsPage<br/>(Auth + AddressBook Provider)"]
    end

    subgraph "Feature Layer"
        F["SpaceSafeAccounts<br/>(Main Container)"]
    end

    subgraph "Data Layer"
        RS["Redux Store"]
        API["RTK Query<br/>(SafeOverview + SpaceSafes)"]
        WH["Wallet Hook"]
    end

    subgraph "Composition Layer"
        SL["AccountsSafesList"]
        EC["EmptySafeAccounts"]
    end

    subgraph "Card Layer"
        SC["SafeCardReadOnly"]
        STB["SendTransactionButton"]
        CM["SpaceSafeContextMenu"]
    end

    subgraph "Data Transformation"
        SH["useSafesSearch"]
        HSH["useSpaceSafes"]
        SCD["useSafeCardData"]
        OH["useAllOwnedSafes"]
        BUI["_buildSafeItem"]
        GS["_groupAndSort"]
    end

    subgraph "External Dependencies"
        SS["Address Similarity<br/>Detection"]
        AB["Address Book<br/>Slice"]
        OS["Order By<br/>Preference"]
        VS["Visited Safes<br/>Slice"]
    end

    P -->|Wraps with Context| F
    F -->|useSpaceSafes| HSH
    F -->|useAppSelector| RS
    F -->|useWallet| WH
    F -->|useMemo + useSafesSearch| SH

    HSH -->|RTK Query| API
    HSH -->|_buildSafeItems| BUI

    F -->|_groupAndSort| GS
    GS -->|Handles multi-chain| BUI

    F -->|detectSimilarAddresses| SS

    F -->|Renders| EC
    F -->|Renders| SL

    SL -->|Maps each safe| SC

    SC -->|RTK Query| API
    SC -->|useSafeCardData| SCD
    SC -->|Renders child| STB
    SC -->|useLoadFeature| CM

    SCD -->|useSafeItemData| BUI
    SCD -->|useMultiAccountItemData| BUI

    STB -->|isOwner validation| BUI
    CM -->|useSpaceSafesDeleteV1Mutation| API

    RS -->|selectAllAddedSafes| AB
    RS -->|selectOrderByPreference| OS
    RS -->|selectAllVisitedSafes| VS
    RS -->|selectAllAddressBooks| AB

    style P fill:#e1f5ff
    style F fill:#f3e5f5
    style RS fill:#fff3e0
    style API fill:#fff3e0
    style SL fill:#f3e5f5
    style SC fill:#e8f5e9

---

## Component Hierarchy

```

Page Layer
├── SpaceSafeAccountsPage
│ ├── AuthState (wrapper)
│ │ └── AddressBookSourceProvider (context)
│ │ └── SpaceSafeAccounts (main container)

Container Layer
└── SpaceSafeAccounts (index.tsx)
├── SearchInput
├── AddAccounts (Admin only, lazy-loaded feature)
├── PreviewInvite (Conditional)
├── EmptySafeAccounts (Conditional - no results state)
└── AccountsSafesList (Conditional - has results)

List Layer
└── AccountsSafesList (AccountsSafesList.tsx)
├── SimilarAddressAlert (Conditional)
└── [SafeCardReadOnly] × N (renderSafeCards)

Card Layer (repeated per safe)
└── SafeCardReadOnly (SafeCardReadOnly.tsx)
├── Identicon
├── SafeInfo (name, address)
├── ChainBadges
├── FiatBalance
├── ThresholdBadge
├── SendTransactionButton
└── SpaceSafeContextMenu (lazy-loaded feature)

````

---

## Data Flow

### 1. Space Safes Fetching
```typescript
SpaceSafeAccounts
  ↓ useSpaceSafes()
  ├─ useSpaceSafesGetV1Query(spaceId) // RTK Query
  ├─ useGetSpaceAddressBook() // Space contacts
  ├─ useAllOwnedSafes(walletAddress) // User's owned safes
  ├─ mapSpaceContactsToAddressBookState() // Transform contacts
  └─ _buildSafeItems() // Build SafeItem objects
````

### 2. Safe Items Construction

```typescript
spaceSafeItems = useMemo(() => {
  const buildItem = (chainId, address) =>
    _buildSafeItem(
      chainId,
      address,
      walletAddress,
      allAdded, // Redux: selectAllAddedSafes
      allOwned, // Hook: useAllOwnedSafes
      allUndeployed, // Redux: selectUndeployedSafes
      allVisitedSafes, // Redux: selectAllVisitedSafes
      allSafeNames, // Redux: selectAllAddressBooks
    )

  return spaceSafes.map((safe) => buildItem(safe.chainId, safe.address))
}, [allAdded, allOwned, allUndeployed, walletAddress, allVisitedSafes, allSafeNames, allSafes])
```

### 3. Grouping and Sorting

```typescript
displaySafes = useMemo<AllSafeItems>(
  () => _groupAndSort(spaceSafeItems, sortComparator),
  [spaceSafeItems, sortComparator],
)
```

- Groups safes with same address across chains into `MultiChainSafeItem`
- Separates multi-chain and single-chain safes
- Sorts by preference: `lastVisited` (default) or `name`

### 4. Search Filtering

```typescript
handleSearch = useCallback(debounce(setSearchQuery, 300), [])
filteredSafes = useSafesSearch(displaySafes, searchQuery)
safeList = searchQuery ? filteredSafes : displaySafes
```

### 5. Similar Address Detection

```typescript
similarAddresses = useMemo<Set<string>>(() => {
  const uniqueAddresses = [...new Set(spaceSafeItems.map((s) => s.address))]
  if (uniqueAddresses.length < 2) return new Set()
  const result = detectSimilarAddresses(uniqueAddresses)
  return new Set(uniqueAddresses.filter((addr) => result.isFlagged(addr)))
}, [spaceSafeItems])
```

### 6. Card-Level Data

```typescript
SafeCardReadOnly
  ├─ useSafeCardData(safe) // Data transformation
  │  ├─ useSafeItemData() // Single-chain data
  │  └─ useMultiAccountItemData() // Multi-chain aggregation
  ├─ useGetSafeOverviewQuery() // RTK Query for single safe
  └─ useLoadFeature(SpacesFeature) // Lazy-loaded context menu
```

---

## Redux State & Selectors

### Selectors Used in Accounts Page

| Selector                  | Purpose                                     | Source                 |
| ------------------------- | ------------------------------------------- | ---------------------- |
| `selectOrderByPreference` | Get sort preference (lastVisited/name)      | orderByPreferenceSlice |
| `selectAllAddedSafes`     | Pinned/manually added safes                 | addedSafesSlice        |
| `selectUndeployedSafes`   | Undeployed counterfactual safes             | counterfactual feature |
| `selectAllVisitedSafes`   | Recently visited safes with timestamps      | visitedSafesSlice      |
| `selectAllAddressBooks`   | All named safes by chainId → address → name | addressBookSlice       |
| `isAuthenticated`         | User auth status in useSpaceSafes           | authSlice              |

### Redux Slice Structure

**addedSafesSlice** (Nested by chainId)

```typescript
{
  [chainId: string]: {
    [safeAddress: string]: {
      owners: AddressInfo[]
      threshold: number
      ethBalance?: string
    }
  }
}
```

**orderByPreferenceSlice**

```typescript
{
  orderBy: 'lastVisited' | 'name'
}
```

**visitedSafesSlice** (Nested by chainId)

```typescript
{
  [chainId: string]: {
    [safeAddress: string]: {
      timestamp: number
    }
  }
}
```

**addressBookSlice** (Nested by chainId)

```typescript
{
  [chainId: string]: {
    [safeAddress: string]: string // name
  }
}
```

---

## RTK Query Endpoints

### Endpoints Called in Accounts Page

| Endpoint                        | Usage                       | Called By                    | Caching           |
| ------------------------------- | --------------------------- | ---------------------------- | ----------------- |
| `useSpaceSafesGetV1Query`       | Fetch safes in space        | `useSpaceSafes()` hook       | Default RTK cache |
| `useGetSafeOverviewQuery`       | Fetch safe details per card | `SafeCardReadOnly` component | Per-safe cache    |
| `useSpaceSafesDeleteV1Mutation` | Remove safe from space      | `RemoveSafeDialog`           | Mutation          |

**Query Skip Conditions:**

- `useSpaceSafesGetV1Query`: Skipped if `!isUserSignedIn`
- `useGetSafeOverviewQuery`: Skipped if `!singleSafe`

---

## Custom Hooks

### Data Transformation Hooks

#### `useSpaceSafes()` (apps/web/src/features/spaces/hooks/useSpaceSafes.tsx)

**Purpose:** Fetch and group all safes in current space
**Dependencies:**

- RTK Query: `useSpaceSafesGetV1Query`
- Custom: `useCurrentSpaceId`, `useGetSpaceAddressBook`, `useAllOwnedSafes`
- Redux: `selectOrderByPreference`, `isAuthenticated`

**Return:**

```typescript
{
  allSafes: AllSafeItems // Sorted SafeItem[] | MultiChainSafeItem[]
  isLoading: boolean
}
```

**Memoization:** `allSafes` memoized on `[safes.allMultiChainSafes, safes.allSingleSafes, sortComparator]`

---

#### `useAllOwnedSafes(walletAddress)` (apps/web/src/hooks/safes/useAllOwnedSafes.ts)

**Purpose:** Query blockchain for safes where wallet is owner
**Dependencies:** RTK Query, Wallet address
**Return:** `[ownedSafesMap, loading, error]`

**Note:** Called with `walletAddress` from `useWallet()` hook

---

#### `useSafesSearch(safes, searchQuery)` (apps/web/src/hooks/safes/useSafesSearch.ts)

**Purpose:** Filter safes by name or address
**Behavior:**

- Searches: safe name, shortened address, full address
- Case-insensitive matching
- Returns all matching items

---

#### `useSafeCardData(safe)` (apps/web/src/features/spaces/components/SelectSafesOnboarding/hooks/useSafeCardData.ts)

**Purpose:** Extract display data from SafeItem or MultiChainSafeItem
**Dependencies:**

- `useSafeItemData()` for single-chain data
- `useMultiAccountItemData()` for multi-chain aggregation

**Returns:**

```typescript
{
  name: string
  fiatValue: string | undefined
  threshold: number
  ownersCount: number
  chainIds: string[]
  elementRef: RefObject | undefined
}
```

---

### Utility Functions

#### `_buildSafeItem(chainId, address, walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames)`

**Purpose:** Construct a SafeItem with enriched metadata
**Returns:** SafeItem with fields:

- `chainId`, `address` (identifiers)
- `name` (from address book)
- `isOwned` (user is owner)
- `isAdded` (manually pinned)
- `isDeployed` (contract exists)
- `lastVisited` (timestamp)

---

#### `_groupAndSort(items, sortComparator)`

**Purpose:** Group multi-chain safes and sort by comparator
**Output:** `AllSafeItems` = `MultiChainSafeItem[]` + `SafeItem[]` (sorted)

---

#### `getComparator(orderBy: OrderByOption)`

**Purpose:** Return sort function

- `'lastVisited'`: Sort by most recently visited first
- `'name'`: Sort by name alphabetically

---

## Performance Analysis

### Memoization Strategy

| Memoized Value                | Dependencies                                                       | Reason                                        | Cost Avoided                                |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------- |
| `spaceSafeItems`              | Redux selectors × 6, wallet                                        | Expensive transformation: \_buildSafeItem × N | Re-transforming on every render             |
| `displaySafes`                | `spaceSafeItems`, `sortComparator`                                 | Grouping + sorting operation                  | Re-grouping on store changes                |
| `similarAddresses`            | `spaceSafeItems`                                                   | Address similarity detection O(N²)            | Algorithm runs on every render              |
| `allSafes` in `useSpaceSafes` | `[safes.allMultiChainSafes, safes.allSingleSafes, sortComparator]` | Prevents unnecessary list recreation          | Parent re-renders trigger child RTK queries |

### Search Optimization

**Debounce Delay:** 300ms

```typescript
const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
```

**Effect:**

- User types → 300ms wait → Query updates
- Without debounce: 20+ state updates per second (for each keystroke)
- Prevents cascading re-renders and unnecessary filtering

### RTK Query Caching

**Per-Safe Overhead:** 1 RTK Query call per `SafeCardReadOnly`

- `useGetSafeOverviewQuery({ chainId, safeAddress })`
- Caches by `(chainId, safeAddress)` tuple
- **Issue:** If 50 safes displayed → 50 concurrent RTK queries
- **Mitigation:** RTK Query batch normalization + cache reuse across sessions

### Re-render Triggers

| Change                                              | Scope                      | Impact                                      |
| --------------------------------------------------- | -------------------------- | ------------------------------------------- |
| Redux selector change (e.g., `selectAllAddedSafes`) | Page re-renders            | All memos recalculate dependencies          |
| Wallet address change                               | `useAllOwnedSafes` refetch | `spaceSafeItems` recalculates               |
| Sort preference change                              | `getComparator` changes    | `displaySafes` & all cards re-render        |
| Search query update                                 | `filteredSafes` updates    | List re-renders, card keys stable           |
| RTK Query response                                  | Card-level cache update    | Only affected `SafeCardReadOnly` re-renders |

---

## Architecture Decisions

### 1. Multi-Chain Grouping

**Decision:** Group safes with same address across chains into `MultiChainSafeItem`
**Rationale:**

- Reduce visual clutter (1 row per address, not per chain)
- Show aggregate threshold/owners across chains
- Aggregate fiat value

**Trade-off:** Extra data transformation layer, but essential for usability

---

### 2. RTK Query Per Card

**Decision:** Each `SafeCardReadOnly` fetches its own `useGetSafeOverviewQuery`
**Rationale:**

- Card is self-contained, can render without parent data
- Parallel loading: all cards load simultaneously
- Cache reuse: same safe on multiple views uses cached data

**Trade-off:** N+1 queries (1 list fetch + N card fetches)

---

### 3. Redux Selectors for Side Data

**Decision:** Pull `selectAllAddedSafes`, `selectAllVisitedSafes`, etc. from Redux, not API
**Rationale:**

- Local-first: persist user preferences (pinned, visited)
- Performant: avoid extra API calls
- Offline support: accessible without network

**Trade-off:** Extra Redux slice dependencies, but necessary for UX

---

### 4. Address Similarity Detection at Page Level

**Decision:** Run similarity detection on all space safes once per page
**Rationale:**

- Expensive algorithm O(N²), only run when safes change
- Shared across all cards (Set<string> passed down)
- Highlights potential address typos

**Trade-off:** Breaks if N > 1000, but acceptable for current use case

---

### 5. Lazy Loading of Context Menu

**Decision:** `SpaceSafeContextMenu` loaded via `useLoadFeature(SpacesFeature)`
**Rationale:**

- Reduces bundle size of accounts page (context menu is secondary)
- Follows feature architecture pattern

**Trade-off:** Slight latency in menu appearance on first interaction

---

## Points of Improvement

### 1. **N+1 RTK Query Problem** ⚠️

**Current:** Each card fetches its own `useGetSafeOverviewQuery`

- 1 list query + N card queries = N+1 total
- For 50 safes: 51 requests
- Network waterfall: each card waits for its own response

**Solutions:**

- [ ] **Batch RTK Query:** Combine all card fetches into single endpoint
- [ ] **Denormalize API:** Include safeOverview data in space safes response
- [ ] **Prefetch:** Load top 10 overviews with list, lazy-load rest
- **Effort:** Medium | **Impact:** High

---

### 2. **Deep Redux Dependency Chains** ⚠️

**Current:** `spaceSafeItems` memo depends on 6 Redux selectors

```typescript
deps: [allAdded, allOwned, allUndeployed, walletAddress, allVisitedSafes, allSafeNames, allSafes]
```

**Problem:**

- Any Redux change → `spaceSafeItems` recalculates
- Inefficient selector composition (not using `createSelector`)
- Causes card re-renders even when irrelevant slice updates

**Solution:**

- [ ] Use `createSelector` for memoized selectors
- [ ] Break `spaceSafeItems` into sub-memos (e.g., separate `ownedLookup` memo)
- [ ] Use selector composition to prevent unnecessary dependency changes
- **Effort:** Low | **Impact:** Medium

---

### 3. **MultiChainSafeItem Data Freshness** ⚠️

**Current:** Multi-chain safes use aggregated data from `useMultiAccountItemData`
**Problem:**

- If 1 chain updates (e.g., threshold changes), entire multi-chain item marked "dirty"
- Threshold/owners aggregation assumes all chains have same setup
- Risk of stale data if one chain's owners differ

**Solution:**

- [ ] Track per-chain freshness timestamps
- [ ] Fetch individual chain overviews, aggregate client-side
- [ ] Add validation that all chains have consistent threshold/owners
- **Effort:** Medium | **Impact:** Low-Medium (correctness)

---

### 4. **Missing Error States** ⚠️

**Current:**

- No error state if `useSpaceSafesGetV1Query` fails
- No error state if `useGetSafeOverviewQuery` fails per card
- Silent failures on RTK Query errors

**Solution:**

- [ ] Add error boundary around `SafeCardReadOnly`
- [ ] Show error UI for failed card queries
- [ ] Retry mechanism for failed fetches
- [ ] User-facing error messages
- **Effort:** Low | **Impact:** High (user experience)

---

### 5. **Similar Address Algorithm Performance** ⚠️

**Current:** `detectSimilarAddresses(uniqueAddresses)` runs O(N²)
**Problem:**

- For 500 safes: 250,000 comparisons
- Blocks rendering if threshold exceeded
- Not debounced/throttled

**Solution:**

- [ ] Limit to top 100 safes
- [ ] Use approximate algorithm (e.g., Levenshtein distance with cutoff)
- [ ] Memoize with threshold (skip if < 10 safes)
- [ ] Run in Web Worker for large datasets
- **Effort:** Low | **Impact:** Low (only N > 100)

---

### 6. **Card Key Stability** ⚠️

**Current:**

```typescript
renderSafeCards = (safes) =>
  safes.map((safe, index) => (
    <SafeCardReadOnly
      key={isMultiChain ? `multi-${address}-${index}` : `${chainId}:${address}`}
      {...}
    />
  ))
```

**Problem:**

- Keys depend on `index` for multi-chain safes (unstable if sort changes)
- If sort preference changes: all cards remount → lose React state
- RTK Query cache stays, but memo state resets

**Solution:**

- [ ] Use `safe.address` only (remove `index`)
- [ ] Combine: `${safe.address}-${index}` only as fallback for duplicates
- **Effort:** Very Low | **Impact:** Low-Medium

---

### 7. **Address Book Search Scope** ⚠️

**Current:** `useSafesSearch` searches across all safe data
**Problem:**

- Searches space contacts only (via `AddressBookSourceProvider`)
- If safe has name in global address book but not space contacts, hidden from search
- User confusion: "Why can't I find my safe by its name?"

**Solution:**

- [ ] Search both space + global address book
- [ ] Clarify scoping in UI ("Search in space safes")
- [ ] Allow toggling scope in preferences
- **Effort:** Low | **Impact:** Low (design decision)

---

### 8. **TypeScript Type Safety** ✅

**Current:** SafeItem types are well-defined
**Status:** No issues identified

---

### 9. **Lack of Virtualization** ⚠️

**Current:** All safes rendered at once (`AccountsSafesList` maps to JSX)
**Problem:**

- For 1000+ safes: renders 1000 DOM nodes
- Each card fetches `useGetSafeOverviewQuery`
- Browser locks on render phase

**Solution:**

- [ ] Implement `react-window` or `@tanstack/react-virtual`
- [ ] Render only visible safes + buffer (50-100 items)
- [ ] Lazy-load queries for offscreen cards
- **Effort:** Medium | **Impact:** High (1000+ item lists)

---

### 10. **Missing Loading State** ⚠️

**Current:** `useSpaceSafes` returns `isLoading`, but not shown in UI
**Problem:**

- Page shows empty state immediately if safes haven't loaded
- User doesn't know if space is empty or still fetching

**Solution:**

- [ ] Show skeleton/spinner while `isLoading`
- [ ] Distinguish between loading and empty states
- **Effort:** Very Low | **Impact:** Medium (UX)

---

### 11. **Debounce Memory Leak Risk** ⚠️

**Current:**

```typescript
const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
```

**Problem:**

- `debounce` creates closure, not cleaned up if component unmounts
- Pending search query can update state of unmounted component
- Race condition if rapid space switches

**Solution:**

- [ ] Use `useDebouncedCallback` from `use-debounce` package
- [ ] Or manually track and cleanup in useEffect
- **Effort:** Very Low | **Impact:** Low (rare edge case)

---

### 12. **Memoization Granularity** ⚠️

**Current:** `displaySafes` memo prevents re-render of all downstream
**Problem:**

- If any Redux selector changes, entire list recalculates
- Fine-grained memos would prevent this (per-card memos)

**Solution:**

- [ ] Use `React.memo(SafeCardReadOnly)` with props comparison
- [ ] Memoize card props to prevent unnecessary passes
- [ ] Or use callback refs + selective deps
- **Effort:** Low | **Impact:** Low-Medium (for large lists)

---

## Summary of Risks

| Risk                         | Severity | Effort   | Priority |
| ---------------------------- | -------- | -------- | -------- |
| N+1 RTK Queries              | High     | Medium   | 1        |
| Missing Error States         | High     | Low      | 2        |
| Redux Memo Efficiency        | Medium   | Low      | 3        |
| Card Key Stability           | Medium   | Very Low | 4        |
| Missing Loading UI           | Medium   | Very Low | 5        |
| Virtualization (1000+ items) | Medium   | Medium   | 6        |
| Similar Address Performance  | Low      | Low      | 7        |

---

## Code Metrics

| Metric                        | Value      | Status               |
| ----------------------------- | ---------- | -------------------- |
| Max Lines (SpaceSafeAccounts) | 132        | ✅ Good              |
| Cyclomatic Complexity         | ~4         | ✅ Good              |
| memoized Values               | 4          | ✅ Adequate          |
| useCallback hooks             | 1          | ✅ Minimal           |
| Redux Selectors               | 6          | ⚠️ Many dependencies |
| RTK Queries (Page level)      | 1          | ✅ Good              |
| RTK Queries (Card level)      | 1 per card | ⚠️ N+1 problem       |
| Custom Hooks                  | 5          | ✅ Reusable          |

---

## Recommendations

### Short Term (v1)

1. Add loading skeleton while fetching space safes
2. Add error boundary around card rendering
3. Fix card key generation (remove `index`)
4. Add error UI for failed card queries

### Medium Term (v2)

1. Implement RTK Query batching for card overviews
2. Optimize Redux selector composition with `createSelector`
3. Add virtualization support for 100+ item lists
4. Implement Web Worker for similarity detection

### Long Term (v3)

1. Denormalize API to include overview data in space safes response
2. Implement advanced filtering (by chain, owner status, threshold)
3. Add bulk actions (remove multiple safes, export CSV)
4. Implement infinite scroll / pagination for 1000+ safes
