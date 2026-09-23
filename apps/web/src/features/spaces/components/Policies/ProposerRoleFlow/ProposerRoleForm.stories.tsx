import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { fn } from 'storybook/test'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { createMockStory } from '@/stories/mocks'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { buildSafeAccountId, groupSafeAccounts } from '../SafeAccountSelector/utils'
import { isSafeAccountGroup, type SafeAccountEntry, type SafeAccountOption } from '../SafeAccountSelector/types'
import type { ChainInfo } from '@/features/spaces/types'
import ProposerRoleForm from './ProposerRoleForm'

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
const eligible = { accounts, isLoading: false, isError: false, hasWallet: true, refetch: fn() }

const PROPOSER_NAME = 'Test proposer'

const LOCAL_CONTACT = checksumAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')
const SPACE_CONTACT = checksumAddress('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359')

/** Keyed by the chain the `eth:` route resolves to — `AddressBookInput` filters contacts by chain. */
const localAddressBook = { [ETHEREUM]: { [PROPOSER]: PROPOSER_NAME, [LOCAL_CONTACT]: 'Local contact' } }

const SPACE_ID = '1'

/** `useGetSpaceAddressBook` skips without a live session and a Workspace in scope. */
const spaceAuth = { sessionExpiresAt: Date.now() + 60 * 60 * 1000, lastUsedSpaceId: SPACE_ID }

const spaceContact = (address: string, name: string): SpaceAddressBookItemDto => ({
  name,
  address,
  chainIds: [ETHEREUM],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
})

/** Workspace contacts reach the picker over the wire; local ones come from Redux. */
const spaceAddressBookHandler = http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () =>
  HttpResponse.json({
    spaceUuid: SPACE_ID,
    data: [spaceContact(SPACE_CONTACT, 'Workspace contact'), spaceContact(TREASURY, 'Workspace treasury')],
  }),
)

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'none',
  shadcn: true,
  // Also what marks the session authenticated, which the Workspace address book needs.
  features: { spaces: true },
  store: { addressBook: localAddressBook, auth: spaceAuth },
  query: { spaceId: SPACE_ID },
})

const meta = {
  title: 'Features/Spaces/Policies/ProposerRoleForm',
  component: ProposerRoleForm,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
    // First: the factory's handlers are appended, and MSW is first-match-wins.
    msw: { handlers: [spaceAddressBookHandler, ...setup.handlers] },
  },
  decorators: [setup.decorator],
  tags: ['autodocs'],
  args: {
    safeAccounts: eligible,
    onSubmit: fn(),
    onSafeAccountChange: fn(),
  },
  render: function ProposerRoleFormStory(args) {
    const [safeAccount, setSafeAccount] = useState(args.safeAccount)

    // Same width as the tx-flow card column the form lives in.
    return (
      <div className="w-full min-[900px]:max-w-[672px]">
        <ProposerRoleForm
          {...args}
          safeAccount={safeAccount}
          onSafeAccountChange={(value) => {
            args.onSafeAccountChange(value)
            setSafeAccount(value)
          }}
        />
      </div>
    )
  },
} satisfies Meta<typeof ProposerRoleForm>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing picked yet, so Submit stays disabled. */
export const Default: Story = {}

export const Filled: Story = {
  args: {
    safeAccount: treasury.id,
    defaultValues: { proposer: PROPOSER, name: PROPOSER_NAME },
  },
}

export const MultiChainAccount: Story = {
  args: {
    safeAccount: opsGroup.accounts[0].id,
    defaultValues: { proposer: PROPOSER },
  },
}

export const AccountsLoading: Story = {
  args: { safeAccounts: { ...eligible, accounts: [], isLoading: true } },
}

export const AccountsError: Story = {
  args: { safeAccounts: { ...eligible, accounts: [], isError: true } },
}

export const NoWallet: Story = {
  args: { safeAccounts: { ...eligible, accounts: [], hasWallet: false } },
}

/** The Workspace has Safes, but none this wallet can set a policy on. */
export const NoEligibleAccounts: Story = {
  args: { safeAccounts: { ...eligible, accounts: [] } },
}

export const Submitting: Story = {
  args: {
    safeAccount: treasury.id,
    defaultValues: { proposer: PROPOSER, name: PROPOSER_NAME },
    isSubmitting: true,
  },
}

/** The error surfaces above the footer without clearing the form. */
export const WithError: Story = {
  args: {
    safeAccount: treasury.id,
    defaultValues: { proposer: PROPOSER, name: PROPOSER_NAME },
    errorMessage: <ErrorMessage>Error adding proposer</ErrorMessage>,
  },
}
