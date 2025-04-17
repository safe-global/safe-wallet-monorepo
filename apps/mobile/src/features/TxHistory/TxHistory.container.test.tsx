import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@/src/tests/test-utils'
import { TxHistoryContainer } from './TxHistory.container'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'
import { faker } from '@faker-js/faker'

// Create a mutable object for the mock
const mockSafeState = {
  safe: { chainId: '1', address: '0x123' as `0x${string}` },
}

// Mock active safe selector to use the mutable state
jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => mockSafeState.safe,
}))

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
    mockSafeState.safe = { chainId: '1', address: '0x123' as `0x${string}` }

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

  it('resets list when active safe changes', async () => {
    const { rerender } = render(<TxHistoryContainer />)

    // Wait for initial transactions to load
    await waitFor(() => {
      const transfers = screen.getAllByText('Received')
      expect(transfers).toHaveLength(1)
    })

    // Update the mock state with a new safe address
    mockSafeState.safe = { chainId: '1', address: '0x456' as `0x${string}` }

    // Rerender to trigger the new mock state
    rerender(<TxHistoryContainer />)

    // Wait for list to reset and new transactions to load
    await waitFor(() => {
      const transfers = screen.getAllByText('Received')
      expect(transfers).toHaveLength(2)
    })
  })
})
