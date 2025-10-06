import { TokenAmount } from '@/src/components/TokenAmount'
import { HashDisplay } from '@/src/components/HashDisplay'
import { NetworkRow } from '@/src/components/NetworkRow'

import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'
import { Text, View } from 'tamagui'
import {
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTableItem } from '../../ListTable'
import { ValidatorStatus } from '@/src/components/ValidatorStatus'
import { ValidatorRow } from '@/src/components/ValidatorRow'

const CURRENCY = 'USD'

export const stakingTypeToLabel = {
  NativeStakingDeposit: 'Deposit',
  NativeStakingValidatorsExit: 'Withdraw request',
  NativeStakingWithdraw: 'Claim',
} as const

export const formatStakingDepositItems = (
  txInfo: NativeStakingDepositTransactionInfo,
  txData: TransactionData,
): ListTableItem[] => {
  // Fee is returned in decimal format, multiply by 100 for percentage
  const fee = (txInfo.fee * 100).toFixed(2)

  const items: ListTableItem[] = [
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

  items.push({
    label: 'Contract',
    render: () => <HashDisplay value={txData.to} />,
  })

  items.push({
    label: 'Network',
    render: () => <NetworkRow />,
  })

  return items
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
    {
      label: 'Validator status',
      render: () => {
        return <ValidatorStatus status={txInfo.status} />
      },
    },
  ]
}

export const formatStakingWithdrawRequestItems = (
  txInfo: NativeStakingValidatorsExitTransactionInfo,
  txData: TransactionData,
): ListTableItem[] => {
  const withdrawIn = formatDurationFromMilliseconds(txInfo.estimatedExitTime + txInfo.estimatedWithdrawalTime, [
    'days',
    'hours',
  ])

  return [
    {
      label: 'Contract',
      render: () => <HashDisplay value={txData.to} />,
    },
    {
      label: 'Network',
      render: () => <NetworkRow />,
    },
    {
      label: 'Exit',
      render: () => <ValidatorRow validatorIds={txInfo.validators} />,
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
    {
      label: 'Validator status',
      render: () => {
        return <ValidatorStatus status={txInfo.status} />
      },
    },
  ]
}
