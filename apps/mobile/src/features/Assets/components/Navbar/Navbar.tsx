import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { View, H6 } from 'tamagui'
import { BlurredIdenticonBackground } from '@/src/components/BlurredIdenticonBackground'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Identicon } from '@/src/components/Identicon'
import { shortenAddress } from '@/src/utils/formatters'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Address } from '@/src/types/address'
import { Dropdown } from '@/src/components/Dropdown'
import { SafesSliceItem } from '@/src/store/safesSlice'
import { selectMyAccountsMode, toggleMode } from '@/src/store/myAccountsSlice'
import { MyAccountsContainer, MyAccountsFooter } from '../MyAccounts'
import { useMyAccountsSortable } from '../MyAccounts/hooks/useMyAccountsSortable'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'

const dropdownLabelProps = {
  fontSize: '$5',
  fontWeight: 600,
} as const

export const Navbar = () => {
  const dispatch = useAppDispatch()
  const isEdit = useAppSelector(selectMyAccountsMode)
  const activeSafe = useAppSelector(selectActiveSafe)
  const { safes, onDragEnd } = useMyAccountsSortable()

  const toggleEditMode = () => {
    dispatch(toggleMode())
  }

  return (
    <View>
      <BlurredIdenticonBackground address={activeSafe.address as Address}>
        <SafeAreaView style={[styles.headerContainer]}>
          <Dropdown<SafesSliceItem>
            label={shortenAddress(activeSafe.address)}
            labelProps={dropdownLabelProps}
            dropdownTitle="My accounts"
            leftNode={<Identicon address={activeSafe.address} rounded={true} size={30} />}
            items={safes}
            keyExtractor={({ item }) => item.SafeInfo.address.value}
            footerComponent={MyAccountsFooter}
            renderItem={MyAccountsContainer}
            sortable={isEdit}
            onDragEnd={onDragEnd}
            actions={
              safes.length > 1 && (
                <TouchableOpacity onPress={toggleEditMode}>
                  <H6 fontWeight={600}>{isEdit ? 'Done' : 'Edit'}</H6>
                </TouchableOpacity>
              )
            }
          />

          <TouchableOpacity>
            <SafeFontIcon name="apps" />
          </TouchableOpacity>
        </SafeAreaView>
      </BlurredIdenticonBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 16,
    paddingBottom: 0,
  },
})
