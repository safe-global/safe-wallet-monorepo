import { render, screen } from '@/tests/test-utils'
import WelcomeFooter from '../WelcomeFooter'

// Mock package.json version
jest.mock('../../../../package.json', () => ({
  version: '1.2.3',
  homepage: 'https://github.com/safe-global/safe-wallet-web',
}))

describe('WelcomeFooter', () => {
  it('Should render the footer', () => {
    render(<WelcomeFooter />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('Should display the correct year and company name', () => {
    render(<WelcomeFooter />)
    const date = new Date().getFullYear();

    expect(screen.getByText(`${date} Safe Labs`)).toBeInTheDocument()
  })

  it('Should render all footer links', () => {
    render(<WelcomeFooter />)

    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /licenses/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /imprint/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cookies/i })).toBeInTheDocument()
  })

  it('Should render version number', () => {
    render(<WelcomeFooter />)

    expect(screen.getByText('v1.2.3')).toBeInTheDocument()
  })

  it('Should have correct href for Terms link', () => {
    render(<WelcomeFooter />)

    const termsLink = screen.getByRole('link', { name: /terms/i })
    expect(termsLink).toHaveAttribute('href', '/terms')
  })

  it('Should have correct href for Privacy link', () => {
    render(<WelcomeFooter />)

    const privacyLink = screen.getByRole('link', { name: /privacy/i })
    expect(privacyLink).toHaveAttribute('href', '/privacy')
  })

  it('Should have correct href for Licenses link', () => {
    render(<WelcomeFooter />)

    const licensesLink = screen.getByRole('link', { name: /licenses/i })
    expect(licensesLink).toHaveAttribute('href', '/licenses')
  })

  it('Should have correct href for Imprint link', () => {
    render(<WelcomeFooter />)

    const imprintLink = screen.getByRole('link', { name: /imprint/i })
    expect(imprintLink).toHaveAttribute('href', '/imprint')
  })

  it('Should have correct href for Cookies link', () => {
    render(<WelcomeFooter />)

    const cookiesLink = screen.getByRole('link', { name: /cookies/i })
    expect(cookiesLink).toHaveAttribute('href', '/cookie')
  })

  it('Should have correct href for version link', () => {
    render(<WelcomeFooter />)

    const versionLink = screen.getByText('v1.2.3').closest('a')
    expect(versionLink).toHaveAttribute(
      'href',
      'https://github.com/safe-global/safe-wallet-web/releases/tag/v1.2.3',
    )
    expect(versionLink).toHaveAttribute('target', '_blank')
    expect(versionLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('Should render links in a list', () => {
    const { container } = render(<WelcomeFooter />)

    const list = container.querySelector('ul')
    expect(list).toBeInTheDocument()

    const listItems = container.querySelectorAll('li')
    expect(listItems.length).toBe(7) // 6 links + copyright
  })

  it('Should have proper structure for accessibility', () => {
    const { container } = render(<WelcomeFooter />)

    const footer = container.querySelector('footer')
    expect(footer).toBeInTheDocument()

    const ul = footer?.querySelector('ul')
    expect(ul).toBeInTheDocument()

    const links = footer?.querySelectorAll('a')
    links?.forEach((link) => {
      expect(link.closest('li')).toBeInTheDocument()
    })
  })
})


