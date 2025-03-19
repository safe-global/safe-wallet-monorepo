import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { AllSafeItems } from './useAllSafesGrouped'
import { selectChains } from '@/store/chainsSlice'
import { useAppSelector } from '@/store'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'

const useSafesSearch = (safes: AllSafeItems, query: string): AllSafeItems => {
  const chains = useAppSelector(selectChains)

  // Include chain names in the search
  const safesWithChainNames = useMemo(
    () =>
      safes.map((safe) => {
        if (isMultiChainSafeItem(safe)) {
          const subSafeChains = safe.safes.map(
            (subSafe) => chains.data.find((chain) => chain.chainId === subSafe.chainId)?.chainName,
          )
          const subSafeNames = safe.safes.map((subSafe) => subSafe.name)
          return { ...safe, chainNames: subSafeChains, names: subSafeNames }
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
