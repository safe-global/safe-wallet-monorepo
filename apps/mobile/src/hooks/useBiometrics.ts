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

  const checkOSBiometricsSupport = useCallback(async () => {
    try {
      const biometryType = await DeviceCrypto.getBiometryType()

      // Only update state if we have a valid biometry type
      if (biometryType !== BiometryType.NONE) {
        dispatch(setBiometricsType(biometryType))
        dispatch(setBiometricsSupported(true))
      } else {
        dispatch(setBiometricsType(BiometryType.NONE))
        dispatch(setBiometricsSupported(false))
      }

      return {
        biometricsEnabled: biometryType !== BiometryType.NONE,
        biometryType: biometryType,
      }
    } catch (error) {
      const biometricsError = error as BiometricsError

      // Handle the specific error case for no enrolled identities
      if (
        biometricsError.code === "Couldn't get biometry type" ||
        (biometricsError.code === '-7' && biometricsError.message?.includes('No identities are enrolled'))
      ) {
        dispatch(setBiometricsType(BiometryType.NONE))
        dispatch(setBiometricsSupported(false))
        return {
          biometricsEnabled: false,
          biometryType: BiometryType.NONE,
        }
      }

      Logger.error('Error checking biometrics support:', error)
      return {
        biometricsEnabled: false,
        biometryType: null,
      }
    }
  }, [dispatch])

  const ensureBiometricsAvailable = useCallback(async () => {
    const { biometricsEnabled } = await checkOSBiometricsSupport()

    if (!biometricsEnabled) {
      Alert.alert(
        'Biometric Authentication Required',
        'To secure your private keys, you need to set up fingerprint or face recognition on your device. Would you like to set it up now?',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: openBiometricSettings },
        ],
        { cancelable: false },
      )
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
      } catch (biometricsError: unknown) {
        // Handle user cancellation
        const error = biometricsError as { code?: string; message?: string }
        if (
          error.code === '-128' || // User pressed Cancel
          error.code === 'AuthenticationFailed' ||
          error.message?.includes('cancel') ||
          error.message?.includes('user name or passphrase')
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

          const passcodeResult = await Keychain.setGenericPassword(BIOMETRICS_KEY, 'passcode-enabled', {
            accessControl,
            accessible,
          })

          if (passcodeResult) {
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
