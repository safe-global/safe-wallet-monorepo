import { HeaderBackButton } from '@react-navigation/elements'
import { type NativeStackHeaderLeftProps } from '@react-navigation/native-stack'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Platform, StyleSheet } from 'react-native'

export const getDefaultScreenOptions = (goBack: () => void) => {
  return {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerShadowVisible: false,
    headerLeft: (props: NativeStackHeaderLeftProps) => {
      return (
        <HeaderBackButton
          {...props}
          style={Platform.OS === 'android' ? styles.android : styles.ios}
          testID={'go-back'}
          onPress={goBack}
          backImage={() => {
            return (
              <View
                backgroundColor={'$backgroundSkeleton'}
                alignItems={'center'}
                justifyContent={'center'}
                borderRadius={16}
                height={32}
                width={32}
              >
                <SafeFontIcon name={'arrow-left'} size={16} color={'$color'} />
              </View>
            )
          }}
          displayMode={'minimal'}
        />
      )
    },
  }
}

const styles = StyleSheet.create({
  android: {
    marginLeft: -16,
  },
  ios: {
    marginLeft: -8,
  },
})
