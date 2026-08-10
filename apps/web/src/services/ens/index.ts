import { type Provider, type BigNumberish } from 'ethers'
import { resolveNameForChain as resolveNameOnHub } from '@safe-global/utils/utils/ens'
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
 * Delegates to the shared chain-specific coin-type lookup (no ETH fallback); failures are
 * logged and swallowed.
 */
export const resolveNameForChain = async (
  hubProvider: Provider,
  name: string,
  targetChainId: number,
): Promise<string | undefined> => {
  try {
    return (await resolveNameOnHub(hubProvider, name, targetChainId)) || undefined
  } catch (e) {
    const err = e as EthersError
    logError(ErrorCodes._101, err.reason || err.message)
  }
}
