import { render, screen } from '@testing-library/react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import SafeInfoDisplay from '../SafeInfoDisplay'

const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const baseProps = {
  name: 'My Safe',
  address,
}

describe('SafeInfoDisplay', () => {
  it('renders the threshold badge on the avatar when threshold and owners are provided', () => {
    render(<SafeInfoDisplay {...baseProps} threshold={2} owners={3} />)
    expect(screen.getByTestId('safe-selector-threshold')).toHaveTextContent('2/3')
  })

  it('does not render the threshold badge when threshold/owners are omitted', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.queryByTestId('safe-selector-threshold')).not.toBeInTheDocument()
  })

  it('does not render the threshold badge when threshold or owners is 0', () => {
    render(<SafeInfoDisplay {...baseProps} threshold={0} owners={0} />)
    expect(screen.queryByTestId('safe-selector-threshold')).not.toBeInTheDocument()
  })

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

  it('renders a nameAction next to the name when provided', () => {
    render(<SafeInfoDisplay {...baseProps} nameAction={<span data-testid="my-action" />} />)
    expect(screen.getByTestId('my-action')).toBeInTheDocument()
  })

  it('renders no nameAction by default', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.queryByTestId('my-action')).not.toBeInTheDocument()
  })
})
