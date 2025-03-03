import React, { useCallback } from 'react'
import { Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { SettingsInfoType } from '@safe-global/store/gateway/types'
import { SettingsChangeTransaction, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxSettingsCardProps {
  txInfo: SettingsChangeTransaction
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: (tx: Transaction) => void
}

export function TxSettingsCard({ txInfo, bordered, executionInfo, inQueue, onPress }: TxSettingsCardProps) {
  const isDeleteGuard = txInfo.settingsInfo?.type === SettingsInfoType.DELETE_GUARD
  const label = isDeleteGuard ? 'deleteGuard' : txInfo.dataDecoded.method

  const handleOnPress = useCallback(() => {
    onPress({ txInfo } as Transaction)
  }, [onPress, txInfo])

  return (
    <SafeListItem
      label={label}
      inQueue={inQueue}
      executionInfo={executionInfo}
      bordered={bordered}
      type="Settings change"
      onPress={handleOnPress}
      leftNode={
        <Theme name="logo">
          <View backgroundColor="$background" padding="$2" borderRadius={100}>
            <SafeFontIcon name="transaction-change-settings" />
          </View>
        </Theme>
      }
    />
  )
}
