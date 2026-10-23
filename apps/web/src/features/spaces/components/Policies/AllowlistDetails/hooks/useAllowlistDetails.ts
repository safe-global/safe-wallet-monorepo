import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { flattenSafeItems } from '@/hooks/safes'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'
import {
  getPolicyStatus,
  isSpendingLimitPolicy,
  type Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { ActiveAllowlistPolicy } from '../../AllowlistDrawer/resolveState'

const ENFORCED_BY = 'Safe policy contract'

export type AllowlistDetailsContent = {
  viewer: { address?: string; isSigner: boolean }
  safe: { address: string; name?: string }
  /** CGW's allowlist policies carry no timestamp, so there is no last updated time. */
  overview: { enforcedBy: string }
  names: Record<string, string>
  onConnectWallet: () => void
  /** Counted per spender and token. */
  uncoveredSpendingLimitCount?: number
}

/** Ownership comes from the Space's own safes, already loaded, so opening a panel costs no request. */
export const useAllowlistDetails = (policy: ActiveAllowlistPolicy, policies: Policy[]): AllowlistDetailsContent => {
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

  // Recipients are named from the Space book alone, so every member reads the same policy; the Safe's
  // own name stays merged, to match the row.
  const names = useMemo(() => {
    const named: Array<[string, string]> = []

    for (const recipient of getAllowlistRecipients(policy.data)) {
      const name = addressBook.getFromSpace(recipient, chainId)?.name
      if (name) named.push([recipient, name])
    }

    return Object.fromEntries(named)
  }, [policy.data, addressBook, chainId])

  const uncoveredSpendingLimitCount = useMemo(() => {
    if (policy.spendingLimitsCovered) return undefined

    let count = 0
    for (const other of policies) {
      if (!isSpendingLimitPolicy(other) || getPolicyStatus(other) !== 'active') continue
      if (other.safe.chainId !== chainId || !sameAddress(other.safe.address, safeAddress)) continue
      count += other.data.spenders.reduce((sum, { allowances }) => sum + allowances.length, 0)
    }
    return count
  }, [policy.spendingLimitsCovered, policies, chainId, safeAddress])

  return {
    viewer: { address: wallet?.address, isSigner },
    safe: { address: safeAddress, name: addressBook.get(safeAddress, chainId)?.name },
    overview: { enforcedBy: ENFORCED_BY },
    names,
    onConnectWallet,
    uncoveredSpendingLimitCount,
  }
}
