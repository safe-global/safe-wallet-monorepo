# Ledger Transaction Hash Comparison

## Overview

This feature displays a modal dialog showing the transaction hash when executing transactions with a Ledger hardware wallet. Users can compare the hash shown in the browser with the hash displayed on their Ledger device before confirming the transaction.

## Current Implementation

### Scope

- **Transaction Execution Only**: The dialog currently only appears when executing transactions via `eth_signTransaction`
- **Does NOT trigger for**: EIP-712 message signing (e.g., signing SafeTx proposals via `eth_signTypedData`)

### Architecture

The implementation uses three main components:

#### 1. LedgerHashComparison Component
**Location**: `src/components/common/LedgerHashComparison/index.tsx`

- React component that renders a Material-UI dialog
- Uses `ExternalStore` for state management (consistent with codebase patterns)
- Displays transaction hash using existing `EthHashInfo` component (provides copy-to-clipboard functionality)
- Dialog persists until manually closed by user

**Key Features**:
- Non-blocking UI (doesn't freeze the signing flow)
- Copy button for easy hash verification
- Clean modal interface with instructions
- Automatically opens when hash is set in store
- Clears store state on close

#### 2. Ledger Module Integration
**Location**: `src/services/onboard/ledger-module.ts` (lines ~162-175)

The hash comparison is triggered in the `eth_signTransaction` handler:

```typescript
// Calculate hash and show comparison dialog before signing
const { keccak256 } = await import('ethers')
const txHash = keccak256(transaction.unsignedSerialized)

const { showLedgerHashComparison } = await import('@/components/common/LedgerHashComparison')
showLedgerHashComparison(txHash)

// Sign transaction on Ledger device
transaction.signature = await ledgerSdk.signTransaction(
  getAssertedDerivationPath(),
  hexaStringToBuffer(transaction.unsignedSerialized)!,
)
```

**Hash Calculation**:
- Uses `keccak256(transaction.unsignedSerialized)` to match what Ledger displays
- Calculates hash BEFORE sending to Ledger device
- Hash is from the unsigned transaction (before signature is added)

**Flow**:
1. Transaction parameters are prepared
2. Hash is calculated from unsigned serialized transaction
3. Dialog is shown (non-blocking)
4. Transaction is sent to Ledger device
5. User compares hashes and confirms on device
6. Transaction is signed and returned

#### 3. App Integration
**Location**: `src/pages/_app.tsx`

- `LedgerHashComparison` component added to app layout
- Listens for hash updates via ExternalStore subscription
- Available globally across the entire application

### State Management

Uses `ExternalStore` from `@safe-global/utils/services/ExternalStore`:

```typescript
const ledgerHashStore = new ExternalStore<string | undefined>(undefined)

export const showLedgerHashComparison = (hash: string) => {
  ledgerHashStore.setStore(hash)
}
```

**Benefits of ExternalStore**:
- Type-safe state management
- Automatic React integration via `useStore()` hook
- No manual event listener management
- Consistent with other stores in codebase (e.g., `wcChainSwitchStore`)

## User Flow

1. User initiates transaction execution (clicks "Execute" button)
2. Transaction data is prepared and hash is calculated
3. **Modal dialog appears** immediately with the transaction hash
4. Transaction is sent to Ledger device (in parallel)
5. Ledger device displays transaction details including hash
6. User compares hash in browser modal with hash on Ledger screen
7. User reviews and confirms transaction on Ledger device
8. Transaction is signed
9. User can close the modal dialog (or leave it open)

## Technical Details

### Transaction Hash Calculation

The hash displayed matches exactly what Ledger shows during blind signing:

```typescript
const txHash = keccak256(transaction.unsignedSerialized)
```

- `transaction.unsignedSerialized`: RLP-encoded unsigned transaction
- `keccak256()`: Ethereum hash function
- Result: 32-byte hash displayed as hex string (e.g., `0x1234...abcd`)

### Why This Works

The implementation avoids UI blocking by:
1. Using non-blocking MUI Dialog (not browser `alert()`)
2. Using ExternalStore for asynchronous state updates
3. Showing dialog before `await` on Ledger signing
4. Transaction is sent to Ledger immediately, dialog doesn't block the flow

## Future Extension: Message Signing

### Current Gap

When users sign SafeTx proposals (not executing yet), they use `eth_signTypedData` which:
- Does NOT trigger the hash comparison dialog
- Uses EIP-712 typed data signing (different format than transaction hashes)
- Ledger displays structured data fields, not just a hash

### Possible Implementation

To extend this feature to message signing, we would need to:

#### 1. Extend Ledger Module Handler

Add similar logic to `eth_signTypedData` handler in `ledger-module.ts`:

```typescript
eth_signTypedData: async (args) => {
  const typedData = JSON.parse(args.params[1])

  // Calculate EIP-712 hash
  const { TypedDataEncoder } = await import('ethers')
  const domain = typedData.domain
  const types = typedData.types
  const value = typedData.message
  const hash = TypedDataEncoder.hash(domain, types, value)

  // Show comparison dialog
  const { showLedgerHashComparison } = await import('@/components/common/LedgerHashComparison')
  showLedgerHashComparison(hash)

  // Sign on Ledger
  const signature = await ledgerSdk.signTypedData(getAssertedDerivationPath(), typedData)
  return Signature.from(signature).serialized
}
```

#### 2. Update Dialog Component

Enhance the dialog to show different messages based on signing type:

```typescript
export type LedgerHashType = 'transaction' | 'message'

export const showLedgerHashComparison = (hash: string, type: LedgerHashType = 'transaction') => {
  ledgerHashStore.setStore({ hash, type })
}
```

Then in the component:
```typescript
<Alert severity="info" sx={{ mb: 2 }}>
  {type === 'transaction'
    ? 'Compare this hash with the one displayed on your Ledger device before confirming the transaction.'
    : 'Compare this hash with the one displayed on your Ledger device before signing the message.'}
</Alert>
```

#### 3. Considerations

**EIP-712 Hash Display on Ledger**:
- Ledger may not show the full hash for EIP-712 signatures
- It typically shows structured data fields instead
- Need to verify what Ledger actually displays during blind signing of EIP-712 messages
- Hash format is different: `TypedDataEncoder.hash()` vs `keccak256(transaction.unsignedSerialized)`

**SafeTx Specific**:
- SafeTx uses EIP-712 with domain separator
- Hash shown would be the EIP-712 message hash
- This is what signers actually sign when creating a SafeTx signature

**UI/UX**:
- May want different labeling: "Message hash:" vs "Transaction hash:"
- Different alert text for signing vs execution
- Consider showing "Signing SafeTx" vs "Executing transaction"

### Testing Requirements

Before implementing message signing support:

1. **Verify Ledger Display**: Test what Ledger actually shows during EIP-712 signing
   - Does it show the full hash?
   - Does it show structured data fields?
   - Is blind signing required for SafeTx?

2. **Hash Format Validation**: Ensure the calculated hash matches what Ledger displays
   - Test with various SafeTx types
   - Verify domain separator handling
   - Check hash encoding (hex format, prefixes, etc.)

3. **User Testing**: Validate that the comparison is helpful
   - Can users actually verify the hash on Ledger?
   - Is the information displayed clearly enough?

## Files Modified

- `src/components/common/LedgerHashComparison/index.tsx` (new file)
- `src/services/onboard/ledger-module.ts` (modified `eth_signTransaction`)
- `src/pages/_app.tsx` (added component import and usage)

## Related Code Patterns

This implementation follows patterns from:
- `wcChainSwitchStore` - ExternalStore usage for modal state
- `EthHashInfo` - Hash display with copy functionality
- Other modal dialogs in the app - MUI Dialog patterns

## Security Considerations

- Hash is calculated from the unsigned transaction before signing
- No sensitive data is logged or stored permanently
- Dialog state is cleared when closed
- Only visible to Ledger wallet users
- Helps prevent blind signing attacks by allowing hash verification
