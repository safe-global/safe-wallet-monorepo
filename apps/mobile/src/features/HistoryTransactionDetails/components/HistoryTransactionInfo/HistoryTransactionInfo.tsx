import React from 'react'
import { YStack, View, Text } from 'tamagui'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { formatWithSchema } from '@/src/utils/date'
import { Badge } from '@/src/components/Badge'

import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import { HistoryConfirmationsInfo } from '../HistoryConfirmationsInfo/HistoryConfirmationsInfo'
import { Container } from '@/src/components/Container'
import { HashDisplay } from '@/src/components/HashDisplay'

interface HistoryTransactionInfoProps {
  txId: string
  txDetails: TransactionDetails
}

export function HistoryTransactionInfo({ txId, txDetails }: HistoryTransactionInfoProps) {
  const { detailedExecutionInfo, executedAt, txHash } = txDetails

  return (
    <YStack paddingHorizontal="$4" gap="$4" marginTop="$4">
      <Container padding="$4" gap="$4" borderRadius="$3">
        {executedAt && (
          <View alignItems="center" flexDirection="row" justifyContent="space-between">
            <Text color="$textSecondaryLight">Executed</Text>
            <Text fontSize="$4" color="$textPrimary">
              {formatWithSchema(executedAt, 'd MMM yyyy, HH:mm a')}
            </Text>
          </View>
        )}

        {txHash && (
          <View alignItems="center" flexDirection="row" justifyContent="space-between">
            <Text color="$textSecondaryLight">Transaction hash</Text>
            <HashDisplay
              value={txHash}
              showIdenticon={false}
              isAddress={false}
              copyIconSize={16}
              externalLinkSize={16}
              textProps={{ fontSize: '$4', color: '$textPrimary' }}
            />
          </View>
        )}

        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Status</Text>
          <Badge
            themeName="badge_success_variant1"
            circular={false}
            content="Success"
            fontSize={13}
            circleProps={{ paddingHorizontal: 8, paddingVertical: 2 }}
          />
        </View>
      </Container>

      {isMultisigDetailedExecutionInfo(detailedExecutionInfo) && (
        <HistoryConfirmationsInfo detailedExecutionInfo={detailedExecutionInfo} txId={txId} />
      )}
    </YStack>
  )
}
