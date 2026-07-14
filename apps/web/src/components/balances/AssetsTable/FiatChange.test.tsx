import { render, screen } from '@testing-library/react'
import { FiatChange } from './FiatChange'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

// The percentage label is rendered inside the migrated Chip; the Chip element that
// carries the variant utility classes is its parent (the tooltip trigger span).
const getChip = (label: string): HTMLElement => {
  const element = screen.getByText(label).parentElement
  if (!element) throw new Error(`Chip wrapper not found for "${label}"`)
  return element
}

describe('FiatChange', () => {
  it('renders "n/a" when fiatBalance24hChange is not present', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: undefined,
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)
    expect(screen.getByText('n/a')).toBeInTheDocument()
  })

  it('renders positive change with green chip and up arrow', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '5.00', // 5% increase
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    expect(screen.getByText('5.00%')).toBeInTheDocument()
    expect(getChip('5.00%')).toHaveClass('bg-success-subtle', 'text-success-strong')
  })

  it('renders negative change with red chip and down arrow', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '-3.00', // 3% decrease
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    expect(screen.getByText('3.00%')).toBeInTheDocument()
    expect(getChip('3.00%')).toHaveClass('bg-destructive/10', 'text-destructive')
  })

  it('renders zero change with default styling', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '0',
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    expect(screen.getByText('0.00%')).toBeInTheDocument()
    expect(getChip('0.00%')).toHaveClass('bg-secondary', 'text-secondary-foreground')
  })

  it('renders up to 2 decimal places', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '5.12345', // 5% increase
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    expect(screen.getByText('5.12%')).toBeInTheDocument()
    expect(getChip('5.12%')).toHaveClass('bg-success-subtle', 'text-success-strong')
  })

  it('rounds correctly', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '4.269', // 5% increase
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    expect(screen.getByText('4.27%')).toBeInTheDocument()
    expect(getChip('4.27%')).toHaveClass('bg-success-subtle', 'text-success-strong')
  })

  it('uses change prop when provided instead of balanceItem', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '2.00',
    } as Balance

    render(<FiatChange balanceItem={mockBalance} change="5.00" />)

    const chip = screen.getByText('5.00%')
    expect(chip).toBeInTheDocument()
  })

  it('uses change prop when balanceItem is not provided', () => {
    render(<FiatChange change="3.50" />)

    const chip = screen.getByText('3.50%')
    expect(chip).toBeInTheDocument()
  })

  it('falls back to balanceItem when change is null', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '4.00',
    } as Balance

    render(<FiatChange balanceItem={mockBalance} change={null} />)

    const chip = screen.getByText('4.00%')
    expect(chip).toBeInTheDocument()
  })

  it('renders inline variant correctly', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '5.00',
    } as Balance

    render(<FiatChange balanceItem={mockBalance} inline />)

    const chip = screen.getByText('5.00%')
    expect(chip).toBeInTheDocument()
  })
})
