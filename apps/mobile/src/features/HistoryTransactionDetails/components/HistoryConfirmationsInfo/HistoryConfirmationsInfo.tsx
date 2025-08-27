import React from 'react'
import { Text, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useRouter } from 'expo-router'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'
import { Address } from '@/src/types/address'

interface HistoryConfirmationsInfoProps {
  detailedExecutionInfo: MultisigExecutionDetails
  txId: string
}

export function HistoryConfirmationsInfo({ detailedExecutionInfo, txId }: HistoryConfirmationsInfoProps) {
  const router = useRouter()
  const importedSigners = useAppSelector(selectSigners)

  // Check if any of the imported signers (users on this device) have signed this transaction
  const hasUserSigned = detailedExecutionInfo?.confirmations?.some((confirmation) =>
    Object.keys(importedSigners).includes(confirmation.signer.value as Address),
  )

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
        <View alignItems="center" flexDirection="row" gap="$2">
          {hasUserSigned && (
            <Badge
              circleProps={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderWidth: 1,
              }}
              circular={false}
              content={
                <View alignItems="center" flexDirection="row" gap="$1">
                  <Text fontSize="$3" color="$textSecondaryLight" fontWeight={600}>
                    You signed
                  </Text>
                </View>
              }
              themeName="badge_outline"
            />
          )}

          <Badge
            circleProps={{ paddingHorizontal: 8, paddingVertical: 2 }}
            circular={false}
            content={
              <View alignItems="center" flexDirection="row" gap="$1">
                <SafeFontIcon size={12} name="owners" />
                <Text fontWeight={600} color={'$color'} fontSize="$2" lineHeight={18}>
                  {detailedExecutionInfo?.confirmations?.length}/{detailedExecutionInfo?.confirmationsRequired}
                </Text>
              </View>
            }
            themeName="badge_success_variant1"
          />
          <SafeFontIcon name="chevron-right" size={16} />
        </View>
      }
    />
  )
}
