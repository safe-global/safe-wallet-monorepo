import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text } from 'tamagui'
import { HistoryTransactionHeader } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionHeader'
import { TransactionData, TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTokenDetails } from '@/src/hooks/useTokenDetails'
import { TokenAmount } from '@/src/components/TokenAmount'

import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { HashDisplay } from '@/src/components/HashDisplay'
import { NetworkDisplay } from '../shared'

interface HistoryTokenTransferProps {
  txId: string
  txInfo: TransferTransactionInfo
  txData: TransactionData
}

export function HistoryTokenTransfer({ txId, txInfo, txData }: HistoryTokenTransferProps) {
  const { value, tokenSymbol, logoUri, decimals } = useTokenDetails(txInfo)

  const isOutgoing = txInfo.direction === 'OUTGOING'
  const address = isOutgoing ? txInfo.recipient : txInfo.sender

  // Determine badge icon based on direction
  const badgeIcon = isOutgoing ? 'transaction-outgoing' : 'transaction-incoming'
  const badgeColor = isOutgoing ? '$error' : '$success'
  const badgeThemeName = isOutgoing ? 'badge_error' : 'badge_success'

  const fieldLabel = isOutgoing ? 'To' : 'From'
  const transactionType = isOutgoing ? 'Sent' : 'Received'

  return (
    <>
      <HistoryTransactionHeader
        logo={logoUri}
        badgeIcon={badgeIcon}
        badgeThemeName={badgeThemeName}
        badgeColor={badgeColor}
        transactionType={transactionType}
      >
        <View alignItems="center">
          <TokenAmount
            value={value}
            decimals={decimals}
            tokenSymbol={tokenSymbol}
            direction={txInfo.direction}
            textProps={{ fontSize: '$8' }}
            preciseAmount
          />
        </View>
      </HistoryTransactionHeader>

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">{fieldLabel}</Text>

              <HashDisplay value={address} />
            </View>

            <NetworkDisplay />

            {isOutgoing && txData !== null && <HistoryAdvancedDetailsButton txId={txId} />}
          </Container>
        </YStack>
      </View>
    </>
  )
}
