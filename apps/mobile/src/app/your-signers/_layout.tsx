import { Stack, useRouter } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { HeaderBackButton } from '@react-navigation/elements'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export default function YourSignersLayout() {
  const router = useRouter()

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: '',
          headerRight: () => (
            <HeaderBackButton
              testID="close-your-signers"
              onPress={() => router.dismissAll()}
              backImage={() => (
                <View
                  backgroundColor="$backgroundSkeleton"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius={200}
                  height={40}
                  width={40}
                >
                  <SafeFontIcon name="close" size={16} color="$color" />
                </View>
              )}
              displayMode="minimal"
            />
          ),
        }}
      />
    </Stack>
  )
}
