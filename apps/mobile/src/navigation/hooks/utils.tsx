import { HeaderBackButton } from '@react-navigation/elements'
import { type NativeStackHeaderLeftProps } from '@react-navigation/native-stack'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export const getDefaultScreenOptions = (goBack: () => void) => {
  return {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerShadowVisible: false,
    headerLeft: (props: NativeStackHeaderLeftProps) => {
      return (
        <HeaderBackButton
          {...props}
          style={{ marginLeft: -8 }}
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
