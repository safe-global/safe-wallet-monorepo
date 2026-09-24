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
  mockPendingRemoval,
  mockPendingUpdate,
  mockSpendingLimitPolicy,
  asActivePolicy,
} from '../mocks/policies'
import SpendingLimitDrawer, { type SpendingLimitDrawerContentProps } from './SpendingLimitDrawer'

const SAFE = { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: MOCK_SAFE_NAME }

const OVERVIEW = {
  appliesTo: { address: SAFE.address, name: 'Treasury' },
  lastUpdated: 'Sep 22, 2026 · 03:35 UTC',
  enforcedBy: 'Safe allowance module',
}

// Loading is a separate union member, and a union member cannot be assembled from `meta.args`
// plus a story's args, so the content props are spread per story rather than living in the meta.
const CONTENT: SpendingLimitDrawerContentProps = {
  safe: SAFE,
  overview: OVERVIEW,
  transactionLink: 'https://app.safe.global/transactions/tx?id=0x9f3c&safe=eth:0x8675',
  onEdit: fn(),
  onDelete: fn(),
  onReviewTransaction: fn(),
  onConnectWallet: fn(),
  policy: mockActiveSpendingLimit(),
  viewer: MOCK_VIEWERS.signer,
}

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer',
  component: SpendingLimitDrawer,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onClose: fn(),
  },
} satisfies Meta<typeof SpendingLimitDrawer>

export default meta
type Story = StoryObj<typeof SpendingLimitDrawer>

/** 1 — a live limit seen by a signer, who can change or remove it. */
export const ActiveSigner: Story = { args: { ...CONTENT } }

/** 2 — the same limit with no wallet connected; editing needs a signer wallet first. */
export const ActiveNoWallet: Story = { args: { ...CONTENT, viewer: MOCK_VIEWERS.disconnected } }

/** 3 — connected, but this wallet does not sign for the Safe, so both actions stay out of reach. */
export const ActiveNotASigner: Story = { args: { ...CONTENT, viewer: MOCK_VIEWERS.nonSigner } }

/** 4 — queued and unsigned by this signer, who can take it all the way. */
export const PendingNotSigned: Story = {
  args: { ...CONTENT, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.signer },
}

/** 5 — queued, no wallet. The banner says what is needed; the helper names the Safe. */
export const PendingNoWallet: Story = {
  args: { ...CONTENT, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.disconnected },
}

/** 6 — this signer has done their part; the useful action is nudging the others. */
export const PendingAlreadySigned: Story = {
  args: { ...CONTENT, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.signerWhoSigned },
}

/** 7 — a bystander: nothing to sign, nothing to explain, just the link. */
export const PendingNotASigner: Story = {
  args: { ...CONTENT, policy: mockPendingPolicy(), viewer: MOCK_VIEWERS.nonSigner },
}

/** 8 — every signature is in; anyone can execute it now, signer or not. */
export const PendingFullySigned: Story = {
  args: { ...CONTENT, policy: mockFullySignedPending(), viewer: MOCK_VIEWERS.nonSigner },
}

/** A queued removal leaves the limit enforced, so the banner must not say it is inactive. */
export const PendingRemoval: Story = {
  args: { ...CONTENT, policy: mockPendingRemoval(), viewer: MOCK_VIEWERS.signer },
}

/** A queued edit: the current limits still apply until it executes. */
export const PendingUpdate: Story = {
  args: { ...CONTENT, policy: mockPendingUpdate(), viewer: MOCK_VIEWERS.signer },
}

/** Several spenders, each with its own tokens and its own usage. */
export const MultiSpender: Story = { args: { ...CONTENT, policy: asActivePolicy(mockMultiSpenderPolicy()) } }

/** CGW returned a token it has no logo for — the row falls back to the symbol. */
export const MissingTokenMetadata: Story = { args: { ...CONTENT, policy: mockMissingMetadataPolicy() } }

/** The policy's allowances were all removed upstream: the section says so rather than standing empty. */
export const NoLimits: Story = {
  args: {
    ...CONTENT,
    policy: asActivePolicy(mockSpendingLimitPolicy({ id: '0xspending-limit-empty', data: { spenders: [] } })),
  },
}

/** The policy is still being fetched: status, limits and action are all unknown. */
export const Loading: Story = { args: { isLoading: true } }

/** Nothing in the address book: every account reads as its shortened address. */
export const UnnamedAccounts: Story = {
  args: {
    ...CONTENT,
    safe: { address: SAFE.address },
    overview: {
      ...OVERVIEW,
      appliesTo: { address: SAFE.address },
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
    ...CONTENT,
    policy: LONG_NAMES_POLICY,
    names: { [MOCK_ADDRESSES.alice.toLowerCase()]: 'Marketing operations treasury spender team lead' },
    safe: { ...SAFE, name: 'Marketing operations and treasury management' },
    overview: {
      ...OVERVIEW,
      appliesTo: { ...OVERVIEW.appliesTo, name: 'Marketing operations and treasury management' },
    },
  },
}

/** The `names` map resolves a spender's address (keyed in lowercase) to its address book entry. */
export const WithSpenderNames: Story = {
  args: {
    ...CONTENT,
    policy: asActivePolicy(mockMultiSpenderPolicy()),
    names: {
      [MOCK_ADDRESSES.alice.toLowerCase()]: 'Treasury signer',
      [MOCK_ADDRESSES.bob.toLowerCase()]: 'Marketing lead',
    },
  },
}
