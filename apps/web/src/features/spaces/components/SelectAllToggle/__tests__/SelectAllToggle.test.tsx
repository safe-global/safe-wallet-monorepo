import { render, screen, fireEvent } from '@/tests/test-utils'
import SelectAllToggle from '../SelectAllToggle'

describe('SelectAllToggle', () => {
  it('calls onToggle(true) when in "none" state and clicked', () => {
    const onToggle = jest.fn()
    render(<SelectAllToggle state="none" count={0} total={3} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('calls onToggle(true) when in "some" (indeterminate) state and clicked', () => {
    const onToggle = jest.fn()
    render(<SelectAllToggle state="some" count={1} total={3} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('calls onToggle(false) when in "all" state and clicked', () => {
    const onToggle = jest.fn()
    render(<SelectAllToggle state="all" count={3} total={3} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }))
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('shows count when showCount is set and total > 0', () => {
    const { container } = render(<SelectAllToggle state="some" count={2} total={5} onToggle={() => {}} showCount />)
    expect(container).toHaveTextContent('Select all')
    expect(container).toHaveTextContent('(2/5)')
  })

  it('omits the count when showCount is not set', () => {
    const { container } = render(<SelectAllToggle state="some" count={2} total={5} onToggle={() => {}} />)
    expect(container).toHaveTextContent('Select all')
    expect(container).not.toHaveTextContent('2/5')
  })

  it('is disabled when total is 0', () => {
    const onToggle = jest.fn()
    render(<SelectAllToggle state="none" count={0} total={0} onToggle={onToggle} />)

    const button = screen.getByRole('checkbox')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onToggle).not.toHaveBeenCalled()
  })
})
