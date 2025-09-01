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
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { ThresholdChangeDisplay } from '../shared/ThresholdChangeDisplay'

interface HistoryChangeThresholdProps {
  txId: string
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
  executedAt: number
}

export function HistoryChangeThreshold({ txId, txInfo, executionInfo, executedAt }: HistoryChangeThresholdProps) {
  const activeChain = useAppSelector(selectActiveChain)

  return (
    <>
      <TransactionHeader
        customLogo={
          <View borderRadius={100} padding="$2" backgroundColor="$backgroundSecondary">
            <SafeFontIcon color="$primary" name="owners" />
          </View>
        }
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={<H3 fontWeight={600}>Threshold change</H3>}
        submittedAt={executedAt}
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
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
