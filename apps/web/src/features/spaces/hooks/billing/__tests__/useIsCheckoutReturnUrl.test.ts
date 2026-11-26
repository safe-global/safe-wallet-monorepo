import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { useIsCheckoutReturnUrl } from '../useIsCheckoutReturnUrl'

describe('useIsCheckoutReturnUrl', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('is true while the router query carries a checkout session', () => {
    const { result } = renderHook(() => useIsCheckoutReturnUrl(), {
      routerProps: { query: { sessionId: faker.string.alphanumeric(16) } },
    })

    expect(result.current).toBe(true)
  })

  it('is false without a checkout session', () => {
    const { result } = renderHook(() => useIsCheckoutReturnUrl(), { routerProps: { query: {} } })

    expect(result.current).toBe(false)
  })

  it('reads the location while the router has no query yet', () => {
    window.history.replaceState(null, '', `/spaces?sessionId=${faker.string.alphanumeric(16)}`)

    const { result } = renderHook(() => useIsCheckoutReturnUrl(), { routerProps: { query: {} } })

    expect(result.current).toBe(true)
  })
})
