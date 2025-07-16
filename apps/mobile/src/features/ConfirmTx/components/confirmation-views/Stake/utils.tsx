import { TokenAmount } from '@/src/components/TokenAmount'

import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'
import { Text, View } from 'tamagui'
import {
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTableItem } from '../../ListTable'

const CURRENCY = 'USD'

export const stakingTypeToLabel = {
  NativeStakingDeposit: 'Deposit',
  NativeStakingValidatorsExit: 'Withdraw request',
  NativeStakingWithdraw: 'Claim',
} as const

export const formatStakingDepositItems = (txInfo: NativeStakingDepositTransactionInfo): ListTableItem[] => {
  // Fee is returned in decimal format, multiply by 100 for percentage
  const fee = (txInfo.fee * 100).toFixed(2)

  return [
    {
      label: 'Rewards rate',
      value: `${txInfo.annualNrr.toFixed(3)}%`,
    },
    {
      label: 'Net annual rewards',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$1">
          <TokenAmount
            value={txInfo.expectedAnnualReward}
            tokenSymbol={txInfo.tokenInfo.symbol}
            decimals={txInfo.tokenInfo.decimals}
            textProps={{ fontWeight: 400 }}
          />
          <Text color="$textSecondaryLight">({formatCurrency(txInfo.expectedFiatAnnualReward, CURRENCY)})</Text>
        </View>
      ),
    },
    {
      label: 'Net monthly rewards',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$1">
          <TokenAmount
            value={txInfo.expectedMonthlyReward}
            tokenSymbol={txInfo.tokenInfo.symbol}
            decimals={txInfo.tokenInfo.decimals}
            textProps={{ fontWeight: 400 }}
          />
          <Text color="$textSecondaryLight">({formatCurrency(txInfo.expectedFiatMonthlyReward, CURRENCY)})</Text>
        </View>
      ),
    },
    {
      label: 'Widget fee',
      value: `${fee}%`,
    },
  ]
}

export const formatStakingValidatorItems = (txInfo: NativeStakingDepositTransactionInfo): ListTableItem[] => {
  return [
    {
      label: 'Validator',
      value: `${txInfo.numValidators}`,
    },
    {
      label: 'Activation time',
      value: formatDurationFromMilliseconds(txInfo.estimatedEntryTime),
    },
    {
      label: 'Rewards',
      value: 'Approx. every 5 days after activation',
    },
  ]
}

export const formatStakingWithdrawRequestItems = (
  txInfo: NativeStakingValidatorsExitTransactionInfo,
): ListTableItem[] => {
  const withdrawIn = formatDurationFromMilliseconds(txInfo.estimatedExitTime + txInfo.estimatedWithdrawalTime, [
    'days',
    'hours',
  ])

  return [
    {
      label: 'Exit',
      value: `${txInfo.numValidators} Validator${txInfo.numValidators !== 1 ? 's' : ''}`,
    },
    {
      label: 'Receive',
      render: () => (
        <TokenAmount
          value={txInfo.value}
          tokenSymbol={txInfo.tokenInfo.symbol}
          decimals={txInfo.tokenInfo.decimals}
          textProps={{ fontWeight: 600 }}
        />
      ),
    },
    {
      label: 'Withdraw in',
      value: `Up to ${withdrawIn}`,
    },
  ]
}
