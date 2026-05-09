# External APIs

## Etherscan API

Used for fetching contract ABIs when not available from Safe Gateway.

### Get Contract ABI

```
GET https://api.etherscan.io/api
  ?module=contract
  &action=getabi
  &address={contractAddress}
  &apikey={apiKey}
```

Response:

```json
{
  "status": "1",
  "message": "OK",
  "result": "[{\"constant\":true,...}]"
}
```

### Network Endpoints

| Chain    | Endpoint                    |
| -------- | --------------------------- |
| Ethereum | api.etherscan.io            |
| Goerli   | api-goerli.etherscan.io     |
| Polygon  | api.polygonscan.com         |
| Arbitrum | api.arbiscan.io             |
| Optimism | api-optimistic.etherscan.io |
| Base     | api.basescan.org            |

## Sourcify API

Alternative source for verified contract ABIs.

### Get Contract Metadata

```
GET https://sourcify.dev/server/files/any/{chainId}/{address}
```

Response includes full contract metadata with ABI.

## RPC Endpoints

tx-builder uses the Safe Apps SDK's built-in provider, which proxies through the Safe{Wallet} host application. Direct RPC calls are made for:

1. **Reading contract state** (view/pure functions)
2. **Estimating gas**
3. **Detecting proxy implementations**

The provider is accessed via:

```typescript
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { SafeAppProvider } from '@safe-global/safe-apps-provider'

const { sdk, safe } = useSafeAppsSDK()
const provider = new SafeAppProvider(safe, sdk)
```
