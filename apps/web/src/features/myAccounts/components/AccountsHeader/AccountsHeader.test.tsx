import { render } from '@/tests/test-utils'
import AccountsHeader from './index'

jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))

jest.mock('../AccountsNavigation', () => ({
  __esModule: true,
  default: () => <div data-testid="accounts-nav" />,
}))

jest.mock('@/components/common/ConnectWallet/ConnectWalletButton', () => ({
  __esModule: true,
  default: () => <button data-testid="connect-wallet-btn">Connect</button>,
}))

describe('AccountsHeader', () => {
  it('the "Add" button links to /new-safe/load with the current page as `next`', () => {
    const { getByTestId } = render(<AccountsHeader isSidebar={false} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    const href = getByTestId('add-safe-button').getAttribute('href') ?? ''
    const url = new URL(href, 'http://localhost')
    expect(url.pathname).toBe('/new-safe/load')
    expect(url.searchParams.get('next')).toBe('/welcome/accounts')
  })
})
