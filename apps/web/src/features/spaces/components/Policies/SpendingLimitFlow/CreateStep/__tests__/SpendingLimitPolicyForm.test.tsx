import { useFormContext } from 'react-hook-form'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import useSpendingLimitTokenOptions from '../../hooks/useSpendingLimitTokenOptions'
import { tokenOptionBuilder } from '../../utils/tokenOptions.fixtures'
import { buildSafeAccountId } from '../../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../../SafeAccountSelector/types'
import { SAFE_ACCOUNT_SELECTOR_LABEL } from '../../../SafeAccountSelector/constants'
import { ADD_SPENDER_LABEL, CALLOUT_DISMISS_LABEL, CALLOUT_TITLE, NEXT_LABEL } from '../../constants'
import { createDefaultFormValues, createEmptySpender } from '../../types'
import SpendingLimitPolicyForm, { type SpendingLimitPolicyFormProps } from '../SpendingLimitPolicyForm'

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SPENDER = '0x1234567890123456789012345678901234567890'
const SPENDER_B = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

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
]

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

jest.mock('@/components/common/AddressBookInput', () => {
  const MockAddressBookInput = ({
    name,
    validate,
    deps,
    'data-testid': testId,
  }: {
    name: string
    validate?: (value: string) => string | undefined
    deps?: string[]
    'data-testid'?: string
  }) => {
    const { register } = useFormContext()
    return <input data-testid={testId} {...register(name, { required: true, validate, deps })} />
  }
  return { __esModule: true, default: MockAddressBookInput }
})

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

