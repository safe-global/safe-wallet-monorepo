import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import SafeAccountSelector, { type SafeAccountSelectorProps } from '..'
import {
  ELIGIBILITY_HELPER_TEXT,
  ELIGIBILITY_RULE,
  LOAD_ERROR_TEXT,
  NO_ELIGIBLE_ACCOUNTS_TEXT,
  NO_WALLET_TEXT,
  SAFE_ACCOUNT_SELECTOR_LABEL,
  SAFE_ACCOUNT_SELECTOR_PLACEHOLDER,
} from '../constants'
import { buildSafeAccountId } from '../utils'
import type { SafeAccountEntry, SafeAccountGroup, SafeAccountOption } from '../types'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SAFE_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'

const CHAIN_NAMES: Record<string, string> = { '1': 'Chain 1', '137': 'Chain 137', '11155111': 'Chain 11155111' }

const option = (chainId: string, address: string, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  eligibility: 'signer',
  threshold: 3,
  owners: 5,
  chain: { chainId, chainName: CHAIN_NAMES[chainId], chainLogoUri: null, shortName: chainId },
  ...extra,
})

const singleChainAccount = option('1', SAFE_A, { name: 'Treasury' })

const multiChainGroup: SafeAccountGroup = {
  address: SAFE_B,
  name: 'Ops',
  accounts: [option('1', SAFE_B), option('137', SAFE_B), option('11155111', SAFE_B)],
  fiatTotal: '4200',
  threshold: 3,
  owners: 5,
}

const renderSelector = (props: Partial<Parameters<typeof SafeAccountSelector>[0]> = {}) =>
  renderWithUserEvent(
    <SafeAccountSelector accounts={[singleChainAccount, multiChainGroup]} onChange={jest.fn()} {...props} />,
  )

const openSelector = async (user: ReturnType<typeof renderSelector>['user']) => {
  await user.click(screen.getByRole('combobox'))
}

