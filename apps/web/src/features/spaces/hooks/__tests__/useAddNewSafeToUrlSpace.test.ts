import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { useAppSelector } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { server } from '@/tests/server'
import { act, renderHook } from '@/tests/test-utils'
import { useAddNewSafeToUrlSpace } from '../useAddNewSafeToUrlSpace'

const mockIsAdmin = jest.fn()

jest.mock('../useSpaceMembers', () => ({
  useIsAdmin: () => mockIsAdmin(),
}))

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

type RenderOptions = {
  query?: Record<string, string>
  auth?: Omit<typeof signedInAuth, 'sessionExpiresAt'> & { sessionExpiresAt: number | null }
}

const renderAddHook = ({ query = { spaceId }, auth = signedInAuth }: RenderOptions = {}) =>
  renderHook(
    () => ({
      addToSpace: useAddNewSafeToUrlSpace(),
      notifications: useAppSelector(selectNotifications),
    }),
    {
      routerProps: { query },
      initialReduxState: { auth },
    },
  )

const addSafe = async (result: ReturnType<typeof renderAddHook>['result']) => {
  let outcome: string | null | undefined
  await act(async () => {
    outcome = await result.current.addToSpace(chainId, safeAddress)
  })
  return outcome
}

const respondToAdd = (status: number, body: Record<string, unknown> = {}) => {
  const requests: unknown[] = []
  server.use(
    http.post(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, async ({ request }) => {
      requests.push(await request.json())
      return HttpResponse.json(body, { status })
    }),
  )
  return requests
}

describe('useAddNewSafeToUrlSpace', () => {
  beforeEach(() => {
    mockIsAdmin.mockReturnValue(true)
  })

  it('should add the Safe to the Workspace of the URL and return its id', async () => {
    const requests = respondToAdd(201)
    const { result } = renderAddHook()

    expect(await addSafe(result)).toBe(spaceId)
    expect(requests).toEqual([{ safes: [{ chainId, address: safeAddress }] }])
    expect(result.current.notifications).toEqual([])
  })

  it('should return null without a request when the URL has no Workspace', async () => {
    const requests = respondToAdd(201)
    const { result } = renderAddHook({ query: {} })

    expect(await addSafe(result)).toBeNull()
    expect(requests).toEqual([])
  })

  it('should return null without a request when the user is signed out', async () => {
    const requests = respondToAdd(201)
    const { result } = renderAddHook({ auth: { ...signedInAuth, sessionExpiresAt: null } })

    expect(await addSafe(result)).toBeNull()
    expect(requests).toEqual([])
  })

  it('should tell a user who is not an admin to ask an admin, without a request', async () => {
    mockIsAdmin.mockReturnValue(false)
    const requests = respondToAdd(201)
    const { result } = renderAddHook()

    expect(await addSafe(result)).toBeNull()
    expect(requests).toEqual([])
    expect(result.current.notifications).toEqual([
      expect.objectContaining({
        message: 'Safe created in My accounts. Ask an admin to add it to the Workspace.',
        variant: 'info',
      }),
    ])
  })

  it('should show the seat limit when the plan has no free seat', async () => {
    respondToAdd(402, { code: 'QUOTA_EXCEEDED', feature: 'safe_seats', quota: 5, used: 5 })
    const { result } = renderAddHook()

    expect(await addSafe(result)).toBeNull()
    expect(result.current.notifications).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('Your plan covers 5 Safe accounts'),
        variant: 'info',
      }),
    ])
  })

  it('should keep the Safe outside the Workspace when the user cancels the verification', async () => {
    respondToAdd(403, { message: 'elevation_required' })
    const { result } = renderAddHook()

    expect(await addSafe(result)).toBeNull()
    expect(result.current.notifications).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('Verify your identity to continue with this action.'),
        variant: 'error',
      }),
    ])
  })

  it('should show an error when the backend refuses the add', async () => {
    respondToAdd(500, { message: 'Internal error' })
    const { result } = renderAddHook()

    expect(await addSafe(result)).toBeNull()
    expect(result.current.notifications).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('Safe created in My accounts, but not added to the Workspace.'),
        variant: 'error',
      }),
    ])
  })
})
