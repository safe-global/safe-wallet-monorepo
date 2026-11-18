import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { PendingSafeStatus, type UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { toWorkspaceSigners, useWorkspaceSigners } from '../useWorkspaceSigners'

const spaceId = faker.string.uuid()

const randomAddress = () => checksumAddress(faker.finance.ethereumAddress())

const buildOverview = (chainId: string, safe: string, owners: string[]): SafeOverview => ({
  address: { value: safe },
  chainId,
  threshold: 1,
  owners: owners.map((value) => ({ value })),
  fiatTotal: '0',
  queued: 0,
})

const buildUndeployedSafe = (owners: string[]): UndeployedSafe => ({
  props: {
    safeAccountConfig: { owners, threshold: 1 },
    safeDeploymentConfig: { saltNonce: faker.string.numeric(5), safeVersion: '1.4.1' },
  },
  status: { status: PendingSafeStatus.AWAITING_EXECUTION, type: PayMethod.PayLater },
})

describe('toWorkspaceSigners', () => {
  it('lists each owner once with every chain it signs on', () => {
    const safeA = randomAddress()
    const safeB = randomAddress()
    const owner = randomAddress()

    const result = toWorkspaceSigners(
      [
        { chainId: '1', safeAddress: safeA, owners: [owner] },
        { chainId: '10', safeAddress: safeB, owners: [owner] },
        { chainId: '1', safeAddress: safeB, owners: [owner] },
      ],
      [],
    )

    expect(result).toHaveLength(1)
    expect(result[0].address).toBe(owner)
    expect(result[0].chainIds).toEqual(['1', '10'])
    expect(result[0].safes.map((safe) => safe.address)).toEqual([safeA, safeB])
  })

  it('keeps the lowest position when owner order differs between chains', () => {
    const safe = randomAddress()
    const owner = randomAddress()
    const other = randomAddress()

    const [signer] = toWorkspaceSigners(
      [
        { chainId: '1', safeAddress: safe, owners: [other, owner] },
        { chainId: '10', safeAddress: safe, owners: [owner, other] },
      ],
      [],
    )

    expect(signer.safes).toEqual([{ address: safe, name: undefined, position: 1 }])
  })

  it('names a Safe from the workspace book, case-insensitively', () => {
    const safe = randomAddress()
    const name = faker.company.name()

    const [signer] = toWorkspaceSigners(
      [{ chainId: '1', safeAddress: safe, owners: [randomAddress()] }],
      [{ address: safe.toLowerCase(), name }],
    )

    expect(signer.safes[0].name).toBe(name)
  })

  it('leaves name undefined for a Safe the book has no name for', () => {
    const safe = randomAddress()

    const [signer] = toWorkspaceSigners(
      [{ chainId: '1', safeAddress: safe, owners: [randomAddress()] }],
      [{ address: randomAddress(), name: faker.company.name() }],
    )

    expect(signer.safes[0].name).toBeUndefined()
  })

  it('treats the same Safe address in different casing as one Safe', () => {
    const safe = randomAddress()
    const owner = randomAddress()

    const [signer] = toWorkspaceSigners(
      [
        { chainId: '1', safeAddress: safe, owners: [owner] },
        { chainId: '10', safeAddress: safe.toLowerCase(), owners: [owner.toLowerCase()] },
      ],
      [],
    )

    expect(signer.safes).toHaveLength(1)
    expect(signer.chainIds).toEqual(['1', '10'])
  })
})

describe('useWorkspaceSigners', () => {
  const signedInAuth = {
    sessionExpiresAt: Date.now() + 60_000,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  }

  const requests = { safes: 0, overviews: 0, book: 0 }

  const respondWithSafes = (safes: Record<string, string[]>) =>
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => {
        requests.safes += 1
        return HttpResponse.json({ safes })
      }),
    )

  const respondWithOverviews = (overviews: SafeOverview[]) =>
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, () => {
        requests.overviews += 1
        return HttpResponse.json(overviews)
      }),
    )

  const respondWithBook = () =>
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/address-book`, () => {
        requests.book += 1
        return HttpResponse.json({ spaceUuid: spaceId, data: [], tags: [] })
      }),
    )

  const failRequest = (path: string) =>
    server.use(http.get(`${GATEWAY_URL}${path}`, () => new HttpResponse(null, { status: 500 })))

  const renderSigners = ({
    undeployedSafes = {},
    isSignedIn = true,
  }: { undeployedSafes?: Record<string, Record<string, UndeployedSafe>>; isSignedIn?: boolean } = {}) =>
    renderHook(() => useWorkspaceSigners(), {
      routerProps: { query: { spaceId } },
      initialReduxState: {
        auth: { ...signedInAuth, sessionExpiresAt: isSignedIn ? signedInAuth.sessionExpiresAt : null },
        undeployedSafes,
      },
    })

  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 500)))

  beforeEach(() => {
    requests.safes = 0
    requests.overviews = 0
    requests.book = 0
    respondWithSafes({})
    respondWithOverviews([])
    respondWithBook()
  })

  it('skips a Safe whose overview is missing and keeps the others', async () => {
    const safeA = randomAddress()
    const safeB = randomAddress()
    const owner = randomAddress()
    respondWithSafes({ '1': [safeA, safeB] })
    respondWithOverviews([buildOverview('1', safeA, [owner])])

    const { result } = renderSigners()

    await waitFor(() => expect(result.current.signers).toHaveLength(1))
    expect(result.current.signers[0].safes.map((safe) => safe.address)).toEqual([safeA])
    expect(result.current.isError).toBe(false)
  })

  it('uses the overview of the matching chain when the same Safe address is on two chains', async () => {
    const safe = randomAddress()
    const mainnetOwner = randomAddress()
    const optimismOwner = randomAddress()
    respondWithSafes({ '1': [safe], '10': [safe] })
    respondWithOverviews([buildOverview('10', safe, [optimismOwner]), buildOverview('1', safe, [mainnetOwner])])

    const { result } = renderSigners()

    await waitFor(() =>
      expect(result.current.signers.map(({ address, chainIds }) => ({ address, chainIds }))).toEqual([
        { address: mainnetOwner, chainIds: ['1'] },
        { address: optimismOwner, chainIds: ['10'] },
      ]),
    )
  })

  it('reports an error when no deployed Safe has an overview', async () => {
    respondWithSafes({ '1': [randomAddress(), randomAddress()] })
    respondWithOverviews([])

    const { result } = renderSigners()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('reports an error instead of loading when the overviews request fails', async () => {
    respondWithSafes({ '1': [randomAddress()] })
    failRequest('/v2/safes')

    const { result } = renderSigners()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isLoading).toBe(false)
  })

  it('reports an error when the address book request fails', async () => {
    failRequest(`/v1/spaces/${spaceId}/address-book`)

    const { result } = renderSigners()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('reports an error when the space Safes request fails', async () => {
    failRequest(`/v1/spaces/${spaceId}/safes`)

    const { result } = renderSigners()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does not report an error for a workspace with only undeployed Safes', async () => {
    const safe = randomAddress()
    respondWithSafes({ '1': [safe] })

    const { result } = renderSigners({ undeployedSafes: { '1': { [safe]: buildUndeployedSafe([randomAddress()]) } } })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isError).toBe(false)
  })

  it('reads owners of an undeployed workspace Safe from the local counterfactual config', async () => {
    const safe = randomAddress()
    const owner = randomAddress()
    respondWithSafes({ '1': [safe] })

    const { result } = renderSigners({ undeployedSafes: { '1': { [safe]: buildUndeployedSafe([owner]) } } })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.signers).toEqual([
      { address: owner, chainIds: ['1'], safes: [{ address: safe, name: undefined, position: 1 }] },
    ])
  })

  it('reports loading until the space Safes, overviews and book have loaded', async () => {
    const safe = randomAddress()
    respondWithSafes({ '1': [safe] })
    respondWithOverviews([buildOverview('1', safe, [randomAddress()])])

    const { result } = renderSigners()

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.signers).toHaveLength(1)
  })

  it('reports loading instead of the previous signers while the overviews of a new set of Safes load', async () => {
    const firstSafe = randomAddress()
    respondWithSafes({ '1': [firstSafe] })
    respondWithOverviews([buildOverview('1', firstSafe, [randomAddress()])])
    const { result } = renderSigners()
    await waitFor(() => expect(result.current.signers).toHaveLength(1))
    respondWithSafes({ '1': [firstSafe, randomAddress()] })
    const inFlight = { overviews: 0 }
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, async () => {
        inFlight.overviews += 1
        await delay('infinite')
        return HttpResponse.json([])
      }),
    )

    act(() => result.current.refetch())

    await waitFor(() => expect(inFlight.overviews).toBe(1))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.signers).toEqual([])
  })

  it('does not request overviews when the workspace has no Safes', async () => {
    const { result } = renderSigners()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await settle()
    expect(requests.overviews).toBe(0)
  })

  it('refetches the space Safes, the overviews and the book', async () => {
    const safe = randomAddress()
    respondWithSafes({ '1': [safe] })
    respondWithOverviews([buildOverview('1', safe, [randomAddress()])])
    const { result } = renderSigners()
    await waitFor(() => expect(result.current.signers).toHaveLength(1))

    act(() => result.current.refetch())

    await waitFor(() => expect(requests).toEqual({ safes: 2, overviews: 2, book: 2 }))
  })

  it('sends no request when refetching while signed out', async () => {
    const { result } = renderSigners({ isSignedIn: false })

    act(() => result.current.refetch())

    await settle()
    expect(requests).toEqual({ safes: 0, overviews: 0, book: 0 })
  })
})
