import signersReducer, { addSigner, addSignerWithEffects, selectSigners, selectTotalSignerCount } from '../signersSlice'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { selectActiveSigner } from '../activeSignerSlice'
import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from '../index'
import type { RootState } from '../index'
import { faker } from '@faker-js/faker'

// Helper function to create a test store with proper typing for thunks
const createTestStore = (initialState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for testing
      }),
  })

  // Return store with proper dispatch typing
  return store as typeof store & {
    dispatch: typeof store.dispatch
  }
}

// Helper function to generate a valid Ethereum address
const generateEthereumAddress = (): `0x${string}` => {
  return faker.finance.ethereumAddress() as `0x${string}`
}

// Helper function to generate AddressInfo
const generateAddressInfo = (overrides?: Partial<AddressInfo>): AddressInfo => ({
  value: generateEthereumAddress(),
  name: faker.person.firstName(),
  ...overrides,
})

describe('signersSlice', () => {
  beforeEach(() => {
    // Set a seed for consistent test results
    faker.seed(123)
  })

  it('adds a signer', () => {
    const signer = generateAddressInfo()
    const state = signersReducer(undefined, addSigner(signer))
    expect(state[signer.value]).toEqual(signer)
  })

  describe('addSignerWithEffects', () => {
    const mockSigner = generateAddressInfo({ name: 'Test Signer' })

    it('should add signer to the store', async () => {
      const store = createTestStore()

      // @ts-ignore: Allow thunk dispatch in test
      await store.dispatch(addSignerWithEffects(mockSigner))

      const state = store.getState()
      const signers = selectSigners(state)

      expect(signers[mockSigner.value]).toEqual(mockSigner)
    })

    it('should set active signer when activeSafe exists and no active signer for that safe', async () => {
      const safeAddress = generateEthereumAddress()
      const mockActiveSafe = {
        address: safeAddress,
        chainId: faker.number.int({ min: 1, max: 100 }).toString(),
      }

      const initialState: Partial<RootState> = {
        activeSafe: mockActiveSafe,
        activeSigner: {}, // No active signer for this safe
      }

      const store = createTestStore(initialState)

      // @ts-ignore: Allow thunk dispatch in test
      await store.dispatch(addSignerWithEffects(mockSigner))

      const state = store.getState()

      // Check that signer was added
      const signers = selectSigners(state)
      expect(signers[mockSigner.value]).toEqual(mockSigner)

      // Check that active signer was set
      const activeSigner = selectActiveSigner(state, safeAddress)
      expect(activeSigner).toEqual(mockSigner)
    })

    it('should not set active signer when activeSafe exists but already has an active signer', async () => {
      const safeAddress = generateEthereumAddress()
      const mockActiveSafe = {
        address: safeAddress,
        chainId: faker.number.int({ min: 1, max: 100 }).toString(),
      }

      const existingActiveSigner = generateAddressInfo({ name: 'Existing Signer' })

      const initialState: Partial<RootState> = {
        activeSafe: mockActiveSafe,
        activeSigner: {
          [safeAddress]: existingActiveSigner, // Already has an active signer
        },
      }

      const store = createTestStore(initialState)

      // @ts-ignore: Allow thunk dispatch in test
      await store.dispatch(addSignerWithEffects(mockSigner))

      const state = store.getState()

      // Check that signer was added
      const signers = selectSigners(state)
      expect(signers[mockSigner.value]).toEqual(mockSigner)

      // Check that active signer was NOT changed
      const activeSigner = selectActiveSigner(state, safeAddress)
      expect(activeSigner).toEqual(existingActiveSigner)
      expect(activeSigner).not.toEqual(mockSigner)
    })

    it('should not set active signer when activeSafe is null', async () => {
      const initialState: Partial<RootState> = {
        activeSafe: null,
        activeSigner: {},
      }

      const store = createTestStore(initialState)

      // @ts-ignore: Allow thunk dispatch in test
      await store.dispatch(addSignerWithEffects(mockSigner))

      const state = store.getState()

      // Check that signer was added
      const signers = selectSigners(state)
      expect(signers[mockSigner.value]).toEqual(mockSigner)

      // Check that no active signer was set (activeSigner should remain empty)
      expect(state.activeSigner).toEqual({})
    })

    it('should not set active signer when activeSafe is undefined', async () => {
      const initialState: Partial<RootState> = {
        activeSafe: undefined,
        activeSigner: {},
      }

      const store = createTestStore(initialState)

      // @ts-ignore: Allow thunk dispatch in test
      await store.dispatch(addSignerWithEffects(mockSigner))

      const state = store.getState()

      // Check that signer was added
      const signers = selectSigners(state)
      expect(signers[mockSigner.value]).toEqual(mockSigner)

      // Check that no active signer was set (activeSigner should remain empty)
      expect(state.activeSigner).toEqual({})
    })

    it('should work correctly with multiple signers and safes', async () => {
      const safeAddress1 = generateEthereumAddress()
      const safeAddress2 = generateEthereumAddress()

      const mockSafe1 = {
        address: safeAddress1,
        chainId: faker.number.int({ min: 1, max: 100 }).toString(),
      }

      const signer1 = generateAddressInfo({ name: 'Signer 1' })
      const signer2 = generateAddressInfo({ name: 'Signer 2' })

      const initialState: Partial<RootState> = {
        activeSafe: mockSafe1,
        activeSigner: {},
      }

      const store = createTestStore(initialState)

      // Add first signer - should become active signer for safe 1
      // @ts-ignore: Allow thunk dispatch in test
      await store.dispatch(addSignerWithEffects(signer1))

      let state = store.getState()
      expect(selectSigners(state)[signer1.value]).toEqual(signer1)
      expect(selectActiveSigner(state, safeAddress1)).toEqual(signer1)

      // Add second signer - should NOT change active signer for safe 1
      // @ts-ignore: Allow thunk dispatch in test
      await store.dispatch(addSignerWithEffects(signer2))

      state = store.getState()
      expect(selectSigners(state)[signer2.value]).toEqual(signer2)
      expect(selectActiveSigner(state, safeAddress1)).toEqual(signer1) // Still the first signer
      expect(selectActiveSigner(state, safeAddress2)).toBeUndefined() // No active signer for safe 2
    })
  })

  describe('selectTotalSignerCount', () => {
    it('should return 0 for empty signers state', () => {
      const state = { signers: {} } as RootState
      expect(selectTotalSignerCount(state)).toBe(0)
    })

    it('should return correct count for single signer', () => {
      const signer = generateAddressInfo()
      const state = { signers: { [signer.value]: signer } } as RootState
      expect(selectTotalSignerCount(state)).toBe(1)
    })

    it('should return correct count for multiple signers', () => {
      const signer1 = generateAddressInfo()
      const signer2 = generateAddressInfo()
      const signer3 = generateAddressInfo()

      const state = {
        signers: {
          [signer1.value]: signer1,
          [signer2.value]: signer2,
          [signer3.value]: signer3,
        },
      } as RootState

      expect(selectTotalSignerCount(state)).toBe(3)
    })

    it('should update count when signers are added via reducer', () => {
      let state = signersReducer(undefined, { type: 'INIT' })
      expect(selectTotalSignerCount({ signers: state } as RootState)).toBe(0)

      const signer1 = generateAddressInfo()
      state = signersReducer(state, addSigner(signer1))
      expect(selectTotalSignerCount({ signers: state } as RootState)).toBe(1)

      const signer2 = generateAddressInfo()
      state = signersReducer(state, addSigner(signer2))
      expect(selectTotalSignerCount({ signers: state } as RootState)).toBe(2)
    })
  })
})
