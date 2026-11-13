import { faker } from '@faker-js/faker'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { fakeUserId, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { userHandler, userLoaded } from '@/tests/msw/workspaceWizard'
import { render, screen } from '@/tests/test-utils'
import WizardReady from '../WizardReady'

let mockSafeProFlag: boolean | undefined
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockSafeProFlag === true,
  useSafeProFlag: () => mockSafeProFlag,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => false }))

const renderReady = () => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId))
  const step = faker.lorem.words()
  render(
    <WizardReady>
      <p>{step}</p>
    </WizardReady>,
    {
      initialReduxState: {
        auth: signedInAuthState(),
        workspaceDraft: workspaceDraftBuilder().with({ ownerId }).build(),
      },
    },
  )
  return step
}

describe('WizardReady', () => {
  it('shows the step once the user and the steps are known', async () => {
    mockSafeProFlag = true

    const step = renderReady()

    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(await screen.findByText(step)).toBeInTheDocument()
  })

  it('keeps loading while a flag that turns a step on is not known', async () => {
    mockSafeProFlag = undefined

    const step = renderReady()

    await userLoaded()
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText(step)).not.toBeInTheDocument()
  })
})
