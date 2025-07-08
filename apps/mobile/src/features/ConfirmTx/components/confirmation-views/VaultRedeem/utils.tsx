import React from 'react'
import { View, Text } from 'tamagui'
import { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { ListTableItem } from '../../ListTable'

export const formatVaultRedeemItems = (txInfo: VaultRedeemTransactionInfo, totalNrr: number): ListTableItem[] => {
  return [
    {
      label: 'Current reward',
      render: () => (
        <TokenAmount
          value={txInfo.currentReward}
          tokenSymbol={txInfo.tokenInfo.symbol}
          decimals={txInfo.tokenInfo.decimals}
        />
      ),
    },
    {
      label: 'Withdraw from',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontWeight="700" fontSize="$4">
            {txInfo.vaultInfo.name}
          </Text>
        </View>
      ),
    },
    {
      label: 'Reward rate',
      value: formatPercentage(totalNrr),
    },
  ]
}
