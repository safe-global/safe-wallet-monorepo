import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createTestStore } from '@/src/tests/test-utils'
import { selectDraftByHash, selectDraftRedirect, type DraftTx } from '@/src/store/draftTxSlice'
import { selectOutstandingRequestByHash } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { redirectDraft } from './draft'

const buildDraft = (safeTxHash: string): DraftTx => ({
  chainId: '1',
  safeAddress: faker.finance.ethereumAddress(),
  buildParams: { to: faker.finance.ethereumAddress(), value: '0', data: '0x', nonce: 7 },
  safeTxHash,
  txDetails: { txId: safeTxHash } as TransactionDetails,
})

const outstandingRequest = {
  topic: 'topic',
  id: 1,
  method: 'eth_sendTransaction' as const,
  chainId: '1',
  safeAddress: faker.finance.ethereumAddress(),
}

const walletKitState = (outstandingRequests: Record<string, typeof outstandingRequest>) => ({
  sessions: {},
  verifyByTopic: {},
  pending: [],
  outstandingRequests,
  _persist: { version: -1, rehydrated: true },
})

describe('redirectDraft', () => {
  it('rekeys the WC request, records the redirect and drops the old draft', () => {
    const store = createTestStore({
      draftTx: { drafts: { '0xold': buildDraft('0xold'), '0xnew': buildDraft('0xnew') }, redirects: {} },
      walletKit: walletKitState({ '0xold': outstandingRequest }),
    })

    redirectDraft(store.dispatch, '0xold', '0xnew')

    const state = store.getState()
    expect(selectDraftByHash(state, '0xold')).toBeUndefined()
    expect(selectDraftRedirect(state, '0xold')).toEqual('0xnew')
    expect(selectOutstandingRequestByHash(state, '0xold')).toBeUndefined()
    expect(selectOutstandingRequestByHash(state, '0xnew')).toEqual(outstandingRequest)
  })

  it('is a no-op when the rebuild produced the same hash', () => {
    const store = createTestStore({
      draftTx: { drafts: { '0xsame': buildDraft('0xsame') }, redirects: {} },
      walletKit: walletKitState({ '0xsame': outstandingRequest }),
    })

    redirectDraft(store.dispatch, '0xsame', '0xsame')

    const state = store.getState()
    expect(selectDraftByHash(state, '0xsame')).toBeDefined()
    expect(selectDraftRedirect(state, '0xsame')).toBeUndefined()
    expect(selectOutstandingRequestByHash(state, '0xsame')).toEqual(outstandingRequest)
  })
})
