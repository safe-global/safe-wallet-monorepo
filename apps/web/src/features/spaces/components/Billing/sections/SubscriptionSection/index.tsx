import { type ReactElement } from 'react'
import { Box, Button, Typography } from '@mui/material'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useManagePlan } from '@/features/spaces'
import { getPlanName, getSubscriptionNumberOfSafes } from '@/features/spaces'
import type { BillingState } from '@/features/spaces'
import StatusBadge from './StatusBadge'
import css from './styles.module.css'

const formatRenewalDate = (timestamp: number | null | undefined): string | null => {
  if (!timestamp) return null
  return new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SubscriptionSection = ({
  subscription,
  state,
}: {
  subscription: Subscription
  state: BillingState
}): ReactElement => {
  const { openPortal, isRedirecting } = useManagePlan()

  const planName = subscription.plan.name || getPlanName(subscription.metadata)
  const numberOfSafes = getSubscriptionNumberOfSafes(subscription)
  const renewalDate = formatRenewalDate(subscription.validUntil ?? subscription.cancelAt)

  const renewalLine =
    state === 'payment_failed'
      ? 'Renewal failed'
      : state === 'canceled'
        ? renewalDate
          ? `Ends on ${renewalDate}`
          : 'Canceled'
        : renewalDate
          ? `Renews on ${renewalDate}`
          : null

  return (
    <Box className={css.card} data-testid="billing-subscription-section">
      <Box className={css.topGroup}>
        <Box className={css.header}>
          <Box className={css.titleRow}>
            <Typography component="h2" className={css.planName}>
              {planName}
            </Typography>
            <StatusBadge state={state} />
          </Box>
          <Button
            variant="text"
            disableElevation
            className={css.managePlan}
            data-testid="billing-manage-plan"
            onClick={openPortal}
            disabled={isRedirecting}
          >
            {isRedirecting ? 'Opening…' : 'Manage plan'}
          </Button>
        </Box>

        {renewalLine && (
          <Typography className={css.renewal} data-testid="billing-renewal-line">
            {renewalLine}
          </Typography>
        )}

        <Typography className={css.paygNote}>
          This plan covers up to {numberOfSafes} Safe Account{numberOfSafes === 1 ? '' : 's'}.
        </Typography>
      </Box>
    </Box>
  )
}

export default SubscriptionSection
