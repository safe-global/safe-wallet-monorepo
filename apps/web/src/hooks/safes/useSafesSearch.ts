import { useMemo } from 'react'
import Fuse from 'fuse.js'
import { type AllSafeItems, isMultiChainSafeItem } from './useAllSafesGrouped'
import useChains from '@/hooks/useChains'

const useSafesSearch = (safes: AllSafeItems, query: string): AllSafeItems => {
  const { configs: chains } = useChains()

  // Include chain names in the search
  const safesWithChainNames = useMemo(
    () =>
      safes.map((safe) => {
        if (isMultiChainSafeItem(safe)) {
          const nestedSafeChains = safe.safes.map(
            (nestedSafe) => chains.find((chain) => chain.chainId === nestedSafe.chainId)?.chainName,
          )
          const nestedSafeNames = safe.safes.map((nestedSafe) => nestedSafe.name)
          return { ...safe, chainNames: nestedSafeChains, names: nestedSafeNames }
        }
        const chain = chains.find((chain) => chain.chainId === safe.chainId)
        return { ...safe, chainNames: [chain?.chainName], names: [safe.name] }
      }),
    [safes, chains],
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
  return useMemo(
    () =>
      query
        ? fuse.search(query).map((result) => {
            const { chainNames: _chainNames, names: _names, ...safe } = result.item
            return safe
          })
        : [],
    [fuse, query],
  )
}

export { useSafesSearch }
