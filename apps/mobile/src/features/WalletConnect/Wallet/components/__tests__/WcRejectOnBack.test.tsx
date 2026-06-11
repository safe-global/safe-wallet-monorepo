import React from 'react'
import { waitFor } from '@testing-library/react-native'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { WcRejectOnBack } from '../WcRejectOnBack'
import { walletKitSliceName } from '../../store/walletKitSlice'

// Capture the beforeRemove listener so the test can simulate a back navigation.
let beforeRemoveCb: (() => void) | undefined
jest.mock('expo-router', () => ({
  useNavigation: () => ({
    addListener: (event: string, cb: () => void) => {
      if (event === 'beforeRemove') {
        beforeRemoveCb = cb
      }
      return jest.fn()
    },
  }),
}))

jest.mock('@/src/hooks/useHasFeature', () => ({ useHasFeature: () => true }))

const mockRespond = jest.fn().mockResolvedValue(undefined)
jest.mock('../../walletKit', () => ({ getWalletKit: () => Promise.resolve({ respondSessionRequest: mockRespond }) }))

const HASH = '0xabc'

const draft = {
  chainId: '1',
  safeAddress: '0x1111111111111111111111111111111111111111',
  buildParams: {},
  safeTxHash: HASH,
  txDetails: {},
}

const storeWith = (withDraft: boolean) =>
  createTestStore({
    draftTx: { drafts: withDraft ? { [HASH]: draft } : {} },
    [walletKitSliceName]: {
      sessions: {},
      pending: [],
      outstandingRequests: { [HASH]: { topic: 't', id: 5, method: 'eth_sendTransaction' } },
    },
  } as never)

beforeEach(() => {
  beforeRemoveCb = undefined
  jest.clearAllMocks()
})

describe('WcRejectOnBack', () => {
  it('rejects a still-drafted WC tx with USER_REJECTED on back navigation', async () => {
    const store = storeWith(true)
    renderWithStore(<WcRejectOnBack safeTxHash={HASH} />, store)
    expect(beforeRemoveCb).toBeDefined()
    beforeRemoveCb?.()
    await waitFor(() =>
      expect(mockRespond).toHaveBeenCalledWith({
        topic: 't',
        response: formatJsonRpcError(5, getSdkError('USER_REJECTED').message),
      }),
    )
    await waitFor(() => expect(store.getState()[walletKitSliceName].outstandingRequests).toEqual({}))
  })

  it('does not reject once the draft is cleared (tx already proposed)', async () => {
    const store = storeWith(false)
    renderWithStore(<WcRejectOnBack safeTxHash={HASH} />, store)
    beforeRemoveCb?.()
    await Promise.resolve()
    expect(mockRespond).not.toHaveBeenCalled()
    // Outstanding request retained for the propose-fulfilled listener to answer.
    expect(store.getState()[walletKitSliceName].outstandingRequests[HASH]).toBeDefined()
  })

  it('is a no-op for a non-WC tx (no outstanding request)', async () => {
    const store = createTestStore({
      draftTx: { drafts: { [HASH]: draft } },
      [walletKitSliceName]: { sessions: {}, pending: [], outstandingRequests: {} },
    } as never)
    renderWithStore(<WcRejectOnBack safeTxHash={HASH} />, store)
    beforeRemoveCb?.()
    await Promise.resolve()
    expect(mockRespond).not.toHaveBeenCalled()
  })
})
