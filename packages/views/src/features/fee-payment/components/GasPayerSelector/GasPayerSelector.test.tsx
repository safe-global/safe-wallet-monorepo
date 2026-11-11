import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FeePayerView, GasFeeDetails } from '@safe-global/views/features/fee-payment/types'
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

describe('GasPayerSelector gas fee details', () => {
  type EditDetails = Extract<GasFeeDetails, { mode: 'edit' }>
  const editDetails = (overrides: Partial<EditDetails> = {}): EditDetails => ({
    mode: 'edit',
    open: false,
    onOpenChange: jest.fn(),
    fields: [
      { name: 'userNonce', value: '12' },
      { name: 'gasLimit', value: '79262' },
      { name: 'maxPriorityFeePerGas', value: '0.05' },
      { name: 'maxFeePerGas', value: '1.82' },
    ],
    onFieldChange: jest.fn(),
    canSave: true,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  })

  it('renders a static Gas fee row without details', () => {
    renderCard()

    expect(screen.getByTestId('gas-fee-row')).toBeInTheDocument()
    expect(screen.queryByTestId('gas-fee-details-toggle')).not.toBeInTheDocument()
  })

  it('opens the editor from the Edit pill of the Gas fee row', async () => {
    const details = editDetails()
    renderCard({ gasFeeDetails: details })

    expect(screen.getByTestId('gas-fee-edit-button')).toHaveTextContent('Edit')
    await userEvent.click(screen.getByTestId('gas-fee-details-toggle'))

    expect(details.onOpenChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('edits, resets and saves the gas settings', async () => {
    const details = editDetails({ open: true, onReset: jest.fn() })
    renderCard({ gasFeeDetails: details })

    expect(screen.getByLabelText('Max fee (Gwei)')).toHaveValue('1.82')
    await userEvent.type(screen.getByLabelText('Gas limit'), '1')
    expect(details.onFieldChange).toHaveBeenLastCalledWith('gasLimit', '792621')

    await userEvent.click(screen.getByTestId('gas-params-reset'))
    await userEvent.click(screen.getByTestId('gas-params-save'))
    await userEvent.click(screen.getByTestId('gas-params-cancel'))

    expect(details.onReset).toHaveBeenCalled()
    expect(details.onSave).toHaveBeenCalled()
    expect(details.onCancel).toHaveBeenCalled()
  })

  it('saves on Enter instead of submitting the surrounding form', async () => {
    const details = editDetails({ open: true })
    const onSubmit = jest.fn((e: { preventDefault: () => void }) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <GasPayerSelector
          view={view()}
          onChoiceChange={jest.fn()}
          currency="usd"
          renderTokenIcon={() => null}
          footer={null}
          gasFeeDetails={details}
        />
      </form>,
    )

    await userEvent.type(screen.getByLabelText('Gas limit'), '{Enter}')
    await userEvent.click(screen.getByTestId('gas-params-cancel'))

    expect(details.onSave).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('explains why a value is wrong and blocks saving', () => {
    renderCard({
      gasFeeDetails: editDetails({
        open: true,
        canSave: false,
        fields: [{ name: 'gasLimit', value: '', error: 'REQUIRED' }],
      }),
    })

    expect(screen.getByText('Enter a gas limit to continue')).toBeInTheDocument()
    expect(screen.getByTestId('gas-params-save')).toBeDisabled()
  })

  it('shows read-only details with the reason they cannot be changed', () => {
    renderCard({
      gasFeeDetails: {
        mode: 'view',
        open: true,
        onOpenChange: jest.fn(),
        rows: [{ name: 'gasLimit', value: '112400' }, { name: 'gasPrice', value: '1.9' }, { name: 'refundReceiver' }],
        reason: 'PAID_FROM_SAFE',
      },
    })

    const summary = screen.getByTestId('gas-params-summary')
    expect(summary).toHaveTextContent('Gas limit112400')
    expect(summary).toHaveTextContent('Gas price (Gwei)1.9')
    expect(summary).toHaveTextContent('Refund toSafe relayer')
    expect(summary).toHaveTextContent("Paid from the Safe, so it can't be edited.")
    expect(screen.queryByTestId('gas-params-editor')).not.toBeInTheDocument()
  })
})
