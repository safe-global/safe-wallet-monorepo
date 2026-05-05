import { Linking } from 'react-native'
import { Camera } from 'react-native-vision-camera'
import { act, renderHook } from '@/src/tests/test-utils'
import { useCameraPermissionFlow } from './useCameraPermissionFlow'

jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getCameraPermissionStatus: jest.fn(),
    requestCameraPermission: jest.fn(),
  },
}))

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}))

describe('useCameraPermissionFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined)
    jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue('not-determined')
  })

  it('seeds permission from Camera.getCameraPermissionStatus on mount', () => {
    jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue('denied')

    const { result } = renderHook(() => useCameraPermissionFlow())

    expect(result.current.permission).toBe('denied')
  })

  it('updates permission state after requestPermission resolves', async () => {
    jest.mocked(Camera.requestCameraPermission).mockResolvedValue('granted')

    const { result } = renderHook(() => useCameraPermissionFlow())

    await act(async () => {
      await result.current.requestPermission()
    })

    expect(result.current.permission).toBe('granted')
  })

  it('does NOT call Linking.openSettings as a side effect of denial', async () => {
    jest.mocked(Camera.requestCameraPermission).mockResolvedValue('denied')

    const { result } = renderHook(() => useCameraPermissionFlow())

    await act(async () => {
      await result.current.requestPermission()
    })

    expect(result.current.permission).toBe('denied')
    expect(Linking.openSettings).not.toHaveBeenCalled()
  })

  it('opens Settings only when openSettings is called explicitly', () => {
    const { result } = renderHook(() => useCameraPermissionFlow())

    act(() => {
      result.current.openSettings()
    })

    expect(Linking.openSettings).toHaveBeenCalledTimes(1)
  })
})
