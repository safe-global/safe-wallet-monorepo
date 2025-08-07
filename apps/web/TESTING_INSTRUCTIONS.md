# Testing Partial Revert Handling

## Quick Test with Mock Data

1. **Temporarily modify** `packages/utils/src/components/tx/security/tenderly/utils.ts`:

```typescript
// Around line 50, replace the fetch with mock data:
export const getSimulation = async (
  tx: TenderlySimulatePayload,
  customTenderly: EnvState['tenderly'] | undefined,
): Promise<TenderlySimulation> => {
  // TEMPORARY FOR TESTING - REMOVE BEFORE COMMIT
  return {
    simulation: {
      id: 'test-partial-revert',
      status: true, // Overall success
      // ... other required fields
    },
    transaction: {
      status: true,
      call_trace: [
        { input: '0x', error: undefined },
        { input: '0x', error: 'Execution reverted: Insufficient balance' }, // Partial revert
        { input: '0x', error: undefined },
      ],
      // ... other required fields
    },
  } as TenderlySimulation

  // Original code below (commented out for testing)
  // const requestObject: RequestInit = { ... }
}
```

2. **Run the app**:
```bash
yarn workspace @safe-global/web dev
```

3. **Test scenarios**:
   - Create any transaction and click "Simulate"
   - You should see a yellow "Warning" status instead of red "Error"
   - The simulation message should show "Simulation successful with warnings"

## Testing with Real Transactions

### Option 1: Create a Batch Transaction with Intentional Revert

1. Use the Transaction Builder app
2. Create a batch with:
   - Valid ETH transfer (will succeed)
   - Token transfer with amount > balance (will revert)
   - Another valid transaction (will succeed)

### Option 2: Use Tenderly API Directly

1. Set up environment variables:
```bash
NEXT_PUBLIC_TENDERLY_ORG_NAME=safe
NEXT_PUBLIC_TENDERLY_PROJECT_NAME=safe-apps
NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL=https://api.tenderly.co/api/v1/simulate
```

2. Or use custom Tenderly credentials via Settings > Environment Variables

### Option 3: Intercept Network Requests

Use browser DevTools to override the Tenderly API response:

1. Open DevTools > Network tab
2. Find the Tenderly simulation request
3. Right-click > "Override content"
4. Modify the response to include partial reverts

## Expected Results

### Before Fix
- ❌ Red "Error" for any transaction with internal reverts
- Error message: "The transaction failed during the simulation"
- Users blocked from proceeding

### After Fix
- ⚠️ Yellow "Warning" for successful transactions with internal reverts
- Warning message: "Simulation successful with warnings"
- Users can proceed with the transaction
- Full details available on Tenderly

## Cleanup

**IMPORTANT**: Remove any test modifications before committing:
- Remove mock data from `getSimulation`
- Ensure all test files are excluded from commit