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

const BIOMETRICS_KEY = 'SAFE_WALLET_BIOMETRICS'

export function useBiometrics() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [userCancelled, setUserCancelled] = useState(false)
  const isEnabled = useAppSelector((state) => state.biometrics.isEnabled)
  const biometricsType = useAppSelector((state) => state.biometrics.type)
  const userAttempts = useAppSelector((state) => state.biometrics.userAttempts)

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
  }, [dispatch])

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

  const disableBiometrics = useCallback(async () => {
    setIsLoading(true)
    try {
      await Keychain.resetGenericPassword()
      dispatch(setBiometricsEnabled(false))
    } catch (error) {
      Logger.error('Error disabling biometrics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [dispatch])

  const enableBiometrics = useCallback(async () => {
    setIsLoading(true)
    try {
      const isSupported = await checkBiometricsSupport()
      const { biometricsEnabled: isEnabledAtOSLevel } = await checkBiometricsOSSettingsStatus()

      if (!isSupported && userCancelled) {
        openBiometricSettings()
      }

      if (!isEnabledAtOSLevel && userCancelled) {
        openBiometricSettings()
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
            setUserCancelled(false)
            return true
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
            setUserCancelled(true)
          })
          dispatch(setBiometricsEnabled(false))
          return false
        }
        // Re-throw other errors
        throw biometricsError
      }
    } catch (error) {
      Logger.error('Unexpected error in biometrics setup:', error)
      await Keychain.resetGenericPassword()
      dispatch(setBiometricsEnabled(false))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, checkBiometricsSupport, userCancelled, userAttempts])

  const toggleBiometrics = useCallback(
    async (newValue: boolean) => {
      return newValue ? enableBiometrics() : disableBiometrics()
    },
    [enableBiometrics, disableBiometrics],
  )

  const getBiometricsButtonLabel = useCallback(() => {
    switch (biometricsType) {
      case 'FACE_ID':
        return 'Enable Face ID'
      case 'TOUCH_ID':
        return 'Enable Touch ID'
      case 'FINGERPRINT':
        return 'Enable Fingerprint'
      default:
        return 'Enable Biometrics'
    }
  }, [biometricsType])

  useLayoutEffect(() => {
    const checkBiometrics = async () => {
      const { biometricsEnabled: isEnabledAtOSLevel } = await checkBiometricsOSSettingsStatus()
      if (!isEnabledAtOSLevel) {
        toggleBiometrics(false)
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
    getBiometricsButtonLabel,
    checkBiometricsOSSettingsStatus,
  }
}
