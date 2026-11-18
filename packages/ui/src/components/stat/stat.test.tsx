import { render, screen } from '@testing-library/react'
import { Stat } from './stat'

describe('Stat', () => {
  it('renders the label above the value', () => {
    render(<Stat label="Total value" value="$123,456.01" />)

    expect(screen.getByText('Total value')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '$123,456.01' })).toHaveClass('font-bold')
  })

  it('shows a skeleton instead of the value while loading', () => {
    const { container } = render(<Stat label="Total value" value="$123,456.01" loading />)

    expect(screen.queryByText('$123,456.01')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('spreads valueProps onto the value and props onto the root', () => {
    render(
      <Stat
        label="Total value"
        value="$1"
        data-testid="stat"
        valueProps={{ 'data-testid': 'total-value', className: 'text-primary' }}
      />,
    )

    expect(screen.getByTestId('total-value')).toHaveClass('font-bold', 'text-primary')
    expect(screen.getByTestId('stat')).toContainElement(screen.getByTestId('total-value'))
  })
})
