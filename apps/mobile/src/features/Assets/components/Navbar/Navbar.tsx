import { View } from 'tamagui'
import { BlurredIdenticonBackground } from '@/src/components/BlurredIdenticonBackground'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Identicon } from '@/src/components/Identicon'
import { shortenAddress } from '@/src/utils/formatters'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Address } from '@/src/types/address'
import { useAppSelector } from '@/src/store/hooks'
import { useRouter } from 'expo-router'
import { DropdownLabel } from '@/src/components/Dropdown/DropdownLabel'
import { selectAppNotificationStatus } from '@/src/store/notificationsSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

const dropdownLabelProps = {
  fontSize: '$5',
  fontWeight: 600,
} as const

export const Navbar = () => {
  const router = useRouter()
  const activeSafe = useDefinedActiveSafe()
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const handleNotificationAccess = () => {
    if (!isAppNotificationEnabled) {
      router.navigate('/notifications-opt-in')
    }
    // TODO: navigate to notifications list when notifications are enabled
  }

  return (
    <View>
      <BlurredIdenticonBackground address={activeSafe.address as Address}>
        <SafeAreaView style={[styles.headerContainer]}>
          <DropdownLabel
            label={shortenAddress(activeSafe.address)}
            labelProps={dropdownLabelProps}
            leftNode={<Identicon address={activeSafe.address} rounded={true} size={30} />}
            onPress={() => {
              router.push('/accounts-sheet')
            }}
          />
          <View style={styles.rightButtonContainer}>
            <TouchableOpacity onPress={handleNotificationAccess}>
              <SafeFontIcon name="lightbulb" />
            </TouchableOpacity>
            <TouchableOpacity>
              <SafeFontIcon name="apps" />
            </TouchableOpacity>
          </View>
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
  rightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
})
