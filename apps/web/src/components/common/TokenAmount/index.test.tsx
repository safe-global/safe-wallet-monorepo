import { render } from '@/tests/test-utils'
import TokenAmount from '.'

describe('TokenAmount', () => {
  it('should format amount with decimals', async () => {
    const result = render(<TokenAmount value="1234" decimals={3} />)
    await expect(result.findByText('1.234')).resolves.not.toBeNull()
  })

  it('should format small amount for zero decimals', async () => {
    const result = render(<TokenAmount value="123" decimals={0} />)
    await expect(result.findByText('123')).resolves.not.toBeNull()
  })

  it('should format big amount for zero decimals', async () => {
    const result = render(<TokenAmount value="10000000" decimals={0} />)
    await expect(result.findByText('10M')).resolves.not.toBeNull()
  })

  it('should render the exact value without float rounding when preciseAmount is set', async () => {
    // 16000000000020475 wei must not be rounded to ...20474 by a float64 conversion.
    const result = render(<TokenAmount value="16000000000020475" decimals={18} tokenSymbol="ETH" preciseAmount />)
    await expect(result.findByText('0.016000000000020475 ETH')).resolves.not.toBeNull()
  })
})
