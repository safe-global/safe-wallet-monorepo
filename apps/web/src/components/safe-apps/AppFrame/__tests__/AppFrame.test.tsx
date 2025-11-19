import { render, screen, fireEvent } from '@/tests/test-utils'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import * as transactionsApi from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  ConflictType,
  DetailedExecutionInfoType,
  LabelValue,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
} from '@safe-global/store/gateway/types'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const emptySafeApp = getEmptySafeApp()

const useTransactionsGetTransactionQueueV1QueryMock = jest.spyOn(
  transactionsApi,
  'useTransactionsGetTransactionQueueV1Query',
)

describe('AppFrame', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock returns empty queue
    useTransactionsGetTransactionQueueV1QueryMock.mockReturnValue({
      currentData: { results: [] },
      isLoading: false,
      error: undefined,
    } as any)

    // Mock useSafeInfo to return safeLoaded: true
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({
          chainId: '5',
          implementation: { value: '0x1234567890123456789012345678901234567890' } as any,
        })
        .build(),
      safeAddress: '0x1234567890123456789012345678901234567890',
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  it('should not show the transaction queue bar when there are no queued transactions', () => {
    render(<AppFrame appUrl="https://app.url" allowedFeaturesList="" safeAppFromManifest={emptySafeApp} />)

    expect(screen.queryAllByText('(0) Transaction queue').length).toBe(0)
  })

  it('should show queued transactions in the queue bar', async () => {
    // Mock the RTK Query hook to return a transaction in the queue
    useTransactionsGetTransactionQueueV1QueryMock.mockReturnValue({
      currentData: {
        results: [
          {
            type: TransactionListItemType.LABEL,
            label: LabelValue.Next,
          },
          {
            type: TransactionListItemType.TRANSACTION,
            transaction: {
              id: 'multisig_0x1A84c9Fa70b94aFa053073851766E61e8F45029D_0x457db826b96f73dde4d13d2491f0a7be06ec7e6f9d7f0fb09efa48f79b6dd93d',
              timestamp: 1663759037121,
              txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
              txInfo: {
                type: TransactionInfoType.CUSTOM,
                to: {
                  value: '0x1A84c9Fa70b94aFa053073851766E61e8F45029D',
                },
                dataSize: '0',
                value: '0',
                methodName: undefined,
                isCancellation: true,
              },
              executionInfo: {
                type: DetailedExecutionInfoType.MULTISIG,
                nonce: 3,
                confirmationsRequired: 2,
                confirmationsSubmitted: 1,
                missingSigners: [
                  {
                    value: '0xbc2BB26a6d821e69A38016f3858561a1D80d4182',
                  },
                ],
              },
              txHash: null,
            },
            conflictType: ConflictType.NONE,
          },
        ],
      },
      isLoading: false,
      error: undefined,
    } as any)

    render(<AppFrame appUrl="https://app.url" allowedFeaturesList="" safeAppFromManifest={emptySafeApp} />)

    // Wait for the component to render the queue bar
    const queueText = await screen.findByText('(1) Transaction queue')
    expect(queueText).toBeInTheDocument()

    const expandBtn = screen.getByLabelText('expand transaction queue bar')
    fireEvent.click(expandBtn)

    expect(await screen.findByText('On-chain rejection')).toBeInTheDocument()
  })
})
