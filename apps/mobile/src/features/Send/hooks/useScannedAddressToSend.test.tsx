import { act, renderHook } from '@/src/tests/test-utils'
import { useScannedAddressToSend } from './useScannedAddressToSend'

const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const mockReplace = jest.fn()
const mockDismissTo = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, dismissTo: mockDismissTo }),
}))

const mockShow = jest.fn()
jest.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: mockShow }),
}))

const mockActiveChain = jest.fn()
jest.mock('@/src/store/chains', () => ({
  ...jest.requireActual('@/src/store/chains'),
  selectActiveChain: () => mockActiveChain(),
}))

describe('useScannedAddressToSend', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChain.mockReturnValue(undefined)
  })

  it('navigates to the recipient with dismissTo by default', () => {
    const { result } = renderHook(() => useScannedAddressToSend())

    act(() => result.current.navigateToRecipient(VALID_ADDRESS))

    expect(mockDismissTo).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(send)/recipient',
        params: expect.objectContaining({ scannedAddress: VALID_ADDRESS }),
      }),
    )
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('navigates with replace when asked', () => {
    const { result } = renderHook(() => useScannedAddressToSend())

    act(() => result.current.navigateToRecipient(VALID_ADDRESS, 'replace'))

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(send)/recipient',
        params: expect.objectContaining({ scannedAddress: VALID_ADDRESS }),
      }),
    )
    expect(mockDismissTo).not.toHaveBeenCalled()
  })

  it('warns when the scanned prefix does not match the active chain', () => {
    mockActiveChain.mockReturnValue({ shortName: 'eth' })
    const { result } = renderHook(() => useScannedAddressToSend())

    act(() => result.current.warnChainMismatch('gno'))

    expect(mockShow).toHaveBeenCalledWith(expect.stringContaining('gno'), expect.anything())
  })

  it('does not warn when the prefix matches the active chain or is absent', () => {
    mockActiveChain.mockReturnValue({ shortName: 'eth' })
    const { result } = renderHook(() => useScannedAddressToSend())

    act(() => result.current.warnChainMismatch('eth'))
    act(() => result.current.warnChainMismatch(undefined))

    expect(mockShow).not.toHaveBeenCalled()
  })
})
