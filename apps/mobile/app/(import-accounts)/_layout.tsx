import { Stack } from 'expo-router'
import { HeaderBackButton } from '@react-navigation/elements'

export default function ImportAccountsLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerLeft: (props) => (
          <HeaderBackButton {...props} testID={'go-back'} onPress={navigation.goBack} displayMode={'minimal'} />
        ),
        headerStyle: {
          // backgroundColor: '#121312',
        },
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="form" options={{ headerShown: true }} />
      <Stack.Screen name="signers" options={{ headerShown: true }} />
    </Stack>
  )
}
