import { render, screen } from '@/tests/test-utils'
import SendAmountBlock from '../SendAmountBlock'
import { TokenType } from '@safe-global/store/gateway/types'
import { parseUnits } from 'ethers'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

const mockTokenInfo: Balance['tokenInfo'] = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  logoUri: '',
  name: 'USD Coin',
  symbol: 'USDC',
  type: TokenType.ERC20,
}

const mockEthTokenInfo: Balance['tokenInfo'] = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
  logoUri: '',
  name: 'Ether',
  symbol: 'ETH',
  type: TokenType.NATIVE_TOKEN,
}

describe('SendAmountBlock', () => {
  it('should render the token amount and symbol', () => {
    render(<SendAmountBlock amountInWei={parseUnits('100', 6).toString()} tokenInfo={mockTokenInfo} />)

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByTestId('token-amount')).toBeInTheDocument()
  })

  it('should render "Send" as default title', () => {
    render(<SendAmountBlock amountInWei={parseUnits('100', 6).toString()} tokenInfo={mockTokenInfo} />)

    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('should render a custom title', () => {
    render(<SendAmountBlock amountInWei={parseUnits('100', 6).toString()} tokenInfo={mockTokenInfo} title="Transfer" />)

    expect(screen.getByText('Transfer')).toBeInTheDocument()
  })

  it('should render children', () => {
    render(
      <SendAmountBlock amountInWei={parseUnits('100', 6).toString()} tokenInfo={mockTokenInfo}>
        <span data-testid="child-element">child</span>
      </SendAmountBlock>,
    )

    expect(screen.getByTestId('child-element')).toBeInTheDocument()
  })

  it('should show fiat value when fiatConversion is provided', () => {
    render(
      <SendAmountBlock amountInWei={parseUnits('50', 6).toString()} tokenInfo={mockTokenInfo} fiatConversion="1" />,
    )

    // FiatValue renders a Tooltip span with aria-label containing the formatted currency
    expect(screen.getByLabelText('$ 50.00')).toBeInTheDocument()
  })

  it('should not show fiat value when fiatConversion is not provided', () => {
    render(<SendAmountBlock amountInWei={parseUnits('50', 6).toString()} tokenInfo={mockTokenInfo} />)

    expect(screen.queryByLabelText(/^\$/)).not.toBeInTheDocument()
  })

  it('should not show fiat value when fiatConversion is "0"', () => {
    render(
      <SendAmountBlock amountInWei={parseUnits('50', 6).toString()} tokenInfo={mockTokenInfo} fiatConversion="0" />,
    )

    expect(screen.queryByLabelText(/^\$/)).not.toBeInTheDocument()
  })

  it('should not show fiat value when amountInWei is "0"', () => {
    render(<SendAmountBlock amountInWei="0" tokenInfo={mockTokenInfo} fiatConversion="1" />)

    expect(screen.queryByLabelText(/^\$/)).not.toBeInTheDocument()
  })

  it('should compute correct fiat value for ETH with high fiatConversion', () => {
    render(
      <SendAmountBlock
        amountInWei={parseUnits('0.5', 18).toString()}
        tokenInfo={mockEthTokenInfo}
        fiatConversion="2000"
      />,
    )

    // 0.5 ETH * $2000 = $1000
    expect(screen.getByLabelText('$ 1,000.00')).toBeInTheDocument()
  })
})
