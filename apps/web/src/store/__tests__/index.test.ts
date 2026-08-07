import { _hydrationReducer } from '@/store'
import { OrderByOption, ORDER_BY_RESET_VERSION } from '@/store/orderByPreferenceSlice'

describe('store', () => {
  describe('hydrationReducer', () => {
    it('should return a merged state', () => {
      const persistedState = {
        str1: 'str1',
        obj1: {
          key1: true, // Persisted value
        },
        arr1: ['arr1', 'arr2'], // Persisted value
      }

      const initialState = {
        str1: 'str1',
        str2: 'str2', // New property
        obj1: {
          key1: 'key1',
          key2: 'key2', // New property
        },
        arr1: ['arr1'],
      }

      // @ts-expect-error demo state
      const mergedState = _hydrationReducer(initialState, {
        type: '@@HYDRATE',
        payload: persistedState,
      })

      expect(mergedState).toStrictEqual({
        str1: 'str1',
        str2: 'str2',
        obj1: {
          key1: true,
          key2: 'key2',
        },
        arr1: ['arr1', 'arr2'],
        auth: {
          isStoreHydrated: true,
          cfSafeSynced: false,
          isOidcLoginPending: false,
        },
      })
    })

    it('should not replace the intial state', () => {
      const persistedState = {
        str1: 'str1',
        obj1: {
          key1: true, // Persisted value
        },
        arr1: ['arr1', 'arr2', 'arr3'], // Persisted value
      }

      const initialState = {
        str1: 'str1',
        str2: 'str2', // New property
        obj1: {
          key1: 'key1',
          key2: 'key2', // New property
        },
        arr1: ['arr1'],
      }

      // @ts-expect-error demo state
      const mergedState = _hydrationReducer(initialState, {
        type: '@@HYDRATE',
        payload: persistedState,
      })

      expect(mergedState).not.toStrictEqual({
        str1: 'str1',
        obj1: {
          key1: true,
        },
        arr1: ['arr1', 'arr2', 'arr3'],
      })
    })

    it('should not wipe the initial state if no localStorage entry is present', () => {
      const initialState = {
        str1: 'str1',
        str2: 'str2',
        obj1: {
          key1: 'key1',
          key2: 'key2',
        },
        arr1: ['arr1'],
      }

      // @ts-expect-error demo state
      const mergedState = _hydrationReducer(initialState, {
        type: '@@HYDRATE',
        // No localStorage entry
        payload: undefined,
      })

      expect(mergedState).not.toBeUndefined()

      expect(mergedState).toStrictEqual({
        str1: 'str1',
        str2: 'str2',
        obj1: {
          key1: 'key1',
          key2: 'key2',
        },
        arr1: ['arr1'],
        auth: {
          isStoreHydrated: true,
          cfSafeSynced: false,
          isOidcLoginPending: false,
        },
      })
    })

    it('should return a new state, not mutating the initial or persisted state', () => {
      const persistedState = {
        str1: 'str1',
      }

      const initialState = {
        str1: 'str1',
        str2: 'str2',
      }

      // @ts-expect-error demo state
      const mergedState = _hydrationReducer(initialState, {
        type: '@@HYDRATE',
        payload: persistedState,
      })

      expect(mergedState).toStrictEqual({
        str1: 'str1',
        str2: 'str2',
        auth: {
          isStoreHydrated: true,
          cfSafeSynced: false,
          isOidcLoginPending: false,
        },
      })

      // @ts-expect-error demo state
      expect(mergedState === initialState).toBeFalsy()
      // @ts-expect-error demo state
      expect(mergedState === persistedState).toBeFalsy()
    })

    it('resets orderByPreference to the A→Z default once for users on the old default', () => {
      const persistedState = { orderByPreference: { orderBy: OrderByOption.LAST_VISITED } }
      const initialState = { orderByPreference: { orderBy: OrderByOption.NAME } }

      const mergedState = _hydrationReducer(initialState, {
        type: '@@HYDRATE',
        payload: persistedState,
      })

      expect(mergedState.orderByPreference).toEqual({
        orderBy: OrderByOption.NAME,
        resetVersion: ORDER_BY_RESET_VERSION,
        manualOrder: {},
      })
    })

    it('preserves the custom manual order when the one-time A→Z reset fires', () => {
      const persistedState = {
        orderByPreference: { orderBy: OrderByOption.LAST_VISITED, manualOrder: { trusted: ['0x1', '0x2'] } },
      }
      const initialState = { orderByPreference: { orderBy: OrderByOption.NAME } }

      const mergedState = _hydrationReducer(initialState, {
        type: '@@HYDRATE',
        payload: persistedState,
      })

      expect(mergedState.orderByPreference).toEqual({
        orderBy: OrderByOption.NAME,
        resetVersion: ORDER_BY_RESET_VERSION,
        manualOrder: { trusted: ['0x1', '0x2'] },
      })
    })

    it('keeps the saved order once the one-time reset has already been applied', () => {
      const persistedState = {
        orderByPreference: { orderBy: OrderByOption.LAST_VISITED, resetVersion: ORDER_BY_RESET_VERSION },
      }
      const initialState = { orderByPreference: { orderBy: OrderByOption.NAME } }

      const mergedState = _hydrationReducer(initialState, {
        type: '@@HYDRATE',
        payload: persistedState,
      })

      expect(mergedState.orderByPreference).toEqual({
        orderBy: OrderByOption.LAST_VISITED,
        resetVersion: ORDER_BY_RESET_VERSION,
      })
    })
  })
})
