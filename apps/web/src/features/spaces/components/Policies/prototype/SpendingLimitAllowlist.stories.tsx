import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Erc20TokenMetadata } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { balanceHandlers, createMockStory } from '@/stories/mocks'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { useSafeScope, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import type { SafeScopeTarget } from '@/components/tx-flow/safe-scope'
import { INELIGIBILITY_TEXT } from '../SafeAccountSelector/constants'
import { buildSafeAccountId } from '../SafeAccountSelector/utils'
import type { SafeAccountEntry, SafeAccountOption } from '../SafeAccountSelector/types'
import type { SpendingLimitPolicyFormProps } from '../SpendingLimitFlow/CreateStep/SpendingLimitPolicyForm'
import { createDefaultFormValues } from '../SpendingLimitFlow/types'
import { AllowlistSpendingLimitForm, AllowlistTokensContext, type AllowlistTokens } from './m2SpendingLimitForm'
import { PAYMENTS, TREASURY } from './m2Prototype'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'

const tokenLogo = (address: string): string => `https://safe-transaction-assets.safe.global/tokens/logos/${address}.png`

/**
 * "Payments" is the mock efSafe (`SAFE_ADDRESSES.efSafe`): the token field only enables once the scoped Safe's info
 * loads, and the mocks serve Safe info for that address only, as in M1's own form stories.
 */
const PAYMENTS_ADDRESS = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const PAYMENTS_ID = buildSafeAccountId(PAYMENTS.chainId, PAYMENTS_ADDRESS)
const paymentsTarget: SafeScopeTarget = { chainId: PAYMENTS.chainId, safeAddress: PAYMENTS_ADDRESS }

const PAYMENTS_ALLOWLIST: AllowlistTokens = { allowedAddresses: [USDC, ZERO_ADDRESS], accountName: PAYMENTS.name }

const erc20 = (address: string, symbol: string, name: string, decimals: number) =>
  ({ address, symbol, name, decimals, logoUri: tokenLogo(address), type: 'ERC20' }) as const

const paymentsBalances: Balances = {
  fiatTotal: '262120',
  items: [
    {
      balance: '120000000000',
      fiatBalance: '120000',
      fiatConversion: '1',
      tokenInfo: erc20(USDC, 'USDC', 'USD Coin', 6),
    },
    {
      balance: '32000000000000000000',
      fiatBalance: '85120',
      fiatConversion: '2660',
      tokenInfo: {
        address: ZERO_ADDRESS,
        decimals: 18,
        logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
        name: 'Ether',
        symbol: 'ETH',
        type: 'NATIVE_TOKEN',
      },
    },
    {
      balance: '45000000000',
      fiatBalance: '45000',
      fiatConversion: '1',
      tokenInfo: erc20(USDT, 'USDT', 'Tether USD', 6),
    },
    {
      balance: '12000000000000000000000',
      fiatBalance: '12000',
      fiatConversion: '1',
      tokenInfo: erc20(DAI, 'DAI', 'Dai Stablecoin', 18),
    },
  ],
}

const popularTokens: Erc20TokenMetadata[] = [
  { ...erc20(WETH, 'WETH', 'Wrapped Ether', 18), trusted: true },
  { ...erc20(WBTC, 'WBTC', 'Wrapped BTC', 8), trusted: true },
]

const account = (chainId: string, address: string, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  eligibility: 'signer',
  chain: {
    chainId,
    chainName: chainId === '1' ? 'Ethereum' : 'Polygon',
    chainLogoUri: null,
    shortName: chainId === '1' ? 'eth' : 'matic',
  },
  ...extra,
})

const accounts: SafeAccountEntry[] = [
  account(PAYMENTS.chainId, PAYMENTS_ADDRESS, {
    name: PAYMENTS.name,
    threshold: PAYMENTS.threshold,
    owners: PAYMENTS.owners,
    fiatTotal: paymentsBalances.fiatTotal,
  }),
  account('137', TREASURY.address, {
    name: TREASURY.name,
    threshold: TREASURY.threshold,
    owners: TREASURY.owners,
    fiatTotal: '5430.1',
    ineligibleReason: 'unsupported-chain',
  }),
]

