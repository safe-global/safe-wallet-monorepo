import React from 'react'
import { Pressable } from 'react-native'
import { Circle, Theme, View, XStack, Text, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Identicon } from '@/src/components/Identicon'
import { BadgeWrapper } from '@/src/components/BadgeWrapper'
import { ThresholdBadge } from '@/src/components/ThresholdBadge'
import { Image } from 'expo-image'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

import { shortenAddress } from '@/src/utils/formatters'
import { useAppSelector } from '@/src/store/hooks'
import { useRouter } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { RootState } from '@/src/store'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { selectChainById } from '@/src/store/chains'
import usePendingTxs from '@/src/hooks/usePendingTxs'

const nameLabelProps = {
  fontSize: '$5',
  fontWeight: 600,
} as const

function PendingTxBadge({ amount, onPress }: { amount: number; onPress: () => void }) {
  if (amount <= 0) {
    return null
  }

  return (
    <Pressable onPress={onPress} testID="navbar-pending-tx-badge">
      <Circle size={40} backgroundColor="$backgroundSkeleton">
        <View
          position="absolute"
          top={0}
          right={0}
          width={8}
          height={8}
          borderRadius={4}
          backgroundColor="$warning"
          zIndex={1}
        />
        <Text fontSize="$5" fontWeight={700} color="$color">
          {amount > 99 ? '99+' : amount}
        </Text>
      </Circle>
    </Pressable>
  )
}

function NetworkSelector({
  chainLogoUri,
  chainName,
  onPress,
}: {
  chainLogoUri: string | null | undefined
  chainName: string | null | undefined
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} testID="navbar-network-selector">
      <Circle size={40} backgroundColor="$backgroundSkeleton">
        {chainLogoUri && (
          <Image
            source={chainLogoUri}
            style={{ width: 32, height: 32, borderRadius: 4 }}
            accessibilityLabel={chainName ?? undefined}
          />
        )}
      </Circle>
    </Pressable>
  )
}

export const Navbar = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const activeSafe = useDefinedActiveSafe()
  const contact = useAppSelector(selectContactByAddress(activeSafe.address))
  const { isDark } = useTheme()

  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const chainSafe = activeSafeInfo ? activeSafeInfo[activeSafe.chainId] : undefined

  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const { amount } = usePendingTxs()

  const safeName = contact ? contact.name : shortenAddress(activeSafe.address)

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
        <Pressable onPress={() => router.push('/accounts-sheet')} hitSlop={4} testID="account-selector">
          <XStack gap="$3" alignItems="center">
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
            <View>
              <XStack alignItems="center" gap="$1">
                <Text
                  fontSize={nameLabelProps.fontSize}
                  fontWeight={nameLabelProps.fontWeight}
                  numberOfLines={1}
                  maxWidth={170}
                >
                  {safeName}
                </Text>
                <SafeFontIcon name="chevron-down" size={16} />
              </XStack>
              <Text fontSize="$4" color="$colorSecondary" numberOfLines={1}>
                {shortenAddress(activeSafe.address)}
              </Text>
            </View>
          </XStack>
        </Pressable>

        <XStack gap="$2" alignItems="center">
          <PendingTxBadge amount={amount} onPress={() => router.push('/pending-transactions')} />
          <NetworkSelector
            chainLogoUri={activeChain?.chainLogoUri}
            chainName={activeChain?.chainName}
            onPress={() => router.push('/networks-sheet')}
          />
        </XStack>
      </XStack>
    </Theme>
  )
}
