import { faker } from '@faker-js/faker'
import { AppRoutes } from '@/config/routes'
import { EMPTY_WORKSPACE_DRAFT, type WorkspaceDraft } from '../../../public/store/workspaceDraftSlice'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { spaceBuilder } from '@/tests/builders/space'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { renderWithUserEvent, screen, waitFor, waitForElementToBeRemoved } from '@/tests/test-utils'
import { MemberRole } from '../../../memberRole'
import NameStepNotices from '../NameStepNotices'
import WizardReady from '../WizardReady'

jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => false,
  useSafeProFlag: () => false,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => false }))

type ResumeOffer = 'unknown' | 'offer' | 'done'

const renderNotices = (draft: WorkspaceDraft, resumeOffer: ResumeOffer, onStartOver = jest.fn()) => {
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderWithUserEvent(
    <WizardReady>
      <NameStepNotices onStartOver={onStartOver} />
    </WizardReady>,
    {
      routerProps: { push },
      initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft, workspaceWizard: { resumeOffer } },
    },
  )
  return { ...view, push }
}

const ownDraft = (changes: Partial<WorkspaceDraft>, spaces = [spaceBuilder().build()]): WorkspaceDraft => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId), workspacesHandler(spaces))
  return workspaceDraftBuilder()
    .with({ ownerId, ...changes })
    .build()
}

const invite = () => ({ identifier: faker.internet.email(), role: MemberRole.MEMBER })

describe('NameStepNotices', () => {
  beforeEach(() => localStorage.clear())

  it('offers to continue a draft that was never sent, summing up what it holds', async () => {
    const name = fakeWorkspaceName()

    renderNotices(ownDraft({ name, invites: [invite()] }), 'offer')

    expect(await screen.findByText('Continue where you left off?')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`^${name} · 0 Safes · 1 invite · started `))).toBeInTheDocument()
  })

  it.each([
    ['the wizard did not open on its first step', 'done', { name: fakeWorkspaceName() }],
    ['the draft is empty', 'offer', {}],
  ] as const)('offers nothing when %s', async (_, resumeOffer, changes) => {
    renderNotices(ownDraft(changes), resumeOffer)

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'))

    expect(screen.queryByText('Continue where you left off?')).not.toBeInTheDocument()
  })

  it('empties the form and the draft on Start over', async () => {
    const onStartOver = jest.fn()
    const { user } = renderNotices(ownDraft({ name: fakeWorkspaceName() }), 'offer', onStartOver)

    await user.click(await screen.findByRole('button', { name: 'Start over' }))

    expect(onStartOver).toHaveBeenCalled()
    expect(getStoreInstance().getState().workspaceDraft).toEqual(EMPTY_WORKSPACE_DRAFT)
    expect(screen.queryByText('Continue where you left off?')).not.toBeInTheDocument()
  })

  it('continues on the first step that still misses data', async () => {
    const { user, push } = renderNotices(ownDraft({ name: '', invites: [invite()] }), 'offer')

    await user.click(await screen.findByRole('button', { name: 'Continue' }))

    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.createSpace, query: {} })
  })

  it('finishes the setup of the Workspace a draft already created, on the last step', async () => {
    const created = spaceBuilder().with({ setupStatus: 'pending' }).build()
    const spaceId = created.uuid
    const name = fakeWorkspaceName()
    const { user, push } = renderNotices(ownDraft({ name, createdSpaceId: spaceId }, [created]), 'offer')
    await screen.findByText(`You have not finished setting up ${name}`)

    await user.click(screen.getByRole('button', { name: 'Finish setup' }))

    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  })

  it('starts a new Workspace from an empty draft instead of editing the one already created', async () => {
    const onStartOver = jest.fn()
    const created = spaceBuilder().with({ setupStatus: 'pending' }).build()
    const draft = ownDraft({ name: fakeWorkspaceName(), createdSpaceId: created.uuid }, [created])
    const { user } = renderNotices(draft, 'offer', onStartOver)

    await user.click(await screen.findByRole('button', { name: 'Create a new Workspace' }))

    expect(onStartOver).toHaveBeenCalled()
    expect(getStoreInstance().getState().workspaceDraft).toEqual(EMPTY_WORKSPACE_DRAFT)
  })

  it('forgets a draft whose Workspace setup the gateway already applied', async () => {
    const applied = spaceBuilder().with({ setupStatus: 'applied' }).build()
    renderNotices(ownDraft({ name: applied.name, createdSpaceId: applied.uuid }, [applied]), 'offer')

    await waitFor(() => expect(getStoreInstance().getState().workspaceDraft).toEqual(EMPTY_WORKSPACE_DRAFT))
    expect(screen.queryByText(`You have not finished setting up ${applied.name}`)).not.toBeInTheDocument()
  })

  it('points to another Workspace whose trial never started, next to the empty form', async () => {
    const pending = spaceBuilder().with({ setupStatus: 'pending' }).build()

    renderNotices(ownDraft({}, [pending]), 'offer')

    expect(await screen.findByText(`You have not finished setting up ${pending.name}`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create a new Workspace' })).toBeInTheDocument()
  })

  it('shows no notice once the user creates a new Workspace instead', async () => {
    const pending = spaceBuilder().with({ setupStatus: 'pending' }).build()
    const draft = ownDraft({ name: pending.name, createdSpaceId: pending.uuid }, [pending])
    const { user } = renderNotices(draft, 'offer')

    await user.click(await screen.findByRole('button', { name: 'Create a new Workspace' }))

    expect(screen.queryByTestId('unfinished-setup-notice')).not.toBeInTheDocument()
  })
})
