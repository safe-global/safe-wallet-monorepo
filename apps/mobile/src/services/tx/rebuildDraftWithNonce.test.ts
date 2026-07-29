import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { DraftTx } from '@/src/store/draftTxSlice'
import type { AppDispatch } from '@/src/store'
import { getVerifiedSafeSDK, previewAndStashDraft } from './draft'
import { rebuildDraftWithNonce } from './rebuildDraftWithNonce'

jest.mock('./draft', () => ({
  getVerifiedSafeSDK: jest.fn(),
  previewAndStashDraft: jest.fn(),
}))

const mockGetVerifiedSafeSDK = getVerifiedSafeSDK as jest.MockedFunction<typeof getVerifiedSafeSDK>
const mockPreviewAndStashDraft = previewAndStashDraft as jest.MockedFunction<typeof previewAndStashDraft>

const safe = { owners: [], threshold: 1 }
const dispatch = jest.fn() as unknown as AppDispatch

const buildDraft = (buildParams: Partial<DraftTx['buildParams']>): DraftTx => ({
  chainId: '1',
  safeAddress: faker.finance.ethereumAddress(),
  buildParams: { to: faker.finance.ethereumAddress(), value: '0', data: '0x', nonce: 7, ...buildParams },
  safeTxHash: '0xoldhash',
  txDetails: { txId: '0xoldhash' } as TransactionDetails,
})

describe('rebuildDraftWithNonce', () => {
  const createTransaction = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    createTransaction.mockResolvedValue({ data: {} })
    mockGetVerifiedSafeSDK.mockResolvedValue({ createTransaction } as unknown as Awaited<
      ReturnType<typeof getVerifiedSafeSDK>
    >)
    mockPreviewAndStashDraft.mockResolvedValue('0xnewhash')
  })

  it('recreates the transaction with the new nonce and untouched calldata', async () => {
    const draft = buildDraft({ data: '0xdeadbeef', value: '123' })

    const result = await rebuildDraftWithNonce({ draft, newNonce: 42, safe, dispatch })

    expect(result).toEqual('0xnewhash')
    expect(createTransaction).toHaveBeenCalledWith({
      transactions: [
        {
          to: draft.buildParams.to,
          value: '123',
          data: '0xdeadbeef',
          operation: OperationType.Call,
        },
      ],
      options: { nonce: 42 },
    })
    expect(mockPreviewAndStashDraft).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: draft.chainId, safeAddress: draft.safeAddress, safe, dispatch }),
    )
  })

  it('preserves a delegate call operation of an encoded multiSend', async () => {
    const draft = buildDraft({ operation: OperationType.DelegateCall })

    await rebuildDraftWithNonce({ draft, newNonce: 8, safe, dispatch })

    const { transactions } = createTransaction.mock.calls[0][0]
    expect(transactions[0].operation).toEqual(OperationType.DelegateCall)
  })

  it('defaults missing value and data', async () => {
    const draft = buildDraft({ value: undefined, data: undefined })

    await rebuildDraftWithNonce({ draft, newNonce: 8, safe, dispatch })

    const { transactions } = createTransaction.mock.calls[0][0]
    expect(transactions[0]).toEqual(expect.objectContaining({ value: '0', data: '0x' }))
  })

  it('throws when the draft has no target', async () => {
    const draft = buildDraft({ to: undefined })

    await expect(rebuildDraftWithNonce({ draft, newNonce: 8, safe, dispatch })).rejects.toThrow(
      'Draft transaction has no target to rebuild',
    )
    expect(mockPreviewAndStashDraft).not.toHaveBeenCalled()
  })
})
