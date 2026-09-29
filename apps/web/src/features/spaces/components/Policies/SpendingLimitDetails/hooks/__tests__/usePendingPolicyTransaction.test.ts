import { act, renderHook } from '@testing-library/react'
import {
  useTransactionsGetTransactionByIdV1Query,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import {
  multisigConfirmationBuilder,
  multisigExecutionDetailsBuilder,
  transactionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import { mockPendingPolicy } from '../../../mocks/policies'
import { getPendingTxId } from '../../../utils/mapPendingPolicies'
import { usePendingPolicyTransaction } from '../usePendingPolicyTransaction'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/transactions'),
  useTransactionsGetTransactionByIdV1Query: jest.fn(),
}))

const mockUseQuery = useTransactionsGetTransactionByIdV1Query as jest.Mock

const OWNER_A = '0x00000000000000000000000000000000000000A1'
const OWNER_B = '0x00000000000000000000000000000000000000B2'

const policy = mockPendingPolicy()

const details = ({
  txStatus = 'AWAITING_CONFIRMATIONS',
  confirmedBy = [OWNER_A],
}: {
  txStatus?: TransactionDetails['txStatus']
  confirmedBy?: string[]
} = {}): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txId: getPendingTxId(policy),
      txStatus,
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({
          confirmationsRequired: 2,
          confirmations: confirmedBy.map((value) => multisigConfirmationBuilder().with({ signer: { value } }).build()),
        })
        .build(),
    })
    .build()

const mockQuery = ({
  currentData,
  error,
  refetch = jest.fn(),
}: {
  currentData?: TransactionDetails
  error?: unknown
  refetch?: jest.Mock
}) => mockUseQuery.mockReturnValue({ currentData, error, refetch })

describe('usePendingPolicyTransaction', () => {
  it('asks CGW for the queued transaction on the policy chain', () => {
    mockQuery({})
    renderHook(() => usePendingPolicyTransaction(policy))

    expect(mockUseQuery).toHaveBeenCalledWith(
      { chainId: policy.safe.chainId, id: getPendingTxId(policy) },
      expect.anything(),
    )
  })

  it('lists who confirmed, with the fresh count and the summary the review flow needs', () => {
    mockQuery({ currentData: details({ confirmedBy: [OWNER_A, OWNER_B] }) })
    const { result } = renderHook(() => usePendingPolicyTransaction(policy))

    expect(result.current.confirmedBy).toEqual([OWNER_A, OWNER_B])
    expect(result.current.confirmationsSubmitted).toBe(2)
    expect(result.current.txSummary?.id).toBe(getPendingTxId(policy))
    expect(result.current.outcome).toBeUndefined()
  })

  it.each([
    ['SUCCESS', 'executed'],
    ['FAILED', 'failed'],
    ['CANCELLED', 'replaced'],
  ] as const)('reads a %s transaction as %s', (txStatus, outcome) => {
    mockQuery({ currentData: details({ txStatus }) })
    const { result } = renderHook(() => usePendingPolicyTransaction(policy))

    expect(result.current.outcome).toBe(outcome)
  })

  it('reads a 404 as deleted', () => {
    mockQuery({ error: { status: 404, data: {} } })
    const { result } = renderHook(() => usePendingPolicyTransaction(policy))

    expect(result.current.outcome).toBe('deleted')
  })

  it('does not call a transaction gone when the request merely failed', () => {
    mockQuery({ error: { status: 500, data: {} } })
    const { result } = renderHook(() => usePendingPolicyTransaction(policy))

    expect(result.current.outcome).toBeUndefined()
    expect(result.current.txSummary).toBeUndefined()
    expect(result.current.confirmedBy).toEqual([])
  })

  it.each([
    TxEvent.SIGNATURE_PROPOSED,
    TxEvent.ONCHAIN_SIGNATURE_SUCCESS,
    TxEvent.PROCESSED,
    TxEvent.SUCCESS,
    TxEvent.DELETED,
  ])('refetches on %s', (event) => {
    const refetch = jest.fn()
    mockQuery({ currentData: details(), refetch })
    renderHook(() => usePendingPolicyTransaction(policy))

    act(() => {
      // Only the subscription matters here, so the payload is not shaped per event.
      txDispatch(event, { txId: getPendingTxId(policy) } as never)
    })

    expect(refetch).toHaveBeenCalled()
  })
})
