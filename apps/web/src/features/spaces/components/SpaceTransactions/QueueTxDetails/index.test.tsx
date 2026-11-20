import { faker } from '@faker-js/faker'
import type { TokenInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { swapOrderFixtures, stakingFixtures, type RecordedTransaction } from '@safe-global/test/msw/fixtures'
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

const renderTransaction = (tx: Transaction) => render(<QueueTxDetails.Summary tx={tx} />)

const fixtureTransaction = (recorded: RecordedTransaction) => recorded.item.transaction as unknown as Transaction

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

describe('QueueTxDetails.Summary of other transaction types', () => {
  it('shows the NFT with its symbol and token id', () => {
    renderSummary({
      type: 'Transfer',
      direction: 'INCOMING',
      sender: { value: address() },
      recipient: { value: address() },
      transferInfo: {
        type: 'ERC721',
        tokenAddress: address(),
        tokenId: '42',
        tokenName: 'Bored Ape',
        tokenSymbol: 'BAYC',
        logoUri: null,
      },
    })

    expect(screen.getByText(/BAYC #42/)).toBeInTheDocument()
  })

  it('counts the actions of a batch', () => {
    renderSummary({
      type: 'Custom',
      to: { value: address() },
      methodName: 'multiSend',
      actionCount: 3,
      dataSize: '512',
      isCancellation: false,
      value: '0',
    })

    expect(screen.getByText('3 actions')).toBeInTheDocument()
  })

  it('shows the amount sold and the token bought of a CoW buy order', () => {
    renderTransaction(fixtureTransaction(swapOrderFixtures.buy2actions))

    expect(screen.getByText('COW')).toBeInTheDocument()
    expect(screen.getByText(/1 GNO/)).toBeInTheDocument()
  })

  it('shows the amount sold and the token bought of a CoW limit order', () => {
    renderTransaction(fixtureTransaction(swapOrderFixtures.partiallyFilledLimit))

    expect(screen.getByText(/3 WETH/)).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
  })

  it('shows the amount sold and the token bought of a TWAP order', () => {
    renderTransaction(fixtureTransaction(swapOrderFixtures.twapPartial))

    expect(screen.getByText(/DAI/)).toBeInTheDocument()
    expect(screen.getByText('WETH')).toBeInTheDocument()
  })

  it('shows the amount staked by a deposit', () => {
    renderTransaction(fixtureTransaction(stakingFixtures.stake))

    expect(screen.getByText(/32\s+ETH/)).toBeInTheDocument()
  })

  it('shows the amount claimed by a staking withdrawal', () => {
    renderSummary({
      type: 'NativeStakingWithdraw',
      value: '2000000000000000000',
      tokenInfo: token('ETH'),
      validators: [],
    })

    expect(screen.getByText(/2 ETH/)).toBeInTheDocument()
  })

  it('names a transaction sent through a Safe App after the app, with its logo', () => {
    const logoUri = `https://cdn.example.com/${faker.string.alphanumeric(8)}.png`
    const tx = {
      id: '1',
      timestamp: 0,
      txStatus: 'AWAITING_CONFIRMATIONS',
      txInfo: { type: 'Custom', to: { value: address() }, methodName: 'execute', dataSize: '0', isCancellation: false },
      safeAppInfo: { name: 'Swap widget', url: 'https://apps.example.com', logoUri },
    } as unknown as Transaction

    const { container } = render(<QueueTxDetails.Type tx={tx} />)

    expect(screen.getByText('Swap widget')).toBeInTheDocument()
    expect(container.querySelector(`img[src="${logoUri}"]`)).toBeInTheDocument()
  })
})
