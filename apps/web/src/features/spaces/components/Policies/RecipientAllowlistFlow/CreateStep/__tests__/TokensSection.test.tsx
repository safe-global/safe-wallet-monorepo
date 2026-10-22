import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { createDefaultAllowlistValues } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import type { RecipientAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import type { TokenOption } from '../../../SpendingLimitFlow/utils/tokenOptions'
import type { HeldTokenAddresses } from '../../hooks/useHeldTokenAddresses'
import TokensSection from '../TokensSection'

jest.mock('../TokenDraftRow', () => ({
  __esModule: true,
  default: ({
    options,
    onConfirm,
    onCancel,
  }: {
    options: TokenOption[]
    onConfirm: (address: string) => void
    onCancel: () => void
  }) => (
    <div>
      {options.map((option) => (
        <button key={option.address} onClick={() => onConfirm(option.address)}>
          pick {option.symbol}
        </button>
      ))}
      <button onClick={onCancel}>Cancel adding a token</button>
    </div>
  ),
}))

const USDC = '0x00000000000000000000000000000000000000a1'
const DAI = '0x00000000000000000000000000000000000000b2'
const NO_SYMBOL = '0x00000000000000000000000000000000000000c3'

const option = (address: string, symbol: string, group: TokenOption['group'] = 'held'): TokenOption => ({
  address,
  symbol,
  name: symbol,
  decimals: 18,
  group,
})

const ETH = option(ZERO_ADDRESS, 'ETH')
const USDC_OPTION = option(USDC, 'USDC')
const DAI_OPTION = option(DAI, 'DAI', 'popular')

let heldTokens: HeldTokenAddresses

const hold = (options: TokenOption[], overrides: Partial<HeldTokenAddresses> = {}) => {
  heldTokens = {
    addresses: options.filter((o) => o.group === 'held').map((o) => o.address),
    options,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: '1:0x1',
    ...overrides,
  }
}

const setup = (
  values: RecipientAllowlistFormValues = createDefaultAllowlistValues(),
  props: { hasAccount?: boolean; isCalloutDismissed?: boolean } = {},
) => {
  const onChange = jest.fn()
  const onDismissCallout = jest.fn()
  const ui = () => (
    <TokensSection
      values={values}
      onChange={onChange}
      heldTokens={heldTokens}
      hasAccount={props.hasAccount ?? true}
      isCalloutDismissed={props.isCalloutDismissed ?? false}
      onDismissCallout={onDismissCallout}
    />
  )
  const { rerender } = render(ui())
  return { onChange, onDismissCallout, rerender: () => rerender(ui()) }
}

describe('TokensSection', () => {
  beforeEach(() => hold([ETH, USDC_OPTION, DAI_OPTION]))

  it('shows held tokens as selected chips', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Allow ETH', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Allow USDC', pressed: true })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Allow DAI' })).not.toBeInTheDocument()
  })

  it('excludes a token when its chip is deselected', async () => {
    const { onChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Allow USDC' }))

    expect(onChange).toHaveBeenCalledWith({ ...createDefaultAllowlistValues(), excludedTokens: [USDC] })
  })

  it('excludes every token with "Deselect all"', async () => {
    const { onChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Deselect all' }))

    expect(onChange).toHaveBeenCalledWith({ ...createDefaultAllowlistValues(), excludedTokens: [ZERO_ADDRESS, USDC] })
  })

  it('flips to "Select all" once everything is excluded and clears the exclusions', async () => {
    const { onChange } = setup({ ...createDefaultAllowlistValues(), excludedTokens: [ZERO_ADDRESS, USDC] })

    await userEvent.click(screen.getByRole('button', { name: 'Select all' }))

    expect(onChange).toHaveBeenCalledWith(createDefaultAllowlistValues())
  })

  it('shows the shortened address for a token without a symbol', () => {
    hold([option(NO_SYMBOL, '')])
    setup()

    expect(screen.getByRole('button', { name: `Allow ${shortenAddress(NO_SYMBOL)}` })).toBeInTheDocument()
  })

  it('appends a popular token picked from "Add a token" and shows its chip', async () => {
    const { onChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Add a token' }))
    await userEvent.click(screen.getByRole('button', { name: 'pick DAI' }))

    expect(onChange).toHaveBeenCalledWith({ ...createDefaultAllowlistValues(), addedTokens: [DAI] })
  })

  it('renders an added token with its metadata from the popular list', () => {
    setup({ ...createDefaultAllowlistValues(), addedTokens: [DAI] })

    expect(screen.getByRole('button', { name: 'Allow DAI', pressed: true })).toBeInTheDocument()
  })

  it('offers only the tokens not on the form yet', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Add a token' }))

    expect(screen.getByRole('button', { name: 'pick DAI' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'pick ETH' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'pick USDC' })).not.toBeInTheDocument()
  })

  it('disables "Add a token" once every token is on the form', () => {
    setup({ ...createDefaultAllowlistValues(), addedTokens: [DAI] })

    expect(screen.getByRole('button', { name: 'Add a token' })).toBeDisabled()
  })

  it('drops the picker row when it is cancelled', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Add a token' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel adding a token' }))

    expect(screen.queryByRole('button', { name: 'pick DAI' })).not.toBeInTheDocument()
  })

  it('disables "Add a token" and asks for an account when none is picked', () => {
    hold([])
    setup(createDefaultAllowlistValues(), { hasAccount: false })

    expect(screen.getByRole('button', { name: 'Add a token' })).toBeDisabled()
    expect(screen.getByText('Pick a Safe account to choose from its tokens.')).toBeInTheDocument()
    expect(screen.queryByTestId('allowlist-tokens-callout')).not.toBeInTheDocument()
  })

  it('shows the empty text when the account holds no tokens', () => {
    hold([])
    setup()

    expect(screen.getByText('Tokens in this account will show here.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument()
  })

  it('shows skeletons, not the empty text, while loading', () => {
    hold([], { isLoading: true })
    setup()

    expect(screen.getByTestId('allowlist-tokens-loading')).toBeInTheDocument()
    expect(screen.queryByText('Tokens in this account will show here.')).not.toBeInTheDocument()
  })

  it('offers a retry when the tokens fail to load', async () => {
    const refetch = jest.fn()
    hold([], { isError: true, refetch })
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(refetch).toHaveBeenCalled()
    expect(screen.queryByText('Tokens in this account will show here.')).not.toBeInTheDocument()
    expect(screen.getAllByText('Which tokens can be sent')).toHaveLength(1)
  })

  it('keeps loaded chips and "Deselect all" when a refetch fails and offers a retry below them', async () => {
    const refetch = jest.fn()
    hold([ETH, USDC_OPTION], { isError: true, refetch })
    setup()

    expect(screen.queryByTestId('allowlist-tokens-error')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Allow ETH' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deselect all' })).toBeInTheDocument()
    expect(screen.getByTestId('allowlist-tokens-refetch-error')).toHaveTextContent(
      'Could not load the tokens in this account.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(refetch).toHaveBeenCalled()
  })

  it.each([
    ['loading', { isLoading: true }],
    ['failed', { isError: true }],
  ])('hides "Select all" and disables "Add a token" while the tokens are %s', (_, overrides) => {
    hold([DAI_OPTION], overrides)
    setup()

    expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /deselect all/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a token' })).toBeDisabled()
  })

  it('disables "Add a token" while the popular tokens load', () => {
    hold([ETH, DAI_OPTION], { isPopularLoading: true })
    setup()

    expect(screen.getByRole('button', { name: 'Add a token' })).toBeDisabled()
  })

  it('offers a retry when the popular tokens fail to load', async () => {
    const refetchPopular = jest.fn()
    hold([ETH, USDC_OPTION], { isPopularError: true, refetchPopular })
    setup()

    expect(screen.getByText("Couldn't load popular tokens")).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(refetchPopular).toHaveBeenCalled()
  })

  it('closes the add-token row when the account changes', async () => {
    const { rerender } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Add a token' }))
    expect(screen.getByRole('button', { name: 'pick DAI' })).toBeInTheDocument()

    hold([ETH, USDC_OPTION, DAI_OPTION], { identityKey: '1:0x2' })
    rerender()

    expect(screen.queryByRole('button', { name: 'pick DAI' })).not.toBeInTheDocument()
  })

  it('shows the callout and dismisses it', async () => {
    const { onDismissCallout } = setup()

    expect(screen.getByText('Only transactions of the tokens selected below will be allowed.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismissCallout).toHaveBeenCalled()
  })

  it('hides the callout once dismissed', () => {
    setup(createDefaultAllowlistValues(), { isCalloutDismissed: true })

    expect(screen.queryByTestId('allowlist-tokens-callout')).not.toBeInTheDocument()
  })
})
