import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@/src/tests/test-utils'
import { TxHistoryContainer } from './TxHistory.container'
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

jest.mock('react-native-collapsible-tab-view', () => {
  const { FlatList } = require('react-native')
  return { Tabs: { FlashList: FlatList } }
})

const sender = faker.finance.ethereumAddress()
const recipient = faker.finance.ethereumAddress()
const tokenAddress = faker.finance.ethereumAddress()
const txHash = faker.string.hexadecimal({ length: 66 })
const txHash1 = faker.string.hexadecimal({ length: 66 })
const mockTransactions = [
  { type: 'DATE_LABEL', timestamp: 1742830570000 },
  {
    type: 'TRANSACTION',
    transaction: {
      txInfo: {
        type: 'Transfer',
        humanDescription: null,
        sender: { value: sender, name: null, logoUri: null },
        recipient: { value: recipient, name: null, logoUri: null },
        direction: 'INCOMING',
        transferInfo: { type: 'NATIVE_COIN', value: '10000000000000' },
      },
      id: `transfer_${recipient}_${txHash}`,
      timestamp: 1742830570000,
      txStatus: 'SUCCESS',
      executionInfo: null,
      safeAppInfo: null,
      txHash,
    },
    conflictType: 'None',
  },
]

const nextPageTransactions = [
  {
    type: 'TRANSACTION',
    transaction: {
      txInfo: {
        type: 'Transfer',
        humanDescription: null,
        sender: {
          value: sender,
          name: null,
          logoUri: null,
        },
        recipient: {
          value: recipient,
          name: null,
          logoUri: null,
        },
        direction: 'INCOMING',
        transferInfo: {
          type: 'ERC721',
          tokenAddress,
          tokenId: '0',
          tokenName: null,
          tokenSymbol: null,
          logoUri: null,
          trusted: null,
        },
      },
      id: `transfer_${recipient}_${txHash1}`,
      timestamp: 1737029389000,
      txStatus: 'SUCCESS',
      executionInfo: null,
      safeAppInfo: null,
      txHash: txHash1,
    },
    conflictType: 'None',
  },
]

