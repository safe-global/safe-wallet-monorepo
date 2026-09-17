import { FormProvider, useForm } from 'react-hook-form'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { NO_TOKEN_SELECTED_ERROR } from '@/features/spending-limits/services'
import useSpendingLimitTokenOptions from '../../hooks/useSpendingLimitTokenOptions'
import { tokenOptionBuilder } from '../../utils/testBuilders'
import {
  DUPLICATE_TOKEN_ERROR,
  ONE_TIME_HELPER_TEXT,
  PRICE_UNAVAILABLE_TEXT,
  REMOVE_LIMIT_LABEL,
} from '../../constants'
import { createEmptyLimit, type LimitFormValues, type SpendingLimitPolicyFormValues } from '../../types'
import TokenLimitCard from '../TokenLimitCard'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

const mockTokens = [
  tokenOptionBuilder()
    .with({
      address: ZERO_ADDRESS,
      symbol: 'ETH',
      name: 'Ether',
      group: 'held',
      balance: '1000000000000000000',
      fiatBalance: '2000',
      fiatConversion: '2000',
    })
    .build(),
  tokenOptionBuilder()
    .with({
      address: USDC,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      group: 'held',
      balance: '0',
      fiatBalance: '0',
      fiatConversion: '1',
    })
    .build(),
  // Popular-only: no balance and no price, so the row falls back to "Price unavailable".
  tokenOptionBuilder().with({ address: DAI, symbol: 'DAI', name: 'Dai Stablecoin' }).build(),
]

// A plain <select> keeps these tests about the row. It still renders `helperText`, since that slot is
// where the row's balance and token error reach the user.
jest.mock('../../TokenSelector', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    excludeAddresses = [],
    helperText,
    'data-testid': testId = 'limit-token-selector',
  }: {
    value?: string
    onChange: (next: string | undefined) => void
    excludeAddresses?: string[]
    helperText?: React.ReactNode
    'data-testid'?: string
  }) => (
    <div>
      <select data-testid={testId} value={value ?? ''} onChange={(event) => onChange(event.target.value || undefined)}>
        <option value="">none</option>
        {mockTokens
          .filter((token) => !excludeAddresses.includes(token.address))
          .map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
      </select>
      {helperText}
    </div>
  ),
}))

jest.mock('../../hooks/useSpendingLimitTokenOptions', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))

const mockUseOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>

const Harness = ({ limits, onRemove = jest.fn() }: { limits: LimitFormValues[]; onRemove?: () => void }) => {
  const methods = useForm<SpendingLimitPolicyFormValues>({
    mode: 'onChange',
    defaultValues: { safe: `1:${ZERO_ADDRESS}`, spenders: [{ address: '', limits }] },
  })
  return (
    <FormProvider {...methods}>
      {limits.map((_, index) => (
        <TokenLimitCard
          key={index}
          spenderIndex={0}
          limitIndex={index}
          limitCount={limits.length}
          removable={limits.length > 1}
          onRemove={onRemove}
        />
      ))}
      <button type="button" onClick={() => methods.trigger()}>
        validate
      </button>
    </FormProvider>
  )
}

const renderRows = (limits: LimitFormValues[] = [createEmptyLimit()], onRemove?: () => void) =>
  renderWithUserEvent(<Harness limits={limits} onRemove={onRemove} />)

