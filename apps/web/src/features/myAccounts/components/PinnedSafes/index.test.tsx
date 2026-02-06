import React from 'react'
import { render, screen } from '@testing-library/react'
import type { AllSafeItems } from '@/hooks/safes'
import PinnedSafes from './index'
import SafesList from '../SafesList'

// Mock the SafesList component to ensure we can test the props passed to it
jest.mock('../SafesList', () => jest.fn(() => <div data-testid="safes-list">SafesList Component</div>))

describe('PinnedSafes', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the "Pinned" header', () => {
    render(<PinnedSafes allSafes={[]} />)
    expect(screen.getByText('Pinned')).toBeInTheDocument()
  })

  it('renders SafesList when there are pinned safes', () => {
    const pinnedSafes: AllSafeItems = [
      { name: 'PinnedSafe1', address: '0x1', isPinned: true, chainId: '1', isReadOnly: false, lastVisited: 0 },
      { name: 'PinnedSafe2', address: '0x2', isPinned: true, chainId: '2', isReadOnly: false, lastVisited: 0 },
    ]

    render(<PinnedSafes allSafes={pinnedSafes} />)

    // SafesList should be rendered
    expect(screen.getByTestId('safes-list')).toBeInTheDocument()

    // Check that it's called with the correct props
    const callProps = (SafesList as jest.Mock).mock.calls[0][0]
    expect(callProps.safes).toHaveLength(2)
    expect(callProps.safes[0]).toEqual(pinnedSafes[0])
    expect(callProps.safes[1]).toEqual(pinnedSafes[1])
    expect(callProps.onLinkClick).toBeUndefined()
  })

  it('passes onLinkClick to SafesList if provided', () => {
    const pinnedSafes: AllSafeItems = [
      { name: 'PinnedSafe1', address: '0x1', isPinned: true, chainId: '1', isReadOnly: false, lastVisited: 0 },
    ]
    const onLinkClickMock = jest.fn()

    render(<PinnedSafes allSafes={pinnedSafes} onLinkClick={onLinkClickMock} />)

    const callProps = (SafesList as jest.Mock).mock.calls[0][0]
    expect(callProps.onLinkClick).toBe(onLinkClickMock)
  })

  it('shows empty pinned message when there are no pinned safes', () => {
    const nonPinnedSafes: AllSafeItems = [
      { name: 'NotPinned', address: '0x3', isPinned: false, chainId: '3', isReadOnly: false, lastVisited: 0 },
    ]

    render(<PinnedSafes allSafes={nonPinnedSafes} />)

    // SafesList should not be rendered
    expect(screen.queryByTestId('safes-list')).not.toBeInTheDocument()

    // Empty pinned message should be visible
    expect(screen.getByTestId('empty-pinned-list')).toBeInTheDocument()
    expect(screen.getByText(/Personalize your account list by clicking the/i)).toBeInTheDocument()
  })

  it('shows empty pinned message if allSafes is empty', () => {
    render(<PinnedSafes allSafes={[]} />)
    expect(screen.queryByTestId('safes-list')).not.toBeInTheDocument()
    expect(screen.getByTestId('empty-pinned-list')).toBeInTheDocument()
  })
})
