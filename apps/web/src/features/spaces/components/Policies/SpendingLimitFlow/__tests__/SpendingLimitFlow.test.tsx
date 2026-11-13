import { useState as mockUseState } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { MixpanelEventParams, TxFlowType, trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import ReviewSpendingLimitPolicy from '../ReviewStep'
import { createDefaultFormValues } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/types'
import {
  CREATE_STEP_TITLE,
  FLOW_HELP_LABEL,
  FLOW_SUBTITLE,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  useAddCustomToken as mockUseAddCustomToken,
  useCustomTokens as mockUseCustomTokens,
} from '../CustomTokensProvider'
import { tokenOptionBuilder } from '../utils/tokenOptions.testData'
import SpendingLimitFlow from '..'

// A miniature of TxFlow: it shows one step at a time, so the Create step really unmounts when the
// flow moves on — which is the whole reason state it must keep lives above it.
jest.mock('@/components/tx-flow/TxFlow', () => {
  const MockOtherStep = () => (
    <div data-testid="other-step">
      {mockUseCustomTokens('1')
        .map((token) => token.symbol)
        .join(',')}
    </div>
  )
  return {
    TxFlow: jest.fn(({ children }: { children: React.ReactNode }) => {
      // `mock`-prefixed so the hoisted factory may reach it.
      const [isOnCreateStep, setIsOnCreateStep] = mockUseState(true)
      return (
        <div data-testid="tx-flow">
          {isOnCreateStep ? children : <MockOtherStep />}
          <button type="button" onClick={() => setIsOnCreateStep((current) => !current)}>
            change step
          </button>
        </div>
      )
    }),
  }
})
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
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
  }) => {
    const addToken = mockUseAddCustomToken()
    return (
      <div data-testid="create-step" data-callout-dismissed={String(isCalloutDismissed)}>
        <button type="button" onClick={onDismissCallout}>
          dismiss callout
        </button>
        <button type="button" onClick={() => addToken('1', mockCustomToken)}>
          pick custom token
        </button>
      </div>
    )
  },
}))

const mockCustomToken = tokenOptionBuilder().with({ group: 'custom', symbol: 'NEW' }).build()

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

  it('keeps a token picked by address for the next step', async () => {
    const { user } = renderWithUserEvent(<SpendingLimitFlow />)

    await user.click(screen.getByRole('button', { name: 'pick custom token' }))
    await user.click(screen.getByRole('button', { name: 'change step' }))

    expect(screen.getByTestId('other-step')).toHaveTextContent(mockCustomToken.symbol)
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

  it.each([
    [false, 'signed'],
    [true, 'executed'],
  ])('tracks the policy transaction once it is %s', (isExecuted) => {
    render(<SpendingLimitFlow />)

    mockTxFlow.mock.calls[0][0].onSubmit?.({ txId: 'tx', isExecuted })

    expect(trackEvent).toHaveBeenCalledWith(POLICY_EVENTS.SPENDING_LIMIT_TX_SIGNED, {
      [MixpanelEventParams.IS_EXECUTED]: isExecuted,
    })
  })
})
