import { useMemo } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpaceAssetsToolbarProps } from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsToolbar'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { NO_ASSETS_FILTERS, type AssetsFilters, type AssetsSafe } from './utils'

const toggle = <T>(values: T[], value: T, isSame: (a: T, b: T) => boolean = Object.is): T[] =>
  values.some((current) => isSame(current, value))
    ? values.filter((current) => !isSame(current, value))
    : [...values, value]

/** The toolbar's options: every Safe with its network count, and every network with its Safe count */
export const useAssetsToolbar = (
  safes: AssetsSafe[],
  filters: AssetsFilters,
  onChange: (filters: AssetsFilters) => void,
): SpaceAssetsToolbarProps => {
  const getName = useSafeNameResolver()
  const { configs } = useChains()

  return useMemo(() => {
    const nameOf = (address: string, chainId?: string) => getName(address, chainId)
    const safeOptions = safes.map(({ address, chainIds }) => ({
      safeAddress: address,
      name: nameOf(address, chainIds[0]),
      count: chainIds.length,
      checked: filters.safes.some((safe) => sameAddress(safe, address)),
    }))

    const chainIds = [...new Set(safes.flatMap((safe) => safe.chainIds))]
    const networkOptions = chainIds.map((chainId) => {
      const chain = configs.find((config) => config.chainId === chainId)
      return {
        chainId,
        name: chain?.chainName ?? chainId,
        logoUri: chain?.chainLogoUri,
        count: safes.filter((safe) => safe.chainIds.includes(chainId)).length,
        checked: filters.chainIds.includes(chainId),
      }
    })

    return {
      safe: {
        options: safeOptions,
        note: 'Sorted as in your Safe accounts',
        onToggle: (address: string) =>
          onChange({ ...filters, safes: toggle(filters.safes, address, (a, b) => sameAddress(a, b)) }),
      },
      network: {
        options: networkOptions,
        onToggle: (chainId: string) => onChange({ ...filters, chainIds: toggle(filters.chainIds, chainId) }),
      },
      chips: {
        safes: filters.safes.map((address) => ({
          safeAddress: address,
          name: nameOf(address) || shortenAddress(address),
        })),
        networkNames: networkOptions.filter(({ checked }) => checked).map(({ name }) => name),
      },
      onRemove: (filter) => onChange({ ...filters, [filter]: [] }),
      onClear: () => onChange(NO_ASSETS_FILTERS),
    }
  }, [safes, filters, onChange, getName, configs])
}
