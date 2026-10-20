import { fireEvent, mockClipboard, render, screen } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import ContactCell from '../ContactCell'
import { ADDRESSES } from '../mocks/fixtures'

describe('ContactCell', () => {
  it('copies the checksummed address', () => {
    const writeText = mockClipboard()
    render(<ContactCell name="Treasury" address={ADDRESSES.treasury.toLowerCase()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

    expect(writeText).toHaveBeenCalledWith(checksumAddress(ADDRESSES.treasury))
  })

  it('marks a contact from the local address book', () => {
    render(<ContactCell name="My hardware wallet" address={ADDRESSES.hardwareWallet} isLocal />)

    expect(screen.getByLabelText('Local contact')).toBeInTheDocument()
  })

  it('links the address to the block explorer', () => {
    const explorerLink = { href: `https://etherscan.io/address/${ADDRESSES.treasury}`, title: 'View on etherscan.io' }
    render(<ContactCell name="Treasury" address={ADDRESSES.treasury} explorerLink={explorerLink} />)

    expect(screen.getByRole('link', { name: 'View on etherscan.io' })).toHaveAttribute('href', explorerLink.href)
  })

  it('has no explorer link when the chain has no explorer', () => {
    render(<ContactCell name="Treasury" address={ADDRESSES.treasury} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
