import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import type { SpaceSetupDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { selectIsResumeOffered, type WorkspaceDraft } from '@/features/spaces/store'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { spaceBuilder } from '@/tests/builders/space'
import { trialPaymentLinkBuilder } from '@/tests/builders/trialPaymentLink'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { trialPlansHandler, userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { MemberRole } from '../../../memberRole'
import type { WizardStepId } from '../steps'
import WorkspaceWizard from '../index'

let mockIsSafePro = false
let mockIsSurveyEnabled = false
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockIsSafePro,
  useSafeProFlag: () => mockIsSafePro,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => mockIsSurveyEnabled }))

const pendingSetup = (changes: Partial<SpaceSetupDto> = {}): SpaceSetupDto => ({
  status: 'pending',
  paymentLinkId: null,
  safes: [],
  addressBookItems: [],
  invites: [],
  survey: null,
  ...changes,
})

const workspaceHandlers = (spaceId: string, name: string, setup: SpaceSetupDto) => [
  http.get(`${GATEWAY_URL}/v1/spaces/:id/setup`, () => HttpResponse.json(setup)),
  http.get(`${GATEWAY_URL}/v1/spaces/:id`, () =>
    HttpResponse.json(spaceBuilder().with({ uuid: spaceId, name }).build()),
  ),
]

const renderWizard = (
  step: WizardStepId,
  query: Record<string, string> = {},
  changes: Partial<WorkspaceDraft> = {},
) => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId), workspacesHandler())
  const draft = workspaceDraftBuilder()
    .with({ ownerId, ...changes })
    .build()
  const push = jest.fn(() => Promise.resolve(true))
  const replace = jest.fn(() => Promise.resolve(true))
  const view = renderWithUserEvent(<WorkspaceWizard step={step} />, {
    routerProps: { push, replace, query },
    initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
  })
  return { ...view, push, replace }
}

const storedDraft = () => getStoreInstance().getState().workspaceDraft

describe('WorkspaceWizard', () => {
  beforeEach(() => {
    localStorage.clear()
    mockIsSafePro = false
    mockIsSurveyEnabled = false
  })

  it('loads the pending setup of the Workspace in the link into the draft', async () => {
    const spaceId = faker.string.uuid()
    const name = fakeWorkspaceName()
    const email = faker.internet.email().toLowerCase()
    const invites: SpaceSetupDto['invites'] = [{ type: 'email', email, role: 'MEMBER', name: faker.person.firstName() }]
    server.use(...workspaceHandlers(spaceId, name, pendingSetup({ invites })))

    renderWizard('invite', { spaceId })

    await waitFor(() => expect(storedDraft().createdSpaceId).toBe(spaceId))
    expect(storedDraft()).toMatchObject({ name, invites: [{ identifier: email, role: MemberRole.MEMBER }] })
  })

  it('opens a Workspace whose setup was already applied', async () => {
    const spaceId = faker.string.uuid()
    server.use(...workspaceHandlers(spaceId, fakeWorkspaceName(), pendingSetup({ status: 'applied' })))

    const { replace } = renderWizard('invite', { spaceId })

    await waitFor(() => expect(replace).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index, query: { spaceId } }))
  })

  it('offers a retry when the Workspace in the link cannot be loaded', async () => {
    server.use(http.get(`${GATEWAY_URL}/v1/spaces/:id/setup`, () => new HttpResponse(null, { status: 500 })))

    renderWizard('invite', { spaceId: faker.string.uuid() })

    expect(await screen.findByText("We couldn't load your Workspace")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('loads the Workspace in the link again on Try again', async () => {
    const spaceId = faker.string.uuid()
    let isDown = true
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/:id/setup`, () =>
        isDown ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(pendingSetup()),
      ),
      http.get(`${GATEWAY_URL}/v1/spaces/:id`, () => HttpResponse.json(spaceBuilder().with({ uuid: spaceId }).build())),
    )
    const { user } = renderWizard('invite', { spaceId })
    const retry = await screen.findByRole('button', { name: 'Try again' })
    isDown = false

    await user.click(retry)

    await waitFor(() => expect(storedDraft().createdSpaceId).toBe(spaceId))
  })

  it('sends a deep link to the survey back to the plan step once the trial plans are known', async () => {
    mockIsSafePro = true
    mockIsSurveyEnabled = true
    server.use(
      trialPlansHandler([trialPaymentLinkBuilder().build()]),
      http.get(`${GATEWAY_URL}/v1/surveys/onboarding`, () => new HttpResponse(null, { status: 404 })),
    )

    const { replace } = renderWizard('survey', {}, { name: fakeWorkspaceName() })

    await waitFor(() => expect(replace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.plan, query: {} }))
  })

  it('offers the saved draft when the wizard opens on its first step', async () => {
    renderWizard('name')

    await waitFor(() => expect(selectIsResumeOffered(getStoreInstance().getState())).toBe(true))
  })

  describe('leaving the wizard', () => {
    const renderOnLaterStep = () => {
      const handlers = new Map<string, (url: string) => void>()
      const events = {
        on: jest.fn((event: string, handler: (url: string) => void) => handlers.set(event, handler)),
        off: jest.fn(),
        emit: jest.fn(),
      }
      server.use(userHandler(fakeUserId()), workspacesHandler())
      renderWithUserEvent(<WorkspaceWizard step="safes" />, {
        routerProps: { events, query: {} },
        initialReduxState: { auth: signedInAuthState() },
      })
      return (url: string) => handlers.get('routeChangeStart')?.(url)
    }

    const resumeOffer = () => getStoreInstance().getState().workspaceWizard.resumeOffer

    it('makes the next visit a new start, so its first step offers the draft again', async () => {
      const navigate = renderOnLaterStep()
      await waitFor(() => expect(resumeOffer()).toBe('done'))

      navigate(`${AppRoutes.spaces.index}?spaceId=${faker.string.uuid()}`)

      expect(resumeOffer()).toBe('unknown')
    })

    it('keeps the answer while the user moves between steps', async () => {
      const navigate = renderOnLaterStep()
      await waitFor(() => expect(resumeOffer()).toBe('done'))

      navigate(`${AppRoutes.welcome.createSpace}?spaceId=${faker.string.uuid()}`)

      expect(resumeOffer()).toBe('done')
    })
  })
})
