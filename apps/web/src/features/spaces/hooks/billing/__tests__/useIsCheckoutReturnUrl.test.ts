import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { useIsCheckoutReturnUrl } from '../useIsCheckoutReturnUrl'

const mockBillingSpaceId = jest.fn()
jest.mock('../useBillingSpaceId', () => ({ useBillingSpaceId: () => mockBillingSpaceId() }))

describe('useIsCheckoutReturnUrl', () => {
  beforeEach(() => mockBillingSpaceId.mockReturnValue(faker.string.uuid()))
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

  it('ignores a checkout session that no checkout return will confirm, such as when Safe Pro is off', () => {
    mockBillingSpaceId.mockReturnValue(null)

    const { result } = renderHook(() => useIsCheckoutReturnUrl(), {
      routerProps: { query: { sessionId: faker.string.alphanumeric(16) } },
    })

    expect(result.current).toBe(false)
  })
})
