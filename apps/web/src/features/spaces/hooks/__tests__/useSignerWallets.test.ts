import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { RootState } from '@/store'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { useSignerWallets } from '../useSignerWallets'

const mockWallet = jest.fn<ConnectedWallet | null, []>()
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => mockWallet() }))

const signedIn: RootState['auth'] = {
  sessionExpiresAt: Date.now() + 60 * 60 * 1000,
  landingSpaceHint: null,
  isStoreHydrated: true,
  cfSafeSynced: false,
  isOidcLoginPending: false,
  isSessionCheckPending: false,
}

const linkWallets = (...addresses: string[]) =>
  server.use(
    http.get(`${GATEWAY_URL}/v1/users`, () =>
      HttpResponse.json({
        id: faker.number.int(),
        status: 1,
        wallets: addresses.map((address) => ({ id: faker.number.int(), address })),
      }),
    ),
  )

describe('useSignerWallets', () => {
  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
    mockWallet.mockReturnValue(null)
  })

  it("holds the signed-in user's linked wallets in lower case while none is connected", async () => {
    const linked = fakerChecksummedAddress()
    linkWallets(linked)

    const { result } = renderHook(() => useSignerWallets(), { initialReduxState: { auth: signedIn } })

    await waitFor(() => expect([...result.current]).toEqual([linked.toLowerCase()]))
  })

  it('holds the connected wallet when it is not linked to the user', async () => {
    const linked = fakerChecksummedAddress()
    const connected = fakerChecksummedAddress()
    linkWallets(linked)
    mockWallet.mockReturnValue(connectedWalletBuilder().with({ address: connected }).build())

    const { result } = renderHook(() => useSignerWallets(), { initialReduxState: { auth: signedIn } })

    await waitFor(() => expect(result.current).toEqual(new Set([linked.toLowerCase(), connected.toLowerCase()])))
  })

  it('holds the connected wallet when no user is signed in', () => {
    const connected = fakerChecksummedAddress()
    mockWallet.mockReturnValue(connectedWalletBuilder().with({ address: connected }).build())

    const { result } = renderHook(() => useSignerWallets())

    expect([...result.current]).toEqual([connected.toLowerCase()])
  })
})
