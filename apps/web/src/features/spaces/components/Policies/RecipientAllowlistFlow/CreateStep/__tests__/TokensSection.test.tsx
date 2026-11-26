import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { erc20TokenMetadataBuilder, erc721TokenMetadataBuilder } from '@/tests/builders/tokens'
import {
  NOT_ERC20_TOKEN_TEXT,
  UNKNOWN_TOKEN_DETAIL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { tokenOptionBuilder } from '@/utils/tokenOptions.testData'
import type { TokenOption } from '@/utils/tokenOptions'
import type { HeldTokenAddresses } from '../../hooks/useHeldTokenAddresses'
import type { SpendingLimitTokensResult } from '../../hooks/useSpendingLimitTokens'
import { createDefaultAllowlistValues, type AllowlistToken, type RecipientAllowlistFormValues } from '../../types'
import TokensSection from '../TokensSection'

const TOKEN_URL = `${GATEWAY_URL}/v1/chains/:chainId/tokens/:address`
const PLACEHOLDER = 'Search tokens by name or address'

const ETH = tokenOptionBuilder().with({ address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ether', group: 'held' }).build()
const USDC = tokenOptionBuilder().with({ symbol: 'USDC', name: 'USD Coin', group: 'held' }).build()
const DAI = tokenOptionBuilder().with({ symbol: 'DAI', name: 'Dai Stablecoin', group: 'popular' }).build()

const asToken = ({ address, symbol, logoUri }: TokenOption): AllowlistToken => ({ address, symbol, logoUri })

const held = (overrides: Partial<HeldTokenAddresses> = {}): HeldTokenAddresses => ({
  addresses: [ETH.address, USDC.address],
  options: [ETH, USDC, DAI],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isPopularLoading: false,
  isPopularError: false,
  refetchPopular: jest.fn(),
  identityKey: '1:0x1',
  ...overrides,
})

const spendingLimitsOn = (
  tokens: TokenOption[],
  overrides: Partial<SpendingLimitTokensResult> = {},
): SpendingLimitTokensResult => ({
  tokens: tokens.map(({ address, symbol, decimals }) => ({ address, symbol, decimals, logoUri: null })),
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  ...overrides,
})

const renderSection = ({
  values = createDefaultAllowlistValues(),
  heldTokens = held(),
  spendingLimits = spendingLimitsOn([]),
  hasAccount = true,
}: {
  values?: RecipientAllowlistFormValues
  heldTokens?: HeldTokenAddresses
  spendingLimits?: SpendingLimitTokensResult
  hasAccount?: boolean
} = {}) => {
  const onChange = jest.fn()
  const rendered = renderWithUserEvent(
    <TokensSection
      values={values}
      onChange={onChange}
      heldTokens={heldTokens}
      spendingLimits={spendingLimits}
      hasAccount={hasAccount}
    />,
  )
  return { ...rendered, onChange, values }
}

const search = () => screen.getByRole('combobox', { name: PLACEHOLDER })

describe('TokensSection', () => {
  it('should, when creating, show the copy and no token chips', () => {
    renderSection()

    expect(screen.getByText('Which tokens can be sent')).toBeInTheDocument()
    expect(screen.getByText('Only transfers of the tokens selected below will be allowed.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Allow / })).not.toBeInTheDocument()
  })

  it("should, when the search field is focused, list the Safe's tokens and the popular ones", async () => {
    const { user } = renderSection()

    await user.click(search())

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'ETHEther',
      'USDCUSD Coin',
      'DAIDai Stablecoin',
    ])
  })

  it('should, when the Safe has a spending limit, list its token first under its own header with a mark', async () => {
    const { user } = renderSection({ spendingLimits: spendingLimitsOn([DAI]) })

    await user.click(search())

    const [spendingLimitGroup, otherGroup] = within(screen.getByRole('listbox')).getAllByRole('group')
    expect(spendingLimitGroup).toHaveTextContent('In spending limits')
    expect(
      within(spendingLimitGroup)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['DAIDai Stablecoin'])
    expect(within(spendingLimitGroup).getByTestId('spending-limit-token-mark')).toBeInTheDocument()
    expect(otherGroup).toHaveTextContent('Other tokens')
    expect(within(otherGroup).queryByTestId('spending-limit-token-mark')).not.toBeInTheDocument()
  })

  it('should, when the Safe has a spending limit, not pick its token by itself', () => {
    const { onChange } = renderSection({ spendingLimits: spendingLimitsOn([DAI]) })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Allow DAI' })).not.toBeInTheDocument()
  })

  it('should, when the token of a spending limit is picked, mark its chip', () => {
    renderSection({
      values: { tokens: [asToken(USDC), asToken(DAI)], recipients: [] },
      spendingLimits: spendingLimitsOn([DAI]),
    })

    expect(
      within(screen.getByRole('button', { name: /^Allow DAI/ })).getByTestId('spending-limit-token-mark'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('button', { name: 'Allow USDC' })).queryByTestId('spending-limit-token-mark'),
    ).toBeNull()
  })

  it('should, when the mark on a chip is clicked, keep the token', async () => {
    const { user, onChange } = renderSection({
      values: { tokens: [asToken(DAI)], recipients: [] },
      spendingLimits: spendingLimitsOn([DAI]),
    })

    await user.click(screen.getByTestId('spending-limit-token-mark'))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should, when the spending limits fail to load, offer a retry', async () => {
    const refetch = jest.fn()
    const { user } = renderSection({ spendingLimits: spendingLimitsOn([], { isError: true, refetch }) })

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByTestId('allowlist-spending-limits-error')).toHaveTextContent(
      'Could not load the spending limits of this account.',
    )
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should, when a token is picked from the list, add it with its symbol and logo', async () => {
    const { user, onChange, values } = renderSection()

    await user.click(search())
    await user.click(screen.getByRole('option', { name: /DAI/ }))

    expect(onChange).toHaveBeenCalledWith({ ...values, tokens: [asToken(DAI)] })
  })

  it('should, when a picked token is clicked in the list, remove it', async () => {
    const { user, onChange, values } = renderSection({ values: { tokens: [asToken(USDC)], recipients: [] } })

    await user.click(search())
    await user.click(screen.getByRole('option', { name: /USDC/ }))

    expect(onChange).toHaveBeenCalledWith({ ...values, tokens: [] })
  })

  it('should, when Select all is clicked, add every listed token not picked yet', async () => {
    const { user, onChange, values } = renderSection({ values: { tokens: [asToken(USDC)], recipients: [] } })

    await user.click(search())
    await user.click(screen.getByRole('button', { name: 'Select all' }))

    expect(onChange).toHaveBeenCalledWith({ ...values, tokens: [asToken(USDC), asToken(ETH), asToken(DAI)] })
  })

  it('should, when a token chip is clicked, remove the token', async () => {
    const { user, onChange, values } = renderSection({
      values: { tokens: [asToken(ETH), asToken(USDC)], recipients: [] },
    })

    await user.click(screen.getByRole('button', { name: 'Allow ETH' }))

    expect(onChange).toHaveBeenCalledWith({ ...values, tokens: [asToken(USDC)] })
  })

  it('should, when editing, show a picked token no list names by its stored symbol', () => {
    const live: AllowlistToken = { address: checksumAddress(faker.finance.ethereumAddress()), symbol: 'SAFE' }
    renderSection({ values: { tokens: [asToken(USDC), live], recipients: [] } })

    expect(screen.getByRole('button', { name: 'Allow USDC' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Allow SAFE' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('should, when the address of an unlisted ERC-20 is pasted, offer it and add it with its symbol', async () => {
    const pasted = checksumAddress(faker.finance.ethereumAddress())
    const token = erc20TokenMetadataBuilder().with({ address: pasted, symbol: 'SAFE', trusted: true }).build()
    server.use(http.get(TOKEN_URL, () => HttpResponse.json(token)))
    const { user, onChange, values } = renderSection()

    await user.click(search())
    await user.paste(pasted)
    await user.click(await screen.findByRole('option', { name: /SAFE/ }))

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      tokens: [{ address: pasted, symbol: 'SAFE', logoUri: token.logoUri || undefined }],
    })
    expect(search()).toHaveValue('')
  })

  it('should, when the pasted address is no known token, offer it as an unknown token and add it by its address', async () => {
    const pasted = checksumAddress(faker.finance.ethereumAddress())
    server.use(http.get(TOKEN_URL, () => new HttpResponse(null, { status: 404 })))
    const { user, onChange, values } = renderSection()

    await user.click(search())
    await user.paste(pasted)
    const option = await screen.findByRole('option', { name: new RegExp(UNKNOWN_TOKEN_DETAIL) })
    expect(option).toHaveTextContent(`${shortenAddress(pasted)}${UNKNOWN_TOKEN_DETAIL}`)

    await user.click(option)

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      tokens: [{ address: pasted, symbol: shortenAddress(pasted), logoUri: undefined }],
    })
  })

  it('should, when the pasted address is an NFT, say only ERC-20 tokens can be added', async () => {
    const pasted = checksumAddress(faker.finance.ethereumAddress())
    const nft = erc721TokenMetadataBuilder().with({ address: pasted }).build()
    server.use(http.get(TOKEN_URL, () => HttpResponse.json(nft)))
    const { user } = renderSection()

    await user.click(search())
    await user.paste(pasted)

    expect(await screen.findByText(NOT_ERC20_TOKEN_TEXT)).toBeInTheDocument()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('should, when no Safe is picked, disable the search field', () => {
    renderSection({ heldTokens: held({ options: [], addresses: [] }), hasAccount: false })

    expect(search()).toBeDisabled()
  })

  it('should, while the tokens load, show skeleton rows in the list', async () => {
    const { user } = renderSection({ heldTokens: held({ options: [], addresses: [], isLoading: true }) })

    await user.click(search())

    expect(screen.getByTestId('search-picker-loading')).toBeInTheDocument()
  })

  it('should, when the tokens fail to load, offer a retry', async () => {
    const refetch = jest.fn()
    const { user } = renderSection({ heldTokens: held({ isError: true, refetch }) })

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByTestId('allowlist-tokens-error')).toHaveTextContent('Could not load the tokens in this account.')
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should, when the popular tokens fail to load, offer a retry', async () => {
    const refetchPopular = jest.fn()
    const { user } = renderSection({ heldTokens: held({ isPopularError: true, refetchPopular }) })

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByTestId('allowlist-popular-tokens-error')).toHaveTextContent("Couldn't load popular tokens")
    expect(refetchPopular).toHaveBeenCalledTimes(1)
  })
})
