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

  it('renders nothing when there are no pinned safes (empty array)', () => {
    const { container } = render(<PinnedSafes allSafes={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when all safes are unpinned', () => {
    const nonPinnedSafes: AllSafeItems = [
      { name: 'NotPinned', address: '0x3', isPinned: false, chainId: '3', isReadOnly: false, lastVisited: 0 },
    ]

    const { container } = render(<PinnedSafes allSafes={nonPinnedSafes} />)
    expect(container.firstChild).toBeNull()
  })

  it('does not render "Manage trusted Safes" button when no pinned safes exist', () => {
    const nonPinnedSafes: AllSafeItems = [
      { name: 'NotPinned', address: '0x3', isPinned: false, chainId: '3', isReadOnly: false, lastVisited: 0 },
    ]
    const onOpenSelectionModal = jest.fn()

    render(<PinnedSafes allSafes={nonPinnedSafes} onOpenSelectionModal={onOpenSelectionModal} />)

    // Component returns null when no pinned safes, so button should not be present
    expect(screen.queryByTestId('add-more-safes-button')).not.toBeInTheDocument()
  })

  it('renders the "Trusted Safes" header when there are pinned safes', () => {
    const pinnedSafes: AllSafeItems = [
      { name: 'PinnedSafe1', address: '0x1', isPinned: true, chainId: '1', isReadOnly: false, lastVisited: 0 },
    ]

    render(<PinnedSafes allSafes={pinnedSafes} />)
    expect(screen.getByText('Trusted Safes')).toBeInTheDocument()
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

  it('shows "Manage trusted Safes" button when there are pinned safes and onOpenSelectionModal is provided', () => {
    const pinnedSafes: AllSafeItems = [
      { name: 'PinnedSafe1', address: '0x1', isPinned: true, chainId: '1', isReadOnly: false, lastVisited: 0 },
    ]
    const onOpenSelectionModal = jest.fn()

    render(<PinnedSafes allSafes={pinnedSafes} onOpenSelectionModal={onOpenSelectionModal} />)

    const addButton = screen.getByTestId('add-more-safes-button')
    expect(addButton).toBeInTheDocument()
    expect(addButton).toHaveTextContent('Manage trusted Safes')
  })

  it('calls onOpenSelectionModal when "Manage trusted Safes" button is clicked', () => {
    const pinnedSafes: AllSafeItems = [
      { name: 'PinnedSafe1', address: '0x1', isPinned: true, chainId: '1', isReadOnly: false, lastVisited: 0 },
    ]
    const onOpenSelectionModal = jest.fn()

    render(<PinnedSafes allSafes={pinnedSafes} onOpenSelectionModal={onOpenSelectionModal} />)

    screen.getByTestId('add-more-safes-button').click()

    expect(onOpenSelectionModal).toHaveBeenCalled()
  })
})
