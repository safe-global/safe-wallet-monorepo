import { toBeHex } from 'ethers'
import useManuallyHiddenSafes from '@/hooks/useManuallyHiddenSafes'
import { renderHook } from '@/tests/test-utils'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { TOKEN_LISTS, initialState as settingsInitialState } from '@/store/settingsSlice'

describe('useManuallyHiddenSafes hook', () => {
  const parentSafe = toBeHex('0x1', 20)
  const nestedSafe1 = toBeHex('0x10', 20)
  const nestedSafe2 = toBeHex('0x20', 20)

  const defaultSettings = {
    ...settingsInitialState,
    tokenList: TOKEN_LISTS.TRUSTED,
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

  it('should return manually hidden safes for current parent safe', () => {
    const { result } = renderHook(() => useManuallyHiddenSafes(), {
      initialReduxState: {
        settings: {
          ...defaultSettings,
          manuallyHiddenSafes: {
            [parentSafe]: [nestedSafe1, nestedSafe2],
          },
        },
      },
    })

    expect(result.current).toEqual([nestedSafe1, nestedSafe2])
  })

  it('should return empty array when no manually hidden safes exist', () => {
    const { result } = renderHook(() => useManuallyHiddenSafes(), {
      initialReduxState: {
        settings: {
          ...defaultSettings,
          manuallyHiddenSafes: {},
        },
      },
    })

    expect(result.current).toEqual([])
  })

  it('should return empty array when manuallyHiddenSafes is undefined', () => {
    const { result } = renderHook(() => useManuallyHiddenSafes(), {
      initialReduxState: {
        settings: defaultSettings,
      },
    })

    expect(result.current).toEqual([])
  })

  it('should return correct hidden safes for different parent safes', () => {
    const anotherParentSafe = toBeHex('0x2', 20)
    const anotherNestedSafe = toBeHex('0x30', 20)

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress: anotherParentSafe,
      safe: {} as ReturnType<typeof useSafeInfo.default>['safe'],
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result } = renderHook(() => useManuallyHiddenSafes(), {
      initialReduxState: {
        settings: {
          ...defaultSettings,
          manuallyHiddenSafes: {
            [parentSafe]: [nestedSafe1, nestedSafe2],
            [anotherParentSafe]: [anotherNestedSafe],
          },
        },
      },
    })

    expect(result.current).toEqual([anotherNestedSafe])
  })
})
