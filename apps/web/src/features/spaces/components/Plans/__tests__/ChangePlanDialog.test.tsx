import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import ChangePlanDialog from '../ChangePlanDialog'
import type { PlanPick } from '../types'

const mockPreviewChange = jest.fn()
const mockChangePlan = jest.fn()
let mockState: Record<string, unknown> = {}
jest.mock('../../../hooks/billing/useChangePlan', () => ({
  useChangePlan: () => ({
    previewChange: mockPreviewChange,
    changePlan: mockChangePlan,
    preview: undefined,
    isPreviewing: false,
    previewError: undefined,
    isChanging: false,
    changeError: undefined,
    ...mockState,
  }),
}))
const mockTrim = jest.fn()
let mockTrimState: Record<string, unknown> = {}
jest.mock('../../../hooks/billing/useSeatTrim', () => ({
  useSeatTrim: () => ({ trim: mockTrim, isTrimming: false, error: undefined, ...mockTrimState }),
}))

const pick: PlanPick = {
  tier: {
    id: 'Starter-month',
    name: 'Starter',
    currency: 'eur',
    billingCycle: 'month',
    options: [],
    features: [],
  },
  option: {
    paymentLinkId: 'pl_starter',
    priceId: 'price_starter',
    label: '2 Safe accounts',
    price: 189,
    originalPrice: null,
  },
}
const currentPlan = {
  name: 'Business',
  price: 499,
  currency: 'eur',
  billingCycle: 'month' as const,
  isTrialing: false,
  periodEndsAt: '2026-12-06T00:00:00Z',
  seatsLabel: '20 Safe accounts',
}
const preview = {
  amountDue: -31000,
  currency: 'eur',
  nextBillingDate: Date.UTC(2026, 11, 6) / 1000,
  lineItems: [
    { description: 'Unused time on Business', amount: -49900, currency: 'eur' },
    { description: 'Remaining time on Starter', amount: 18900, currency: 'eur' },
  ],
}

