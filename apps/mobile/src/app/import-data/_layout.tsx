import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { Text } from 'tamagui'

const titleStep = (step: number) => {
  return (
    <Text color={'$colorSecondary'} fontWeight={600}>
      Step {step} of 3
    </Text>
  )
}
export default function ImportDataLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="help-import"
        options={{
          headerShown: true,
          headerTitle: () => titleStep(1),
        }}
      />
    </Stack>
  )
}
