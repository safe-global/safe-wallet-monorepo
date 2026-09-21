import { render } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import GetStartedCard from './index'

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

describe('GetStartedCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the heading and both call-to-actions', () => {
    const { getByRole, getByTestId } = render(<GetStartedCard />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    expect(getByRole('heading', { name: /get started/i })).toBeInTheDocument()
    expect(getByTestId('connect-wallet-button')).toBeInTheDocument()
    expect(getByTestId('watch-account-button')).toBeInTheDocument()
  })

  it('opens the wallet onboarding when "Connect wallet" is clicked', async () => {
    const { getByTestId } = render(<GetStartedCard />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    await userEvent.click(getByTestId('connect-wallet-button'))
    expect(mockConnectWallet).toHaveBeenCalled()
  })

  it('links "Watch any account" to /new-safe/load with the current page as `next`', () => {
    const { getByTestId } = render(<GetStartedCard />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    const href = getByTestId('watch-account-button').getAttribute('href') ?? ''
    const url = new URL(href, 'http://localhost')
    expect(url.pathname).toBe('/new-safe/load')
    expect(url.searchParams.get('next')).toBe('/welcome/accounts')
  })
})
