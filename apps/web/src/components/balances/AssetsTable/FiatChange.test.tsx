import { render, screen } from '@testing-library/react'
import { FiatChange } from './FiatChange'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

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

    const chip = screen.getByText('5.00%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'success.background', color: 'success.main' })
  })

  it('renders negative change with red chip and down arrow', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '-3.00', // 3% decrease
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    const chip = screen.getByText('3.00%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'error.background', color: 'error.main' })
  })

  it('renders zero change with default styling', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '0',
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    const chip = screen.getByText('0.00%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'default', color: 'default' })
  })

  it('renders up to 2 decimal places', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '5.12345', // 5% increase
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    const chip = screen.getByText('5.12%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'success.background', color: 'success.main' })
  })

  it('rounds correctly', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '4.269', // 5% increase
    } as Balance

    render(<FiatChange balanceItem={mockBalance} />)

    const chip = screen.getByText('4.27%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'success.background', color: 'success.main' })
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
