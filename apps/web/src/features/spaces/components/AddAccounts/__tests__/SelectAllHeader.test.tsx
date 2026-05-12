import { render, screen, fireEvent } from '@/tests/test-utils'
import SelectAllHeader from '../SelectAllHeader'

jest.mock('../../Sidebar/constants', () => ({
  SAFE_ACCOUNTS_LIMIT: 10,
}))

describe('SelectAllHeader', () => {
  it('renders nothing when total is 0', () => {
    const { container } = render(
      <SelectAllHeader state="none" selectedCount={0} total={0} onToggle={jest.fn()} capReached={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the toggle when total > 0', () => {
    render(<SelectAllHeader state="none" selectedCount={0} total={3} onToggle={jest.fn()} capReached={false} />)
    expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument()
  })

  it('shows the count', () => {
    const { container } = render(
      <SelectAllHeader state="some" selectedCount={2} total={5} onToggle={jest.fn()} capReached={false} />,
    )
    expect(container).toHaveTextContent('(2/5)')
  })

  it('does not show cap message when capReached is false', () => {
    const { container } = render(
      <SelectAllHeader state="some" selectedCount={2} total={5} onToggle={jest.fn()} capReached={false} />,
    )
    expect(container).not.toHaveTextContent('Limit')
  })

  it('shows cap message when capReached is true', () => {
    const { container } = render(
      <SelectAllHeader state="all" selectedCount={10} total={12} onToggle={jest.fn()} capReached={true} />,
    )
    expect(container).toHaveTextContent('Limit of 10 reached')
  })

  it('calls onToggle(true) when in "none" state and clicked', () => {
    const onToggle = jest.fn()
    render(<SelectAllHeader state="none" selectedCount={0} total={3} onToggle={onToggle} capReached={false} />)
    fireEvent.click(screen.getByRole('button', { name: /select all/i }))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('calls onToggle(false) when in "all" state and clicked', () => {
    const onToggle = jest.fn()
    render(<SelectAllHeader state="all" selectedCount={3} total={3} onToggle={onToggle} capReached={false} />)
    fireEvent.click(screen.getByRole('button', { name: /select all/i }))
    expect(onToggle).toHaveBeenCalledWith(false)
  })
})
