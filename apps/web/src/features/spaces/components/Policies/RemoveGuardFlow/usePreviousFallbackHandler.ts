import useAsync from '@safe-global/utils/hooks/useAsync'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import {
  getDefaultFallbackHandlerAddress,
  getTokenCallbackHandlerAddress,
} from '@/features/policy-guard/public/services/fallbackHandlers'
import { readPreviousFallbackHandler } from '@/features/policy-guard/public/services/previousFallbackHandler'

export type PreviousFallbackHandler = {
  address: string
  /** The Safe's events did not tell the handler before the setup, so this is the default one of its version. */
  isDefault: boolean
}

/** The fallback handler a guard removal sets back; undefined while it is read. */
export const usePreviousFallbackHandler = (): PreviousFallbackHandler | undefined => {
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress
  const provider = scope?.web3ReadOnly
  const version = scope?.safe?.version

  // `null` once the read found no change to the TokenCallbackHandler, to tell it apart from a read not done yet
  const [previous, error] = useAsync(() => {
    const tokenCallbackHandler = chainId ? getTokenCallbackHandlerAddress(chainId) : undefined
    if (!provider || !safeAddress || !tokenCallbackHandler) return
    return readPreviousFallbackHandler(provider, safeAddress, tokenCallbackHandler).then((handler) => handler ?? null)
  }, [provider, safeAddress, chainId])

  if (previous) return { address: previous, isDefault: false }
  if (previous === undefined && !error) return undefined

  const defaultHandler = chainId && version ? getDefaultFallbackHandlerAddress(chainId, version) : undefined
  return defaultHandler ? { address: defaultHandler, isDefault: true } : undefined
}
