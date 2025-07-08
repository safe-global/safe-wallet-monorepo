import React from 'react'
import { Text, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useRouter } from 'expo-router'

interface ConfirmationsInfoProps {
  detailedExecutionInfo: MultisigExecutionDetails
  txId: string
}

export function ConfirmationsInfo({ detailedExecutionInfo, txId }: ConfirmationsInfoProps) {
  const router = useRouter()

  const hasEnoughConfirmations =
    detailedExecutionInfo?.confirmationsRequired === detailedExecutionInfo?.confirmations?.length

  const onConfirmationsPress = () => {
    router.push({
      pathname: '/confirmations-sheet',
      params: { txId },
    })
  }

  return (
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
            themeName={hasEnoughConfirmations ? 'badge_success_variant1' : 'badge_warning_variant1'}
          />

          <SafeFontIcon name="chevron-right" />
        </View>
      }
    />
  )
}
