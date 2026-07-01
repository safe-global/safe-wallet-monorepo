import { render, screen, fireEvent } from '@testing-library/react'
import type { SpaceAuditLogEntryDto, SpaceAuditLogPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceActivityLog from '../index'
import useGetSpaceAuditLog from '../../../hooks/useGetSpaceAuditLog'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(() => true),
}))
jest.mock('../../../hooks/useGetSpaceAuditLog')
jest.mock('../../../hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(() => 'space-uuid-1'),
}))
const mockResolveMemberName = jest.fn()
jest.mock('../../../hooks/useMemberNameResolver', () => ({
  useMemberNameResolver: () => mockResolveMemberName,
}))
// The filter bar is exercised through its callback; its controls have their own test file.
jest.mock('../ActivityLogFilters', () => ({
  __esModule: true,
  default: ({ onFiltersChange }: { onFiltersChange: (filters: { actorUserId?: number }) => void }) => (
    <button data-testid="set-actor-filter" onClick={() => onFiltersChange({ actorUserId: 42 })}>
      filter
    </button>
  ),
  EMPTY_FILTERS: {},
}))
jest.mock('@/components/common/Identicon', () => {
  const Identicon = () => <span data-testid="identicon" />
  return Identicon
})
jest.mock('@/components/common/EthHashInfo', () => {
  const EthHashInfo = ({ address }: { address: string }) => <span>{address}</span>
  return EthHashInfo
})
jest.mock('@/components/common/InitialsAvatar', () => {
  const InitialsAvatar = () => <span data-testid="initials-avatar" />
  return InitialsAvatar
})

const mockUseGetSpaceAuditLog = useGetSpaceAuditLog as jest.MockedFunction<typeof useGetSpaceAuditLog>
const mockUseCurrentSpaceId = useCurrentSpaceId as jest.MockedFunction<typeof useCurrentSpaceId>

type HookResult = ReturnType<typeof useGetSpaceAuditLog>

const buildEvent = (id: string, overrides: Partial<SpaceAuditLogEntryDto> = {}): SpaceAuditLogEntryDto => ({
  id,
  eventType: 'MEMBER_INVITE_ACCEPTED',
  actorUserId: 1,
  actor: `actor-${id}`,
  targetUser: null,
  payload: { targetUserId: 1 },
  createdAt: '2026-06-11T10:00:00Z',
  ...overrides,
})

const asResult = (partial: Partial<HookResult>): HookResult =>
  ({ isLoading: false, isError: false, ...partial }) as HookResult

const mockPages = (pagesByCursor: Record<string, SpaceAuditLogPage>) => {
  mockUseGetSpaceAuditLog.mockImplementation((args = {}) => asResult({ currentData: pagesByCursor[args.cursor ?? ''] }))
}

