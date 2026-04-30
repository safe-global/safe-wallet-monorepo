import { H6, Text, View, XStack } from 'tamagui'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { MyAccountsContainer, MyAccountsFooter } from '@/src/features/AccountsSheet/MyAccounts'
import { TouchableOpacity } from 'react-native'
import React, { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectMyAccountsMode, toggleMode } from '@/src/store/myAccountsSlice'
import { useMyAccountsSortable } from '@/src/features/AccountsSheet/MyAccounts/hooks/useMyAccountsSortable'
import { useMyAccountsAnalytics } from '@/src/features/AccountsSheet/MyAccounts/hooks/useMyAccountsAnalytics'
import { DashboardActions } from './components/DashboardActions'
import { useRouter } from 'expo-router'

export const AccountsSheetContainer = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isEdit = useAppSelector(selectMyAccountsMode)
  const { safes, onDragEnd } = useMyAccountsSortable()
  const { trackScreenView, trackEditModeChange } = useMyAccountsAnalytics()

  useEffect(() => {
    trackScreenView()
  }, [])

  const toggleEditMode = async () => {
    const isEnteringEditMode = !isEdit
    await trackEditModeChange(isEnteringEditMode)
    dispatch(toggleMode())
  }

  const handleClose = useCallback(() => {
    router.back()
  }, [router])

  const sectionHeader = (
    <View paddingHorizontal="$4" paddingBottom="$2">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$3" fontWeight={600} color="$colorSecondary">
          Your accounts
        </Text>
        <TouchableOpacity onPress={toggleEditMode}>
          <H6 fontWeight={700}>{isEdit ? 'Done' : 'Edit'}</H6>
        </TouchableOpacity>
      </XStack>
    </View>
  )

  return (
    <SafeBottomSheet
      title="Dashboard"
      items={safes}
      keyExtractor={({ item }) => item.address}
      FooterComponent={MyAccountsFooter}
      renderItem={MyAccountsContainer}
      sortable={isEdit}
      onDragEnd={onDragEnd}
      headerContent={
        <>
          <DashboardActions onClose={handleClose} />
          {sectionHeader}
        </>
      }
    />
  )
}
