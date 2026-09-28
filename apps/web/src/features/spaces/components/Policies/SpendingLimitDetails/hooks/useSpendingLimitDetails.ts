import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { flattenSafeItems } from '@/hooks/safes'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import type { ActiveDrawerPolicy } from '../../SpendingLimitDrawer'

/** The limit is enforced by the Allowance module the policy names, not by Safe{Wallet}. */
const ENFORCED_BY = 'Safe allowance module'

export type SpendingLimitDetailsContent = {
  viewer: { address?: string; isSigner: boolean }
  safe: { address: string; name?: string }
  overview: { enforcedBy: string; lastUpdated?: string }
  names: Record<string, string>
  onConnectWallet: () => void
}

/**
 * Everything the drawer needs beyond the policy itself. Ownership comes from the Space's own safes,
 * which are already loaded, so opening a panel costs no request.
 */
export const useSpendingLimitDetails = (policy: ActiveDrawerPolicy): SpendingLimitDetailsContent => {
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

  const names = useMemo(
    () =>
      Object.fromEntries(
        policy.data.spenders.flatMap((spender) => {
          const name = addressBook.get(spender.spender, chainId)?.name
          return name ? [[spender.spender, name]] : []
        }),
      ),
    [policy.data.spenders, addressBook, chainId],
  )

  return {
    viewer: { address: wallet?.address, isSigner },
    safe: { address: safeAddress, name: addressBook.get(safeAddress, chainId)?.name },
    // TODO(WA-3630): pass `lastUpdated` once the policy payload carries a timestamp.
    overview: { enforcedBy: ENFORCED_BY },
    names,
    onConnectWallet,
  }
}
