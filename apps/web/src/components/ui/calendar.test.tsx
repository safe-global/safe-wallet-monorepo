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

  // The day button owns its own focus: react-day-picker only flags which day should be focused, so a
  // CalendarDayButton that drops its ref leaves focus stuck and kills arrow-key navigation.
  it('moves focus with the arrow keys', async () => {
    render(<Calendar mode="single" defaultMonth={defaultMonth} />)

    const day = (label: string) => screen.getByRole('button', { name: label })

    day('Tuesday, March 10th, 2026').focus()
    expect(day('Tuesday, March 10th, 2026')).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    expect(day('Wednesday, March 11th, 2026')).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    expect(day('Wednesday, March 18th, 2026')).toHaveFocus()
  })

  it('disables specified dates', () => {
    const disabledDate = new Date(2026, 2, 10)
    render(<Calendar mode="single" defaultMonth={defaultMonth} disabled={disabledDate} />)

    const dayButton = screen.getByRole('button', { name: /10/ })
    expect(dayButton).toBeDisabled()
  })
})
