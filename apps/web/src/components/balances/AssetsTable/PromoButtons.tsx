import React, { type ReactElement } from 'react'
import { TokenType } from '@safe-global/store/gateway/types'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import StakeButton from '@/features/stake/components/StakeButton'
import EarnButton from '@/features/earn/components/EarnButton'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { isEligibleEarnToken } from '@/features/earn/utils'

interface PromoButtonsProps {
  tokenInfo: Balance['tokenInfo']
  chainId: string
  isStakingPromoEnabled: boolean
  isEarnPromoEnabled: boolean
}

export const PromoButtons = ({
  tokenInfo,
  chainId,
  isStakingPromoEnabled,
  isEarnPromoEnabled,
}: PromoButtonsProps): ReactElement | null => {
  const showStakeButton = isStakingPromoEnabled && tokenInfo.type === TokenType.NATIVE_TOKEN
  const showEarnButton = isEarnPromoEnabled && isEligibleEarnToken(chainId, tokenInfo.address)

  if (!showStakeButton && !showEarnButton) {
    return null
  }

  return (
    <>
      {showStakeButton && <StakeButton tokenInfo={tokenInfo} trackingLabel={STAKE_LABELS.asset} onlyIcon />}
      {showEarnButton && <EarnButton tokenInfo={tokenInfo} trackingLabel={EARN_LABELS.asset} onlyIcon />}
    </>
  )
}
