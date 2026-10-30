import { faker } from '@faker-js/faker'
import { AbiCoder, getAddress } from 'ethers'
import type {
  PendingDelayedGuardPoliciesDto,
  PolicyConfigurationDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import { mockActiveAllowlist } from '../../mocks/allowlistPolicies'
import { mergeDelayedGuardRequests } from '../mapDelayedGuardRequests'

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
  it('should add a waiting request as its own row with the requested entries, when the Safe has a live allowlist', () => {
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

    const { added, applyRequests } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(added).toEqual([
      expect.objectContaining({
        status: 'active',
        data: {
          entries: [
            { token: resolveToken('', token), recipients: [{ account: getAddress(recipient), permission: 'ALWAYS' }] },
          ],
        },
        scheduledChange: { operation: 'update', appliesAt: 1_800_000_000, expiresAt: 1_800_604_800 },
      }),
    ])
    expect(added[0].id).not.toBe(live.id)
    expect(applyRequests.get(added[0].id)).toMatchObject({ guardAddress: request.guard })
    expect(applyRequests.has(live.id)).toBe(false)
  })

  it("should list the live allowlist's entries on a waiting removal's own row, when the request binds its setGuard", () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe, {
      configurations: [removalConfiguration(live.safe.address, faker.finance.ethereumAddress())],
    })

    const { added, applyRequests } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(added).toEqual([
      expect.objectContaining({
        status: 'active',
        data: live.data,
        scheduledChange: { operation: 'remove', appliesAt: 1_800_000_000, expiresAt: 1_800_604_800 },
      }),
    ])
    expect(applyRequests.get(added[0].id)).toMatchObject({ guardAddress: request.guard })
  })

  it("should list the live allowlist's entries on a queued removal, when the removal is still in signing", () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe, {
      status: 'configuration-in-signing',
      transaction: queuedTransaction(),
      configurations: [removalConfiguration(live.safe.address, faker.finance.ethereumAddress())],
    })

    const { added } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(added).toEqual([expect.objectContaining({ status: 'pending', operation: 'remove', data: live.data })])
  })

  it('should add a waiting request as an update, when it only unbinds the setGuard rule a removal left', () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe, {
      configurations: [removalConfiguration(live.safe.address, '0x0000000000000000000000000000000000000000')],
    })

    const { added } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(added).toEqual([
      expect.objectContaining({ scheduledChange: expect.objectContaining({ operation: 'update' }) }),
    ])
  })

  it('should add a first allowlist as its own row, when the Safe has none', () => {
    const safe = { chainId: '11155111', address: faker.finance.ethereumAddress() }

    const { added, applyRequests } = mergeDelayedGuardRequests([makeRequest(safe)], [], resolveToken)

    expect(added).toEqual([
      expect.objectContaining({ status: 'active', scheduledChange: expect.objectContaining({ operation: 'create' }) }),
    ])
    expect(applyRequests.get(added[0].id)).toBeDefined()
  })

  it('should add a queued apply as a pending update row, when the Safe has a live allowlist', () => {
    const live = mockActiveAllowlist()

    const { added } = mergeDelayedGuardRequests(
      [makeRequest(live.safe, { status: 'application-in-signing', transaction: queuedTransaction() })],
      [live],
      resolveToken,
    )

    expect(added).toEqual([expect.objectContaining({ status: 'pending', operation: 'update' })])
  })

  it('should add no rows, when no request is waiting', () => {
    const { added, applyRequests } = mergeDelayedGuardRequests([], [mockActiveAllowlist()], resolveToken)

    expect(added).toEqual([])
    expect(applyRequests.size).toBe(0)
  })
})
