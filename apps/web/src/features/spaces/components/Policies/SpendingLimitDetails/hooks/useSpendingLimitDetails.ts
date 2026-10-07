import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { flattenSafeItems } from '@/hooks/safes'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import type { ActiveDrawerPolicy } from '../../SpendingLimitDrawer'
import { formatLastUpdated } from '../../SpendingLimitDrawer/format'
import type { PendingSpendingLimitPolicy } from '../../types'

const ENFORCED_BY = 'Safe allowance module'

export type SpendingLimitDetailsContent = {
  viewer: { address?: string; isSigner: boolean }
  safe: { address: string; name?: string }
  overview: { enforcedBy: string; lastUpdated?: string }
  names: Record<string, string>
  onConnectWallet: () => void
}

/** Ownership comes from the Space's own safes, already loaded, so opening a panel costs no request. */
export const useSpendingLimitDetails = (
  policy: ActiveDrawerPolicy | PendingSpendingLimitPolicy,
): SpendingLimitDetailsContent => {
  const { chainId, address: safeAddress } = policy.safe
  const addressBook = useMergedAddressBooks(chainId)
  const wallet = useWallet()
  const onConnectWallet = useConnectWallet()
  const { allSafes } = useSpaceSafes()

  const isSigner = useMemo(
    () =>
      flattenSafeItems(allSafes).some(
        (item) => item.chainId === chainId && sameAddress(item.address, safeAddress) && !item.isReadOnly,
      ),
    [allSafes, chainId, safeAddress],
  )

  // Spenders are named from the Space book alone, so every member reads the same policy; the Safe's
  // own name stays merged, to match the row.
  const names = useMemo(() => {
    const named: Array<[string, string]> = []

    for (const { spender } of policy.data.spenders) {
      const name = addressBook.getFromSpace(spender, chainId)?.name
      if (name) named.push([spender, name])
    }

    return Object.fromEntries(named)
  }, [policy.data.spenders, addressBook, chainId])

  const lastUpdated = policy.status === 'active' ? formatLastUpdated(policy.data.spenders) : undefined

  return {
    viewer: { address: wallet?.address, isSigner },
    safe: { address: safeAddress, name: addressBook.get(safeAddress, chainId)?.name },
    overview: { enforcedBy: ENFORCED_BY, lastUpdated },
    names,
    onConnectWallet,
  }
}
