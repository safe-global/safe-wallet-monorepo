import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import type { CreateSpaceSetupDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SurveyDto } from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { createSetupHandler, userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import SurveyStep from '../steps/SurveyStep'
import WizardReady from '../WizardReady'

jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => false,
  useSafeProFlag: () => false,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => true }))

const surveyWithOneOption = (): SurveyDto => ({
  id: faker.number.int({ min: 1, max: 100 }),
  slug: 'onboarding',
  version: 1,
  title: faker.lorem.sentence(),
  subtitle: null,
  surveyContent: {
    pages: [
      {
        id: faker.string.alphanumeric(8),
        title: faker.lorem.sentence(),
        subtitle: null,
        multiSelect: true,
        options: [{ key: faker.string.alpha(10), label: faker.lorem.words(2) }],
      },
    ],
  },
})

const surveyHandler = (survey: SurveyDto | null) =>
  http.get(`${GATEWAY_URL}/v1/surveys/onboarding`, () =>
    survey ? HttpResponse.json(survey) : new HttpResponse(null, { status: 404 }),
  )

const renderSurveyStep = () => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId), workspacesHandler())
  const draft = workspaceDraftBuilder().with({ ownerId, name: fakeWorkspaceName() }).build()
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderWithUserEvent(
    <WizardReady>
      <SurveyStep />
    </WizardReady>,
    {
      routerProps: { push },
      initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
    },
  )
  return { ...view, push }
}

describe('SurveyStep', () => {
  beforeEach(() => localStorage.clear())

  it('saves the answers under the id of their survey page', async () => {
    const survey = surveyWithOneOption()
    const [page] = survey.surveyContent.pages
    server.use(surveyHandler(survey))
    const { user, push } = renderSurveyStep()

    await user.click(await screen.findByRole('button', { name: page.options[0].label }))
    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(getStoreInstance().getState().workspaceDraft.surveySelections).toEqual({ [page.id]: [page.options[0].key] })
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.inviteMembers, query: {} })
  })

  it('lets the user finish without answers when no survey is active', async () => {
    const bodies: CreateSpaceSetupDto[] = []
    server.use(surveyHandler(null), createSetupHandler(bodies, { spaceId: faker.string.uuid(), checkoutUrl: null }))
    const { user } = renderSurveyStep()
    const finish = await screen.findByRole('button', { name: 'Create Workspace' })
    await waitFor(() => expect(finish).toBeEnabled())

    await user.click(finish)

    await waitFor(() => expect(bodies).toEqual([expect.objectContaining({ survey: null })]))
  })
})