describe('TxHistoryContainer', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockSafeState.safe = { chainId: '1', address: faker.finance.ethereumAddress() as `0x${string}` }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, ({ request }) => {
        if (request.url.includes('cursor=next_page')) {
          return HttpResponse.json({
            count: 3,
            next: null,
            previous: `${GATEWAY_URL}/v1/chains/1/safes/0x123/transactions/history`,
            results: nextPageTransactions,
          })
        }

        // if safe address is 0x456, return mockTransactions
        if (request.url.includes('0x456')) {
          return HttpResponse.json({
            count: 3,
            next: `${GATEWAY_URL}/v1/chains/1/safes/0x456/transactions/history?cursor=next_page`,
            previous: null,
            results: [...mockTransactions, ...nextPageTransactions],
          })
        }

        return HttpResponse.json({
          next: `${GATEWAY_URL}/v1/chains/1/safes/0x123/transactions/history?cursor=next_page`,
          previous: null,
          results: mockTransactions,
        })
      }),
    )
  })

  it('renders transaction history list', async () => {
    render(<TxHistoryContainer />)

    // Wait for the transactions to be loaded
    await waitFor(() => {
      expect(screen.getByText('Received')).toBeTruthy()
    })

    // Check if both transactions are rendered
    const transfers = screen.getAllByText('Received')
    expect(transfers).toHaveLength(1)
  })

  it('loads more transactions when scrolling to the bottom', async () => {
    render(<TxHistoryContainer />)

    // Wait for initial transactions to load
    await waitFor(() => {
      const transfers = screen.getAllByText('Received')
      expect(transfers).toHaveLength(1)
    })

    // Simulate scrolling to the bottom
    const list = screen.getByTestId('tx-history-list')

    // I'm failing to simulate the onScroll event, so going to use the onEndReached prop which then triggers the loading of the next page
    await act(async () => {
      fireEvent(list, 'onEndReached')
    })

    // Wait for additional transactions to load
    await waitFor(() => {
      const transfers = screen.getAllByText('Received')
      expect(transfers).toHaveLength(2)
    })
  })

  it('shows initial loading skeleton when first loading transactions', async () => {
    // Mock server to return delayed response to capture loading state
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, async () => {
        // Add short delay to capture loading state
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({
          next: null,
          previous: null,
          results: mockTransactions,
        })
      }),
    )

    render(<TxHistoryContainer />)

    // Check if initial loading skeleton is shown
    expect(screen.getByTestId('tx-history-initial-loader')).toBeTruthy()

    // Wait for transactions to load and loading skeleton to disappear
    await waitFor(
      () => {
        expect(screen.queryByTestId('tx-history-initial-loader')).toBeNull()
        expect(screen.getByText('Received')).toBeTruthy()
      },
      { timeout: 3000 },
    )
  }, 10000)

  it('shows pagination loading skeleton when loading more transactions', async () => {
    render(<TxHistoryContainer />)

    // Wait for initial transactions to load
    await waitFor(() => {
      expect(screen.getByText('Received')).toBeTruthy()
    })

    // Mock server to return delayed response for next page
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, async ({ request }) => {
        if (request.url.includes('cursor=next_page')) {
          // Add delay to capture loading state
          await new Promise((resolve) => setTimeout(resolve, 80))
          return HttpResponse.json({
            count: 3,
            next: null,
            previous: `${GATEWAY_URL}/v1/chains/1/safes/0x123/transactions/history`,
            results: nextPageTransactions,
          })
        }
        return HttpResponse.json({
          next: `${GATEWAY_URL}/v1/chains/1/safes/0x123/transactions/history?cursor=next_page`,
          previous: null,
          results: mockTransactions,
        })
      }),
    )

    // Trigger loading more transactions
    const list = screen.getByTestId('tx-history-list')

    await act(async () => {
      fireEvent(list, 'onEndReached')
    })

    // Check if pagination loading skeleton is shown
    await waitFor(
      () => {
        expect(screen.getByTestId('tx-history-next-loader')).toBeTruthy()
      },
      { timeout: 2000 },
    )

    // Wait for additional transactions to load
    await waitFor(
      () => {
        const transfers = screen.getAllByText('Received')
        expect(transfers).toHaveLength(2)
        expect(screen.queryByTestId('tx-history-next-loader')).toBeNull()
      },
      { timeout: 3000 },
    )
  }, 10000)

  it('resets list when active safe changes', async () => {
    const { rerender } = render(<TxHistoryContainer />)

    // Wait for initial transactions to load
    await waitFor(() => {
      const transfers = screen.getAllByText('Received')
      expect(transfers).toHaveLength(1)
    })

    // Update the mock state with a new safe address
    mockSafeState.safe = { chainId: '1', address: faker.finance.ethereumAddress() as `0x${string}` }

    // Rerender to trigger the new mock state
    rerender(<TxHistoryContainer />)

    // Wait for list to reset and new transactions to load
    await waitFor(() => {
      const transfers = screen.getAllByText('Received')
      expect(transfers).toHaveLength(1)
    })
  })

  describe('refresh functionality', () => {
    it('triggers refresh functionality when onRefresh is called', async () => {
      render(<TxHistoryContainer />)

      // Wait for initial transactions to load
      await waitFor(() => {
        expect(screen.getByText('Received')).toBeTruthy()
      })

      const list = screen.getByTestId('tx-history-list')

      // Verify refresh control is properly configured
      expect(list).toBeTruthy()

      // Trigger refresh and verify it works without errors
      await act(async () => {
        fireEvent(list, 'onRefresh')
      })

      // The refresh should complete successfully (no errors)
      await waitFor(() => {
        expect(screen.getByText('Received')).toBeTruthy()
      })

      // Verify the list is still rendered after refresh
      expect(screen.getByTestId('tx-history-list')).toBeTruthy()
    })

    it('does not show initial skeleton when refreshing', async () => {
      render(<TxHistoryContainer />)

      // Wait for initial transactions to load
      await waitFor(() => {
        expect(screen.getByText('Received')).toBeTruthy()
      })

      // Trigger refresh
      const list = screen.getByTestId('tx-history-list')

      await act(async () => {
        fireEvent(list, 'onRefresh')
      })

      // Should not show initial skeleton during refresh
      expect(screen.queryByTestId('tx-history-initial-loader')).toBeNull()
    })
  })

  it('handles empty state when no transactions exist', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, () => {
        return HttpResponse.json({
          next: null,
          previous: null,
          results: [],
        })
      }),
    )

    render(<TxHistoryContainer />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByTestId('tx-history-initial-loader')).toBeNull()
      },
      { timeout: 3000 },
    )

    // Should not show any transaction items
    expect(screen.queryByText('Received')).toBeNull()

    // List should still be rendered but empty
    expect(screen.getByTestId('tx-history-list')).toBeTruthy()
  }, 10000)

  it('renders section headers for date grouping', async () => {
    // Mock with transactions on different dates
    const multiDateTransactions = [
      { type: 'DATE_LABEL', timestamp: 1742830570000 }, // Jan 21, 2025
      {
        type: 'TRANSACTION',
        transaction: {
          ...mockTransactions[1].transaction,
          id: 'tx1',
          timestamp: 1742830570000,
        },
        conflictType: 'None',
      },
      { type: 'DATE_LABEL', timestamp: 1737029389000 }, // Jan 15, 2025
      {
        type: 'TRANSACTION',
        transaction: {
          ...mockTransactions[1].transaction,
          id: 'tx2',
          timestamp: 1737029389000,
        },
        conflictType: 'None',
      },
    ]

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, () => {
        return HttpResponse.json({
          next: null,
          previous: null,
          results: multiDateTransactions,
        })
      }),
    )

    render(<TxHistoryContainer />)

    // Wait for transactions to load
    await waitFor(
      () => {
        const transfers = screen.getAllByText('Received')
        expect(transfers).toHaveLength(2)
      },
      { timeout: 3000 },
    )

    // Should render the SectionList which handles section headers
    expect(screen.getByTestId('tx-history-list')).toBeTruthy()
  }, 10000)

  it('handles multiple rapid interactions gracefully', async () => {
    render(<TxHistoryContainer />)

    // Wait for initial transactions to load
    await waitFor(
      () => {
        expect(screen.getByText('Received')).toBeTruthy()
      },
      { timeout: 3000 },
    )

    const list = screen.getByTestId('tx-history-list')

    // Trigger multiple rapid interactions
    await act(async () => {
      fireEvent(list, 'onRefresh')
      fireEvent(list, 'onEndReached')
      fireEvent(list, 'onRefresh')
    })

    // Should handle gracefully without errors
    await waitFor(
      () => {
        expect(screen.getByText('Received')).toBeTruthy()
      },
      { timeout: 3000 },
    )

    // List should still be functional
    expect(screen.getByTestId('tx-history-list')).toBeTruthy()
  }, 10000)
})
