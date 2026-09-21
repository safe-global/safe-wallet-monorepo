import { isError, type Provider, type BigNumberish } from 'ethers'
import { resolveNameForChain as resolveNameOnHub } from '@safe-global/utils/utils/ens'
import { logError } from '../exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'

type EthersError = Error & {
  reason?: string
  code?: string
}

// ENS domains can have any TLD, so just check that it ends with a dot-separated tld
const DOMAIN_RE = /[^.]+[.][^.]+$/iu

export function isDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain)
}

// Lookups run on every debounced keystroke, so expected misses (chain without ENS,
// malformed name) must not be reported — only genuine transport failures: the codes
// below, or codeless errors (raw fetch rejections when the RPC is unreachable).
const GENUINE_FAILURE_CODES = ['NETWORK_ERROR', 'SERVER_ERROR', 'TIMEOUT', 'BAD_DATA', 'UNKNOWN_ERROR'] as const

const logResolverFailure = (e: unknown): void => {
  const err = e as EthersError
  // no code = not classified by ethers, e.g. a raw fetch rejection (RPC unreachable)
  if (err?.code === undefined || GENUINE_FAILURE_CODES.some((code) => isError(e, code))) {
    logError(ErrorCodes._101, err?.reason || err?.message)
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
    logResolverFailure(e)
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
    logResolverFailure(e)
  }
}
