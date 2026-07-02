import { render, screen } from '@testing-library/react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import SafeInfoDisplay from '../SafeInfoDisplay'

const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const baseProps = {
  name: 'My Safe',
  address,
}

describe('SafeInfoDisplay', () => {
  it('renders the name and a copy button on the address line', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.getByText('My Safe')).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-copy-address')).toBeInTheDocument()
  })

  it('shows the shortened address on the address line', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.getByText(shortenAddress(address))).toBeInTheDocument()
  })

  it('shows the shortened address on both lines when the name is empty', () => {
    render(<SafeInfoDisplay name="" address={address} />)
    // No name → the name line falls back to the address, so it appears on both the name and address lines.
    expect(screen.getAllByText(shortenAddress(address))).toHaveLength(2)
  })
})
