import React from 'react'
import { Theme, XStack, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable } from 'react-native-gesture-handler'
import { IdenticonWithBadge } from '@/src/features/Settings/components/IdenticonWithBadge'

import { shortenAddress } from '@/src/utils/formatters'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppSelector } from '@/src/store/hooks'
import { Link, useRouter } from 'expo-router'
import { DropdownLabel } from '@/src/components/Dropdown/DropdownLabel'
import { selectAppNotificationStatus } from '@/src/store/notificationsSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { RootState } from '@/src/store'

const dropdownLabelProps = {
  fontSize: '$5',
  fontWeight: 600,
} as const

export const Navbar = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const activeSafe = useDefinedActiveSafe()
  const contact = useAppSelector(selectContactByAddress(activeSafe.address))
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)

  const handleNotificationAccess = () => {
    if (!isAppNotificationEnabled) {
      router.navigate('/notifications-opt-in')
    } else {
      router.navigate('/notifications-center')
    }
  }

  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))

  return (
    <Theme name="navbar">
      <XStack
        paddingTop={getTokenValue('$2') + insets.top}
        justifyContent={'space-between'}
        paddingHorizontal={16}
        alignItems={'center'}
        paddingBottom={'$2'}
        backgroundColor={'$background'}
      >
        <DropdownLabel
          label={contact ? contact.name : shortenAddress(activeSafe.address)}
          labelProps={dropdownLabelProps}
          leftNode={
            <IdenticonWithBadge
              testID="threshold-info-badge"
              variant="sm"
              size={40}
              fontSize={10}
              address={activeSafe.address}
              badgeContent={`${activeSafeInfo?.SafeInfo.threshold}/${activeSafeInfo?.SafeInfo.owners.length}`}
            />
          }
          // leftNode={<Identicon address={activeSafe.address} size={30} />}
          onPress={() => {
            router.push('/accounts-sheet')
          }}
        />
        <XStack alignItems={'center'} justifyContent={'center'} gap={12}>
          <Link href={'/share'} asChild>
            <Pressable>
              <SafeFontIcon name="qr-code-1" size={16} />
            </Pressable>
          </Link>
          <Pressable onPress={handleNotificationAccess}>
            <SafeFontIcon name="bell" size={20} />
          </Pressable>
        </XStack>
      </XStack>
    </Theme>
  )
}
