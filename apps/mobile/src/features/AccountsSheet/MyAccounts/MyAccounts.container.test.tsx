import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/src/tests/test-utils'
import { MyAccountsContainer } from './MyAccounts.container'
import { mockedChains } from '@/src/store/constants'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'
import { faker } from '@faker-js/faker'
import { shortenAddress } from '@/src/utils/formatters'

jest.mock('expo-router', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
  }),
  useSegments: () => ['test'], // if you use useSegments anywhere
}))

// Mock the safe item data
const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
const mockSafeItem = {
  address: mockSafeAddress,
  info: {
    '1': {
      address: { value: mockSafeAddress, name: 'Test Safe' },
      threshold: 1,
      owners: [{ value: '0x456' as `0x${string}` }],
      fiatTotal: '1000',
      chainId: '1',
      queued: 0,
    },
  },
}

// Create a constant object for the selector result
const mockActiveSafe = { address: faker.finance.ethereumAddress() as `0x${string}`, chainId: '1' }
const mockChainIds = ['1'] as const
const mockDelegates = {}

// Mock Redux selectors — keep the real action creators (with .type) so any
// slice extraReducer that does `addCase(setActiveSafe, ...)` still works.
jest.mock('@/src/store/activeSafeSlice', () => ({
  ...jest.requireActual('@/src/store/activeSafeSlice'),
  selectActiveSafe: () => mockActiveSafe,
}))

jest.mock('@/src/store/chains', () => ({
  getChainsByIds: () => mockedChains,
  selectAllChainsIds: () => mockChainIds,
  selectAllChains: () => mockedChains,
}))

jest.mock('@/src/store/myAccountsSlice', () => ({
  selectMyAccountsMode: () => false,
}))

jest.mock('@/src/store/delegatesSlice', () => ({
  selectDelegates: () => mockDelegates,
  addDelegate: {
    type: 'delegates/addDelegate',
    match: jest.fn(),
  },
}))

jest.mock('@/src/hooks/useNotificationCleanup', () => ({
  useNotificationCleanup: () => ({
    cleanupNotificationsForDelegate: jest.fn(),
  }),
}))

jest.mock('@safe-global/store/gateway/delegates', () => ({
  delegatesApi: {
    useDelegatesDeleteDelegateV3Mutation: () => [jest.fn(), { isLoading: false }],
  },
}))

describe('MyAccountsContainer', () => {
  const mockOnClose = jest.fn()
  let safesParams: URLSearchParams[] = []

  beforeEach(() => {
    safesParams = []
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, ({ request }) => {
        safesParams.push(new URL(request.url).searchParams)
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

  it('only refreshes balances for the safe’s known chains (no implicit discovery probe)', async () => {
    render(<MyAccountsContainer item={mockSafeItem} onClose={mockOnClose} />, {
      initialStore: {
        safes: {
          [mockSafeAddress]: mockSafeItem.info,
        },
      },
    })

    // The mocked safe is known on a single chain — '1'. The request must reflect that,
    // not the entire system chain list (which is what the old per-row probe sent).
    await waitFor(() => expect(safesParams.length).toBeGreaterThan(0))
    const probedSafes = safesParams[0].get('safes') ?? ''
    expect(probedSafes.split(',')).toEqual([`1:${mockSafeAddress}`])
  })

  it('renders account item with correct data but no contact exists in address book', () => {
    render(<MyAccountsContainer item={mockSafeItem} onClose={mockOnClose} />)

    expect(screen.getByText(shortenAddress(mockSafeItem.address))).toBeTruthy()
    expect(screen.getByText('1/1')).toBeTruthy()
    expect(screen.getByText('$ 1,000.00')).toBeTruthy()
  })

  it('renders account item with correct data when contact for safe exist', () => {
    render(<MyAccountsContainer item={mockSafeItem} onClose={mockOnClose} />, {
      initialStore: {
        addressBook: {
          contacts: {
            [mockSafeItem.address]: { name: 'Test Safe', value: mockSafeItem.address, chainIds: [] },
          },
          selectedContact: null,
        },
      },
    })

    expect(screen.getByText('Test Safe')).toBeTruthy()
    expect(screen.getByText('1/1')).toBeTruthy()
    expect(screen.getByText('$ 1,000.00')).toBeTruthy()
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
