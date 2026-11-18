import { faker } from '@faker-js/faker'
import type { TokenInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { render, screen } from '@/tests/test-utils'
import QueueTxDetails from '.'

const address = () => checksumAddress(faker.finance.ethereumAddress())

const token = (symbol: string, decimals = 18): TokenInfo => ({
  address: address(),
  decimals,
  name: symbol,
  symbol,
  trusted: true,
})

const renderSummary = (txInfo: object) =>
  render(
    <QueueTxDetails.Summary
      tx={{ id: '1', timestamp: 0, txStatus: 'AWAITING_CONFIRMATIONS', txInfo } as unknown as Transaction}
    />,
  )

describe('QueueTxDetails.Summary', () => {
  it('shows an outgoing amount without a minus sign, since the type tag says Send', () => {
    renderSummary({
      type: 'Transfer',
      direction: 'OUTGOING',
      sender: { value: address() },
      recipient: { value: address() },
      transferInfo: { type: 'ERC20', tokenAddress: address(), value: '1000000', tokenSymbol: 'USDC', decimals: 6 },
    })

    expect(screen.getByText(/1 USDC/)).toBeInTheDocument()
    expect(screen.queryByText(/-1 USDC/)).not.toBeInTheDocument()
  })

  it('shows the amount sold and the token bought of a CoW sell order', () => {
    renderSummary({
      type: 'SwapOrder',
      kind: 'sell',
      sellAmount: '2000000000000000000',
      buyAmount: '6000000000',
      sellToken: token('WETH'),
      buyToken: token('USDC', 6),
    })

    expect(screen.getByText(/2 WETH/)).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
  })

  it('counts the validators a staking exit requests', () => {
    renderSummary({ type: 'NativeStakingValidatorsExit', numValidators: 2, validators: [], tokenInfo: token('ETH') })

    expect(screen.getByText('2 validators')).toBeInTheDocument()
  })

  it('says the method is unknown when the gateway could not decode the call', () => {
    renderSummary({ type: 'Custom', methodName: null, to: { value: address() }, dataSize: '68', isCancellation: false })

    expect(screen.getByText('Unknown method')).toBeInTheDocument()
  })
})
