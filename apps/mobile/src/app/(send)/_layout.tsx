import { Pressable } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { View, Text, useTheme } from 'tamagui'
import { Loader } from '@/src/components/Loader'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

function CloseButton() {
  const router = useRouter()

  return (
    <Pressable onPress={() => router.dismissTo('/(tabs)')} hitSlop={8} testID="close-send-flow">
      <View
        backgroundColor="$backgroundSkeleton"
        alignItems="center"
        justifyContent="center"
        borderRadius={200}
        height={40}
        width={40}
      >
        <SafeFontIcon name="close" size={24} color="$color" />
      </View>
    </Pressable>
  )
}

export default function SendLayout() {
  const safeSDK = useSafeSDK()
  const theme = useTheme()

  if (!safeSDK) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" gap="$3">
        <Loader size={48} color={String(theme.primary.get())} />
        <Text color="$colorSecondary">Initializing Safe SDK...</Text>
      </View>
    )
  }

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
        headerRight: () => <CloseButton />,
      })}
    >
      <Stack.Screen name="recipient" options={{ title: 'Send' }} />
      <Stack.Screen name="scan-qr" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="token" options={{ title: 'Send' }} />
      <Stack.Screen name="amount" options={{ title: 'Send' }} />
    </Stack>
  )
}
