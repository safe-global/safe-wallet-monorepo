import { fireEvent, render, screen } from '@/tests/test-utils'
import type { PlanGroup } from '../../../hooks/billing/types'
import StartTrialModal from '../StartTrialModal'

const mockUseSpaceOffers = jest.fn()
const mockStartCheckout = jest.fn()
let mockCheckout = { isRedirecting: false, isError: false }
jest.mock('../../../hooks/billing/useSpaceOffers', () => ({ useSpaceOffers: () => mockUseSpaceOffers() }))
jest.mock('../../../hooks/billing/useStartCheckout', () => ({
  useStartCheckout: () => ({ startCheckout: mockStartCheckout, ...mockCheckout }),
}))

const trial = (planName: string, paymentLinkId: string, seats: number, price: number): PlanGroup => ({
  name: planName,
  offers: [{ paymentLinkId, planName, seats, price, currency: 'eur', billingCycle: 'month', trialPeriodDays: 60 }],
})
const TRIAL_PLANS = [trial('Starter', 'pl_starter', 2, 149), trial('Business', 'pl_business', 10, 499)]

describe('StartTrialModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckout = { isRedirecting: false, isError: false }
    mockUseSpaceOffers.mockReturnValue({ trialPlans: TRIAL_PLANS, trialPeriodDays: 60, isLoading: false })
  })

  it('preselects Business and starts the checkout for the picked plan', () => {
    render(<StartTrialModal open onOpenChange={jest.fn()} />)

    expect(screen.getByText('Start your 60-day free trial of Safe Pro')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Business/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('€149')).toHaveClass('line-through')

    fireEvent.click(screen.getByRole('radio', { name: /^Starter/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Start free trial' }))

    expect(mockStartCheckout).toHaveBeenCalledWith('pl_starter')
  })

  it('shows a skeleton while the offers load', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [], trialPeriodDays: null, isLoading: true })
    render(<StartTrialModal open onOpenChange={jest.fn()} />)

    expect(screen.getByText('Start your free trial of Safe Pro')).toBeInTheDocument()
    expect(screen.getByTestId('trial-plans-skeleton')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start free trial' })).toBeDisabled()
  })

  it('explains when the Workspace is offered no trial', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [], trialPeriodDays: null, isLoading: false })
    render(<StartTrialModal open onOpenChange={jest.fn()} />)

    expect(screen.getByText('There is no free trial available for this Workspace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start free trial' })).toBeDisabled()
  })

  it('surfaces a failed checkout request and blocks double submits while redirecting', () => {
    mockCheckout = { isRedirecting: true, isError: true }
    render(<StartTrialModal open onOpenChange={jest.fn()} />)

    expect(screen.getByText(/couldn.t start the checkout/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start free trial' })).toBeDisabled()
  })
})
