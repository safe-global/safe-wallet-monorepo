import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'

export const useIsMultichainSafe = () => {
  const safeAddress = useSafeAddress()
  const { allMultiChainSafes } = useAllSafesGrouped()

  return useMemo(
    () => allMultiChainSafes?.some((account) => sameAddress(safeAddress, account.safes[0].address)),
    [allMultiChainSafes, safeAddress],
  )
}
