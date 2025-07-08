import React, { useCallback } from 'react'
import { Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { SettingsInfoType } from '@safe-global/store/gateway/types'
import { SettingsChangeTransaction, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxSettingsCardProps = {
  txInfo: SettingsChangeTransaction
  onPress: (tx: Transaction) => void
} & Partial<SafeListItemProps>

export function TxSettingsCard({ txInfo, onPress, ...rest }: TxSettingsCardProps) {
  const isDeleteGuard = txInfo.settingsInfo?.type === SettingsInfoType.DELETE_GUARD
  const label = isDeleteGuard ? 'deleteGuard' : txInfo.dataDecoded.method

  const handleOnPress = useCallback(() => {
    onPress({ txInfo } as Transaction)
  }, [onPress, txInfo])

  return (
    <SafeListItem
      label={label}
      type="Settings change"
      onPress={handleOnPress}
      leftNode={
        <Theme name="logo">
          <View backgroundColor="$background" padding="$2" borderRadius={100}>
            <SafeFontIcon name="transaction-change-settings" />
          </View>
        </Theme>
      }
      {...rest}
    />
  )
}
