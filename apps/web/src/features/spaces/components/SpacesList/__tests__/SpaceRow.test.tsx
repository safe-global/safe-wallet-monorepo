import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceRow from '../SpaceRow'
import { useSpaceSafesById } from '../../../hooks/useSpaceSafes'

jest.mock('../../../hooks/useSpaceSafes', () => ({
  useSpaceSafesById: jest.fn(),
}))

jest.mock('../../SafeAccounts/SafeCardReadOnly', () => ({
  __esModule: true,
  default: ({ safe }: { safe: { address: string } }) => <div data-testid="safe-card">{safe.address}</div>,
}))

const mockUseSpaceSafesById = useSpaceSafesById as jest.Mock

const space = {
  uuid: 'uuid-1',
  name: 'My Space',
  safeCount: 2,
  memberCount: 3,
  members: [],
} as unknown as GetSpaceResponse

const safes = [
  { chainId: '1', address: '0xaaa', isReadOnly: false, isPinned: false, lastVisited: 0, name: undefined },
  { chainId: '1', address: '0xbbb', isReadOnly: false, isPinned: false, lastVisited: 0, name: undefined },
]

describe('SpaceRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpaceSafesById.mockReturnValue({ allSafes: safes, isLoading: false, isError: false, refetch: jest.fn() })
  })

  it('is collapsed by default: shows the workspace summary, skips the safes query, hides safe rows', () => {
    render(<SpaceRow space={space} />)

    expect(screen.getByText('My Space')).toBeInTheDocument()
    expect(screen.queryByTestId('safe-card')).not.toBeInTheDocument()
    expect(mockUseSpaceSafesById).toHaveBeenLastCalledWith('uuid-1', { skip: true })
  })

  it('expands on click: unskips the query and renders the safe rows', async () => {
    render(<SpaceRow space={space} />)

    await userEvent.click(screen.getByRole('button', { expanded: false }))

    expect(mockUseSpaceSafesById).toHaveBeenLastCalledWith('uuid-1', { skip: false })
    expect(screen.getAllByTestId('safe-card')).toHaveLength(2)
    expect(screen.getByText('0xaaa')).toBeInTheDocument()
  })

  it('shows an empty message when the workspace has no safes', async () => {
    mockUseSpaceSafesById.mockReturnValue({ allSafes: [], isLoading: false, isError: false, refetch: jest.fn() })
    render(<SpaceRow space={space} />)

    await userEvent.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByText(/no accounts in this workspace yet/i)).toBeInTheDocument()
  })

  it('offers a retry on error', async () => {
    const refetch = jest.fn()
    mockUseSpaceSafesById.mockReturnValue({ allSafes: [], isLoading: false, isError: true, refetch })
    render(<SpaceRow space={space} />)

    await userEvent.click(screen.getByRole('button', { expanded: false }))
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(refetch).toHaveBeenCalled()
  })

  it('shows the context menu only for active admins of the workspace', () => {
    const adminSpace = {
      ...space,
      members: [{ user: { id: 7 }, role: 'ADMIN', status: 'ACTIVE' }],
    } as unknown as GetSpaceResponse

    const { rerender } = render(<SpaceRow space={adminSpace} currentUserId={7} />)
    expect(screen.getByTestId('space-card-context-menu-button')).toBeInTheDocument()

    // A non-member (or non-admin) gets no menu.
    rerender(<SpaceRow space={adminSpace} currentUserId={8} />)
    expect(screen.queryByTestId('space-card-context-menu-button')).not.toBeInTheDocument()
  })
})
