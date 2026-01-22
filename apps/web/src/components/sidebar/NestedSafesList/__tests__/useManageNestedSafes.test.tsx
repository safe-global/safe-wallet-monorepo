import { act } from '@testing-library/react'
import { toBeHex } from 'ethers'
import { renderHook } from '@/tests/test-utils'
import { useManageNestedSafes } from '../useManageNestedSafes'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { makeStore } from '@/store'
import { Provider } from 'react-redux'
import { renderHook as rtlRenderHook } from '@testing-library/react'
import type { RootState } from '@/store'
import { TOKEN_LISTS, initialState as settingsInitialState } from '@/store/settingsSlice'

describe('useManageNestedSafes hook', () => {
  const parentSafe = toBeHex('0x1', 20)
  const nestedSafe1 = toBeHex('0x10', 20)
  const nestedSafe2 = toBeHex('0x20', 20)
  const nestedSafe3 = toBeHex('0x30', 20)
  const allNestedSafes = [nestedSafe1, nestedSafe2, nestedSafe3]

  const defaultSettings = {
    ...settingsInitialState,
    tokenList: TOKEN_LISTS.TRUSTED,
    hiddenNestedSafes: {},
  }

  const renderHookWithStore = (initialReduxState?: Partial<RootState>) => {
    const store = makeStore(initialReduxState, { skipBroadcast: true })
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
    const result = rtlRenderHook(() => useManageNestedSafes(allNestedSafes), { wrapper })
    return { ...result, store }
  }

  beforeEach(() => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress: parentSafe,
      safe: {} as ReturnType<typeof useSafeInfo.default>['safe'],
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('toggleSafe', () => {
    it('should mark a visible safe for hiding when toggled', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)
    })

    it('should unmark a safe for hiding when toggled twice', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: { settings: defaultSettings },
      })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)
    })

    it('should mark a hidden safe for unhiding when toggled', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: {
          settings: {
            ...defaultSettings,
            hiddenNestedSafes: { [parentSafe]: [nestedSafe1] },
          },
        },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)
    })
  })

  describe('isSafeSelected', () => {
    it('should return false for visible safes by default', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)
      expect(result.current.isSafeSelected(nestedSafe2)).toBe(false)
    })

    it('should return true for already hidden safes', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: {
          settings: {
            ...defaultSettings,
            hiddenNestedSafes: { [parentSafe]: [nestedSafe1, nestedSafe2] },
          },
        },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)
      expect(result.current.isSafeSelected(nestedSafe2)).toBe(true)
      expect(result.current.isSafeSelected(nestedSafe3)).toBe(false)
    })
  })

  describe('selectedCount', () => {
    it('should return 0 when no safes are selected', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.selectedCount).toBe(0)
    })

    it('should return correct count when safes are marked for hiding', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: { settings: defaultSettings },
      })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.toggleSafe(nestedSafe2)
      })

      expect(result.current.selectedCount).toBe(2)
    })

    it('should include already hidden safes in count', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: {
          settings: {
            ...defaultSettings,
            hiddenNestedSafes: { [parentSafe]: [nestedSafe1] },
          },
        },
      })

      expect(result.current.selectedCount).toBe(1)

      act(() => {
        result.current.toggleSafe(nestedSafe2)
      })

      expect(result.current.selectedCount).toBe(2)
    })

    it('should decrease count when hidden safe is toggled for unhiding', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: {
          settings: {
            ...defaultSettings,
            hiddenNestedSafes: { [parentSafe]: [nestedSafe1, nestedSafe2] },
          },
        },
      })

      expect(result.current.selectedCount).toBe(2)

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      expect(result.current.selectedCount).toBe(1)
    })
  })

  describe('cancel', () => {
    it('should reset all pending changes', () => {
      const { result } = renderHook(() => useManageNestedSafes(allNestedSafes), {
        initialReduxState: { settings: defaultSettings },
      })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.toggleSafe(nestedSafe2)
      })

      expect(result.current.selectedCount).toBe(2)

      act(() => {
        result.current.cancel()
      })

      expect(result.current.selectedCount).toBe(0)
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)
      expect(result.current.isSafeSelected(nestedSafe2)).toBe(false)
    })
  })

  describe('saveChanges', () => {
    it('should persist newly hidden safes to Redux', () => {
      const { result, store } = renderHookWithStore({ settings: defaultSettings })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.toggleSafe(nestedSafe2)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.hiddenNestedSafes[parentSafe]).toEqual([nestedSafe1, nestedSafe2])
    })

    it('should preserve existing hidden safes when adding new ones', () => {
      const { result, store } = renderHookWithStore({
        settings: {
          ...defaultSettings,
          hiddenNestedSafes: { [parentSafe]: [nestedSafe1] },
        },
      })

      act(() => {
        result.current.toggleSafe(nestedSafe2)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.hiddenNestedSafes[parentSafe]).toContain(nestedSafe1)
      expect(state.settings.hiddenNestedSafes[parentSafe]).toContain(nestedSafe2)
    })

    it('should unhide safes that were toggled off', () => {
      const { result, store } = renderHookWithStore({
        settings: {
          ...defaultSettings,
          hiddenNestedSafes: { [parentSafe]: [nestedSafe1, nestedSafe2] },
        },
      })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.hiddenNestedSafes[parentSafe]).not.toContain(nestedSafe1)
      expect(state.settings.hiddenNestedSafes[parentSafe]).toContain(nestedSafe2)
    })

    it('should reset local state after saving', () => {
      const { result, store } = renderHookWithStore({ settings: defaultSettings })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.hiddenNestedSafes[parentSafe]).toEqual([nestedSafe1])
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)
    })
  })
})
