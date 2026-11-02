import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Erc20TokenMetadata } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import { MOCK_SPACE_ID, createChainData, createChainsPageData, createMockStory } from '@/stories/mocks'
import { createChainsPageDataV2 } from '@/stories/mocks/chains'
import { MODULE_GUARD_STORAGE_SLOT } from '@/features/policy-guard/constants'
import {
  ADDRESS_BOOK_TRIGGER_LABEL,
  RECIPIENT_NAME_LABEL,
  RECIPIENT_REMOVE_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistFlow from '.'

/** The policy guard is only deployed on Sepolia. */
const CHAIN_ID = '11155111'
/** `SAFE_ADDRESSES.efSafe` in config/test/msw/fixtures. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
/** efSafe fixture's `owners[0].value` — what `wallet: 'owner'` resolves to. */
const WALLET = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'
const RPC_URL = 'https://rpc.recipient-allowlist.story'
const FOREIGN_GUARD = '0x1a4F7b8C9d0E1f2a3B4c5D6e7F8091A2b3C4c802'

const SEPOLIA_USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
const SEPOLIA_USDT = '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0'
const SEPOLIA_WETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
const SEPOLIA_LINK = '0x779877A7B0D9E8603169DdbD7836e478b4624789'
const SEPOLIA_DAI = '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357'
const SEPOLIA_UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

const logo = (address: string) => `https://safe-transaction-assets.safe.global/tokens/logos/${address}.png`
const USDC_LOGO = logo('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const USDT_LOGO = 'https://assets.coingecko.com/coins/images/325/large/Tether.png'

const baseChain = createChainData({ spaces: true })
const chain: Chain = {
  ...baseChain,
  chainId: CHAIN_ID,
  rpcUri: { authentication: 'NO_AUTHENTICATION', value: RPC_URL },
  publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: RPC_URL },
  features: [...baseChain.features, FEATURES.POLICY_RECIPIENT_ALLOWLIST],
}

const chainHandlers = [
  http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chain)),
  http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(chain))),
  http.get(/\/v2\/chains$/, () => HttpResponse.json(createChainsPageDataV2(chain))),
]

const spaceSafesHandler = http.get(/\/v1\/spaces\/[^/]+\/safes$/, () =>
  HttpResponse.json({ safes: { [CHAIN_ID]: [EF_SAFE] } }),
)

const owner = (value: string) => ({ value, name: null, logoUri: null })
const OWNERS = [WALLET, '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2', '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA']

const safeOverviewHandler = http.get(/\/v2\/safes$/, () =>
  HttpResponse.json([
    {
      address: { value: EF_SAFE, name: null, logoUri: null },
      chainId: CHAIN_ID,
      threshold: 2,
      owners: OWNERS.map(owner),
      fiatTotal: '48211',
      queued: 0,
      awaitingConfirmation: null,
    },
  ]),
)

const safeInfoHandler = (version: string) =>
  http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () =>
    HttpResponse.json({
      ...safeFixtures.efSafe,
      chainId: CHAIN_ID,
      version,
      guard: null,
      threshold: 2,
      owners: OWNERS.map(owner),
    }),
  )

const token = (address: string, symbol: string, name: string, logoUri: string, decimals = 6) => ({
  address,
  symbol,
  name,
  logoUri,
  decimals,
})

const nativeToken = token(ZERO_ADDRESS, 'ETH', 'Ether', chain.nativeCurrency.logoUri, 18)
const balances: Balances = {
  fiatTotal: '48211',
  items: [
    {
      tokenInfo: { ...token(SEPOLIA_USDC, 'USDC', 'USD Coin', USDC_LOGO), type: 'ERC20' as const },
      balance: '42310550000',
    },
    {
      tokenInfo: { ...token(SEPOLIA_USDT, 'USDT', 'Tether USD', USDT_LOGO), type: 'ERC20' as const },
      balance: '4200000000',
    },
    { tokenInfo: { ...nativeToken, type: 'NATIVE_TOKEN' as const }, balance: '620000000000000000' },
  ].map((item, index) => ({
    ...item,
    fiatBalance: ['42310.55', '4200', '1700'][index],
    fiatConversion: '1',
    fiatBalance24hChange: '0',
  })),
}
const balancesHandler = http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () =>
  HttpResponse.json(balances),
)

