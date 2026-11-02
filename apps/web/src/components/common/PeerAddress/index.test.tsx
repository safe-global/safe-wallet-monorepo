import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import PeerAddress from '.'

const boldTexts = (container: HTMLElement) => Array.from(container.querySelectorAll('b')).map((b) => b.textContent)

describe('PeerAddress', () => {
  it('shows the full address', () => {
    const address = fakerChecksummedAddress()

    const { container } = render(<PeerAddress address={address} />)

    expect(container).toHaveTextContent(address)
  })

  it('bolds the given number of leading and trailing hex characters', () => {
    const address = fakerChecksummedAddress()

    const { container } = render(<PeerAddress address={address} prefixLen={4} suffixLen={6} />)

    expect(boldTexts(container)).toEqual([address.slice(2, 6), address.slice(-6)])
  })

  it('bolds nothing when no match lengths are given', () => {
    const { container } = render(<PeerAddress address={fakerChecksummedAddress()} />)

    expect(boldTexts(container)).toEqual([])
  })

  it('copies the address to the clipboard', async () => {
    const writeText = jest.fn(() => Promise.resolve())
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      const address = fakerChecksummedAddress()
      render(<PeerAddress address={address} />)

      await userEvent.click(screen.getByRole('button', { name: 'Copy address' }))

      expect(writeText).toHaveBeenCalledWith(address)
    } finally {
      if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('links to the block explorer when an explorer link is given', () => {
    const address = fakerChecksummedAddress()
    const explorerLink = { href: `${faker.internet.url()}/address/${address}`, title: 'View on etherscan.io' }

    render(<PeerAddress address={address} explorerLink={explorerLink} />)

    expect(screen.getByRole('link', { name: explorerLink.title })).toHaveAttribute('href', explorerLink.href)
  })

  it('has no explorer link when none is given', () => {
    render(<PeerAddress address={fakerChecksummedAddress()} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
