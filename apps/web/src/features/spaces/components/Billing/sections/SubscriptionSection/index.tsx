import { type ReactElement } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { ChartLine, ChevronDown, Fuel } from 'lucide-react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import Identicon from '@/components/common/Identicon'
import { useBillingData } from '../../BillingDataContext'
import StatusBadge from './StatusBadge'
import UsageTile from './UsageTile'
import { getUsageStatus } from './getUsageStatus'
import css from './styles.module.css'

/** Paid-plan header + usage dashboard. Manage-plan / selector / PAYG controls are presentational until Stripe + live data are wired. */
const SubscriptionSection = (): ReactElement | null => {
  const { subscription, subscriptionUsage } = useBillingData()

  if (!subscription || !subscriptionUsage) return null

  const status = getUsageStatus(subscriptionUsage, subscription)
  const { feeFreeVolume, gaslessTransactions, activeSafes } = subscriptionUsage
  const shownSafes = activeSafes.slice(0, 3)
  const overflowCount = activeSafes.length - shownSafes.length

  return (
    <Box className={css.card} data-testid="billing-subscription-section">
      <Box className={css.topGroup}>
        <Box className={css.header}>
          <Box className={css.titleRow}>
            <Typography component="h2" className={css.planName}>
              {subscription.planName}
            </Typography>
            <StatusBadge status={status} />
          </Box>
          <Button variant="text" disableElevation className={css.managePlan} data-testid="billing-manage-plan">
            Manage plan
          </Button>
        </Box>

        <Typography className={css.renewal} data-testid="billing-renewal-line">
          {status === 'payment_failed'
            ? 'Renewal failed'
            : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </Typography>

        <Box className={css.selectorRow}>
          <Box className={css.safesSelector} data-testid="billing-safes-selector">
            <Box className={css.avatarStack}>
              {shownSafes.map((address) => (
                <span key={address} className={css.avatar}>
                  <Identicon address={address} size={20} />
                </span>
              ))}
              {overflowCount > 0 && <span className={css.avatarMore}>+{overflowCount}</span>}
            </Box>
            <Typography className={css.safesLabel}>Active on {activeSafes.length} Safes</Typography>
            <ChevronDown size={16} />
          </Box>
          <Typography className={css.paygNote}>
            Transactions above your included volume are billed at{' '}
            <span className={css.paygLink}>pay-as-you-go rates</span>.
          </Typography>
        </Box>
      </Box>

      {status !== 'payment_failed' && (
        <Box className={css.tilesRow}>
          <UsageTile
            icon={<ChartLine size={20} strokeWidth={1.5} />}
            label="Fee-free volume remaining:"
            used={feeFreeVolume.usedUsd}
            total={feeFreeVolume.allowanceUsd}
            format={(value) => formatCurrency(value, 'USD', 4)}
            testId="billing-usage-volume"
            withStatusDot
          />
          <UsageTile
            icon={<Fuel size={20} strokeWidth={1.5} />}
            label="Gasless transactions remaining:"
            used={gaslessTransactions.used}
            total={gaslessTransactions.allowance}
            format={String}
            testId="billing-usage-gasless"
          />
        </Box>
      )}
    </Box>
  )
}

export default SubscriptionSection
