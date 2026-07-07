import { render } from '@/tests/test-utils'
import PlanStatusModal from './PlanStatusModal'
import { PLAN_STATUS_MOCKS } from './mocks'

const renderModal = (planStatus: Parameters<typeof PlanStatusModal>[0]['planStatus']) =>
  render(<PlanStatusModal open onClose={jest.fn()} planStatus={planStatus} />)

describe('PlanStatusModal', () => {
  it('renders the workspace promo and CTA when not in a workspace', () => {
    const { getByTestId, queryByTestId } = renderModal(PLAN_STATUS_MOCKS.noWorkspace)
    expect(getByTestId('plan-workspace-promo')).toBeInTheDocument()
    expect(queryByTestId('plan-usage-volume')).not.toBeInTheDocument()
    expect(getByTestId('plan-cta')).toHaveTextContent('Create a Workspace')
  })

  it('renders only the volume tile for a Starter within limit', () => {
    const { getByTestId, queryByTestId } = renderModal(PLAN_STATUS_MOCKS.starterWithin)
    expect(getByTestId('plan-usage-volume')).toBeInTheDocument()
    expect(queryByTestId('plan-usage-gasless')).not.toBeInTheDocument()
    expect(queryByTestId('plan-safes-selector')).not.toBeInTheDocument()
    expect(getByTestId('plan-cta')).toHaveTextContent('Compare plans')
  })

  it('renders the PAYG-fees row and comparison for a Starter at its limit', () => {
    const { getByTestId } = renderModal(PLAN_STATUS_MOCKS.starterLimit)
    expect(getByTestId('plan-payg-fees')).toHaveTextContent('Pay-as-you-go fees this period')
    expect(getByTestId('plan-comparison')).toBeInTheDocument()
    expect(getByTestId('plan-card-starter')).toBeInTheDocument()
    expect(getByTestId('plan-card-pro')).toBeInTheDocument()
  })

  it('renders both usage tiles and the safes selector for a Pro plan', () => {
    const { getByTestId } = renderModal(PLAN_STATUS_MOCKS.proWithin)
    expect(getByTestId('plan-usage-volume')).toBeInTheDocument()
    expect(getByTestId('plan-usage-gasless')).toBeInTheDocument()
    expect(getByTestId('plan-safes-selector')).toHaveTextContent('Active on 4 Safes')
  })

  it('shows a warning dot on the near-threshold metric when approaching the limit', () => {
    const { getByTestId } = renderModal(PLAN_STATUS_MOCKS.proApproaching)
    expect(getByTestId('plan-usage-volume-dot')).toBeInTheDocument()
    expect(getByTestId('plan-comparison')).toBeInTheDocument()
  })

  it('shows "Renewal failed" and the payment CTA when payment failed', () => {
    const { getByTestId } = renderModal(PLAN_STATUS_MOCKS.proFailed)
    expect(getByTestId('plan-status-modal')).toHaveTextContent('Renewal failed')
    expect(getByTestId('plan-cta')).toHaveTextContent('Update payment method')
  })
})
