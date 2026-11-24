import { faker } from '@faker-js/faker'
import { act } from 'react'
import { delay, http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { POLLING_INTERVAL } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import * as useChains from '@/hooks/useChains'
import { useSpaceMembersByStatus } from '../../public/hooks/useSpaceMembers'
import { useSpaceAddressBookState } from '../../public/hooks/useGetSpaceAddressBook'
import AuthState from './index'

const spaceId = faker.string.uuid()
const userId = 7

jest.mock('../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => spaceId }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))
jest.mock('../Plans/WorkspaceLockModal', () => ({ __esModule: true, default: () => null }))
jest.mock('../Plans/TrialEndingModal', () => ({ __esModule: true, default: () => null }))
jest.mock('../LoadingState', () => ({ __esModule: true, default: () => <div data-testid="loading" /> }))
jest.mock('../UnauthorizedState', () => ({ __esModule: true, default: () => <div data-testid="unauthorized" /> }))

const member = memberBuilder()
  .with({ user: memberUserBuilder().with({ id: userId }).build() })
  .build()

const emptyQueue: SpaceQueuedItemPage = {
  count: 0,
  next: null,
  previous: null,
  results: {},
  unavailableSafes: [],
  counts: {
    total: 0,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
}

/** Stands for a Workspace page: it reads the members and the address book, as the real pages do. */
const WorkspacePage = () => {
  useSpaceMembersByStatus()
  const { refetch } = useSpaceAddressBookState()
  return (
    <button data-testid="page" onClick={refetch}>
      Reload contacts
    </button>
  )
}

const LATENCY = 200
const spaceUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}`

describe('AuthState when the member loses access mid-session', () => {
  let status: 200 | 403 | 429
  let requests: string[]

  const respond = (body: unknown) => async () => {
    await delay(LATENCY)
    return status === 200 ? HttpResponse.json(body as object) : new HttpResponse(null, { status })
  }

  beforeEach(() => {
    status = 200
    requests = []
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    server.events.on('request:start', ({ request }) => {
      requests.push(new URL(request.url).pathname)
    })
    server.use(
      http.get(`${GATEWAY_URL}/v1/auth/me`, async () => {
        await delay(LATENCY)
        return HttpResponse.json({ id: String(userId), authMethod: 'siwe' })
      }),
      http.get(`${GATEWAY_URL}/v1/users`, () => HttpResponse.json({ id: userId, status: 1, wallets: [] })),
      http.get(spaceUrl, respond({ uuid: spaceId, name: 'W', members: [member], memberCount: 1, safeCount: 0 })),
      http.get(`${spaceUrl}/members`, respond({ members: [member] })),
      http.get(`${spaceUrl}/address-book`, respond({ spaceUuid: spaceId, data: [], tags: [] })),
      http.get(`${spaceUrl}/transactions/queued`, respond(emptyQueue)),
    )
  })

  afterEach(() => {
    server.events.removeAllListeners()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  const renderPage = () =>
    render(
      <AuthState spaceId={spaceId}>
        <WorkspacePage />
      </AuthState>,
      {
        initialReduxState: {
          auth: {
            sessionExpiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
            landingSpaceHint: null,
            isStoreHydrated: true,
            cfSafeSynced: false,
            isOidcLoginPending: false,
            isSessionCheckPending: false,
          },
        },
      },
    )

  const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms))

  const loadThenRespondWith = async (nextStatus: 403 | 429) => {
    renderPage()
    expect(await screen.findByTestId('page')).toBeInTheDocument()
    await advance(31_000)
    status = nextStatus
    await advance(POLLING_INTERVAL + 2_000)
  }

  it('shows the no-access state instead of the queue once a poll is refused', async () => {
    await loadThenRespondWith(403)

    expect(screen.getByTestId('unauthorized')).toBeInTheDocument()
    expect(screen.queryByTestId('page')).not.toBeInTheDocument()
  })

  it('sends no more requests after the no-access state shows', async () => {
    await loadThenRespondWith(403)
    const settled = requests.length

    await advance(4 * POLLING_INTERVAL)

    expect(requests.slice(settled)).toEqual([])
  })

  it('keeps an active member on the page when the gateway rate-limits them', async () => {
    await loadThenRespondWith(429)
    const settled = requests.length

    await advance(4 * POLLING_INTERVAL)

    expect(screen.getByTestId('page')).toBeInTheDocument()
    expect(screen.queryByTestId('unauthorized')).not.toBeInTheDocument()
    expect(requests.slice(settled).every((path) => path.endsWith('/transactions/queued'))).toBe(true)
    expect(requests.length - settled).toBeLessThanOrEqual(4)
  })

  it('shows the no-access state and stops when the first refusal comes from a page request with polling off', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
    renderPage()
    expect(await screen.findByTestId('page')).toBeInTheDocument()

    status = 403
    fireEvent.click(screen.getByTestId('page'))
    await advance(2_000)

    expect(screen.getByTestId('unauthorized')).toBeInTheDocument()
    const settled = requests.length
    await advance(4 * POLLING_INTERVAL)
    expect(requests.slice(settled)).toEqual([])
    expect(requests.some((path) => path.endsWith('/transactions/queued'))).toBe(false)
  })
})
