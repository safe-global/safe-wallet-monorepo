import { useSpaceSafesGetPendingTransactionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpacePendingTransactionsPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

const DEFAULT_LIMIT = 20

const MOCK_DATA: SpacePendingTransactionsPage = {
  count: 5,
  next: null,
  previous: null,
  results: [
    {
      type: 'CONFLICT_HEADER',
      nonce: 42,
    },
    {
      type: 'LABEL',
      label: 'Next',
    },
    {
      type: 'TRANSACTION',
      transaction: {
        txInfo: {
          type: 'Transfer',
          humanDescription: 'Send 1 ETH',
          sender: { value: '0xaaaa567890abcdef1234567890abcdef12345678' },
          recipient: { value: '0xcccc567890abcdef1234567890abcdef12345678' },
          direction: 'OUTGOING',
          transferInfo: {
            type: 'NATIVE_COIN',
            value: '1000000000000000000',
          },
        } as TransactionQueuedItem['transaction']['txInfo'],
        id: 'multisig_0x1234_0xabc123',
        txHash: null,
        timestamp: 1741190400000,
        txStatus: 'AWAITING_CONFIRMATIONS',
        executionInfo: {
          type: 'MULTISIG',
          nonce: 42,
          confirmationsRequired: 3,
          confirmationsSubmitted: 1,
          missingSigners: [
            { value: '0xaaaa567890abcdef1234567890abcdef12345678', name: 'Alice' },
            { value: '0xbbbb567890abcdef1234567890abcdef12345678', name: 'Bob' },
          ],
        },
        safeAppInfo: null,
      },
      conflictType: 'None',
    },
    {
      type: 'TRANSACTION',
      transaction: {
        txInfo: {
          type: 'Custom',
          humanDescription: 'Approve USDC spending',
          to: { value: '0xdddd567890abcdef1234567890abcdef12345678', name: 'USDC' },
          dataSize: '68',
          value: '0',
          methodName: 'approve',
          isCancellation: false,
        } as TransactionQueuedItem['transaction']['txInfo'],
        id: 'multisig_0x1234_0xdef456',
        txHash: null,
        timestamp: 1741104000000,
        txStatus: 'AWAITING_CONFIRMATIONS',
        executionInfo: {
          type: 'MULTISIG',
          nonce: 43,
          confirmationsRequired: 3,
          confirmationsSubmitted: 2,
          missingSigners: [{ value: '0xcccc567890abcdef1234567890abcdef12345678', name: 'Charlie' }],
        },
        safeAppInfo: null,
      },
      conflictType: 'None',
    },
    {
      type: 'TRANSACTION',
      transaction: {
        txInfo: {
          type: 'Transfer',
          humanDescription: 'Send 500 USDC',
          sender: { value: '0xeeee567890abcdef1234567890abcdef12345678' },
          recipient: { value: '0xffff567890abcdef1234567890abcdef12345678' },
          direction: 'OUTGOING',
          transferInfo: {
            type: 'ERC20',
            tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            tokenName: 'USD Coin',
            tokenSymbol: 'USDC',
            logoUri: '',
            decimals: 6,
            value: '500000000',
          },
        } as TransactionQueuedItem['transaction']['txInfo'],
        id: 'multisig_0x9876_0x789012',
        txHash: null,
        timestamp: 1741276800000,
        txStatus: 'AWAITING_CONFIRMATIONS',
        executionInfo: {
          type: 'MULTISIG',
          nonce: 12,
          confirmationsRequired: 2,
          confirmationsSubmitted: 0,
          missingSigners: [
            { value: '0xdddd567890abcdef1234567890abcdef12345678', name: 'Dave' },
            { value: '0xeeee567890abcdef1234567890abcdef12345678', name: 'Eve' },
          ],
        },
        safeAppInfo: null,
      },
      conflictType: 'None',
    },
  ],
}

const isTransactionItem = (
  item: SpacePendingTransactionsPage['results'][number],
): item is TransactionQueuedItem => item.type === 'TRANSACTION'

// TODO: Remove mock data and uncomment real API call
export const useSpacePendingTransactions = (_limit = DEFAULT_LIMIT, _offset = 0) => {
  // const spaceId = useCurrentSpaceId()
  // const isUserSignedIn = useAppSelector(isAuthenticated)
  //
  // const { data, isLoading, error, refetch } = useSpaceSafesGetPendingTransactionsV1Query(
  //   { spaceId: Number(spaceId), limit, offset },
  //   { skip: !isUserSignedIn || !spaceId },
  // )

  const data = MOCK_DATA
  const transactions = data.results.filter(isTransactionItem)

  return {
    data,
    transactions,
    count: data.count ?? 0,
    isLoading: false,
    error: undefined,
    refetch: () => {},
  }
}
