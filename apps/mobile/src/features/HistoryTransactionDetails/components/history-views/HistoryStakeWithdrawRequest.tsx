import React, { useMemo } from 'react'
import { YStack, Text, View } from 'tamagui'
import {
  NativeStakingValidatorsExitTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { HistoryTransactionHeader } from '../HistoryTransactionHeader'
import { Container } from '@/src/components/Container'
import { TokenAmount } from '@/src/components/TokenAmount'
import { Alert } from '@/src/components/Alert'
import {
  stakingTypeToLabel,
  formatStakingWithdrawRequestItems,
} from '@/src/features/ConfirmTx/components/confirmation-views/Stake/utils'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'

interface HistoryStakeWithdrawRequestProps {
  txId: string
  txInfo: NativeStakingValidatorsExitTransactionInfo
  txData: TransactionData
}

export function HistoryStakeWithdrawRequest({ txId, txInfo, txData }: HistoryStakeWithdrawRequestProps) {
  const withdrawRequestItems = useMemo(() => formatStakingWithdrawRequestItems(txInfo, txData), [txInfo, txData])

  return (
    <YStack gap="$4">
      <HistoryTransactionHeader
        logo={txInfo.tokenInfo.logoUri ?? undefined}
        badgeIcon="transaction-stake"
        badgeColor="$textSecondaryLight"
        transactionType={stakingTypeToLabel[txInfo.type]}
      >
        <View alignItems="center">
          <TokenAmount
            value={txInfo.value}
            tokenSymbol={txInfo.tokenInfo.symbol}
            decimals={txInfo.tokenInfo.decimals}
            textProps={{ fontSize: '$6', fontWeight: '600' }}
          />
        </View>
      </HistoryTransactionHeader>

      <Container padding="$4" gap="$4" borderRadius="$3">
        {/* Withdraw Request Information */}
        {withdrawRequestItems.map((item, index) => {
          if ('renderRow' in item) {
            return item.renderRow()
          }
          return (
            <View key={index} alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">{item.label}</Text>
              {item.render ? item.render() : <Text fontSize="$4">{item.value}</Text>}
            </View>
          )
        })}

        <Text fontSize="$3" color="$textSecondaryLight" marginTop="$2">
          The selected amount and any rewards will be withdrawn from Dedicated Staking for ETH after the validator exit.
        </Text>

        <HistoryAdvancedDetailsButton txId={txId} />
      </Container>

      <Alert
        type="warning"
        message="This transaction is a withdrawal request. After it's executed, you'll need to complete a separate withdrawal transaction."
      />
    </YStack>
  )
}
