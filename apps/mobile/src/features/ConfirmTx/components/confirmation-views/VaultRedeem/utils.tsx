import React from 'react'
import { View, Text } from 'tamagui'
import { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { ListTableItem } from '../../ListTable'
import { Image } from 'expo-image'

export const formatVaultRedeemItems = (txInfo: VaultRedeemTransactionInfo): ListTableItem[] => {
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
          <Image source={{ uri: txInfo.vaultInfo.logoUri }} style={{ width: 24, height: 24 }} />
          <Text fontWeight="700" fontSize="$4">
            {txInfo.vaultInfo.name}
          </Text>
        </View>
      ),
    },
  ]
}
