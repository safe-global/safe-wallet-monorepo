import { render, fireEvent } from '@/tests/test-utils'
import PlanStatusChip from './index'
import { PLAN_STATUS_MOCKS } from './mocks'

describe('PlanStatusChip', () => {
  it('renders the plan name and status label', () => {
    const { getByTestId } = render(<PlanStatusChip planStatus={PLAN_STATUS_MOCKS.starterWithin} />)
    const chip = getByTestId('plan-status-chip')
    expect(chip).toHaveTextContent('Starter')
    expect(chip).toHaveTextContent('Within limit')
  })

  it('renders the label for each status', () => {
    const cases = [
      [PLAN_STATUS_MOCKS.starterLimit, 'Starter', 'Limit reached'],
      [PLAN_STATUS_MOCKS.proWithin, 'Pro', 'Within limit'],
      [PLAN_STATUS_MOCKS.proApproaching, 'Pro', 'Approaching limit'],
      [PLAN_STATUS_MOCKS.proFailed, 'Pro', 'Payment failed'],
    ] as const

    cases.forEach(([planStatus, name, label]) => {
      const { getByTestId, unmount } = render(<PlanStatusChip planStatus={planStatus} />)
      const chip = getByTestId('plan-status-chip')
      expect(chip).toHaveTextContent(name)
      expect(chip).toHaveTextContent(label)
      unmount()
    })
  })

  it('opens the modal when clicked', () => {
    const { getByTestId, queryByTestId } = render(<PlanStatusChip planStatus={PLAN_STATUS_MOCKS.proWithin} />)
    expect(queryByTestId('plan-status-modal')).not.toBeInTheDocument()

    fireEvent.click(getByTestId('plan-status-chip'))
    expect(getByTestId('plan-status-modal')).toBeInTheDocument()
  })
})
