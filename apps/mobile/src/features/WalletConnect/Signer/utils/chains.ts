import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Network } from '@reown/appkit-common-react-native'
import { EIP155 } from '@safe-global/utils/features/walletconnect/constants'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import Logger from '@/src/utils/logger'
import { RPC_AUTHENTICATION } from '@safe-global/store/gateway/types'

/**
 * Extract the base URL from a block explorer URI template.
 * e.g., "https://etherscan.io/address/{{address}}" → "https://etherscan.io"
 */
function extractBlockExplorerUrl(template: string): string | undefined {
  try {
    const url = new URL(template.replace(/\{\{.*?\}\}/g, 'placeholder'))
    return url.origin
  } catch {
    return undefined
  }
}

/**
 * Convert a CGW Chain object to a Reown AppKit Network.
 * Returns undefined for chains with API_KEY_PATH RPC authentication
 * (their RPC URL contains an unresolved placeholder).
 */
export function cgwChainToReownNetwork(chain: Chain): Network | undefined {
  if (chain.publicRpcUri.authentication === RPC_AUTHENTICATION.API_KEY_PATH) {
    Logger.warn(`Skipping chain ${chain.chainId} (${chain.chainName}): RPC requires API key`)
    return undefined
  }

  const explorerUrl = extractBlockExplorerUrl(chain.blockExplorerUriTemplate.address)

  return {
    id: parseInt(chain.chainId, 10),
    name: chain.chainName,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: chain.nativeCurrency.decimals,
    },
    rpcUrls: {
      default: { http: [chain.publicRpcUri.value] },
    },
    ...(explorerUrl && {
      blockExplorers: {
        default: { name: chain.chainName, url: explorerUrl },
      },
    }),
    chainNamespace: EIP155,
    caipNetworkId: getEip155ChainId(chain.chainId),
    testnet: chain.isTestnet,
    ...(chain.chainLogoUri && { imageUrl: chain.chainLogoUri }),
  }
}

/**
 * Convert an array of CGW chains to Reown networks.
 * Filters out chains with API_KEY_PATH RPC authentication.
 */
export function cgwChainsToReownNetworks(chains: Chain[]): Network[] {
  return chains.reduce<Network[]>((networks, chain) => {
    const network = cgwChainToReownNetwork(chain)
    if (network) {
      networks.push(network)
    }
    return networks
  }, [])
}
