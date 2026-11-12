import { http, HttpResponse } from 'msw'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { chainBuilder } from '@/tests/builders/chains'
import { render, screen } from '@/tests/test-utils'
import WorkspaceOnboardingStep from '../WorkspaceOnboardingStep'

jest.mock('../index', () => ({
  __esModule: true,
  default: ({ step }: { step: string }) => <p>New onboarding: {step}</p>,
}))
jest.mock('../../SurveyOnboarding', () => ({ __esModule: true, default: () => <p>Old onboarding: survey</p> }))

const defaultChainHandler = (features: FEATURES[]) =>
  http.get(`${GATEWAY_URL}/v2/chains`, () =>
    HttpResponse.json({
      results: [
        chainBuilder()
          .with({ chainId: String(DEFAULT_CHAIN_ID), features })
          .build(),
      ],
      next: null,
    }),
  )

describe('WorkspaceOnboardingStep', () => {
  it('shows the step of the new onboarding when WORKSPACE_ONBOARDING_V2 is on', async () => {
    server.use(defaultChainHandler([FEATURES.WORKSPACE_ONBOARDING_V2]))

    render(<WorkspaceOnboardingStep step="survey" />)

    expect(await screen.findByText('New onboarding: survey')).toBeInTheDocument()
  })

  it('shows the old step when WORKSPACE_ONBOARDING_V2 is off', async () => {
    server.use(defaultChainHandler([]))

    render(<WorkspaceOnboardingStep step="survey" />)

    expect(await screen.findByText('Old onboarding: survey')).toBeInTheDocument()
  })

  it('shows nothing while the chain config loads', () => {
    server.use(http.get(`${GATEWAY_URL}/v2/chains`, () => new Promise<never>(() => {})))

    const { container } = render(<WorkspaceOnboardingStep step="survey" />)

    expect(container).toBeEmptyDOMElement()
  })
})
