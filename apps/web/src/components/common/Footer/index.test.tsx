import Footer from './index'
import { render, screen } from '@/tests/test-utils'
import { AppRoutes } from '@/config/routes'

const renderAt = (pathname: string) => render(<Footer />, { routerProps: { pathname } })

describe('Footer', () => {
  it('renders on the welcome accounts page', () => {
    renderAt(AppRoutes.welcome.accounts)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders on the welcome spaces page', () => {
    renderAt(AppRoutes.welcome.spaces)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders on settings sub-routes', () => {
    renderAt('/settings/setup')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('does not render on non-footer routes', () => {
    renderAt(AppRoutes.home)
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  it('renders on any route when forceShow is set', () => {
    render(<Footer forceShow />, { routerProps: { pathname: AppRoutes.home } })
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
