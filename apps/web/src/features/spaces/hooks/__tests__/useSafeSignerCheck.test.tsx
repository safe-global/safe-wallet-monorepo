import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { makeStore, setStoreInstance } from '@/store'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import { useSafeSignerCheck } from '../useSafeSignerCheck'

const CHAIN_ID = '1'
const WALLET = faker.finance.ethereumAddress()
const WALLET_B = faker.finance.ethereumAddress()
const STRANGER = faker.finance.ethereumAddress()
const NESTED_OWNER_SAFE = faker.finance.ethereumAddress()

const makeSafe = (isReadOnly = true): SafeItem => ({
  chainId: CHAIN_ID,
  address: faker.finance.ethereumAddress(),
  isReadOnly,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const ownedSafe = makeSafe(false)
const proposerSafe = makeSafe()
const nestedSafe = makeSafe()
const strangerSafe = makeSafe()
const safes = [ownedSafe, proposerSafe, nestedSafe, strangerSafe]

const ownersBySafe: Record<string, string[]> = {
  [ownedSafe.address]: [WALLET],
  [proposerSafe.address]: [STRANGER],
  [nestedSafe.address]: [NESTED_OWNER_SAFE],
  [strangerSafe.address]: [STRANGER],
}

const mockUseWallet = jest.fn()
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1', features: [] }], loading: false }),
}))

const overviewsHandler = () =>
  http.get(`${GATEWAY_URL}/v2/safes`, ({ request }) => {
    const ids = new URL(request.url).searchParams.get('safes')?.split(',') ?? []
    return HttpResponse.json(
      ids.map((id) => {
        const [chainId, address] = id.split(':')
        return {
          chainId,
          address: { value: address },
          owners: (ownersBySafe[address] ?? []).map((value) => ({ value })),
          threshold: 1,
          fiatTotal: '0',
          queued: 0,
        }
      }),
    )
  })

const delegatesRequests: Array<{ chainId: string; delegate: string | null }> = []
const delegatesHandler = (resolver?: () => Promise<Response> | Response) =>
  http.get(`${GATEWAY_URL}/v2/chains/:chainId/delegates`, ({ params, request }) => {
    const delegate = new URL(request.url).searchParams.get('delegate')
    delegatesRequests.push({ chainId: params.chainId as string, delegate })
    if (resolver) return resolver()
    const results =
      delegate === WALLET ? [{ safe: proposerSafe.address, delegate, delegator: STRANGER, label: 'proposer' }] : []
    return HttpResponse.json({ count: results.length, next: null, previous: null, results })
  })

const ownedSafesHandler = (resolver?: (owner: string) => Promise<Response> | Response) =>
  http.get(`${GATEWAY_URL}/v2/owners/:ownerAddress/safes`, ({ params }) => {
    const owner = params.ownerAddress as string
    if (resolver) return resolver(owner)
    return HttpResponse.json(owner === WALLET ? { [CHAIN_ID]: [NESTED_OWNER_SAFE] } : { [CHAIN_ID]: [] })
  })

// One store for the whole render: the test-utils wrapper builds a new store on every rerender
const renderCheck = (enabled = true) => {
  const store = makeStore()
  setStoreInstance(store)
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return renderHook(() => useSafeSignerCheck(safes, enabled), { wrapper })
}

describe('useSafeSignerCheck', () => {
  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
    delegatesRequests.length = 0
    mockUseWallet.mockReturnValue({ address: WALLET })
    server.use(overviewsHandler(), delegatesHandler(), ownedSafesHandler())
  })

  it('resolves owners, proposers and nested-Safe owners as signers and others as not signers', async () => {
    const { result } = renderCheck()

    await waitFor(() => expect(result.current(strangerSafe)).toBe('not-signer'))
    expect(result.current(ownedSafe)).toBe('signer')
    expect(result.current(proposerSafe)).toBe('signer')
    expect(result.current(nestedSafe)).toBe('signer')
  })

  it('enables an owned Safe right away while the other checks are pending', () => {
    const { result } = renderCheck()

    expect(result.current(ownedSafe)).toBe('signer')
    expect(result.current(proposerSafe)).toBe('pending')
    expect(result.current(strangerSafe)).toBe('pending')
  })

  it('keeps a nested-owner Safe pending while only the owned-Safes query is loading', async () => {
    server.use(ownedSafesHandler(async () => (await delay('infinite')) as never))

    const { result } = renderCheck()

    await waitFor(() => expect(delegatesRequests).toHaveLength(1))
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(result.current(proposerSafe)).toBe('pending')
    expect(result.current(nestedSafe)).toBe('pending')
    expect(result.current(strangerSafe)).toBe('pending')
  })

  it('treats a failed proposer query as no proposer role without blocking the list', async () => {
    server.use(delegatesHandler(() => new HttpResponse(null, { status: 500 })))

    const { result } = renderCheck()

    await waitFor(() => expect(result.current(proposerSafe)).toBe('not-signer'))
    expect(result.current(nestedSafe)).toBe('signer')
  })

  it('treats a failed owned-Safes query as no nested-owner role', async () => {
    server.use(ownedSafesHandler(() => new HttpResponse(null, { status: 500 })))

    const { result } = renderCheck()

    await waitFor(() => expect(result.current(nestedSafe)).toBe('not-signer'))
    expect(result.current(proposerSafe)).toBe('signer')
  })

  it('makes one delegates request for the chain, keyed by the wallet', async () => {
    const { result } = renderCheck()

    await waitFor(() => expect(result.current(strangerSafe)).toBe('not-signer'))
    expect(delegatesRequests).toEqual([{ chainId: CHAIN_ID, delegate: WALLET }])
  })

  it('skips the requests when disabled', async () => {
    const requests: string[] = []
    const onRequest = ({ request }: { request: Request }) => requests.push(request.url)
    server.events.on('request:start', onRequest)

    renderCheck(false)
    await new Promise((resolve) => setTimeout(resolve, 500))
    server.events.removeListener('request:start', onRequest)

    expect(requests.filter((url) => /\/v2\/(safes|chains|owners)/.test(url))).toEqual([])
  })

  it('goes back to pending on a wallet switch until the owned Safes of the new wallet load', async () => {
    let releaseWalletB: () => void = () => {}
    const walletBLoaded = new Promise<void>((resolve) => {
      releaseWalletB = resolve
    })
    server.use(
      ownedSafesHandler(async (owner) => {
        if (owner === WALLET_B) await walletBLoaded
        return HttpResponse.json(owner === WALLET ? { [CHAIN_ID]: [NESTED_OWNER_SAFE] } : { [CHAIN_ID]: [] })
      }),
    )
    const { result, rerender } = renderCheck()
    await waitFor(() => expect(result.current(nestedSafe)).toBe('signer'))

    mockUseWallet.mockReturnValue({ address: WALLET_B })
    rerender()

    expect(result.current(nestedSafe)).toBe('pending')

    releaseWalletB()

    await waitFor(() => expect(result.current(nestedSafe)).toBe('not-signer'))
  })
})
