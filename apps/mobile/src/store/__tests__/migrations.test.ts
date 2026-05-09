import { migrate } from '../migrations'

interface PersistedContact {
  value: string
  name: string
  chainIds: string[]
}

interface TestState {
  _persist: { version: number; rehydrated: boolean }
  safes?: Record<string, Record<string, { owners?: { value: string }[] }>>
  addressBook?: { contacts: Record<string, PersistedContact> }
}

const makePersistState = (overrides: Omit<TestState, '_persist'>): TestState => ({
  _persist: { version: 1, rehydrated: false },
  ...overrides,
})

const getContacts = (result: TestState) => {
  expect(result.addressBook).toBeDefined()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result.addressBook!.contacts
}

describe('redux-persist migrations', () => {
  describe('v1 -> v2: backfill address book chainIds', () => {
    it('sets chainIds on Safe contacts from safesSlice', async () => {
      const state = makePersistState({
        safes: {
          '0xSafe1': {
            '1': { owners: [{ value: '0xOwner1' }] },
            '137': { owners: [{ value: '0xOwner1' }] },
          },
        },
        addressBook: {
          contacts: {
            '0xSafe1': { value: '0xSafe1', name: 'My Safe', chainIds: [] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      expect(contacts['0xSafe1'].chainIds).toEqual(['1', '137'])
    })

    it('sets chainIds on signer contacts from Safe owner data', async () => {
      const state = makePersistState({
        safes: {
          '0xSafe1': {
            '1': { owners: [{ value: '0xSigner1' }] },
            '137': { owners: [{ value: '0xSigner1' }, { value: '0xSigner2' }] },
          },
        },
        addressBook: {
          contacts: {
            '0xSigner1': { value: '0xSigner1', name: 'Signer 1', chainIds: [] },
            '0xSigner2': { value: '0xSigner2', name: 'Signer 2', chainIds: [] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      expect(contacts['0xSigner1'].chainIds).toEqual(['1', '137'])
      expect(contacts['0xSigner2'].chainIds).toEqual(['137'])
    })

    it('does not modify contacts that already have specific chainIds', async () => {
      const state = makePersistState({
        safes: {
          '0xSafe1': {
            '1': { owners: [] },
            '137': { owners: [] },
            '10': { owners: [] },
          },
        },
        addressBook: {
          contacts: {
            '0xSafe1': { value: '0xSafe1', name: 'My Safe', chainIds: ['1'] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      expect(contacts['0xSafe1'].chainIds).toEqual(['1'])
    })

    it('does not modify non-Safe/non-signer contacts', async () => {
      const state = makePersistState({
        safes: {
          '0xSafe1': {
            '1': { owners: [{ value: '0xOwner1' }] },
          },
        },
        addressBook: {
          contacts: {
            '0xEOA': { value: '0xEOA', name: 'Some EOA', chainIds: [] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      expect(contacts['0xEOA'].chainIds).toEqual([])
    })

    it('handles address casing mismatches via lowercase comparison', async () => {
      const state = makePersistState({
        safes: {
          '0xABCDef': {
            '1': { owners: [] },
            '137': { owners: [] },
          },
        },
        addressBook: {
          contacts: {
            '0xabcdef': { value: '0xabcdef', name: 'My Safe', chainIds: [] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      expect(contacts['0xabcdef'].chainIds).toEqual(['1', '137'])
    })

    it('handles empty safesSlice gracefully', async () => {
      const state = makePersistState({
        safes: {},
        addressBook: {
          contacts: {
            '0x1': { value: '0x1', name: 'Contact', chainIds: [] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      expect(contacts['0x1'].chainIds).toEqual([])
    })

    it('handles missing safes or addressBook gracefully', async () => {
      const stateNoSafes = makePersistState({
        addressBook: {
          contacts: { '0x1': { value: '0x1', name: 'C', chainIds: [] } },
        },
      })
      const stateNoBook = makePersistState({
        safes: { '0x1': { '1': { owners: [] } } },
      })

      const result1 = (await migrate(stateNoSafes, 2)) as TestState
      const result2 = (await migrate(stateNoBook, 2)) as TestState

      const contacts1 = getContacts(result1)
      expect(contacts1['0x1'].chainIds).toEqual([])
      expect(result2.addressBook).toBeUndefined()
    })

    it('handles undefined state', async () => {
      const result = await migrate(undefined, 2)

      expect(result).toBeUndefined()
    })

    it('does not assign signer chainIds to contacts that are also Safes', async () => {
      // A Safe address can also appear as an owner of another Safe
      const state = makePersistState({
        safes: {
          '0xSafe1': {
            '1': { owners: [{ value: '0xSafe2' }] },
          },
          '0xSafe2': {
            '137': { owners: [] },
          },
        },
        addressBook: {
          contacts: {
            '0xSafe2': { value: '0xSafe2', name: 'Safe 2', chainIds: [] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      // Should get chainIds from its own deployment, not from being an owner
      expect(contacts['0xSafe2'].chainIds).toEqual(['137'])
    })

    it('handles Safe with no owners field', async () => {
      const state = makePersistState({
        safes: {
          '0xSafe1': {
            '1': {}, // no owners field
          },
        },
        addressBook: {
          contacts: {
            '0xSafe1': { value: '0xSafe1', name: 'Safe', chainIds: [] },
          },
        },
      })

      const result = (await migrate(state, 2)) as TestState
      const contacts = getContacts(result)

      expect(contacts['0xSafe1'].chainIds).toEqual(['1'])
    })
  })
})
