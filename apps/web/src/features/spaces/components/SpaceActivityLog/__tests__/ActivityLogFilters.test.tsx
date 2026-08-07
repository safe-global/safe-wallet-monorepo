import { render, screen, fireEvent } from '@testing-library/react'
import ActivityLogFilters, { EMPTY_FILTERS, type ActivityLogFilterState } from '../ActivityLogFilters'
import useGetSpaceAuditLogActors from '../../../hooks/useGetSpaceAuditLogActors'

jest.mock('../../../hooks/useGetSpaceAuditLogActors')

const mockResolveMemberName = jest.fn()
jest.mock('../../../hooks/useMemberNameResolver', () => ({
  useMemberNameResolver: () => mockResolveMemberName,
}))

const mockUseActors = useGetSpaceAuditLogActors as jest.MockedFunction<typeof useGetSpaceAuditLogActors>

describe('ActivityLogFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-06-24T12:00:00'))

    mockResolveMemberName.mockReturnValue(undefined)
    // Includes a former/deleted member — the dropdown is fed from the audit
    // log itself, not from current members.
    mockUseActors.mockReturnValue([
      { actorUserId: 1, actor: '0x1234567890abcdef1234567890abcdef12345678' },
      { actorUserId: 2, actor: 'Former member' },
    ])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('emits an inclusive ISO lower bound for the from date', () => {
    const onFiltersChange = jest.fn()
    render(<ActivityLogFilters filters={EMPTY_FILTERS} onFiltersChange={onFiltersChange} />)

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-06-01' } })

    const [filters] = onFiltersChange.mock.lastCall
    expect(new Date(filters.createdAtGte).getDate()).toBe(1)
    expect(filters.createdAtLte).toBeUndefined()
  })

  it('emits an end-of-day ISO upper bound for the to date', () => {
    const onFiltersChange = jest.fn()
    render(<ActivityLogFilters filters={EMPTY_FILTERS} onFiltersChange={onFiltersChange} />)

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-06-10' } })

    const [filters] = onFiltersChange.mock.lastCall
    const upperBound = new Date(filters.createdAtLte)
    expect(upperBound.getHours()).toBe(23)
    expect(upperBound.getMinutes()).toBe(59)
    expect(filters.createdAtGte).toBeUndefined()
  })

  it('shows the controlled value and clears the bound when the input is emptied', () => {
    const onFiltersChange = jest.fn()
    render(
      <ActivityLogFilters
        filters={{ createdAtGte: new Date('2026-06-01T00:00:00').toISOString() }}
        onFiltersChange={onFiltersChange}
      />,
    )

    expect(screen.getByLabelText('From')).toHaveValue('2026-06-01')

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '' } })

    const [filters] = onFiltersChange.mock.lastCall
    expect(filters.createdAtGte).toBeUndefined()
  })

  it('shows the range error on the from field when the from date is after the to date', () => {
    render(
      <ActivityLogFilters
        filters={{
          createdAtGte: new Date('2026-06-10T00:00:00').toISOString(),
          createdAtLte: new Date('2026-06-01T23:59:59').toISOString(),
        }}
        onFiltersChange={jest.fn()}
      />,
    )

    // The range violation is From's fault, so it's flagged inline on From only.
    expect(screen.getByRole('alert')).toHaveTextContent("'From' date can't be after the 'To' date")
    expect(screen.getByLabelText('From')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('To')).not.toHaveAttribute('aria-invalid')
  })

  it.each<[string, ActivityLogFilterState]>([
    [
      'a valid range',
      {
        createdAtGte: new Date('2026-06-01T00:00:00').toISOString(),
        createdAtLte: new Date('2026-06-10T23:59:59').toISOString(),
      },
    ],
    [
      // From is start-of-day, To is end-of-day, so the range is valid.
      'a same-day range',
      {
        createdAtGte: new Date('2026-06-01T00:00:00').toISOString(),
        createdAtLte: new Date('2026-06-01T23:59:59').toISOString(),
      },
    ],
    // Nothing to compare against when only one bound is set.
    ['a single bound', { createdAtGte: new Date('2026-06-10T00:00:00').toISOString() }],
  ])('does not show a validation error for %s', (_label, filters) => {
    render(<ActivityLogFilters filters={filters} onFiltersChange={jest.fn()} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('constrains each date picker with the opposite bound', () => {
    render(
      <ActivityLogFilters
        filters={{
          createdAtGte: new Date('2026-06-01T00:00:00').toISOString(),
          createdAtLte: new Date('2026-06-10T23:59:59').toISOString(),
        }}
        onFiltersChange={jest.fn()}
      />,
    )

    expect(screen.getByLabelText('From')).toHaveAttribute('max', '2026-06-10')
    expect(screen.getByLabelText('To')).toHaveAttribute('min', '2026-06-01')
  })

  it('caps both date pickers at today when no opposite bound is set', () => {
    render(<ActivityLogFilters filters={EMPTY_FILTERS} onFiltersChange={jest.fn()} />)

    expect(screen.getByLabelText('From')).toHaveAttribute('max', '2026-06-24')
    expect(screen.getByLabelText('To')).toHaveAttribute('max', '2026-06-24')
  })

  it('keeps the from cap at today when a future to date is set', () => {
    render(
      <ActivityLogFilters
        filters={{ createdAtLte: new Date('2027-01-01T23:59:59').toISOString() }}
        onFiltersChange={jest.fn()}
      />,
    )

    expect(screen.getByLabelText('From')).toHaveAttribute('max', '2026-06-24')
  })

  it('shows a future-date error and flags only the to field when the to date is in the future', () => {
    render(
      <ActivityLogFilters
        filters={{ createdAtLte: new Date('2027-01-01T23:59:59').toISOString() }}
        onFiltersChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent("Date can't be in the future")
    expect(screen.getByLabelText('To')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('From')).not.toHaveAttribute('aria-invalid')
  })

  it('shows a future-date error and flags only the from field when the from date is in the future', () => {
    render(
      <ActivityLogFilters
        filters={{ createdAtGte: new Date('2027-01-01T00:00:00').toISOString() }}
        onFiltersChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent("Date can't be in the future")
    expect(screen.getByLabelText('From')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('To')).not.toHaveAttribute('aria-invalid')
  })

  it('flags only the future field even when it breaks range order against a valid past bound', () => {
    render(
      <ActivityLogFilters
        filters={{
          createdAtGte: new Date('2027-01-01T00:00:00').toISOString(),
          createdAtLte: new Date('2026-06-01T23:59:59').toISOString(),
        }}
        onFiltersChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent("Date can't be in the future")
    expect(screen.getByLabelText('From')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('To')).not.toHaveAttribute('aria-invalid')
  })

  it('sources the member dropdown from the audit log actors endpoint', () => {
    render(<ActivityLogFilters filters={EMPTY_FILTERS} onFiltersChange={jest.fn()} />)

    expect(mockUseActors).toHaveBeenCalled()
    expect(screen.getByLabelText('Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Sort')).toBeInTheDocument()
  })

  it('shows the Team-page display name for a wallet member instead of the address', () => {
    mockResolveMemberName.mockImplementation((userId) => (userId === 1 ? 'Liliya (wallet)' : undefined))

    render(<ActivityLogFilters filters={{ actorUserId: 1 }} onFiltersChange={jest.fn()} />)

    expect(screen.getByText('Liliya (wallet)')).toBeInTheDocument()
    expect(screen.queryByText('0x1234567890abcdef1234567890abcdef12345678')).not.toBeInTheDocument()
  })

  it('falls back to the server label when no member name resolves', () => {
    render(<ActivityLogFilters filters={{ actorUserId: 2 }} onFiltersChange={jest.fn()} />)

    expect(screen.getByText('Former member')).toBeInTheDocument()
  })
})
