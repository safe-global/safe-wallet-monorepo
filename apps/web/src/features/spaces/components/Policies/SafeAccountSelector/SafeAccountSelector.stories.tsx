import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { fn } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import SafeAccountSelector from './index'
import { buildSafeAccountId, groupSafeAccounts } from './utils'
import type { ChainInfo } from '@/features/spaces/types'
import type { SafeAccountEntry, SafeAccountOption } from './types'

// Ids the story fixtures serve, so the chain logos resolve.
const ETHEREUM = '1'
const POLYGON = '137'
const SEPOLIA = '11155111'
const HOODI = '560048'
// Not in the fixtures: they sort last by name, so they land in the `+N` overflow rather than showing as
// unknown-network icons in the three visible slots.
const UNICHAIN = '130'
const ZKSYNC = '324'

const TREASURY = '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000'
const OPS = '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0'
const PAYROLL = '0x1F2504De05f5167650bE5B28c472601Be434b60A'

const CHAINS: Record<string, ChainInfo> = {
  [ETHEREUM]: { chainId: ETHEREUM, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  [POLYGON]: { chainId: POLYGON, chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
  [SEPOLIA]: { chainId: SEPOLIA, chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' },
  [HOODI]: { chainId: HOODI, chainName: 'Hoodi Testnet', chainLogoUri: null, shortName: 'hoodi' },
  [UNICHAIN]: { chainId: UNICHAIN, chainName: 'Unichain', chainLogoUri: null, shortName: 'uni' },
  [ZKSYNC]: { chainId: ZKSYNC, chainName: 'ZKsync Era', chainLogoUri: null, shortName: 'zksync' },
}

const account = (chainId: string, address: string, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  threshold: 3,
  owners: 5,
  eligibility: 'signer',
  chain: CHAINS[chainId],
  fiatTotal: '123720',
  ...extra,
})

const treasury = account(ETHEREUM, TREASURY, { name: 'Treasury' })

const opsChain = (chainId: string, extra: Partial<SafeAccountOption> = {}) =>
  account(chainId, OPS, { name: 'Team operations', threshold: 2, owners: 3, ...extra })

/**
 * Six chains, so the stack shows three plus a `+3` overflow. Built through the real `groupSafeAccounts`
 * so the header's total, threshold and ordering cannot drift from what production derives.
 */
const [opsGroup] = groupSafeAccounts([
  opsChain(ETHEREUM, { fiatTotal: '48210.42' }),
  opsChain(POLYGON, { fiatTotal: '0' }),
  opsChain(SEPOLIA, { eligibility: 'proposer' }),
  opsChain(HOODI, { fiatTotal: '1250.75' }),
])

const payroll = account(POLYGON, PAYROLL, {
  name: 'Payroll',
  eligibility: 'proposer',
  threshold: 1,
  owners: 4,
  fiatTotal: '0',
})

const longNamedTreasury = account(ETHEREUM, TREASURY, {
  name: 'Foundation treasury — long-term reserves and grant disbursements',
})

const defaultAccounts: SafeAccountEntry[] = [treasury, opsGroup, payroll]

const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected', layout: 'none', shadcn: true })

const meta = {
  title: 'Features/Spaces/Policies/SafeAccountSelector',
  component: SafeAccountSelector,
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
    ...setup.parameters,
  },
  decorators: [
    setup.decorator,
    // The row layout is sized for the policy dialog's form column.
    (Story) => (
      <div className="w-[545px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: {
    accounts: defaultAccounts,
    onChange: fn(),
    onSwitchWallet: fn(),
  },
} satisfies Meta<typeof SafeAccountSelector>

export default meta
type Story = StoryObj<typeof meta>

/** A single-chain Safe, a Safe eligible on six chains (grouped), and a proposer-only Safe. */
export const Default: Story = {
  render: function DefaultStory(args) {
    const [value, setValue] = useState<string | undefined>()
    return <SafeAccountSelector {...args} value={value} onChange={setValue} />
  },
}

export const SingleAccount: Story = {
  args: { accounts: [treasury] },
}

/** Six eligible chains: three logos in the stack plus a `+3` overflow, and six selectable rows. */
export const MultiChainOnly: Story = {
  args: { accounts: [opsGroup] },
}

export const Selected: Story = {
  args: { value: treasury.id },
}

export const Loading: Story = {
  args: { accounts: [], isLoading: true },
}

export const Error: Story = {
  args: { accounts: [], isError: true, onRetry: fn() },
}

/** The Space has Safes, but none this wallet is a signer or proposer on. */
export const NoEligibleAccounts: Story = {
  args: { accounts: [] },
}

/** Selected on purpose: the trigger is the tightest place a long name has to ellipsize. */
export const LongSafeName: Story = {
  args: {
    accounts: [longNamedTreasury],
    value: longNamedTreasury.id,
  },
}

export const Disabled: Story = {
  args: { value: treasury.id, disabled: true },
}

export const WithValidationError: Story = {
  args: { errorMessage: 'Select a Safe Account' },
}
