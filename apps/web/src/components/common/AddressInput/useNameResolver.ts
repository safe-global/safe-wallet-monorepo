import { useMemo } from 'react'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isDomain, resolveName } from '@/services/ens'
import useDebounce from '@/hooks/useDebounce'

const useNameResolver = (
  value?: string,
): { address: string | undefined; resolverError?: Error; resolving: boolean } => {
  const ethersProvider = useWeb3ReadOnly()
  const debouncedValue = useDebounce((value || '').trim(), 200)

  // Fetch an ENS resolution for the current address
  const [ens, resolverError, isResolving] = useAsync<{ name: string; address: string } | undefined>(() => {
    if (!ethersProvider || !debouncedValue || !isDomain(debouncedValue)) return

    return resolveName(ethersProvider, debouncedValue).then((address) => {
      if (!address) throw Error('Failed to resolve the address')
      return { name: debouncedValue, address }
    })
  }, [debouncedValue, ethersProvider])

  const resolving = isResolving && !!ethersProvider && !!debouncedValue
  const address = ens && ens.name === value ? ens.address : undefined

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
