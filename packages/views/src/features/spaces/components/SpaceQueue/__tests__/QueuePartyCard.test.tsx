import { fireEvent, render, screen } from '@/tests/test-utils'
import { getPartyTitle, QueuePartyCard } from '@safe-global/views/features/spaces/components/SpaceQueue/QueuePartyCard'

const address = '0x1234567890123456789012345678901234567890'

const renderCard = (props: Partial<Parameters<typeof QueuePartyCard>[0]> = {}) =>
  render(
    <QueuePartyCard
      avatar={<span />}
      title="Treasury on Ethereum"
      address={address}
      copied={false}
      onCopy={jest.fn()}
      {...props}
    />,
  )

describe('getPartyTitle', () => {
  it.each([
    ['Treasury', 'Ethereum', 'Treasury on Ethereum'],
    ['Alice', undefined, 'Alice'],
    [undefined, 'Ethereum', 'Not in your address book'],
  ])('titles %s on %s as %s', (name, network, title) => {
    expect(getPartyTitle(name, network)).toBe(title)
  })
})

describe('QueuePartyCard', () => {
  it('shows the title and the full address', () => {
    renderCard()

    expect(screen.getByText('Treasury on Ethereum')).toHaveClass('font-medium')
    expect(screen.getByText(address)).toHaveClass('font-mono', 'text-background/70')
  })

  it('copies the address, then says it did', () => {
    const onCopy = jest.fn()
    const { rerender } = renderCard({ onCopy })

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(onCopy).toHaveBeenCalledTimes(1)

    rerender(<QueuePartyCard avatar={<span />} title="T" address={address} copied onCopy={onCopy} />)
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('links to the explorer in a new tab', () => {
    renderCard({ explorer: { href: `https://etherscan.io/address/${address}`, label: 'Etherscan' } })

    const link = screen.getByRole('link', { name: 'Etherscan' })
    expect(link).toHaveAttribute('href', `https://etherscan.io/address/${address}`)
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('offers to add the address to the address book only when it can', () => {
    const onAddToAddressBook = jest.fn()
    const { rerender } = renderCard()
    expect(screen.queryByRole('button', { name: 'Add to address book' })).not.toBeInTheDocument()

    rerender(
      <QueuePartyCard
        avatar={<span />}
        title="Not in your address book"
        address={address}
        copied={false}
        onCopy={jest.fn()}
        onAddToAddressBook={onAddToAddressBook}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add to address book' }))
    expect(onAddToAddressBook).toHaveBeenCalledTimes(1)
  })

  it('keeps its clicks from reaching the row', () => {
    const onRowClick = jest.fn()
    render(
      <div onClick={onRowClick}>
        <QueuePartyCard avatar={<span />} title="T" address={address} copied={false} onCopy={jest.fn()} />
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
