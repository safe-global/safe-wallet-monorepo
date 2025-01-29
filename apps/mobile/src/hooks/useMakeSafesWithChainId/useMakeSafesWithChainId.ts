import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useMemo } from 'react'
import { makeSafeId } from '@/src/utils/formatters'

export function useMakeSafesWithChainId(safeAddress: string) {
  const chainIds = useAppSelector(selectAllChainsIds)
  const safes = useMemo(
    () => chainIds.map((chainId: string) => makeSafeId(chainId, safeAddress)).join(','),
    [chainIds, safeAddress],
  )
  return safes
}
