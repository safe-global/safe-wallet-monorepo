import { act, renderHook } from '@testing-library/react'
import { useSidebarDeveloperGroup } from '../useSidebarDeveloperGroup'

const mockUseAppSelector = jest.fn()

jest.mock('@/store', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}))

jest.mock('../../config', () => {
  const Icon = () => null
  return {
    sidebarDeveloperGroup: {
      label: 'Developer',
      items: [{ icon: Icon, label: 'Feature flags', id: 'feature-flags' }],
    },
    FEATURE_FLAGS_ITEM_ID: 'feature-flags',
  }
})

const getFeatureFlagsItem = (group: ReturnType<typeof useSidebarDeveloperGroup>['developerGroup']) =>
  group?.items.find((item) => item.id === 'feature-flags')

describe('useSidebarDeveloperGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppSelector.mockReturnValue(0)
  })

  it('resolves the Developer group outside production', () => {
    const { result } = renderHook(() => useSidebarDeveloperGroup())

    expect(result.current.developerGroup?.label).toBe('Developer')
    expect(getFeatureFlagsItem(result.current.developerGroup)).toMatchObject({
      label: 'Feature flags',
      isActive: false,
      disabled: false,
      testId: 'sidebar-feature-flags-item',
    })
  })

  it('returns no group in production', () => {
    const originalIsProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'

    try {
      const { result } = renderHook(() => useSidebarDeveloperGroup())

      expect(result.current.developerGroup).toBeUndefined()
    } finally {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = originalIsProduction
    }
  })

  it('badges the Feature flags entry with the override count', () => {
    mockUseAppSelector.mockReturnValue(4)

    const { result } = renderHook(() => useSidebarDeveloperGroup())

    expect(getFeatureFlagsItem(result.current.developerGroup)?.badge).toBe(4)
  })

  it('leaves the badge unset when nothing is overridden', () => {
    mockUseAppSelector.mockReturnValue(0)

    const { result } = renderHook(() => useSidebarDeveloperGroup())

    expect(getFeatureFlagsItem(result.current.developerGroup)?.badge).toBeUndefined()
  })

  it('opens the editor when the entry is selected', () => {
    const { result } = renderHook(() => useSidebarDeveloperGroup())

    expect(result.current.isEditorOpen).toBe(false)

    act(() => {
      getFeatureFlagsItem(result.current.developerGroup)?.onSelect()
    })

    expect(result.current.isEditorOpen).toBe(true)
  })

  it('closes the editor through setEditorOpen', () => {
    const { result } = renderHook(() => useSidebarDeveloperGroup())

    act(() => {
      getFeatureFlagsItem(result.current.developerGroup)?.onSelect()
    })
    act(() => {
      result.current.setEditorOpen(false)
    })

    expect(result.current.isEditorOpen).toBe(false)
  })

  it('keeps onSelect stable across re-renders so the group is not rebuilt needlessly', () => {
    const { result, rerender } = renderHook(() => useSidebarDeveloperGroup())

    const firstGroup = result.current.developerGroup
    rerender()

    expect(result.current.developerGroup).toBe(firstGroup)
  })
})
