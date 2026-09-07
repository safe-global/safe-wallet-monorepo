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

const TREASURY = '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000'
const OPS = '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0'
const PAYROLL = '0x1F2504De05f5167650bE5B28c472601Be434b60A'
const UNNAMED = '0x9F7dfAb2222A473284205cdDF08a677726d786A0'
const UNNAMED_MULTI = '0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB'

const CHAINS: Record<string, ChainInfo> = {
  [ETHEREUM]: { chainId: ETHEREUM, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  [POLYGON]: { chainId: POLYGON, chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
  [SEPOLIA]: { chainId: SEPOLIA, chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' },
  [HOODI]: { chainId: HOODI, chainName: 'Hoodi Testnet', chainLogoUri: null, shortName: 'hoodi' },
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
 * Four chains, so the stack shows three plus a `+1` overflow. Built through the real `groupSafeAccounts`
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

/** No address-book entry and no on-chain name: rows fall back to the shortened address. */
const unnamedSafe = account(ETHEREUM, UNNAMED, { threshold: 1, owners: 2, fiatTotal: '640.19' })

const [unnamedGroup] = groupSafeAccounts([
  account(ETHEREUM, UNNAMED_MULTI, { threshold: 2, owners: 4, fiatTotal: '910.5' }),
  account(POLYGON, UNNAMED_MULTI, { threshold: 2, owners: 4, fiatTotal: '12.25' }),
])

const longNamedTreasury = account(ETHEREUM, TREASURY, {
  name: 'Foundation treasury — long-term reserves and grant disbursements',
})

const defaultAccounts: SafeAccountEntry[] = [treasury, opsGroup, payroll, unnamedSafe]

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

/** A named single-chain Safe, a four-chain group, a proposer-only Safe and an unnamed one. */
export const Default: Story = {
  render: function DefaultStory(args) {
    const [value, setValue] = useState<string | undefined>()
    return <SafeAccountSelector {...args} value={value} onChange={setValue} />
  },
}

export const SingleAccount: Story = {
  args: { accounts: [treasury] },
}

/** Four eligible chains: three logos in the stack plus a `+1` overflow, and four selectable rows. */
export const MultiChainOnly: Story = {
  args: { accounts: [opsGroup] },
}

/** Unnamed Safes read as their shortened address — on a flat row and on a group header alike. */
export const UnnamedAccounts: Story = {
  args: { accounts: [unnamedSafe, unnamedGroup] },
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

/** No wallet connected: the prompt is to connect one, not to switch. */
export const NoWallet: Story = {
  args: { accounts: [], hasWallet: false },
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
