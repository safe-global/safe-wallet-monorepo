import { faker } from '@faker-js/faker'
import { AbiCoder, getAddress } from 'ethers'
import type {
  PendingDelayedGuardPoliciesDto,
  PolicyConfigurationDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'
import { buildGuardRemovalCleanupConfigurations } from '@/features/policy-guard/public/services/guardRemoval'
import { mockActiveAllowlist } from '../../../../public/utils/allowlistPolicies'
import { getApplicableCleanup, mergeDelayedGuardRequests } from '../mapDelayedGuardRequests'

const encodeErc20TransferPolicyData = (recipients: string[]): string =>
  AbiCoder.defaultAbiCoder().encode(
    ['tuple(address recipient, uint8 permission)[]'],
    [recipients.map((recipient) => [recipient, 2])],
  )

const resolveToken = (_: string, address: string): PolicyTokenInfo => ({
  address,
  symbol: 'TKN',
  decimals: 18,
  logoUri: null,
})

const makeRequest = (
  safe: { chainId: string; address: string },
  overrides: Partial<PendingDelayedGuardPoliciesDto> = {},
): PendingDelayedGuardPoliciesDto => ({
  kind: 'delayed-guard-policies',
  status: 'pending-application',
  safe,
  guard: faker.finance.ethereumAddress(),
  root: faker.string.hexadecimal({ length: 64 }),
  configurations: [
    {
      target: faker.finance.ethereumAddress(),
      selector: '0xa9059cbb',
      operation: 0,
      policy: faker.finance.ethereumAddress(),
      data: encodeErc20TransferPolicyData([faker.finance.ethereumAddress()]),
    },
  ],
  readyAt: 1_800_000_000,
  expiresAt: 1_800_604_800,
  transaction: null,
  createdAt: null,
  ...overrides,
})

const removalConfiguration = (safeAddress: string, policy: string): PolicyConfigurationDto => ({
  target: safeAddress,
  selector: '0xe19a9dd9',
  operation: 0,
  policy,
  data: '0x',
})

const queuedTransaction = () => ({
  safeTxHash: faker.string.hexadecimal({ length: 64 }),
  nonce: 3,
  confirmations: 1,
  confirmationsRequired: 2,
  proposedAt: 1_800_100_000,
  proposer: null,
})

describe('mergeDelayedGuardRequests', () => {
  it('should, when the Safe has a live allowlist, show a waiting request on its row with the resulting entries and its changes', () => {
    const live = mockActiveAllowlist()
    const recipient = faker.finance.ethereumAddress()
    const token = faker.finance.ethereumAddress()
    const request = makeRequest(live.safe, {
      configurations: [
        {
          target: token,
          selector: '0xa9059cbb',
          operation: 0,
          policy: faker.finance.ethereumAddress(),
          data: encodeErc20TransferPolicyData([recipient]),
        },
      ],
    })

    const { policies, applyRequests } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(policies).toEqual([
      expect.objectContaining({
        id: live.id,
        status: 'active',
        data: {
          entries: [
            ...live.data.entries,
            { token: resolveToken('', token), recipients: [{ account: getAddress(recipient), permission: 'ALWAYS' }] },
          ],
          changes: {
            recipients: [
              ...getAllowlistRecipients(live.data).map((address) => ({ address })),
              { address: getAddress(recipient), change: 'added' },
            ],
            tokens: [...live.data.entries.map((entry) => entry.token), { ...resolveToken('', token), change: 'added' }],
          },
        },
        scheduledChange: {
          operation: 'update',
          appliesAt: 1_800_000_000,
          expiresAt: 1_800_604_800,
          root: request.root,
        },
      }),
    ])
    expect(applyRequests.get(live.id)).toMatchObject({ guardAddress: request.guard })
  })

  it("should, when a waiting request binds the Safe's setGuard, show the removal on the live row with its entries", () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe, {
      configurations: [removalConfiguration(live.safe.address, faker.finance.ethereumAddress())],
    })

    const { policies, applyRequests } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(policies).toEqual([
      expect.objectContaining({
        id: live.id,
        status: 'active',
        data: live.data,
        scheduledChange: {
          operation: 'remove',
          appliesAt: 1_800_000_000,
          expiresAt: 1_800_604_800,
          root: request.root,
        },
      }),
    ])
    expect(applyRequests.get(live.id)).toMatchObject({ guardAddress: request.guard })
  })

  it('should, when a removal is still in signing, show it as a queued request on the live row with the live entries', () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe, {
      status: 'configuration-in-signing',
      transaction: queuedTransaction(),
      configurations: [removalConfiguration(live.safe.address, faker.finance.ethereumAddress())],
    })

    const { policies } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(policies).toEqual([
      expect.objectContaining({
        id: live.id,
        status: 'pending',
        operation: 'remove',
        step: 'request',
        root: request.root,
        data: live.data,
      }),
    ])
  })

  it("should, when a removal's cleanup root waits, leave the live row as it is and keep the root for the guard removal", () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe, {
      configurations: buildGuardRemovalCleanupConfigurations(live.safe.chainId, live.safe.address),
    })

    const { policies, applyRequests, guardRemovalCleanups } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(policies).toEqual([live])
    expect(applyRequests.size).toBe(0)
    expect(guardRemovalCleanups.get(live.id)).toEqual({
      configurations: request.configurations,
      readyAt: 1_800_000_000,
      expiresAt: 1_800_604_800,
    })
  })

  it("should, when a removal's cleanup root has expired, keep neither a row nor the root", () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe, {
      status: 'expired',
      configurations: buildGuardRemovalCleanupConfigurations(live.safe.chainId, live.safe.address),
    })

    const { policies, guardRemovalCleanups } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(policies).toEqual([live])
    expect(guardRemovalCleanups.size).toBe(0)
  })

  it('should, when the Safe has no live allowlist, add a first allowlist as a row of its own', () => {
    const safe = { chainId: '11155111', address: faker.finance.ethereumAddress() }
    const request = makeRequest(safe)

    const { policies, applyRequests } = mergeDelayedGuardRequests([request], [], resolveToken)

    expect(policies).toEqual([
      expect.objectContaining({
        id: `${safe.chainId}:${safe.address}:${request.root}`,
        status: 'active',
        scheduledChange: expect.objectContaining({ operation: 'create' }),
      }),
    ])
    expect(policies[0].data).not.toHaveProperty('changes')
    expect(applyRequests.get(policies[0].id)).toBeDefined()
  })

  it('should, when an expired request and a new one in signing wait on the same Safe, show the new one on the live row', () => {
    const live = mockActiveAllowlist()
    const expired = makeRequest(live.safe, { status: 'expired', readyAt: 1_700_000_000, expiresAt: 1_700_604_800 })
    const requestedAgain = makeRequest(live.safe, {
      status: 'configuration-in-signing',
      readyAt: null,
      expiresAt: null,
      transaction: queuedTransaction(),
    })

    const { policies } = mergeDelayedGuardRequests([expired, requestedAgain], [live], resolveToken)

    expect(policies).toEqual([
      expect.objectContaining({ id: live.id, status: 'pending', step: 'request', root: requestedAgain.root }),
    ])
  })

  it('should mark the recipients a queued update revokes as removed, when the Safe has a live allowlist', () => {
    const live = mockActiveAllowlist()
    const [usdc, usdt] = live.data.entries
    const [alice, bob] = usdt.recipients
    const request = makeRequest(live.safe, {
      status: 'configuration-in-signing',
      transaction: queuedTransaction(),
      configurations: [
        {
          target: usdc.token.address,
          selector: '0xa9059cbb',
          operation: 0,
          policy: faker.finance.ethereumAddress(),
          data: AbiCoder.defaultAbiCoder().encode(
            ['tuple(address recipient, uint8 permission)[]'],
            [usdc.recipients.slice(1).map(({ account }) => [account, 0])],
          ),
        },
        {
          target: usdc.token.address,
          selector: '0xa9059cbb',
          operation: 0,
          policy: '0x0000000000000000000000000000000000000000',
          data: '0x',
        },
      ],
    })

    const { policies } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(policies).toEqual([
      expect.objectContaining({
        id: live.id,
        status: 'pending',
        operation: 'update',
        data: {
          entries: [usdt],
          changes: {
            recipients: [
              { address: alice.account },
              { address: bob.account },
              { address: usdc.recipients[2].account, change: 'removed' },
            ],
            tokens: [usdt.token, { ...usdc.token, change: 'removed' }],
          },
        },
      }),
    ])
  })

  it('should, when the Safe has a live allowlist, show a queued apply as a pending update on its row', () => {
    const live = mockActiveAllowlist()

    const { policies } = mergeDelayedGuardRequests(
      [makeRequest(live.safe, { status: 'application-in-signing', transaction: queuedTransaction() })],
      [live],
      resolveToken,
    )

    expect(policies).toEqual([
      expect.objectContaining({ id: live.id, status: 'pending', operation: 'update', step: 'apply' }),
    ])
  })

  it('should, when no request is waiting, return the active rows as they are', () => {
    const live = mockActiveAllowlist()

    const { policies, applyRequests } = mergeDelayedGuardRequests([], [live], resolveToken)

    expect(policies).toEqual([live])
    expect(applyRequests.size).toBe(0)
  })
})

