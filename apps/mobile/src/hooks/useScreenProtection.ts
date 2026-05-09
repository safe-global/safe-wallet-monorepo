import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { CaptureProtection } from 'react-native-capture-protection'
import { useAppSelector } from '@/src/store/hooks'
import { selectScreenProtectionDisabled } from '@/src/store/settingsSlice'

export interface ScreenProtectionOptions {
  screenshot?: boolean
  record?: boolean
  appSwitcher?: boolean
}

/**
 * Custom hook to enable screen protection when the screen is focused
 * and disable it when the screen is unfocused.
 *
 * @param options - Configuration options for what to protect against
 */
export const useScreenProtection = (
  options: ScreenProtectionOptions = {
    screenshot: true,
    record: true,
    appSwitcher: true,
  },
) => {
  const screenProtectionDisabled = useAppSelector(selectScreenProtectionDisabled)

  useFocusEffect(
    useCallback(() => {
      if (screenProtectionDisabled) {
        return
      }

      CaptureProtection.prevent(options)

      return () => {
        CaptureProtection.allow()
      }
    }, [options, screenProtectionDisabled]),
  )
}
