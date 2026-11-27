import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { useIsSafeInCurrentSpace } from '../useIsSafeInCurrentSpace'

const spaceId = faker.string.uuid()
const chainId = faker.string.numeric(2)
const safeAddress = faker.finance.ethereumAddress()

const signedInAuth = {
  sessionExpiresAt: Date.now() + 60_000,
  landingSpaceHint: null,
  isStoreHydrated: true,
  cfSafeSynced: false,
  isOidcLoginPending: false,
  isSessionCheckPending: false,
}

const respondWithSpaceSafes = (safes: Record<string, string[]>) => {
  const requests = { count: 0 }
  server.use(
    http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => {
      requests.count += 1
      return HttpResponse.json({ safes })
    }),
  )
  return requests
}

type RenderOptions = {
  query?: Record<string, string>
  sessionExpiresAt?: number | null
  address?: string
}

const renderInSpace = ({
  query = { spaceId },
  sessionExpiresAt = signedInAuth.sessionExpiresAt,
  address = safeAddress,
}: RenderOptions = {}) =>
  renderHook(() => useIsSafeInCurrentSpace(chainId, address), {
    routerProps: { query },
    initialReduxState: { auth: { ...signedInAuth, sessionExpiresAt } },
  })

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

describe('useIsSafeInCurrentSpace', () => {
  it('returns true for a Safe in the Workspace on the same chain', async () => {
    respondWithSpaceSafes({ [chainId]: [safeAddress] })

    const { result } = renderInSpace()

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('matches the address regardless of its case', async () => {
    respondWithSpaceSafes({ [chainId]: [safeAddress.toLowerCase()] })

    const { result } = renderInSpace({ address: safeAddress.toUpperCase().replace('0X', '0x') })

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('returns false for a Safe that is not in the Workspace', async () => {
    const requests = respondWithSpaceSafes({ [chainId]: [faker.finance.ethereumAddress()] })

    const { result } = renderInSpace()

    await waitFor(() => expect(requests.count).toBe(1))
    await settle()
    expect(result.current).toBe(false)
  })

  it('returns false when the Workspace has the address only on another chain', async () => {
    const requests = respondWithSpaceSafes({ [`${chainId}0`]: [safeAddress] })

    const { result } = renderInSpace()

    await waitFor(() => expect(requests.count).toBe(1))
    await settle()
    expect(result.current).toBe(false)
  })

  it('returns false outside a Workspace without a request', async () => {
    const requests = respondWithSpaceSafes({ [chainId]: [safeAddress] })

    const { result } = renderInSpace({ query: {} })

    await settle()
    expect(requests.count).toBe(0)
    expect(result.current).toBe(false)
  })

  it('returns false for a signed-out user without a request', async () => {
    const requests = respondWithSpaceSafes({ [chainId]: [safeAddress] })

    const { result } = renderInSpace({ sessionExpiresAt: null })

    await settle()
    expect(requests.count).toBe(0)
    expect(result.current).toBe(false)
  })
})