describe('ChangePlanDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockState = {}
    mockTrimState = {}
    mockTrim.mockResolvedValue(true)
  })

  it('previews the picked price on open and shows a skeleton until it arrives', () => {
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={currentPlan}
        onClose={jest.fn()}
        onChanged={jest.fn()}
      />,
    )

    expect(mockPreviewChange).toHaveBeenCalledWith('price_starter')
    expect(screen.getByTestId('change-plan-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('change-plan-confirm')).toBeDisabled()
  })

  it('renders the prorated breakdown and hands over once the change is applied', async () => {
    mockState = { preview }
    mockChangePlan.mockResolvedValue(true)
    const onClose = jest.fn()
    const onChanged = jest.fn()
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={currentPlan}
        onClose={onClose}
        onChanged={onChanged}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Switch to 2 Safe accounts' })).toBeInTheDocument()
    expect(screen.getByTestId('change-plan-summary')).toHaveTextContent('Current plan')
    expect(screen.getByTestId('change-plan-summary')).toHaveTextContent('Business· 20 Safe accounts€499/mo')
    expect(screen.getByTestId('change-plan-summary')).toHaveTextContent('New plan')
    expect(screen.getByTestId('change-plan-summary')).toHaveTextContent('Starter· 2 Safe accounts€189/mo')
    expect(screen.getByText('Unused time on Business')).toBeInTheDocument()
    expect(screen.getByText('Your plan will be downgraded immediately')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm change' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByTestId('change-plan-amount-due')).toHaveTextContent('-€ 310')
    expect(screen.getByText(/Next billing date: Dec 6, 2026/)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('change-plan-confirm'))

    await waitFor(() => expect(onChanged).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
    expect(mockChangePlan).toHaveBeenCalledWith('price_starter', 'pl_starter')
  })

  it('removes the Safes left out before the change and says so in the summary', async () => {
    mockState = { preview }
    mockChangePlan.mockResolvedValue(true)
    const removed = [{ chainId: '1', address: '0xB' }]
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={currentPlan}
        removed={removed}
        onClose={jest.fn()}
        onChanged={jest.fn()}
      />,
    )

    expect(screen.getByTestId('change-plan-removed-note')).toHaveTextContent(
      '1 Safe account will be removed from the Workspace. They remain available in My accounts.',
    )

    fireEvent.click(screen.getByTestId('change-plan-confirm'))

    await waitFor(() => expect(mockChangePlan).toHaveBeenCalledWith('price_starter', 'pl_starter'))
    expect(mockTrim).toHaveBeenCalledWith(removed)
    expect(mockTrim.mock.invocationCallOrder[0]).toBeLessThan(mockChangePlan.mock.invocationCallOrder[0])
  })

  it('stops before the change when the removal fails and shows why', async () => {
    mockState = { preview }
    mockTrim.mockResolvedValue(false)
    mockTrimState = { error: 'We couldn’t update the Workspace. Please try again.' }
    const onClose = jest.fn()
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={currentPlan}
        removed={[{ chainId: '1', address: '0xB' }]}
        onClose={onClose}
        onChanged={jest.fn()}
      />,
    )

    fireEvent.click(screen.getByTestId('change-plan-confirm'))

    await waitFor(() => expect(mockTrim).toHaveBeenCalled())
    expect(mockChangePlan).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText('We couldn’t update the Workspace. Please try again.')).toBeInTheDocument()
    expect(screen.queryByTestId('change-plan-removed-note')).toBeInTheDocument()
  })

  it('keeps the dialog open and shows the error when the change is rejected', async () => {
    mockState = { preview, changeError: { status: 409, data: { message: 'The workspace is already on this plan' } } }
    mockChangePlan.mockResolvedValue(false)
    const onClose = jest.fn()
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={currentPlan}
        onClose={onClose}
        onChanged={jest.fn()}
      />,
    )

    fireEvent.click(screen.getByTestId('change-plan-confirm'))

    await waitFor(() => expect(mockChangePlan).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText('The workspace is already on this plan')).toBeInTheDocument()
  })

  it('reads as an upgrade when the new plan costs more', () => {
    mockState = { preview }
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={{ ...currentPlan, price: 49 }}
        onClose={jest.fn()}
        onChanged={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Upgrade to 2 Safe accounts' })).toBeInTheDocument()
    expect(screen.getByText('Your plan will be upgraded immediately')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm change' })).toBeInTheDocument()
  })

  it('skips the proration preview during a trial and explains when billing starts', async () => {
    mockChangePlan.mockResolvedValue(true)
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={{ ...currentPlan, isTrialing: true }}
        onClose={jest.fn()}
        onChanged={jest.fn()}
      />,
    )

    expect(mockPreviewChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('change-plan-skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('change-plan-trial-note')).toHaveTextContent(
      "You're on free access until Dec 6, 2026. Nothing is charged now. From then on you'll pay €189/mo for Starter.",
    )
    expect(screen.getByTestId('change-plan-confirm')).toBeEnabled()

    fireEvent.click(screen.getByTestId('change-plan-confirm'))
    await waitFor(() => expect(mockChangePlan).toHaveBeenCalledWith('price_starter', 'pl_starter'))
  })

  it('surfaces a preview error instead of the breakdown', () => {
    mockState = { previewError: { status: 403, data: { message: 'This plan is not available for this workspace' } } }
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={currentPlan}
        onClose={jest.fn()}
        onChanged={jest.fn()}
      />,
    )

    expect(screen.getByText('This plan is not available for this workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('change-plan-skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('change-plan-confirm')).toBeDisabled()
  })

  it('explains the step-up redirect instead of reporting an error when elevation is required', () => {
    mockState = { preview, changeError: { status: 403, data: { message: 'elevation_required' } } }
    render(
      <ChangePlanDialog
        spaceId="space-1"
        pick={pick}
        currentPlan={currentPlan}
        onClose={jest.fn()}
        onChanged={jest.fn()}
      />,
    )

    expect(screen.getByText(/Verify your identity to confirm the plan change/)).toBeInTheDocument()
    expect(screen.queryByText('elevation_required')).not.toBeInTheDocument()
  })
})
