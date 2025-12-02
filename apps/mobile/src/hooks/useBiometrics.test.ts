import { act, waitFor } from '@testing-library/react-native'
import { renderHook, type TestStore } from '@/src/tests/test-utils'
import { useBiometrics } from './useBiometrics'
import * as Keychain from 'react-native-keychain'
import { Linking } from 'react-native'

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
        await hookResult.result.current.toggleBiometrics(true)
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
        await hookResult.result.current.toggleBiometrics(false)
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
        expect(returnValue).toBe(false)
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
        expect(returnValue).toBe(false)
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
        expect(returnValue).toBe(false)
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
        expect(returnValue).toBe(false)
      })
    })

    it('does not enable when biometrics is not supported', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(null)

      const hookResult = renderHook(() => useBiometrics())
      const store = hookResult.store as TestStore

      await act(async () => {
        await hookResult.result.current.toggleBiometrics(true)
      })

      expect(store.getState().biometrics.isEnabled).toBe(false)
    })

    it('handles unexpected errors during biometrics setup', async () => {
      mockGetSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID)
      mockSetGenericPassword.mockRejectedValue(new Error('Unexpected storage error'))
      mockResetGenericPassword.mockResolvedValue(true)

      const hookResult = renderHook(() => useBiometrics())
      const store = hookResult.store as TestStore

      await act(async () => {
        const returnValue = await hookResult.result.current.toggleBiometrics(true)
        expect(returnValue).toBe(false)
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
        expect(returnValue).toBe(false)
      })
    })
  })

  describe('openBiometricSettings', () => {
    it('opens settings when called', () => {
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn())
      const { result } = renderHook(() => useBiometrics())

      result.current.openBiometricSettings()

      expect(openURLSpy).toHaveBeenCalledWith('app-settings:')
      openURLSpy.mockRestore()
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
  })
})
