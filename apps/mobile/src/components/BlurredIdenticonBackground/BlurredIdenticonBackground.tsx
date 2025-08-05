import { blo } from 'blo'
import { View } from 'tamagui'
import { Image } from 'expo-image'
import { Dimensions, StyleSheet } from 'react-native'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { BlurView } from 'expo-blur'
import React from 'react'
import { Address } from '@/src/types/address'

type Props = {
  address: Address
  height?: number
  children: React.ReactNode
}
export const BlurredIdenticonBackground = ({ address, height = 125, children }: Props) => {
  const blockie = blo(address)
  const { colorScheme } = useTheme()

  return (
    <View>
      <View style={[styles.containerInner, { height: height }]}>
        <View
          style={[
            styles.containerInnerBackground,
            {
              height: height,
            },
          ]}
        ></View>
        <View style={styles.androidHack}>
          <Image testID={'header-image'} source={{ uri: blockie }} style={styles.identicon} />
        </View>

        <BlurView
          intensity={100}
          experimentalBlurMethod={'dimezisBlurView'}
          style={[
            styles.blurView,
            {
              height: height,
            },
          ]}
          tint={colorScheme || 'dark'}
        />

        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  containerInner: {
    position: 'relative',
  },
  containerInnerBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  // Android cannot handle border-radius on Image component
  // so we need to wrap it in a View with borderRadius
  androidHack: {
    borderRadius: '50%',
    overflow: 'hidden',
    bottom: 20,
    position: 'absolute',
  },
  identicon: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
  },
  blurView: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
})
