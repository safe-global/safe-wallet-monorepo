import { render, screen, fireEvent } from '@/tests/test-utils'
import AppFrame from '@/components/safe-apps/AppFrame'
import {
  ConflictType,
  DetailedExecutionInfoType,
  LabelValue,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
} from '@safe-global/safe-gateway-typescript-sdk'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { getEmptySafeApp } from '@/components/safe-apps/utils'

const emptySafeApp = getEmptySafeApp()

describe('AppFrame', () => {
  it('should not show the transaction queue bar when there are no queued transactions', () => {
    render(<AppFrame appUrl="https://app.url" allowedFeaturesList="" safeAppFromManifest={emptySafeApp} />)

    expect(screen.queryAllByText('(0) Transaction queue').length).toBe(0)
  })

  it('should show queued transactions in the queue bar', () => {
    render(<AppFrame appUrl="https://app.url" allowedFeaturesList="" safeAppFromManifest={emptySafeApp} />, {
      initialReduxState: {
        safeInfo: {
          loading: true,
          data: defaultSafeInfo,
        },
        txQueue: {
          data: {
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
          loading: false,
          error: undefined,
        },
      },
    })

    expect(screen.getByText('(1) Transaction queue')).toBeInTheDocument()

    const expandBtn = screen.getByLabelText('expand transaction queue bar')
    fireEvent.click(expandBtn)

    expect(screen.getByText('On-chain rejection')).toBeInTheDocument()
  })
})
