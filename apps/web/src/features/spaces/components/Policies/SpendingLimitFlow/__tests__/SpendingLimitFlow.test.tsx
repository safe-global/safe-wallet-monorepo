import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, screen } from '@/tests/test-utils'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import ReviewSpendingLimitPolicy from '../ReviewStep'
import { createDefaultFormValues } from '../types'
import { CREATE_STEP_TITLE, FLOW_HELP_LABEL, FLOW_SUBTITLE } from '../constants'
import SpendingLimitFlow from '..'

jest.mock('@/components/tx-flow/TxFlow', () => ({
  TxFlow: jest.fn(({ children }: { children: React.ReactNode }) => <div data-testid="tx-flow">{children}</div>),
}))
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({ children, initial }: { children: React.ReactNode; initial?: unknown }) => (
    <div data-testid="safe-scope" data-initial={initial === undefined ? 'none' : 'set'}>
      {children}
    </div>
  ),
}))
jest.mock('../CreateStep', () => ({ __esModule: true, default: () => <div data-testid="create-step" /> }))

const mockTxFlow = TxFlow as jest.MockedFunction<typeof TxFlow>

describe('SpendingLimitFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('mounts the transaction flow inside a SafeScope with no Safe preselected', () => {
    render(<SpendingLimitFlow />)

    const scope = screen.getByTestId('safe-scope')
    expect(scope).toHaveAttribute('data-initial', 'none')
    expect(scope.querySelector('[data-testid="tx-flow"]')).toBeInTheDocument()
    expect(screen.getByTestId('create-step')).toBeInTheDocument()
  })

  it('hands TxFlow the spending limit chrome, the empty policy and the review placeholder', () => {
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
    expect(props.eventCategory).toBeUndefined()
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
