import { faker } from '@faker-js/faker'
import { AppRoutes } from '@/config/routes'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { trialPaymentLinkBuilder } from '@/tests/builders/trialPaymentLink'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { trialPlansHandler, userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { MemberRole } from '../../../memberRole'
import { INVALID_IDENTIFIER_ERROR } from '../../AddMemberModal/utils'
import InviteStep from '../steps/InviteStep'
import WizardReady from '../WizardReady'

let mockIsSafePro = false
let mockIsSurveyEnabled = false
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockIsSafePro,
  useSafeProFlag: () => mockIsSafePro,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => mockIsSurveyEnabled }))

const renderInviteStep = (changes: Partial<WorkspaceDraft> = {}, ownWallets: string[] = []) => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId, ownWallets), workspacesHandler())
  const draft = workspaceDraftBuilder()
    .with({ ownerId, name: fakeWorkspaceName(), ...changes })
    .build()
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderWithUserEvent(
    <WizardReady>
      <InviteStep />
    </WizardReady>,
    {
      routerProps: { push },
      initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
    },
  )
  return { ...view, push }
}

const identifierInput = () => screen.getByTestId('invite-identifier-input-0')
const continueButton = () => screen.getByTestId('invite-members-continue-button')

describe('InviteStep', () => {
  beforeEach(() => {
    localStorage.clear()
    mockIsSafePro = false
    mockIsSurveyEnabled = true
  })

  it('saves no invites and goes on when the user skips the step', async () => {
    const invites = [{ identifier: faker.internet.email(), role: MemberRole.MEMBER }]
    const { user, push } = renderInviteStep({ invites })
    await waitFor(() => expect(identifierInput()).toHaveValue(invites[0].identifier))

    await user.click(screen.getByRole('button', { name: 'Skip, invite later' }))

    expect(getStoreInstance().getState().workspaceDraft.invites).toEqual([])
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.survey, query: {} })
  })

  it('shows why an identifier is invalid and does not go on', async () => {
    const { user, push } = renderInviteStep()
    await screen.findByTestId('invite-identifier-input-0')

    await user.type(identifierInput(), 'not an invitee')
    await user.click(continueButton())

    expect(await screen.findByText(INVALID_IDENTIFIER_ERROR)).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('refuses an invite to the user’s own wallet and does not go on', async () => {
    const own = fakerChecksummedAddress()
    const { user, push } = renderInviteStep({}, [own])
    await screen.findByTestId('invite-identifier-input-0')

    await user.type(identifierInput(), own)
    await waitFor(() => expect(continueButton()).toBeEnabled())
    await user.click(continueButton())

    expect(await screen.findByText('You are already in this Workspace')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('offers to start the free trial when it is the last step', async () => {
    mockIsSafePro = true
    mockIsSurveyEnabled = false
    server.use(trialPlansHandler([trialPaymentLinkBuilder().build()]))

    renderInviteStep()

    expect(await screen.findByRole('button', { name: 'Start free trial' })).toBeInTheDocument()
  })
})
