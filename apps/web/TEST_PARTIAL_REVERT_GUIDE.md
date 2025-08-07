# Testing Partial Revert Handling

The development server is running at http://localhost:3000

## Quick Test with Mock Data

To quickly test the partial revert UI without setting up complex transactions, temporarily modify the simulation response:

1. Edit `packages/utils/src/components/tx/security/tenderly/utils.ts`
2. Find the `getSimulation` function (around line 47)
3. Add this mock response at the beginning of the function:

```typescript
export const getSimulation = async (
  tx: TenderlySimulatePayload,
  customTenderly: EnvState['tenderly'] | undefined,
): Promise<TenderlySimulation> => {
  // TEMPORARY MOCK FOR TESTING - REMOVE BEFORE COMMIT
  return {
    simulation: {
      id: 'mock-partial-revert',
      status: true, // Overall success
      network_id: '1',
      created_at: new Date(),
      block_number: 18000000,
      transaction_index: 0,
      from: tx.from,
      to: tx.to,
      input: tx.input,
      gas: tx.gas,
      gas_price: tx.gas_price || '0',
      value: tx.value || '0',
      method: 'execTransaction',
      project_id: 'test',
      owner_id: 'test',
      access_list: null,
      queue_origin: '',
    },
    transaction: {
      hash: '0x123',
      status: true,
      block_number: 18000000,
      from: tx.from,
      to: tx.to,
      value: tx.value || '0',
      gas: tx.gas,
      gas_used: 80000,
      gas_price: 1000000000,
      method: 'execTransaction',
      call_trace: [
        { input: '0x1', error: undefined }, // Success
        { input: '0x2', error: 'Execution reverted: ERC20: transfer amount exceeds balance' }, // Partial revert
        { input: '0x3', error: undefined }, // Success
      ],
      network_id: '1',
      addresses: [],
      contract_ids: [],
      index: 0,
      block_hash: '0x',
      gas_fee_cap: 0,
      gas_tip_cap: 0,
      cumulative_gas_used: 0,
      effective_gas_price: 0,
      nonce: 0,
      function_selector: '',
      transaction_info: {} as any,
      timestamp: new Date(),
      decoded_input: null,
    },
    contracts: [],
    generated_access_list: [],
  } as TenderlySimulation

  // Original code (commented out for testing)
  /* const requestObject: RequestInit = { ... } */
}
```

## Testing Steps

1. **Navigate to a Safe**: Go to http://localhost:3000 and load any Safe

2. **Create a Transaction**: 
   - Click "New transaction"
   - Send any small amount of ETH to any address
   - Or use the Transaction Builder to create any transaction

3. **Simulate the Transaction**:
   - In the review step, click the "Simulate" button
   - With the mock data, you should see:
     - Orange "Warning" status instead of red "Error"
     - Message: "Simulation successful with warnings"
     - Text confirming you can proceed: "You can proceed with the transaction"

4. **Check Transaction List**:
   - Go to the Transactions page
   - Find a queued transaction
   - The simulation status should show "Can execute (with warnings)" in orange

## Testing Real Partial Reverts

To test with actual partial reverts:

1. **Use Transaction Builder**:
   - Go to Apps > Transaction Builder
   - Create a batch transaction with:
     ```
     1. ETH transfer (will succeed)
     2. Token transfer with amount > balance (will revert)
     3. Another ETH transfer (will succeed)
     ```

2. **Alternative - Contract Interaction**:
   - Deploy a contract that has functions with try/catch blocks
   - Call a function that internally catches and handles reverts

## What to Verify

✅ **Visual Elements**:
- Orange warning color (#FF8061)
- Warning triangle icon (not info icon)
- "Warning" text in simulation block

✅ **Messages**:
- "Simulation successful with warnings"
- "This transaction will execute successfully but contains internal reverts. You can proceed with the transaction."
- "Can execute (with warnings)" in transaction list

✅ **Functionality**:
- Execute button is enabled (not blocked)
- Can proceed with signing and execution
- Link to Tenderly report works

## Cleanup

**IMPORTANT**: After testing, remove the mock data from `getSimulation` function!