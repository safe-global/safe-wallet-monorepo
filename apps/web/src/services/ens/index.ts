import { type Provider, type BigNumberish } from 'ethers'
import { convertChainIdToCoinType, ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'
import { logError } from '../exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'

type EthersError = Error & {
  reason?: string
}

// ENS domains can have any TLD, so just check that it ends with a dot-separated tld
const DOMAIN_RE = /[^.]+[.][^.]+$/iu

export function isDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain)
}

export const resolveName = async (
  rpcProvider: Provider,
  name: string,
  coinType?: BigNumberish,
): Promise<string | undefined> => {
  try {
    return (await rpcProvider.resolveName(name, coinType)) || undefined
  } catch (e) {
    const err = e as EthersError
    logError(ErrorCodes._101, err.reason || err.message)
  }
}

export const lookupAddress = async (
  rpcProvider: Provider,
  address: string,
  coinType?: BigNumberish,
): Promise<string | undefined> => {
  try {
    return (await rpcProvider.lookupAddress(address, coinType)) || undefined
  } catch (e) {
    const err = e as EthersError
    logError(ErrorCodes._101, err.reason || err.message)
  }
}

/**
 * Forward-resolve an ENS name for a target chain via a hub provider (Mainnet/Sepolia).
 * Tries the chain-specific coin type first, then falls back to ETH (60) so names that only
 * set a mainnet addr record still work on L2s.
 */
export const resolveNameForChain = async (
  hubProvider: Provider,
  name: string,
  targetChainId: number,
): Promise<string | undefined> => {
  const coinType = convertChainIdToCoinType(targetChainId)
  const address = await resolveName(hubProvider, name, coinType)
  if (address || coinType === ETH_COIN_TYPE) {
    return address
  }

  return resolveName(hubProvider, name, ETH_COIN_TYPE)
}
