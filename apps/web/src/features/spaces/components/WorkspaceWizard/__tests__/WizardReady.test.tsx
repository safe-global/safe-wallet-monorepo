import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { fakeUserId, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { userHandler } from '@/tests/msw/workspaceWizard'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'
import WizardReady from '../WizardReady'

let mockSafeProFlag: boolean | undefined
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockSafeProFlag === true,
  useSafeProFlag: () => mockSafeProFlag,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => false }))

const UserProbe = () => (useWorkspaceDraft().isReady ? <p>The user is known</p> : null)

const renderReady = () => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId))
  const step = faker.lorem.words()
  render(
    <>
      <UserProbe />
      <WizardReady>
        <p>{step}</p>
      </WizardReady>
    </>,
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

    expect(await screen.findByText('The user is known')).toBeInTheDocument()
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText(step)).not.toBeInTheDocument()
  })

  it('offers a retry instead of loading forever when the user cannot be loaded', async () => {
    mockSafeProFlag = true
    const ownerId = fakeUserId()
    server.use(http.get(`${GATEWAY_URL}/v1/users`, () => new HttpResponse(null, { status: 500 })))
    const step = faker.lorem.words()
    const { user } = renderWithUserEvent(
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
    expect(await screen.findByText("We couldn't load your account")).toBeInTheDocument()

    server.use(userHandler(ownerId))
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText(step)).toBeInTheDocument()
  })
})
