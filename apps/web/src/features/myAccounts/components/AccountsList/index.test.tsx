import { OrderByOption } from '@/store/orderByPreferenceSlice'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { render } from '@/tests/test-utils'
import React from 'react'
import { screen } from '@testing-library/react'
import AccountsList from './index'
import FilteredSafes from '../FilteredSafes'
import PinnedSafes from '../PinnedSafes'
import type { AllSafeItemsGrouped } from '@/hooks/safes'

// Mock child components to simplify tests, we just need to verify their rendering and props.
jest.mock('../FilteredSafes', () => jest.fn(() => <div>FilteredSafes Component</div>))
jest.mock('../PinnedSafes', () => jest.fn(() => <div>PinnedSafes Component</div>))

// Mock wallet - return value can be changed per test
let mockWalletValue: { address: string } | null = { address: '0x1234567890123456789012345678901234567890' }
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWalletValue,
}))

// Mock useMigrationPrompt - return value can be changed per test
let mockMigrationPromptValue = {
  shouldShowPrompt: false,
  availableSafeCount: 0,
  hasPinnedSafes: false,
  hasAssociatedSafes: false,
  isLoading: false,
}
jest.mock('../../hooks/useMigrationPrompt', () => ({
  __esModule: true,
  default: () => mockMigrationPromptValue,
}))

describe('AccountsList', () => {
  const baseSafes: AllSafeItemsGrouped = {
    allMultiChainSafes: [
      { name: 'MultiChainSafe1', address: '0xA', isPinned: false, lastVisited: 0, safes: [safeItemBuilder().build()] },
      { name: 'MultiChainSafe2', address: '0xB', isPinned: false, lastVisited: 1, safes: [safeItemBuilder().build()] },
    ],
    allSingleSafes: [
      { name: 'SingleSafe1', address: '0xC', isPinned: true, chainId: '3', isReadOnly: false, lastVisited: 2 },
    ],
  }

  afterEach(() => {
    jest.clearAllMocks()
    // Reset mocks to default state
    mockWalletValue = { address: '0x1234567890123456789012345678901234567890' }
    mockMigrationPromptValue = {
      shouldShowPrompt: false,
      availableSafeCount: 0,
      hasPinnedSafes: false,
      hasAssociatedSafes: false,
      isLoading: false,
    }
  })

  it('renders FilteredSafes when searchQuery is not empty', () => {
    render(<AccountsList searchQuery="Multi" safes={baseSafes} />, {
      initialReduxState: { orderByPreference: { orderBy: OrderByOption.NAME } },
    })

    expect(screen.getByText('FilteredSafes Component')).toBeInTheDocument()
    expect(screen.queryByText('PinnedSafes Component')).not.toBeInTheDocument()

    // Check that FilteredSafes is called with the correct props
    const filteredSafesMock = (FilteredSafes as jest.Mock).mock.calls[0][0]
    expect(filteredSafesMock.searchQuery).toBe('Multi')
    expect(filteredSafesMock.onLinkClick).toBeUndefined()

    // The combined allSafes array sorted by name
    const expectedSortedSafes = [
      { name: 'MultiChainSafe1', address: '0xA', isPinned: false, lastVisited: 0, safes: expect.anything() },
      { name: 'MultiChainSafe2', address: '0xB', isPinned: false, lastVisited: 1, safes: expect.anything() },
      { name: 'SingleSafe1', address: '0xC', isPinned: true, chainId: '3', isReadOnly: false, lastVisited: 2 },
    ]
    expect(filteredSafesMock.allSafes).toEqual(expectedSortedSafes)
  })

  it('renders PinnedSafes when searchQuery is empty', () => {
    render(<AccountsList searchQuery="" safes={baseSafes} />, {
      initialReduxState: { orderByPreference: { orderBy: OrderByOption.NAME } },
    })

    expect(screen.queryByText('FilteredSafes Component')).not.toBeInTheDocument()
    expect(screen.getByText('PinnedSafes Component')).toBeInTheDocument()

    // Check that PinnedSafes received the correct props
    const pinnedSafesMock = (PinnedSafes as jest.Mock).mock.calls[0][0]

    // Sorted array as in the previous test
    const expectedSortedSafes = [
      { name: 'MultiChainSafe1', address: '0xA', isPinned: false, lastVisited: 0, safes: expect.anything() },
      { name: 'MultiChainSafe2', address: '0xB', isPinned: false, lastVisited: 1, safes: expect.anything() },
      { name: 'SingleSafe1', address: '0xC', isPinned: true, chainId: '3', isReadOnly: false, lastVisited: 2 },
    ]

    expect(pinnedSafesMock.allSafes).toEqual(expectedSortedSafes)
  })

  it('sorts by lastVisited', () => {
    render(<AccountsList searchQuery="" safes={baseSafes} />, {
      initialReduxState: { orderByPreference: { orderBy: OrderByOption.LAST_VISITED } },
    })

    expect(screen.queryByText('FilteredSafes Component')).not.toBeInTheDocument()
    expect(screen.getByText('PinnedSafes Component')).toBeInTheDocument()

    // Check that PinnedSafes received the correct props
    const pinnedSafesMock = (PinnedSafes as jest.Mock).mock.calls[0][0]

    const expectedSortedSafes = [
      { name: 'SingleSafe1', address: '0xC', isPinned: true, chainId: '3', isReadOnly: false, lastVisited: 2 },
      { name: 'MultiChainSafe2', address: '0xB', isPinned: false, lastVisited: 1, safes: expect.anything() },
      { name: 'MultiChainSafe1', address: '0xA', isPinned: false, lastVisited: 0, safes: expect.anything() },
    ]

    expect(pinnedSafesMock.allSafes).toEqual(expectedSortedSafes)
  })

  it('passes onLinkClick prop down to PinnedSafes', () => {
    const onLinkClickFn = jest.fn()

    render(<AccountsList searchQuery="" safes={baseSafes} onLinkClick={onLinkClickFn} />)

    const pinnedSafesMock = (PinnedSafes as jest.Mock).mock.calls[0][0]
    expect(pinnedSafesMock.onLinkClick).toBe(onLinkClickFn)
  })

  it('renders ConnectWalletPrompt when wallet is not connected and no pinned safes', () => {
    mockWalletValue = null
    mockMigrationPromptValue = { ...mockMigrationPromptValue, hasPinnedSafes: false }

    render(<AccountsList searchQuery="" safes={baseSafes} />)

    expect(screen.getByTestId('connect-wallet-prompt')).toBeInTheDocument()
    expect(screen.getByText('Connect your wallet')).toBeInTheDocument()
    expect(screen.queryByText('PinnedSafes Component')).not.toBeInTheDocument()
  })

  it('renders PinnedSafes when wallet is not connected but has pinned safes', () => {
    mockWalletValue = null
    mockMigrationPromptValue = { ...mockMigrationPromptValue, hasPinnedSafes: true }

    render(<AccountsList searchQuery="" safes={baseSafes} />)

    // Should show pinned safes, not connect prompt
    expect(screen.queryByTestId('connect-wallet-prompt')).not.toBeInTheDocument()
    expect(screen.getByText('PinnedSafes Component')).toBeInTheDocument()
  })
})