const popularTokens: Erc20TokenMetadata[] = [
  token(SEPOLIA_USDC, 'USDC', 'USD Coin', USDC_LOGO),
  token(SEPOLIA_WETH, 'WETH', 'Wrapped Ether', logo('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'), 18),
  token(SEPOLIA_LINK, 'LINK', 'Chainlink', logo('0x514910771AF9Ca656af840dff83E8264EcF986CA'), 18),
  token(SEPOLIA_DAI, 'DAI', 'Dai Stablecoin', logo('0x6B175474E89094C44Da98b954EedeAC495271d0F'), 18),
  token(SEPOLIA_USDT, 'USDT', 'Tether USD', USDT_LOGO),
  token(SEPOLIA_UNI, 'UNI', 'Uniswap', logo('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'), 18),
].map((item) => ({ ...item, trusted: true, type: 'ERC20' as const }))
const popularTokensHandler = http.get(/\/v1\/chains\/\d+\/tokens(\?|$)/, () => HttpResponse.json(popularTokens))

const PAYROLL = '0x4bc91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60a88b'
const CONTRACTOR = '0x7a219e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b4412'
const OPS_WALLET = '0x1f8e2a3b4c5d6e7f8091a2b3c4d5e6f708195517'
const COINBASE = '0x9cd45e6f708192a3b4c5d6e7f8091a2b3c4d9013'

const spaceContact = (name: string, address: string) => ({
  name,
  address,
  chainIds: [CHAIN_ID],
  createdBy: '',
  createdByUserId: 1,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 1,
  createdAt: '',
  updatedAt: '',
})

const spaceAddressBookHandler = http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () =>
  HttpResponse.json({
    spaceUuid: MOCK_SPACE_ID,
    data: [
      spaceContact('Payroll — Deel', PAYROLL),
      spaceContact('Coinbase Prime', COINBASE),
      spaceContact('Legal counsel', '0x5e2a1b3c4d5e6f708192a3b4c5d6e7f8091a77d0'),
      spaceContact('Payroll provider', '0x9f13a4b5c6d7e8f9012a3b4c5d6e7f8091a2c2a8'),
      spaceContact('Marketing agency', '0x3b47c8d9e0f1a2b3c4d5e6f708192a3b4c5d0e91'),
    ],
  }),
)

const LOCAL_CONTACTS = Object.fromEntries(
  [
    [EF_SAFE, 'Payments'],
    [CONTRACTOR, 'Contractor — M. Ito'],
    [OPS_WALLET, 'Ops wallet'],
    ['0x6a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4', 'savings-safe'],
    ['0x7b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5', 'vault-safe'],
  ].map(([address, name]) => [checksumAddress(address), name]),
)

type RpcRequest = { id: number; method: string; params?: unknown[] }

/** The module guard slot: empty, or a guard the app does not know. */
const rpcHandler = (moduleGuard: string) =>
  http.post(RPC_URL, async ({ request }) => {
    const body = (await request.json()) as RpcRequest | RpcRequest[]
    const respond = ({ id, method, params }: RpcRequest) => {
      if (method === 'eth_chainId') return { jsonrpc: '2.0', id, result: `0x${Number(CHAIN_ID).toString(16)}` }
      if (method === 'eth_getStorageAt') {
        const isModuleSlot = String(params?.[1]).toLowerCase() === MODULE_GUARD_STORAGE_SLOT
        return {
          jsonrpc: '2.0',
          id,
          result: `0x${(isModuleSlot ? moduleGuard : ZERO_ADDRESS).slice(2).padStart(64, '0')}`,
        }
      }
      if (method === 'eth_blockNumber') return { jsonrpc: '2.0', id, result: '0x1' }
      return { jsonrpc: '2.0', id, result: null }
    }
    return HttpResponse.json(Array.isArray(body) ? body.map(respond) : respond(body))
  })

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  layout: 'fullPage',
  shadcn: true,
  pathname: '/spaces/policies',
  query: { spaceId: MOCK_SPACE_ID },
  store: { addressBook: { [CHAIN_ID]: LOCAL_CONTACTS } },
})

