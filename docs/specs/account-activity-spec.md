# Account Activity — Implementation Spec

> Extracted from the Security Hub branch to keep the PR focused.
> Rebuild in a separate PR using this spec as the blueprint.

## Overview

A tabular audit log of all **settings-change transactions** for a Safe account — signer additions/removals, threshold changes, module enable/disable, guard changes, contract upgrades, and fallback handler updates. Renders inside the Spaces Security Hub drawer as a second tab alongside the Security checks panel.

## Component structure

```
AccountActivity (index.tsx)
├── useAccountActivity (hook — data fetching + pagination)
├── utils.ts (settings type → label mapping)
├── SecurityTabs (tab switcher — "Security overview" | "Account activity")
└── EnhancedTable (shared component from @/components/common/EnhancedTable)
```

## Props

```tsx
type AccountActivityProps = {
  chainId: string
  safeAddress: string
}
```

No Redux, no router — it's a self-contained data component.

## Data fetching hook: `useAccountActivity`

### Signature

```tsx
const useAccountActivity = (chainId: string, safeAddress: string) => {
  entries: AccountActivityEntry[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
}
```

### Pagination strategy

- Uses `useLazyTransactionsGetTransactionsHistoryV1Query` (RTK Query lazy trigger)
- Fetches up to **10 pages** of transaction history (MAX_PAGES = 10)
- Collects settings-change transactions until **20 entries** (TARGET_ENTRIES = 20)
- Extracts cursor from the CGW response's `next` URL via `extractCursor()`
- Sets `hasMore = true` when either the page limit or entry target is reached before exhausting data
- Uses a cleanup function (`cancelled = true`) to prevent state updates after unmount

### Entry shape

```tsx
type AccountActivityEntry = {
  id: string // transaction.id
  transaction: Transaction // full CGW Transaction object
  timestamp: number // transaction.timestamp
  warnings: AccountActivityWarning[]
}

type AccountActivityWarning = {
  label: string
  severity: 'info' | 'warning' | 'error'
}
```

### Warning derivation (`deriveWarnings`)

| Condition                              | Label              | Severity |
| -------------------------------------- | ------------------ | -------- |
| `tx.txStatus === 'FAILED'`             | "Execution failed" | error    |
| `tx.executionInfo?.type === 'MODULE'`  | "Module-executed"  | warning  |
| Settings type in HIGH_RISK_CHANGES set | "Critical change"  | warning  |

HIGH_RISK_CHANGES: `CHANGE_MASTER_COPY`, `SET_GUARD`, `DELETE_GUARD`, `SET_FALLBACK_HANDLER`

## Table columns

| Column     | Width | Content                                                     |
| ---------- | ----- | ----------------------------------------------------------- |
| Timestamp  | 15%   | Date (Mon DD, YYYY) + time (HH:MM)                          |
| Nonce      | 8%    | Multisig nonce, "Module" for module txs, "—" otherwise      |
| Event      | 28%   | Label (bold) + warning chips + description + optional note  |
| Source     | 12%   | `safeAppInfo.name` or "Safe Wallet"                         |
| Signatures | 10%   | "X of Y" for multisig, "—" otherwise                        |
| Status     | 10%   | Executed / Failed / Cancelled / Awaiting signatures / Ready |
| Actions    | 17%   | "View transaction" button linking to tx detail page         |

### Event labels (utils.ts → `getSettingsMeta`)

| SettingsInfoType      | Label                      |
| --------------------- | -------------------------- |
| ADD_OWNER             | "Added signer"             |
| REMOVE_OWNER          | "Removed signer"           |
| SWAP_OWNER            | "Replaced signer"          |
| CHANGE_THRESHOLD      | "Changed threshold"        |
| CHANGE_IMPLEMENTATION | "Upgraded contract"        |
| ENABLE_MODULE         | "Enabled module"           |
| DISABLE_MODULE        | "Disabled module"          |
| SET_GUARD             | "Set guard"                |
| DELETE_GUARD          | "Removed guard"            |
| SET_FALLBACK_HANDLER  | "Changed fallback handler" |
| (unknown)             | "Configuration change"     |

### Event descriptions (`renderSettingsDescription`)

- **ADD_OWNER / REMOVE_OWNER**: `EthHashInfo` of the owner + "· threshold → N"
- **SWAP_OWNER**: `EthHashInfo(old)` → `EthHashInfo(new)`
- **CHANGE_THRESHOLD**: "Set to N"
- **CHANGE_MASTER_COPY**: `EthHashInfo` of the implementation
- **ENABLE_MODULE / DISABLE_MODULE**: `EthHashInfo` of the module
- **SET_GUARD**: `EthHashInfo` of the guard
- **SET_FALLBACK_HANDLER**: `EthHashInfo` of the handler
- **DELETE_GUARD**: no description
- If `humanDescription` is present, uses that (stripped of "with threshold N" suffix)

### Status styling

| Status                 | Color          |
| ---------------------- | -------------- |
| FAILED                 | error.main     |
| AWAITING_CONFIRMATIONS | warning.main   |
| AWAITING_EXECUTION     | warning.main   |
| Others                 | text.secondary |

## View transaction link

Uses `getTxLink(txId, chain, safeAddress)` from `@/utils/tx-link` to build the href. Renders as a text Button with `VisibilityRoundedIcon`.

## Loading / empty / error states

- **Loading**: 5 skeleton rectangles (56px height each)
- **Empty**: "No account configuration changes found" + subtitle about what appears here
- **Error**: red error.main text "Failed to load account activity"
- **Has more**: caption text "Showing the most recent N changes. Older entries are not displayed."

## SecurityTabs component

Simple MUI `Tabs` with two labels: "Security overview" and "Account activity". Accepts:

```tsx
type SecurityTabsProps = {
  value: number
  onChange: (event: SyntheticEvent, newValue: number) => void
  compact?: boolean // smaller sizing for drawer context
}
```

When compact: `minHeight: 36`, smaller font, tighter padding.

## Integration point (SecurityReportDrawer)

The drawer manages `reportTab` state (0 = Security overview, 1 = Account activity). SecurityTabs renders below the docked header. Tab 0 renders `SecurityPanelView`; tab 1 renders `AccountActivity`.

```tsx
<SecurityTabs value={reportTab} onChange={onTabChange} compact />
{reportTab === 0 && <SecurityPanelView ... />}
{reportTab === 1 && <AccountActivity chainId={chainId} safeAddress={safeAddress} />}
```

The parent SecurityHub page passes `reportTab` + `onTabChange` as props.

## Dependencies

- `@safe-global/store/gateway/AUTO_GENERATED/transactions` — `useLazyTransactionsGetTransactionsHistoryV1Query`, `Transaction`, `TransactionItem`, `DateLabel`, `SettingsChangeTransaction`, `MultisigExecutionInfo`
- `@safe-global/store/gateway/types` — `SettingsInfoType`
- `@/utils/transaction-guards` — `isSettingsChangeTxInfo`
- `@/components/common/EnhancedTable` — the shared sortable table
- `@/components/common/EthHashInfo` — address display
- `@/utils/tx-link` — `getTxLink` for building tx detail URLs
- `@/hooks/useChains` — `useCurrentChain` for chain config

## Test coverage needed

- `useAccountActivity`: mock the lazy query trigger, verify pagination logic (cursor extraction, MAX_PAGES, TARGET_ENTRIES), warning derivation, cleanup on unmount
- `AccountActivity` component: render with mock entries, verify table columns, empty/loading/error states, warning chips, "View transaction" link generation
- `utils.ts`: verify `getSettingsMeta` returns correct labels for all SettingsInfoType values + fallback
