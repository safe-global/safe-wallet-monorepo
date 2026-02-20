import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { TxHistoryList } from './TxHistoryList'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native')
  return { FlashList: FlatList }
})

describe('TxHistoryList', () => {
  const defaultProps = {
    onEndReached: jest.fn(),
    isLoading: false,
    isLoadingNext: false,
    isError: false,
    refreshing: false,
    onRefresh: jest.fn(),
  }

  const mockTransactions: HistoryTransactionItems[] = [
    {
      type: 'TRANSACTION',
      transaction: {
        txInfo: {
          type: 'Transfer',
          humanDescription: null,
          sender: { value: '0x123', name: null, logoUri: null },
          recipient: { value: '0x456', name: null, logoUri: null },
          direction: 'INCOMING',
          transferInfo: { type: 'NATIVE_COIN', value: '10000000000000' },
        },
        id: 'tx1',
        timestamp: 1742830570000,
        txStatus: 'SUCCESS',
        executionInfo: null,
        safeAppInfo: null,
        txHash: '0xabc',
      },
      conflictType: 'None',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error handling', () => {
    it('displays error component when isError is true and there are no transactions', () => {
      render(<TxHistoryList {...defaultProps} isError={true} transactions={undefined} />)

      // Verify error component is displayed
      expect(screen.getByTestId('tx-history-error')).toBeTruthy()
      expect(screen.getByText('Error fetching transactions')).toBeTruthy()
      expect(screen.getByText('Swipe down to retry')).toBeTruthy()
    })

    it('displays error component when isError is true and transactions array is empty', () => {
      render(<TxHistoryList {...defaultProps} isError={true} transactions={[]} />)

      // Verify error component is displayed
      expect(screen.getByTestId('tx-history-error')).toBeTruthy()
      expect(screen.getByText('Error fetching transactions')).toBeTruthy()
      expect(screen.getByText('Swipe down to retry')).toBeTruthy()
    })

    it('does not show error component during refresh even when isError is true', () => {
      render(<TxHistoryList {...defaultProps} isError={true} refreshing={true} transactions={undefined} />)

      // Verify error component is NOT displayed during refresh
      expect(screen.queryByTestId('tx-history-error')).toBeNull()
      expect(screen.queryByText('Error fetching transactions')).toBeNull()
    })

    it('does not show error component when there are transactions even if isError is true', () => {
      render(<TxHistoryList {...defaultProps} isError={true} transactions={mockTransactions} />)

      // Verify error component is NOT displayed when transactions exist
      expect(screen.queryByTestId('tx-history-error')).toBeNull()
    })

    it('allows swipe-to-retry from error state', () => {
      const onRefresh = jest.fn()

      render(<TxHistoryList {...defaultProps} isError={true} transactions={undefined} onRefresh={onRefresh} />)

      // Verify error component is displayed
      expect(screen.getByTestId('tx-history-error')).toBeTruthy()

      // Get the list component
      const list = screen.getByTestId('tx-history-list')

      // Trigger the refresh action (swipe down to refresh)
      fireEvent(list, 'onRefresh')

      // Verify onRefresh was called
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('transitions from error state to loading state when refreshing', () => {
      const { rerender } = render(<TxHistoryList {...defaultProps} isError={true} transactions={undefined} />)

      // Initially, error component should be displayed
      expect(screen.getByTestId('tx-history-error')).toBeTruthy()

      // Simulate the user pulling to refresh
      rerender(<TxHistoryList {...defaultProps} isError={true} transactions={undefined} refreshing={true} />)

      // Error component should no longer be displayed during refresh
      expect(screen.queryByTestId('tx-history-error')).toBeNull()
    })

    it('prioritizes error state over initial loading state when both conditions are met', () => {
      render(<TxHistoryList {...defaultProps} isError={true} isLoading={true} transactions={undefined} />)

      // Error should take priority over loading
      expect(screen.getByTestId('tx-history-error')).toBeTruthy()
      expect(screen.queryByTestId('tx-history-initial-loader')).toBeNull()
    })
  })

  describe('Loading states', () => {
    it('shows initial loading skeleton when loading without transactions', () => {
      render(<TxHistoryList {...defaultProps} isLoading={true} transactions={undefined} />)

      expect(screen.getByTestId('tx-history-initial-loader')).toBeTruthy()
    })

    it('does not show initial loading skeleton during refresh', () => {
      render(<TxHistoryList {...defaultProps} isLoading={true} refreshing={true} transactions={mockTransactions} />)

      expect(screen.queryByTestId('tx-history-initial-loader')).toBeNull()
    })

    it('shows footer loading component when loading next page', () => {
      render(<TxHistoryList {...defaultProps} isLoadingNext={true} transactions={mockTransactions} />)

      expect(screen.getByTestId('tx-history-next-loader')).toBeTruthy()
    })
  })
})
