import { type ReactElement } from 'react'
import { Typography } from '@mui/material'
import { useIsBillingVisible, useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import { UpsellBanner } from '@/components/common/UpsellBanner'

// TODO(PLA-1681 / PLA-1555): replace these static placeholders with the real 30-day tier-status figures.
const PLACEHOLDER = { periodDays: 30, movedUsd: '$432K', txCount: '41', feesUsd: '$70' }

const HistoryUpsellBanner = (): ReactElement | null => {
  const isBillingVisible = useIsBillingVisible()
  const spaceId = useCurrentSpaceId()

  // TODO(PLA-1699): also hide for active-plan Spaces once subscription data is wired outside the billing page.
  if (isBillingVisible !== true) {
    return null
  }

  return (
    <UpsellBanner
      elevation="lg"
      ctaLabel="Explore plans"
      ctaHref={spaceId ? `${AppRoutes.spaces.billing}?spaceId=${spaceId}` : AppRoutes.spaces.billing}
      onCtaClick={() => trackEvent(SPACE_EVENTS.EXPLORE_PLANS_CLICKED)}
      data-testid="history-upsell-banner"
    >
      <Typography fontWeight={600} sx={{ fontSize: 18, lineHeight: '27px' }}>
        Get flat pricing
      </Typography>
      <Typography sx={{ fontSize: 16, lineHeight: '24px' }}>
        In the past {PLACEHOLDER.periodDays} days, you moved <strong>{PLACEHOLDER.movedUsd}</strong> across{' '}
        <strong>{PLACEHOLDER.txCount}</strong> transactions and spent {PLACEHOLDER.feesUsd} in fees.
      </Typography>
    </UpsellBanner>
  )
}

export default HistoryUpsellBanner
