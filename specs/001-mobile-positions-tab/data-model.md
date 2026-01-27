# Data Model: Mobile Positions Tab

**Feature**: 001-mobile-positions-tab  
**Date**: 2026-01-19

## Entities

All entities are **read-only** from the CGW API. Types already defined in `@safe-global/store/gateway/AUTO_GENERATED/positions`.

### Protocol

Represents a DeFi protocol containing user positions.

```typescript
// From packages/store/src/gateway/AUTO_GENERATED/positions.ts
interface Protocol {
  protocol: string // Protocol identifier
  protocol_metadata: ProtocolMetadata // Display metadata
  fiatTotal: string // Total value in fiat (string for precision)
  items: PositionGroup[] // Grouped positions
}

interface ProtocolMetadata {
  name: string // Human-readable name (e.g., "Aave", "Lido")
  icon: ProtocolIcon
}

interface ProtocolIcon {
  url: string | null // Icon URL, may be null
}
```

**Uniqueness**: Protocol identified by `protocol` field within a single API response.

### PositionGroup

Groups positions by type within a protocol.

```typescript
interface PositionGroup {
  name: string // Group name (e.g., "Steakhouse", "Main Pool")
  items: Position[] // Positions in this group
}
```

### Position

Individual position within a protocol.

```typescript
interface Position {
  balance: string // Token balance (string for precision)
  fiatBalance: string // Fiat value
  fiatConversion: string // Conversion rate
  tokenInfo: TokenInfo // Token metadata
  fiatBalance24hChange: string | null // 24h change percentage
  position_type: PositionType | null // Position category
}

type PositionType = 'deposit' | 'loan' | 'locked' | 'staked' | 'reward' | 'wallet' | 'airdrop' | 'margin' | 'unknown'
```

### TokenInfo

Token metadata (polymorphic).

```typescript
type TokenInfo = NativeToken | Erc20Token | Erc721Token

interface BaseToken {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
}

interface NativeToken extends BaseToken {
  type: 'NATIVE_TOKEN'
}

interface Erc20Token extends BaseToken {
  type: 'ERC20'
}

interface Erc721Token extends BaseToken {
  type: 'ERC721'
}
```

## State Transitions

### Positions Loading State

```
[Initial] → [Loading] → [Loaded] or [Error]
                ↑            ↓
                └── [Refreshing] (data visible)
```

| State      | Trigger                          | UI                               |
| ---------- | -------------------------------- | -------------------------------- |
| Initial    | Tab not yet accessed             | N/A                              |
| Loading    | First tab access, no cached data | Green spinner centered           |
| Loaded     | Data received successfully       | Positions list                   |
| Error      | API failure                      | Error state with retry           |
| Refreshing | Pull-to-refresh                  | Native indicator + existing data |

### Protocol Section State

```
[Expanded] ↔ [Collapsed]
```

- Default: Expanded
- User toggle persists during session (not persisted to storage)

## API Endpoint

**Endpoint**: `GET /v1/chains/{chainId}/safes/{safeAddress}/positions/{fiatCode}`

**Query Parameters**:

- `refresh?: boolean` - Force fresh data from Zerion

**Response**: `Protocol[]`

**RTK Query Hook**: `usePositionsGetPositionsV1Query`

**Polling**: 5 minutes (`POLLING_INTERVAL = 300_000`)

## Derived Data

### Total Positions Value

```typescript
// Utility function
const calculatePositionsFiatTotal = (protocols: Protocol[]): number => {
  return protocols.reduce((acc, protocol) => acc + Number(protocol.fiatTotal), 0)
}
```

### Protocol Percentage

```typescript
// Utility function
const calculateProtocolPercentage = (protocolFiatTotal: string, totalFiatValue: number): number => {
  if (totalFiatValue === 0) return 0
  return Math.round((Number(protocolFiatTotal) / totalFiatValue) * 100)
}
```

### Readable Position Type

```typescript
// Utility function
const getReadablePositionType = (type: PositionType | null): string => {
  const labels: Record<PositionType, string> = {
    deposit: 'Deposited',
    loan: 'Debt',
    locked: 'Locked',
    staked: 'Staking',
    reward: 'Reward',
    wallet: 'Wallet',
    airdrop: 'Airdrop',
    margin: 'Margin',
    unknown: 'Unknown',
  }
  return type ? (labels[type] ?? 'Unknown') : 'Unknown'
}
```

## Validation Rules

1. **Empty state**: Display when `protocols.length === 0`
2. **Missing icon**: Use fallback icon when `protocol_metadata.icon.url === null`
3. **Missing fiat change**: Hide change indicator when `fiatBalance24hChange === null`
4. **Feature flag**: Hide entire tab when `FEATURES.POSITIONS` disabled for chain
