import { AppRoutes } from '@/config/routes'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { trialPaymentLinkBuilder } from '@/tests/builders/trialPaymentLink'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { trialPlansHandler, userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import NameStep from '../steps/NameStep'
import WizardReady from '../WizardReady'

jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => true,
  useSafeProFlag: () => true,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => false }))

const renderNameStep = async (changes: Partial<WorkspaceDraft> = {}) => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId), workspacesHandler(), trialPlansHandler([trialPaymentLinkBuilder().build()]))
  const draft = workspaceDraftBuilder()
    .with({ ownerId, ...changes })
    .build()
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderWithUserEvent(
    <WizardReady>
      <NameStep />
    </WizardReady>,
    {
      routerProps: { push },
      initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
    },
  )
  const input = await screen.findByRole('textbox', { name: 'Workspace name' })
  return { ...view, input, push }
}

describe('NameStep', () => {
  beforeEach(() => localStorage.clear())

  it('fills in the name saved in the draft', async () => {
    const name = fakeWorkspaceName()

    const { input } = await renderNameStep({ name })

    expect(input).toHaveValue(name)
  })

  it('saves the sanitized name and goes to the plan step on Next', async () => {
    const name = fakeWorkspaceName()
    const { user, input, push } = await renderNameStep()

    await user.type(input, `  ${name}  `)
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.plan, query: {} }))
    expect(getStoreInstance().getState().workspaceDraft.name).toBe(name)
  })
})
