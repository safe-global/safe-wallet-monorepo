import { fireEvent, render, screen } from '@/tests/test-utils'
import ChangePlanFlow, { continueLabelFor, trialSwitchBody } from '../ChangePlanFlow'
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
  default: ({ removed, onChanged }: { removed?: { chainId: string; address: string }[]; onChanged: () => void }) => (
    <div data-testid="change-plan-dialog" data-removed={JSON.stringify(removed ?? null)}>
      <button onClick={onChanged}>confirm-change</button>
    </div>
  ),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    SafeProNoticeModal: ({
      title,
      body,
      actionLabel,
      onAction,
    }: {
      title: string
      body: string
      actionLabel: string
      onAction: () => void
    }) => (
      <div data-testid="notice-modal">
        <h2>{title}</h2>
        <p>{body}</p>
        <button onClick={onAction}>{actionLabel}</button>
      </div>
    ),
    SafeProSubscriptionActivatedModal: ({
      planName,
      onOpenChange,
    }: {
      planName: string
      onOpenChange: (open: boolean) => void
    }) => (
      <div data-testid="activated-modal" data-plan={planName}>
        <button onClick={() => onOpenChange(false)}>Get started</button>
      </div>
    ),
  }),
  createFeatureHandle: () => ({}),
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

  it('confirms a switch made during the trial with when billing starts, then closes', () => {
    const onClose = jest.fn()
    const onChanged = jest.fn()
    render(
      <ChangePlanFlow
        spaceId="space-1"
        pick={pick(20, 1669)}
        currentPlan={currentPlan}
        onClose={onClose}
        onChanged={onChanged}
      />,
    )

    fireEvent.click(screen.getByText('confirm-change'))

    expect(onChanged).toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByTestId('change-plan-dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('notice-modal')).toHaveTextContent("You're now on Starter")
    expect(screen.getByTestId('notice-modal')).toHaveTextContent(
      "Your free trial continues until Dec 6, 2026. From then on you'll pay €1,669/mo for Starter.",
    )

    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('celebrates a paid plan change with the activated modal', () => {
    const onClose = jest.fn()
    render(
      <ChangePlanFlow
        spaceId="space-1"
        pick={pick(20, 1669)}
        currentPlan={{ ...currentPlan, isTrialing: false }}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByText('confirm-change'))

    expect(screen.getByTestId('activated-modal')).toHaveAttribute('data-plan', 'Starter')
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('words the trial switch without an end date or with a custom price', () => {
    expect(trialSwitchBody({ ...currentPlan, periodEndsAt: null }, pick(2, 189))).toBe(
      "Your free trial continues. From then on you'll pay €189/mo for Starter.",
    )
    const custom = pick(2, 189)
    expect(trialSwitchBody(currentPlan, { ...custom, option: { ...custom.option, price: null } })).toBe(
      "Your free trial continues until Dec 6, 2026. From then on you'll pay a custom price for Starter.",
    )
  })

  it('words the step button after the direction of the change', () => {
    expect(continueLabelFor('downgrade')).toBe('Continue to downgrade')
    expect(continueLabelFor('upgrade')).toBe('Continue to upgrade')
    expect(continueLabelFor('change')).toBe('Continue')
  })
})