type StoryProps = Partial<SpendingLimitPolicyFormProps> & {
  initialSafe?: SafeScopeTarget
  allowlist?: AllowlistTokens | null
}

const ScopedForm = ({ initialSafe: _initialSafe, allowlist: _allowlist, ...props }: StoryProps) => {
  const { setScope } = useSafeScopeControls()
  const scopeKey = useSafeScope()?.scopeKey
  const [isCalloutDismissed, setIsCalloutDismissed] = useState(false)
  return (
    <AllowlistSpendingLimitForm
      defaultValues={createDefaultFormValues()}
      onSubmit={fn()}
      accounts={accounts}
      isAccountsLoading={false}
      isAccountsError={false}
      onRetryAccounts={fn()}
      hasWallet
      isCalloutDismissed={isCalloutDismissed}
      onDismissCallout={() => setIsCalloutDismissed(true)}
      onSafeChange={setScope}
      scopeKey={scopeKey}
      {...props}
    />
  )
}

const FormInScope = (props: StoryProps) => (
  <AllowlistTokensContext.Provider value={props.allowlist ?? null}>
    <SafeScopeProvider initial={props.initialSafe}>
      <ScopedForm {...props} />
    </SafeScopeProvider>
  </AllowlistTokensContext.Provider>
)

const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected', shadcn: true })

const meta = {
  title: 'Prototype/Spending limit flow – allowlist tokens',
  component: FormInScope,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
    msw: {
      handlers: [
        http.get(/\/v1\/chains\/\d+\/tokens(\?|$)/, () => HttpResponse.json(popularTokens)),
        ...balanceHandlers(paymentsBalances),
        ...setup.handlers,
      ],
    },
  },
  decorators: [
    setup.decorator,
    (Story) => (
      <div className="w-[577px]">
        <Story />
      </div>
    ),
  ],
  tags: ['skip-visual-test'],
} satisfies Meta<typeof FormInScope>

export default meta
type Story = StoryObj<typeof meta>

const TOOLTIP_TIMEOUT = { timeout: 3000 }

const openTokenDropdown = async (canvasElement: HTMLElement) => {
  const input = await within(canvasElement).findByTestId('limit-token-selector')
  // The combobox stays disabled until the scoped Safe has loaded.
  await waitFor(() => expect(input).toBeEnabled(), { timeout: 5000 })
  await userEvent.click(input)
}

/** No Safe picked yet: the account dropdown is open and the Polygon Safe's reason tooltip is showing. */
export const AccountDropdownOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('safe-account-selector'))

    const body = within(document.body)
    const disabledRow = await waitFor(() => {
      const row = body.getAllByTestId('safe-account-option').find((option) => option.hasAttribute('data-disabled'))
      if (!row) throw new Error('No disabled account row yet')
      return row
    })
    await userEvent.hover(disabledRow)
    await body.findByText(INELIGIBILITY_TEXT['unsupported-chain'], {}, TOOLTIP_TIMEOUT)
  },
}

/** Payments allows USDC and ETH only, so every other token is listed but disabled, with the allowlist tooltip. */
export const TokenDropdownAllowlist: Story = {
  args: {
    initialSafe: paymentsTarget,
    defaultValues: { ...createDefaultFormValues(), safe: PAYMENTS_ID },
    allowlist: PAYMENTS_ALLOWLIST,
  },
  play: async ({ canvasElement }) => {
    await openTokenDropdown(canvasElement)

    const body = within(document.body)
    // Held tokens sort by fiat value, so USDT is the first one outside the allowlist.
    const usdt = await body.findByRole('option', { name: /USDT/ }, { timeout: 5000 })
    await userEvent.hover(usdt)
    await body.findByText(
      `Blocked by the recipient allowlist on ${PAYMENTS.name}. It only lets allowed tokens be sent, so a spending limit for this one wouldn't work.`,
      {},
      TOOLTIP_TIMEOUT,
    )
  },
}

/** The same Safe without an allowlist: M1's behaviour, every token selectable. */
export const TokenDropdownNoAllowlist: Story = {
  args: {
    initialSafe: paymentsTarget,
    defaultValues: { ...createDefaultFormValues(), safe: PAYMENTS_ID },
    allowlist: null,
  },
  play: async ({ canvasElement }) => {
    await openTokenDropdown(canvasElement)
  },
}
