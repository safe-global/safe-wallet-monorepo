import { render } from '@/tests/test-utils'
import CreateButton from './index'

describe('CreateButton', () => {
  it('links to /new-safe/create with the current page as `next`', () => {
    const { getByTestId } = render(<CreateButton isPrimary />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    const href = getByTestId('create-safe-btn').getAttribute('href') ?? ''
    const url = new URL(href, 'http://localhost')
    expect(url.pathname).toBe('/new-safe/create')
    expect(url.searchParams.get('next')).toBe('/welcome/accounts')
  })

  it('preserves the originating query params in `next`', () => {
    const { getByTestId } = render(<CreateButton isPrimary={false} />, {
      routerProps: { pathname: '/welcome/accounts', query: { foo: 'bar' } },
    })

    const href = getByTestId('create-safe-btn').getAttribute('href') ?? ''
    const url = new URL(href, 'http://localhost')
    expect(url.searchParams.get('next')).toBe('/welcome/accounts?foo=bar')
  })
})
