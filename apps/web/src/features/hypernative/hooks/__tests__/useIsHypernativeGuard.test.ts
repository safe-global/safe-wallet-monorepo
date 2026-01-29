import { renderHook, waitFor, mockWeb3Provider } from '@/tests/test-utils'
import { useIsHypernativeGuard } from '../useIsHypernativeGuard'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as useChains from '@/hooks/useChains'
import * as hypernativeGuardCheck from '../../services/hypernativeGuardCheck'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { JsonRpcProvider } from 'ethers'

describe('useIsHypernativeGuard', () => {
  let mockProvider: JsonRpcProvider

  beforeEach(() => {
    jest.clearAllMocks()
    mockProvider = mockWeb3Provider([])
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(mockProvider)
    // Mock useHasFeature to return false by default (ABI check enabled)
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
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
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(undefined)
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
    const chainId = '10'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockResolvedValue(true)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          chainId,
          guard: {
            value: guardAddress,
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(true)
    })

    expect(hypernativeGuardCheck.isHypernativeGuard).toHaveBeenCalledWith(chainId, guardAddress, mockProvider, false)
  })

  it('should return false when guard is not a HypernativeGuard', async () => {
    const guardAddress = '0x9999999999999999999999999999999999999999'
    const chainId = '11155111'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockResolvedValue(false)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          chainId,
          guard: {
            value: guardAddress,
            name: 'SomeOtherGuard',
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })

    expect(hypernativeGuardCheck.isHypernativeGuard).toHaveBeenCalledWith(chainId, guardAddress, mockProvider, false)
  })

  it('should handle errors gracefully and return false', async () => {
    const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
    const chainId = '1'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockRejectedValue(new Error('Network error'))
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          chainId,
          guard: {
            value: guardAddress,
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })

    // The hook catches the error and returns false (error logging is tested in service layer tests)
  })

  it('should re-check when guard address changes', async () => {
    const firstGuardAddress = '0x1111111111111111111111111111111111111111'
    const secondGuardAddress = '0x2222222222222222222222222222222222222222'
    const chainId1 = '11155111'
    const chainId2 = '10'

    const isHypernativeGuardSpy = jest
      .spyOn(hypernativeGuardCheck, 'isHypernativeGuard')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)

    const useSafeInfoSpy = jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          chainId: chainId1,
          guard: {
            value: firstGuardAddress,
            name: 'FirstGuard',
            logoUri: null,
          },
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
          chainId: chainId2,
          guard: {
            value: secondGuardAddress,
            name: 'SecondGuard',
            logoUri: null,
          },
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
    expect(isHypernativeGuardSpy).toHaveBeenNthCalledWith(1, chainId1, firstGuardAddress, mockProvider, false)
    expect(isHypernativeGuardSpy).toHaveBeenNthCalledWith(2, chainId2, secondGuardAddress, mockProvider, false)
  })

  it('should cancel stale requests when dependencies change (race condition)', async () => {
    const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'

    // Create a promise we can control
    let resolveFirst: (value: boolean) => void
    const firstPromise = new Promise<boolean>((resolve) => {
      resolveFirst = resolve
    })

    jest
      .spyOn(hypernativeGuardCheck, 'isHypernativeGuard')
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(false)

    const useSafeInfoSpy = jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
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

    const { result, rerender } = renderHook(() => useIsHypernativeGuard())

    // First request is pending
    expect(result.current.loading).toBe(true)

    // Change to a different guard before first resolves
    useSafeInfoSpy.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: '0x9999999999999999999999999999999999999999',
            name: 'OtherGuard',
            logoUri: null,
          },
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    rerender()

    // Second request completes first
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isHypernativeGuard).toBe(false)
    })

    // Now resolve the first request (should be ignored due to cancellation)
    resolveFirst!(true)

    // Wait a bit to ensure the stale result doesn't update state
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should still show result from second request, not first
    expect(result.current.isHypernativeGuard).toBe(false)
  })

  it('should reset isHnGuard to false when safe is not loaded', async () => {
    const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockResolvedValue(true)

    const useSafeInfoSpy = jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
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

    const { result, rerender } = renderHook(() => useIsHypernativeGuard())

    // Wait for initial check to complete
    await waitFor(() => {
      expect(result.current.isHypernativeGuard).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    // Change to safe not loaded
    useSafeInfoSpy.mockReturnValue({
      safe: extendedSafeInfoBuilder().build(),
      safeAddress: '',
      safeLoaded: false,
      safeLoading: true,
      safeError: undefined,
    })

    rerender()

    // Should reset isHnGuard to false and set loading to true
    await waitFor(() => {
      expect(result.current.isHypernativeGuard).toBe(false)
      expect(result.current.loading).toBe(true)
    })
  })

  it('should reset isHnGuard to false when provider becomes unavailable', async () => {
    const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
    jest.spyOn(hypernativeGuardCheck, 'isHypernativeGuard').mockResolvedValue(true)
    const web3Spy = jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(mockProvider)

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          guard: {
            value: guardAddress,
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

    const { result, rerender } = renderHook(() => useIsHypernativeGuard())

    // Wait for initial check to complete
    await waitFor(() => {
      expect(result.current.isHypernativeGuard).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    // Provider becomes unavailable
    web3Spy.mockReturnValue(undefined)

    rerender()

    // Should reset isHnGuard to false and set loading to true
    await waitFor(() => {
      expect(result.current.isHypernativeGuard).toBe(false)
      expect(result.current.loading).toBe(true)
    })
  })
})
