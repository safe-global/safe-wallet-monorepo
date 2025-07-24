import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@/src/tests/test-utils'
import { PendingTxContainer } from './PendingTx.container'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'
import { faker } from '@faker-js/faker'

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
})
