import React from 'react'
import { getTokenValue, Image, View } from 'tamagui'
import SafeWalletLogo from '@/assets/images/safe-wallet.png'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
        <Image accessibilityLabel="Safe Wallet" source={SafeWalletLogo} />
      </View>
    </View>
  )
}
