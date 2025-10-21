import { render, screen } from '@testing-library/react'
import { FiatChange } from './FiatChange'

describe('FiatChange', () => {
  it('renders "n/a" when change is not present', () => {
    render(<FiatChange change={undefined} />)
    expect(screen.getByText('n/a')).toBeInTheDocument()
  })

  it('renders positive change with green chip and up arrow', () => {
    render(<FiatChange change="5.00" />)

    const chip = screen.getByText('5.00%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'success.background', color: 'success.main' })
  })

  it('renders negative change with red chip and down arrow', () => {
    render(<FiatChange change="-3.00" />)

    const chip = screen.getByText('3.00%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'error.background', color: 'error.main' })
  })

  it('renders zero change with default styling', () => {
    render(<FiatChange change="0" />)

    const chip = screen.getByText('0.00%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'default', color: 'default' })
  })

  it('renders up to 2 decimal places', () => {
    render(<FiatChange change="5.12345" />)

    const chip = screen.getByText('5.12%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'success.background', color: 'success.main' })
  })

  it('rounds correctly', () => {
    render(<FiatChange change="4.269" />)

    const chip = screen.getByText('4.27%')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveStyle({ backgroundColor: 'success.background', color: 'success.main' })
  })
})
