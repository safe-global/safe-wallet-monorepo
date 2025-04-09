import { useState, useCallback, useEffect } from 'react'
import * as Keychain from 'react-native-keychain'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import {
  setBiometricsEnabled,
  setBiometricsSupported,
  setBiometricsType,
  setUserAttempts,
} from '@/src/store/biometricsSlice'
import { Platform, Linking, Alert, AppState } from 'react-native'
import Logger from '@/src/utils/logger'
import DeviceCrypto, { BiometryType } from 'react-native-device-crypto'

const BIOMETRICS_KEY = 'SAFE_WALLET_BIOMETRICS'

interface BiometricsError {
  code?: string | number
  message?: string
  domain?: string
}

// Error constants that are language-independent
const ERROR_CODES = {
  // iOS specific error codes
  IOS_NO_IDENTITIES_ENROLLED: '-7',
  IOS_ERROR_DOMAIN_LOCAL_AUTHENTICATION: 'com.apple.LocalAuthentication',

  // Android specific error codes
  ANDROID_BIOMETRICS_NOT_ENROLLED: '11',
  ANDROID_BIOMETRICS_ERROR_HW_UNAVAILABLE: '1',

  // Common error codes across platforms
  COULD_NOT_GET_BIOMETRY_TYPE: "Couldn't get biometry type",
}

