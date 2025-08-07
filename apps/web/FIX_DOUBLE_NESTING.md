# Fix for Confusing Double Nesting: simulation.simulation.status

## ✅ COMPLETED

## Current Problem

```typescript
// Current confusing access pattern:
const isSuccess = simulation.simulation?.simulation.status || false
//                ^^^^^^^^^^^ ^^^^^^^^^^^ 
//                hook return API response
```

## Solution 1: Rename in UseSimulationReturn (Recommended)

Change the hook's return type to use a clearer name:

```typescript
// In useSimulation.ts
export type UseSimulationReturn =
  | {
      _simulationRequestStatus: FETCH_STATUS.NOT_ASKED | FETCH_STATUS.ERROR | FETCH_STATUS.LOADING
      simulationData: undefined  // <- Renamed from 'simulation'
      simulateTransaction: (params: SimulationTxParams) => void
      simulationLink: string
      requestError?: string
      resetSimulation: () => void
    }
  | {
      _simulationRequestStatus: FETCH_STATUS.SUCCESS
      simulationData: TenderlySimulation  // <- Renamed from 'simulation'
      simulateTransaction: (params: SimulationTxParams) => void
      simulationLink: string
      requestError?: string
      resetSimulation: () => void
    }
```

Then update getSimulationStatus:
```typescript
export const getSimulationStatus = (simulation: UseSimulationReturn): SimulationStatus => {
  // ...
  const isSuccess = simulation.simulationData?.simulation.status || false
  //                                      ^^^ Much clearer!
  const isCallTraceError = isSuccess && getCallTraceErrors(simulation.simulationData).length > 0
  // ...
}
```

## Solution 2: Add Getter Methods (Alternative)

Add convenience methods to the hook:

```typescript
// In useSimulation hook
const getSimulationStatus = () => simulationData?.simulation.status || false
const getCallTrace = () => simulationData?.transaction.call_trace || []

return {
  // ... existing fields
  getSimulationStatus,
  getCallTrace,
}
```

## Solution 3: Flatten in getSimulationStatus (Quick Fix)

Add a helper at the top of the function:

```typescript
export const getSimulationStatus = (simulationHook: UseSimulationReturn): SimulationStatus => {
  // Extract the nested data once
  const simulationData = simulationHook.simulation
  const tenderlyStatus = simulationData?.simulation.status || false
  
  // Now use the flattened variables
  const isSuccess = tenderlyStatus
  const isCallTraceError = isSuccess && getCallTraceErrors(simulationData).length > 0
  // ...
}
```

## Impact Analysis

### Files to Update for Solution 1:
1. `packages/utils/src/components/tx/security/tenderly/useSimulation.ts` - Type definition
2. `apps/web/src/components/tx/security/tenderly/useSimulation.ts` - Hook implementation
3. `packages/utils/src/components/tx/security/tenderly/utils.ts` - getSimulationStatus function
4. Any components using `simulation.simulation`

### Backwards Compatibility:
- Solution 1: Breaking change, but cleaner long-term
- Solution 2: Non-breaking, adds new methods
- Solution 3: Non-breaking, local improvement only

## Recommendation

Go with **Solution 1** - rename `simulation` to `simulationData` in the hook's return type. This makes the code much more readable:

- `simulation.simulationData.simulation.status` ✅ Clear what each level represents
- `simulation.simulation.simulation.status` ❌ Confusing and error-prone

The refactoring effort is worth it for long-term maintainability.

## Implementation Summary

We successfully implemented Solution 1. Here are the changes made:

### Files Updated:

1. **packages/utils/src/components/tx/security/tenderly/useSimulation.ts**
   - Changed type definition: `simulation: TenderlySimulation` → `simulationData: TenderlySimulation`

2. **packages/utils/src/components/tx/security/tenderly/utils.ts**
   - Updated `getSimulationStatus()` to use `simulationData` instead of `simulation`

3. **packages/utils/src/components/tx/security/tenderly/__tests__/utils.test.ts**
   - Updated all test cases to use `simulationData`

4. **apps/web/src/components/tx/security/tenderly/useSimulation.ts**
   - Updated hook return to use `simulationData: simulation`

5. **apps/web/src/components/tx/security/tenderly/__tests__/useSimulation.test.ts**
   - Updated all test expectations to use `simulationData`

6. **apps/web/src/components/tx-flow/TxInfoProvider.tsx**
   - Updated `initialSimulation` to use `simulationData`

7. **apps/web/src/components/tx/security/tenderly/index.tsx**
   - Updated destructuring and references to use `simulationData`

### Result:

The code is now much clearer:
- Before: `simulation.simulation?.simulation.status`
- After: `simulation.simulationData?.simulation.status`

Type checking passes successfully with these changes.