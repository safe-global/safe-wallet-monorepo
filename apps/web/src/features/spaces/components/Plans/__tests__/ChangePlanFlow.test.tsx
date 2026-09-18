import { fireEvent, render, screen } from '@/tests/test-utils'
import ChangePlanFlow, { continueLabelFor } from '../ChangePlanFlow'
import type { CurrentPlan, PlanPick } from '../types'

let mockSafeCount = 3
jest.mock('../../../hooks/billing/useSeatTrim', () => ({
  useSeatTrim: () => ({
    safeCount: mockSafeCount,
    needsTrim: (seats: number | null | undefined) => seats != null && mockSafeCount > seats,
  }),
}))

jest.mock('../SelectAccountsStep', () => ({
  __esModule: true,
  default: ({
    limit,
    planName,
    continueLabel,
    onBack,
    onContinue,
  }: {
    limit: number
    planName: string
    continueLabel: string
    onBack: () => void
    onContinue: (removed: { chainId: string; address: string }[]) => void
  }) => (
    <div data-testid="accounts-step" data-limit={limit} data-plan={planName}>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onContinue([{ chainId: '1', address: '0xB' }])}>{continueLabel}</button>
    </div>
  ),
}))

jest.mock('../ChangePlanDialog', () => ({
  __esModule: true,
  default: ({ removed }: { removed?: { chainId: string; address: string }[] }) => (
    <div data-testid="change-plan-dialog" data-removed={JSON.stringify(removed ?? null)} />
  ),
}))

const pick = (seats: number, price: number): PlanPick => ({
  tier: { id: 'Starter-month', name: 'Starter', currency: 'eur', billingCycle: 'month', options: [], features: [] },
  option: {
    paymentLinkId: 'pl_starter',
    priceId: 'price_starter',
    label: `${seats} Safe accounts`,
    seats,
    price,
    originalPrice: null,
  },
})
const currentPlan: CurrentPlan = {
  name: 'Business',
  price: 499,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing: true,
  periodEndsAt: '2026-12-06T00:00:00Z',
}

describe('ChangePlanFlow', () => {
  beforeEach(() => {
    mockSafeCount = 3
  })

  it('asks which Safes stay when the Workspace holds more than the new plan covers, then confirms with them removed', () => {
    render(<ChangePlanFlow spaceId="space-1" pick={pick(2, 189)} currentPlan={currentPlan} onClose={jest.fn()} />)

    expect(screen.getByTestId('accounts-step')).toHaveAttribute('data-limit', '2')
    expect(screen.getByTestId('accounts-step')).toHaveAttribute('data-plan', 'Starter')
    expect(screen.queryByTestId('change-plan-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to downgrade' }))

    expect(screen.queryByTestId('accounts-step')).not.toBeInTheDocument()
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute(
      'data-removed',
      JSON.stringify([{ chainId: '1', address: '0xB' }]),
    )
  })

  it('goes back to the chooser from the accounts step', () => {
    const onClose = jest.fn()
    render(<ChangePlanFlow spaceId="space-1" pick={pick(2, 189)} currentPlan={currentPlan} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('opens the change summary straight away when the plan covers every Safe', () => {
    render(<ChangePlanFlow spaceId="space-1" pick={pick(20, 1669)} currentPlan={currentPlan} onClose={jest.fn()} />)

    expect(screen.queryByTestId('accounts-step')).not.toBeInTheDocument()
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-removed', 'null')
  })

  it('words the step button after the direction of the change', () => {
    expect(continueLabelFor('downgrade')).toBe('Continue to downgrade')
    expect(continueLabelFor('upgrade')).toBe('Continue to upgrade')
    expect(continueLabelFor('change')).toBe('Continue')
  })
})
