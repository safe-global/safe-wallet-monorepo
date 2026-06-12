import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'
import ConfirmationOrderHeader from '@/components/tx/ConfirmationOrder/ConfirmationOrderHeader'
import { InfoTooltip } from '@/components/common/InfoTooltip'

type StakingOrderConfirmationViewProps = {
  order: NativeStakingValidatorsExitTransactionInfo
}

const StakingConfirmationTxExit = ({ order }: StakingOrderConfirmationViewProps) => {
  const withdrawIn = formatDurationFromMilliseconds(order.estimatedExitTime + order.estimatedWithdrawalTime, [
    'days',
    'hours',
  ])

  return (
    <div className="flex flex-col gap-4">
      <ConfirmationOrderHeader
        blocks={[
          {
            value: `${order.numValidators} Validators`,
            label: 'Exit',
          },
          {
            value: order.value,
            tokenInfo: order.tokenInfo,
            label: 'Receive',
          },
        ]}
      />
      <FieldsGrid
        title={
          <>
            Withdraw in
            <InfoTooltip
              title={
                <>
                  Withdrawal time is the sum of:
                  <ul>
                    <li>Time until your validator is successfully exited after the withdraw request</li>
                    <li>Time for a stake to receive Consensus rewards on the execution layer</li>
                  </ul>
                </>
              }
            />
          </>
        }
      >
        Up to {withdrawIn}
      </FieldsGrid>
      <Typography variant="paragraph-small" color="muted" className="mt-4">
        The selected amount and any rewards will be withdrawn from Dedicated Staking for ETH after the validator exit.
      </Typography>
      <Alert variant="warning" className="mb-2">
        <TriangleAlert />
        <AlertDescription>
          This transaction is a withdrawal request. After it&apos;s executed, you&apos;ll need to complete a separate
          withdrawal transaction.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default StakingConfirmationTxExit
