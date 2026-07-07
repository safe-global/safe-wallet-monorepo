import { render, screen } from '@/tests/test-utils'
import AddressWithCopy from '.'

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

describe('AddressWithCopy', () => {
  it('shows the shortened address by default and the full address with `full`', () => {
    const { rerender } = render(<AddressWithCopy address={ADDRESS} />)
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument()

    rerender(<AddressWithCopy address={ADDRESS} full />)
    expect(screen.getByText(ADDRESS)).toBeInTheDocument()
  })

  it('renders the copy affordance by default and hides it with showCopy=false', () => {
    const { rerender } = render(<AddressWithCopy address={ADDRESS} />)
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()

    rerender(<AddressWithCopy address={ADDRESS} showCopy={false} />)
    expect(screen.queryByRole('button', { name: 'Copy address' })).not.toBeInTheDocument()
  })

  it('renders a block-explorer link only when explorerLink is provided', () => {
    const { rerender } = render(<AddressWithCopy address={ADDRESS} />)
    expect(screen.queryByTestId('address-explorer-link')).not.toBeInTheDocument()

    rerender(
      <AddressWithCopy
        address={ADDRESS}
        explorerLink={{ href: 'https://etherscan.io/address/x', title: 'View on Etherscan' }}
      />,
    )
    const link = screen.getByTestId('address-explorer-link')
    expect(link).toHaveAttribute('href', 'https://etherscan.io/address/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('aria-label', 'View on Etherscan')
  })

  it('stops affordance clicks from bubbling to a clickable parent row', () => {
    const onRowClick = jest.fn()
    render(
      <div onClick={onRowClick}>
        <AddressWithCopy
          address={ADDRESS}
          full
          explorerLink={{ href: 'https://etherscan.io/address/x', title: 'View on Etherscan' }}
        />
      </div>,
    )

    screen.getByRole('button', { name: 'Copy address' }).click()
    screen.getByTestId('address-explorer-link').click()
    expect(onRowClick).not.toHaveBeenCalled()

    // A click on the address text itself still reaches the row.
    screen.getByText(ADDRESS).click()
    expect(onRowClick).toHaveBeenCalledTimes(1)
  })
})
