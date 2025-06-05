import React from 'react'
import { useRouter } from 'expo-router'
import { useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectAllSafes, SafesSlice } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { SafeInfo } from '@/src/types/address'
import { ImportSuccessScreenView } from './components/ImportSuccessScreenView'

export const ImportSuccessScreen = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const allSafes = useAppSelector(selectAllSafes) as SafesSlice
  const theme = useTheme()
  const colors: [string, string] = [theme.success.get(), 'transparent']

  const handleContinue = () => {
    const safeAddresses = Object.keys(allSafes)

    if (safeAddresses.length > 0) {
      const firstSafeAddress = safeAddresses[0] as `0x${string}`
      const firstSafe = allSafes[firstSafeAddress]
      const chainIds = Object.keys(firstSafe)

      if (chainIds.length > 0) {
        const activeChainId = chainIds[0]
        const activeSafeInfo: SafeInfo = {
          address: firstSafeAddress,
          chainId: activeChainId,
        }

        dispatch(setActiveSafe(activeSafeInfo))

        // Navigates to first screen in stack
        router.dismissAll()
        // closes first screen in stack
        router.back()
        // Navigate to the main assets screen
        router.replace('/(tabs)')
        return
      }
    }

    // Fallback: just navigate to main screen
    router.replace('/(tabs)')
  }

  return <ImportSuccessScreenView bottomInset={insets.bottom} gradientColors={colors} onContinue={handleContinue} />
}
