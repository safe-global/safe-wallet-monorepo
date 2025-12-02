# Transaction Flow State Persistence

## Overview

Transaction flow state is automatically saved to session storage, allowing users to reload the page and resume their transaction flow without losing progress. This improves the user experience for complex multi-step transactions and enables easier E2E testing.

## How It Works

### Automatic State Saving

When a user progresses through a transaction flow, the state is automatically saved to session storage after each step. The saved state includes:

- **flowType**: Identifier for the flow (e.g., "TokenTransfer")
- **step**: Current step number in the flow
- **data**: Form data and user inputs
- **txId**: Transaction ID (if editing an existing transaction)
- **txNonce**: Transaction nonce (if specified)
- **timestamp**: When the state was saved

### Automatic State Restoration

When a user opens a transaction flow, the system checks for saved state:

1. If saved state exists for the same flow type
2. And the state is not stale (< 1 hour old)
3. The flow automatically restores to the saved step with all data intact

### Automatic Cleanup

Saved state is automatically cleared when:

- The transaction flow completes successfully
- The user closes the transaction modal
- The saved state is older than 1 hour

## Usage for Flow Authors

### Adding State Persistence to a Flow

To enable state persistence for a transaction flow, simply add the `flowType` prop to the `TxFlow` component:

```tsx
import { TxFlow } from '@/components/tx-flow/TxFlow'

const MyCustomFlow = ({ txNonce, ...params }: MyFlowProps) => {
  return (
    <TxFlow
      initialData={myInitialData}
      flowType="MyCustomFlow" // Add this!
      txNonce={txNonce}
      // ... other props
    >
      {/* Flow steps */}
    </TxFlow>
  )
}
```

**Important**: Use a unique, stable `flowType` identifier that won't change between releases.

### Example: Token Transfer Flow

```tsx
const TokenTransferFlow = ({ txNonce, ...params }: MultiTokenTransferFlowProps) => {
  const initialData = useMemo<MultiTokenTransferParams>(
    () => ({
      recipients: [{ recipient: '', tokenAddress: ZERO_ADDRESS, amount: '' }],
      type: TokenTransferType.multiSig,
    }),
    [],
  )

  return (
    <TxFlow
      initialData={initialData}
      flowType="TokenTransfer" // Enables state persistence
      txNonce={txNonce}
      icon={AssetsIcon}
      subtitle="Send tokens"
      eventCategory={TxFlowType.TOKEN_TRANSFER}
    >
      <TxFlowStep title="New transaction">
        <CreateTokenTransfer txNonce={txNonce} />
      </TxFlowStep>
    </TxFlow>
  )
}
```

## Usage in Tests

### Cypress Example

Pre-fill a transaction flow with mock data:

```javascript
import { setMockTxFlowState, mockTxFlowData } from '@/components/tx-flow/txFlowStorage.testHelpers'

describe('Token Transfer Flow', () => {
  it('should complete a pre-filled token transfer', () => {
    cy.visit('/home?safe=eth:0x123...')

    // Set mock state before opening the flow
    cy.window().then((win) => {
      setMockTxFlowState(
        win,
        'TokenTransfer',
        1, // Start at step 1 (review screen)
        mockTxFlowData.TokenTransfer.single,
      )
    })

    // Open the token transfer flow - it will restore to step 1 with data
    cy.get('[data-testid="new-tx-btn"]').click()
    cy.get('[data-testid="send-tokens-btn"]').click()

    // Flow should now be at the review screen with pre-filled data
    cy.get('[data-testid="review-tx"]').should('exist')
    cy.contains('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045').should('exist')
  })
})
```

### Playwright Example

```typescript
import { test } from '@playwright/test'

test('pre-filled token transfer flow', async ({ page }) => {
  await page.goto('/home?safe=eth:0x123...')

  // Inject mock state into session storage
  await page.evaluate(() => {
    const mockState = {
      flowType: 'TokenTransfer',
      step: 1,
      data: {
        recipients: [
          {
            recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            tokenAddress: '0x0000000000000000000000000000000000000000',
            amount: '1',
          },
        ],
        type: 'multiSig',
      },
      timestamp: Date.now(),
    }

    sessionStorage.setItem('txFlowState_v1', JSON.stringify(mockState))
  })

  // Open the flow - it will restore with the mock data
  await page.click('[data-testid="new-tx-btn"]')
  await page.click('[data-testid="send-tokens-btn"]')

  // Should be at review screen with pre-filled data
  await page.waitForSelector('[data-testid="review-tx"]')
})
```

## API Reference

### Core Functions

#### `saveTxFlowState<T>(flowType, step, data, txId?, txNonce?)`

Manually save transaction flow state (usually done automatically).

#### `loadTxFlowState<T>(): SerializedTxFlowState<T> | null`

Load saved transaction flow state. Returns `null` if no state exists or if stale.

#### `clearTxFlowState()`

Clear saved transaction flow state.

### Test Helpers

#### `setMockTxFlowState(window, flowType, step, data, txId?, txNonce?)`

Set mock flow state for testing.

#### `getMockTxFlowState(window): SerializedTxFlowState | null`

Get current mock flow state (for verification in tests).

#### `clearMockTxFlowState(window)`

Clear mock flow state.

#### `mockTxFlowData`

Pre-defined mock data for common flow types:

```typescript
mockTxFlowData.TokenTransfer.single // Single token transfer
mockTxFlowData.TokenTransfer.batch // Batch token transfer
```

## State Schema

```typescript
type SerializedTxFlowState<T = any> = {
  flowType: string // Flow identifier
  step: number // Current step (0-indexed)
  data: T // Flow-specific data
  txId?: string // Optional transaction ID
  txNonce?: number // Optional nonce
  timestamp: number // Unix timestamp in milliseconds
}
```

## Best Practices

1. **Choose stable flowType identifiers**: Don't use component names that might change during refactoring
2. **Don't store sensitive data**: Avoid storing private keys or passwords in the flow state
3. **Test state restoration**: Ensure your flow handles restored state correctly
4. **Handle stale state gracefully**: Users might return after the 1-hour expiry
5. **Clear state on error**: If a flow encounters an unrecoverable error, clear the state

## Troubleshooting

### State not restoring

- Check that `flowType` prop is set on the `TxFlow` component
- Verify the flow type matches exactly (case-sensitive)
- Ensure state isn't older than 1 hour
- Check browser console for errors

### State persisting after flow completion

- Verify `clearTxFlowState()` is called in the submit handler
- Check that the modal close handler includes cleanup
- Look for exceptions that might prevent cleanup

### Testing issues

- Make sure test helpers are imported from `txFlowStorage.testHelpers`
- Verify session storage is enabled in the test environment
- Check that mock data structure matches the flow's expected format
