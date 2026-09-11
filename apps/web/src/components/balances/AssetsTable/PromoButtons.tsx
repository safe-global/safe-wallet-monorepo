import React, { type ReactElement } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { EarnButton, isEligibleEarnToken } from '@/features/earn'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { isSafeToken } from '@/utils/safe-token'
import SafenetStakeButton from './SafenetStakeButton'

interface PromoButtonsProps {
  tokenInfo: Balance['tokenInfo']
  chainId: string
  isSafenetStakingEnabled: boolean
  isEarnPromoEnabled: boolean
}

export const PromoButtons = ({
  tokenInfo,
  chainId,
  isSafenetStakingEnabled,
  isEarnPromoEnabled,
}: PromoButtonsProps): ReactElement | null => {
  const showSafenetStakeButton = isSafenetStakingEnabled && isSafeToken(chainId, tokenInfo.address)
  const showEarnButton = isEarnPromoEnabled && isEligibleEarnToken(chainId, tokenInfo.address)

  if (!showSafenetStakeButton && !showEarnButton) {
    return null
  }

  return (
    <>
      {showSafenetStakeButton && <SafenetStakeButton />}
      {showEarnButton && <EarnButton tokenInfo={tokenInfo} trackingLabel={EARN_LABELS.asset} onlyIcon />}
    </>
  )
}
