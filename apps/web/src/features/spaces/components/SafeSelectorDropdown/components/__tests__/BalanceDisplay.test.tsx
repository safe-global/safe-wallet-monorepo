import { render, screen } from '@testing-library/react'
import BalanceDisplay from '../BalanceDisplay'

const querySkeleton = (container: HTMLElement) => container.querySelector('[data-slot="skeleton"]')

describe('BalanceDisplay', () => {
  it('renders the balance when provided', () => {
    const { container } = render(<BalanceDisplay balance="$ 1,234" />)

    expect(screen.getByText('$ 1,234')).toBeInTheDocument()
    expect(querySkeleton(container)).not.toBeInTheDocument()
  })

  it('renders the balance in the shared row-end column (same trailing slot as the activation status)', () => {
    render(<BalanceDisplay balance="$ 1,234" />)

    expect(screen.getByTestId('row-end-column')).toContainElement(screen.getByText('$ 1,234'))
  })

  it('shows a skeleton while loading', () => {
    const { container } = render(<BalanceDisplay balance="$ 1,234" isLoading />)

    expect(screen.queryByText('$ 1,234')).not.toBeInTheDocument()
    expect(querySkeleton(container)).toBeInTheDocument()
  })

  it('renders nothing when no balance is provided', () => {
    const { container } = render(<BalanceDisplay />)

    expect(querySkeleton(container)).not.toBeInTheDocument()
    expect(container.querySelector('span,p')).not.toBeInTheDocument()
  })
})
