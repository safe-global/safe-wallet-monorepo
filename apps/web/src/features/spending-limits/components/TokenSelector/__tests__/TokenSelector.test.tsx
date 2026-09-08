import { faker } from '@faker-js/faker'
import { render, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useSpendingLimitTokenOptions from '../../../hooks/useSpendingLimitTokenOptions'
import type { TokenOptionsResult } from '../../../hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from '../../../utils/tokenOptions'
import TokenSelector from '..'
import {
  BALANCES_LOAD_ERROR_TEXT,
  HELD_GROUP_LABEL,
  NO_TOKENS_FOUND_TEXT,
  POPULAR_GROUP_LABEL,
  POPULAR_LOAD_ERROR_TEXT,
  RETRY_TEXT,
  TOKEN_SELECTOR_LABEL,
  TOKEN_SELECTOR_PLACEHOLDER,
} from '../constants'

jest.mock('../../../hooks/useSpendingLimitTokenOptions', () => ({ __esModule: true, default: jest.fn() }))
const mockUseOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>

const option = (overrides: Partial<TokenOption> = {}): TokenOption => ({
  address: checksumAddress(faker.finance.ethereumAddress()),
  symbol: faker.finance.currencyCode(),
  name: faker.finance.currencyName(),
  decimals: 18,
  logoUri: faker.image.url(),
  group: 'popular',
  ...overrides,
})

const heldUsdc = option({
  symbol: 'USDC',
  name: 'USD Coin',
  group: 'held',
  balance: '0',
  fiatBalance: '0',
  decimals: 6,
})
const heldEth = option({
  symbol: 'ETH',
  name: 'Ether',
  group: 'held',
  balance: '1000000000000000000',
  fiatBalance: '1000',
})
const popularDai = option({ symbol: 'DAI', name: 'Dai Stablecoin' })
const popularWbtc = option({ symbol: 'WBTC', name: 'Wrapped BTC', logoUri: undefined })

const IDENTITY = `1:${checksumAddress(faker.finance.ethereumAddress())}`

const setOptions = (overrides: Partial<TokenOptionsResult> = {}) => {
  const result: TokenOptionsResult = {
    options: [heldEth, heldUsdc, popularDai, popularWbtc],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: IDENTITY,
    ...overrides,
  }
  mockUseOptions.mockReturnValue(result)
  return result
}

const renderSelector = (props: Partial<Parameters<typeof TokenSelector>[0]> = {}) =>
  renderWithUserEvent(<TokenSelector onChange={jest.fn()} {...props} />)

// Base UI pre-mounts the popup; wait for the expanded state before querying options.
const openSelector = async (user: ReturnType<typeof renderSelector>['user']) => {
  const input = screen.getByRole('combobox')
  await user.click(input)
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'))
  return input
}

beforeEach(() => {
  jest.clearAllMocks()
  setOptions()
})

describe('TokenSelector — rendering', () => {
  it('renders the default label and placeholder', () => {
    render(<TokenSelector onChange={jest.fn()} />)

    expect(screen.getByLabelText(TOKEN_SELECTOR_LABEL)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(TOKEN_SELECTOR_PLACEHOLDER)).toBeInTheDocument()
  })

  it('groups held tokens under "Your tokens" and the rest under "Popular"', async () => {
    const { user } = renderSelector()
    await openSelector(user)

    const listbox = screen.getByRole('listbox')
    expect(within(listbox).getByText(HELD_GROUP_LABEL)).toBeInTheDocument()
    expect(within(listbox).getByText(POPULAR_GROUP_LABEL)).toBeInTheDocument()

    const optionNames = within(listbox)
      .getAllByRole('option')
      .map((node) => node.textContent)
    expect(optionNames[0]).toContain('ETH')
    expect(optionNames[1]).toContain('USDC')
    expect(optionNames[2]).toContain('DAI')
    expect(optionNames[3]).toContain('WBTC')
  })

  it('lets a zero-balance held token be selected', async () => {
    const onChange = jest.fn()
    const { user } = renderSelector({ onChange })
    await openSelector(user)

    await user.click(screen.getByRole('option', { name: /USDC/ }))

    expect(onChange).toHaveBeenCalledWith(heldUsdc.address)
  })

  it('renders a token without a logo', async () => {
    const { user } = renderSelector()
    await openSelector(user)

    expect(screen.getByRole('option', { name: /WBTC/ })).toBeInTheDocument()
  })

  it('shows the selected token symbol in the input', () => {
    render(<TokenSelector value={popularDai.address} onChange={jest.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('DAI')
  })

  it('shows the shortened address for a value that is not in the list', () => {
    const unknown = checksumAddress(faker.finance.ethereumAddress())

    render(<TokenSelector value={unknown} onChange={jest.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue(shortenAddress(unknown))
  })
})

describe('TokenSelector — search', () => {
  it('filters both groups by symbol', async () => {
    const { user } = renderSelector()
    const input = await openSelector(user)

    await user.type(input, 'usd')

    await waitFor(() => {
      const names = screen.getAllByRole('option').map((node) => node.textContent)
      expect(names).toHaveLength(1)
      expect(names[0]).toContain('USDC')
    })
  })

  it('filters by name', async () => {
    const { user } = renderSelector()
    const input = await openSelector(user)

    await user.type(input, 'wrapped')

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1))
    expect(screen.getByRole('option', { name: /WBTC/ })).toBeInTheDocument()
  })

  it('filters by address', async () => {
    const { user } = renderSelector()
    const input = await openSelector(user)

    await user.type(input, popularDai.address.slice(2, 12))

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1))
    expect(screen.getByRole('option', { name: /DAI/ })).toBeInTheDocument()
  })

  it('shows the empty state and does not accept an unknown address', async () => {
    const onChange = jest.fn()
    const { user } = renderSelector({ onChange })
    const input = await openSelector(user)

    await user.type(input, checksumAddress(faker.finance.ethereumAddress()))

    // Base UI's ComboboxInput closes (and unmounts) the popup on Enter whenever no item is
    // highlighted, so the empty-state text must be asserted before the key press, not after.
    await waitFor(() => expect(screen.getByText(NO_TOKENS_FOUND_TEXT)).toBeInTheDocument())

    await user.keyboard('{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('TokenSelector — Safe/chain changes (C15)', () => {
  it('clears the selection when the Safe identity changes after mount', () => {
    const onChange = jest.fn()
    const { rerender } = render(<TokenSelector value={heldUsdc.address} onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()

    setOptions({ identityKey: `137:${checksumAddress(faker.finance.ethereumAddress())}`, options: [popularDai] })
    rerender(<TokenSelector value={heldUsdc.address} onChange={onChange} />)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('does not clear on first mount, nor when the identity is unchanged', () => {
    const onChange = jest.fn()
    const { rerender } = render(<TokenSelector value={heldUsdc.address} onChange={onChange} />)

    rerender(<TokenSelector value={heldUsdc.address} onChange={onChange} />)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not clear when a Safe is selected for the first time (identity goes from empty to set)', () => {
    const onChange = jest.fn()
    setOptions({ identityKey: '', options: [] })
    const { rerender } = render(<TokenSelector onChange={onChange} />)

    setOptions()
    rerender(<TokenSelector onChange={onChange} />)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not clear a prefilled value when a Safe is selected for the first time', () => {
    const onChange = jest.fn()
    setOptions({ identityKey: '', options: [] })
    const { rerender } = render(<TokenSelector value={heldUsdc.address} onChange={onChange} />)

    setOptions()
    rerender(<TokenSelector value={heldUsdc.address} onChange={onChange} />)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange on identity change when nothing is selected', () => {
    const onChange = jest.fn()
    const { rerender } = render(<TokenSelector onChange={onChange} />)

    setOptions({ identityKey: `137:${checksumAddress(faker.finance.ethereumAddress())}` })
    rerender(<TokenSelector onChange={onChange} />)

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('TokenSelector — excludeAddresses', () => {
  it('hides excluded tokens but never the current value', async () => {
    const { user } = renderSelector({
      value: popularDai.address,
      excludeAddresses: [popularDai.address.toLowerCase(), popularWbtc.address],
    })
    await openSelector(user)

    expect(screen.getByRole('option', { name: /DAI/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /WBTC/ })).not.toBeInTheDocument()
  })
})

describe('TokenSelector — states', () => {
  it('is disabled when no Safe is selected', () => {
    setOptions({ identityKey: '', options: [] })

    render(<TokenSelector onChange={jest.fn()} />)

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('respects the disabled prop', () => {
    render(<TokenSelector onChange={jest.fn()} disabled />)

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('shows skeletons for held tokens while loading and keeps popular tokens selectable', async () => {
    const onChange = jest.fn()
    setOptions({ isLoading: true, options: [popularDai, popularWbtc] })
    const { user } = renderSelector({ onChange })
    await openSelector(user)

    expect(screen.getByTestId('held-tokens-loading')).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: /DAI/ }))
    expect(onChange).toHaveBeenCalledWith(popularDai.address)
  })

  it('shows the error row with retry and keeps popular tokens selectable', async () => {
    const { refetch } = setOptions({ isError: true, options: [popularDai] })
    const { user } = renderSelector()
    await openSelector(user)

    expect(screen.getByText(BALANCES_LOAD_ERROR_TEXT)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /DAI/ })).toBeInTheDocument()

    await user.click(within(screen.getByTestId('held-tokens-error')).getByRole('button', { name: RETRY_TEXT }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows skeletons for popular tokens while their metadata loads and keeps held tokens selectable', async () => {
    const onChange = jest.fn()
    setOptions({ isPopularLoading: true, options: [heldEth, heldUsdc] })
    const { user } = renderSelector({ onChange })
    await openSelector(user)

    expect(screen.getByTestId('popular-tokens-loading')).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: /USDC/ }))
    expect(onChange).toHaveBeenCalledWith(heldUsdc.address)
  })

  it('shows the popular error row with retry and keeps held tokens selectable', async () => {
    const { refetchPopular } = setOptions({ isPopularError: true, options: [heldEth] })
    const { user } = renderSelector()
    await openSelector(user)

    expect(screen.getByText(POPULAR_LOAD_ERROR_TEXT)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /ETH/ })).toBeInTheDocument()

    await user.click(within(screen.getByTestId('popular-tokens-error')).getByRole('button', { name: RETRY_TEXT }))
    expect(refetchPopular).toHaveBeenCalledTimes(1)
  })

  it('can show both groups loading at once', async () => {
    setOptions({ isLoading: true, isPopularLoading: true, options: [] })
    const { user } = renderSelector()
    await openSelector(user)

    expect(screen.getByTestId('held-tokens-loading')).toBeInTheDocument()
    expect(screen.getByTestId('popular-tokens-loading')).toBeInTheDocument()
  })
})