const treasury: SafeAccountOption = {
  id: buildSafeAccountId('1', SAFE_A),
  chainId: '1',
  address: SAFE_A,
  name: 'Treasury',
  threshold: 2,
  owners: 3,
  eligibility: 'signer',
  chain: { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
}

const notActivated: SafeAccountOption = {
  ...treasury,
  id: buildSafeAccountId('137', SAFE_A),
  chainId: '137',
  ineligibleReason: 'not-activated',
}

const renderForm = (props: Partial<SpendingLimitPolicyFormProps> = {}) => {
  const onSubmit = jest.fn()
  const onSafeChange = jest.fn()
  const onSpendersChange = jest.fn()
  const buildUi = (override: Partial<SpendingLimitPolicyFormProps> = {}) => (
    <SpendingLimitPolicyForm
      defaultValues={createDefaultFormValues()}
      onSubmit={onSubmit}
      accounts={[treasury]}
      isAccountsLoading={false}
      isAccountsError={false}
      onRetryAccounts={jest.fn()}
      isCalloutDismissed={false}
      onDismissCallout={jest.fn()}
      hasWallet
      onSafeChange={onSafeChange}
      onSpendersChange={onSpendersChange}
      {...props}
      {...override}
    />
  )
  return { ...renderWithUserEvent(buildUi()), buildUi, onSubmit, onSafeChange, onSpendersChange }
}

// The mocked TokenSelector is a <select>, so it also answers to role combobox and role option — hence
// the Safe selector is found by its label and its rows by `safe-account-option` rather than by role.
const pickSafe = async (user: ReturnType<typeof renderForm>['user']) => {
  const trigger = screen.getByLabelText(SAFE_ACCOUNT_SELECTOR_LABEL)
  await user.click(trigger)
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
  await user.click(await screen.findByTestId('safe-account-option'))
}

const fillFirstSpender = async (user: ReturnType<typeof renderForm>['user']) => {
  await user.type(screen.getAllByTestId('spender-address-input')[0], SPENDER)
  await user.selectOptions(screen.getAllByTestId('limit-token-selector')[0], ZERO_ADDRESS)
  await user.type(screen.getAllByTestId('limit-amount-input')[0], '1')
}

describe('SpendingLimitPolicyForm', () => {
  beforeEach(() => {
    mockUseOptions.mockReturnValue({
      options: mockTokens,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isPopularLoading: false,
      isPopularError: false,
      refetchPopular: jest.fn(),
      identityKey: `1:${SAFE_A}`,
    })
  })

  it('renders the callout, the Safe selector, one spender card and a disabled Next', () => {
    renderForm()

    expect(screen.getByText(CALLOUT_TITLE)).toBeInTheDocument()
    expect(screen.getByLabelText(SAFE_ACCOUNT_SELECTOR_LABEL)).toBeInTheDocument()
    expect(screen.getAllByTestId('spender-card')).toHaveLength(1)
    expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeDisabled()
  })

  it('enables Next once a Safe, a spender and one complete limit row are valid, and submits the policy', async () => {
    const { user, onSubmit, onSafeChange } = renderForm()

    await pickSafe(user)
    expect(onSafeChange).toHaveBeenCalledWith('1', SAFE_A)
    await fillFirstSpender(user)

    const next = screen.getByRole('button', { name: NEXT_LABEL })
    await waitFor(() => expect(next).toBeEnabled())
    await user.click(next)

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          safe: `1:${SAFE_A}`,
          spenders: [{ address: SPENDER, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '0' }] }],
        },
        expect.anything(),
      ),
    )
  })

  it('keeps Next disabled when the prefilled Safe is not activated', async () => {
    const { user } = renderForm({
      accounts: [treasury, notActivated],
      defaultValues: { ...createDefaultFormValues(), safe: notActivated.id },
    })

    await fillFirstSpender(user)

    await waitFor(() => expect(screen.getAllByTestId('limit-amount-input')[0]).toHaveValue('1'))
    expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeDisabled()
  })

  it('keeps Next disabled when the prefilled Safe is missing from the resolved accounts', async () => {
    const { user } = renderForm({
      accounts: [treasury],
      defaultValues: { ...createDefaultFormValues(), safe: notActivated.id },
    })

    await fillFirstSpender(user)

    await waitFor(() => expect(screen.getAllByTestId('limit-amount-input')[0]).toHaveValue('1'))
    expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeDisabled()
  })

  it('enables Next when the prefilled Safe is activated', async () => {
    const { user } = renderForm({
      accounts: [treasury, notActivated],
      defaultValues: { ...createDefaultFormValues(), safe: treasury.id },
    })

    await fillFirstSpender(user)

    await waitFor(() => expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeEnabled())
  })

  it('keeps Next disabled while a second spender is incomplete', async () => {
    const { user } = renderForm()

    await pickSafe(user)
    await fillFirstSpender(user)
    await user.click(screen.getByRole('button', { name: ADD_SPENDER_LABEL }))

    expect(screen.getAllByTestId('spender-card')).toHaveLength(2)
    await waitFor(() => expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeDisabled())
  })

  it('removes a spender and keeps the remaining one valid, enabling Next', async () => {
    const { user } = renderForm({
      defaultValues: {
        safe: `1:${SAFE_A}`,
        spenders: [
          { address: SPENDER, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '0' }] },
          { address: SPENDER_B, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '0' }] },
        ],
      },
    })

    await user.click(screen.getAllByTestId('remove-spender-btn')[0])

    expect(screen.getAllByTestId('spender-card')).toHaveLength(1)
    expect(screen.getByTestId('spender-address-input')).toHaveValue(SPENDER_B)
    expect(screen.getByTestId('limit-amount-input')).toHaveValue('1')
    await waitFor(() => expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeEnabled())
  })

  it('reports the spender addresses for the poisoning check', async () => {
    const { user, onSpendersChange } = renderForm()

    await user.type(screen.getAllByTestId('spender-address-input')[0], SPENDER)

    await waitFor(() => expect(onSpendersChange).toHaveBeenLastCalledWith([SPENDER]))
  })

  it('starts the policy over when the scoped Safe changes, keeping only the new Safe', async () => {
    const { rerender, buildUi } = renderForm({
      scopeKey: `1:${SAFE_A}`,
      defaultValues: {
        safe: `1:${SAFE_A}`,
        spenders: [
          { address: SPENDER, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '10080' }] },
          { address: SPENDER_B, limits: [{ tokenAddress: USDC, amount: '2', resetTime: '0' }] },
        ],
      },
    })

    rerender(buildUi({ scopeKey: `137:${SAFE_A}` }))

    await waitFor(() => expect(screen.getAllByTestId('spender-card')).toHaveLength(1))
    expect(screen.getByTestId('spender-address-input')).toHaveValue('')
    expect(screen.getByTestId('limit-token-selector')).toHaveValue('')
    expect(screen.getByTestId('limit-amount-input')).toHaveValue('')
    expect(screen.getByTestId('frequency-select')).toHaveTextContent('One time')
    expect(screen.getByLabelText(SAFE_ACCOUNT_SELECTOR_LABEL)).toHaveTextContent('Treasury')
    await waitFor(() => expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeDisabled())
  })

  it('does not clear anything on the first Safe selection', async () => {
    const { user, rerender, buildUi } = renderForm({
      scopeKey: undefined,
      defaultValues: { safe: '', spenders: [createEmptySpender()] },
    })

    await fillFirstSpender(user)
    rerender(buildUi({ scopeKey: `1:${SAFE_A}` }))

    expect(screen.getAllByTestId('limit-token-selector')[0]).toHaveValue(ZERO_ADDRESS)
  })

  // The dismissal is owned above `TxFlow` so it survives a trip to Review and back, which means the
  // form reports the click rather than hiding the callout itself.
  it('hands the callout dismissal to its owner', async () => {
    const onDismissCallout = jest.fn()
    const { user } = renderForm({ onDismissCallout })

    await user.click(screen.getByRole('button', { name: CALLOUT_DISMISS_LABEL }))

    expect(onDismissCallout).toHaveBeenCalled()
  })

  it('hides the callout once its owner says it was dismissed', () => {
    renderForm({ isCalloutDismissed: true })

    expect(screen.queryByText(CALLOUT_TITLE)).not.toBeInTheDocument()
  })
})