describe('TokenLimitCard', () => {
  beforeEach(() => {
    mockUseOptions.mockReturnValue({
      options: mockTokens,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isPopularLoading: false,
      isPopularError: false,
      refetchPopular: jest.fn(),
      identityKey: `1:${ZERO_ADDRESS}`,
    })
  })

  it("shows the Safe's balance of the selected token under the token field", async () => {
    const { user } = renderRows()

    await user.selectOptions(screen.getByTestId('limit-token-selector'), ZERO_ADDRESS)

    expect(screen.getByTestId('token-balance')).toHaveTextContent('1 ETH')
  })

  it('shows a zero balance for a held token the Safe has spent down', async () => {
    const { user } = renderRows()

    await user.selectOptions(screen.getByTestId('limit-token-selector'), USDC)

    expect(screen.getByTestId('token-balance')).toHaveTextContent('0 USDC')
  })

  it('shows the fiat equivalent of the entered amount', async () => {
    const { user } = renderRows()

    await user.selectOptions(screen.getByTestId('limit-token-selector'), ZERO_ADDRESS)
    await user.type(screen.getByTestId('limit-amount-input'), '2')

    expect(screen.getByTestId('amount-fiat')).toHaveTextContent(/4[,.]000/)
  })

  it('says so when the selected token has no price', async () => {
    const { user } = renderRows()

    await user.selectOptions(screen.getByTestId('limit-token-selector'), DAI)

    expect(screen.getByTestId('amount-fiat')).toHaveTextContent(PRICE_UNAVAILABLE_TEXT)
  })

  it('asks for a token before it judges the amount', async () => {
    const { user } = renderRows()

    await user.type(screen.getByTestId('limit-amount-input'), '1')

    expect(await screen.findByText(NO_TOKEN_SELECTED_ERROR)).toBeInTheDocument()
  })

  it('shows the token error when validation runs with no token selected', async () => {
    const { user } = renderRows()

    await user.click(screen.getByRole('button', { name: 'validate' }))

    expect(await screen.findByTestId('token-error')).toHaveTextContent(NO_TOKEN_SELECTED_ERROR)
  })

  it('shows an amount error when validation runs with no amount typed', async () => {
    const { user } = renderRows([{ ...createEmptyLimit(), tokenAddress: ZERO_ADDRESS, amount: '' }])

    await user.click(screen.getByRole('button', { name: 'validate' }))

    expect(await screen.findByText('The value must be a number')).toBeInTheDocument()
    expect(screen.getByTestId('limit-amount-input')).toHaveAttribute('aria-invalid', 'true')
  })

  it('explains when the limit resets and follows the selected frequency', async () => {
    const { user } = renderRows()

    expect(screen.getByTestId('frequency-helper')).toHaveTextContent(ONE_TIME_HELPER_TEXT)

    const trigger = screen.getByTestId('frequency-select')
    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await user.click(await screen.findByRole('option', { name: '1 day' }))

    expect(screen.getByTestId('frequency-helper')).toHaveTextContent('Limit resets every day')
  })

  it('hides tokens already used by sibling rows of the same spender', () => {
    renderRows([createEmptyLimit(), { ...createEmptyLimit(), tokenAddress: ZERO_ADDRESS }])

    const [firstRow] = screen.getAllByTestId('limit-token-selector')
    expect(firstRow.querySelector(`option[value="${ZERO_ADDRESS}"]`)).toBeNull()
  })

  it('rejects the same token twice within one spender even when it slipped through', async () => {
    const { user } = renderRows([
      { ...createEmptyLimit(), tokenAddress: USDC, amount: '1' },
      { ...createEmptyLimit(), tokenAddress: USDC, amount: '2' },
    ])

    await user.click(screen.getByRole('button', { name: 'validate' }))

    expect(await screen.findAllByText(DUPLICATE_TOKEN_ERROR)).not.toHaveLength(0)
  })

  it('offers to remove the row only when the spender has more than one', async () => {
    const onRemove = jest.fn()
    const { user, unmount } = renderRows([createEmptyLimit(), createEmptyLimit()], onRemove)

    await user.click(screen.getAllByRole('button', { name: REMOVE_LIMIT_LABEL })[0])
    expect(onRemove).toHaveBeenCalled()

    unmount()
    renderRows([createEmptyLimit()])
    expect(screen.queryByRole('button', { name: REMOVE_LIMIT_LABEL })).not.toBeInTheDocument()
  })
})
