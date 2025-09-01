import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text, H3 } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { TransactionHeader } from '@/src/features/ConfirmTx/components/TransactionHeader'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { HashDisplay } from '@/src/components/HashDisplay'
import { ThresholdChangeDisplay } from '../shared/ThresholdChangeDisplay'

interface HistoryAddSignerProps {
  txId: string
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
  executedAt: number
}

export function HistoryAddSigner({ txId, txInfo, executionInfo, executedAt }: HistoryAddSignerProps) {
  const activeChain = useAppSelector(selectActiveChain)

  return (
    <>
      <TransactionHeader
        logo={txInfo.settingsInfo?.owner?.value}
        isIdenticon
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={<H3 fontWeight={600}>Add signer</H3>}
        submittedAt={executedAt}
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">New signer</Text>
              <View flexDirection="row" alignItems="center" gap="$2">
                <HashDisplay value={txInfo.settingsInfo?.owner?.value} />
              </View>
            </View>

            <ThresholdChangeDisplay txInfo={txInfo} executionInfo={executionInfo} />

            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">Network</Text>
              <View flexDirection="row" alignItems="center" gap="$2">
                <Logo logoUri={activeChain?.chainLogoUri} size="$6" />
                <Text fontSize="$4">{activeChain?.chainName}</Text>
              </View>
            </View>

            <HistoryAdvancedDetailsButton txId={txId} />
          </Container>
        </YStack>
      </View>
    </>
  )
}
