import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@/src/tests/test-utils'
import { PendingTxContainer } from './PendingTx.container'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'
import { faker } from '@faker-js/faker'
import { keyExtractor } from './utils'
import { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { PendingTransactionItems, TransactionListItemType } from '@safe-global/store/gateway/types'

// Create a mutable object for the mock
const mockSafeState = {
  safe: { chainId: '1', address: faker.finance.ethereumAddress() as `0x${string}` },
}

// Mock active safe selector to use the mutable state
jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => mockSafeState.safe,
}))

const mockPendingTransactions = [
  { type: 'LABEL', label: 'Next' },
  {
    type: 'TRANSACTION',
    transaction: {
      id: 'multisig_0x123_0xabc123',
      timestamp: 1642730570000,
      txStatus: 'AWAITING_CONFIRMATIONS',
      txInfo: {
        type: 'Transfer',
        sender: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
        recipient: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
        direction: 'OUTGOING',
        transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000000' },
      },
      executionInfo: {
        type: 'MULTISIG',
        nonce: 42,
        confirmationsRequired: 2,
        confirmationsSubmitted: 1,
        missingSigners: [{ value: faker.finance.ethereumAddress() }],
      },
    },
    conflictType: 'None',
  },
]

describe('PendingTxContainer', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockSafeState.safe = { chainId: '1', address: faker.finance.ethereumAddress() as `0x${string}` }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, () => {
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: mockPendingTransactions,
        })
      }),
    )
  })

  it('renders pending transactions list', async () => {
    render(<PendingTxContainer />)

    // Wait for the transactions to be loaded
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeTruthy()
    })

    // Check if the list is rendered
    expect(screen.getByTestId('pending-tx-list')).toBeTruthy()
  })

  it('shows initial loading skeleton when first loading transactions', async () => {
    // Mock server to return delayed response to capture loading state
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, async () => {
        // Add short delay to capture loading state
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: mockPendingTransactions,
        })
      }),
    )

    render(<PendingTxContainer />)

    // Check if initial loading skeleton is shown
    expect(screen.getByTestId('pending-tx-initial-loader')).toBeTruthy()

    // Wait for transactions to load and loading skeleton to disappear
    await waitFor(
      () => {
        expect(screen.queryByTestId('pending-tx-initial-loader')).toBeNull()
        expect(screen.getByText('Next')).toBeTruthy()
      },
      { timeout: 3000 },
    )
  }, 10000)

  it('triggers refresh functionality when onRefresh is called', async () => {
    render(<PendingTxContainer />)

    // Wait for initial transactions to load
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeTruthy()
    })

    const list = screen.getByTestId('pending-tx-list')

    // Verify refresh control is properly configured
    expect(list).toBeTruthy()

    // Trigger refresh and verify it works without errors
    await act(async () => {
      fireEvent(list, 'onRefresh')
    })

    // The refresh should complete successfully (no errors)
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeTruthy()
    })

    // Verify the list is still rendered after refresh
    expect(screen.getByTestId('pending-tx-list')).toBeTruthy()
  })

  it('shows progress indicator when refreshing', async () => {
    render(<PendingTxContainer />)

    // Wait for initial transactions to load
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeTruthy()
    })

    // Reset server to use delayed response for refresh, so we can capture the refreshing state
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, async () => {
        // Add delay to capture refreshing state
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: mockPendingTransactions,
        })
      }),
    )

    const list = screen.getByTestId('pending-tx-list')

    // Trigger refresh
    await act(async () => {
      fireEvent(list, 'onRefresh')
    })

    // Check if custom progress indicator is shown during refresh
    await waitFor(
      () => {
        expect(screen.getByTestId('pending-tx-progress-indicator')).toBeTruthy()
      },
      { timeout: 500 },
    )

    // Wait for refresh to complete and progress indicator to disappear
    await waitFor(
      () => {
        expect(screen.queryByTestId('pending-tx-progress-indicator')).toBeNull()
      },
      { timeout: 2000 },
    )

    // Verify the list is still functional after refresh
    expect(screen.getByText('Next')).toBeTruthy()
  }, 10000)

  it('does not show initial skeleton when refreshing', async () => {
    render(<PendingTxContainer />)

    // Wait for initial transactions to load
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeTruthy()
    })

    // Trigger refresh
    const list = screen.getByTestId('pending-tx-list')

    await act(async () => {
      fireEvent(list, 'onRefresh')
    })

    // Should not show initial skeleton during refresh
    expect(screen.queryByTestId('pending-tx-initial-loader')).toBeNull()
  })

  it('handles empty state when no transactions exist', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      }),
    )

    render(<PendingTxContainer />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByTestId('pending-tx-initial-loader')).toBeNull()
      },
      { timeout: 3000 },
    )

    // Should show empty state message
    expect(screen.getByTestId('pending-tx-empty-state')).toBeTruthy()
    expect(screen.getByText('Queued transactions will appear here')).toBeTruthy()

    // Should not show any section headers
    expect(screen.queryByText('Next')).toBeNull()
    expect(screen.queryByText('In queue')).toBeNull()

    // List should still be rendered
    expect(screen.getByTestId('pending-tx-list')).toBeTruthy()
  }, 10000)

  describe('keyExtractor', () => {
    const createMockTransaction = (
      id: string,
      txHash: string | null,
      confirmationsSubmitted?: number,
    ): TransactionQueuedItem => ({
      type: TransactionListItemType.TRANSACTION,
      transaction: {
        id,
        txHash,
        timestamp: 1642730570000,
        txStatus: 'AWAITING_CONFIRMATIONS',
        txInfo: {
          type: 'Transfer',
          sender: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
          recipient: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
          direction: 'OUTGOING',
          transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000000' },
        },
        executionInfo:
          confirmationsSubmitted !== undefined
            ? {
                type: 'MULTISIG',
                nonce: 42,
                confirmationsRequired: 2,
                confirmationsSubmitted,
                missingSigners: [],
              }
            : null,
      },
      conflictType: 'None',
    })

    it('generates unique keys for duplicate transactions with same ID and confirmationsSubmitted', () => {
      const txId =
        'multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0xf1bc2b8e93791cf1fe3a11c0d5dc6d74672fd704584762b74cd3169ea09f21901'
      const tx1 = createMockTransaction(txId, null, 2)
      const tx2 = createMockTransaction(txId, null, 2)

      const key1 = keyExtractor(tx1, 0)
      const key2 = keyExtractor(tx2, 1)

      expect(key1).not.toBe(key2)
      expect(key1).toContain(txId)
      expect(key2).toContain(txId)
      expect(key1).toContain('2') // confirmationsSubmitted
      expect(key2).toContain('2') // confirmationsSubmitted
      expect(key1).toContain('0') // index
      expect(key2).toContain('1') // index
    })

    it('includes section prefix in keys when provided', () => {
      const tx = createMockTransaction('multisig_0x123', '0xabc', 1)
      const section = { title: 'Next' }

      const key = keyExtractor(tx, 0, section)

      expect(key).toContain('Next_')
      expect(key).toContain('multisig_0x123')
    })

    it('generates unique keys for transactions in different sections', () => {
      const txId = 'multisig_0x123'
      const tx = createMockTransaction(txId, null, 1)

      const key1 = keyExtractor(tx, 0, { title: 'Next' })
      const key2 = keyExtractor(tx, 0, { title: 'In queue' })

      expect(key1).not.toBe(key2)
      expect(key1).toContain('Next_')
      expect(key2).toContain('In queue_')
    })

    it('generates unique keys for bulk transactions with same hash', () => {
      const txHash = '0xabc123'
      const bulk1: TransactionQueuedItem[] = [
        createMockTransaction('multisig_0x1', txHash),
        createMockTransaction('multisig_0x2', txHash),
      ]
      const bulk2: TransactionQueuedItem[] = [
        createMockTransaction('multisig_0x3', txHash),
        createMockTransaction('multisig_0x4', txHash),
      ]

      const key1 = keyExtractor(bulk1, 0, { title: 'Next' })
      const key2 = keyExtractor(bulk2, 1, { title: 'Next' })

      expect(key1).not.toBe(key2)
      expect(key1).toContain(txHash)
      expect(key2).toContain(txHash)
      expect(key1).toContain('0')
      expect(key2).toContain('1')
    })

    it('generates unique keys for label items', () => {
      const label1: PendingTransactionItems = {
        type: TransactionListItemType.LABEL,
        label: 'Next',
      }
      const label2: PendingTransactionItems = {
        type: TransactionListItemType.LABEL,
        label: 'Next',
      }

      const key1 = keyExtractor(label1, 0)
      const key2 = keyExtractor(label2, 1)

      expect(key1).not.toBe(key2)
      expect(key1).toContain('0')
      expect(key2).toContain('1')
    })
  })
})
