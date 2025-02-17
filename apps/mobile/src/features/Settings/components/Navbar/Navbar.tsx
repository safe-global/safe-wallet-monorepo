import React from 'react'
import { View, XStack } from 'tamagui'
import { SettingsMenu } from '@/src/features/Settings/components/Navbar/SettingsMenu'
import { SettingsButton } from '@/src/features/Settings/components/Navbar/SettingsButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Address } from '@/src/types/address'

export const Navbar = (props: { safeAddress: Address }) => {
  const { safeAddress } = props
  const insets = useSafeAreaInsets()

  return (
    <XStack
      paddingTop={insets.top}
      alignItems={'center'}
      justifyContent={'flex-end'}
      paddingHorizontal={'$4'}
      paddingBottom={'$4'}
    >
      <View flexDirection="row" alignItems="center" columnGap="$3">
        <SettingsButton />
        <SettingsMenu safeAddress={safeAddress} />
      </View>
    </XStack>
  )
}
