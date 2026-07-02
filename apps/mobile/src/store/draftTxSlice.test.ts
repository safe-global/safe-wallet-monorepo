import { faker } from '@faker-js/faker'
import { configureStore } from '@reduxjs/toolkit'
import { http, HttpResponse } from 'msw'
import { cgwApi, type TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { GATEWAY_URL } from '@/src/config/constants'
import { server } from '@/src/tests/server'
import draftTxReducer, {
  clearAllDrafts,
  clearDraft,
  clearDraftRedirect,
  selectDraftByHash,
  selectDraftRedirect,
  setDraft,
  setDraftRedirect,
  type DraftTx,
} from './draftTxSlice'
import { setActiveSafe } from './activeSafeSlice'
import type { Address } from '@/src/types/address'
import type { RootState } from '@/src/store'

setBaseUrl(GATEWAY_URL)

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

const createTestStore = () =>
  configureStore({
    reducer: {
      draftTx: draftTxReducer,
      [cgwClient.reducerPath]: cgwClient.reducer,
    },
    middleware: (gdm) => gdm({ serializableCheck: false }).concat(cgwClient.middleware),
  })

type TestStore = ReturnType<typeof createTestStore>
type TestRootState = ReturnType<TestStore['getState']>

const selectDrafts = (state: TestRootState) => state.draftTx.drafts

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

  describe('redirects', () => {
    it('stores and clears a redirect between safeTxHashes', () => {
      let state = draftTxReducer(undefined, setDraftRedirect({ fromSafeTxHash: '0xold', toSafeTxHash: '0xnew' }))
      expect(state.redirects?.['0xold']).toEqual('0xnew')

      state = draftTxReducer(state, clearDraftRedirect('0xold'))
      expect(state.redirects).toEqual({})
    })

    it('selectDraftRedirect resolves the new hash', () => {
      const state = draftTxReducer(undefined, setDraftRedirect({ fromSafeTxHash: '0xold', toSafeTxHash: '0xnew' }))
      expect(selectDraftRedirect({ draftTx: state } as RootState, '0xold')).toEqual('0xnew')
      expect(selectDraftRedirect({ draftTx: state } as RootState, '0xnew')).toBeUndefined()
    })

    it('selectDraftRedirect follows chains from repeated edits', () => {
      let state = draftTxReducer(undefined, setDraftRedirect({ fromSafeTxHash: '0xa', toSafeTxHash: '0xb' }))
      state = draftTxReducer(state, setDraftRedirect({ fromSafeTxHash: '0xb', toSafeTxHash: '0xc' }))
      expect(selectDraftRedirect({ draftTx: state } as RootState, '0xa')).toEqual('0xc')
      expect(selectDraftRedirect({ draftTx: state } as RootState, '0xb')).toEqual('0xc')
      expect(selectDraftRedirect({ draftTx: state } as RootState, '0xc')).toBeUndefined()
    })

    it('drops redirects together with drafts via clearAllDrafts and safe switches', () => {
      const withRedirect = draftTxReducer(
        undefined,
        setDraftRedirect({ fromSafeTxHash: '0xold', toSafeTxHash: '0xnew' }),
      )

      expect(draftTxReducer(withRedirect, clearAllDrafts()).redirects).toEqual({})
      expect(
        draftTxReducer(
          withRedirect,
          setActiveSafe({ chainId: '137', address: faker.finance.ethereumAddress() as Address }),
        ).redirects,
      ).toEqual({})
    })
  })

  describe('CGW confirms a tx for this hash', () => {
    it('drops the matching draft when getTransactionById returns data', async () => {
      const store = createTestStore()
      const draft = buildDraft()
      store.dispatch(setDraft(draft))
      expect(selectDrafts(store.getState())[draft.safeTxHash]).toBeDefined()

      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${draft.chainId}/transactions/${draft.safeTxHash}`, () =>
          HttpResponse.json({ txId: draft.safeTxHash, safeAddress: draft.safeAddress } as TransactionDetails),
        ),
      )

      await store
        .dispatch(
          cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({
            chainId: draft.chainId,
            id: draft.safeTxHash,
          }),
        )
        .unwrap()

      expect(selectDrafts(store.getState())[draft.safeTxHash]).toBeUndefined()
    })

    it('leaves unrelated drafts untouched when CGW resolves a different id', async () => {
      const store = createTestStore()
      const targetDraft = buildDraft()
      const otherDraft = buildDraft()
      store.dispatch(setDraft(targetDraft))
      store.dispatch(setDraft(otherDraft))

      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${targetDraft.chainId}/transactions/${targetDraft.safeTxHash}`, () =>
          HttpResponse.json({ txId: targetDraft.safeTxHash } as TransactionDetails),
        ),
      )

      await store
        .dispatch(
          cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({
            chainId: targetDraft.chainId,
            id: targetDraft.safeTxHash,
          }),
        )
        .unwrap()

      const drafts = selectDrafts(store.getState())
      expect(drafts[targetDraft.safeTxHash]).toBeUndefined()
      expect(drafts[otherDraft.safeTxHash]).toBeDefined()
    })

    it('drops the matching draft when our own /propose succeeds', async () => {
      const store = createTestStore()
      const draft = buildDraft()
      store.dispatch(setDraft(draft))

      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/${draft.chainId}/transactions/${draft.safeAddress}/propose`, () =>
          HttpResponse.json({ txId: `multisig_${draft.safeAddress}_${draft.safeTxHash}` } as TransactionDetails),
        ),
      )

      await store
        .dispatch(
          cgwApi.endpoints.transactionsProposeTransactionV1.initiate({
            chainId: draft.chainId,
            safeAddress: draft.safeAddress,
            proposeTransactionDto: {
              to: draft.buildParams.to,
              value: String(draft.buildParams.value ?? '0'),
              data: (draft.buildParams.data as string | null) ?? null,
              nonce: String(draft.buildParams.nonce ?? 0),
              operation: 0,
              safeTxGas: '0',
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
              safeTxHash: draft.safeTxHash,
              sender: faker.finance.ethereumAddress(),
            },
          }),
        )
        .unwrap()

      expect(selectDrafts(store.getState())[draft.safeTxHash]).toBeUndefined()
    })

    it('leaves the draft in place when the query errors out', async () => {
      const store = createTestStore()
      const draft = buildDraft()
      store.dispatch(setDraft(draft))

      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${draft.chainId}/transactions/${draft.safeTxHash}`, () =>
          HttpResponse.json({ message: 'not found' }, { status: 404 }),
        ),
      )

      await store
        .dispatch(
          cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({
            chainId: draft.chainId,
            id: draft.safeTxHash,
          }),
        )
        .unwrap()
        .catch(() => undefined)

      expect(selectDrafts(store.getState())[draft.safeTxHash]).toBeDefined()
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
