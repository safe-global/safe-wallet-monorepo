import { faker } from '@faker-js/faker'
import { render, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useSpendingLimitTokenOptions from '../../../hooks/useSpendingLimitTokenOptions'
import type { TokenOptionsResult } from '../../../hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from '../../../utils/tokenOptions'
import TokenSelector from '..'
import {
  HELD_GROUP_LABEL,
  NO_TOKENS_FOUND_TEXT,
  POPULAR_GROUP_LABEL,
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
