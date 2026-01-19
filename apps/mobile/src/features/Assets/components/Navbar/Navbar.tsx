import React from 'react'
import { View, Pressable } from 'react-native'
import { Theme, XStack, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Identicon } from '@/src/components/Identicon'
import { BadgeWrapper } from '@/src/components/BadgeWrapper'
import { ThresholdBadge } from '@/src/components/ThresholdBadge'

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
import { useTheme } from '@/src/theme/hooks/useTheme'

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
  const { isDark } = useTheme()

  const handleNotificationAccess = () => {
    if (!isAppNotificationEnabled) {
      router.navigate('/notifications-opt-in')
    } else {
      router.navigate('/notifications-center')
    }
  }

  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const chainSafe = activeSafeInfo ? activeSafeInfo[activeSafe.chainId] : undefined

  return (
    <Theme name="navbar">
      <XStack
        paddingTop={getTokenValue('$3') + insets.top}
        justifyContent={'space-between'}
        paddingHorizontal={16}
        alignItems={'center'}
        paddingBottom={'$2'}
        backgroundColor={isDark ? '$background' : '$backgroundFocus'}
      >
        <DropdownLabel
          label={contact ? contact.name : shortenAddress(activeSafe.address)}
          labelProps={dropdownLabelProps}
          leftNode={
            <BadgeWrapper
              badge={
                <ThresholdBadge
                  threshold={chainSafe?.threshold ?? 0}
                  ownersCount={chainSafe?.owners.length ?? 0}
                  size={18}
                  fontSize={8}
                  isLoading={!chainSafe}
                  testID="threshold-info-badge"
                />
              }
              testID="threshold-info-badge-wrapper"
            >
              <Identicon address={activeSafe.address} size={30} />
            </BadgeWrapper>
          }
          onPress={() => {
            router.push('/accounts-sheet')
          }}
          hitSlop={4}
        />
        <View
          style={{
            flexDirection: 'row',
            gap: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Link href={'/share'} asChild>
            <Pressable hitSlop={10}>
              <SafeFontIcon name="qr-code-1" size={16} />
            </Pressable>
          </Link>
          <Pressable onPressIn={handleNotificationAccess} hitSlop={8}>
            <SafeFontIcon name="bell" size={20} />
          </Pressable>
        </View>
      </XStack>
    </Theme>
  )
}
