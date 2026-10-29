import { positionsFixtures } from '@safe-global/test/msw/fixtures'
import { calculatePositionsFiatTotal, calculateProtocolPercentage } from '@safe-global/utils/features/positions'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { render, screen } from '@/tests/test-utils'
import PositionsHeader from '../index'

const protocols = positionsFixtures.efSafe
const aave = protocols[0]
const total = calculatePositionsFiatTotal(protocols)
const share = formatPercentage(calculateProtocolPercentage(aave.fiatTotal, total))

describe('PositionsHeader', () => {
  it('shows the app name, its value and its share of all positions', () => {
    render(<PositionsHeader protocol={aave} fiatTotal={total} />)

    expect(screen.getByText(aave.protocol_metadata.name)).toBeInTheDocument()
    expect(screen.getByText(share)).toBeInTheDocument()
    // toHaveTextContent turns the hair space after the currency sign into a space, so the expected text must too
    expect(screen.getByText(aave.protocol_metadata.name).parentElement).toHaveTextContent(
      formatCurrencyPrecise(aave.fiatTotal, 'usd').replace(/\s/g, ' '),
    )
  })

  it('leaves out the share when the total of all positions is unknown', () => {
    render(<PositionsHeader protocol={aave} />)

    expect(screen.getByText(aave.protocol_metadata.name)).toBeInTheDocument()
    expect(screen.queryByText(share)).not.toBeInTheDocument()
  })
})
