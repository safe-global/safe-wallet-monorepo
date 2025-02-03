import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { MyAccountsContainer } from './MyAccounts.container'
import { mockedChains } from '@/src/store/constants'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'

// Mock the safe item data
const mockSafeItem = {
  SafeInfo: {
    address: { value: '0x123' as `0x${string}`, name: 'Test Safe' },
    threshold: 1,
    owners: [{ value: '0x456' as `0x${string}` }],
    fiatTotal: '1000',
    chainId: '1',
    queued: 0,
  },
  chains: ['1'],
}

// Create a constant object for the selector result
const mockActiveSafe = { address: '0x789' as `0x${string}`, chainId: '1' }
const mockChainIds = ['1'] as const

// Mock Redux selectors
jest.mock('@/src/store/activeSafeSlice', () => ({
  selectActiveSafe: () => mockActiveSafe,
  setActiveSafe: (payload: { address: `0x${string}`; chainId: string }) => ({
    type: 'activeSafe/setActiveSafe',
    payload,
  }),
}))

jest.mock('@/src/store/chains', () => ({
  getChainsByIds: () => mockedChains,
  selectAllChainsIds: () => mockChainIds,
}))

jest.mock('@/src/store/myAccountsSlice', () => ({
  selectMyAccountsMode: () => false,
}))

describe('MyAccountsContainer', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/safes`, () => {
        return HttpResponse.json([
          {
            address: { value: '0x123', name: 'Test Safe' },
            chainId: '1',
            threshold: 1,
            owners: [{ value: '0x456' }],
            fiatTotal: '1000',
            queued: 0,
          },
        ])
      }),
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
    server.resetHandlers()
  })

  it('renders account item with correct data', () => {
    render(<MyAccountsContainer item={mockSafeItem} onClose={mockOnClose} />)

    expect(screen.getByText('Test Safe')).toBeTruthy()
    expect(screen.getByText('1/1')).toBeTruthy()
    expect(screen.getByText('$1000')).toBeTruthy()
  })

  it('calls onClose when account is selected', () => {
    render(<MyAccountsContainer item={mockSafeItem} onClose={mockOnClose} />)

    fireEvent.press(screen.getByTestId('account-item-wrapper'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('renders with drag functionality when provided', () => {
    const mockDrag = jest.fn()

    render(<MyAccountsContainer item={mockSafeItem} onClose={mockOnClose} isDragging={false} drag={mockDrag} />)

    expect(screen.getByTestId('account-item-wrapper')).toBeTruthy()
  })
})