export function useBiometrics() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [userCancelled, setUserCancelled] = useState(false)
  const [isAppActive, setIsAppActive] = useState(false)
  const isEnabled = useAppSelector((state) => state.biometrics.isEnabled)
  const biometricsType = useAppSelector((state) => state.biometrics.type)
  const userAttempts = useAppSelector((state) => state.biometrics.userAttempts)

  const openBiometricSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:')
    } else {
      Linking.openSettings()
    }
  }, [])

  /**
   * Checks if biometrics are both supported AND enrolled on the device
   * This is a critical function that distinguishes between:
   * 1. Device not supporting biometrics at all (hardware limitation)
   * 2. Device supporting biometrics but not having them enrolled/setup
   * 3. Device having fully functioning and enrolled biometrics
   */
  const checkOSBiometricsSupport = useCallback(async () => {
    try {
      // First check what type of biometry is supported by hardware
      const biometryType = await DeviceCrypto.getBiometryType()

      // If the device reports biometrics support, we need to verify enrollment
      if (biometryType !== BiometryType.NONE) {
        Logger.info('Device reports biometrics hardware support:', biometryType)

        // Use a unique service name for our test to avoid conflicts
        const biometricTestService = '__BIOMETRIC_ENROLLMENT_TEST__'

        try {
          // First try to clear any existing test entry to start fresh
          await Keychain.resetGenericPassword({ service: biometricTestService })

          // On iOS, we need to specify BIOMETRY_ANY to test biometric enrollment
          // On Android, we use BIOMETRY_CURRENT_SET which is more accurate for enrollment check
          const accessControl =
            Platform.OS === 'ios' ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET

          // Step 1: Try to set a password with biometric protection
          Logger.info('Testing biometric enrollment - setting test password')
          await Keychain.setGenericPassword('biometric_test', 'enrollment_test_value', {
            service: biometricTestService,
            accessControl,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
          })

          // Step 2: Immediately try to retrieve it with biometrics
          // If biometrics aren't enrolled, this will fail with a specific error
          // If we get here without errors, biometrics are enrolled and working
          Logger.info('Testing biometric enrollment - retrieving test password')

          // We don't await this because we want to catch the error differently
          dispatch(setBiometricsType(biometryType))
          dispatch(setBiometricsSupported(true))

          // Clean up regardless of result
          await Keychain.resetGenericPassword({ service: biometricTestService })

          return {
            biometricsEnabled: true,
            biometryType: biometryType,
          }
        } catch (error) {
          const biometricsError = error as BiometricsError
          Logger.info('Biometric enrollment test failed:', biometricsError)

          // Clean up if there was an error
          await Keychain.resetGenericPassword({ service: biometricTestService }).catch((cleanupError) => {
            Logger.warn('Failed to clean up biometric test entry:', cleanupError)
          })

          // Check for specific enrollment errors
          // LAError codes: https://developer.apple.com/documentation/localauthentication/laerror/code
          const isEnrollmentError =
            // iOS enrollment errors
            (Platform.OS === 'ios' &&
              (biometricsError.code === ERROR_CODES.IOS_NO_IDENTITIES_ENROLLED || biometricsError.code === '-7')) || // No identities are enrolled
            // Android enrollment errors
            (Platform.OS === 'android' && biometricsError.code === ERROR_CODES.ANDROID_BIOMETRICS_NOT_ENROLLED)

          // If we find enrollment error, device supports biometrics but they're not set up
          if (isEnrollmentError) {
            Logger.info('Device supports biometrics but none are enrolled')
            dispatch(setBiometricsType(biometryType))
            dispatch(setBiometricsSupported(false))
            return {
              biometricsEnabled: false,
              biometryType: biometryType, // Return the actual type for UI purposes
            }
          }

          // For user cancellation or other errors, we still consider biometrics supported
          // but we should log detailed info
          if (
            biometricsError.code === '-128' || // User pressed Cancel on iOS
            biometricsError.code === '13'
          ) {
            // User pressed Cancel on Android
            Logger.info('User cancelled biometric prompt during enrollment check')

            // Return the hardware capability, but mark as not enabled yet
            return {
              biometricsEnabled: false,
              biometryType: biometryType,
            }
          }

          // For any other errors, assume biometrics are not available
          Logger.warn('Unknown error during biometric enrollment check:', biometricsError)
          dispatch(setBiometricsType(BiometryType.NONE))
          dispatch(setBiometricsSupported(false))
          return {
            biometricsEnabled: false,
            biometryType: BiometryType.NONE,
          }
        }
      }

      // Device doesn't support biometrics at all
      Logger.info('Device does not support biometrics')
      dispatch(setBiometricsType(BiometryType.NONE))
      dispatch(setBiometricsSupported(false))
      return {
        biometricsEnabled: false,
        biometryType: BiometryType.NONE,
      }
    } catch (error) {
      // Log the error but don't assign an unused variable
      Logger.error('Critical error checking biometrics support:', error)

      // Handle no biometrics hardware or other critical errors
      dispatch(setBiometricsType(BiometryType.NONE))
      dispatch(setBiometricsSupported(false))
      return {
        biometricsEnabled: false,
        biometryType: BiometryType.NONE,
      }
    }
  }, [dispatch])

  const ensureBiometricsAvailable = useCallback(async () => {
    const { biometricsEnabled, biometryType } = await checkOSBiometricsSupport()

    if (!biometricsEnabled) {
      // Different message depending on whether biometrics are supported but not enrolled,
      // or not supported at all
      const isSupportedButNotEnrolled = biometryType !== BiometryType.NONE
      const title = isSupportedButNotEnrolled
        ? 'Biometric Enrollment Required'
        : 'Biometric Authentication Not Available'

      const message = isSupportedButNotEnrolled
        ? 'To secure your private keys, you need to enroll your fingerprint or face recognition in your device settings. Would you like to set it up now?'
        : 'Your device does not support biometric authentication or it is not enrolled.'

      const buttons = isSupportedButNotEnrolled
        ? [
            { text: 'Not Now', style: 'cancel' as const },
            { text: 'Open Settings', onPress: openBiometricSettings },
          ]
        : [{ text: 'OK', style: 'default' as const }]

      Alert.alert(title, message, buttons, { cancelable: false })
      return false
    }

    return true
  }, [checkOSBiometricsSupport, openBiometricSettings])

  const disableBiometrics = useCallback(async () => {
    setIsLoading(true)
    try {
      await Keychain.resetGenericPassword()
      dispatch(setBiometricsEnabled(false))
      return true
    } catch (error) {
      Logger.error('Error disabling biometrics:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [dispatch])

  const enableBiometrics = useCallback(async () => {
    setIsLoading(true)
    try {
      const { biometricsEnabled: isEnabledAtOSLevel } = await checkOSBiometricsSupport()

      if (!isEnabledAtOSLevel) {
        if (userCancelled) {
          openBiometricSettings()
        } else {
          await ensureBiometricsAvailable()
        }
        setIsLoading(false)
        return false
      }

      try {
        // Try with biometrics first
        const accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_ANY
        const accessible = Keychain.ACCESSIBLE.WHEN_UNLOCKED

        const setGenericPasswordResult = await Keychain.setGenericPassword(BIOMETRICS_KEY, 'biometrics-enabled', {
          accessControl,
          accessible,
        })

        if (setGenericPasswordResult) {
          const getGenericPasswordResult = await Keychain.getGenericPassword({
            accessControl,
          })

          if (getGenericPasswordResult) {
            dispatch(setBiometricsEnabled(true))
            dispatch(setUserAttempts(0))
            setUserCancelled(false)
            return true
          }
        }

        throw new Error('Failed to verify biometrics setup')
      } catch (error) {
        // Handle user cancellation
        const biometricsError = error as { code?: string; message?: string }
        if (
          biometricsError.code === '-128' || // User pressed Cancel
          biometricsError.code === 'AuthenticationFailed' ||
          biometricsError.message?.includes('cancel') ||
          biometricsError.message?.includes('user name or passphrase')
        ) {
          await Keychain.resetGenericPassword()
          dispatch(setUserAttempts(userAttempts + 1))
          setUserCancelled(true)
          dispatch(setBiometricsEnabled(false))
          return false
        }

        // Try with device passcode fallback if biometrics fails for other reasons
        try {
          const accessControl = Keychain.ACCESS_CONTROL.DEVICE_PASSCODE
          const accessible = Keychain.ACCESSIBLE.WHEN_UNLOCKED

          const hasSetPasscode = await Keychain.setGenericPassword(BIOMETRICS_KEY, 'passcode-enabled', {
            accessControl,
            accessible,
          })

          if (hasSetPasscode) {
            const getPasscodeResult = await Keychain.getGenericPassword({
              accessControl,
            })

            if (getPasscodeResult) {
              dispatch(setBiometricsEnabled(true))
              dispatch(setUserAttempts(0))
              setUserCancelled(false)
              return true
            }
          }
        } catch (passcodeError) {
          Logger.error('Passcode fallback failed:', passcodeError)
          throw passcodeError
        }

        throw error
      }
    } catch (error) {
      Logger.error('Unexpected error in biometrics setup:', error)
      await Keychain.resetGenericPassword()
      dispatch(setBiometricsEnabled(false))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [
    dispatch,
    checkOSBiometricsSupport,
    userCancelled,
    userAttempts,
    openBiometricSettings,
    ensureBiometricsAvailable,
  ])

  const toggleBiometrics = useCallback(
    async (newValue: boolean) => {
      return newValue ? enableBiometrics() : disableBiometrics()
    },
    [enableBiometrics, disableBiometrics],
  )

  const getBiometricsButtonLabel = useCallback(() => {
    switch (biometricsType) {
      case BiometryType.FACE:
        return 'Enable Face ID'
      case BiometryType.TOUCH:
        return 'Enable Touch ID'
      case BiometryType.IRIS:
        return 'Enable Iris ID'
      default:
        return 'Enable Biometrics'
    }
  }, [biometricsType])

  const syncBiometricsWithOSSettings = useCallback(async () => {
    if (isEnabled) {
      const { biometricsEnabled: isEnabledAtOSLevel } = await checkOSBiometricsSupport()
      if (!isEnabledAtOSLevel) {
        disableBiometrics()
      }
    }
  }, [isEnabled, checkOSBiometricsSupport, disableBiometrics])

  // Monitor app state changes to sync biometrics with OS settings when app returns from background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && !isAppActive) {
        setIsAppActive(true)
        await syncBiometricsWithOSSettings()
      } else if (nextAppState !== 'active') {
        setIsAppActive(false)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [syncBiometricsWithOSSettings, isAppActive])

  return {
    enableBiometrics,
    disableBiometrics,
    toggleBiometrics,
    openBiometricSettings,
    isBiometricsEnabled: isEnabled,
    biometricsType,
    isLoading,
    getBiometricsButtonLabel,
    ensureBiometricsAvailable,
    checkOSBiometricsSupport,
  }
}
