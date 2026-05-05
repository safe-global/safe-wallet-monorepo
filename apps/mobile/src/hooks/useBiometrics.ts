import { useState, useCallback, useLayoutEffect } from 'react'
import * as Keychain from 'react-native-keychain'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import {
  setBiometricsEnabled,
  setBiometricsSupported,
  setBiometricsType,
  setUserAttempts,
} from '@/src/store/biometricsSlice'
import { Platform, Linking } from 'react-native'
import Logger from '@/src/utils/logger'
import { RootState } from '../store'

const BIOMETRICS_KEY = 'SAFE_WALLET_BIOMETRICS'

export type EnableBiometricsResult =
  | { status: 'enabled' }
  | { status: 'os-not-configured' }
  | { status: 'cancelled' }
  | { status: 'error'; error: unknown }

export type ToggleBiometricsResult = EnableBiometricsResult | { status: 'disabled' }

export function useBiometrics() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)

  // This hasInteracted ref is used to prevent the biometrics from being enabled/disabled
  // even when the app is in background then comes back to foreground
  // with biometrics enabled and the app settings was disabled
  // and the user has not interacted with config
  const isEnabled = useAppSelector((state: RootState) => state.biometrics.isEnabled)
  const biometricsType = useAppSelector((state: RootState) => state.biometrics.type)
  const userAttempts = useAppSelector((state: RootState) => state.biometrics.userAttempts)

  const openBiometricSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:')
    } else {
      Linking.openSettings()
    }
  }

  const checkBiometricsSupport = useCallback(async () => {
    try {
      const supportedBiometrics = await Keychain.getSupportedBiometryType()

      if (supportedBiometrics) {
        let type: 'FACE_ID' | 'TOUCH_ID' | 'FINGERPRINT' | 'NONE' = 'NONE'

        switch (supportedBiometrics) {
          case Keychain.BIOMETRY_TYPE.FACE_ID:
            type = 'FACE_ID'
            break
          case Keychain.BIOMETRY_TYPE.TOUCH_ID:
            type = 'TOUCH_ID'
            break
          case Keychain.BIOMETRY_TYPE.FINGERPRINT:
            type = 'FINGERPRINT'
            break
        }

        dispatch(setBiometricsType(type))
        dispatch(setBiometricsSupported(true))
        return true
      }

      return false
    } catch (error) {
      Logger.error('Error checking biometrics support:', error)
      return false
    }
  }, [])

  const checkBiometricsOSSettingsStatus = useCallback(async () => {
    try {
      // This checks if biometrics is available at system level
      const result = await Keychain.getSupportedBiometryType()
      // If biometrics is not set up at OS level, this will return null
      // If Face ID is available, it returns 'FaceID'
      // If Touch ID is available, it returns 'TouchID'
      return {
        biometricsEnabled: result !== null,
        biometryType: result, // 'FaceID', 'TouchID', or null
      }
    } catch (error) {
      Logger.error('Error checking biometrics:', error)
      return {
        biometricsEnabled: false,
        biometryType: null,
      }
    }
  }, [])

  const disableBiometrics = useCallback(async (): Promise<{ status: 'disabled' }> => {
    setIsLoading(true)
    try {
      await Keychain.resetGenericPassword()
      dispatch(setBiometricsEnabled(false))
    } catch (error) {
      Logger.error('Error disabling biometrics:', error)
    } finally {
      setIsLoading(false)
    }
    return { status: 'disabled' }
  }, [])

  const enableBiometrics = useCallback(async (): Promise<EnableBiometricsResult> => {
    setIsLoading(true)

    try {
      const isSupported = await checkBiometricsSupport()
      const { biometricsEnabled: isEnabledAtOSLevel } = await checkBiometricsOSSettingsStatus()

      // Biometrics not available at OS level (no hardware or not enrolled).
      // Surface the outcome to the caller — never auto-redirect to system Settings here.
      // The caller decides whether to show an explainer with an explicit "Open Settings" button.
      if (!isSupported || !isEnabledAtOSLevel) {
        dispatch(setBiometricsEnabled(false))
        return { status: 'os-not-configured' }
      }

      try {
        // Wrap the biometrics operations in a nested try-catch to allow for user cancellation
        const setGenericPasswordResult = await Keychain.setGenericPassword(BIOMETRICS_KEY, 'biometrics-enabled', {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        })

        if (setGenericPasswordResult) {
          const getGenericPasswordResult = await Keychain.getGenericPassword({
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          })

          if (getGenericPasswordResult) {
            dispatch(setBiometricsEnabled(true))
            dispatch(setUserAttempts(0))
            return { status: 'enabled' }
          }
        }

        // If we get here, something went wrong with setting or getting the password
        throw new Error('Failed to verify biometrics setup')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (biometricsError: any) {
        // Handle user cancellation specifically
        if (
          biometricsError.code === '-128' || // User pressed Cancel
          biometricsError.code === 'AuthenticationFailed' ||
          biometricsError.message.includes('cancel') ||
          biometricsError.message.includes('user name or passphrase')
        ) {
          Keychain.resetGenericPassword().then(() => {
            dispatch(setUserAttempts(userAttempts + 1))
          })
          dispatch(setBiometricsEnabled(false))
          return { status: 'cancelled' }
        }
        // Re-throw other errors
        throw biometricsError
      }
    } catch (error) {
      Logger.error('Unexpected error in biometrics setup:', error)
      await Keychain.resetGenericPassword()
      dispatch(setBiometricsEnabled(false))
      return { status: 'error', error }
    } finally {
      setIsLoading(false)
    }
  }, [checkBiometricsSupport, checkBiometricsOSSettingsStatus, userAttempts])

  const toggleBiometrics = useCallback(
    async (newValue: boolean): Promise<ToggleBiometricsResult> => {
      return newValue ? enableBiometrics() : disableBiometrics()
    },
    [enableBiometrics, disableBiometrics],
  )

  const getBiometricsUIInfo = useCallback(() => {
    switch (biometricsType) {
      case 'FACE_ID':
        return { label: 'Enable biometrics', icon: 'face-id' }
      case 'TOUCH_ID':
        return { label: 'Enable biometrics', icon: 'fingerprint' }
      case 'FINGERPRINT':
        return { label: 'Enable biometrics', icon: 'fingerprint' }
      default:
        return { label: 'Enable biometrics', icon: 'face-id' }
    }
  }, [biometricsType])

  useLayoutEffect(() => {
    const checkBiometrics = async () => {
      const { biometricsEnabled: isEnabledAtOSLevel } = await checkBiometricsOSSettingsStatus()

      if (!isEnabledAtOSLevel) {
        disableBiometrics()
      }
    }
    checkBiometrics()
  }, [])

  return {
    toggleBiometrics,
    openBiometricSettings,
    isBiometricsEnabled: isEnabled,
    biometricsType,
    isLoading,
    getBiometricsUIInfo,
    checkBiometricsOSSettingsStatus,
  }
}
