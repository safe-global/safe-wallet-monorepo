import { HeaderBackButton } from '@react-navigation/elements'
import { type NativeStackHeaderLeftProps } from '@react-navigation/native-stack'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { IconName } from '@/src/types/iconTypes'

export const getDefaultScreenOptions = (goBack: () => void) => {
  return {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerShadowVisible: false,
    headerLeft: (props: NativeStackHeaderLeftProps) => {
      return <HeaderLeft props={props} goBack={goBack} />
    },
  }
}

export const HeaderLeft = ({
  props,
  goBack,
  icon = 'arrow-left',
}: {
  props: NativeStackHeaderLeftProps
  goBack: () => void
  icon?: IconName
}) => {
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
            <SafeFontIcon name={icon} size={16} color={'$color'} />
          </View>
        )
      }}
      displayMode={'minimal'}
    />
  )
}
