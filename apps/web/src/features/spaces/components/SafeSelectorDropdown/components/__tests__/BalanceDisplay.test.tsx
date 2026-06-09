import { render, screen } from '@testing-library/react'
import BalanceDisplay from '../BalanceDisplay'

const querySkeleton = (container: HTMLElement) => container.querySelector('[data-slot="skeleton"]')

describe('BalanceDisplay', () => {
  it('renders the threshold badge when threshold/owners are loaded', () => {
    const { container } = render(<BalanceDisplay threshold={2} owners={3} />)

    expect(screen.getByTestId('safe-selector-threshold')).toHaveTextContent('2/3')
    expect(querySkeleton(container)).not.toBeInTheDocument()
  })

  it('shows a skeleton instead of "0/0" when the overview has not loaded', () => {
    const { container } = render(<BalanceDisplay threshold={0} owners={0} />)

    expect(screen.queryByTestId('safe-selector-threshold')).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent('0/0')
    expect(querySkeleton(container)).toBeInTheDocument()
  })

  it('shows a skeleton while explicitly loading', () => {
    const { container } = render(<BalanceDisplay threshold={2} owners={3} isLoading />)

    expect(screen.queryByTestId('safe-selector-threshold')).not.toBeInTheDocument()
    expect(querySkeleton(container)).toBeInTheDocument()
  })

  it('renders nothing for the threshold when showThreshold is false', () => {
    const { container } = render(<BalanceDisplay threshold={0} owners={0} showThreshold={false} />)

    expect(screen.queryByTestId('safe-selector-threshold')).not.toBeInTheDocument()
    expect(querySkeleton(container)).not.toBeInTheDocument()
  })
})
