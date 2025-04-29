import React from 'react'
import { Text, View, YStack } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useRouter } from 'expo-router'

export function TransactionInfo({
  detailedExecutionInfo,
  txId,
}: {
  detailedExecutionInfo: MultisigExecutionDetails
  txId: string
}) {
  const hasEnoughConfirmations =
    detailedExecutionInfo?.confirmationsRequired === detailedExecutionInfo?.confirmations?.length

  const router = useRouter()

  const onConfirmationsPress = () => {
    router.push({
      pathname: '/confirmations-sheet',
      params: { txId },
    })
  }

  const onTransactionChecksPress = () => {
    router.push({
      pathname: '/transaction-checks',
      params: { txId },
    })
  }

  return (
    <YStack paddingHorizontal="$4" gap="$4" marginTop="$4">
      <SafeListItem
        onPress={onTransactionChecksPress}
        leftNode={<SafeFontIcon name="shield" />}
        label="Transaction checks"
        rightNode={<SafeFontIcon name={'chevron-right'} />}
      />

      <SafeListItem
        label="Confirmations"
        onPress={onConfirmationsPress}
        rightNode={
          <View alignItems="center" flexDirection="row">
            <Badge
              circular={false}
              content={
                <View alignItems="center" flexDirection="row" gap="$1">
                  <SafeFontIcon size={12} name="owners" />

                  <Text fontWeight={600} color={'$color'}>
                    {detailedExecutionInfo?.confirmations?.length}/{detailedExecutionInfo?.confirmationsRequired}
                  </Text>
                </View>
              }
              // TODO: Add logic to check if confirmations are enough
              themeName={hasEnoughConfirmations ? 'badge_success_variant1' : 'badge_warning_variant1'}
            />

            <SafeFontIcon name="chevron-right" />
          </View>
        }
      />
    </YStack>
  )
}
