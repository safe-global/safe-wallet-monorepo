import { render } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import TrustedAccountsActions from './index'

describe('TrustedAccountsActions', () => {
  it('renders the Add and Manage actions', () => {
    const { getByTestId } = render(<TrustedAccountsActions onManage={jest.fn()} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    expect(getByTestId('add-safe-button')).toBeInTheDocument()
    expect(getByTestId('add-more-safes-button')).toHaveTextContent('Manage trusted Safes')
  })

  it('calls onManage when the manage button is clicked', async () => {
    const onManage = jest.fn()
    const { getByTestId } = render(<TrustedAccountsActions onManage={onManage} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    await userEvent.click(getByTestId('add-more-safes-button'))
    expect(onManage).toHaveBeenCalledTimes(1)
  })

  it('links "Add" to /new-safe/load with the current page as `next`', () => {
    const { getByTestId } = render(<TrustedAccountsActions onManage={jest.fn()} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    const href = getByTestId('add-safe-button').getAttribute('href') ?? ''
    const url = new URL(href, 'http://localhost')
    expect(url.pathname).toBe('/new-safe/load')
    expect(url.searchParams.get('next')).toBe('/welcome/accounts')
  })
})
