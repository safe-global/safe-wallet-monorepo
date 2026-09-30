import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import {
  MOCK_ADDRESSES,
  MOCK_SAFE_NAME,
  MOCK_VIEWERS,
  mockActiveSpendingLimit,
  mockFullySignedPending,
  mockMissingMetadataPolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockPendingUpdate,
  mockSpendingLimitPolicy,
  mockUnenforcedPolicy,
  asActivePolicy,
} from '../mocks/policies'
import { createMockStory } from '@/stories/mocks'
import SpendingLimitDrawer from './SpendingLimitDrawer'

const SAFE = { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: MOCK_SAFE_NAME }

const TRANSACTION_LINK = 'https://app.safe.global/transactions/tx?id=0x9f3c&safe=eth:0x8675'

const PENDING_ARGS = { transactionLink: TRANSACTION_LINK, onReviewTransaction: fn() }

const OVERVIEW = {
  lastUpdated: 'Sep 22, 2026 · 03:35 UTC',
  enforcedBy: 'Safe allowance module',
}

// The drawer derives the explorer link from chain config, so the stories need the chains endpoint.
const setup = createMockStory({ layout: 'none' })

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer',
  component: SpendingLimitDrawer,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: { ...setup.parameters, layout: 'fullscreen' },
  decorators: [setup.decorator],
  args: {
    open: true,
    onClose: fn(),
    safe: SAFE,
    overview: OVERVIEW,
    onEdit: fn(),
    onConnectWallet: fn(),
    policy: mockActiveSpendingLimit(),
    viewer: MOCK_VIEWERS.signer,
  },
} satisfies Meta<typeof SpendingLimitDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** 1 — a live limit seen by a signer, who can change or remove it. */
export const ActiveSigner: Story = {}

/** 2 — the same limit with no wallet connected; editing needs a signer wallet first. */
export const ActiveNoWallet: Story = { args: { viewer: MOCK_VIEWERS.disconnected } }

/** 3 — connected, but this wallet does not sign for the Safe, so both actions stay out of reach. */
export const ActiveNotASigner: Story = { args: { viewer: MOCK_VIEWERS.nonSigner } }

/** 4 — queued and unsigned by this signer, who can take it all the way. */
export const PendingNotSigned: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.signer },
}

/** 5 — queued, no wallet. The banner says what is needed; the helper names the Safe. */
export const PendingNoWallet: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.disconnected },
}

/** 6 — this signer has done their part; the useful action is nudging the others. */
export const PendingAlreadySigned: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.signerWhoSigned },
}

/** 7 — a bystander: nothing to sign, nothing to explain, just the link. */
export const PendingNotASigner: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.nonSigner },
}

/** 8 — every signature is in; anyone can execute it now, signer or not. */
export const PendingFullySigned: Story = {
  args: { ...PENDING_ARGS, policy: mockFullySignedPending(), viewer: MOCK_VIEWERS.nonSigner },
}

/** A queued edit: the current limits still apply until it executes. */
export const PendingUpdate: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingUpdate(), viewer: MOCK_VIEWERS.signer },
}

/** The module is configured but not enabled, so the limit governs nothing and cannot be managed. */
export const Unenforced: Story = { args: { policy: asActivePolicy(mockUnenforcedPolicy()) } }

/** The edit flow has not shipped yet, so a signer sees the action explained rather than dead. */
export const ActiveWithoutEditFlow: Story = { args: { onEdit: undefined } }

/** Several spenders, each with its own tokens and its own usage. */
export const MultiSpender: Story = { args: { policy: asActivePolicy(mockMultiSpenderPolicy()) } }

/** CGW returned a token it has no logo for — the row falls back to the symbol. */
export const MissingTokenMetadata: Story = { args: { policy: mockMissingMetadataPolicy() } }

/** Nothing in the address book: every account reads as its shortened address. */
export const UnnamedAccounts: Story = {
  args: {
    safe: { address: SAFE.address },
    overview: {
      ...OVERVIEW,
    },
  },
}

const LONG_NAMES_POLICY = asActivePolicy(
  mockSpendingLimitPolicy({
    id: '0xspending-limit-long-names',
    data: {
      spenders: [
        {
          spender: MOCK_ADDRESSES.alice,
          allowances: [
            {
              token: {
                ...mockActiveSpendingLimit().data.spenders[0].allowances[0].token,
                symbol: 'MARKETINGOPSTREASURYTOKEN',
              },
              amount: '1500000000',
              spent: '1000000000',
              remaining: '500000000',
              resetPeriodMinutes: 30 * 1_440,
              resetsAtMinute: 29_846_880,
            },
          ],
        },
      ],
    },
  }),
)

/** Long Safe, spender and token names — they truncate rather than push the layout out of the drawer. */
export const LongNames: Story = {
  args: {
    policy: LONG_NAMES_POLICY,
    names: { [MOCK_ADDRESSES.alice]: 'Marketing operations treasury spender team lead' },
    safe: { ...SAFE, name: 'Marketing operations and treasury management' },
  },
}

/** The `names` map resolves a spender's address (keyed in lowercase) to its address book entry. */
export const WithSpenderNames: Story = {
  args: {
    policy: asActivePolicy(mockMultiSpenderPolicy()),
    // Checksummed keys, as the address book returns them — the lookup is case-insensitive.
    names: {
      [MOCK_ADDRESSES.alice]: 'Treasury signer',
      [MOCK_ADDRESSES.bob]: 'Marketing lead',
    },
  },
}
