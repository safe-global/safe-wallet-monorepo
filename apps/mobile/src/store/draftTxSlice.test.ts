import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import draftTxReducer, { clearAllDrafts, clearDraft, selectDraftByHash, setDraft, type DraftTx } from './draftTxSlice'
import type { RootState } from '@/src/store'

const buildDraft = (overrides: Partial<DraftTx> = {}): DraftTx => {
  const safeTxHash =
    overrides.safeTxHash ?? `0x${faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' })}`
  return {
    chainId: '1',
    safeAddress: faker.finance.ethereumAddress(),
    sender: faker.finance.ethereumAddress(),
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
    const updated = buildDraft({ safeTxHash: draft.safeTxHash, sender: '0xnew' })
    let state = draftTxReducer(undefined, setDraft(draft))
    state = draftTxReducer(state, setDraft(updated))
    expect(state.drafts[draft.safeTxHash].sender).toBe('0xnew')
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
