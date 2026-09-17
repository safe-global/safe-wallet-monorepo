import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { createMockStory } from '@/stories/mocks'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { buildSafeAccountId, groupSafeAccounts } from '../SafeAccountSelector/utils'
import { isSafeAccountGroup, type SafeAccountEntry, type SafeAccountOption } from '../SafeAccountSelector/types'
import type { ChainInfo } from '@/features/spaces/types'
import ProposerRoleDialog from './index'

const ETHEREUM = '1'
const POLYGON = '137'

const TREASURY = '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000'
const OPS = '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0'
const PROPOSER = checksumAddress('0x8675B754342754A30A2AeF474D114d8460bca19b')

const CHAINS: Record<string, ChainInfo> = {
  [ETHEREUM]: { chainId: ETHEREUM, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  [POLYGON]: { chainId: POLYGON, chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
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

const opsChain = (chainId: string, fiatTotal: string) =>
  account(chainId, OPS, { name: 'Team operations', threshold: 2, owners: 3, fiatTotal })

const [opsEntry] = groupSafeAccounts([opsChain(ETHEREUM, '48210.42'), opsChain(POLYGON, '0')])

if (!isSafeAccountGroup(opsEntry)) throw new Error('Expected the two-chain fixture to group')

const opsGroup = opsEntry

const accounts: SafeAccountEntry[] = [treasury, opsGroup]

const PROPOSER_NAME = 'Test proposer'

/** Resolves the proposer address to a name in the picker, the way a saved contact does in the app. */
const addressBook = { [DEFAULT_CHAIN_ID]: { [PROPOSER]: PROPOSER_NAME } }

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'none',
  shadcn: true,
  store: { addressBook },
})

const meta = {
  title: 'Features/Spaces/Policies/ProposerRoleDialog',
  component: ProposerRoleDialog,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
  },
  decorators: [setup.decorator],
  tags: ['autodocs'],
  args: {
    open: true,
    accounts,
    onOpenChange: fn(),
    onSubmit: fn(),
    onSafeAccountChange: fn(),
  },
  render: function ProposerRoleDialogStory(args) {
    const [safeAccount, setSafeAccount] = useState(args.safeAccount)

    return (
      <ProposerRoleDialog
        {...args}
        safeAccount={safeAccount}
        onSafeAccountChange={(value) => {
          args.onSafeAccountChange(value)
          setSafeAccount(value)
        }}
      />
    )
  },
} satisfies Meta<typeof ProposerRoleDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing picked yet — Submit stays disabled until an account and a valid proposer are set. */
export const Default: Story = {}

/** Both fields filled, as the design shows them. */
export const Filled: Story = {
  args: {
    safeAccount: treasury.id,
    defaultValues: { proposer: PROPOSER, name: PROPOSER_NAME },
  },
}

/** A multi-chain group in the account picker, alongside the single-chain Safe. */
export const MultiChainAccount: Story = {
  args: {
    safeAccount: opsGroup.accounts[0].id,
    defaultValues: { proposer: PROPOSER },
  },
}

export const AccountsLoading: Story = {
  args: { accounts: [], accountsLoading: true },
}

export const AccountsError: Story = {
  args: { accounts: [], accountsError: true, onAccountsRetry: fn() },
}

/** No wallet connected: the account picker prompts to connect one. */
export const NoWallet: Story = {
  args: { accounts: [], hasWallet: false },
}

export const Submitting: Story = {
  args: {
    safeAccount: treasury.id,
    defaultValues: { proposer: PROPOSER, name: PROPOSER_NAME },
    isSubmitting: true,
  },
}

/** A failed signature surfaces above the footer without clearing the form. */
export const WithError: Story = {
  args: {
    safeAccount: treasury.id,
    defaultValues: { proposer: PROPOSER, name: PROPOSER_NAME },
    errorMessage: <ErrorMessage>Error adding proposer</ErrorMessage>,
  },
}
