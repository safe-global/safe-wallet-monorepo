import { render, screen } from '@testing-library/react'
import SafeLogo from '../index'
import { AppRoutes } from '@/config/routes'

jest.mock('next/link', () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
  MockLink.displayName = 'Link'
  return { __esModule: true, default: MockLink }
})

describe('SafeLogo', () => {
  it('renders a link to /welcome/spaces by default', () => {
    render(<SafeLogo />)
    expect(screen.getByRole('link')).toHaveAttribute('href', AppRoutes.welcome.spaces)
  })

  it('renders a link to the provided href', () => {
    render(<SafeLogo href="/welcome" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/welcome')
  })

  it('renders the Safe logo image with alt text and testid', () => {
    render(<SafeLogo />)
    const img = screen.getByTestId('logo-image')
    expect(img).toHaveAttribute('alt', 'Safe')
  })
})
