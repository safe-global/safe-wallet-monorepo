import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text, H3 } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { TransactionHeader } from '@/src/features/ConfirmTx/components/TransactionHeader'
import { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTokenDetails } from '@/src/hooks/useTokenDetails'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { Address } from '@/src/types/address'
import { TokenAmount } from '@/src/components/TokenAmount'

import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { HashDisplay } from '@/src/components/HashDisplay'

interface HistoryTokenTransferProps {
  txId: string
  txInfo: TransferTransactionInfo
  executedAt: number
}

export function HistoryTokenTransfer({ txId, txInfo, executedAt }: HistoryTokenTransferProps) {
  const activeChain = useAppSelector(selectActiveChain)
  const { value, tokenSymbol, logoUri, decimals } = useTokenDetails(txInfo)

  const isOutgoing = txInfo.direction === 'OUTGOING'
  const address = isOutgoing ? txInfo.recipient.value : txInfo.sender.value

  // Determine badge icon based on direction
  const badgeIcon = isOutgoing ? 'transaction-outgoing' : 'transaction-incoming'
  const badgeColor = isOutgoing ? '$error' : '$success'
  const badgeThemeName = isOutgoing ? 'badge_error' : 'badge_success'

  const fieldLabel = isOutgoing ? 'To' : 'From'

  return (
    <>
      <TransactionHeader
        logo={logoUri}
        badgeIcon={badgeIcon}
        badgeThemeName={badgeThemeName}
        badgeColor={badgeColor}
        title={
          <H3 fontWeight={600}>
            <TokenAmount
              value={value}
              decimals={decimals}
              tokenSymbol={tokenSymbol}
              direction={txInfo.direction}
              preciseAmount
            />
          </H3>
        }
        submittedAt={executedAt}
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">{fieldLabel}</Text>

              <HashDisplay value={address as Address} />
            </View>

            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">Network</Text>

              <View flexDirection="row" alignItems="center" gap="$2">
                <Logo logoUri={activeChain?.chainLogoUri} size="$6" />
                <Text fontSize="$4">{activeChain?.chainName}</Text>
              </View>
            </View>

            {isOutgoing && <HistoryAdvancedDetailsButton txId={txId} />}
          </Container>
        </YStack>
      </View>
    </>
  )
}
