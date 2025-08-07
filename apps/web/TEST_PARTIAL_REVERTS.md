// TEMPORARY FILE FOR TESTING - DO NOT COMMIT
import type { TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'

// Add this to useSimulation.ts temporarily for testing:
export const MOCK_PARTIAL_REVERT_RESPONSE: TenderlySimulation = {
  simulation: {
    id: 'mock-partial-revert-123',
    status: true, // Transaction succeeds overall
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
    call_trace: [
      {
        input: '0x1234',
        error: undefined, // Success
      },
      {
        input: '0x5678',
        error: 'Execution reverted: ERC20: transfer amount exceeds balance', // Internal revert
      },
      {
        input: '0x9abc',
        error: undefined, // Success
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

// To use this mock, temporarily modify getSimulation in utils.ts:
// return MOCK_PARTIAL_REVERT_RESPONSE // instead of actual API call