import type { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import FieldsGrid from '@/components/tx/FieldsGrid'
import ConfirmationOrderHeader from '@/components/tx/ConfirmationOrder/ConfirmationOrderHeader'
import { formatDurationFromMilliseconds, formatVisualAmount, maybePlural } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import StakingStatus from './StakingStatus'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { BRAND_NAME } from '@/config/constants'

type StakingOrderConfirmationViewProps = {
  order: NativeStakingDepositTransactionInfo
  isTxDetails?: boolean
}

const CURRENCY = 'USD'

const StakingConfirmationTxDeposit = ({ order, isTxDetails }: StakingOrderConfirmationViewProps) => {
  const isOrder = !isTxDetails

  // the fee is returned in decimal format, so we multiply by 100 to get the percentage
  const fee = (order.fee * 100).toFixed(2)
  return (
    <div className={cn('flex flex-col', isOrder ? 'gap-4' : 'gap-2')}>
      {isOrder && (
        <ConfirmationOrderHeader
          blocks={[
            {
              value: order.value,
              tokenInfo: order.tokenInfo,
              label: 'Deposit',
            },
            {
              value: order.annualNrr.toFixed(3) + '%',
              label: 'Rewards rate (after fees)',
            },
          ]}
        />
      )}
      <FieldsGrid title="Net annual rewards">
        {formatVisualAmount(order.expectedAnnualReward, order.tokenInfo.decimals)} {order.tokenInfo.symbol}
        {' ('}
        {formatCurrency(order.expectedFiatAnnualReward, CURRENCY)})
      </FieldsGrid>
      <FieldsGrid title="Net monthly rewards">
        {formatVisualAmount(order.expectedMonthlyReward, order.tokenInfo.decimals)} {order.tokenInfo.symbol}
        {' ('}
        {formatCurrency(order.expectedFiatMonthlyReward, CURRENCY)})
      </FieldsGrid>
      <FieldsGrid
        title={
          <>
            Fee
            <InfoTooltip
              title={`The widget fee incurred here is charged by Kiln for the operation of this widget. The fee is calculated automatically. Part of the fee will contribute to a license fee that supports the Safe Community. Neither the Safe Ecosystem Foundation nor ${BRAND_NAME} operates the Kiln Widget and/or Kiln.`}
            />
          </>
        }
      >
        {fee} %
      </FieldsGrid>
      <div
        className={cn(
          'border-border-light flex flex-col gap-2',
          isOrder ? 'rounded border p-4' : 'mt-2 border-t pt-4 pb-2',
        )}
      >
        {isOrder ? (
          <Typography className="mb-4 font-bold">
            You will own{' '}
            <span className="bg-[var(--color-border-background)] rounded px-2 py-1">
              {order.numValidators} Ethereum validator{maybePlural(order.numValidators)}
            </span>
          </Typography>
        ) : (
          <FieldsGrid title="Validators">{order.numValidators}</FieldsGrid>
        )}

        <FieldsGrid title="Activation time">{formatDurationFromMilliseconds(order.estimatedEntryTime)}</FieldsGrid>

        <FieldsGrid title="Rewards">Approx. every 5 days after activation</FieldsGrid>

        {!isOrder && (
          <FieldsGrid title="Validator status">
            <StakingStatus status={order.status} />
          </FieldsGrid>
        )}

        {isOrder && (
          <Typography variant="paragraph-small" className="block mt-4 text-muted-foreground">
            Earn ETH rewards with dedicated validators. Rewards must be withdrawn manually, and you can request a
            withdrawal at any time.
          </Typography>
        )}
      </div>
    </div>
  )
}

export default StakingConfirmationTxDeposit
