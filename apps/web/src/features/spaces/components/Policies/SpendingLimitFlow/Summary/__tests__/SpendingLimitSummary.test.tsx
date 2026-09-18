import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { render, screen } from '@/tests/test-utils'
import SpendingLimitSummary from '..'
import { describePolicy } from '../describePolicy'
import {
  limitSummaryBuilder,
  spendingLimitSummaryBuilder,
  safeAccountOptionBuilder,
  spenderSummaryBuilder,
} from '../SpendingLimitSummary.fixtures'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const withPeriods = (name: string | undefined, resetTimes: string[]) =>
  spenderSummaryBuilder()
    .with({ name, limits: resetTimes.map((resetTimeMin) => limitSummaryBuilder().with({ resetTimeMin }).build()) })
    .build()

describe('SpendingLimitSummary', () => {
  const alice = withPeriods('Alice', ['0'])
  const bob = withPeriods('Bob', ['10080', '43200'])
  const unnamed = withPeriods(undefined, ['1440'])
  const policy = spendingLimitSummaryBuilder()
    .with({ safe: safeAccountOptionBuilder().with({ name: 'Treasury' }).build(), spenders: [alice, bob, unnamed] })
    .build()

  it('opens with the callout, then the Safe, then one card per spender with one row per limit', () => {
    render(<SpendingLimitSummary policy={policy} />)

    expect(screen.getByTestId('spending-limit-summary')).toBeInTheDocument()
    expect(screen.getByTestId('spending-limit-summary-callout')).toHaveTextContent(describePolicy(policy).title)
    expect(screen.getByTestId('spending-limit-summary-applies-to')).toHaveTextContent('Treasury')
    expect(screen.getAllByTestId('spending-limit-summary-spender')).toHaveLength(3)
    expect(screen.getAllByTestId('spending-limit-summary-limit')).toHaveLength(4)
  })

  it('names the spenders in the callout, falling back to the shortened address', () => {
    render(<SpendingLimitSummary policy={policy} />)

    expect(screen.getByTestId('spending-limit-summary-callout')).toHaveTextContent(
      `You are giving Alice, Bob and ${shortenAddress(unnamed.address)} spending limits.`,
    )
  })

  it('shows each limit with its own frequency, in form order', () => {
    render(<SpendingLimitSummary policy={policy} />)

    const labels = screen.getAllByTestId('spending-limit-summary-frequency').map((node) => node.textContent)
    expect(labels).toEqual(['One time only', 'Weekly', 'Monthly', 'Daily'])
  })
})