describe('getApplicableCleanup', () => {
  it('should, when the cleanup root is in its apply window, return its configurations', () => {
    const configurations = [
      removalConfiguration(faker.finance.ethereumAddress(), '0x0000000000000000000000000000000000000000'),
    ]

    const applicable = getApplicableCleanup(
      { configurations, readyAt: 1_800_000_000, expiresAt: 1_800_604_800 },
      1_800_000_000 * 1_000,
    )

    expect(applicable).toBe(configurations)
  })

  it('should, when the cleanup root has expired, return nothing', () => {
    const configurations = [
      removalConfiguration(faker.finance.ethereumAddress(), '0x0000000000000000000000000000000000000000'),
    ]

    const applicable = getApplicableCleanup(
      { configurations, readyAt: 1_800_000_000, expiresAt: 1_800_604_800 },
      1_800_604_800 * 1_000,
    )

    expect(applicable).toBeUndefined()
  })

  it('should, when the delay of the cleanup root is not over, return nothing', () => {
    const configurations = [
      removalConfiguration(faker.finance.ethereumAddress(), '0x0000000000000000000000000000000000000000'),
    ]

    const applicable = getApplicableCleanup(
      { configurations, readyAt: 1_800_000_000, expiresAt: 1_800_604_800 },
      1_799_999_999 * 1_000,
    )

    expect(applicable).toBeUndefined()
  })
})
