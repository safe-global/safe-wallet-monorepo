import { renderHook } from '@testing-library/react'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceSafeCount, useIsCurrentSpaceAtSafeLimit } from '../useIsCurrentSpaceAtSafeLimit'

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))
jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(),
}))

import { useCurrentSpaceId } from '../useCurrentSpaceId'
import { useAppSelector } from '@/store'

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
  })
})
