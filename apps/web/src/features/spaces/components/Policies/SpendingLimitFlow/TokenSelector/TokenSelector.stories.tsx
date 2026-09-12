import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { delay, http, HttpResponse } from 'msw'
import { fn, userEvent, within } from 'storybook/test'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Erc20TokenMetadata } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { createMockStory, balanceHandlers } from '@/stories/mocks'
import TokenSelector from './index'

// Only used for handlers that need behaviour `balanceHandlers` doesn't support (an infinite delay,
// an error status) — everywhere else, reuse `balanceHandlers` so the route regex lives in one place.
const BALANCES_ROUTE = /\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/

/** CGW's batch token-metadata route (`?addresses=` follows). */
const TOKENS_ROUTE = /\/v1\/chains\/\d+\/tokens(\?|$)/

const popularToken = (address: string, symbol: string, name: string, decimals: number): Erc20TokenMetadata => ({
  address,
  symbol,
  name,
  decimals,
  logoUri: `https://safe-transaction-assets.safe.global/tokens/logos/${address}.png`,
  trusted: true,
  type: 'ERC20',
})

/** What CGW answers for the Ethereum popular list (USDC and DAI are also held by efSafe → de-duplicated, leaving 6 of 8). */
const popularTokens: Erc20TokenMetadata[] = [
  popularToken('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC', 'USD Coin', 6),
  popularToken('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT', 'Tether USD', 6),
  popularToken('0x6B175474E89094C44Da98b954EedeAC495271d0F', 'DAI', 'Dai Stablecoin', 18),
  popularToken('0xdC035D45d973E3EC169d2276DDab16f1e407384F', 'USDS', 'USDS Stablecoin', 18),
  popularToken('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH', 'Wrapped Ether', 18),
  popularToken('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 'WBTC', 'Wrapped BTC', 8),
  popularToken('0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', 'cbBTC', 'Coinbase Wrapped BTC', 8),
  popularToken('0x5aFE3855358E112B5647B952709E6165e1c1eEEe', 'SAFE', 'Safe Token', 18),
]

const popularTokensHandler = http.get(TOKENS_ROUTE, () => HttpResponse.json(popularTokens))

/** Opens the popup so the story renders with the token list visible. */
const openCombobox = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getByRole('combobox'))
}

const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected', shadcn: true })
const emptySetup = createMockStory({ scenario: 'empty', wallet: 'connected', shadcn: true })

/** Held tokens only — USDC with balance 0 and an ERC-20 with no logo, so C16 and the logo fallback are visible. */
const degradedBalances: Balances = {
  fiatTotal: '1000',
  items: [
    {
      balance: '1000000000000000000',
      fiatBalance: '1000',
      fiatConversion: '1000',
      tokenInfo: {
        address: ZERO_ADDRESS,
        decimals: 18,
        logoUri: '',
        name: 'Ether',
        symbol: 'ETH',
        type: 'NATIVE_TOKEN',
      },
    },
    {
      balance: '0',
      fiatBalance: '0',
      fiatConversion: '1',
      tokenInfo: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        logoUri: 'https://assets.smold.app/api/token/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo-128.png',
        name: 'USD Coin',
        symbol: 'USDC',
        type: 'ERC20',
      },
    },
    {
      balance: '42000000000000000000',
      fiatBalance: '12.5',
      fiatConversion: '0.3',
      tokenInfo: {
        address: '0x1F2504De05f5167650bE5B28c472601Be434b60A',
        decimals: 18,
        logoUri: '',
        name: '',
        symbol: '',
        type: 'ERC20',
      },
    },
  ],
}

const withBalances = (handler: Parameters<typeof http.get>[1]) => ({
  msw: { handlers: [http.get(BALANCES_ROUTE, handler), popularTokensHandler, ...setup.handlers] },
})

const meta = {
  title: 'Features/Spaces/Policies/TokenSelector',
  component: TokenSelector,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
    msw: { handlers: [popularTokensHandler, ...setup.handlers] },
  },
  decorators: [
    setup.decorator,
    // Sized like the token column of the spending-limit row in the policy dialog.
    (Story) => (
      <div className="w-[236px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState<string | undefined>()
    return (
      <TokenSelector
        {...args}
        value={value}
        onChange={(next) => {
          args.onChange(next)
          setValue(next)
        }}
      />
    )
  },
} satisfies Meta<typeof TokenSelector>

export default meta
type Story = StoryObj<typeof meta>

/** The efSafe fixture: 41 held tokens (USDC and DAI among them, so both are de-duplicated out of Popular, which is mocked from CGW — 6 of 8 remain). */
export const Default: Story = {
  play: openCombobox,
}

/** A Safe with no balances at all: only the native currency and the Ethereum popular list. */
export const EmptySafe: Story = {
  decorators: [emptySetup.decorator],
  parameters: { ...emptySetup.parameters, msw: { handlers: [popularTokensHandler, ...emptySetup.handlers] } },
  play: openCombobox,
}

/** Zero-balance USDC stays selectable; the nameless token and the logo-less ETH still render. */
export const DegradedMetadata: Story = {
  parameters: { msw: { handlers: [...balanceHandlers(degradedBalances), popularTokensHandler, ...setup.handlers] } },
  play: openCombobox,
}

/** Balances never resolve: skeleton rows under "Your tokens", popular tokens still selectable. */
export const Loading: Story = {
  tags: ['skip-visual-test'],
  parameters: withBalances(async () => {
    await delay('infinite')
    return HttpResponse.json(degradedBalances)
  }),
  play: openCombobox,
}

/** The balances call failed: error row with retry, popular tokens still selectable. */
export const LoadError: Story = {
  parameters: withBalances(() => HttpResponse.json({ message: 'boom' }, { status: 500 })),
  play: openCombobox,
}

/** Popular metadata never resolves: skeletons under "Popular", held tokens still selectable. */
export const PopularLoading: Story = {
  tags: ['skip-visual-test'],
  parameters: {
    msw: {
      handlers: [
        http.get(TOKENS_ROUTE, async () => {
          await delay('infinite')
          return HttpResponse.json(popularTokens)
        }),
        ...setup.handlers,
      ],
    },
  },
  play: openCombobox,
}

/** CGW failed to resolve the popular list: error row with retry, held tokens still selectable. */
export const PopularLoadError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(TOKENS_ROUTE, () => HttpResponse.json({ message: 'boom' }, { status: 502 })),
        ...setup.handlers,
      ],
    },
  },
  play: openCombobox,
}

/** A value the list does not know — the edit flow for a token that is neither held nor popular. */
export const UnknownValue: Story = {
  render: (args) => <TokenSelector {...args} value="0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB" />,
  play: openCombobox,
}

/** WBTC and DAI are already used on other rows of the same spender, so they are hidden here. */
export const WithExclusions: Story = {
  args: {
    excludeAddresses: ['0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', '0x6B175474E89094C44Da98b954EedeAC495271d0F'],
  },
  play: openCombobox,
}

export const Disabled: Story = {
  args: { disabled: true },
}
