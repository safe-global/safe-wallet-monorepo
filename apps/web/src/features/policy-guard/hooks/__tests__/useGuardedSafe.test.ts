import { skipToken } from '@reduxjs/toolkit/query'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { POLLING_INTERVAL } from '@/config/constants'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { renderHook } from '@/tests/test-utils'
import { useGuardedSafe } from '../useGuardedSafe'

type SafeQuery = ReturnType<typeof safesQueries.useSafesGetSafeV1Query>

const TARGET = { chainId: '11155111', safeAddress: '0x3333333333333333333333333333333333333333' }

const buildSafe = (overrides: Partial<ExtendedSafeInfo> = {}) =>
  extendedSafeInfoBuilder()
    .with({ chainId: '1', version: '1.5.0', txHistoryTag: '1', ...overrides })
    .build()

const mockOpenSafe = (info: Partial<ReturnType<typeof useSafeInfo.default>> = {}) => {
  const safe = buildSafe()
  jest.spyOn(useSafeInfo, 'default').mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
    ...info,
  })
  return safe
}

const mockTargetQuery = (result: Partial<SafeQuery> = {}) =>
  jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
    refetch: jest.fn(),
    currentData: undefined,
    isLoading: false,
    isFetching: false,
    ...result,
  } as SafeQuery)

describe('useGuardedSafe', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('without a target', () => {
    it('returns the open Safe and requests no other', () => {
      const safe = mockOpenSafe()
      const query = mockTargetQuery()
      const { result } = renderHook(() => useGuardedSafe())
      expect(result.current).toEqual({
        safe,
        safeAddress: safe.address.value,
        safeLoaded: true,
        safeLoading: false,
        error: undefined,
        refetch: expect.any(Function),
      })
      expect(query).toHaveBeenCalledWith(skipToken, expect.anything())
    })

    it('returns no error while the open Safe loads', () => {
      mockOpenSafe({ safeLoaded: false, safeLoading: true, safeError: 'Failed to load Safe' })
      mockTargetQuery()
      const { result } = renderHook(() => useGuardedSafe())
      expect(result.current.error).toBeUndefined()
    })

    it('returns the same error on every render when the open Safe fails to load', () => {
      mockOpenSafe({ safeLoaded: false, safeLoading: false, safeError: 'Failed to load Safe' })
      mockTargetQuery()
      const { result, rerender } = renderHook(() => useGuardedSafe())
      const firstError = result.current.error
      rerender()
      expect(firstError?.message).toBe('Failed to load Safe')
      expect(result.current.error).toBe(firstError)
    })
  })

  describe('with a target', () => {
    it('returns the target Safe, not the open one', () => {
      mockOpenSafe()
      const target = buildSafe({ chainId: TARGET.chainId, txHistoryTag: '3' })
      mockTargetQuery({ currentData: target })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current).toEqual({
        safe: target,
        safeAddress: TARGET.safeAddress,
        safeLoaded: true,
        safeLoading: false,
        error: undefined,
        refetch: expect.any(Function),
      })
    })

    it('polls the target only while the tab is focused', () => {
      mockOpenSafe()
      const query = mockTargetQuery({ currentData: buildSafe() })
      renderHook(() => useGuardedSafe(TARGET))
      expect(query).toHaveBeenCalledWith(TARGET, { pollingInterval: POLLING_INTERVAL, skipPollingIfUnfocused: true })
    })

    it("is loading on the target's chain while the target loads", () => {
      mockOpenSafe()
      mockTargetQuery({ isLoading: true, isFetching: true })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current).toEqual({
        safe: { chainId: TARGET.chainId, version: null, guard: null, txHistoryTag: null },
        safeAddress: TARGET.safeAddress,
        safeLoaded: false,
        safeLoading: true,
        error: undefined,
        refetch: expect.any(Function),
      })
    })

    it('is loading while a newly picked target loads after another one had loaded', () => {
      mockOpenSafe()
      mockTargetQuery({ data: buildSafe(), currentData: undefined, isLoading: false, isFetching: true })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current).toMatchObject({ safeLoaded: false, safeLoading: true, error: undefined })
    })

    it('is not loading while a loaded target is polled', () => {
      mockOpenSafe()
      const target = buildSafe()
      mockTargetQuery({ data: target, currentData: target, isLoading: false, isFetching: true })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current).toMatchObject({ safeLoaded: true, safeLoading: false })
    })

    it('is not loading while a target CGW does not know is polled after another one had loaded', () => {
      mockOpenSafe()
      mockTargetQuery({
        data: buildSafe(),
        currentData: undefined,
        isFetching: true,
        error: { status: 404, data: 'Not found' },
      })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current.safeLoading).toBe(false)
    })

    it('ignores an error of the open Safe', () => {
      mockOpenSafe({ safeLoaded: false, safeLoading: false, safeError: 'Failed to load Safe' })
      mockTargetQuery({ currentData: buildSafe() })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current.error).toBeUndefined()
    })

    it('treats a target CGW does not know as not loaded, without an error', () => {
      mockOpenSafe()
      mockTargetQuery({ isError: true, error: { status: 404, data: 'Not found' } })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current).toMatchObject({ safeLoaded: false, safeLoading: false, error: undefined })
    })

    it('returns the same error, keeping the original, when the target fails to load', () => {
      mockOpenSafe()
      const rtkError = { status: 500, data: 'Server error' }
      mockTargetQuery({ isError: true, error: rtkError })
      const { result, rerender } = renderHook(() => useGuardedSafe(TARGET))
      const firstError = result.current.error
      rerender()
      expect(firstError).toBeInstanceOf(Error)
      expect(firstError?.cause).toBe(rtkError)
      expect(result.current.error).toBe(firstError)
    })

    it('keeps the error, without loading, while a failed target is polled again', () => {
      mockOpenSafe()
      const rtkError = { status: 500, data: 'Server error' }
      mockTargetQuery({ isFetching: true, error: rtkError })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current.safeLoading).toBe(false)
      expect(result.current.error?.cause).toBe(rtkError)
    })

    it('is not loading while a target CGW does not know is polled again', () => {
      mockOpenSafe()
      mockTargetQuery({ isFetching: true, error: { status: 404, data: 'Not found' } })
      const { result } = renderHook(() => useGuardedSafe(TARGET))
      expect(result.current).toMatchObject({ safeLoaded: false, safeLoading: false, error: undefined })
    })
  })
})
