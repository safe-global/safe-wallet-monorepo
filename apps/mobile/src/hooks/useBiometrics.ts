import { useState, useCallback, useEffect } from 'react'
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

  // Only check if biometrics is enabled without triggering the prompt
  const checkBiometricsStatus = useCallback(async () => {
    try {
      const credentials = await Keychain.getInternetCredentials(BIOMETRICS_KEY)
      return credentials !== false
    } catch (error) {
      Logger.error('Error checking biometrics status:', error)
      return false
    }
  }, [])

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

      if (result) {
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

  useEffect(() => {
    const init = async () => {
      await checkBiometricsSupport()
      const isEnabled = await checkBiometricsStatus()
      dispatch(setBiometricsEnabled(isEnabled))
    }

    init()
  }, [dispatch, checkBiometricsStatus])

  return {
    enableBiometrics,
    isBiometricsEnabled: isEnabled,
    biometricsType,
    isLoading,
    getBiometricsButtonLabel,
  }
}
