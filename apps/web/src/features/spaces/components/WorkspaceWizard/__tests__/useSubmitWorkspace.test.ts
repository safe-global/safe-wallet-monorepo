import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import type { CreateSpaceSetupDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { EMPTY_WORKSPACE_DRAFT, type WorkspaceDraft } from '@/features/spaces/store'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { createSetupHandler, userHandler } from '@/tests/msw/workspaceWizard'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { getStoreInstance } from '@/store'
import { navigateTo } from '@/utils/navigation'
import { useSubmitWorkspace } from '../hooks/useSubmitWorkspace'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'

jest.mock('@/utils/navigation')

const RETURN_PATH = AppRoutes.welcome.survey

const updateSetupHandler = (bodies: { id: string; body: CreateSpaceSetupDto }[], checkoutUrl: string) =>
  http.put<{ id: string }, CreateSpaceSetupDto>(`${GATEWAY_URL}/v1/spaces/:id/setup`, async ({ params, request }) => {
    bodies.push({ id: params.id, body: await request.json() })
    return HttpResponse.json({ spaceId: params.id, checkoutUrl })
  })

const createSetupFailure = (status: number, data: object) =>
  http.post(`${GATEWAY_URL}/v1/spaces/setup`, () => HttpResponse.json(data, { status }))

const draftWith = (changes: Partial<WorkspaceDraft> = {}): WorkspaceDraft =>
  workspaceDraftBuilder()
    .with({ name: fakeWorkspaceName(), paymentLinkId: `plink_${faker.string.alphanumeric(10)}`, ...changes })
    .build()

const renderSubmit = async (draft: WorkspaceDraft) => {
  server.use(userHandler(draft.ownerId ?? fakeUserId()))
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderHook(() => ({ submit: useSubmitWorkspace(RETURN_PATH), workspace: useWorkspaceDraft() }), {
    routerProps: { push },
    initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
  })
  await waitFor(() => expect(view.result.current.workspace.isReady).toBe(true))
  return { ...view, push }
}

describe('useSubmitWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.mocked(navigateTo).mockClear()
  })

  it('creates the Workspace with the last step’s answers and leaves for the checkout', async () => {
    const bodies: CreateSpaceSetupDto[] = []
    const checkoutUrl = faker.internet.url()
    server.use(createSetupHandler(bodies, { spaceId: faker.string.uuid(), checkoutUrl }))
    const draft = draftWith()
    const { result } = await renderSubmit(draft)

    await act(() => result.current.submit.submit({ surveySelections: { use_cases: ['run_payments'] } }))

    expect(navigateTo).toHaveBeenCalledWith(checkoutUrl)
    expect(bodies).toEqual([
      expect.objectContaining({
        name: draft.name,
        paymentLinkId: draft.paymentLinkId,
        survey: { slug: 'onboarding', selections: { use_cases: ['run_payments'] } },
        returnUrl: expect.stringMatching(/\/welcome\/survey\?sessionId=\{CHECKOUT_SESSION_ID\}$/),
      }),
    ])
  })

  it('replaces the pending setup of the Workspace it already created, instead of creating another', async () => {
    const spaceId = faker.string.uuid()
    const created: CreateSpaceSetupDto[] = []
    const replaced: { id: string; body: CreateSpaceSetupDto }[] = []
    server.use(
      createSetupHandler(created, { spaceId: faker.string.uuid(), checkoutUrl: null }),
      updateSetupHandler(replaced, faker.internet.url()),
    )
    const draft = draftWith({ createdSpaceId: spaceId })
    const { result } = await renderSubmit(draft)

    await act(() => result.current.submit.submit())

    expect(created).toEqual([])
    expect(replaced).toEqual([
      {
        id: spaceId,
        body: expect.objectContaining({
          paymentLinkId: draft.paymentLinkId,
          returnUrl: expect.stringContaining(`spaceId=${spaceId}`),
        }),
      },
    ])
  })

  it('shows the gateway’s message and stops submitting when the checkout cannot start', async () => {
    server.use(createSetupFailure(502, { message: 'The checkout could not start.', spaceId: faker.string.uuid() }))
    const { result } = await renderSubmit(draftWith())

    await act(() => result.current.submit.submit())

    expect(result.current.submit.error).toBe('The checkout could not start.')
    expect(result.current.submit.isSubmitting).toBe(false)
  })

  it('retries a failed checkout on the Workspace the gateway already created', async () => {
    const spaceId = faker.string.uuid()
    const replaced: { id: string; body: CreateSpaceSetupDto }[] = []
    server.use(
      createSetupFailure(502, { message: 'The checkout could not start.', spaceId }),
      updateSetupHandler(replaced, faker.internet.url()),
    )
    const { result } = await renderSubmit(draftWith())
    await act(() => result.current.submit.submit())

    await act(() => result.current.submit.submit())

    expect(replaced.map(({ id }) => id)).toEqual([spaceId])
  })

  it('opens the Workspace at once when no checkout is needed', async () => {
    const spaceId = faker.string.uuid()
    server.use(createSetupHandler([], { spaceId, checkoutUrl: null }))
    const { result, push } = await renderSubmit(draftWith({ paymentLinkId: null }))

    await act(() => result.current.submit.submit())

    expect(navigateTo).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  })

  it('empties the draft once the Workspace opens without a checkout', async () => {
    server.use(createSetupHandler([], { spaceId: faker.string.uuid(), checkoutUrl: null }))
    const { result } = await renderSubmit(draftWith({ paymentLinkId: null }))

    await act(() => result.current.submit.submit())

    expect(getStoreInstance().getState().workspaceDraft).toEqual(EMPTY_WORKSPACE_DRAFT)
  })

  it('shows no error and stops submitting when a step-up verification is required but not completed', async () => {
    server.use(createSetupFailure(403, { message: ELEVATION_REQUIRED_ERROR }))
    const { result } = await renderSubmit(draftWith())

    await act(() => result.current.submit.submit())

    expect(result.current.submit.error).toBeUndefined()
    expect(result.current.submit.isSubmitting).toBe(false)
  })
})
