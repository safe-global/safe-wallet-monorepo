import { act, renderHook, waitFor } from '@/src/tests/test-utils'
import type { Code } from 'react-native-vision-camera'
import { useWalletConnectScan } from '../useWalletConnectScan'

const VALID_URI = 'wc:7f6e9a3c@2?relay-protocol=irn&symKey=abc'

const mockBack = jest.fn()
const mockPair = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  // Run the focus callback once on mount, run its cleanup on unmount.
  useFocusEffect: (cb: () => undefined | (() => void)) => {
    const React = require('react')
    React.useEffect(cb, [])
  },
}))

jest.mock('@/src/components/Camera', () => ({
  useCameraPermissionFlow: () => ({
    permission: 'granted',
    requestPermission: jest.fn(),
    openSettings: jest.fn(),
  }),
}))

jest.mock('../../walletKit', () => ({
  getWalletKit: () => Promise.resolve({ pair: mockPair }),
}))

const codes = (value?: string): Code[] => [{ value } as Code]

describe('useWalletConnectScan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPair.mockResolvedValue(undefined)
  })

  it('starts in scanning with the camera active when permission is granted', () => {
    const { result } = renderHook(() => useWalletConnectScan())
    expect(result.current.status).toBe('scanning')
    expect(result.current.isCameraActive).toBe(true)
  })

  it('pairs a valid wc: URI and navigates back on success', async () => {
    const { result } = renderHook(() => useWalletConnectScan())

    act(() => {
      result.current.onScan(codes(VALID_URI))
    })

    expect(result.current.status).toBe('connecting')
    await waitFor(() => expect(mockPair).toHaveBeenCalledWith({ uri: VALID_URI }))
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
  })

  it('shows "Unrecognised QR code" for a non-wc QR', () => {
    const { result } = renderHook(() => useWalletConnectScan())

    act(() => {
      result.current.onScan(codes('https://example.com'))
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toBe('Unrecognised QR code')
    expect(mockPair).not.toHaveBeenCalled()
  })

  it('surfaces the pair() error message on failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockPair.mockRejectedValueOnce(new Error('pairing rejected'))
    const { result } = renderHook(() => useWalletConnectScan())

    act(() => {
      result.current.onScan(codes(VALID_URI))
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe('pairing rejected')
    expect(mockBack).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('goes to error on the 10s timeout and ignores a late pair() resolve', async () => {
    jest.useFakeTimers()
    let resolvePair: () => void = () => undefined
    mockPair.mockImplementationOnce(() => new Promise<void>((res) => (resolvePair = res)))

    const { result } = renderHook(() => useWalletConnectScan())
    act(() => {
      result.current.onScan(codes(VALID_URI))
    })
    expect(result.current.status).toBe('connecting')

    act(() => {
      jest.advanceTimersByTime(10_000)
    })
    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toBe('Connection timed out. Try again.')

    // A late resolve must not navigate back.
    await act(async () => {
      resolvePair()
      await Promise.resolve()
    })
    expect(mockBack).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('resets to scanning on Try again', () => {
    const { result } = renderHook(() => useWalletConnectScan())
    act(() => {
      result.current.onScan(codes('not-a-wc-uri'))
    })
    expect(result.current.status).toBe('error')

    act(() => {
      result.current.onTryAgain()
    })
    expect(result.current.status).toBe('scanning')
    expect(result.current.errorMessage).toBe('')
    expect(result.current.isCameraActive).toBe(true)
  })

  it('ignores a second scan while a pair is in flight', async () => {
    let resolvePair: () => void = () => undefined
    mockPair.mockImplementationOnce(() => new Promise<void>((res) => (resolvePair = res)))

    const { result } = renderHook(() => useWalletConnectScan())
    act(() => {
      result.current.onScan(codes(VALID_URI))
    })
    act(() => {
      result.current.onScan(codes(VALID_URI))
    })

    await act(async () => {
      resolvePair()
      await Promise.resolve()
    })
    expect(mockPair).toHaveBeenCalledTimes(1)
  })
})
