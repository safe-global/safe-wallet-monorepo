import { renderHook, waitFor, mockWeb3Provider } from '@/tests/test-utils'
import { useIsHypernativeGuard } from '../useIsHypernativeGuard'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as web3 from '@/hooks/wallets/web3'
import * as hypernativeGuardCheck from '../../services/hypernativeGuardCheck'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { JsonRpcProvider } from 'ethers'

describe('useIsHypernativeGuard', () => {
  let mockProvider: JsonRpcProvider

  beforeEach(() => {
    jest.clearAllMocks()
    mockProvider = mockWeb3Provider([])
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider)
  })

  it('should return loading true when safe is not loaded', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder().build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: false,
      safeLoading: true,
      safeError: undefined,
    })

    const { result } = renderHook(() => useIsHypernativeGuard())

    expect(result.current.loading).toBe(true)
    expect(result.current.isHypernativeGuard).toBe(false)
  })

  it('should return false and not loading when safe has no guard', async () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder().with({ guard: null }).build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result } = renderHook(() => useIsHypernativeGuard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })
  })

  it('should return loading true when provider is not available', () => {
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(undefined)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020',
            name: 'HypernativeGuard',
            logoUri: null,
          },
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result } = renderHook(() => useIsHypernativeGuard())

    expect(result.current.loading).toBe(true)
    expect(result.current.isHypernativeGuard).toBe(false)
  })

  it('should return true when guard is a HypernativeGuard', async () => {
    const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockResolvedValue(true)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
            name: 'HypernativeGuard',
            logoUri: null,
          },
          chainId: '11155111',
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result } = renderHook(() => useIsHypernativeGuard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(true)
    })

    expect(hypernativeGuardCheck.isHypernativeGuard).toHaveBeenCalledWith(guardAddress, mockProvider, '11155111')
  })

  it('should return false when guard is not a HypernativeGuard', async () => {
    const guardAddress = '0x9999999999999999999999999999999999999999'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockResolvedValue(false)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
            name: 'SomeOtherGuard',
            logoUri: null,
          },
          chainId: '11155111',
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result } = renderHook(() => useIsHypernativeGuard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })

    expect(hypernativeGuardCheck.isHypernativeGuard).toHaveBeenCalledWith(guardAddress, mockProvider, '11155111')
  })

  it('should handle errors gracefully and return false', async () => {
    const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockRejectedValue(new Error('Network error'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
            name: 'HypernativeGuard',
            logoUri: null,
          },
          chainId: '11155111',
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result } = renderHook(() => useIsHypernativeGuard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      '[useIsHypernativeGuard] Error checking guard:',
      expect.any(Error),
    )

    consoleSpy.mockRestore()
  })

  it('should re-check when guard address changes', async () => {
    const firstGuardAddress = '0x1111111111111111111111111111111111111111'
    const secondGuardAddress = '0x2222222222222222222222222222222222222222'

    const isHypernativeGuardSpy = jest
      .spyOn(hypernativeGuardCheck, 'isHypernativeGuard')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)

    const useSafeInfoSpy = jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: firstGuardAddress,
            name: 'FirstGuard',
            logoUri: null,
          },
          chainId: '11155111',
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result, rerender } = renderHook(() => useIsHypernativeGuard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })

    // Update the guard address
    useSafeInfoSpy.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: secondGuardAddress,
            name: 'SecondGuard',
            logoUri: null,
          },
          chainId: '11155111',
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    rerender()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(true)
    })

    expect(isHypernativeGuardSpy).toHaveBeenCalledTimes(2)
    expect(isHypernativeGuardSpy).toHaveBeenNthCalledWith(1, firstGuardAddress, mockProvider, '11155111')
    expect(isHypernativeGuardSpy).toHaveBeenNthCalledWith(2, secondGuardAddress, mockProvider, '11155111')
  })

  it('should re-check when chain ID changes', async () => {
    const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
    const isHypernativeGuardSpy = jest
      .spyOn(hypernativeGuardCheck, 'isHypernativeGuard')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)

    const useSafeInfoSpy = jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
            name: 'HypernativeGuard',
            logoUri: null,
          },
          chainId: '11155111',
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result, rerender } = renderHook(() => useIsHypernativeGuard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })

    // Update the chain ID
    useSafeInfoSpy.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
            name: 'HypernativeGuard',
            logoUri: null,
          },
          chainId: '1',
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    rerender()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(true)
    })

    expect(isHypernativeGuardSpy).toHaveBeenCalledTimes(2)
    expect(isHypernativeGuardSpy).toHaveBeenNthCalledWith(1, guardAddress, mockProvider, '11155111')
    expect(isHypernativeGuardSpy).toHaveBeenNthCalledWith(2, guardAddress, mockProvider, '1')
  })
})
