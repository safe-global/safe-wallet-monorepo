import { faker } from '@faker-js/faker'
import { cgwApi, type TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import draftTxReducer, { clearAllDrafts, clearDraft, selectDraftByHash, setDraft, type DraftTx } from './draftTxSlice'
import type { RootState } from '@/src/store'

const buildDraft = (overrides: Partial<DraftTx> = {}): DraftTx => {
  const safeTxHash =
    overrides.safeTxHash ?? `0x${faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' })}`
  return {
    chainId: '1',
    safeAddress: faker.finance.ethereumAddress(),
    buildParams: {
      to: faker.finance.ethereumAddress(),
      value: '0',
      data: '0x',
      nonce: 0,
    },
    safeTxHash,
    txDetails: { txId: safeTxHash } as TransactionDetails,
    ...overrides,
  }
}

describe('draftTxSlice', () => {
  it('starts with no drafts', () => {
    const state = draftTxReducer(undefined, { type: '@@INIT' })
    expect(state.drafts).toEqual({})
  })

  it('stores a draft keyed by safeTxHash via setDraft', () => {
    const draft = buildDraft()
    const state = draftTxReducer(undefined, setDraft(draft))
    expect(state.drafts[draft.safeTxHash]).toEqual(draft)
  })

  it('overwrites an existing draft with the same safeTxHash', () => {
    const draft = buildDraft()
    const updated = buildDraft({ safeTxHash: draft.safeTxHash, chainId: '137' })
    let state = draftTxReducer(undefined, setDraft(draft))
    state = draftTxReducer(state, setDraft(updated))
    expect(state.drafts[draft.safeTxHash].chainId).toBe('137')
  })

  it('removes a draft via clearDraft', () => {
    const draft = buildDraft()
    let state = draftTxReducer(undefined, setDraft(draft))
    state = draftTxReducer(state, clearDraft(draft.safeTxHash))
    expect(state.drafts[draft.safeTxHash]).toBeUndefined()
  })

  it('clears every draft via clearAllDrafts', () => {
    const a = buildDraft()
    const b = buildDraft()
    let state = draftTxReducer(undefined, setDraft(a))
    state = draftTxReducer(state, setDraft(b))
    state = draftTxReducer(state, clearAllDrafts())
    expect(state.drafts).toEqual({})
  })

  describe('extraReducers — CGW confirmed a tx for this hash', () => {
    // Construct an action shape that satisfies the matcher's predicate.
    // RTK Query's matchFulfilled checks endpointName + requestStatus on meta.
    const fulfilledAction = (id: string) => ({
      type: `${cgwApi.reducerPath}/executeQuery/fulfilled`,
      payload: { txId: id } as TransactionDetails,
      meta: {
        arg: {
          type: 'query' as const,
          endpointName: 'transactionsGetTransactionByIdV1',
          originalArgs: { chainId: '1', id },
        },
        requestId: 'test-request',
        requestStatus: 'fulfilled' as const,
        fulfilledTimeStamp: Date.now(),
      },
    })

    it('drops the draft when a getTransactionById query for the same id is fulfilled', () => {
      const draft = buildDraft()
      // sanity: the matcher recognises our action shape
      expect(cgwApi.endpoints.transactionsGetTransactionByIdV1.matchFulfilled(fulfilledAction(draft.safeTxHash))).toBe(
        true,
      )
      let state = draftTxReducer(undefined, setDraft(draft))
      state = draftTxReducer(state, fulfilledAction(draft.safeTxHash))
      expect(state.drafts[draft.safeTxHash]).toBeUndefined()
    })

    it('leaves unrelated drafts untouched', () => {
      const drafts = [buildDraft(), buildDraft()]
      let state = draftTxReducer(undefined, setDraft(drafts[0]))
      state = draftTxReducer(state, setDraft(drafts[1]))
      state = draftTxReducer(state, fulfilledAction(drafts[0].safeTxHash))
      expect(state.drafts[drafts[0].safeTxHash]).toBeUndefined()
      expect(state.drafts[drafts[1].safeTxHash]).toBeDefined()
    })
  })

  describe('selectDraftByHash', () => {
    it('returns the draft when present', () => {
      const draft = buildDraft()
      const state = { draftTx: { drafts: { [draft.safeTxHash]: draft } } } as unknown as RootState
      expect(selectDraftByHash(state, draft.safeTxHash)).toBe(draft)
    })

    it('returns undefined when the draft is not present', () => {
      const state = { draftTx: { drafts: {} } } as unknown as RootState
      expect(selectDraftByHash(state, '0xabc')).toBeUndefined()
    })
  })
})
