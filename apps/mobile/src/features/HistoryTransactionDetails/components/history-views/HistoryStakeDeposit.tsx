import React, { useMemo } from 'react'
import { YStack, Text, View } from 'tamagui'
import {
  NativeStakingDepositTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { HistoryTransactionHeader } from '../HistoryTransactionHeader'
import { Container } from '@/src/components/Container'
import { TokenAmount } from '@/src/components/TokenAmount'
import {
  stakingTypeToLabel,
  formatStakingDepositItems,
  formatStakingValidatorItems,
} from '@/src/features/ConfirmTx/components/confirmation-views/Stake/utils'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'

interface HistoryStakeDepositProps {
  txId: string
  txInfo: NativeStakingDepositTransactionInfo
  txData: TransactionData
}

export function HistoryStakeDeposit({ txId, txInfo, txData }: HistoryStakeDepositProps) {
  const items = useMemo(() => formatStakingDepositItems(txInfo, txData), [txInfo, txData])
  const validatorItems = useMemo(() => formatStakingValidatorItems(txInfo), [txInfo])
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
        {/* Staking Information */}
        {items.map((item, index) => {
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

        <HistoryAdvancedDetailsButton txId={txId} />
      </Container>

      <Container padding="$4" gap="$4" borderRadius="$3">
        {/* Validator Information */}
        {validatorItems.map((item, index) => {
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
          Earn ETH rewards with dedicated validators. Rewards must be withdrawn manually, and you can request a
          withdrawal at any time.
        </Text>
      </Container>
    </YStack>
  )
}
