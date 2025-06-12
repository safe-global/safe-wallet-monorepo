import { H6 } from 'tamagui'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { MyAccountsContainer, MyAccountsFooter } from '@/src/features/AccountsSheet/MyAccounts'
import { TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectMyAccountsMode, toggleMode } from '@/src/store/myAccountsSlice'
import { useMyAccountsSortable } from '@/src/features/AccountsSheet/MyAccounts/hooks/useMyAccountsSortable'
import { useMyAccountsAnalytics } from '@/src/features/AccountsSheet/MyAccounts/hooks/useMyAccountsAnalytics'

export const AccountsSheetContainer = () => {
  const dispatch = useAppDispatch()
  const isEdit = useAppSelector(selectMyAccountsMode)
  const { safes, onDragEnd } = useMyAccountsSortable()
  const { trackScreenView, trackEditModeChange } = useMyAccountsAnalytics()

  // Track screen view with total safe count when component mounts
  useEffect(() => {
    trackScreenView()
  }, [])

  const toggleEditMode = async () => {
    const isEnteringEditMode = !isEdit // Before dispatching, determine if we're entering edit mode
    await trackEditModeChange(isEnteringEditMode)
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
