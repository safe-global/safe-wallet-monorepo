import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { createMockStory, createNonOwnerWallet } from '@/stories/mocks'
import { buildDelegationOrigin } from '../services/delegationMessages'
import { getCurrentTotp } from '../utils/totp'
import PendingDelegationsList from './PendingDelegationsList'

const efSafe = safeFixtures.efSafe
const parentSafeAddress = efSafe.owners[1].value
const parentSigner = { value: efSafe.owners[3].value, name: null, logoUri: null }
const nestedOnlyOwner = { value: '0x1234567890123456789012345678901234567890', name: null, logoUri: null }

const delegationMessage = (
  delegateAddress: string,
  confirmationsSubmitted: number,
  overrides: Partial<MessageItem> = {},
): MessageItem => ({
  type: 'MESSAGE',
  messageHash: `0x${delegateAddress.slice(2).toLowerCase().padEnd(64, '0')}`,
  status: 'NEEDS_CONFIRMATION',
  logoUri: null,
  name: null,
  message: {
    domain: { name: 'Safe Transaction Service', version: '1.0', chainId: Number(efSafe.chainId) },
    types: {
      Delegate: [
        { name: 'delegateAddress', type: 'address' },
        { name: 'totp', type: 'uint256' },
      ],
    },
    primaryType: 'Delegate',
    message: { delegateAddress, totp: getCurrentTotp() },
  },
  creationTimestamp: Date.now(),
  modifiedTimestamp: Date.now(),
  confirmationsSubmitted,
  confirmationsRequired: 2,
  proposedBy: parentSigner,
  confirmations: [{ owner: parentSigner, signature: `0x${'a'.repeat(130)}` }],
  preparedSignature: null,
  origin: buildDelegationOrigin('add', delegateAddress, efSafe.address.value),
  safeAppInfo: null,
  safeAppId: null,
  ...overrides,
})

const pendingDelegationHandlers = [
  http.get(/\/v1\/chains\/\d+\/owners\/0x[a-fA-F0-9]+\/safes$/, () =>
    HttpResponse.json({ safes: [parentSafeAddress] }),
  ),
  http.get(new RegExp(`/v1/chains/\\d+/safes/${parentSafeAddress}$`), () =>
    HttpResponse.json({
      ...efSafe,
      address: { value: parentSafeAddress, name: null, logoUri: null },
      threshold: 2,
      owners: [nestedOnlyOwner, parentSigner],
    }),
  ),
  http.get(new RegExp(`/v1/chains/\\d+/safes/${parentSafeAddress}/messages`), () =>
    HttpResponse.json({
      count: 2,
      next: null,
      previous: null,
      results: [
        delegationMessage('0x8B2f79E2A9e9C61C71e5eE9152dEa9A05b23e340', 1),
        delegationMessage('0x9913B9180C20C6b0F21B6480c84422F6ebc4B808', 2, {
          status: 'CONFIRMED',
          preparedSignature: `0x${'b'.repeat(260)}`,
        }),
      ],
    }),
  ),
]

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: createNonOwnerWallet(efSafe.chainId, { address: nestedOnlyOwner.value }),
  shadcn: true,
  pathname: '/settings/setup',
})

const meta = {
  title: 'Features/Proposers/PendingDelegationsList',
  component: PendingDelegationsList,
  parameters: {
    layout: 'padded',
    ...setup.parameters,
    msw: { handlers: [...pendingDelegationHandlers, ...setup.handlers] },
  },
  decorators: [setup.decorator],
  tags: ['skip-visual-test'],
} satisfies Meta<typeof PendingDelegationsList>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Proposer delegations a 2-of-2 parent Safe is still collecting signatures for: one waits for the connected
 * owner to sign, the other has all signatures and can be submitted. Skipped from visual tests because the
 * expiry countdown depends on the current time.
 */
export const Default: Story = {}
