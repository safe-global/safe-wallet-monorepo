import type { TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'

export const mockPartialRevertSimulation: TenderlySimulation = {
  simulation: {
    id: 'test-123',
    status: true, // Overall simulation succeeds
    network_id: '1',
    created_at: new Date(),
    block_number: 18000000,
    transaction_index: 0,
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    input: '0x',
    gas: 100000,
    gas_price: '1000000000',
    value: '0',
    method: 'multiSend',
    project_id: 'test',
    owner_id: 'test',
    access_list: null,
    queue_origin: '',
  },
  transaction: {
    hash: '0x123',
    status: true,
    block_number: 18000000,
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    value: '0',
    gas: 100000,
    gas_used: 80000,
    gas_price: 1000000000,
    method: 'multiSend',
    // This is the key part - call_trace with some errors
    call_trace: [
      {
        input: '0x',
        error: undefined, // First call succeeds
      },
      {
        input: '0x',
        error: 'Execution reverted: ERC20: transfer amount exceeds balance', // Second call fails
      },
      {
        input: '0x',
        error: undefined, // Third call succeeds
      },
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
}

export const mockFullySuccessfulSimulation: TenderlySimulation = {
  ...mockPartialRevertSimulation,
  transaction: {
    ...mockPartialRevertSimulation.transaction,
    call_trace: [
      {
        input: '0x',
        error: undefined,
      },
      {
        input: '0x',
        error: undefined,
      },
    ],
  },
}

export const mockFailedSimulation: TenderlySimulation = {
  ...mockPartialRevertSimulation,
  simulation: {
    ...mockPartialRevertSimulation.simulation,
    status: false, // Overall simulation fails
  },
  transaction: {
    ...mockPartialRevertSimulation.transaction,
    status: false,
    error_message: 'Transaction reverted',
    error_info: {
      error_message: 'Transaction reverted',
      address: '0x1234567890123456789012345678901234567890',
    },
  },
}