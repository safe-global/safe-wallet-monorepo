import { configureStore } from '@reduxjs/toolkit'
import safesSettingsReducer, {
  dismissReadOnlyWarning,
  updateGlobalSettings,
  resetGlobalSettings,
  updateChainSettings,
  resetChainSettings,
  resetAllSafeSettings,
  selectGlobalSafeSettings,
  selectReadOnlyWarningDismissed,
  selectChainSettings,
  selectAllSafeSettings,
  SafesSettingsState,
} from './safesSettingsSlice'
import { RootState } from '.'

describe('safesSettingsSlice', () => {
  const mockSafeAddress = '0x123'
  const mockChainId = '1'

  const createMockStore = (initialState: SafesSettingsState = {}) => {
    return configureStore({
      reducer: {
        safesSettings: safesSettingsReducer,
      },
      preloadedState: {
        safesSettings: initialState,
      },
    })
  }

  describe('Global Settings Actions', () => {
    describe('dismissReadOnlyWarning', () => {
      it('should set readOnlyWarningDismissed to true in global settings', () => {
        const store = createMockStore()

        store.dispatch(dismissReadOnlyWarning({ safeAddress: mockSafeAddress }))

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].global?.readOnlyWarningDismissed).toBe(true)
      })

      it('should create nested structure if it does not exist', () => {
        const store = createMockStore()

        store.dispatch(dismissReadOnlyWarning({ safeAddress: mockSafeAddress }))

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress]).toBeDefined()
        expect(state.safesSettings[mockSafeAddress].global).toBeDefined()
        expect(state.safesSettings[mockSafeAddress].global?.readOnlyWarningDismissed).toBe(true)
      })

      it('should handle multiple safes', () => {
        const store = createMockStore()
        const safeAddress2 = '0x456'

        store.dispatch(dismissReadOnlyWarning({ safeAddress: mockSafeAddress }))
        store.dispatch(dismissReadOnlyWarning({ safeAddress: safeAddress2 }))

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].global?.readOnlyWarningDismissed).toBe(true)
        expect(state.safesSettings[safeAddress2].global?.readOnlyWarningDismissed).toBe(true)
      })
    })

    describe('updateGlobalSettings', () => {
      it('should update global settings for a safe', () => {
        const store = createMockStore()

        store.dispatch(
          updateGlobalSettings({
            safeAddress: mockSafeAddress,
            settings: { readOnlyWarningDismissed: true },
          }),
        )

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].global?.readOnlyWarningDismissed).toBe(true)
      })

      it('should merge settings without overwriting existing ones', () => {
        const store = createMockStore({
          [mockSafeAddress]: {
            global: {
              readOnlyWarningDismissed: true,
            },
          },
        })

        store.dispatch(
          updateGlobalSettings({
            safeAddress: mockSafeAddress,
            settings: {},
          }),
        )

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].global?.readOnlyWarningDismissed).toBe(true)
      })
    })

    describe('resetGlobalSettings', () => {
      it('should reset global settings for a safe', () => {
        const store = createMockStore({
          [mockSafeAddress]: {
            global: {
              readOnlyWarningDismissed: true,
            },
          },
        })

        store.dispatch(resetGlobalSettings({ safeAddress: mockSafeAddress }))

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].global).toEqual({})
      })

      it('should not throw if safe does not exist', () => {
        const store = createMockStore()

        expect(() => {
          store.dispatch(resetGlobalSettings({ safeAddress: mockSafeAddress }))
        }).not.toThrow()
      })
    })
  })

  describe('Per-Chain Settings Actions', () => {
    describe('updateChainSettings', () => {
      it('should update chain settings for a safe', () => {
        const store = createMockStore()

        store.dispatch(
          updateChainSettings({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            settings: {},
          }),
        )

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].chains?.[mockChainId]).toBeDefined()
      })

      it('should create nested structure if it does not exist', () => {
        const store = createMockStore()

        store.dispatch(
          updateChainSettings({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            settings: {},
          }),
        )

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress]).toBeDefined()
        expect(state.safesSettings[mockSafeAddress].chains).toBeDefined()
        expect(state.safesSettings[mockSafeAddress].chains?.[mockChainId]).toBeDefined()
      })

      it('should handle multiple chains for the same safe', () => {
        const store = createMockStore()
        const chainId2 = '137'

        store.dispatch(
          updateChainSettings({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            settings: {},
          }),
        )

        store.dispatch(
          updateChainSettings({
            safeAddress: mockSafeAddress,
            chainId: chainId2,
            settings: {},
          }),
        )

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].chains?.[mockChainId]).toBeDefined()
        expect(state.safesSettings[mockSafeAddress].chains?.[chainId2]).toBeDefined()
      })
    })

    describe('resetChainSettings', () => {
      it('should reset chain settings for a safe', () => {
        const store = createMockStore({
          [mockSafeAddress]: {
            chains: {
              [mockChainId]: {},
            },
          },
        })

        store.dispatch(resetChainSettings({ safeAddress: mockSafeAddress, chainId: mockChainId }))

        const state = store.getState()
        expect(state.safesSettings[mockSafeAddress].chains?.[mockChainId]).toEqual({})
      })

      it('should not throw if chain settings do not exist', () => {
        const store = createMockStore()

        expect(() => {
          store.dispatch(resetChainSettings({ safeAddress: mockSafeAddress, chainId: mockChainId }))
        }).not.toThrow()
      })
    })
  })

  describe('resetAllSafeSettings', () => {
    it('should reset all settings for a safe', () => {
      const store = createMockStore({
        [mockSafeAddress]: {
          global: {
            readOnlyWarningDismissed: true,
          },
          chains: {
            [mockChainId]: {},
          },
        },
      })

      store.dispatch(resetAllSafeSettings({ safeAddress: mockSafeAddress }))

      const state = store.getState()
      expect(state.safesSettings[mockSafeAddress]).toEqual({})
    })

    it('should not throw if safe does not exist', () => {
      const store = createMockStore()

      expect(() => {
        store.dispatch(resetAllSafeSettings({ safeAddress: mockSafeAddress }))
      }).not.toThrow()
    })
  })

  describe('Selectors', () => {
    describe('selectGlobalSafeSettings', () => {
      it('should return global settings for a safe', () => {
        const mockSettings = { readOnlyWarningDismissed: true }
        const state = {
          safesSettings: {
            [mockSafeAddress]: {
              global: mockSettings,
            },
          },
        } as unknown as RootState

        const result = selectGlobalSafeSettings(state, mockSafeAddress)
        expect(result).toEqual(mockSettings)
      })

      it('should return undefined if safe does not exist', () => {
        const state = {
          safesSettings: {},
        } as unknown as RootState

        const result = selectGlobalSafeSettings(state, mockSafeAddress)
        expect(result).toBeUndefined()
      })

      it('should return undefined if safeAddress is not provided', () => {
        const state = {
          safesSettings: {},
        } as unknown as RootState

        expect(selectGlobalSafeSettings(state, undefined)).toBeUndefined()
      })
    })

    describe('selectReadOnlyWarningDismissed', () => {
      it('should return true if warning was dismissed', () => {
        const state = {
          safesSettings: {
            [mockSafeAddress]: {
              global: {
                readOnlyWarningDismissed: true,
              },
            },
          },
        } as unknown as RootState

        const result = selectReadOnlyWarningDismissed(state, mockSafeAddress)
        expect(result).toBe(true)
      })

      it('should return false if warning was not dismissed', () => {
        const state = {
          safesSettings: {
            [mockSafeAddress]: {
              global: {
                readOnlyWarningDismissed: false,
              },
            },
          },
        } as unknown as RootState

        const result = selectReadOnlyWarningDismissed(state, mockSafeAddress)
        expect(result).toBe(false)
      })

      it('should return false if safe does not exist', () => {
        const state = {
          safesSettings: {},
        } as unknown as RootState

        const result = selectReadOnlyWarningDismissed(state, mockSafeAddress)
        expect(result).toBe(false)
      })

      it('should return false if safeAddress is not provided', () => {
        const state = {
          safesSettings: {},
        } as unknown as RootState

        expect(selectReadOnlyWarningDismissed(state, undefined)).toBe(false)
      })
    })

    describe('selectChainSettings', () => {
      it('should return chain settings for a safe', () => {
        const mockSettings = {}
        const state = {
          safesSettings: {
            [mockSafeAddress]: {
              chains: {
                [mockChainId]: mockSettings,
              },
            },
          },
        } as unknown as RootState

        const result = selectChainSettings(state, mockSafeAddress, mockChainId)
        expect(result).toEqual(mockSettings)
      })

      it('should return undefined if chain settings do not exist', () => {
        const state = {
          safesSettings: {
            [mockSafeAddress]: {},
          },
        } as unknown as RootState

        const result = selectChainSettings(state, mockSafeAddress, mockChainId)
        expect(result).toBeUndefined()
      })

      it('should return undefined if parameters are missing', () => {
        const state = {
          safesSettings: {},
        } as unknown as RootState

        expect(selectChainSettings(state, undefined, mockChainId)).toBeUndefined()
        expect(selectChainSettings(state, mockSafeAddress, undefined)).toBeUndefined()
      })
    })

    describe('selectAllSafeSettings', () => {
      it('should return all settings for a safe', () => {
        const mockData = {
          global: {
            readOnlyWarningDismissed: true,
          },
          chains: {
            [mockChainId]: {},
          },
        }
        const state = {
          safesSettings: {
            [mockSafeAddress]: mockData,
          },
        } as unknown as RootState

        const result = selectAllSafeSettings(state, mockSafeAddress)
        expect(result).toEqual(mockData)
      })

      it('should return undefined if safe does not exist', () => {
        const state = {
          safesSettings: {},
        } as unknown as RootState

        const result = selectAllSafeSettings(state, mockSafeAddress)
        expect(result).toBeUndefined()
      })
    })
  })
})
