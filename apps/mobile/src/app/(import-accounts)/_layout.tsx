import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { useAppDispatch } from '@/src/store/hooks'
import { clearPendingSafe } from '@/src/store/signerImportFlowSlice'

export default function ImportAccountsLayout() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    return () => {
      dispatch(clearPendingSafe())
    }
  }, [dispatch])

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="form" options={{ headerShown: true }} />
      <Stack.Screen name="signers" options={{ headerShown: true }} />
    </Stack>
  )
}
