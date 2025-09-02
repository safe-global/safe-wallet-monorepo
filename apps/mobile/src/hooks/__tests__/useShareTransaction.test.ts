import { renderHook } from '@testing-library/react-native'
import { useShareTransaction } from '../useShareTransaction'

// Mock dependencies
jest.mock('react-native-share', () => ({
  open: jest.fn(),
}))

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
}))

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: jest.fn(),
}))

jest.mock('@/src/config/constants', () => ({
  SAFE_WEB_TRANSACTIONS_URL: 'https://app.safe.global/transactions/tx?safe=:safeAddressWithChainPrefix&id=:txId',
}))

const mockShare = jest.requireMock('react-native-share')
const { useAppSelector } = require('@/src/store/hooks')
const { useDefinedActiveSafe } = require('@/src/store/hooks/activeSafe')

describe('useShareTransaction', () => {
  const mockTxId = '0x123456789abcdef'
  const mockActiveSafe = {
    address: '0xSafeAddress123',
    chainId: '1',
  }
  const mockChain = {
    shortName: 'eth',
    chainId: '1',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    useDefinedActiveSafe.mockReturnValue(mockActiveSafe)
    useAppSelector.mockImplementation(() => {
      // Mock selectChainById selector
      return mockChain
    })
  })

  it('should return a function', () => {
    const { result } = renderHook(() => useShareTransaction(mockTxId))

    expect(typeof result.current).toBe('function')
  })

  it('should construct correct URL and call Share.open with correct parameters', async () => {
    mockShare.open.mockResolvedValue(undefined)

    const { result } = renderHook(() => useShareTransaction(mockTxId))

    await result.current()

    const expectedUrl = 'https://app.safe.global/transactions/tx?safe=eth:0xSafeAddress123&id=0x123456789abcdef'

    expect(mockShare.open).toHaveBeenCalledTimes(1)
    expect(mockShare.open).toHaveBeenCalledWith({
      title: 'Transaction Details',
      message: `View transaction details: ${expectedUrl}`,
      url: expectedUrl,
    })
  })

  it('should not call Share.open when chain is not available', async () => {
    useAppSelector.mockImplementation(() => null) // No chain found

    const { result } = renderHook(() => useShareTransaction(mockTxId))

    await result.current()

    expect(mockShare.open).not.toHaveBeenCalled()
  })

  it('should handle Share.open rejection gracefully', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    const shareError = new Error('User cancelled')
    mockShare.open.mockRejectedValue(shareError)

    const { result } = renderHook(() => useShareTransaction(mockTxId))

    await result.current()

    expect(consoleLogSpy).toHaveBeenCalledWith('Share cancelled or failed:', shareError)

    consoleLogSpy.mockRestore()
  })

  it('should work with different chain short names', async () => {
    const polygonChain = {
      shortName: 'matic',
      chainId: '137',
    }

    useAppSelector.mockImplementation(() => polygonChain)
    mockShare.open.mockResolvedValue(undefined)

    const { result } = renderHook(() => useShareTransaction(mockTxId))

    await result.current()

    const expectedUrl = 'https://app.safe.global/transactions/tx?safe=matic:0xSafeAddress123&id=0x123456789abcdef'

    expect(mockShare.open).toHaveBeenCalledWith({
      title: 'Transaction Details',
      message: `View transaction details: ${expectedUrl}`,
      url: expectedUrl,
    })
  })

  it('should update when dependencies change', async () => {
    const { result, rerender } = renderHook(({ txId }) => useShareTransaction(txId), { initialProps: { txId: 'tx1' } })

    mockShare.open.mockResolvedValue(undefined)

    // First call with tx1
    await result.current()
    expect(mockShare.open).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('id=tx1'),
      }),
    )

    // Update txId
    rerender({ txId: 'tx2' })

    // Second call with tx2
    await result.current()
    expect(mockShare.open).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('id=tx2'),
      }),
    )

    expect(mockShare.open).toHaveBeenCalledTimes(2)
  })

  it('should memoize the function correctly', () => {
    const { result, rerender } = renderHook(({ txId }) => useShareTransaction(txId), {
      initialProps: { txId: mockTxId },
    })

    const firstFunction = result.current

    // Rerender with same props
    rerender({ txId: mockTxId })

    const secondFunction = result.current

    // Function should be the same reference due to useCallback
    expect(firstFunction).toBe(secondFunction)
  })

  it('should create new function when dependencies change', () => {
    const { result, rerender } = renderHook(({ txId }) => useShareTransaction(txId), { initialProps: { txId: 'tx1' } })

    const firstFunction = result.current

    // Change txId
    rerender({ txId: 'tx2' })

    const secondFunction = result.current

    // Function should be different due to dependency change
    expect(firstFunction).not.toBe(secondFunction)
  })
})
