import React from 'react'
import { Pressable } from 'react-native'
import { Text, Theme, View, XStack, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Identicon } from '@/src/components/Identicon'
import { BadgeWrapper } from '@/src/components/BadgeWrapper'
import { ThresholdBadge } from '@/src/components/ThresholdBadge'

import { shortenAddress } from '@/src/utils/formatters'
import { useAppSelector } from '@/src/store/hooks'
import { useRouter } from 'expo-router'
import { DropdownLabel } from '@/src/components/Dropdown/DropdownLabel'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { RootState } from '@/src/store'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { selectChainById } from '@/src/store/chains'
import { Logo } from '@/src/components/Logo'

const dropdownLabelProps = {
  fontSize: '$5',
  fontWeight: 600,
} as const

export const Navbar = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const activeSafe = useDefinedActiveSafe()
  const contact = useAppSelector(selectContactByAddress(activeSafe.address))
  const { isDark } = useTheme()

  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const chainSafe = activeSafeInfo ? activeSafeInfo[activeSafe.chainId] : undefined
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

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
        <View>
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
          {contact && (
            <Text color={'$colorSecondary'} fontSize={'$3'} paddingLeft={'$10'}>
              {shortenAddress(activeSafe.address)}
            </Text>
          )}
        </View>

        <Pressable hitSlop={10} onPress={() => router.push('/networks-sheet')}>
          <Logo logoUri={activeChain?.chainLogoUri} accessibilityLabel={activeChain?.chainName} size="$8" />
        </Pressable>
      </XStack>
    </Theme>
  )
}
