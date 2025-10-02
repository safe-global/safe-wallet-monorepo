import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { AllSafeItems } from './useAllSafesGrouped'
import { selectChains } from '@/store/chainsSlice'
import { useAppSelector } from '@/store'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import { isDomain } from '@/services/ens'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { resolveName } from '@/services/ens'
import { resolveUnstoppableAddress } from '@/services/ud'
import { useCurrentChain } from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const useSafesSearch = (safes: AllSafeItems, query: string): AllSafeItems => {
  const chains = useAppSelector(selectChains)
  const ethersProvider = useWeb3ReadOnly()
  const currentChain = useCurrentChain()

  // Resolve ENS/UD domain if query looks like a domain
  const [resolvedAddress] = useAsync<string | undefined>(async () => {
    if (!query || !isDomain(query)) return undefined

    // Try ENS first
    if (ethersProvider) {
      try {
        const ensAddress = await resolveName(ethersProvider, query)
        if (ensAddress) return ensAddress
      } catch (_) {
        // Continue to UD
      }
    }

    // Try UD
    const token = currentChain?.nativeCurrency?.symbol || 'ETH'
    const network = currentChain?.shortName?.toUpperCase()
    const udAddress = await resolveUnstoppableAddress(query, { token, network })
    return udAddress
  }, [query, ethersProvider, currentChain?.nativeCurrency?.symbol, currentChain?.shortName])

  // Include chain names in the search
  const safesWithChainNames = useMemo(
    () =>
      safes.map((safe) => {
        if (isMultiChainSafeItem(safe)) {
          const nestedSafeChains = safe.safes.map(
            (nestedSafe) => chains.data.find((chain) => chain.chainId === nestedSafe.chainId)?.chainName,
          )
          const nestedSafeNames = safe.safes.map((nestedSafe) => nestedSafe.name)
          return { ...safe, chainNames: nestedSafeChains, names: nestedSafeNames }
        }
        const chain = chains.data.find((chain) => chain.chainId === safe.chainId)
        return { ...safe, chainNames: [chain?.chainName], names: [safe.name] }
      }),
    [safes, chains.data],
  )

  const fuse = useMemo(
    () =>
      new Fuse(safesWithChainNames, {
        keys: [{ name: 'names' }, { name: 'address' }, { name: 'chainNames' }],
        threshold: 0.2,
        findAllMatches: true,
        ignoreLocation: true,
      }),
    [safesWithChainNames],
  )

  // Return results in the original format
  return useMemo(() => {
    if (!query) return []

    // If we have a resolved address from ENS/UD, filter by that address
    if (resolvedAddress) {
      return safesWithChainNames.filter((safe) => sameAddress(safe.address, resolvedAddress))
    }

    // Otherwise use fuzzy search
    return fuse.search(query).map((result) => {
      const { chainNames: _chainNames, names: _names, ...safe } = result.item
      return safe
    })
  }, [fuse, query, resolvedAddress, safesWithChainNames])
}

export { useSafesSearch }
