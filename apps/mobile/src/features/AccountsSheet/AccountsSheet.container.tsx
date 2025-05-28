import { H6 } from 'tamagui'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { MyAccountsContainer, MyAccountsFooter } from '@/src/features/AccountsSheet/MyAccounts'
import { TouchableOpacity } from 'react-native'
import React from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectMyAccountsMode, toggleMode } from '@/src/store/myAccountsSlice'
import { useMyAccountsSortable } from '@/src/features/AccountsSheet/MyAccounts/hooks/useMyAccountsSortable'

export const AccountsSheetContainer = () => {
  const dispatch = useAppDispatch()
  const isEdit = useAppSelector(selectMyAccountsMode)
  const { safes, onDragEnd } = useMyAccountsSortable()

  const toggleEditMode = () => {
    dispatch(toggleMode())
  }

  return (
    <SafeBottomSheet
      title="My accounts"
      items={safes}
      keyExtractor={({ item }) => item.address}
      FooterComponent={MyAccountsFooter}
      renderItem={MyAccountsContainer}
      sortable={isEdit}
      onDragEnd={onDragEnd}
      actions={
        <TouchableOpacity onPress={toggleEditMode}>
          <H6 fontWeight={600}>{isEdit ? 'Done' : 'Edit'}</H6>
        </TouchableOpacity>
      }
    />
  )
}
