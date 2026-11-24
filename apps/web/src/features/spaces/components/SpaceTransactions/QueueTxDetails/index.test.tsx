import { faker } from '@faker-js/faker'
import type { TokenInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import userEvent from '@testing-library/user-event'
import { multisigTransactionBuilder } from '@/tests/builders/queuedTransaction'
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

const renderSummary = (txInfo: object, executionInfo?: Transaction['executionInfo']) =>
  render(
    <QueueTxDetails.Summary
      tx={multisigTransactionBuilder()
        .with({ txInfo: txInfo as Transaction['txInfo'], executionInfo })
        .build()}
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

  it('explains an on-chain rejection on hover and links to the help article', async () => {
    renderSummary(
      { type: 'Custom', methodName: null, to: { value: address() }, dataSize: '0', isCancellation: true },
      { type: 'MULTISIG', nonce: 7, confirmationsRequired: 2, confirmationsSubmitted: 0 },
    )

    await userEvent.hover(screen.getByText('Cancels #7'))

    expect(await screen.findByText(/Rejects #7\. If this executes, nothing else at #7 can\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Learn more about on-chain rejections/ })).toHaveAttribute(
      'href',
      HelpCenterArticle.CANCELLING_TRANSACTIONS,
    )
  })
})

describe('QueueTxDetails.Summary tooltip', () => {
  const focusSummary = async () => {
    await userEvent.tab()
    expect(screen.getByTestId('queue-summary')).toHaveFocus()
  }
  const tooltip = () => document.querySelector('[data-slot="tooltip-content"]')

  it('repeats a summary with no hint in full, in bold', async () => {
    const { container } = renderSummary({ type: 'Custom', methodName: null, to: { value: address() }, dataSize: '68' })

    expect(container.querySelector('[title]')).toBeNull()
    await focusSummary()

    expect(await screen.findByText('Unknown method', { selector: '[data-slot="tooltip-content"] span' })).toHaveClass(
      'font-medium',
      'break-words',
    )
  })

  it('says how many actions a batch runs', async () => {
    renderSummary({ type: 'Custom', methodName: 'multiSend', actionCount: 3, to: { value: address() }, dataSize: '9' })
    await focusSummary()

    expect(await screen.findByText('3 actions in one transaction')).toBeInTheDocument()
  })

  it('names the order type of a swap', async () => {
    renderSummary({
      type: 'SwapOrder',
      kind: 'sell',
      orderClass: 'limit',
      sellAmount: '1000000',
      buyAmount: '1',
      sellToken: token('USDC', 6),
      buyToken: token('WETH'),
    })
    await focusSummary()

    expect(await screen.findByText('Limit order')).toBeInTheDocument()
  })

  it('shows the threshold before and after a threshold change', async () => {
    renderSummary(
      {
        type: 'SettingsChange',
        dataDecoded: { method: 'changeThreshold', parameters: [] },
        settingsInfo: { type: 'CHANGE_THRESHOLD', threshold: 3 },
      },
      { type: 'MULTISIG', nonce: 1, confirmationsRequired: 2, confirmationsSubmitted: 0 },
    )
    await focusSummary()

    expect(await screen.findByText('Threshold 2 → 3')).toBeInTheDocument()
    expect(tooltip()).toHaveClass('max-w-xs', 'whitespace-normal')
  })

  it('says a module change changes who controls funds', async () => {
    renderSummary({
      type: 'SettingsChange',
      dataDecoded: { method: 'enableModule', parameters: [] },
      settingsInfo: { type: 'ENABLE_MODULE', module: { value: address(), name: 'Allowance' } },
    })
    await focusSummary()

    expect(await screen.findByText('Changes who controls funds')).toBeInTheDocument()
  })
})

describe('QueueTxDetails.Summary tooltip on amounts', () => {
  const tooltips = () => document.querySelectorAll('[data-slot="tooltip-content"]')

  it('shows one tooltip, with the transfer amount as plain text', async () => {
    renderSummary({
      type: 'Transfer',
      direction: 'OUTGOING',
      sender: { value: address() },
      recipient: { value: address() },
      transferInfo: {
        type: 'ERC20',
        tokenAddress: address(),
        value: '250000000000',
        tokenSymbol: 'USDC',
        decimals: 6,
        logoUri: 'https://example.com/usdc.png',
      },
    })

    await userEvent.hover(screen.getByText(/250,000 USDC/))

    await screen.findByText('250,000 USDC', { selector: '[data-slot="tooltip-content"] span' })
    expect(tooltips()).toHaveLength(1)
    expect(tooltips()[0].querySelector('img, b')).toBeNull()
  })

  it('shows one tooltip, with the swap as plain text', async () => {
    renderSummary({
      type: 'SwapOrder',
      kind: 'sell',
      orderClass: 'market',
      sellAmount: '2000000000000000000',
      buyAmount: '6000000000',
      sellToken: { ...token('WETH'), logoUri: 'https://example.com/weth.png' },
      buyToken: token('USDC', 6),
    })

    await userEvent.hover(screen.getByText(/2 WETH/))

    await screen.findByText('2 WETH → USDC', { selector: '[data-slot="tooltip-content"] span' })
    expect(tooltips()).toHaveLength(1)
    expect(tooltips()[0].querySelector('img, b')).toBeNull()
    expect(screen.getByText('Market order')).toBeInTheDocument()
  })
})
