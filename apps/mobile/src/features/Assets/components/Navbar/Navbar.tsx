import { XStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Identicon } from '@/src/components/Identicon'
import { shortenAddress } from '@/src/utils/formatters'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'
import React from 'react'
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
  const insets = useSafeAreaInsets()
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
    <XStack
      paddingTop={insets.top}
      justifyContent={'space-between'}
      paddingHorizontal={16}
      alignItems={'center'}
      paddingBottom={'$2'}
    >
      <DropdownLabel
        label={shortenAddress(activeSafe.address)}
        labelProps={dropdownLabelProps}
        leftNode={<Identicon address={activeSafe.address} rounded={true} size={30} />}
        onPress={() => {
          router.push('/accounts-sheet')
        }}
      />
      <XStack alignItems={'center'} justifyContent={'center'} gap={12}>
        <TouchableOpacity onPress={handleNotificationAccess}>
          <SafeFontIcon name="lightbulb" />
        </TouchableOpacity>
        <TouchableOpacity>
          <SafeFontIcon name="apps" />
        </TouchableOpacity>
      </XStack>
    </XStack>
  )
}
