import { Stack } from 'expo-router'
import { useTheme } from 'tamagui'
import { HeaderBackButton } from '@react-navigation/elements'

export default function SignersLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: true, title: 'Signers' }} />
      <Stack.Screen name="signers/[address]" options={{ headerShown: true, title: '' }} />
    </Stack>
  )
}
