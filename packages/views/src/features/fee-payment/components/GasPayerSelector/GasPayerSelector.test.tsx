import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FeePayerView } from '@safe-global/views/features/fee-payment/types'
import GasPayerSelector, { type GasPayerSelectorProps } from './index'

const ZERO = '0x0000000000000000000000000000000000000000'
const ETH = { address: ZERO, symbol: 'ETH', logoUri: '' }

const view = (overrides: Partial<FeePayerView> = {}): FeePayerView => ({
  payer: { kind: 'choice', value: 'WALLET', options: ['PAY_FROM_SAFE', 'WALLET'] },
  gasToken: { tokens: [ETH], selected: ZERO, locked: true },
  executionFee: {},
  gasFee: { amount: '0.0004', currency: 'ETH', fiatAmount: '$1.46' },
  sponsored: false,
  sponsorKind: 'plan',
  footer: { kind: 'none' },
  ...overrides,
})

const renderCard = (props: Partial<GasPayerSelectorProps> = {}) => {
  const onChoiceChange = jest.fn()
  render(
    <GasPayerSelector
      view={view()}
      onChoiceChange={onChoiceChange}
      currency="usd"
      renderTokenIcon={({ symbol }) => <span data-testid="token-icon">{symbol}</span>}
      footer={null}
      {...props}
    />,
  )
  return { onChoiceChange }
}

describe('GasPayerSelector view', () => {
  it('lets the signer switch to Safe account from the dropdown', async () => {
    const { onChoiceChange } = renderCard()

    expect(screen.getByTestId('fee-payer-selector')).toHaveTextContent('Signer wallet')
    await userEvent.click(screen.getByTestId('fee-payer-selector'))
    await userEvent.click(await screen.findByTestId('fee-payer-safe'))

    expect(onChoiceChange).toHaveBeenCalledWith('PAY_FROM_SAFE')
  })

  it('shows a locked payer with the reason it is locked', async () => {
    renderCard({
      view: view({
        payer: { kind: 'locked', value: 'WALLET', reason: 'FIRST_SIGNER_PICKS' },
      }),
    })

    expect(screen.queryByTestId('fee-payer-selector')).not.toBeInTheDocument()
    await userEvent.hover(screen.getByTestId('fee-payer-locked'))

    expect(await screen.findByText('Whoever signs first picks who pays the gas fee.')).toBeInTheDocument()
  })

  it.each([
    ['SET_AT_SIGNING', "Set at signing and can't be changed."],
    ['SPONSORED', 'Covered by your sponsored transactions.'],
    ['NATIVE_ONLY', 'Fees are paid in ETH for now. More tokens are coming soon.'],
    [undefined, 'Fees will be paid from the connected signer wallet when executing this transaction.'],
  ] as const)('explains a fee token locked for %s', (lockedReason, text) => {
    renderCard({ view: view({ gasToken: { tokens: [ETH], selected: ZERO, locked: true, lockedReason } }) })

    expect(screen.getByLabelText(text)).toBeInTheDocument()
  })

  it('labels a sponsor as "Free transaction" when the chain sponsors it', () => {
    renderCard({
      view: view({
        payer: { kind: 'choice', value: 'SPONSORED', options: ['SPONSORED', 'WALLET'] },
        sponsored: true,
        sponsorKind: 'free',
      }),
    })

    expect(screen.getByTestId('fee-payer-selector')).toHaveTextContent('Free transaction')
    expect(screen.queryByRole('img', { name: 'Safe Pro' })).not.toBeInTheDocument()
  })

  it('strikes the gas fee through with the Pro chip when the plan pays it', () => {
    renderCard({
      view: view({
        payer: { kind: 'choice', value: 'SPONSORED', options: ['SPONSORED', 'WALLET'] },
        sponsored: true,
      }),
    })

    expect(screen.getByText('0.0004 ETH')).toHaveClass('line-through')
    expect(screen.getByRole('img', { name: 'Safe Pro' })).toBeInTheDocument()
  })

  it.each([
    ['a loading fee', { loading: true }, 'Cannot estimate', false],
    ['a failed quote', { error: true }, 'Cannot estimate', true],
    ['a fee settled at execution', { note: 'Calculated at execution' }, 'Calculated at execution', true],
  ])('renders %s', (_, gasFee, text, shown) => {
    renderCard({ view: view({ gasFee }) })

    expect(screen.queryByText(text) !== null).toBe(shown)
  })

  it('renders the footer slot only when there is one', () => {
    renderCard({ footer: <span>Strip</span> })
    expect(screen.getByText('Strip')).toBeInTheDocument()
  })

  it('renders the total outgoing with the fee line', () => {
    renderCard({
      view: view({
        totalOutgoing: {
          primary: [{ amount: '0.5', currency: 'ETH' }],
          fees: { amount: '3.50', currency: 'USDC' },
          fiatTotal: '$1,068.00',
        },
      }),
    })

    expect(screen.getByText('Total outgoing')).toBeInTheDocument()
    expect(screen.getByText('3.50 USDC')).toBeInTheDocument()
    expect(screen.getByText('$1,068.00')).toBeInTheDocument()
  })

  it.each([
    [false, true],
    [true, false],
    [undefined, false],
  ])('shows the insufficient balance warning when safeHasEnoughGas is %s: %s', (safeHasEnoughGas, shown) => {
    renderCard({ view: view({ safeHasEnoughGas }) })

    expect(screen.queryByText(/Insufficient ETH balance/) !== null).toBe(shown)
  })

  it('hides the insufficient balance warning while the fee loads', () => {
    renderCard({ view: view({ safeHasEnoughGas: false, gasFee: { loading: true } }) })

    expect(screen.queryByText(/Insufficient/)).not.toBeInTheDocument()
  })

  it('renders the token through the app-provided icon', () => {
    renderCard()

    expect(screen.getByTestId('token-icon')).toHaveTextContent('ETH')
  })
})