describe('SafeAccountSelector', () => {
  it('renders the default label and the eligibility helper text', () => {
    render(<SafeAccountSelector accounts={[singleChainAccount]} onChange={jest.fn()} />)

    expect(screen.getByLabelText(SAFE_ACCOUNT_SELECTOR_LABEL)).toBeInTheDocument()
    expect(screen.getByText(ELIGIBILITY_HELPER_TEXT)).toBeInTheDocument()
  })

  it('states the same eligibility rule in the helper text and the empty state', () => {
    expect(ELIGIBILITY_HELPER_TEXT).toContain(ELIGIBILITY_RULE)
    expect(NO_ELIGIBLE_ACCOUNTS_TEXT).toContain(ELIGIBILITY_RULE)
  })

  it('renders a custom label and helper text when provided', () => {
    render(
      <SafeAccountSelector
        accounts={[singleChainAccount]}
        onChange={jest.fn()}
        label="Apply to"
        helperText="Custom hint"
      />,
    )

    expect(screen.getByLabelText('Apply to')).toBeInTheDocument()
    expect(screen.getByText('Custom hint')).toBeInTheDocument()
  })

  it('renders one option per eligible chain and no option for the whole multi-chain Safe', async () => {
    const { user } = renderSelector()

    await openSelector(user)

    // 1 single-chain row + 3 chain rows of the group; the group header itself is not selectable.
    expect(await screen.findAllByRole('option')).toHaveLength(4)
  })

  it('renders the multi-chain group header as a non-selectable label', async () => {
    const { user } = renderSelector()

    await openSelector(user)

    const header = await screen.findByTestId('safe-account-group-header')
    expect(header).toHaveTextContent('Ops')
    expect(header).not.toHaveAttribute('role', 'option')
    expect(screen.queryAllByRole('option').map((el) => el.textContent)).not.toContainEqual(
      expect.stringContaining('Ops'),
    )
  })

  it('shows the name, the shortened address, the threshold and the chain on a single-chain row', async () => {
    const { user } = renderWithUserEvent(<SafeAccountSelector accounts={[singleChainAccount]} onChange={jest.fn()} />)

    await openSelector(user)

    const row = await screen.findByRole('option')
    expect(row).toHaveTextContent('Treasury')
    expect(row).toHaveTextContent('3/5')
    expect(row.querySelector('[data-testid="safe-account-address"]')).toHaveTextContent(shortenAddress(SAFE_A))
    expect(row.querySelector('[data-testid="chain-logo-img"]')).toBeInTheDocument()
  })

  it('labels each chain row of a group with its chain', async () => {
    const { user } = renderWithUserEvent(<SafeAccountSelector accounts={[multiChainGroup]} onChange={jest.fn()} />)

    await openSelector(user)

    const rows = await screen.findAllByRole('option')
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Chain 1'),
      expect.stringContaining('Chain 137'),
      expect.stringContaining('Chain 11155111'),
    ])
  })

  it('reports the picked `chainId:address` to onChange', async () => {
    const onChange = jest.fn()
    const { user } = renderWithUserEvent(<SafeAccountSelector accounts={[multiChainGroup]} onChange={onChange} />)

    await openSelector(user)
    const rows = await screen.findAllByRole('option')
    await user.click(rows[2])

    expect(onChange).toHaveBeenCalledWith(`11155111:${SAFE_B}`)
  })

  it('shows the selected account on the trigger', () => {
    render(
      <SafeAccountSelector
        accounts={[singleChainAccount, multiChainGroup]}
        value={singleChainAccount.id}
        onChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('Treasury')
  })

  it('falls back to the placeholder when the value matches no known account', () => {
    render(<SafeAccountSelector accounts={[singleChainAccount]} value={`1:${SAFE_B}`} onChange={jest.fn()} />)

    expect(screen.getByRole('combobox')).toHaveTextContent(SAFE_ACCOUNT_SELECTOR_PLACEHOLDER)
  })

  it('shows skeleton rows while loading instead of an empty state', async () => {
    const { user } = renderWithUserEvent(<SafeAccountSelector accounts={[]} onChange={jest.fn()} isLoading />)

    await openSelector(user)

    expect(await screen.findAllByTestId('safe-account-skeleton')).toHaveLength(3)
    expect(screen.queryByText(NO_ELIGIBLE_ACCOUNTS_TEXT)).not.toBeInTheDocument()
  })

  it('shows an avatar skeleton on the trigger while loading', () => {
    render(<SafeAccountSelector accounts={[]} onChange={jest.fn()} isLoading />)

    expect(
      screen.getByRole('combobox').querySelector('[data-testid="safe-account-avatar-skeleton"]'),
    ).toBeInTheDocument()
  })

  it('shapes every loading row like a real row, avatar circle included', async () => {
    const { user } = renderWithUserEvent(<SafeAccountSelector accounts={[]} onChange={jest.fn()} isLoading />)

    await openSelector(user)

    const rows = await screen.findAllByTestId('safe-account-skeleton')
    rows.forEach((row) => {
      expect(row.querySelector('[data-testid="safe-account-avatar-skeleton"]')).toBeInTheDocument()
    })
  })

  it('shows a retryable error instead of the list when loading failed', async () => {
    const onRetry = jest.fn()
    const { user } = renderWithUserEvent(
      <SafeAccountSelector accounts={[]} onChange={jest.fn()} isError onRetry={onRetry} />,
    )

    await openSelector(user)
    expect(await screen.findByText(LOAD_ERROR_TEXT)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(NO_ELIGIBLE_ACCOUNTS_TEXT)).not.toBeInTheDocument()
  })

  it('tones the load error as an error rather than neutral copy', async () => {
    const { user } = renderWithUserEvent(
      <SafeAccountSelector accounts={[]} onChange={jest.fn()} isError onRetry={jest.fn()} />,
    )

    await openSelector(user)

    expect(await screen.findByText(LOAD_ERROR_TEXT)).toHaveClass('text-destructive')
    expect(screen.getByTestId('safe-accounts-load-error').querySelector('svg')).toBeInTheDocument()
  })

  // The popup is already a card; an alert inside it reads as a card in a card.
  it('renders the error as popup content, not as a nested alert card', async () => {
    const { user } = renderWithUserEvent(
      <SafeAccountSelector accounts={[]} onChange={jest.fn()} isError onRetry={jest.fn()} />,
    )

    await openSelector(user)

    const popup = (await screen.findByText(LOAD_ERROR_TEXT)).closest('[data-slot="select-content"]')
    expect(popup?.querySelector('[data-slot="alert"]')).not.toBeInTheDocument()
  })

  it('explains the empty list rather than showing "no results"', async () => {
    const { user } = renderWithUserEvent(
      <SafeAccountSelector accounts={[]} onChange={jest.fn()} onSwitchWallet={jest.fn()} />,
    )

    await openSelector(user)

    expect(await screen.findByText(NO_ELIGIBLE_ACCOUNTS_TEXT)).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('shows an avatar placeholder next to the placeholder text while nothing is picked', () => {
    render(<SafeAccountSelector accounts={[singleChainAccount]} onChange={jest.fn()} />)

    expect(screen.getByTestId('safe-account-avatar-placeholder')).toBeInTheDocument()
  })

  it('drops the avatar placeholder once an account is picked', () => {
    render(<SafeAccountSelector accounts={[singleChainAccount]} value={singleChainAccount.id} onChange={jest.fn()} />)

    expect(screen.queryByTestId('safe-account-avatar-placeholder')).not.toBeInTheDocument()
  })

  it('shows each row’s fiat balance', async () => {
    const { user } = renderWithUserEvent(
      <SafeAccountSelector
        accounts={[option('1', SAFE_A, { name: 'Treasury', fiatTotal: '1234.56' })]}
        onChange={jest.fn()}
      />,
    )

    await openSelector(user)

    const row = await screen.findByRole('option')
    expect(row.querySelector('[data-testid="row-end-column"]')).toHaveTextContent('$')
  })

  it('shows the group’s total balance and every one of its chains on the header', async () => {
    const { user } = renderWithUserEvent(<SafeAccountSelector accounts={[multiChainGroup]} onChange={jest.fn()} />)

    await openSelector(user)

    const header = await screen.findByTestId('safe-account-group-header')
    expect(header.querySelector('[data-testid="row-end-column"]')).toHaveTextContent('$')
    expect(header.querySelectorAll('[data-testid="chain-logo-img"]')).toHaveLength(3)
  })

  // jsdom has no layout, so this pins the reservation itself: every trigger state must carry the
  // two-line identity height, or the field grows by 4px the moment an account is picked.
  const triggerStates: Array<[string, Omit<SafeAccountSelectorProps, 'onChange'>]> = [
    ['empty', { accounts: [singleChainAccount] }],
    ['filled', { accounts: [singleChainAccount], value: singleChainAccount.id }],
    ['loading', { accounts: [], isLoading: true }],
  ]

  it.each(triggerStates)('reserves the same trigger content height when %s', (_state, props) => {
    render(<SafeAccountSelector onChange={jest.fn()} {...props} />)

    expect(screen.getByRole('combobox').querySelector('.min-h-9')).toBeInTheDocument()
  })

  // The trigger's value wrapper computes to `flow-root`, so its `items-center` never reaches children:
  // the placeholder row has to fill the reserved height itself or its avatar rides 2px high.
  it('centres the placeholder avatar by filling the reserved trigger height', () => {
    render(<SafeAccountSelector accounts={[singleChainAccount]} onChange={jest.fn()} />)

    expect(screen.getByTestId('safe-account-avatar-placeholder').parentElement).toHaveClass('min-h-9')
  })

  it('submits under the given name', () => {
    const { container } = render(
      <SafeAccountSelector accounts={[singleChainAccount]} name="safeAccount" onChange={jest.fn()} />,
    )

    expect(container.querySelector('input[name="safeAccount"]')).toBeInTheDocument()
  })

  it('asks a disconnected visitor to connect rather than blaming their wallet', async () => {
    const { user } = renderWithUserEvent(
      <SafeAccountSelector accounts={[]} hasWallet={false} onChange={jest.fn()} onSwitchWallet={jest.fn()} />,
    )

    await openSelector(user)

    expect(await screen.findByText(NO_WALLET_TEXT)).toBeInTheDocument()
    expect(screen.queryByText(NO_ELIGIBLE_ACCOUNTS_TEXT)).not.toBeInTheDocument()
  })

  it('does not open when disabled', async () => {
    const { user } = renderSelector({ disabled: true })

    await openSelector(user)

    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('replaces the helper text with the form validation message', () => {
    render(
      <SafeAccountSelector
        accounts={[singleChainAccount]}
        onChange={jest.fn()}
        errorMessage="Pick an account to continue"
      />,
    )

    expect(screen.getByText('Pick an account to continue')).toBeInTheDocument()
    expect(screen.queryByText(ELIGIBILITY_HELPER_TEXT)).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('accepts a plain option list with no groups', async () => {
    const accounts: SafeAccountEntry[] = [option('1', SAFE_A), option('137', SAFE_B)]
    const { user } = renderWithUserEvent(<SafeAccountSelector accounts={accounts} onChange={jest.fn()} />)

    await openSelector(user)

    expect(await screen.findAllByRole('option')).toHaveLength(2)
    expect(screen.queryByTestId('safe-account-group-header')).not.toBeInTheDocument()
  })
})
