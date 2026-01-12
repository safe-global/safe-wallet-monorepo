# Tenderly Simulation API

tx-builder uses Tenderly to simulate transactions before execution.

## Environment Variables

```bash
VITE_TENDERLY_ORG_NAME=safe-global
VITE_TENDERLY_PROJECT_NAME=safe-apps
VITE_TENDERLY_SIMULATE_ENDPOINT_URL=https://api.tenderly.co/api/v1/account/{org}/project/{project}/simulate
```

## Simulation Request

```
POST /api/v1/account/{org}/project/{project}/simulate
```

### Request Body

```typescript
interface SimulationRequest {
  network_id: string // Chain ID
  from: string // Safe address (sender)
  to: string // Target contract
  input: string // Encoded call data
  value: string // Value in wei
  gas: number // Gas limit
  gas_price: string // Gas price
  save: boolean // Save simulation to dashboard
  save_if_fails: boolean // Save even if fails
  simulation_type: 'quick' | 'full'
}
```

### Response

```typescript
interface SimulationResponse {
  simulation: {
    id: string
    status: boolean // true = success
    gas_used: number
    method: string // Called method name
    block_number: number
  }
  transaction: {
    hash: string
    transaction_info: {
      call_trace: CallTrace[]
      logs: Log[]
      state_diff: StateDiff[]
    }
  }
}

interface CallTrace {
  call_type: 'CALL' | 'DELEGATECALL' | 'STATICCALL'
  from: string
  to: string
  gas: number
  gas_used: number
  input: string
  output: string
  error?: string
}
```

## Multi-Send Simulation

For batched transactions, tx-builder encodes all transactions into a MultiSend call:

```typescript
import { encodeMultiSendData } from '@safe-global/protocol-kit'

const multiSendData = encodeMultiSendData(transactions)
const simulation = await simulateTransaction({
  to: MULTI_SEND_ADDRESS,
  data: multiSendData,
  // ...
})
```
