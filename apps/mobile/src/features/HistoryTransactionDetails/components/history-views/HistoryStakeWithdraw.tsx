import React from 'react'
import { YStack, Text, View } from 'tamagui'
import {
  NativeStakingWithdrawTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { HistoryTransactionHeader } from '../HistoryTransactionHeader'
import { Container } from '@/src/components/Container'
import { TokenAmount } from '@/src/components/TokenAmount'
import { stakingTypeToLabel } from '@/src/features/ConfirmTx/components/confirmation-views/Stake/utils'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { NetworkDisplay } from '../shared/NetworkDisplay'
import { HashDisplay } from '@/src/components/HashDisplay'

interface HistoryStakeWithdrawProps {
  txId: string
  txInfo: NativeStakingWithdrawTransactionInfo
  txData: TransactionData
}

export function HistoryStakeWithdraw({ txId, txInfo, txData }: HistoryStakeWithdrawProps) {
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
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Contract</Text>
          <HashDisplay value={txData.to.value} />
        </View>

        <NetworkDisplay />

        <HistoryAdvancedDetailsButton txId={txId} />
      </Container>
    </YStack>
  )
}
