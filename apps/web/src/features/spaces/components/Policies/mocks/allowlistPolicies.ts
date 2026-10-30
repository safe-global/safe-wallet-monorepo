import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  isAllowlistPolicy,
  type AllowlistPolicy,
  type AllowlistRecipient,
  type FailedAllowlistPolicy,
  type PolicyTokenInfo,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { mapActivePolicies } from '../utils/mapActivePolicies'
import { MODULE_GUARD_ONLY, TRANSACTION_GUARD_ONLY, mockTreasuryAllowlistDtos } from './activePolicies'
import { MOCK_ADDRESSES, MOCK_SAFES, MOCK_TOKENS, asActivePolicy } from './policies'

const POLICY_GUARD = '0x1a4F7b8C9d0E1f2A3b4C5d6E7f8091A2b3C4c802'

const DAY = 86_400

const secondsFromNow = (seconds: number): number => Math.floor(Date.now() / 1_000) + seconds

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
  spendingLimitsCovered: true,
  data: {
    entries: [
      { token: MOCK_TOKENS.usdc, recipients: RECIPIENTS },
      { token: MOCK_TOKENS.usdt, recipients: RECIPIENTS.slice(0, 2) },
    ],
  },
  ...overrides,
})

export const mockActiveAllowlist = (): AllowlistPolicy & { status: 'active' } => asActivePolicy(mockAllowlistPolicy())

const MOCK_ETH: PolicyTokenInfo = {
  address: ZERO_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
}

/** The treasury's allowlist as CGW sends it: ERC20 tokens named by their metadata, ETH by the chain config. */
export const mockCgwAllowlist = (
  dtos: ActivePolicyDto[] = mockTreasuryAllowlistDtos(),
): AllowlistPolicy & { status: 'active' } => {
  const policy = mapActivePolicies(dtos, () => MOCK_ETH).find(isAllowlistPolicy)
  if (policy?.status !== 'active') throw new Error('The DTOs map to no active allowlist')

  return policy
}

export const mockCgwUnenforcedAllowlist = (): AllowlistPolicy & { status: 'active' } =>
  mockCgwAllowlist(mockTreasuryAllowlistDtos(MODULE_GUARD_ONLY))

export const mockCgwUncoveredAllowlist = (): AllowlistPolicy & { status: 'active' } =>
  mockCgwAllowlist(mockTreasuryAllowlistDtos(TRANSACTION_GUARD_ONLY))

/** The transaction slot is empty, so the row reads "Not enforced". */
export const mockUnenforcedAllowlist = (): AllowlistPolicy & { status: 'active' } =>
  asActivePolicy(mockAllowlistPolicy({ id: '0xallowlist-unenforced', enabled: false }))

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
  expiresAt: secondsFromNow(6.5 * DAY),
  ...overrides,
})

/** Every signature collected; the transaction is waiting only for execution. */
export const mockFullySignedPendingAllowlist = (): QueuedAllowlistPolicy =>
  mockPendingAllowlist({ id: '0xallowlist-pending-full', confirmationsSubmitted: 2 })

/** Its signing window closed before every signature was in. */
export const mockExpiredPendingAllowlist = (): QueuedAllowlistPolicy =>
  mockPendingAllowlist({ id: '0xallowlist-expired', expiresAt: secondsFromNow(-DAY) })

export const mockPendingAllowlistUpdate = (): QueuedAllowlistPolicy =>
  mockPendingAllowlist({ id: '0xallowlist-pending-update', operation: 'update' })

export const mockPendingAllowlistRemoval = (): QueuedAllowlistPolicy =>
  mockPendingAllowlist({ id: '0xallowlist-pending-remove', operation: 'remove' })

/** A new allowlist, executed and waiting out the guard's delay before it is enforced. */
export const mockActivatingAllowlist = (): AllowlistPolicy & { status: 'active' } =>
  asActivePolicy(
    mockAllowlistPolicy({
      id: '0xallowlist-activating',
      scheduledChange: {
        operation: 'create',
        appliesAt: secondsFromNow(DAY - 60),
        expiresAt: secondsFromNow(8 * DAY - 60),
        requestedAt: secondsFromNow(-60),
      },
    }),
  )

/** The guard's delay is over: the request can be applied until its window closes. */
export const mockReadyToApplyAllowlist = (
  operation: 'create' | 'update' = 'create',
): AllowlistPolicy & { status: 'active' } =>
  asActivePolicy(
    mockAllowlistPolicy({
      id: `0xallowlist-ready-${operation}`,
      scheduledChange: {
        operation,
        appliesAt: secondsFromNow(-DAY),
        expiresAt: secondsFromNow(6 * DAY),
        requestedAt: secondsFromNow(-2 * DAY),
      },
    }),
  )

/** Nobody applied the request before its window closed. */
export const mockExpiredRequestAllowlist = (
  operation: 'create' | 'update' = 'create',
): AllowlistPolicy & { status: 'active' } =>
  asActivePolicy(
    mockAllowlistPolicy({
      id: `0xallowlist-expired-request-${operation}`,
      scheduledChange: {
        operation,
        appliesAt: secondsFromNow(-8 * DAY),
        expiresAt: secondsFromNow(-DAY),
        requestedAt: secondsFromNow(-9 * DAY),
      },
    }),
  )

/** A live allowlist with an executed edit waiting out the guard's delay. */
export const mockAllowlistChangePending = (): AllowlistPolicy & { status: 'active' } =>
  asActivePolicy(
    mockAllowlistPolicy({
      id: '0xallowlist-change-pending',
      scheduledChange: {
        operation: 'update',
        appliesAt: secondsFromNow(DAY - 60),
        expiresAt: secondsFromNow(8 * DAY - 60),
        requestedAt: secondsFromNow(-60),
      },
    }),
  )

/** Executed but reverted: nothing changed on the Safe. */
export const mockFailedAllowlist = (): FailedAllowlistPolicy => ({
  ...mockFullySignedPendingAllowlist(),
  id: '0xallowlist-failed',
  status: 'failed',
})
