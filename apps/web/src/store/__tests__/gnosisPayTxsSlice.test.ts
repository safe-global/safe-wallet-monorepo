import {
  type GnosisPayTxItem,
  enqueueTransaction,
  gnosisPayTxsSlice,
  type GnosisPayTxsState,
  skipExpired,
  removeFirst,
} from '../gnosisPayTxsSlice'
import { faker } from '@faker-js/faker'
import { safeTxDataBuilder } from '@/tests/builders/safeTx'

describe('gnosisPayTxsSlice', () => {
  it('enqueueTransaction', () => {
    const tx0_0: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }
    let state = gnosisPayTxsSlice.reducer(undefined, enqueueTransaction(tx0_0))
    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_0],
    })

    const tx1_2: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 2,
      safeTxData: safeTxDataBuilder().build(),
    }
    state = gnosisPayTxsSlice.reducer(state, enqueueTransaction(tx1_2))
    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_0],
      [tx1_2.safeAddress]: [tx1_2],
    })

    const tx0_1: GnosisPayTxItem = {
      safeAddress: tx0_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 1,
      safeTxData: safeTxDataBuilder().build(),
    }
    state = gnosisPayTxsSlice.reducer(state, enqueueTransaction(tx0_1))
    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_0, tx0_1],
      [tx1_2.safeAddress]: [tx1_2],
    })

    // Test that we always sort by nonce within each list
    const tx1_0: GnosisPayTxItem = {
      safeAddress: tx1_2.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }
    state = gnosisPayTxsSlice.reducer(state, enqueueTransaction(tx1_0))
    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_0, tx0_1],
      [tx1_2.safeAddress]: [tx1_0, tx1_2],
    })
  })

  it('skipExpired', () => {
    const tx0_0: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() - 1000 * 60 * 2700,
      expiresAt: Date.now(),
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx0_1: GnosisPayTxItem = {
      safeAddress: tx0_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 1,
      safeTxData: safeTxDataBuilder().build(),
    }

    const tx1_0: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() - 1000 * 60 * 2700,
      expiresAt: Date.now(),
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_1: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() - 1000 * 60 * 2700,
      expiresAt: Date.now(),
      queueNonce: 1,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_2: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() - 1000 * 60 * 2700,
      expiresAt: Date.now(),
      queueNonce: 2,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_3: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 3,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_4: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 4,
      safeTxData: safeTxDataBuilder().build(),
    }

    const tx2_0: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() - 1000 * 60 * 2700,
      expiresAt: Date.now(),
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }

    let state: GnosisPayTxsState = {
      [tx0_0.safeAddress]: [tx0_0, tx0_1],
      [tx1_0.safeAddress]: [tx1_0, tx1_1, tx1_2, tx1_3, tx1_4],
      [tx2_0.safeAddress]: [tx2_0],
    }

    state = gnosisPayTxsSlice.reducer(
      state,
      skipExpired({
        safeAddress: tx0_0.safeAddress,
      }),
    )

    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_1],
      [tx1_0.safeAddress]: [tx1_0, tx1_1, tx1_2, tx1_3, tx1_4],
      [tx2_0.safeAddress]: [tx2_0],
    })

    state = gnosisPayTxsSlice.reducer(
      state,
      skipExpired({
        safeAddress: tx1_0.safeAddress,
      }),
    )

    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_1],
      [tx1_0.safeAddress]: [tx1_3, tx1_4],
      [tx2_0.safeAddress]: [tx2_0],
    })

    state = gnosisPayTxsSlice.reducer(
      state,
      skipExpired({
        safeAddress: tx2_0.safeAddress,
      }),
    )

    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_1],
      [tx1_0.safeAddress]: [tx1_3, tx1_4],
    })
  })

  it('removeFirst', () => {
    const tx0_0: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx0_1: GnosisPayTxItem = {
      safeAddress: tx0_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 1,
      safeTxData: safeTxDataBuilder().build(),
    }

    const tx1_0: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_1: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 1,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_2: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 2,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_3: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 3,
      safeTxData: safeTxDataBuilder().build(),
    }
    const tx1_4: GnosisPayTxItem = {
      safeAddress: tx1_0.safeAddress,
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 4,
      safeTxData: safeTxDataBuilder().build(),
    }

    const tx2_0: GnosisPayTxItem = {
      safeAddress: faker.finance.ethereumAddress(),
      executableAt: Date.now() + 1000 * 60 * 300,
      expiresAt: Date.now() + 1000 * 60 * 3000,
      queueNonce: 0,
      safeTxData: safeTxDataBuilder().build(),
    }

    let state: GnosisPayTxsState = {
      [tx0_0.safeAddress]: [tx0_0, tx0_1],
      [tx1_0.safeAddress]: [tx1_0, tx1_1, tx1_2, tx1_3, tx1_4],
      [tx2_0.safeAddress]: [tx2_0],
    }

    state = gnosisPayTxsSlice.reducer(
      state,
      removeFirst({
        safeAddress: tx0_0.safeAddress,
      }),
    )

    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_1],
      [tx1_0.safeAddress]: [tx1_0, tx1_1, tx1_2, tx1_3, tx1_4],
      [tx2_0.safeAddress]: [tx2_0],
    })

    state = gnosisPayTxsSlice.reducer(
      state,
      removeFirst({
        safeAddress: tx1_0.safeAddress,
      }),
    )

    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_1],
      [tx1_0.safeAddress]: [tx1_1, tx1_2, tx1_3, tx1_4],
      [tx2_0.safeAddress]: [tx2_0],
    })

    state = gnosisPayTxsSlice.reducer(
      state,
      removeFirst({
        safeAddress: tx2_0.safeAddress,
      }),
    )

    expect(state).toEqual({
      [tx0_0.safeAddress]: [tx0_1],
      [tx1_0.safeAddress]: [tx1_1, tx1_2, tx1_3, tx1_4],
    })
  })
})
