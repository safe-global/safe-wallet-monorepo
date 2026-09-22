import { useState as mockUseState } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import ReviewSpendingLimitPolicy from '../ReviewStep'
import { createDefaultFormValues } from '../types'
import { CREATE_STEP_TITLE, FLOW_HELP_LABEL, FLOW_SUBTITLE } from '../constants'
import SpendingLimitFlow from '..'

// A miniature of TxFlow: it shows one step at a time, so the Create step really unmounts when the
// flow moves on — which is the whole reason state it must keep lives above it.
jest.mock('@/components/tx-flow/TxFlow', () => ({
  TxFlow: jest.fn(({ children }: { children: React.ReactNode }) => {
    // `mock`-prefixed so the hoisted factory may reach it.
    const [isOnCreateStep, setIsOnCreateStep] = mockUseState(true)
    return (
      <div data-testid="tx-flow">
        {isOnCreateStep ? children : <div data-testid="other-step" />}
        <button type="button" onClick={() => setIsOnCreateStep((current) => !current)}>
          change step
        </button>
      </div>
    )
  }),
}))
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({ children, initial }: { children: React.ReactNode; initial?: unknown }) => (
    <div data-testid="safe-scope" data-initial={initial === undefined ? 'none' : 'set'}>
      {children}
    </div>
  ),
}))
jest.mock('../ExistingSpendingLimitsProvider', () => ({
  ExistingSpendingLimitsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="existing-limits">{children}</div>
  ),
}))
jest.mock('../CreateStep', () => ({
  __esModule: true,
  default: ({
    isCalloutDismissed,
    onDismissCallout,
  }: {
    isCalloutDismissed: boolean
    onDismissCallout: () => void
  }) => (
    <div data-testid="create-step" data-callout-dismissed={String(isCalloutDismissed)}>
      <button type="button" onClick={onDismissCallout}>
        dismiss callout
      </button>
    </div>
  ),
}))

const mockTxFlow = TxFlow as jest.MockedFunction<typeof TxFlow>

describe('SpendingLimitFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('mounts the transaction flow inside a SafeScope with no Safe preselected', () => {
    render(<SpendingLimitFlow />)

    const scope = screen.getByTestId('safe-scope')
    expect(scope).toHaveAttribute('data-initial', 'none')
    const existing = scope.querySelector('[data-testid="existing-limits"]')
    expect(existing).toBeInTheDocument()
    expect(existing?.querySelector('[data-testid="tx-flow"]')).toBeInTheDocument()
    expect(screen.getByTestId('create-step')).toBeInTheDocument()
  })

  it('hands TxFlow the spending limit chrome, the empty policy, the review step and its analytics category', () => {
    render(<SpendingLimitFlow />)

    const props = mockTxFlow.mock.calls[0][0]
    render(<>{props.subtitle}</>)
    expect(screen.getByText(FLOW_SUBTITLE)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: FLOW_HELP_LABEL })).toHaveAttribute(
      'href',
      HelpCenterArticle.SPENDING_LIMITS,
    )
    expect(props.ReviewTransactionComponent).toBe(ReviewSpendingLimitPolicy)
    expect(props.initialData).toEqual(createDefaultFormValues())
    expect(props.eventCategory).toBe(TxFlowType.SETUP_SPACE_SPENDING_LIMIT)
  })

  it('keeps the callout dismissed across a trip to the next step and back', async () => {
    const { user } = renderWithUserEvent(<SpendingLimitFlow />)

    expect(screen.getByTestId('create-step')).toHaveAttribute('data-callout-dismissed', 'false')
    await user.click(screen.getByRole('button', { name: 'dismiss callout' }))
    expect(screen.getByTestId('create-step')).toHaveAttribute('data-callout-dismissed', 'true')

    await user.click(screen.getByRole('button', { name: 'change step' }))
    expect(screen.queryByTestId('create-step')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'change step' }))

    expect(screen.getByTestId('create-step')).toHaveAttribute('data-callout-dismissed', 'true')
  })

  it('titles the first step and hides the nonce on it', () => {
    render(<SpendingLimitFlow />)

    const children = mockTxFlow.mock.calls[0][0].children
    const step = (Array.isArray(children) ? children[0] : children) as React.ReactElement<{
      title: string
      hideNonce?: boolean
    }>
    expect(step.props).toMatchObject({ title: CREATE_STEP_TITLE, hideNonce: true })
  })
})
