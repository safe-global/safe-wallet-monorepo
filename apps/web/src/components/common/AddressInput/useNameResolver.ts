import { useMemo } from 'react'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isDomain, resolveName } from '@/services/ens'
import { resolveUnstoppableAddress } from '@/services/ud'
import { useCurrentChain } from '@/hooks/useChains'
import useDebounce from '@/hooks/useDebounce'

const useNameResolver = (
  value?: string,
): { address: string | undefined; resolverError?: Error; resolving: boolean } => {
  const ethersProvider = useWeb3ReadOnly()
  const currentChain = useCurrentChain()
  const debouncedValue = useDebounce((value || '').trim(), 200)

  // Fetch an ENS resolution for the current address; fallback to UD
  const [resolved, resolverError, isResolving] = useAsync<{ name: string; address: string } | undefined>(async () => {
    if (!debouncedValue || !isDomain(debouncedValue)) return

    // Try ENS first if provider available
    if (ethersProvider) {
      try {
        const ensAddress = await resolveName(ethersProvider, debouncedValue)
        if (ensAddress) {
          return { name: debouncedValue, address: ensAddress }
        }
      } catch (_) {
        // continue to UD fallback
      }
    }

    // Try UD resolution (handles all UD TLDs and gracefully returns undefined for unsupported domains)
    const token = currentChain?.nativeCurrency?.symbol || 'ETH'
    const network = currentChain?.shortName?.toUpperCase()
    const udAddress = await resolveUnstoppableAddress(debouncedValue, { token, network })
    if (!udAddress) throw Error('Failed to resolve the address')
    return { name: debouncedValue, address: udAddress }
  }, [debouncedValue, ethersProvider, currentChain?.nativeCurrency?.symbol, currentChain?.shortName])

  const resolving = isResolving && !!debouncedValue
  const address = resolved && resolved.name === value ? resolved.address : undefined

  return useMemo(
    () => ({
      address,
      resolverError,
      resolving,
    }),
    [address, resolverError, resolving],
  )
}

export default useNameResolver
