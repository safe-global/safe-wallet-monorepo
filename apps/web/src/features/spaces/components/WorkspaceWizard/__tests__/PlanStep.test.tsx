import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { trialPaymentLinkBuilder } from '@/tests/builders/trialPaymentLink'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { trialPlansHandler, userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import PlanStep from '../steps/PlanStep'

jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => true }))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => false }))

const SMALL = trialPaymentLinkBuilder({ seats: 2 }).build()
const LARGE = trialPaymentLinkBuilder({ seats: 20 }).build()

const renderPlanStep = (changes: Partial<WorkspaceDraft> = {}) => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId), workspacesHandler())
  const draft = workspaceDraftBuilder()
    .with({ ownerId, name: fakeWorkspaceName(), ...changes })
    .build()
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderWithUserEvent(<PlanStep />, {
    routerProps: { push },
    initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
  })
  return { ...view, push }
}

const nextButton = () => screen.getByRole('button', { name: 'Next' })

const savedPlan = () => getStoreInstance().getState().workspaceDraft.paymentLinkId

describe('PlanStep', () => {
  beforeEach(() => localStorage.clear())

  it('shows the smallest size when the draft has no plan', async () => {
    server.use(trialPlansHandler([LARGE, SMALL]))

    renderPlanStep()

    expect(await screen.findByRole('tab', { name: '2 Safes' })).toHaveAttribute('aria-selected', 'true')
  })

  it('saves the shown size and goes to the Safes step on Next', async () => {
    server.use(trialPlansHandler([SMALL, LARGE]))
    const { user, push } = renderPlanStep()
    await waitFor(() => expect(nextButton()).toBeEnabled())

    await user.click(nextButton())

    expect(savedPlan()).toBe(SMALL.id)
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.selectSafes, query: {} })
  })

  it('saves the size the user picked on Next', async () => {
    server.use(trialPlansHandler([SMALL, LARGE]))
    const { user } = renderPlanStep()
    await waitFor(() => expect(nextButton()).toBeEnabled())

    await user.click(screen.getByRole('tab', { name: '20 Safes' }))
    await user.click(nextButton())

    expect(savedPlan()).toBe(LARGE.id)
  })

  it('keeps the plan of the draft when the user goes back without picking one', async () => {
    server.use(trialPlansHandler([SMALL, LARGE]))
    const { user, push } = renderPlanStep({ paymentLinkId: 'plink_withdrawn' })
    await waitFor(() => expect(nextButton()).toBeEnabled())

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(savedPlan()).toBe('plink_withdrawn')
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.createSpace, query: {} })
  })

  it('shows the plans after a retry when they failed to load', async () => {
    let attempts = 0
    server.use(
      http.get(`${GATEWAY_URL}/v1/billing/trial-plans`, () => {
        attempts += 1
        return attempts === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([SMALL])
      }),
    )
    const { user } = renderPlanStep()

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('tab', { name: '2 Safes' })).toBeInTheDocument()
  })
})
