import { toBeHex } from 'ethers'
import {
  setHiddenTokensForChain,
  setCuratedNestedSafes,
  clearCuratedNestedSafes,
  settingsSlice,
  isEnvInitialState,
  initialState,
  selectCuratedNestedSafes,
  selectHasCompletedCuration,
  selectCuratedAddresses,
} from '../settingsSlice'
import type { SettingsState } from '../settingsSlice'
import type { RootState } from '..'

const createCurationState = (
  curation: Record<string, { selectedAddresses: string[]; hasCompletedCuration: boolean; lastModified: number }>,
): RootState =>
  ({
    settings: {
      ...initialState,
      curatedNestedSafes: curation,
    },
  }) as unknown as RootState

describe('settingsSlice', () => {
  it('handle hiddenTokens', () => {
    const token1 = toBeHex('0x1', 20)
    const token2 = toBeHex('0x2', 20)
    const token3 = toBeHex('0x3', 20)

    let state = settingsSlice.reducer(undefined, setHiddenTokensForChain({ chainId: '1', assets: [token1] }))
    expect(state.hiddenTokens).toEqual({
      ['1']: [token1],
    })

    state = settingsSlice.reducer(state, setHiddenTokensForChain({ chainId: '1', assets: [token1, token2] }))
    expect(state.hiddenTokens).toEqual({
      ['1']: [token1, token2],
    })

    state = settingsSlice.reducer(state, setHiddenTokensForChain({ chainId: '5', assets: [token3] }))
    expect(state.hiddenTokens).toEqual({
      ['1']: [token1, token2],
      ['5']: [token3],
    })
  })

  describe('setRpc', () => {
    it('should set the RPC for the specified chain', () => {
      const state = settingsSlice.reducer(
        initialState,
        settingsSlice.actions.setRpc({ chainId: '1', rpc: 'https://example.com' }),
      )

      expect(state.env.rpc).toEqual({
        ['1']: 'https://example.com',
      })
    })

    it('should delete the RPC for the specified chain', () => {
      const initialState = {
        env: {
          rpc: {
            ['1']: 'https://example.com',
            ['5']: 'https://other-example.com',
          },
        },
      } as unknown as SettingsState

      const state = settingsSlice.reducer(initialState, settingsSlice.actions.setRpc({ chainId: '1', rpc: '' }))

      expect(state.env.rpc).toEqual({
        ['5']: 'https://other-example.com',
      })
    })
  })

  describe('setTenderly', () => {
    it('should set the Tenderly URL and access token', () => {
      const state = settingsSlice.reducer(
        undefined,
        settingsSlice.actions.setTenderly({ url: 'https://example.com', accessToken: 'test123' }),
      )

      expect(state.env.tenderly).toEqual({
        url: 'https://example.com',
        accessToken: 'test123',
      })
    })

    it('should delete the Tenderly URL and access token', () => {
      const initialState = {
        env: {
          tenderly: {
            url: '',
            accessToken: '',
          },
        },
      } as unknown as SettingsState

      const state = settingsSlice.reducer(initialState, settingsSlice.actions.setTenderly({ url: '', accessToken: '' }))

      expect(state.env.tenderly).toEqual({
        url: '',
        accessToken: '',
      })
    })
  })

  describe('isEnvInitialState', () => {
    it('should return true if the env is the initial state', () => {
      const state = {
        settings: {
          env: {
            rpc: {},
            tenderly: { url: '', accessToken: '' },
          },
        },
      } as unknown as RootState

      expect(isEnvInitialState(state, '5')).toEqual(true)
    })

    it('should return true if the env does not have a custom RPC set on the current chain', () => {
      const state = {
        settings: {
          env: {
            rpc: { ['1']: 'https://example.com' },
            tenderly: { url: '', accessToken: '' },
          },
        },
      } as unknown as RootState

      expect(isEnvInitialState(state, '5')).toEqual(true)
    })

    it('should return false if the env is has a custom RPC set on the current chain', () => {
      const state = {
        settings: {
          env: {
            rpc: { ['5']: 'https://other-example.com' },
            tenderly: { url: '', accessToken: '' },
          },
        },
      } as unknown as RootState

      expect(isEnvInitialState(state, '5')).toEqual(false)
    })

    it('should return false if the env is has a custom Tenderly set', () => {
      const state = {
        settings: {
          env: {
            rpc: {},
            tenderly: {
              url: 'https://example.com',
              accessToken: 'test123',
            },
          },
        },
      } as unknown as RootState

      expect(isEnvInitialState(state, '5')).toEqual(false)
    })
  })

  describe('setCuratedNestedSafes', () => {
    const parentSafe1 = toBeHex('0x1', 20)
    const parentSafe2 = toBeHex('0x2', 20)
    const nestedSafe1 = toBeHex('0x10', 20)
    const nestedSafe2 = toBeHex('0x20', 20)
    const nestedSafe3 = toBeHex('0x30', 20)

    it('should set curated nested safes for a parent safe', () => {
      const state = settingsSlice.reducer(
        undefined,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe1,
          selectedAddresses: [nestedSafe1],
          hasCompletedCuration: true,
        }),
      )

      expect(state.curatedNestedSafes[parentSafe1.toLowerCase()]).toEqual({
        selectedAddresses: [nestedSafe1.toLowerCase()],
        hasCompletedCuration: true,
        lastModified: expect.any(Number),
      })
    })

    it('should update curated nested safes for an existing parent safe', () => {
      let state = settingsSlice.reducer(
        undefined,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe1,
          selectedAddresses: [nestedSafe1],
          hasCompletedCuration: true,
        }),
      )

      state = settingsSlice.reducer(
        state,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe1,
          selectedAddresses: [nestedSafe1, nestedSafe2],
          hasCompletedCuration: true,
        }),
      )

      expect(state.curatedNestedSafes[parentSafe1.toLowerCase()]).toEqual({
        selectedAddresses: [nestedSafe1.toLowerCase(), nestedSafe2.toLowerCase()],
        hasCompletedCuration: true,
        lastModified: expect.any(Number),
      })
    })

    it('should handle multiple parent safes independently', () => {
      let state = settingsSlice.reducer(
        undefined,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe1,
          selectedAddresses: [nestedSafe1, nestedSafe2],
          hasCompletedCuration: true,
        }),
      )

      state = settingsSlice.reducer(
        state,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe2,
          selectedAddresses: [nestedSafe3],
          hasCompletedCuration: true,
        }),
      )

      expect(state.curatedNestedSafes[parentSafe1.toLowerCase()]?.selectedAddresses).toEqual([
        nestedSafe1.toLowerCase(),
        nestedSafe2.toLowerCase(),
      ])
      expect(state.curatedNestedSafes[parentSafe2.toLowerCase()]?.selectedAddresses).toEqual([
        nestedSafe3.toLowerCase(),
      ])
    })

    it('should allow clearing curated safes by passing empty array', () => {
      let state = settingsSlice.reducer(
        undefined,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe1,
          selectedAddresses: [nestedSafe1, nestedSafe2],
          hasCompletedCuration: true,
        }),
      )

      state = settingsSlice.reducer(
        state,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe1,
          selectedAddresses: [],
          hasCompletedCuration: true,
        }),
      )

      expect(state.curatedNestedSafes[parentSafe1.toLowerCase()]).toEqual({
        selectedAddresses: [],
        hasCompletedCuration: true,
        lastModified: expect.any(Number),
      })
    })
  })

  describe('clearCuratedNestedSafes', () => {
    const parentSafe = toBeHex('0x1', 20)
    const nestedSafe1 = toBeHex('0x10', 20)

    it('should remove curation state for a parent safe', () => {
      let state = settingsSlice.reducer(
        undefined,
        setCuratedNestedSafes({
          parentSafeAddress: parentSafe,
          selectedAddresses: [nestedSafe1],
          hasCompletedCuration: true,
        }),
      )

      state = settingsSlice.reducer(state, clearCuratedNestedSafes({ parentSafeAddress: parentSafe }))

      expect(state.curatedNestedSafes[parentSafe.toLowerCase()]).toBeUndefined()
    })
  })

  describe('selectCuratedNestedSafes', () => {
    const parentSafe = toBeHex('0x1', 20)
    const nestedSafe1 = toBeHex('0x10', 20)
    const nestedSafe2 = toBeHex('0x20', 20)

    it('should return curated state for a parent safe', () => {
      const state = createCurationState({
        [parentSafe.toLowerCase()]: {
          selectedAddresses: [nestedSafe1.toLowerCase(), nestedSafe2.toLowerCase()],
          hasCompletedCuration: true,
          lastModified: 12345,
        },
      })

      expect(selectCuratedNestedSafes(state, parentSafe)).toEqual({
        selectedAddresses: [nestedSafe1.toLowerCase(), nestedSafe2.toLowerCase()],
        hasCompletedCuration: true,
        lastModified: 12345,
      })
    })

    it('should return undefined when parent safe has no curation state', () => {
      const state = createCurationState({})

      expect(selectCuratedNestedSafes(state, parentSafe)).toBeUndefined()
    })
  })

  describe('selectHasCompletedCuration', () => {
    const parentSafe = toBeHex('0x1', 20)

    it('should return true when curation is complete', () => {
      const state = createCurationState({
        [parentSafe.toLowerCase()]: {
          selectedAddresses: [],
          hasCompletedCuration: true,
          lastModified: 12345,
        },
      })

      expect(selectHasCompletedCuration(state, parentSafe)).toBe(true)
    })

    it('should return false when curation is not complete', () => {
      const state = createCurationState({
        [parentSafe.toLowerCase()]: {
          selectedAddresses: [],
          hasCompletedCuration: false,
          lastModified: 12345,
        },
      })

      expect(selectHasCompletedCuration(state, parentSafe)).toBe(false)
    })

    it('should return false when parent safe has no curation state', () => {
      const state = createCurationState({})

      expect(selectHasCompletedCuration(state, parentSafe)).toBe(false)
    })
  })

  describe('selectCuratedAddresses', () => {
    const parentSafe = toBeHex('0x1', 20)
    const nestedSafe1 = toBeHex('0x10', 20)
    const nestedSafe2 = toBeHex('0x20', 20)

    it('should return curated addresses for a parent safe', () => {
      const state = createCurationState({
        [parentSafe.toLowerCase()]: {
          selectedAddresses: [nestedSafe1.toLowerCase(), nestedSafe2.toLowerCase()],
          hasCompletedCuration: true,
          lastModified: 12345,
        },
      })

      expect(selectCuratedAddresses(state, parentSafe)).toEqual([nestedSafe1.toLowerCase(), nestedSafe2.toLowerCase()])
    })

    it('should return empty array when parent safe has no curated addresses', () => {
      const state = createCurationState({})

      expect(selectCuratedAddresses(state, parentSafe)).toEqual([])
    })
  })
})
