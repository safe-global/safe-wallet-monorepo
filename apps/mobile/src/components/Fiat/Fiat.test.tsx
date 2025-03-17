import { render } from '@/src/tests/test-utils'
import { Fiat } from '.'

describe('Fiat', () => {
  it('should render the formatted value correctly', () => {
    const container = render(<Fiat value="215531.65" currency="usd" />)
    const fiatBalanceDisplay = container.getByTestId('fiat-balance-display')

    expect(fiatBalanceDisplay).toBeVisible()
    expect(fiatBalanceDisplay).toHaveTextContent('$ 215.53K')
  })
})
