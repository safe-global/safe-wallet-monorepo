import { isError, type Provider } from 'ethers'
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

export const resolveName = async (rpcProvider: Provider, name: string): Promise<string | undefined> => {
  try {
    return (await rpcProvider.resolveName(name)) || undefined
  } catch (e) {
    logResolverFailure(e)
  }
}

export const lookupAddress = async (rpcProvider: Provider, address: string): Promise<string | undefined> => {
  try {
    return (await rpcProvider.lookupAddress(address)) || undefined
  } catch (e) {
    logResolverFailure(e)
  }
}
