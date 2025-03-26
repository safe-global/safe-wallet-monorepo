import { useState, useCallback } from 'react'
import * as Keychain from 'react-native-keychain'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { setBiometricsEnabled, setBiometricsSupported, setBiometricsType } from '@/src/store/biometricsSlice'
import Logger from '@/src/utils/logger'

const BIOMETRICS_KEY = 'SAFE_WALLET_BIOMETRICS'

export function useBiometrics() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const isEnabled = useAppSelector((state) => state.biometrics.isEnabled)
  const biometricsType = useAppSelector((state) => state.biometrics.type)

  // Only check if biometrics is supported, don't verify/authenticate
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
      const isSupported = await checkBiometricsSupport()
      if (!isSupported) {
        dispatch(setBiometricsType('NONE'))
        dispatch(setBiometricsSupported(false))
        return false
      }

      await Keychain.setGenericPassword(BIOMETRICS_KEY, 'biometrics-enabled', {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      })

      const result = await Keychain.getGenericPassword({
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      })

      if (result && result.username === BIOMETRICS_KEY) {
        dispatch(setBiometricsEnabled(true))
        return true
      }
      return false
    } catch (error) {
      Logger.error('Error enabling biometrics:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, checkBiometricsSupport])

  const toggleBiometrics = useCallback(
    async (newValue: boolean) => {
      if (newValue) {
        return enableBiometrics()
      } else {
        return disableBiometrics()
      }
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
  }, [biometricsType, isEnabled])

  return {
    toggleBiometrics,
    isBiometricsEnabled: isEnabled,
    biometricsType,
    isLoading,
    getBiometricsButtonLabel,
  }
}
