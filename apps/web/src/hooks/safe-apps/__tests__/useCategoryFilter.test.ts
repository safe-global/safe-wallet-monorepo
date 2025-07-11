import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import * as nextRouter from 'next/router'
import useCategoryFilter from '@/hooks/safe-apps/useCategoryFilter'
import { renderHook } from '@/tests/test-utils'

describe('useCategoryFilter', () => {
  const mockSafeAppsList = [{ id: '1', name: 'CowSwap', tags: ['DeFi'] }] as unknown as SafeAppData[]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not set categories if there are none in the URL', () => {
    jest.spyOn(nextRouter, 'useRouter').mockImplementation(() => ({ isReady: true, query: {} } as any))

    const mockSetter = jest.fn()

    renderHook(() =>
      useCategoryFilter({ safeAppsList: mockSafeAppsList, selectedCategories: [], setSelectedCategories: mockSetter }),
    )

    expect(mockSetter).not.toHaveBeenCalled()
  })

  it('should not set categories if they are already set', () => {
    jest
      .spyOn(nextRouter, 'useRouter')
      .mockImplementation(() => ({ isReady: true, query: { categories: 'Aggregator' } } as any))

    const mockSetter = jest.fn()

    renderHook(() =>
      useCategoryFilter({
        safeAppsList: mockSafeAppsList,
        selectedCategories: ['DeFi'],
        setSelectedCategories: mockSetter,
      }),
    )

    expect(mockSetter).not.toHaveBeenCalled()
  })

  it('should not set categories that do not exist', () => {
    jest
      .spyOn(nextRouter, 'useRouter')
      .mockImplementation(() => ({ isReady: true, query: { categories: 'RandomCategory' } } as any))

    const mockSetter = jest.fn()

    renderHook(() =>
      useCategoryFilter({
        safeAppsList: mockSafeAppsList,
        selectedCategories: [],
        setSelectedCategories: mockSetter,
      }),
    )

    expect(mockSetter).not.toHaveBeenCalled()
  })

  it('should set categories from the URL', () => {
    jest
      .spyOn(nextRouter, 'useRouter')
      .mockImplementation(() => ({ isReady: true, query: { categories: 'DeFi' } } as any))

    const mockSetter = jest.fn()

    renderHook(() =>
      useCategoryFilter({ safeAppsList: mockSafeAppsList, selectedCategories: [], setSelectedCategories: mockSetter }),
    )

    expect(mockSetter).toHaveBeenCalledWith(['DeFi'])
  })
})
