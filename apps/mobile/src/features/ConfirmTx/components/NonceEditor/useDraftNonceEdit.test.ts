import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { act, createTestStore, renderHookWithStore, waitFor } from '@/src/tests/test-utils'
import { selectDraftByHash, selectDraftRedirect, type DraftTx } from '@/src/store/draftTxSlice'
import { selectToastQueue } from '@/src/store/toastSlice'
import { rebuildDraftWithNonce } from '@/src/services/tx/rebuildDraftWithNonce'
import { useDraftNonceEdit } from './useDraftNonceEdit'

jest.mock('@/src/services/tx/rebuildDraftWithNonce', () => ({
  rebuildDraftWithNonce: jest.fn(),
}))

jest.mock('@/src/features/Send/hooks/useNonce', () => ({
  useNonce: jest.fn(() => ({
    recommendedNonce: 10,
    currentNonce: 5,
    queuedNonces: [],
    fetchMore: jest.fn(),
    isFetchingMore: false,
    isLoading: false,
    hasMore: false,
  })),
}))

const mockRebuildDraftWithNonce = rebuildDraftWithNonce as jest.MockedFunction<typeof rebuildDraftWithNonce>

const DRAFT_HASH = '0xdrafthash'
const owners = [{ value: faker.finance.ethereumAddress(), name: null, logoUri: null }]

const buildDraft = (): DraftTx => ({
  chainId: '1',
  safeAddress: faker.finance.ethereumAddress(),
  buildParams: { to: faker.finance.ethereumAddress(), value: '0', data: '0x', nonce: 7 },
  safeTxHash: DRAFT_HASH,
  txDetails: {
    txId: DRAFT_HASH,
    detailedExecutionInfo: { type: 'MULTISIG', signers: owners, confirmationsRequired: 1 },
  } as TransactionDetails,
})

const renderDraftNonceEdit = () => {
  const store = createTestStore({
    draftTx: { drafts: { [DRAFT_HASH]: buildDraft() }, redirects: {} },
  })
  return renderHookWithStore(() => useDraftNonceEdit(buildDraft()), store)
}

describe('useDraftNonceEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRebuildDraftWithNonce.mockResolvedValue('0xnewhash')
  })

  it('rebuilds the draft when a custom nonce is saved and closes the modal', async () => {
    const { result, store } = renderDraftNonceEdit()

    act(() => result.current.handleSaveCustomNonce(42))

    expect(result.current.showCustomNonceModal).toBe(false)
    await waitFor(() => {
      expect(mockRebuildDraftWithNonce).toHaveBeenCalledWith(
        expect.objectContaining({ newNonce: 42, safe: { owners, threshold: 1 } }),
      )
      expect(selectDraftRedirect(store.getState(), DRAFT_HASH)).toEqual('0xnewhash')
      expect(result.current.isRebuilding).toBe(false)
    })
  })

  it('opens the custom nonce modal after the sheet dismiss delay, collapsing rapid taps', () => {
    jest.useFakeTimers()
    try {
      const { result } = renderDraftNonceEdit()

      act(() => result.current.handleAddCustomNonce())
      act(() => result.current.handleAddCustomNonce())
      expect(result.current.showCustomNonceModal).toBe(false)

      act(() => jest.advanceTimersByTime(300))
      expect(result.current.showCustomNonceModal).toBe(true)
    } finally {
      jest.useRealTimers()
    }
  })

  it('shows an error toast and keeps the draft when the rebuild fails', async () => {
    mockRebuildDraftWithNonce.mockRejectedValue(new Error('preview failed'))
    const { result, store } = renderDraftNonceEdit()

    act(() => result.current.handleSelectNonce(10))

    await waitFor(() => {
      expect(selectToastQueue(store.getState())).toEqual([
        expect.objectContaining({ message: 'Failed to update the nonce', variant: 'error' }),
      ])
      expect(result.current.isRebuilding).toBe(false)
    })
    expect(selectDraftByHash(store.getState(), DRAFT_HASH)).toBeDefined()
    expect(selectDraftRedirect(store.getState(), DRAFT_HASH)).toBeUndefined()
  })
})
