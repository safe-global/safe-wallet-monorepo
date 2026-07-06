import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import { decodeMultiSendData, encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Multi_send__factory } from '@safe-global/utils/types/contracts'
import {
  ERC20_INTERFACE,
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { UNLIMITED_APPROVAL_AMOUNT } from '@safe-global/utils/utils/tokens'
import { TokenType } from '@safe-global/store/gateway/types'
import type { DraftTx } from '@/src/store/draftTxSlice'
import type { AppDispatch } from '@/src/store'
import { getVerifiedSafeSDK, previewAndStashDraft } from './draft'
import { rebuildDraftWithApproval } from './rebuildDraftWithApproval'

jest.mock('./draft', () => ({
  getVerifiedSafeSDK: jest.fn(),
  previewAndStashDraft: jest.fn(),
}))

const mockGetVerifiedSafeSDK = getVerifiedSafeSDK as jest.MockedFunction<typeof getVerifiedSafeSDK>
const mockPreviewAndStashDraft = previewAndStashDraft as jest.MockedFunction<typeof previewAndStashDraft>

const MULTISEND_INTERFACE = Multi_send__factory.createInterface()

const tokenAddress = faker.finance.ethereumAddress()
const spender = faker.finance.ethereumAddress()
const safe = { owners: [], threshold: 1 }
const dispatch = jest.fn() as unknown as AppDispatch

const buildApproval = (overrides: Partial<ApprovalInfo> = {}): ApprovalInfo => ({
  tokenInfo: { address: tokenAddress, symbol: 'USDC', decimals: 6, type: TokenType.ERC20 },
  tokenAddress,
  spender,
  amount: parseUnits('100', 6),
  amountFormatted: '100',
  method: 'approve',
  transactionIndex: 0,
  ...overrides,
})

const buildDraft = (buildParams: Partial<DraftTx['buildParams']>): DraftTx => ({
  chainId: '1',
  safeAddress: faker.finance.ethereumAddress(),
  buildParams: { to: tokenAddress, value: '0', data: '0x', nonce: 7, ...buildParams },
  safeTxHash: '0xoldhash',
  txDetails: { txId: '0xoldhash' } as TransactionDetails,
})

describe('rebuildDraftWithApproval', () => {
  const createTransaction = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    createTransaction.mockResolvedValue({ data: {} })
    mockGetVerifiedSafeSDK.mockResolvedValue({ createTransaction } as unknown as Awaited<
      ReturnType<typeof getVerifiedSafeSDK>
    >)
    mockPreviewAndStashDraft.mockResolvedValue('0xnewhash')
  })

  it('re-encodes a single approve call and preserves the nonce', async () => {
    const approval = buildApproval()
    const draft = buildDraft({
      data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, approval.amount]),
    })

    const result = await rebuildDraftWithApproval({ draft, approval, newValue: '250', safe, dispatch })

    expect(result).toEqual('0xnewhash')
    expect(createTransaction).toHaveBeenCalledWith({
      transactions: [
        {
          to: approval.tokenAddress,
          value: '0',
          data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, parseUnits('250', 6)]),
          operation: OperationType.Call,
        },
      ],
      options: { nonce: 7 },
    })
    expect(mockPreviewAndStashDraft).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: draft.chainId, safeAddress: draft.safeAddress, safe, dispatch }),
    )
  })

  it('encodes the unlimited pseudo value as the unlimited amount', async () => {
    const approval = buildApproval()
    const draft = buildDraft({
      data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, approval.amount]),
    })

    await rebuildDraftWithApproval({ draft, approval, newValue: PSEUDO_APPROVAL_VALUES.UNLIMITED, safe, dispatch })

    const { transactions } = createTransaction.mock.calls[0][0]
    const [, amount] = ERC20_INTERFACE.decodeFunctionData('approve', transactions[0].data)
    expect(amount).toEqual(UNLIMITED_APPROVAL_AMOUNT)
  })

  it('only re-encodes the approval inside a multiSend batch', async () => {
    const approval = buildApproval({ transactionIndex: 1 })
    const otherTx = {
      to: faker.finance.ethereumAddress(),
      value: '123',
      data: '0xbaddad',
      operation: OperationType.Call,
    }
    const multiSendData = encodeMultiSendData([
      otherTx,
      {
        to: tokenAddress,
        value: '0',
        data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, approval.amount]),
        operation: OperationType.Call,
      },
    ])
    const multiSendCalldata = MULTISEND_INTERFACE.encodeFunctionData('multiSend', [multiSendData])
    const draft = buildDraft({
      to: faker.finance.ethereumAddress(),
      data: multiSendCalldata,
      operation: 1,
    })

    await rebuildDraftWithApproval({ draft, approval, newValue: '1', safe, dispatch })

    const { transactions } = createTransaction.mock.calls[0][0]
    expect(transactions).toHaveLength(2)
    // decodeMultiSendData checksums addresses, so compare via the decoded original
    expect(transactions[0]).toEqual({ ...decodeMultiSendData(multiSendCalldata)[0], operation: OperationType.Call })
    const [decodedSpender, amount] = ERC20_INTERFACE.decodeFunctionData('approve', transactions[1].data)
    expect(decodedSpender.toLowerCase()).toEqual(spender.toLowerCase())
    expect(amount).toEqual(parseUnits('1', 6))
  })

  it('throws when the draft has no calldata', async () => {
    const draft = buildDraft({ data: undefined })

    await expect(
      rebuildDraftWithApproval({ draft, approval: buildApproval(), newValue: '1', safe, dispatch }),
    ).rejects.toThrow('Draft transaction has no calldata to update')
  })

  it('throws instead of silently no-oping when the approval does not match its inner transaction', async () => {
    const draft = buildDraft({
      data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, buildApproval().amount]),
    })

    // transactionIndex out of bounds
    await expect(
      rebuildDraftWithApproval({
        draft,
        approval: buildApproval({ transactionIndex: 3 }),
        newValue: '1',
        safe,
        dispatch,
      }),
    ).rejects.toThrow('Failed to re-encode the approval transaction')

    // inner tx is not an approve/increaseAllowance call
    const transferDraft = buildDraft({ data: '0xbaddad' })
    await expect(
      rebuildDraftWithApproval({ draft: transferDraft, approval: buildApproval(), newValue: '1', safe, dispatch }),
    ).rejects.toThrow('Failed to re-encode the approval transaction')

    expect(mockPreviewAndStashDraft).not.toHaveBeenCalled()
  })

  it('throws instead of silently no-oping when the approval has no token metadata', async () => {
    const approval = buildApproval({ tokenInfo: undefined })
    const draft = buildDraft({
      data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, approval.amount]),
    })

    await expect(rebuildDraftWithApproval({ draft, approval, newValue: '1', safe, dispatch })).rejects.toThrow(
      'Cannot re-encode the approval without token metadata',
    )
    expect(mockPreviewAndStashDraft).not.toHaveBeenCalled()
  })
})
