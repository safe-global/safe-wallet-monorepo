import React from 'react'
import { View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useRouter } from 'expo-router'
import { DataDecoded } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultiSendData } from '@/src/utils/transaction-guards'

interface ActionsRowProps {
  txId: string
  decodedData?: DataDecoded | null
  actionCount?: number | string | null
}

export function ActionsRow({ txId, decodedData, actionCount }: ActionsRowProps) {
  const router = useRouter()

  const handleViewActions = () => {
    router.push({
      pathname: '/transaction-actions',
      params: { txId },
    })
  }

  let count: string | undefined

  if (actionCount !== undefined && actionCount !== null) {
    count = actionCount.toString()
  } else if (decodedData && isMultiSendData(decodedData)) {
    if (decodedData.parameters?.[0]?.valueDecoded) {
      count = Array.isArray(decodedData.parameters[0].valueDecoded)
        ? decodedData.parameters[0].valueDecoded.length.toString()
        : '1'
    }
  }

  if (!count) {
    return null
  }

  return (
    <SafeListItem
      label="Actions"
      rightNode={
        <View flexDirection="row" alignItems="center" gap="$2">
          <Badge themeName="badge_background_inverted" content={count} circleSize="$6" />
          <SafeFontIcon name={'chevron-right'} />
        </View>
      }
      onPress={handleViewActions}
    />
  )
}
