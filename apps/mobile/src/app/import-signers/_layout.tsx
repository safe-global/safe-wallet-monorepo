import { Stack } from 'expo-router'
import { HeaderBackButton } from '@react-navigation/elements'
import { useTheme } from 'tamagui'

export default function ImportSignersLayout() {
  const theme = useTheme()
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerLeft: (props) => (
          <HeaderBackButton
            {...props}
            tintColor={theme.primary.get()}
            testID={'go-back'}
            onPress={navigation.goBack}
            displayMode={'minimal'}
          />
        ),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="private-key" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="loading"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="private-key-error"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="private-key-success"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  )
}
