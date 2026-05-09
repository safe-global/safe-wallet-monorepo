import { migrate } from '../migrations'

interface TestState {
  _persist: { version: number; rehydrated: boolean }
  activeSafe?: { address: string; chainId: string } | null
  settings?: { dataCollectionConsented?: boolean }
  safes?: Record<string, Record<string, { owners?: { value: string }[] }>>
  addressBook?: { contacts: Record<string, { value: string; name: string; chainIds: string[] }> }
}

const makePersistState = (overrides: Omit<TestState, '_persist'>): TestState => ({
  _persist: { version: 2, rehydrated: false },
  ...overrides,
})

describe('redux-persist migrations', () => {
  describe('v2 -> v3: backfill dataCollectionConsented', () => {
    it('sets dataCollectionConsented to true when activeSafe exists', async () => {
      const state = makePersistState({
        activeSafe: { address: '0xSafe1', chainId: '1' },
        settings: {},
      })

      const result = (await migrate(state, 3)) as TestState

      expect(result.settings?.dataCollectionConsented).toBe(true)
    })

    it('sets dataCollectionConsented to false when activeSafe is null', async () => {
      const state = makePersistState({
        activeSafe: null,
        settings: {},
      })

      const result = (await migrate(state, 3)) as TestState

      expect(result.settings?.dataCollectionConsented).toBe(false)
    })

    it('sets dataCollectionConsented to false when activeSafe is missing', async () => {
      const state = makePersistState({
        settings: {},
      })

      const result = (await migrate(state, 3)) as TestState

      expect(result.settings?.dataCollectionConsented).toBe(false)
    })

    it('handles missing settings gracefully', async () => {
      const state = makePersistState({
        activeSafe: { address: '0xSafe1', chainId: '1' },
      })

      const result = (await migrate(state, 3)) as TestState

      // Should not crash; settings is undefined so migration skips it
      expect(result.settings).toBeUndefined()
    })

    it('handles undefined state', async () => {
      const result = await migrate(undefined, 3)

      expect(result).toBeUndefined()
    })
  })
})
