import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { Text } from 'tamagui'
import { DataImportProvider } from '@/src/features/DataImport/context/DataImportProvider'

const titleStep = (step: number) => {
  return (
    <Text color={'$colorSecondary'} fontWeight={600}>
      Step {step} of 3
    </Text>
  )
}

export default function ImportDataLayout() {
  return (
    <DataImportProvider>
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
        <Stack.Screen
          name="file-selection"
          options={{
            headerShown: true,
            headerTitle: () => titleStep(2),
          }}
        />
        <Stack.Screen
          name="enter-password"
          options={{
            headerShown: true,
            headerTitle: () => titleStep(3),
          }}
        />
        <Stack.Screen
          name="review-data"
          options={{
            headerShown: true,
            headerTitle: () => titleStep(3),
          }}
        />
        <Stack.Screen
          name="import-error"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="import-progress"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="import-success"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </DataImportProvider>
  )
}
