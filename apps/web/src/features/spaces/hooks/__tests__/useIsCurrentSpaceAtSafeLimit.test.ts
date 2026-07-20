import { renderHook } from '@testing-library/react'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useCurrentSpaceSafeCount,
  useIsCurrentSpaceAtSafeLimit,
  useSpaceSafeCount,
} from '../useIsCurrentSpaceAtSafeLimit'

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('../billing/useSpaceSafeLimit', () => ({
  useSpaceSafeLimit: jest.fn(),
}))
jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))
jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(),
}))

import { useCurrentSpaceId } from '../useCurrentSpaceId'
import { useSpaceSafeLimit } from '../billing/useSpaceSafeLimit'
import { useAppSelector } from '@/store'

const mockLimit = (limit: number, isLoading = false) =>
  (useSpaceSafeLimit as jest.Mock).mockReturnValue({ limit, isLoading })

const SPACE_A = '11111111-1111-1111-1111-111111111111'
const SPACE_B = '22222222-2222-2222-2222-222222222222'

const mockSpaces = (spaces: Array<{ uuid: string; safeCount: number }>) => {
  jest.spyOn(spacesQueries, 'useSpacesGetV1Query').mockReturnValue({
    data: spaces,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof spacesQueries.useSpacesGetV1Query>)
}

describe('useIsCurrentSpaceAtSafeLimit hooks', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(useAppSelector as jest.Mock).mockReturnValue(true)
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue(SPACE_A)
    mockLimit(40)
  })

  describe('useSpaceSafeCount', () => {
    it('resolves the count by the passed space id, ignoring the current space', () => {
      mockSpaces([
        { uuid: SPACE_A, safeCount: 12 },
        { uuid: SPACE_B, safeCount: 40 },
      ])
      const { result } = renderHook(() => useSpaceSafeCount(SPACE_B))
      expect(result.current).toBe(40)
    })

    it('returns undefined when passed null', () => {
      mockSpaces([{ uuid: SPACE_A, safeCount: 12 }])
      const { result } = renderHook(() => useSpaceSafeCount(null))
      expect(result.current).toBeUndefined()
    })
  })

  describe('useCurrentSpaceSafeCount', () => {
    it('returns the current space safe count', () => {
      mockSpaces([
        { uuid: SPACE_A, safeCount: 12 },
        { uuid: SPACE_B, safeCount: 40 },
      ])
      const { result } = renderHook(() => useCurrentSpaceSafeCount())
      expect(result.current).toBe(12)
    })

    it('returns undefined when there is no current space id', () => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(null)
      mockSpaces([{ uuid: SPACE_A, safeCount: 12 }])
      const { result } = renderHook(() => useCurrentSpaceSafeCount())
      expect(result.current).toBeUndefined()
    })

    it('returns undefined when the current space is not in the list', () => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(SPACE_B)
      mockSpaces([{ uuid: SPACE_A, safeCount: 12 }])
      const { result } = renderHook(() => useCurrentSpaceSafeCount())
      expect(result.current).toBeUndefined()
    })
  })

  describe('useIsCurrentSpaceAtSafeLimit', () => {
    it('is at the limit when the space holds the maximum number of safes', () => {
      mockSpaces([{ uuid: SPACE_A, safeCount: 40 }])
      const { result } = renderHook(() => useIsCurrentSpaceAtSafeLimit())
      expect(result.current).toBe(true)
    })

    it('is not at the limit when the space is below the maximum', () => {
      mockSpaces([{ uuid: SPACE_A, safeCount: 39 }])
      const { result } = renderHook(() => useIsCurrentSpaceAtSafeLimit())
      expect(result.current).toBe(false)
    })

    it('is not at the limit when the count is unknown', () => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(null)
      mockSpaces([{ uuid: SPACE_A, safeCount: 40 }])
      const { result } = renderHook(() => useIsCurrentSpaceAtSafeLimit())
      expect(result.current).toBe(false)
    })

    it('uses the dynamic plan limit (free tier = 1)', () => {
      mockLimit(1)
      mockSpaces([{ uuid: SPACE_A, safeCount: 1 }])
      const { result } = renderHook(() => useIsCurrentSpaceAtSafeLimit())
      expect(result.current).toBe(true)
    })

    it('does not block while the limit is still loading', () => {
      mockLimit(1, true)
      mockSpaces([{ uuid: SPACE_A, safeCount: 40 }])
      const { result } = renderHook(() => useIsCurrentSpaceAtSafeLimit())
      expect(result.current).toBe(false)
    })
  })
})
