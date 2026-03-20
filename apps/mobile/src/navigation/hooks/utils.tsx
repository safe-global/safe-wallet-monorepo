import { HeaderBackButton } from '@react-navigation/elements'
import { type NativeStackHeaderLeftProps } from '@react-navigation/native-stack'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { IconName } from '@/src/types/iconTypes'

export const getDefaultScreenOptions = (goBack: () => void) => {
  return {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerShadowVisible: false,
    headerLeftContainerStyle: { paddingLeft: 16 },
    headerRightContainerStyle: { paddingRight: 16 },
    headerTitleAlign: 'center' as const,
    headerRight: () => <View width={40} />,
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
      style={{ marginLeft: 0 }}
      testID={'go-back'}
      onPress={goBack}
      backImage={() => {
        return (
          <View
            backgroundColor={'$backgroundSkeleton'}
            alignItems={'center'}
            justifyContent={'center'}
            borderRadius={200}
            height={40}
            width={40}
          >
            <SafeFontIcon name={icon} size={24} color={'$color'} />
          </View>
        )
      }}
      displayMode={'minimal'}
    />
  )
}
