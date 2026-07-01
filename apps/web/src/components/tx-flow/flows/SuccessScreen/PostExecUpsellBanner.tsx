import { type ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import { useIsBillingVisible, useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import { UpsellBanner } from '@/components/common/UpsellBanner'

// TODO(PLA-1690 / PLA-1691): replace the static placeholder with the real per-tx fee snapshot.
const PLACEHOLDER_FEE = '$12.40'

const PostExecUpsellBanner = ({ className }: { className?: string }): ReactElement | null => {
  const isBillingVisible = useIsBillingVisible()
  const spaceId = useCurrentSpaceId()

  // TODO(PLA-1699): also hide for active-plan Spaces once subscription data is wired outside the billing page.
  if (isBillingVisible !== true) {
    return null
  }

  return (
    <Box className={className}>
      <UpsellBanner
        elevation="md"
        ctaLabel="Compare plans"
        ctaHref={spaceId ? `${AppRoutes.spaces.billing}?spaceId=${spaceId}` : AppRoutes.spaces.billing}
        onCtaClick={() => trackEvent(SPACE_EVENTS.COMPARE_PLANS_CLICKED)}
        data-testid="post-exec-upsell-banner"
      >
        <Typography fontWeight={600} sx={{ fontSize: 14, lineHeight: '20px' }}>
          Get flat pricing
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 12, lineHeight: '16px' }}>
          You paid <strong>{PLACEHOLDER_FEE}</strong> in fees for this transaction.
        </Typography>
      </UpsellBanner>
    </Box>
  )
}

export default PostExecUpsellBanner
