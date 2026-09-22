import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { render, screen } from '@/tests/test-utils'
import SpenderSummaryCard from '../SpenderSummaryCard'
import { LIMITS_LABEL, SPENDER_LABEL } from '../constants'
import { limitSummaryBuilder, limitSummaryTokenBuilder, spenderSummaryBuilder } from '../SpendingLimitSummary.fixtures'

const SPENDER = '0x8675B754342754A30A2AeF474D114d8460bca19b'

describe('SpenderSummaryCard', () => {
  it('shows the labels, the named spender with the full address, and one row per limit', () => {
    const eth = limitSummaryTokenBuilder().with({ symbol: 'ETH', decimals: 18 }).build()
    const usdc = limitSummaryTokenBuilder().with({ symbol: 'USDC', decimals: 6 }).build()
    const spender = spenderSummaryBuilder()
      .with({
        address: SPENDER,
        name: 'Alice',
        limits: [
          limitSummaryBuilder().with({ token: eth, amount: '0.5466', resetTimeMin: '10080' }).build(),
          limitSummaryBuilder().with({ token: usdc, amount: '250', resetTimeMin: '43200' }).build(),
        ],
      })
      .build()

    render(<SpenderSummaryCard spender={spender} chainId="1" />)

    const card = screen.getByTestId('spending-limit-summary-spender')
    expect(card).toHaveTextContent(SPENDER_LABEL)
    expect(card).toHaveTextContent(LIMITS_LABEL)
    expect(card).toHaveTextContent('Alice')
    expect(card).toHaveTextContent(SPENDER)
    expect(card).not.toHaveTextContent(shortenAddress(SPENDER))

    const rows = screen.getAllByTestId('spending-limit-summary-limit')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('0.5466 ETH')
    expect(rows[0]).toHaveTextContent('Weekly')
    expect(rows[1]).toHaveTextContent('250 USDC')
    expect(rows[1]).toHaveTextContent('Monthly')
  })

  it('shows the address alone when the spender has no name', () => {
    const spender = spenderSummaryBuilder().with({ address: SPENDER, name: undefined }).build()

    render(<SpenderSummaryCard spender={spender} chainId="1" />)

    expect(screen.getByTestId('spending-limit-summary-spender')).toHaveTextContent(SPENDER)
  })
})
