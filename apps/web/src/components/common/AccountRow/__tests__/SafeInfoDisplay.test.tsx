import { fireEvent, render, screen } from '@testing-library/react'
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

  it('writes out the full address on the address line', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.getByTestId('safe-item-address').textContent).toBe(address)
  })

  it('shows the shortened address on the name line when the name is empty', () => {
    render(<SafeInfoDisplay name="" address={address} />)
    expect(screen.getByText(shortenAddress(address))).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-address').textContent).toBe(address)
  })

  it('does not render the rename button without an onRename handler', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.queryByTestId('safe-item-rename-btn')).not.toBeInTheDocument()
  })

  it('calls onRename when the rename button is clicked', () => {
    const onRename = jest.fn()
    render(<SafeInfoDisplay {...baseProps} onRename={onRename} />)

    fireEvent.click(screen.getByTestId('safe-item-rename-btn'))
    expect(onRename).toHaveBeenCalledTimes(1)
  })

  it('renders an explorer link when an explorerLink is provided', () => {
    render(
      <SafeInfoDisplay
        {...baseProps}
        explorerLink={{ href: 'https://etherscan.io/address/0xaaa', title: 'View on Etherscan' }}
      />,
    )

    const link = screen.getByTestId('safe-item-row-explorer-link')
    expect(link).toHaveAttribute('href', 'https://etherscan.io/address/0xaaa')
  })

  it('does not render an explorer link without one', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.queryByTestId('safe-item-row-explorer-link')).not.toBeInTheDocument()
  })

  it('renders the name in medium weight by default and bold when nameVariant is set', () => {
    const { rerender } = render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.getByText('My Safe').className).toContain('font-medium')

    rerender(<SafeInfoDisplay {...baseProps} nameVariant="paragraph-bold" />)
    expect(screen.getByText('My Safe').className).toContain('font-semibold')
  })

  it('moves the explorer link next to the name when the address is hidden (and drops the copy button)', () => {
    render(
      <SafeInfoDisplay
        {...baseProps}
        hideAddress
        explorerLink={{ href: 'https://etherscan.io/address/0xaaa', title: 'View on Etherscan' }}
      />,
    )

    expect(screen.queryByTestId('safe-item-address')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-item-copy-address')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-item-row-explorer-link')).toHaveAttribute(
      'href',
      'https://etherscan.io/address/0xaaa',
    )
  })
})
