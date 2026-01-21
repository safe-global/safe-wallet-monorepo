import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { HypernativeInfo } from '../HypernativeInfo'
import type { HypernativeAuthStatus } from '@/features/hypernative/hooks/useHypernativeOAuth'

const makeAuthStatus = (overrides: Partial<HypernativeAuthStatus> = {}): HypernativeAuthStatus => ({
  isAuthenticated: false,
  isTokenExpired: false,
  initiateLogin: jest.fn(),
  logout: jest.fn(),
  ...overrides,
})

describe('HypernativeInfo', () => {
  it('renders nothing when auth is not provided', () => {
    const { container } = render(<HypernativeInfo />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows login CTA when user is not authenticated', async () => {
    const user = userEvent.setup()
    const authStatus = makeAuthStatus()

    render(<HypernativeInfo hypernativeAuth={authStatus} />)

    expect(screen.getByText('Log in to Hypernative to view the full analysis.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(authStatus.initiateLogin).toHaveBeenCalled()
  })

  it('shows login CTA when token is expired', () => {
    const authStatus = makeAuthStatus({ isAuthenticated: true, isTokenExpired: true })

    render(<HypernativeInfo hypernativeAuth={authStatus} />)

    expect(screen.getByText('Log in to Hypernative to view the full analysis.')).toBeInTheDocument()
  })

  it('hides login CTA when authenticated and token is valid', () => {
    const authStatus = makeAuthStatus({ isAuthenticated: true, isTokenExpired: false })

    render(<HypernativeInfo hypernativeAuth={authStatus} />)

    expect(screen.queryByText('Log in to Hypernative to view the full analysis.')).not.toBeInTheDocument()
    expect(screen.getByText('Hypernative Guardian is active')).toBeInTheDocument()
  })

  it('shows connected state when authenticated and token is valid', () => {
    const authStatus = makeAuthStatus({ isAuthenticated: true, isTokenExpired: false })

    render(<HypernativeInfo hypernativeAuth={authStatus} />)

    expect(screen.getByText('Hypernative Guardian is active')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument()
  })

  it('hides active guardian message when showActiveStatus is false', () => {
    const authStatus = makeAuthStatus()

    render(<HypernativeInfo hypernativeAuth={authStatus} showActiveStatus={false} />)

    expect(screen.queryByText('Hypernative Guardian is active')).not.toBeInTheDocument()
    expect(screen.getByText('Log in to Hypernative to view the full analysis.')).toBeInTheDocument()
  })

  it('returns null when no login card is needed and showActiveStatus is false', () => {
    const authStatus = makeAuthStatus({ isAuthenticated: true, isTokenExpired: false })

    const { container } = render(<HypernativeInfo hypernativeAuth={authStatus} showActiveStatus={false} />)

    expect(container).toBeEmptyDOMElement()
  })
})
