import { act, waitFor } from '@testing-library/react-native'
import { renderHook, type TestStore } from '@/src/tests/test-utils'
import { useBiometrics } from './useBiometrics'
import * as Keychain from 'react-native-keychain'
import { Alert, Linking, Platform } from 'react-native'

const mockGetSupportedBiometryType = Keychain.getSupportedBiometryType as jest.Mock
const mockSetGenericPassword = Keychain.setGenericPassword as jest.Mock
const mockGetGenericPassword = Keychain.getGenericPassword as jest.Mock
const mockResetGenericPassword = Keychain.resetGenericPassword as jest.Mock

describe('useBiometrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSupportedBiometryType.mockResolvedValue(null)
  })

  describe('initial state', () => {
    it('returns initial state with biometrics disabled', () => {
      const { result } = renderHook(() => useBiometrics())

      expect(result.current.isBiometricsEnabled).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('provides getBiometricsUIInfo function', () => {
      const { result } = renderHook(() => useBiometrics())

      const uiInfo = result.current.getBiometricsUIInfo()
      expect(uiInfo).toHaveProperty('label')
      expect(uiInfo).toHaveProperty('icon')
    })
  })

  describe('getBiometricsUIInfo', () => {
    it('returns Face ID info when biometrics type is FACE_ID', () => {
      const { result } = renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: false, isSupported: true, type: 'FACE_ID', userAttempts: 0 },
      })

      const uiInfo = result.current.getBiometricsUIInfo()
      expect(uiInfo.icon).toBe('face-id')
      expect(uiInfo.label).toBe('Enable biometrics')
    })

    it('returns fingerprint info when biometrics type is TOUCH_ID', () => {
      const { result } = renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: false, isSupported: true, type: 'TOUCH_ID', userAttempts: 0 },
      })

      const uiInfo = result.current.getBiometricsUIInfo()
      expect(uiInfo.icon).toBe('fingerprint')
    })

    it('returns fingerprint info when biometrics type is FINGERPRINT', () => {
      const { result } = renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: false, isSupported: true, type: 'FINGERPRINT', userAttempts: 0 },
      })

      const uiInfo = result.current.getBiometricsUIInfo()
      expect(uiInfo.icon).toBe('fingerprint')
    })

    it('returns default face-id icon when biometrics type is NONE', () => {
      const { result } = renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: false, isSupported: false, type: 'NONE', userAttempts: 0 },
      })

      const uiInfo = result.current.getBiometricsUIInfo()
      expect(uiInfo.icon).toBe('face-id')
    })
  })

  describe('checkBiometricsOSSettingsStatus', () => {
    it('returns biometricsEnabled true when biometrics is available', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      const { result } = renderHook(() => useBiometrics())

      const status = await result.current.checkBiometricsOSSettingsStatus()

      expect(status.biometricsEnabled).toBe(true)
      expect(status.biometryType).toBe('FaceID')
    })

    it('returns biometricsEnabled false when biometrics is not available', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(null)
      const { result } = renderHook(() => useBiometrics())

      const status = await result.current.checkBiometricsOSSettingsStatus()

      expect(status.biometricsEnabled).toBe(false)
      expect(status.biometryType).toBeNull()
    })

    it('handles errors and returns disabled state', async () => {
      mockGetSupportedBiometryType.mockRejectedValue(new Error('Keychain error'))
      const { result } = renderHook(() => useBiometrics())

      const status = await result.current.checkBiometricsOSSettingsStatus()

      expect(status.biometricsEnabled).toBe(false)
      expect(status.biometryType).toBeNull()
    })
  })

  describe('toggleBiometrics', () => {
    it('enables biometrics when all conditions are met', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      mockSetGenericPassword.mockResolvedValue(true)
      mockGetGenericPassword.mockResolvedValue({ password: 'biometrics-enabled' })

      const hookResult = renderHook(() => useBiometrics())
      const store = hookResult.store as TestStore

      await act(async () => {
        const returnValue = await hookResult.result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({ status: 'enabled' })
      })

      await waitFor(() => {
        expect(store.getState().biometrics.isEnabled).toBe(true)
      })
    })

    it('disables biometrics correctly', async () => {
      mockResetGenericPassword.mockResolvedValue(true)

      const hookResult = renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: true, isSupported: true, type: 'FACE_ID', userAttempts: 0 },
      })
      const store = hookResult.store as TestStore

      await act(async () => {
        const returnValue = await hookResult.result.current.toggleBiometrics(false)
        expect(returnValue).toEqual({ status: 'disabled' })
      })

      await waitFor(() => {
        expect(store.getState().biometrics.isEnabled).toBe(false)
      })
      expect(mockResetGenericPassword).toHaveBeenCalled()
    })

    it('handles user cancellation during biometrics setup', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      mockSetGenericPassword.mockRejectedValue({
        code: '-128',
        message: 'User pressed Cancel',
      })
      mockResetGenericPassword.mockResolvedValue(true)

      const hookResult = renderHook(() => useBiometrics())
      const store = hookResult.store as TestStore

      await act(async () => {
        const returnValue = await hookResult.result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({ status: 'cancelled' })
      })

      await waitFor(() => {
        expect(store.getState().biometrics.isEnabled).toBe(false)
      })
    })

    it('handles authentication failed error', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      mockSetGenericPassword.mockRejectedValue({
        code: 'AuthenticationFailed',
        message: 'Authentication failed',
      })
      mockResetGenericPassword.mockResolvedValue(true)

      const { result } = renderHook(() => useBiometrics())

      await act(async () => {
        const returnValue = await result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({ status: 'cancelled' })
      })
    })

    it('handles error with cancel message', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      mockSetGenericPassword.mockRejectedValue({
        code: 'unknown',
        message: 'User did cancel the operation',
      })
      mockResetGenericPassword.mockResolvedValue(true)

      const { result } = renderHook(() => useBiometrics())

      await act(async () => {
        const returnValue = await result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({ status: 'cancelled' })
      })
    })

    it('handles passphrase error', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      mockSetGenericPassword.mockRejectedValue({
        code: 'unknown',
        message: 'user name or passphrase you entered is not correct',
      })
      mockResetGenericPassword.mockResolvedValue(true)

      const { result } = renderHook(() => useBiometrics())

      await act(async () => {
        const returnValue = await result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({ status: 'cancelled' })
      })
    })

    it('returns os-not-configured when biometrics is not available, without redirecting to Settings', async () => {
      // Compliance invariant: enabling biometrics must NEVER call Linking.openURL or
      // Linking.openSettings as a side effect. The caller renders an in-app explainer
      // with an explicit "Open Settings" button.
      mockGetSupportedBiometryType.mockResolvedValue(null)
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn())
      const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockImplementation(jest.fn())

      const hookResult = renderHook(() => useBiometrics())
      const store = hookResult.store as TestStore

      await act(async () => {
        const returnValue = await hookResult.result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({ status: 'os-not-configured' })
      })

      expect(store.getState().biometrics.isEnabled).toBe(false)
      expect(openURLSpy).not.toHaveBeenCalled()
      expect(openSettingsSpy).not.toHaveBeenCalled()

      openURLSpy.mockRestore()
      openSettingsSpy.mockRestore()
    })

    it('handles unexpected errors during biometrics setup', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      const thrown = new Error('Unexpected storage error')
      mockSetGenericPassword.mockRejectedValue(thrown)
      mockResetGenericPassword.mockResolvedValue(true)

      const hookResult = renderHook(() => useBiometrics())
      const store = hookResult.store as TestStore

      await act(async () => {
        const returnValue = await hookResult.result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({ status: 'error', error: thrown })
      })

      expect(store.getState().biometrics.isEnabled).toBe(false)
      expect(mockResetGenericPassword).toHaveBeenCalled()
    })

    it('handles failed verification after setting password', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      mockSetGenericPassword.mockResolvedValue(true)
      mockGetGenericPassword.mockResolvedValue(false)
      mockResetGenericPassword.mockResolvedValue(true)

      const { result } = renderHook(() => useBiometrics())

      await act(async () => {
        const returnValue = await result.current.toggleBiometrics(true)
        expect(returnValue).toEqual({
          status: 'error',
          error: expect.objectContaining({ message: 'Failed to verify biometrics setup' }),
        })
      })
    })

    it('returns error when disable fails to reset the keychain', async () => {
      const resetError = new Error('Keychain unavailable')
      mockResetGenericPassword.mockRejectedValue(resetError)

      const hookResult = renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: true, isSupported: true, type: 'FACE_ID', userAttempts: 0 },
      })
      const store = hookResult.store as TestStore

      await act(async () => {
        const returnValue = await hookResult.result.current.toggleBiometrics(false)
        expect(returnValue).toEqual({ status: 'error', error: resetError })
      })

      // Redux still flips to disabled to match user intent.
      expect(store.getState().biometrics.isEnabled).toBe(false)
    })
  })

  describe('promptBiometricsSetup', () => {
    const originalPlatform = Platform.OS
    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true })
    })

    it('shows Cancel + Open settings buttons', () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
      const { result } = renderHook(() => useBiometrics())

      result.current.promptBiometricsSetup()

      const [, , buttons] = alertSpy.mock.calls[0]
      expect(buttons).toEqual([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Open settings' }),
      ])
      alertSpy.mockRestore()
    })

    it('routes iOS Open settings tap to app-settings:', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
      const { result } = renderHook(() => useBiometrics())

      result.current.promptBiometricsSetup()
      const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[]
      await buttons.find((b) => b.text === 'Open settings')?.onPress?.()

      expect(openURLSpy).toHaveBeenCalledWith('app-settings:')
      alertSpy.mockRestore()
      openURLSpy.mockRestore()
    })

    it('routes Android Open settings tap through BIOMETRIC_ENROLL intent', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
      const sendIntentSpy = jest.spyOn(Linking, 'sendIntent').mockResolvedValue(undefined)
      const { result } = renderHook(() => useBiometrics())

      result.current.promptBiometricsSetup()
      const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[]
      await buttons.find((b) => b.text === 'Open settings')?.onPress?.()

      expect(sendIntentSpy).toHaveBeenCalledWith('android.settings.BIOMETRIC_ENROLL')
      alertSpy.mockRestore()
      sendIntentSpy.mockRestore()
    })
  })

  describe('openBiometricSettings', () => {
    const originalPlatform = Platform.OS
    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true })
    })

    it('opens app-settings: on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
      const { result } = renderHook(() => useBiometrics())

      await result.current.openBiometricSettings()

      expect(openURLSpy).toHaveBeenCalledWith('app-settings:')
      openURLSpy.mockRestore()
    })

    it('uses BIOMETRIC_ENROLL intent on Android', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
      const sendIntentSpy = jest.spyOn(Linking, 'sendIntent').mockResolvedValue(undefined)
      const { result } = renderHook(() => useBiometrics())

      await result.current.openBiometricSettings()

      expect(sendIntentSpy).toHaveBeenCalledWith('android.settings.BIOMETRIC_ENROLL')
      sendIntentSpy.mockRestore()
    })

    it('falls back to openSettings on Android when the intent throws', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
      const sendIntentSpy = jest.spyOn(Linking, 'sendIntent').mockRejectedValue(new Error('no activity'))
      const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined)
      const { result } = renderHook(() => useBiometrics())

      await result.current.openBiometricSettings()

      expect(openSettingsSpy).toHaveBeenCalled()
      sendIntentSpy.mockRestore()
      openSettingsSpy.mockRestore()
    })
  })

  describe('useLayoutEffect cleanup', () => {
    it('disables biometrics when OS-level biometrics is disabled', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(null)
      mockResetGenericPassword.mockResolvedValue(true)

      const hookResult = renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: true, isSupported: true, type: 'FACE_ID', userAttempts: 0 },
      })
      const store = hookResult.store as TestStore

      await waitFor(() => {
        expect(store.getState().biometrics.isEnabled).toBe(false)
      })
    })

    it('does not redirect to Settings when OS-level biometrics is disabled on mount', async () => {
      // Background re-evaluation must not auto-redirect either.
      mockGetSupportedBiometryType.mockResolvedValue(null)
      mockResetGenericPassword.mockResolvedValue(true)
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn())
      const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockImplementation(jest.fn())

      renderHook(() => useBiometrics(), {
        biometrics: { isEnabled: true, isSupported: true, type: 'FACE_ID', userAttempts: 0 },
      })

      await waitFor(() => {
        expect(mockResetGenericPassword).toHaveBeenCalled()
      })
      expect(openURLSpy).not.toHaveBeenCalled()
      expect(openSettingsSpy).not.toHaveBeenCalled()

      openURLSpy.mockRestore()
      openSettingsSpy.mockRestore()
    })
  })
})
