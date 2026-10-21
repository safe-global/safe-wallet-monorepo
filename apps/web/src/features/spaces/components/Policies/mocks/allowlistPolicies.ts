import type {
  AllowlistPolicy,
  AllowlistRecipient,
  QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { MOCK_ADDRESSES, MOCK_SAFES, MOCK_TOKENS, asActivePolicy } from './policies'

const POLICY_GUARD = '0x1a4F7b8C9d0E1f2A3b4C5d6E7f8091A2b3C4c802'

const RECIPIENTS: AllowlistRecipient[] = [
  { account: MOCK_ADDRESSES.alice, permission: 'ALWAYS' },
  { account: MOCK_ADDRESSES.bob, permission: 'ALWAYS' },
  { account: MOCK_ADDRESSES.unresolved, permission: 'ONCE' },
]

export const mockAllowlistPolicy = (overrides: Partial<AllowlistPolicy> = {}): AllowlistPolicy => ({
  id: '0xallowlist-treasury',
  type: 'allowlist',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'guard', guardAddress: POLICY_GUARD },
  enabled: true,
  data: {
    entries: [
      { token: MOCK_TOKENS.usdc, recipients: RECIPIENTS },
      { token: MOCK_TOKENS.usdt, recipients: RECIPIENTS.slice(0, 2) },
    ],
  },
  ...overrides,
})

export const mockActiveAllowlist = (): AllowlistPolicy & { status: 'active' } => asActivePolicy(mockAllowlistPolicy())

/** Queued and short of its threshold. */
export const mockPendingAllowlist = (overrides: Partial<QueuedAllowlistPolicy> = {}): QueuedAllowlistPolicy => ({
  ...mockAllowlistPolicy({ id: '0xallowlist-pending', safe: MOCK_SAFES.payroll }),
  status: 'pending',
  operation: 'create',
  safeTxHash: '0x4b7e2c9a1d3f5e60718293a4b5c6d7e8f9012345678990abcdef0123456789cd',
  nonce: 43,
  confirmationsSubmitted: 1,
  confirmationsRequired: 2,
  proposedAt: 1_781_300_000,
  ...overrides,
})

/** Every signature collected; the transaction is waiting only for execution. */
export const mockFullySignedPendingAllowlist = (): QueuedAllowlistPolicy =>
  mockPendingAllowlist({ id: '0xallowlist-pending-full', confirmationsSubmitted: 2 })

export const mockPendingAllowlistUpdate = (): QueuedAllowlistPolicy =>
  mockPendingAllowlist({ id: '0xallowlist-pending-update', operation: 'update' })

export const mockPendingAllowlistRemoval = (): QueuedAllowlistPolicy =>
  mockPendingAllowlist({ id: '0xallowlist-pending-remove', operation: 'remove' })
