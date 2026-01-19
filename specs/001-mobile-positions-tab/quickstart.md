# Quickstart: Mobile Positions Tab

**Feature**: 001-mobile-positions-tab  
**Date**: 2026-01-19

## Prerequisites

- Node.js 18+
- Yarn 4 (via corepack)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)
- A Safe account with DeFi positions for testing

## Setup

```bash
# Clone and checkout feature branch
git checkout 001-mobile-positions-tab

# Install dependencies
yarn install

# Start mobile development
yarn workspace @safe-global/mobile start
```

## Development Workflow

### 1. Create Shared Utilities First

```bash
# Create positions utilities in shared package
mkdir -p packages/utils/src/features/positions/utils
mkdir -p packages/utils/src/features/positions/__tests__
```

Files to create:

1. `packages/utils/src/features/positions/utils/getReadablePositionType.ts`
2. `packages/utils/src/features/positions/utils/calculatePositionsFiatTotal.ts`
3. `packages/utils/src/features/positions/utils/calculateProtocolPercentage.ts`
4. `packages/utils/src/features/positions/index.ts` (exports)

### 2. Write Tests for Shared Utilities

```bash
# Run shared package tests
yarn workspace @safe-global/utils test --watch
```

### 3. Create Mobile Components

```bash
# Create positions components
mkdir -p apps/mobile/src/features/Assets/components/Positions
mkdir -p apps/mobile/src/features/Assets/components/Positions/ProtocolSection
mkdir -p apps/mobile/src/features/Assets/components/Positions/PositionItem
mkdir -p apps/mobile/src/features/Assets/components/Positions/PositionsEmpty
mkdir -p apps/mobile/src/features/Assets/components/Positions/PositionsError
```

### 4. Run Mobile Tests

```bash
# Run mobile tests
yarn workspace @safe-global/mobile test --watch
```

### 5. Test on Device/Simulator

```bash
# iOS
yarn workspace @safe-global/mobile ios

# Android
yarn workspace @safe-global/mobile android
```

## Testing Positions

### Finding a Safe with Positions

For testing, you need a Safe account that has positions in DeFi protocols. Options:

1. **Use existing test Safe** - Check team documentation for test accounts
2. **Create positions** - Deposit into protocols like Aave, Lido on testnet
3. **Mock data** - Use MSW to mock the positions endpoint (recommended for unit tests)

### Mock Data for Testing

```typescript
// Example mock protocol data for tests
const mockProtocol: Protocol = {
  protocol: 'aave-v3',
  protocol_metadata: {
    name: 'Aave V3',
    icon: { url: 'https://example.com/aave.png' },
  },
  fiatTotal: '1500.00',
  items: [
    {
      name: 'Main Pool',
      items: [
        {
          balance: '100000000',
          fiatBalance: '1500.00',
          fiatConversion: '0.000015',
          tokenInfo: {
            address: '0x...',
            decimals: 6,
            logoUri: 'https://example.com/usdc.png',
            name: 'USD Coin',
            symbol: 'USDC',
            type: 'ERC20',
          },
          fiatBalance24hChange: '0.5',
          position_type: 'deposit',
        },
      ],
    },
  ],
}
```

## Verification Checklist

Before marking tasks complete:

- [x] Shared utilities have high test coverage (100% lines, 97% branches)
- [x] Mobile components render correctly in all states (loading, loaded, error, empty)
- [x] Pull-to-refresh works with native indicator
- [x] Protocol sections expand/collapse
- [x] Percentage displays correctly (uses shared `calculateProtocolPercentage` + `formatPercentage`)
- [x] Position type labels display correctly
- [x] Feature flag hides tab when disabled
- [x] Web app still works after refactor to use shared utilities
- [x] Type-check passes: `yarn workspace @safe-global/mobile type-check`
- [x] Lint passes: `yarn workspace @safe-global/mobile lint`
- [x] All tests pass: `yarn workspace @safe-global/mobile test`

## Common Issues

### "Positions tab not showing"

- Check feature flag is enabled for the chain
- Verify `useHasFeature(FEATURES.POSITIONS)` returns true

### "Data not loading"

- Check Safe has positions (not all Safes do)
- Verify network connectivity
- Check RTK Query devtools for API errors

### "Percentage shows 0%"

- Verify `calculatePositionsFiatTotal` returns non-zero
- Check for division by zero protection

## Related Files

| Purpose            | Path                                                     |
| ------------------ | -------------------------------------------------------- |
| Spec               | `specs/001-mobile-positions-tab/spec.md`                 |
| Plan               | `specs/001-mobile-positions-tab/plan.md`                 |
| Research           | `specs/001-mobile-positions-tab/research.md`             |
| Data Model         | `specs/001-mobile-positions-tab/data-model.md`           |
| Web Reference      | `apps/web/src/features/positions/`                       |
| Shared Store Types | `packages/store/src/gateway/AUTO_GENERATED/positions.ts` |
| Mobile Assets      | `apps/mobile/src/features/Assets/`                       |
