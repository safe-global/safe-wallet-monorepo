import { Alert, Stack, Typography } from '@mui/material'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'
import ConfirmationOrderHeader from '@/components/tx/ConfirmationOrder/ConfirmationOrderHeader'
import { InfoTooltip } from '@/features/stake/components/InfoTooltip'
import type { StakingTxExitInfo } from '@safe-global/safe-gateway-typescript-sdk'

type StakingOrderConfirmationViewProps = {
  order: StakingTxExitInfo
}

const StakingConfirmationTxExit = ({ order }: StakingOrderConfirmationViewProps) => {
  const withdrawIn = formatDurationFromMilliseconds(order.estimatedExitTime + order.estimatedWithdrawalTime, [
    'days',
    'hours',
  ])

  return (
    <Stack
      sx={{
        gap: 2,
      }}
    >
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
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mt: 2,
        }}
      >
        The selected amount and any rewards will be withdrawn from Dedicated Staking for ETH after the validator exit.
      </Typography>
      <Alert severity="warning" sx={{ mb: 1 }}>
        This transaction is a withdrawal request. After it&apos;s executed, you&apos;ll need to complete a separate
        withdrawal transaction.
      </Alert>
    </Stack>
  )
}

export default StakingConfirmationTxExit
