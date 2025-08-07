# Partial Revert Testing Documentation

## Overview

This feature updates how the Safe wallet UI displays Tenderly simulation results when transactions contain partial reverts (internal failures that don't cause the overall transaction to fail).

### What Changed

**Before**: Any internal revert → ❌ Red "Error" (blocks execution)  
**After**: Internal reverts with overall success → ⚠️ Orange "Warning" (allows execution)

## Technical Implementation

### 1. API Integration
- **100% Confirmed**: We use Tenderly's API at `https://api.tenderly.co/api/v1/simulate`
- API response includes:
  - `simulation.status`: Overall success/failure
  - `transaction.call_trace[]`: Array with individual call results
  - Each trace entry has optional `error` field for reverts

### 2. Logic Changes
```typescript
// packages/utils/src/components/tx/security/tenderly/utils.ts
const isSuccess = simulation.simulation?.simulation.status || false
const isCallTraceError = isSuccess && getCallTraceErrors(simulation.simulation).length > 0
const isPartialRevert = isSuccess && isCallTraceError // NEW
```

### 3. UI Updates
- New warning severity in alerts
- Warning icon (⚠️) instead of error icon (❌)
- Clear messaging: "You can proceed with the transaction"

## Testing Methods

### Method 1: Mock Simulation (Easiest)
Add this to `getSimulation` in `packages/utils/src/components/tx/security/tenderly/utils.ts`:

```typescript
// Add at line 51, before const requestObject
console.log('🧪 MOCK: Partial revert simulation')
return {
  simulation: { status: true, /* ... */ },
  transaction: {
    status: true,
    call_trace: [
      { input: '0x1', error: undefined },
      { input: '0x2', error: 'Execution reverted' }, // Partial revert
      { input: '0x3', error: undefined }
    ],
    /* ... */
  },
  /* ... */
} as TenderlySimulation
```

### Method 2: Real Contract Testing
Deploy a contract with try/catch:

```solidity
contract PartialRevertTest {
    function testPartialRevert() external {
        // This succeeds overall but has internal reverts
        try IFailingContract(0x...).doSomething() {
            // Success path
        } catch {
            // Handle failure - execution continues
        }
        
        // Rest of function executes normally
        emit Success();
    }
}
```

### Method 3: Network Override
In browser DevTools:
1. Network tab → Find Tenderly request
2. Right-click → "Override content"
3. Modify response to include `error` in some call_trace entries

## Test Scenarios

### ✅ What to Test

1. **Simulation UI**
   - Click "Simulate" on any transaction
   - Verify orange "Warning" status
   - Check warning message clarity

2. **Transaction List**
   - Queue view shows "Can execute (with warnings)"
   - Orange warning color

3. **Execution Flow**
   - Confirm "Submit" button is enabled
   - Transaction can be signed and executed

### 🔍 Edge Cases

1. **Complete Failure**: `simulation.status: false` → Still shows red error
2. **Full Success**: No errors in trace → Green success
3. **Multiple Reverts**: Multiple trace errors → Still shows warning (not error)

## Verification Checklist

- [ ] Warning color matches Safe palette (#FF8061)
- [ ] Warning triangle icon (not info icon)
- [ ] Message explicitly states "You can proceed"
- [ ] Tenderly link remains functional
- [ ] No console errors
- [ ] Hot reload picks up changes

## Cleanup

**IMPORTANT**: Remove any test mocks before committing!

```bash
# Check for test code
grep -n "MOCK\|TEST" packages/utils/src/components/tx/security/tenderly/utils.ts
```

## Files Changed

1. `packages/utils/src/components/tx/security/tenderly/utils.ts` - Logic
2. `packages/utils/src/components/tx/security/tenderly/types.ts` - Types
3. `apps/web/src/components/tx/security/tenderly/index.tsx` - UI
4. `apps/web/src/components/transactions/QueuedTxSimulation/index.tsx` - Queue UI
5. `apps/web/src/components/tx-flow/TxInfoProvider.tsx` - State management

## Related Tests

- `packages/utils/src/components/tx/security/tenderly/__tests__/utils.test.ts`
- Includes tests for `getCallTraceErrors` and `getSimulationStatus` with partial reverts