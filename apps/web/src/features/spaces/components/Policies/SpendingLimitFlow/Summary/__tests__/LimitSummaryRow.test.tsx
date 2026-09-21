import chains from '@safe-global/utils/config/chains'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { render, screen } from '@/tests/test-utils'
import LimitSummaryRow from '../LimitSummaryRow'
import { limitSummaryBuilder, limitSummaryTokenBuilder } from '../SpendingLimitSummary.fixtures'

describe('LimitSummaryRow', () => {
  it('shows the amount with the token symbol and the frequency label', () => {
    const token = limitSummaryTokenBuilder().with({ symbol: 'ETH', decimals: 18 }).build()
    const limit = limitSummaryBuilder().with({ token, amount: '0.5466', resetTimeMin: '10080' }).build()

    render(<LimitSummaryRow limit={limit} chainId="1" />)

    expect(screen.getByTestId('spending-limit-summary-limit')).toHaveTextContent('0.5466 ETH')
    expect(screen.getByTestId('spending-limit-summary-frequency')).toHaveTextContent('Weekly')
  })

  it('formats the amount through the shared formatter once the decimals are known', () => {
    const token = limitSummaryTokenBuilder().with({ symbol: 'USDC', decimals: 6 }).build()
    const limit = limitSummaryBuilder().with({ token, amount: '1000', resetTimeMin: '43200' }).build()

    render(<LimitSummaryRow limit={limit} chainId="1" />)

    expect(screen.getByTestId('spending-limit-summary-limit')).toHaveTextContent(
      `${formatVisualAmount('1000000000', 6)} USDC`,
    )
  })

  it('renders the amount exactly as typed when it carries more precision than the token holds', () => {
    const errorSpy = jest.spyOn(console, 'error')
    const token = limitSummaryTokenBuilder().with({ symbol: 'USDC', decimals: 6 }).build()
    const limit = limitSummaryBuilder().with({ token, amount: '1.1234567' }).build()

    render(<LimitSummaryRow limit={limit} chainId="1" />)

    expect(screen.getByTestId('spending-limit-summary-limit')).toHaveTextContent('1.1234567 USDC')
    // An over-precise amount is an expected outcome, not a fault: it must not reach the console.
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('renders the amount exactly as typed when the token decimals are unknown', () => {
    const token = limitSummaryTokenBuilder().with({ symbol: '0x1234…5678', decimals: undefined }).build()
    const limit = limitSummaryBuilder().with({ token, amount: '12.5', resetTimeMin: '0' }).build()

    render(<LimitSummaryRow limit={limit} chainId="1" />)

    expect(screen.getByTestId('spending-limit-summary-limit')).toHaveTextContent('12.5 0x1234…5678')
    expect(screen.getByTestId('spending-limit-summary-frequency')).toHaveTextContent('One time only')
  })

  it("falls back to the chain's dropdown wording for a test-chain period", () => {
    const limit = limitSummaryBuilder().with({ resetTimeMin: '60' }).build()

    render(<LimitSummaryRow limit={limit} chainId={chains.sep} />)

    expect(screen.getByTestId('spending-limit-summary-frequency')).toHaveTextContent('1 hour')
  })
})
