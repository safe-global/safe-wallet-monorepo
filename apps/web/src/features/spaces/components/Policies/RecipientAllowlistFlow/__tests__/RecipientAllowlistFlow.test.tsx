import { render, screen, fireEvent } from '@/tests/test-utils'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import { createDefaultAllowlistValues } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
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
  default: ({
    dismissedCallouts,
    onDismissCallout,
  }: {
    dismissedCallouts: { tokens: boolean; recipients: boolean }
    onDismissCallout: (section: 'tokens' | 'recipients') => void
  }) => (
    <div data-testid="create-step" data-dismissed={JSON.stringify(dismissedCallouts)}>
      <button onClick={() => onDismissCallout('recipients')}>dismiss recipients</button>
    </div>
  ),
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

  it('seeds the flow with an empty allowlist form', () => {
    render(<RecipientAllowlistFlow />)

    expect(mockTxFlow.mock.calls[0][0]).toMatchObject({ initialData: createDefaultAllowlistValues() })
  })

  it('remembers dismissed callouts per section', () => {
    render(<RecipientAllowlistFlow />)
    expect(screen.getByTestId('create-step')).toHaveAttribute(
      'data-dismissed',
      JSON.stringify({ tokens: false, recipients: false }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'dismiss recipients' }))

    expect(screen.getByTestId('create-step')).toHaveAttribute(
      'data-dismissed',
      JSON.stringify({ tokens: false, recipients: true }),
    )
  })

  it('names the policy in the subtitle', () => {
    render(<RecipientAllowlistFlow />)
    render(<>{mockTxFlow.mock.calls[0][0].subtitle}</>)

    expect(screen.getByText('Allowlist')).toBeInTheDocument()
  })
})
