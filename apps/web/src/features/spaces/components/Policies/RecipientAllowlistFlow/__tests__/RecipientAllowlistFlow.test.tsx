import { Children } from 'react'
import { render, screen } from '@/tests/test-utils'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics/types'
import { createDefaultAllowlistValues } from '../types'
import ReviewRecipientAllowlist from '../ReviewStep'
import RecipientAllowlistFlow from '..'

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
jest.mock('../CreateStep', () => ({
  __esModule: true,
  default: () => <div data-testid="create-step" />,
}))

const mockTxFlow = TxFlow as jest.MockedFunction<typeof TxFlow>

describe('RecipientAllowlistFlow', () => {
  beforeEach(() => jest.clearAllMocks())

  it('starts on the Create step with no Safe picked', () => {
    render(<RecipientAllowlistFlow />)

    expect(screen.getByTestId('safe-scope')).toHaveAttribute('data-initial', 'none')
    expect(screen.getByTestId('create-step')).toBeInTheDocument()
  })

  it('reports its steps under its own flow type', () => {
    render(<RecipientAllowlistFlow />)

    expect(mockTxFlow.mock.calls[0][0]).toMatchObject({ eventCategory: TxFlowType.SETUP_SPACE_RECIPIENT_ALLOWLIST })
  })

  it('reviews through the allowlist review step', () => {
    render(<RecipientAllowlistFlow />)

    expect(mockTxFlow.mock.calls[0][0].ReviewTransactionComponent).toBe(ReviewRecipientAllowlist)
  })

  it('should, before the review, pass TxFlow the Create step alone', () => {
    render(<RecipientAllowlistFlow />)

    expect(Children.toArray(mockTxFlow.mock.calls[0][0].children)).toHaveLength(1)
  })

  it('seeds the flow with an empty allowlist form', () => {
    render(<RecipientAllowlistFlow />)

    expect(mockTxFlow.mock.calls[0][0]).toMatchObject({ initialData: createDefaultAllowlistValues() })
  })

  it('names the policy in the subtitle', () => {
    render(<RecipientAllowlistFlow />)
    render(<>{mockTxFlow.mock.calls[0][0].subtitle}</>)

    expect(screen.getByText('Allowlist')).toBeInTheDocument()
  })
})
