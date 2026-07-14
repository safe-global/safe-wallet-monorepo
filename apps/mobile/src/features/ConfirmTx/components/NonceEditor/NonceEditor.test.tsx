import React from 'react'
import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createTestStore, fireEvent, renderWithStore, waitFor } from '@/src/tests/test-utils'
import { selectDraftByHash, selectDraftRedirect, type DraftTx } from '@/src/store/draftTxSlice'
import { rebuildDraftWithNonce } from '@/src/services/tx/rebuildDraftWithNonce'
import { NonceEditor } from './NonceEditor'

jest.mock('@/src/services/tx/rebuildDraftWithNonce', () => ({
  rebuildDraftWithNonce: jest.fn(),
}))

// The global @gorhom/bottom-sheet mock lacks useBottomSheet, which the shared backdrop needs
jest.mock('@/src/components/Dropdown/sheetComponents', () => ({
  BackdropComponent: () => null,
  BackgroundComponent: () => null,
}))

jest.mock('@/src/features/Send/hooks/useNonce', () => ({
  useNonce: jest.fn(() => ({
    recommendedNonce: 10,
    currentNonce: 5,
    queuedNonces: [{ nonce: 7, label: 'Send transaction' }],
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

const createStoreWithDraft = () =>
  createTestStore({
    draftTx: { drafts: { [DRAFT_HASH]: buildDraft() }, redirects: {} },
  })

describe('NonceEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRebuildDraftWithNonce.mockResolvedValue('0xnewhash')
  })

  it('renders nothing for a transaction without a draft', () => {
    const store = createTestStore({ draftTx: { drafts: {}, redirects: {} } })

    const { queryByTestId } = renderWithStore(<NonceEditor txId={DRAFT_HASH} />, store)

    expect(queryByTestId('nonce-row')).toBeNull()
  })

  it('shows the draft nonce', () => {
    const { getByTestId } = renderWithStore(<NonceEditor txId={DRAFT_HASH} />, createStoreWithDraft())

    expect(getByTestId('nonce-row-value')).toHaveTextContent('7')
  })

  it('rebuilds the draft and redirects to the new hash when another nonce is picked', async () => {
    const store = createStoreWithDraft()
    const { getByTestId } = renderWithStore(<NonceEditor txId={DRAFT_HASH} />, store)

    fireEvent.press(getByTestId('nonce-row'))
    fireEvent.press(getByTestId('nonce-recommended'))

    await waitFor(() => {
      expect(mockRebuildDraftWithNonce).toHaveBeenCalledWith(
        expect.objectContaining({ newNonce: 10, safe: { owners, threshold: 1 } }),
      )
      expect(selectDraftRedirect(store.getState(), DRAFT_HASH)).toEqual('0xnewhash')
      expect(selectDraftByHash(store.getState(), DRAFT_HASH)).toBeUndefined()
    })
  })

  it('does not rebuild when the already selected nonce is picked again', async () => {
    const store = createStoreWithDraft()
    const { getByTestId } = renderWithStore(<NonceEditor txId={DRAFT_HASH} />, store)

    fireEvent.press(getByTestId('nonce-row'))
    fireEvent.press(getByTestId('nonce-queued-7'))

    await waitFor(() => {
      expect(mockRebuildDraftWithNonce).not.toHaveBeenCalled()
      expect(selectDraftByHash(store.getState(), DRAFT_HASH)).toBeDefined()
    })
  })
})
