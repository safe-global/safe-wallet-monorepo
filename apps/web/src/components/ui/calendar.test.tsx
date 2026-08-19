import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { Calendar } from './calendar'

describe('Calendar', () => {
  const defaultMonth = new Date(2026, 2, 1) // March 2026

  it('renders the calendar grid and month caption', () => {
    render(<Calendar mode="single" defaultMonth={defaultMonth} />)

    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByText('March 2026')).toBeInTheDocument()
  })

  it('calls onSelect when a day is clicked', async () => {
    const handleSelect = jest.fn()
    render(<Calendar mode="single" defaultMonth={defaultMonth} onSelect={handleSelect} />)

    const dayButton = screen.getByRole('button', { name: /15/ })
    await userEvent.click(dayButton)

    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('navigates to next and previous months', async () => {
    render(<Calendar mode="single" defaultMonth={defaultMonth} />)

    expect(screen.getByText('March 2026')).toBeInTheDocument()

    const nextButton = screen.getByRole('button', { name: /next/i })
    await userEvent.click(nextButton)

    expect(screen.getByText('April 2026')).toBeInTheDocument()

    const prevButton = screen.getByRole('button', { name: /previous/i })
    await userEvent.click(prevButton)

    expect(screen.getByText('March 2026')).toBeInTheDocument()
  })

  it('supports dropdown caption layout', () => {
    render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        startMonth={new Date(2020, 0)}
        endMonth={new Date(2030, 11)}
        defaultMonth={defaultMonth}
      />,
    )

    const dropdowns = screen.getAllByRole('combobox')
    expect(dropdowns.length).toBeGreaterThanOrEqual(1)
  })

  it('disables specified dates', () => {
    const disabledDate = new Date(2026, 2, 10)
    render(<Calendar mode="single" defaultMonth={defaultMonth} disabled={disabledDate} />)

    const dayButton = screen.getByRole('button', { name: /10/ })
    expect(dayButton).toBeDisabled()
  })
})
