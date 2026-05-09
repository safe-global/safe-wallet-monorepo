import { renderHook } from '@/tests/test-utils'
import { useRankedSafeApps } from '@/hooks/safe-apps/useRankedSafeApps'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

const getMockSafeApp = (props: Partial<SafeAppData>) => {
  return {
    tags: [],
    ...props,
  } as SafeAppData
}

describe('useRankedSafeApps', () => {
  it('returns an empty array if there are no safe apps', () => {
    const { result } = renderHook(() => useRankedSafeApps([], []))

    expect(result.current).toStrictEqual([])
  })

  it('returns 5 safe apps at most', () => {
    const mockSafeApp1 = getMockSafeApp({ id: 1, featured: true } as Partial<SafeAppData>)
    const mockSafeApp2 = getMockSafeApp({ id: 2 })
    const mockSafeApp3 = getMockSafeApp({ id: 3 })
    const mockSafeApp4 = getMockSafeApp({ id: 4 })
    const mockSafeApp5 = getMockSafeApp({ id: 5 })
    const mockSafeApp6 = getMockSafeApp({ id: 6 })

    const { result } = renderHook(() =>
      useRankedSafeApps([mockSafeApp1], [mockSafeApp2, mockSafeApp3, mockSafeApp4, mockSafeApp5, mockSafeApp6]),
    )

    expect(result.current.length).toEqual(5)
  })

  it('returns featured, then pinned apps', () => {
    const mockSafeApp1 = getMockSafeApp({ id: 1 })
    const mockSafeApp2 = getMockSafeApp({ id: 2, featured: true } as Partial<SafeAppData>)
    const mockSafeApp3 = getMockSafeApp({ id: 3, featured: true } as Partial<SafeAppData>)
    const mockSafeApp4 = getMockSafeApp({ id: 4 })
    const mockSafeApp5 = getMockSafeApp({ id: 5 })

    const mockPinnedApp1 = getMockSafeApp({ id: 6 })
    const mockPinnedApp2 = getMockSafeApp({ id: 7 })

    const { result } = renderHook(() =>
      useRankedSafeApps(
        [mockSafeApp1, mockSafeApp2, mockSafeApp3, mockSafeApp4, mockSafeApp5],
        [mockPinnedApp1, mockPinnedApp2],
      ),
    )

    expect(result.current[0]).toStrictEqual(mockSafeApp2)
    expect(result.current[1]).toStrictEqual(mockSafeApp3)
    expect(result.current[2]).toStrictEqual(mockPinnedApp1)
    expect(result.current[3]).toStrictEqual(mockPinnedApp2)
  })
})
