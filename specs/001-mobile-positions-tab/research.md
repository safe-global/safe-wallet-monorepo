# Research: Mobile Positions Tab

**Feature**: 001-mobile-positions-tab  
**Date**: 2026-01-19

## Research Tasks

### 1. Existing Web Positions Implementation

**Task**: Analyze web positions code to identify reusable logic

**Findings**:

| File                                                    | Reusable? | Action                                           |
| ------------------------------------------------------- | --------- | ------------------------------------------------ |
| `utils.ts` → `getReadablePositionType()`                | ✅ Yes    | Extract to `packages/utils`                      |
| `usePositions.ts` → `transformAppBalancesToProtocols()` | ✅ Yes    | Extract to `packages/utils`                      |
| `usePositions.ts` → `POLLING_INTERVAL`                  | ✅ Yes    | Already in `apps/mobile/src/config/constants.ts` |
| `usePositionsFiatTotal.ts` → calculation                | ✅ Yes    | Extract calculation to `packages/utils`          |
| `usePositions.ts` → hook logic                          | ❌ No     | Platform-specific imports, recreate in mobile    |

**Decision**: Extract pure functions to `packages/utils/src/features/positions/`. Keep hooks platform-specific but share business logic.

**Rationale**: Pure functions have no platform dependencies. Hooks depend on platform-specific state management (web's `useChainId` vs mobile's `selectActiveSafe`).

---

### 2. Mobile Tab Component Pattern

**Task**: Find best practices for adding tabs to existing SafeTab component

**Findings**:

Current pattern in `apps/mobile/src/features/Assets/Assets.container.tsx`:

```typescript
const tabItems = [
  { label: 'Tokens', Component: TokensContainer },
  { label: 'NFTs', Component: NFTsContainer },
]
```

**Decision**: Add Positions tab to `tabItems` array between Tokens and NFTs, conditionally based on feature flag.

**Rationale**: Follows existing pattern. Conditional rendering already used elsewhere with `useHasFeature`.

**Alternatives considered**:

- Create separate screen for Positions → Rejected: breaks existing UX pattern, adds navigation complexity

---

### 3. Collapsible Sections in Lists

**Task**: Find pattern for collapsible sections in scrollable list within SafeTab

**Findings**:

`react-native-collapsible-tab-view` (already used) provides `Tabs.FlatList` and `Tabs.ScrollView`. For collapsible protocol sections:

Options:

1. **FlatList with collapsible row items** - Virtualized, handles large lists, collapsible state per item
2. **ScrollView with Accordion components** - Simpler, but no virtualization
3. **SectionList with collapsible headers** - Good for grouped data, but complex header management

**Decision**: Use `Tabs.FlatList` with collapsible `ProtocolSection` components as list items.

**Rationale**: We cannot guarantee a small number of protocols or positions. Users with diverse DeFi activity may have many protocols. FlatList provides virtualization for smooth scrolling regardless of list size, meeting the SC-004 requirement (smooth scroll through 50+ positions).

**Implementation approach**:

- Flatten data: each Protocol becomes a FlatList item
- ProtocolSection component handles its own expand/collapse state
- When expanded, positions render inline within the ProtocolSection (not nested FlatList)
- For protocols with many positions (50+), consider lazy rendering within expanded section

**Alternatives considered**:

- ScrollView → Rejected: no virtualization, performance degrades with large lists, violates "smooth scrolling" requirement

---

### 4. Pull-to-Refresh Pattern

**Task**: Verify pull-to-refresh pattern for Tabs.FlatList

**Findings**:

Pattern from `TxHistoryList.tsx`:

```typescript
<Tabs.FlatList
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
/>
```

**Decision**: Use native `RefreshControl` with `Tabs.FlatList`, matching existing TxHistory pattern.

**Rationale**: Established pattern, native OS indicator as specified. FlatList already supports RefreshControl.

---

### 5. Percentage Calculation

**Task**: Determine how to calculate protocol percentage of total

**Findings**:

Web implementation in `PositionsHeader`:

```typescript
const percentage = ((Number(protocol.fiatTotal) / positionsFiatTotal) * 100).toFixed(0)
```

**Decision**: Create `calculateProtocolPercentage(protocolFiatTotal: string, totalFiatValue: number): number` utility.

**Rationale**: Pure function, easily testable, can be shared.

---

### 6. RTK Query Endpoint Usage

**Task**: Verify positions endpoint availability in mobile

**Findings**:

Endpoint in `packages/store/src/gateway/AUTO_GENERATED/positions.ts`:

- `usePositionsGetPositionsV1Query` - already exported
- Types: `Protocol`, `Position`, `PositionGroup` - already exported

Mobile already imports from `@safe-global/store` in multiple places.

**Decision**: Import and use existing `usePositionsGetPositionsV1Query` directly.

**Rationale**: Endpoint already exists and is typed. No additional work needed.

---

## Summary of Decisions

| Area           | Decision                                       | Impact                |
| -------------- | ---------------------------------------------- | --------------------- |
| Code sharing   | Extract 4 pure functions to `packages/utils`   | Web refactor required |
| Tab pattern    | Add to existing `tabItems` array conditionally | Minimal change        |
| List structure | FlatList + collapsible ProtocolSection items   | Virtualized, scalable |
| Refresh        | Native RefreshControl                          | Standard pattern      |
| Percentage     | New shared utility function                    | Testable, reusable    |
| Data fetching  | Reuse existing RTK Query endpoint              | No backend changes    |

## Unresolved Items

None. All technical decisions resolved.
