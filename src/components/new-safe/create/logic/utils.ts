import { isSmartContract } from '@/utils/wallets'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { sameAddress } from '@/utils/addresses'
import { createWeb3ReadOnly, getRpcServiceUrl } from '@/hooks/wallets/web3'
import { type ReplayedSafeProps } from '@/store/slices'
import { predictAddressBasedOnReplayData } from '@/components/welcome/MyAccounts/utils/multiChainSafe'

export const getAvailableSaltNonce = async (
  customRpcs: {
    [chainId: string]: string
  },
  replayedSafe: ReplayedSafeProps,
  chains: ChainInfo[],
  // All addresses from the sidebar disregarding the chain. This is an optimization to reduce RPC calls
  knownSafeAddresses: string[],
): Promise<string> => {
  let isAvailableOnAllChains = true
  const allRPCs = chains.map((chain) => {
    const rpcUrl = customRpcs?.[chain.chainId] || getRpcServiceUrl(chain.rpcUri)
    // Turn into Eip1993Provider
    return {
      rpcUrl,
      chainId: chain.chainId,
    }
  })

  for (const chain of chains) {
    const rpcUrl = allRPCs.find((rpc) => chain.chainId === rpc.chainId)?.rpcUrl
    if (!rpcUrl) {
      throw new Error(`No RPC available for  ${chain.chainName}`)
    }
    const web3ReadOnly = createWeb3ReadOnly(chain, rpcUrl)
    if (!web3ReadOnly) {
      throw new Error('Could not initiate RPC')
    }
    const safeAddress = await predictAddressBasedOnReplayData(replayedSafe, web3ReadOnly)
    const isKnown = knownSafeAddresses.some((knownAddress) => sameAddress(knownAddress, safeAddress))
    if (isKnown || (await isSmartContract(safeAddress, web3ReadOnly))) {
      // We found a chain where the nonce is used up
      isAvailableOnAllChains = false
      break
    }
  }

  // Safe is already deployed so we try the next saltNonce
  if (!isAvailableOnAllChains) {
    return getAvailableSaltNonce(
      customRpcs,
      { ...replayedSafe, saltNonce: (Number(replayedSafe.saltNonce) + 1).toString() },
      chains,
      knownSafeAddresses,
    )
  }

  return replayedSafe.saltNonce
}
