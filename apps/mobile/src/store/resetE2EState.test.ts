import { configureStore } from '@reduxjs/toolkit'
import { faker } from '@faker-js/faker'

import { resetE2EState } from './resetE2EState'
import signersReducer, { addSigner, type Signer } from './signersSlice'
import activeSignerReducer, { setActiveSigner } from './activeSignerSlice'
import safesReducer, { addSafe } from './safesSlice'
import activeSafeReducer, { setActiveSafe } from './activeSafeSlice'
import executionMethodReducer, { setExecutionMethod } from './executionMethodSlice'
import estimatedFeeReducer, { setEstimatedFeeValues } from './estimatedFeeSlice'
import notificationsReducer, { updatePromptAttempts } from './notificationsSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Address } from '@/src/types/address'

const SAFE_ADDRESS = faker.finance.ethereumAddress() as Address
const SIGNER_ADDRESS = faker.finance.ethereumAddress() as Address

const safeInfo = {
  address: { value: SAFE_ADDRESS, name: null, logoUri: null },
  chainId: '11155111',
  threshold: 1,
  owners: [{ value: SIGNER_ADDRESS, name: null, logoUri: null }],
  // Cast to bypass the full SafeOverview shape — only fields read by the slice matter
} as unknown as Parameters<typeof addSafe>[0]['info'][string]

const pkSigner: Signer = { value: SIGNER_ADDRESS, name: null, logoUri: null, type: 'private-key' }

const createE2EStore = () =>
  configureStore({
    reducer: {
      signers: signersReducer,
      activeSigner: activeSignerReducer,
      safes: safesReducer,
      activeSafe: activeSafeReducer,
      executionMethod: executionMethodReducer,
      estimatedFee: estimatedFeeReducer,
      notifications: notificationsReducer,
    },
  })

describe('resetE2EState', () => {
  it('returns every wired slice to its initialState', () => {
    const store = createE2EStore()

    // Mutate every slice with realistic seed data
    store.dispatch(addSigner(pkSigner))
    store.dispatch(setActiveSigner({ safeAddress: SAFE_ADDRESS, signer: pkSigner }))
    store.dispatch(addSafe({ address: SAFE_ADDRESS, info: { '11155111': safeInfo } }))
    store.dispatch(setActiveSafe({ address: SAFE_ADDRESS, chainId: '11155111' }))
    store.dispatch(setExecutionMethod(ExecutionMethod.WITH_WC))
    store.dispatch(
      setEstimatedFeeValues({
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
        gasLimit: 21000n,
        nonce: 0,
      }),
    )
    store.dispatch(updatePromptAttempts(0))

    // Sanity: state changed
    const seeded = store.getState()
    expect(seeded.signers).not.toEqual({})
    expect(seeded.activeSigner).not.toEqual({})
    expect(seeded.safes).not.toEqual({})
    expect(seeded.activeSafe).not.toBeNull()
    expect(seeded.executionMethod).toBe(ExecutionMethod.WITH_WC)
    expect(seeded.estimatedFee).not.toBeNull()
    expect(seeded.notifications.promptAttempts).toBeGreaterThan(0)

    // Reset
    store.dispatch(resetE2EState())
    const cleared = store.getState()

    expect(cleared.signers).toEqual({})
    expect(cleared.activeSigner).toEqual({})
    expect(cleared.safes).toEqual({})
    expect(cleared.activeSafe).toBeNull()
    expect(cleared.executionMethod).toBe(ExecutionMethod.WITH_RELAY)
    expect(cleared.estimatedFee).toBeNull()
    expect(cleared.notifications).toEqual({
      isDeviceNotificationsEnabled: false,
      isAppNotificationsEnabled: false,
      fcmToken: null,
      remoteMessages: [],
      promptAttempts: 0,
      lastTimePromptAttempted: null,
    })
  })
})
