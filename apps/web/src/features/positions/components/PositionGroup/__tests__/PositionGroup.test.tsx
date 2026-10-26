import { positionsFixtures } from '@safe-global/test/msw/fixtures'
import { getReadablePositionType } from '@safe-global/utils/features/positions'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { render, screen, within } from '@/tests/test-utils'
import { PositionGroup } from '../index'

// Aave V3 Lending of the EF Safe, recorded from staging: deposits and a GHO loan.
const group = positionsFixtures.efSafe[0].items[0]
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('PositionGroup', () => {
  it('titles the table with the group name', () => {
    render(<PositionGroup group={group} />)

    expect(screen.getByRole('columnheader', { name: group.name })).toBeInTheDocument()
  })

  it('shows each position with its token, type, balance and value, in order', () => {
    render(<PositionGroup group={group} />)

    const rows = screen.getAllByTestId('table-row')
    expect(rows).toHaveLength(group.items.length)
    group.items.forEach((position, index) => {
      const { name, symbol, decimals } = position.tokenInfo
      const row = rows[index]
      expect(within(row).getByText(name)).toBeInTheDocument()
      expect(row).toHaveTextContent(
        new RegExp(`${escape(symbol)}\\s*•\\s*${getReadablePositionType(position.position_type)}`),
      )
      expect(row).toHaveTextContent(`${formatVisualAmount(position.balance, decimals)} ${symbol}`)
      expect(row).toHaveTextContent(formatCurrencyPrecise(position.fiatBalance, 'usd'), { normalizeWhitespace: false })
    })
  })

  it('shows a loan as debt with a negative value', () => {
    const loan = group.items.find(({ position_type }) => position_type === 'loan')
    if (!loan) throw new Error('The fixture group has no loan')
    render(<PositionGroup group={group} />)

    const row = screen.getAllByTestId('table-row')[group.items.indexOf(loan)]
    expect(row).toHaveTextContent(`${loan.tokenInfo.symbol} • Debt`)
    expect(row).toHaveTextContent(/-\$\s2,064,531\.91/)
  })
})
