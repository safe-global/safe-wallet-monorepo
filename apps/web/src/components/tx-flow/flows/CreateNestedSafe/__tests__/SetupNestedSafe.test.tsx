import { render, screen, waitFor, within } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { TokenType } from '@safe-global/store/gateway/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SetUpNestedSafe, type SetupNestedSafeForm } from '../SetupNestedSafe'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const mockBalances: Balances['items'] = [
  {
    // Deliberately not a round number: '1.23456' can only come from formatting this balance, so the
    // Max test cannot pass against a hardcoded value.
    balance: '1234560000000000000',
    tokenInfo: {
      address: ZERO_ADDRESS,
      decimals: 18,
      logoUri: '',
      name: 'Ether',
      symbol: 'ETH',
      type: TokenType.NATIVE_TOKEN,
    },
    fiatBalance: '1000',
    fiatConversion: '1000',
  },
  {
    balance: '1000000000',
    tokenInfo: {
      address: USDC_ADDRESS,
      decimals: 6,
      logoUri: '',
      name: 'USD Coin',
      symbol: 'USDC',
      type: TokenType.ERC20,
    },
    fiatBalance: '1000',
    fiatConversion: '1',
  },
]

jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: () => ({
    balances: { items: mockBalances, fiatTotal: '2000' },
    loading: false,
  }),
}))

const renderSetup = (assets: SetupNestedSafeForm['assets'] = []) => {
  const data: SetupNestedSafeForm = { name: '', assets }

  const value: TxFlowContextType<SetupNestedSafeForm> = {
    ...initialContext,
    data,
    onNext: jest.fn(),
  }

  return render(
    <TxFlowContext.Provider value={value}>
      <SetUpNestedSafe />
    </TxFlowContext.Provider>,
  )
}

describe('SetUpNestedSafe', () => {
  it('renders the shared TokenAmountInput for a funded asset row', () => {
    renderSetup([{ tokenAddress: ZERO_ADDRESS, amount: '' }])

    // The shared field, not the previous hand-rolled one — this is what broke when the
    // borrowed CSS module classes were deleted.
    expect(screen.getByTestId('token-amount-field')).toBeInTheDocument()
    expect(screen.getByTestId('token-selector')).toBeInTheDocument()
    expect(screen.getByTestId('max-btn')).toBeInTheDocument()
  })

  it('keeps the field-array input name so the built transaction is unchanged', () => {
    renderSetup([{ tokenAddress: ZERO_ADDRESS, amount: '' }])

    expect(screen.getByTestId('token-amount-field')).toHaveAttribute('name', 'assets.0.amount')
  })

  it('renders the name field at the hero size, matching the amount field', () => {
    renderSetup([{ tokenAddress: ZERO_ADDRESS, amount: '' }])

    const nameInput = screen.getByTestId('nested-safe-name-input')
    expect(nameInput.closest('[data-slot="input-group"]')).toHaveAttribute('data-input-size', 'hero')
  })

  it('fills the full token balance when Max is clicked', async () => {
    renderSetup([{ tokenAddress: ZERO_ADDRESS, amount: '' }])

    await userEvent.click(screen.getByTestId('max-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('token-amount-field')).toHaveValue('1.23456')
    })
  })

  it('rejects an amount above the token balance', async () => {
    renderSetup([{ tokenAddress: ZERO_ADDRESS, amount: '' }])

    await userEvent.type(screen.getByTestId('token-amount-field'), '2')

    // The number matters: it proves this row's own decimals and balance reached the validator.
    await waitFor(() => {
      expect(screen.getByText('Maximum value is 1.23456')).toBeInTheDocument()
    })
  })

  it('clears a prefilled amount when the row switches token', async () => {
    // Back-navigation from the review step re-seeds defaultValues with the row as submitted, so a
    // token change must not restore that old figure against the newly chosen token.
    renderSetup([{ tokenAddress: ZERO_ADDRESS, amount: '0.5' }])

    expect(screen.getByTestId('token-amount-field')).toHaveValue('0.5')

    await userEvent.click(within(screen.getByTestId('token-selector')).getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: /USD Coin/ }))

    await waitFor(() => {
      expect(screen.getByTestId('token-amount-field')).toHaveValue('')
    })
  })

  it('keeps the amount when the row re-picks the token it already has', async () => {
    // Opening the dropdown and confirming the same token is a no-op, so a typed amount must survive it.
    renderSetup([{ tokenAddress: ZERO_ADDRESS, amount: '0.5' }])

    await userEvent.click(within(screen.getByTestId('token-selector')).getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: /Ether/ }))

    await waitFor(() => {
      expect(screen.getByTestId('token-amount-field')).toHaveValue('0.5')
    })
  })

  it('renders one field per asset row', () => {
    renderSetup([
      { tokenAddress: ZERO_ADDRESS, amount: '' },
      { tokenAddress: USDC_ADDRESS, amount: '' },
    ])

    expect(screen.getAllByTestId('asset-data')).toHaveLength(2)
    expect(screen.getAllByTestId('token-amount-field')).toHaveLength(2)
  })

  it('removes a row when its delete button is clicked', async () => {
    renderSetup([
      { tokenAddress: ZERO_ADDRESS, amount: '' },
      { tokenAddress: USDC_ADDRESS, amount: '' },
    ])

    await userEvent.click(screen.getAllByTestId('remove-asset-icon')[0])

    await waitFor(() => {
      expect(screen.getAllByTestId('asset-data')).toHaveLength(1)
    })
  })

  it('disables funding a new asset once every token is selected', () => {
    renderSetup([
      { tokenAddress: ZERO_ADDRESS, amount: '' },
      { tokenAddress: USDC_ADDRESS, amount: '' },
    ])

    expect(screen.getByTestId('fund-asset-button')).toBeDisabled()
  })
})
