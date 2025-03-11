import React, { useCallback, useMemo } from 'react'
import { StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { AccountCard } from '@/src/components/transactions-list/Card/AccountCard'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Address } from '@/src/types/address'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { shortenAddress } from '@/src/utils/formatters'
import { RenderItemParams } from 'react-native-draggable-flatlist'
import { useEditAccountItem } from './hooks/useEditAccountItem'

interface AccountItemProps {
  chains: Chain[]
  account: SafeOverview
  drag?: RenderItemParams<SafeOverview>['drag']
  isDragging?: boolean
  activeAccount: Address
  onSelect: (accountAddress: string) => void
}

const getRightNodeLayout = (isEdit: boolean, isActive: boolean) => {
  if (isEdit) {
    return <SafeFontIcon name="rows" color="$backgroundPress" />
  }

  return isActive ? <SafeFontIcon name="check" color="$color" /> : null
}

export function AccountItem({ account, drag, chains, isDragging, activeAccount, onSelect }: AccountItemProps) {
  const { isEdit, deleteSafe } = useEditAccountItem()
  const isActive = activeAccount === account.address.value

  const handleChainSelect = () => {
    onSelect(account.address.value)
  }

  const rightNode = useMemo(() => getRightNodeLayout(isEdit, isActive), [isEdit, isActive])

  const onDeleteSafePress = useCallback(() => {
    Alert.alert('Delete Safe', 'Are you sure you want to delete this safe?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSafe(account.address.value as Address)
        },
      },
    ])
  }, [account.address.value, deleteSafe])

  return (
    <TouchableOpacity
      style={styles.container}
      disabled={isDragging}
      onLongPress={drag}
      onPress={isEdit ? undefined : handleChainSelect}
    >
      <View
        testID="account-item-wrapper"
        backgroundColor={isActive && !isEdit ? '$borderLight' : '$backgroundTransparent'}
        borderRadius="$4"
      >
        <AccountCard
          leftNode={
            isEdit && (
              <TouchableOpacity onPress={onDeleteSafePress}>
                <SafeFontIcon name="close-filled" color="$error" />
              </TouchableOpacity>
            )
          }
          threshold={account.threshold}
          owners={account.owners.length}
          name={account.address.name || shortenAddress(account.address.value)}
          address={account.address.value as Address}
          balance={account.fiatTotal}
          chains={isEdit ? undefined : chains}
          rightNode={rightNode}
        />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
})

export default AccountItem
