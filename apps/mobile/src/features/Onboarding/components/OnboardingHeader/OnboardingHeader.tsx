import React from 'react'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeWalletLogo } from '@/src/components/SVGs/SafeWalletLogo'

export function OnboardingHeader() {
  const insets = useSafeAreaInsets()

  return (
    <View paddingTop={insets.top} backgroundColor={getTokenValue('$color.textContrastDark')}>
      <View
        alignItems={'center'}
        backgroundColor={getTokenValue('$color.textPrimaryDark')}
        borderTopLeftRadius={'$6'}
        borderTopRightRadius={'$6'}
        paddingVertical={'$6'}
      >
        <SafeWalletLogo testID="safe-wallet-logo" />
      </View>
    </View>
  )
}