describe('SpaceActivityLog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentSpaceId.mockReturnValue('space-uuid-1')
    mockResolveMemberName.mockReturnValue(undefined)
  })

  it('renders a loading skeleton while the first page loads', () => {
    mockUseGetSpaceAuditLog.mockReturnValue(asResult({ isLoading: true }))

    render(<SpaceActivityLog />)

    expect(screen.getByTestId('activity-log-loading')).toBeInTheDocument()
  })

  it('renders an error state without retry controls', () => {
    mockUseGetSpaceAuditLog.mockReturnValue(asResult({ isError: true }))

    render(<SpaceActivityLog />)

    expect(screen.getByText('Could not load activity.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('activity-log-load-more')).not.toBeInTheDocument()
  })

  it('renders the empty state', () => {
    mockPages({ '': { results: [], next: null, previous: null, count: 0 } })

    render(<SpaceActivityLog />)

    expect(screen.getByText('No activity yet.')).toBeInTheDocument()
  })

  it('renders event rows', () => {
    mockPages({
      '': { results: [buildEvent('1'), buildEvent('2')], next: null, previous: null, count: 2 },
    })

    render(<SpaceActivityLog />)

    expect(screen.getByText('actor-1')).toBeInTheDocument()
    expect(screen.getByText('actor-2')).toBeInTheDocument()
  })

  it('resolves actors to space member names by user id', () => {
    mockResolveMemberName.mockImplementation((userId: number | undefined) => (userId === 5 ? 'Alice Admin' : undefined))
    mockPages({
      '': { results: [buildEvent('1', { actorUserId: 5 })], next: null, previous: null, count: 1 },
    })

    render(<SpaceActivityLog />)

    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.queryByText('actor-1')).not.toBeInTheDocument()
  })

  it('loads more pages and dedupes rows that shifted between pages', () => {
    mockPages({
      '': {
        results: [buildEvent('3'), buildEvent('2')],
        next: 'https://gw/v1/spaces/uuid-1/audit-log?cursor=limit%3D2%26offset%3D2',
        previous: null,
        count: 3,
      },
      // Page 2 re-contains event 2 (a new event shifted the offset window).
      'limit=2&offset=2': { results: [buildEvent('2'), buildEvent('1')], next: null, previous: null, count: 3 },
    })

    render(<SpaceActivityLog />)
    fireEvent.click(screen.getByTestId('activity-log-load-more'))

    expect(screen.getAllByText('actor-2')).toHaveLength(1)
    expect(screen.getByText('actor-1')).toBeInTheDocument()
    expect(screen.getByText('actor-3')).toBeInTheDocument()
    // The last page has no next — the button disappears.
    expect(screen.queryByTestId('activity-log-load-more')).not.toBeInTheDocument()
  })

  it('keeps a disabled loading button while the next page is being fetched', () => {
    // Page 2 data is never provided — the fetch stays pending.
    mockPages({
      '': {
        results: [buildEvent('1')],
        next: 'https://gw/v1/spaces/uuid-1/audit-log?cursor=limit%3D1%26offset%3D1',
        previous: null,
        count: 2,
      },
    })

    render(<SpaceActivityLog />)
    fireEvent.click(screen.getByTestId('activity-log-load-more'))

    const button = screen.getByTestId('activity-log-load-more')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Loading…')
  })

  it('passes filters into the query and resets pagination when they change', () => {
    mockPages({
      '': {
        results: [buildEvent('1')],
        next: 'https://gw/v1/spaces/uuid-1/audit-log?cursor=limit%3D1%26offset%3D1',
        previous: null,
        count: 2,
      },
      'limit=1&offset=1': { results: [buildEvent('0')], next: null, previous: null, count: 2 },
    })

    render(<SpaceActivityLog />)
    fireEvent.click(screen.getByTestId('activity-log-load-more'))
    expect(screen.getByText('actor-0')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('set-actor-filter'))

    // The filter reaches the query…
    expect(mockUseGetSpaceAuditLog).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 42 }))
    // …and the extra page was dropped (page 2's row is gone).
    expect(screen.queryByText('actor-0')).not.toBeInTheDocument()
  })

  it('resets pagination when the current space changes', () => {
    mockPages({
      '': {
        results: [buildEvent('1')],
        next: 'https://gw/v1/spaces/uuid-1/audit-log?cursor=limit%3D1%26offset%3D1',
        previous: null,
        count: 2,
      },
      'limit=1&offset=1': { results: [buildEvent('0')], next: null, previous: null, count: 2 },
    })

    const { rerender } = render(<SpaceActivityLog />)
    fireEvent.click(screen.getByTestId('activity-log-load-more'))
    expect(screen.getByText('actor-0')).toBeInTheDocument()

    mockUseCurrentSpaceId.mockReturnValue('space-uuid-2')
    rerender(<SpaceActivityLog />)

    expect(screen.queryByText('actor-0')).not.toBeInTheDocument()
  })

  it('shows "No results" instead of the generic empty state when filtered', () => {
    mockPages({ '': { results: [], next: null, previous: null, count: 0 } })

    render(<SpaceActivityLog />)
    fireEvent.click(screen.getByTestId('set-actor-filter'))

    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})
