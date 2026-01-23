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
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'

describe('useManageNestedSafes hook', () => {
  const parentSafe = toBeHex('0x1', 20)
  const nestedSafe1 = toBeHex('0x10', 20)
  const nestedSafe2 = toBeHex('0x20', 20)
  const nestedSafe3 = toBeHex('0x30', 20)

  // Helper to create NestedSafeWithStatus array
  const createSafesWithStatus = (
    addresses: string[],
    options: { invalidAddresses?: string[] } = {},
  ): NestedSafeWithStatus[] => {
    return addresses.map((address) => ({
      address,
      isValid: !options.invalidAddresses?.includes(address),
      isAutoHidden: options.invalidAddresses?.includes(address) ?? false,
      isManuallyHidden: false,
      isUserUnhidden: false,
    }))
  }

  const allSafesWithStatus = createSafesWithStatus([nestedSafe1, nestedSafe2, nestedSafe3])

  const defaultSettings = {
    ...settingsInitialState,
    tokenList: TOKEN_LISTS.TRUSTED,
    manuallyHiddenSafes: {},
    overriddenAutoHideSafes: {},
  }

  const renderHookWithStore = (safesWithStatus: NestedSafeWithStatus[], initialReduxState?: Partial<RootState>) => {
    const store = makeStore(initialReduxState, { skipBroadcast: true })
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
    const result = rtlRenderHook(() => useManageNestedSafes(safesWithStatus), { wrapper })
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

  describe('toggleSafe for valid safes (manual hide)', () => {
    it('should mark a visible safe for hiding when toggled', () => {
      const { result } = renderHook(() => useManageNestedSafes(allSafesWithStatus), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)
    })

    it('should unmark a safe for hiding when toggled twice', () => {
      const { result } = renderHook(() => useManageNestedSafes(allSafesWithStatus), {
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
      const safesWithManuallyHidden = allSafesWithStatus.map((s) =>
        s.address === nestedSafe1 ? { ...s, isManuallyHidden: true } : s,
      )

      const { result } = renderHook(() => useManageNestedSafes(safesWithManuallyHidden), {
        initialReduxState: {
          settings: {
            ...defaultSettings,
            manuallyHiddenSafes: { [parentSafe]: [nestedSafe1] },
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

  describe('toggleSafe for invalid safes (user unhide)', () => {
    it('should mark an auto-hidden (invalid) safe for user-unhiding when toggled', () => {
      const safesWithInvalid = createSafesWithStatus([nestedSafe1, nestedSafe2, nestedSafe3], {
        invalidAddresses: [nestedSafe1],
      })

      const { result } = renderHook(() => useManageNestedSafes(safesWithInvalid), {
        initialReduxState: { settings: defaultSettings },
      })

      // Invalid safe should be selected (auto-hidden) by default
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      // After toggle, should be unselected (user wants to unhide)
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)
    })

    it('should re-auto-hide a user-unhidden safe when toggled again', () => {
      const safesWithUserUnhidden = [
        { address: nestedSafe1, isValid: false, isAutoHidden: false, isManuallyHidden: false, isUserUnhidden: true },
        ...createSafesWithStatus([nestedSafe2, nestedSafe3]),
      ]

      const { result } = renderHook(() => useManageNestedSafes(safesWithUserUnhidden), {
        initialReduxState: {
          settings: {
            ...defaultSettings,
            overriddenAutoHideSafes: { [parentSafe]: [nestedSafe1] },
          },
        },
      })

      // User-unhidden safe should be unselected
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      // After toggle, should be selected (re-auto-hide)
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)
    })
  })

  describe('isSafeSelected', () => {
    it('should return false for visible valid safes by default', () => {
      const { result } = renderHook(() => useManageNestedSafes(allSafesWithStatus), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(false)
      expect(result.current.isSafeSelected(nestedSafe2)).toBe(false)
    })

    it('should return true for already manually hidden safes', () => {
      const safesWithManuallyHidden = allSafesWithStatus.map((s) =>
        [nestedSafe1, nestedSafe2].includes(s.address) ? { ...s, isManuallyHidden: true } : s,
      )

      const { result } = renderHook(() => useManageNestedSafes(safesWithManuallyHidden), {
        initialReduxState: {
          settings: {
            ...defaultSettings,
            manuallyHiddenSafes: { [parentSafe]: [nestedSafe1, nestedSafe2] },
          },
        },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)
      expect(result.current.isSafeSelected(nestedSafe2)).toBe(true)
      expect(result.current.isSafeSelected(nestedSafe3)).toBe(false)
    })

    it('should return true for auto-hidden (invalid) safes', () => {
      const safesWithInvalid = createSafesWithStatus([nestedSafe1, nestedSafe2, nestedSafe3], {
        invalidAddresses: [nestedSafe1],
      })

      const { result } = renderHook(() => useManageNestedSafes(safesWithInvalid), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true) // auto-hidden
      expect(result.current.isSafeSelected(nestedSafe2)).toBe(false)
    })
  })

  describe('selectedCount', () => {
    it('should return 0 when no safes are selected', () => {
      const { result } = renderHook(() => useManageNestedSafes(allSafesWithStatus), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.selectedCount).toBe(0)
    })

    it('should return correct count when safes are marked for hiding', () => {
      const { result } = renderHook(() => useManageNestedSafes(allSafesWithStatus), {
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

    it('should include auto-hidden safes in count', () => {
      const safesWithInvalid = createSafesWithStatus([nestedSafe1, nestedSafe2, nestedSafe3], {
        invalidAddresses: [nestedSafe1],
      })

      const { result } = renderHook(() => useManageNestedSafes(safesWithInvalid), {
        initialReduxState: { settings: defaultSettings },
      })

      // nestedSafe1 is auto-hidden
      expect(result.current.selectedCount).toBe(1)

      act(() => {
        result.current.toggleSafe(nestedSafe2)
      })

      expect(result.current.selectedCount).toBe(2)
    })

    it('should decrease count when auto-hidden safe is toggled for user-unhiding', () => {
      const safesWithInvalid = createSafesWithStatus([nestedSafe1, nestedSafe2, nestedSafe3], {
        invalidAddresses: [nestedSafe1, nestedSafe2],
      })

      const { result } = renderHook(() => useManageNestedSafes(safesWithInvalid), {
        initialReduxState: { settings: defaultSettings },
      })

      expect(result.current.selectedCount).toBe(2) // both auto-hidden

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      expect(result.current.selectedCount).toBe(1)
    })
  })

  describe('cancel', () => {
    it('should reset all pending changes', () => {
      const { result } = renderHook(() => useManageNestedSafes(allSafesWithStatus), {
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
      const { result, store } = renderHookWithStore(allSafesWithStatus, { settings: defaultSettings })

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
      expect(state.settings.manuallyHiddenSafes[parentSafe]).toEqual([nestedSafe1, nestedSafe2])
    })

    it('should preserve existing hidden safes when adding new ones', () => {
      const safesWithManuallyHidden = allSafesWithStatus.map((s) =>
        s.address === nestedSafe1 ? { ...s, isManuallyHidden: true } : s,
      )

      const { result, store } = renderHookWithStore(safesWithManuallyHidden, {
        settings: {
          ...defaultSettings,
          manuallyHiddenSafes: { [parentSafe]: [nestedSafe1] },
        },
      })

      act(() => {
        result.current.toggleSafe(nestedSafe2)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.manuallyHiddenSafes[parentSafe]).toContain(nestedSafe1)
      expect(state.settings.manuallyHiddenSafes[parentSafe]).toContain(nestedSafe2)
    })

    it('should unhide safes that were toggled off', () => {
      const safesWithManuallyHidden = allSafesWithStatus.map((s) =>
        [nestedSafe1, nestedSafe2].includes(s.address) ? { ...s, isManuallyHidden: true } : s,
      )

      const { result, store } = renderHookWithStore(safesWithManuallyHidden, {
        settings: {
          ...defaultSettings,
          manuallyHiddenSafes: { [parentSafe]: [nestedSafe1, nestedSafe2] },
        },
      })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.manuallyHiddenSafes[parentSafe]).not.toContain(nestedSafe1)
      expect(state.settings.manuallyHiddenSafes[parentSafe]).toContain(nestedSafe2)
    })

    it('should persist user-unhidden safes to Redux', () => {
      const safesWithInvalid = createSafesWithStatus([nestedSafe1, nestedSafe2, nestedSafe3], {
        invalidAddresses: [nestedSafe1],
      })

      const { result, store } = renderHookWithStore(safesWithInvalid, { settings: defaultSettings })

      // Toggle to unhide the auto-hidden safe
      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.overriddenAutoHideSafes[parentSafe]).toEqual([nestedSafe1])
    })

    it('should reset local state after saving', () => {
      const { result, store } = renderHookWithStore(allSafesWithStatus, { settings: defaultSettings })

      act(() => {
        result.current.toggleSafe(nestedSafe1)
      })

      act(() => {
        result.current.saveChanges()
      })

      const state = store.getState()
      expect(state.settings.manuallyHiddenSafes[parentSafe]).toEqual([nestedSafe1])
      expect(result.current.isSafeSelected(nestedSafe1)).toBe(true)
    })
  })
})
