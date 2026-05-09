# Safe Apps SDK Interface

tx-builder communicates with the Safe{Wallet} host application via the Safe Apps SDK.

## SDK Integration

### Initialization

```typescript
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'

// Wrap app with SafeProvider
<SafeProvider>
  <App />
</SafeProvider>
```

### Using SDK Hooks

```typescript
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

const { sdk, safe, connected } = useSafeAppsSDK()

// safe object contains:
interface SafeInfo {
  safeAddress: string // Current Safe address
  chainId: number // Current chain ID
  threshold: number // Required signatures
  owners: string[] // Owner addresses
  isReadOnly: boolean // Whether user can sign
}
```

## Transaction Submission

### Single Transaction

```typescript
const txResponse = await sdk.txs.send({
  txs: [
    {
      to: contractAddress,
      value: '0',
      data: encodedCallData,
    },
  ],
})

// Response
interface SendTransactionsResponse {
  safeTxHash: string // Safe transaction hash
}
```

### Multi-Send Batch

```typescript
// tx-builder batches multiple transactions into one
const txResponse = await sdk.txs.send({
  txs: transactions.map((tx) => ({
    to: tx.to,
    value: tx.value,
    data: tx.data,
  })),
})
```

## Safe Gateway API

### Contract ABI Fetching

```
GET /v1/chains/{chainId}/contracts/{address}
```

Response:

```typescript
interface ContractInfo {
  address: string
  name: string
  displayName: string
  logoUri: string
  contractAbi: {
    abi: ABIItem[]
    description: string
  }
  trustedForDelegateCall: boolean
}
```

### Implementation Detection (Proxies)

tx-builder uses `evm-proxy-detection` library to detect proxy contracts and fetch implementation ABIs.

```typescript
import detectProxyTarget from 'evm-proxy-detection'

const implementation = await detectProxyTarget(contractAddress, provider.request.bind(provider))
```
