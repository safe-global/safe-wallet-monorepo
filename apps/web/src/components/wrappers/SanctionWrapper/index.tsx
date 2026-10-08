import { skipToken } from '@reduxjs/toolkit/query'
import type { ReactElement } from 'react'

import BlockedAddress from '@/components/common/BlockedAddress'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { useGetIsSanctionedQuery } from '@/store/api/ofac'
import { getKeyWithTrueValue } from '@/utils/helpers'
import madProps from '@/utils/mad-props'
import { SanctionWrapperView } from '@views/components/wrappers/SanctionWrapper/SanctionWrapperView'

// TODO: Use with swaps/staking
export function _SanctionWrapper({
  children,
  featureTitle,
  getSafeInfo,
  getWallet,
  isSanctioned,
}: {
  children: ReactElement
  featureTitle: string
  getSafeInfo: typeof useSafeInfo
  getWallet: typeof useWallet
  isSanctioned: typeof useGetIsSanctionedQuery
}): ReactElement | null {
  const { safeAddress } = getSafeInfo()
  const wallet = getWallet()

  const { data: isSafeAddressBlocked = false } = isSanctioned(safeAddress || skipToken)
  const { data: isWalletAddressBlocked = false } = isSanctioned(wallet?.address || skipToken)

  const blockedAddress = getKeyWithTrueValue({
    [safeAddress]: !!isSafeAddressBlocked,
    [wallet?.address || '']: !!isWalletAddressBlocked,
  })

  if (blockedAddress) {
    return (
      <SanctionWrapperView blockedAddress={<BlockedAddress address={blockedAddress} featureTitle={featureTitle} />} />
    )
  }

  return children
}

export const SanctionWrapper = madProps(_SanctionWrapper, {
  getWallet: () => useWallet,
  getSafeInfo: () => useSafeInfo,
  isSanctioned: () => useGetIsSanctionedQuery,
})