const handlers = ({ version = '1.5.0', moduleGuard = ZERO_ADDRESS } = {}) => [
  ...chainHandlers,
  spaceSafesHandler,
  safeOverviewHandler,
  safeInfoHandler(version),
  balancesHandler,
  popularTokensHandler,
  spaceAddressBookHandler,
  rpcHandler(moduleGuard),
  ...setup.handlers,
]

const pickSafe = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const trigger = await canvas.findByRole('combobox', {}, { timeout: 30000 })
  await waitFor(() => expectEnabled(trigger), { timeout: 30000 })
  await userEvent.click(trigger)
  await userEvent.click(await screen.findByRole('option', { name: /Payments/ }, { timeout: 30000 }))
}

const expectEnabled = (element: HTMLElement) => {
  if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
    throw new Error('Not enabled yet')
  }
}

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow',
  component: RecipientAllowlistFlow,
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: handlers() },
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof RecipientAllowlistFlow>

export default meta
type Story = StoryObj<typeof meta>

/** The real TxFlow chrome at Space level with no Safe picked yet. */
export const CreateNoAccount: Story = {
  play: async ({ canvasElement }) => {
    const trigger = await within(canvasElement).findByRole('combobox', {}, { timeout: 30000 })
    await expect(trigger).toBeVisible()
  },
}

/** A Safe picked, its held tokens listed and no recipients yet: the entry row starts open. */
export const CreateNoRecipients: Story = {
  play: async ({ canvasElement }) => {
    await pickSafe(canvasElement)
    await expect(
      await within(canvasElement).findByRole('textbox', { name: RECIPIENT_NAME_LABEL }, { timeout: 30000 }),
    ).toBeVisible()
  },
}

/** USDC left out and four recipients picked from the address book. */
export const Create: Story = {
  play: async ({ canvasElement }) => {
    await pickSafe(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Allow USDC' }, { timeout: 30000 }))
    await userEvent.click(await canvas.findByRole('button', { name: RECIPIENT_REMOVE_LABEL }))
    // Two passes, since one pass lists Workspace contacts before local ones
    for (const names of [['Payroll — Deel', 'Contractor — M. Ito', 'Ops wallet'], ['Coinbase Prime']]) {
      await userEvent.click(await canvas.findByRole('button', { name: ADDRESS_BOOK_TRIGGER_LABEL }))
      for (const name of names) {
        await userEvent.click(await screen.findByRole('checkbox', { name: `Add ${name}` }))
      }
      await userEvent.click(await screen.findByRole('button', { name: /^Add$/ }))
    }
    await expect(await canvas.findByText(/to 4 recipients/)).toBeVisible()
  },
}

/** The Safe has a module guard the app does not know: the form is replaced by the guard banner. */
export const CreateAnotherGuard: Story = {
  parameters: { msw: { handlers: handlers({ moduleGuard: FOREIGN_GUARD }) } },
  play: async ({ canvasElement }) => {
    await pickSafe(canvasElement)
    await expect(
      await within(canvasElement).findByTestId('guard-status-destructive', {}, { timeout: 30000 }),
    ).toBeVisible()
  },
}

/** The Safe's version cannot take a policy guard: it is disabled in the account picker. */
export const CreateOldVersion: Story = {
  parameters: { msw: { handlers: handlers({ version: '1.3.0' }) } },
  play: async ({ canvasElement }) => {
    const trigger = await within(canvasElement).findByRole('combobox', {}, { timeout: 30000 })
    await waitFor(() => expectEnabled(trigger), { timeout: 30000 })
    await userEvent.click(trigger)
    await expect(await screen.findByRole('option', { name: /Payments/ })).toHaveAttribute('aria-disabled', 'true')
  },
}
