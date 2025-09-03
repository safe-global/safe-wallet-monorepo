import { type Provider } from 'ethers'
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

export const resolveName = async (rpcProvider: Provider, name: string): Promise<string | undefined> => {
  try {
    return (await rpcProvider.resolveName(name)) || undefined
  } catch (e) {
    const err = e as EthersError
    logError(ErrorCodes._101, err.reason || err.message)
  }
}

export const lookupAddress = async (rpcProvider: Provider, address: string): Promise<string | undefined> => {
  try {
    const result = await rpcProvider.lookupAddress(address)
    const finalResult = result || undefined
    return finalResult
  } catch (e) {
    const err = e as EthersError
    console.log('[ENS Service] Error for address', address, ':', err)
    logError(ErrorCodes._101, err.reason || err.message)
  }
}

export const getAvatar = async (rpcProvider: Provider, address: string): Promise<string | undefined> => {
  try {
    const ensName = await lookupAddress(rpcProvider, address)
    if (!ensName) return undefined

    // Type assertion needed for ENS resolver methods
    const resolver = await (rpcProvider as any).getResolver(ensName)
    if (!resolver) return undefined

    return (await resolver.getAvatar()) || undefined
  } catch (e) {
    const err = e as EthersError
    logError(ErrorCodes._101, err.reason || err.message)
  }
}
