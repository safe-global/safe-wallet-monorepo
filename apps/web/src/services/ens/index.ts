import { isError, type Provider } from 'ethers'
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

// Lookups run on every debounced keystroke in address fields, so expected misses
// (chain without ENS, malformed name) must not reach observability — only genuine
// transport failures are worth reporting (an allowlist so unknown shapes stay quiet).
const GENUINE_FAILURE_CODES = ['NETWORK_ERROR', 'SERVER_ERROR', 'TIMEOUT'] as const

const logResolverFailure = (e: unknown): void => {
  if (GENUINE_FAILURE_CODES.some((code) => isError(e, code))) {
    const err = e as EthersError
    logError(ErrorCodes._101, err.reason || err.message)
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
