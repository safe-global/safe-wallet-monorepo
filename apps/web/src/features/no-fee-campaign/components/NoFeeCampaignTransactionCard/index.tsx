import React from 'react'
import { useNoFeeCampaignEligibility, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'
import BlockedAddress from '@/components/common/BlockedAddress'
import { useDarkMode } from '@/hooks/useDarkMode'
import { NoFeeCampaignTransactionCardView } from '@views/features/no-fee-campaign/components/NoFeeCampaignTransactionCard/NoFeeCampaignTransactionCardView'

const NoFeeCampaignTransactionCard = () => {
  const isEnabled = useIsNoFeeCampaignEnabled()
  const { isEligible, isLoading, error, blockedAddress } = useNoFeeCampaignEligibility()
  const dark = useDarkMode()

  if (!isEnabled) {
    return null
  }

  const state = blockedAddress
    ? 'blocked'
    : isLoading
      ? 'loading'
      : error
        ? 'error'
        : isEligible === true
          ? 'eligible'
          : undefined

  // Not eligible state
  if (!state) {
    return null
  }

  return (
    <NoFeeCampaignTransactionCardView
      state={state}
      dark={dark}
      renderBlockedAddress={(props) => blockedAddress && <BlockedAddress address={blockedAddress} {...props} />}
    />
  )
}

export default NoFeeCampaignTransactionCard
