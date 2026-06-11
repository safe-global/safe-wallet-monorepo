import { render, screen, fireEvent } from '@testing-library/react'
import ActivityLogFilters, { EMPTY_FILTERS } from '../ActivityLogFilters'
import useGetSpaceAuditLogActors from '../../../hooks/useGetSpaceAuditLogActors'

jest.mock('../../../hooks/useGetSpaceAuditLogActors')

const mockUseActors = useGetSpaceAuditLogActors as jest.MockedFunction<typeof useGetSpaceAuditLogActors>

describe('ActivityLogFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Includes a former/deleted member — the dropdown is fed from the audit
    // log itself, not from current members.
    mockUseActors.mockReturnValue([
      { actorUserId: 1, actor: '0x1234567890abcdef1234567890abcdef12345678' },
      { actorUserId: 2, actor: 'Former member' },
    ])
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

  it('sources the member dropdown from the audit log actors endpoint', () => {
    render(<ActivityLogFilters filters={EMPTY_FILTERS} onFiltersChange={jest.fn()} />)

    expect(mockUseActors).toHaveBeenCalled()
    expect(screen.getByLabelText('Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Sort')).toBeInTheDocument()
  })
})
