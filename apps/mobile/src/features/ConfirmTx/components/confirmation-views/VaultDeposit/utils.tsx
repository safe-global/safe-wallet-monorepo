import React from 'react'
import { View, Text } from 'tamagui'
import { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { TokenAmount } from '@/src/components/TokenAmount'
import { ListTableItem } from '../../ListTable'

export const vaultTypeToLabel = {
  VaultDeposit: 'Deposit',
  VaultRedeem: 'Withdraw',
} as const

export const formatVaultDepositItems = (txInfo: VaultDepositTransactionInfo): ListTableItem[] => {
  const annualReward = Number(txInfo.expectedAnnualReward).toFixed(0)
  const monthlyReward = Number(txInfo.expectedMonthlyReward).toFixed(0)

  return [
    {
      label: 'Deposit via',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontWeight="700" fontSize="$4">
            {txInfo.vaultInfo.name}
          </Text>
        </View>
      ),
    },
    {
      label: 'Exp. annual reward',
      render: () => (
        <TokenAmount value={annualReward} tokenSymbol={txInfo.tokenInfo.symbol} decimals={txInfo.tokenInfo.decimals} />
      ),
    },
    {
      label: 'Exp. monthly reward',
      render: () => (
        <TokenAmount value={monthlyReward} tokenSymbol={txInfo.tokenInfo.symbol} decimals={txInfo.tokenInfo.decimals} />
      ),
    },
    {
      label: 'Performance fee',
      value: formatPercentage(txInfo.fee, true),
    },
  ]
}
