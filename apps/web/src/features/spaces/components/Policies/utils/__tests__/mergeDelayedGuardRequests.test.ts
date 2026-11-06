import { faker } from '@faker-js/faker'
import { AbiCoder } from 'ethers'
import type { PendingDelayedGuardPoliciesDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Policy, PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
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

describe('mergeDelayedGuardRequests', () => {
  it("folds a waiting request into the Safe's live allowlist as an update, offering apply on that row", () => {
    const live = mockActiveAllowlist()
    const request = makeRequest(live.safe)

    const { active, added, applyRequests } = mergeDelayedGuardRequests([request], [live], resolveToken)

    expect(added).toEqual([])
    expect(active).toEqual([
      { ...live, scheduledChange: { operation: 'update', appliesAt: 1_800_000_000, expiresAt: 1_800_604_800 } },
    ])
    expect(applyRequests.get(live.id)).toMatchObject({ guardAddress: request.guard })
  })

  it('adds a first allowlist on a Safe without one as its own row', () => {
    const safe = { chainId: '11155111', address: faker.finance.ethereumAddress() }

    const { active, added, applyRequests } = mergeDelayedGuardRequests([makeRequest(safe)], [], resolveToken)

    expect(active).toEqual([])
    expect(added).toEqual([
      expect.objectContaining({ status: 'active', scheduledChange: expect.objectContaining({ operation: 'create' }) }),
    ])
    expect(applyRequests.get(added[0].id)).toBeDefined()
  })

  it('keeps a queued apply as a pending row beside the live allowlist', () => {
    const live = mockActiveAllowlist()
    const transaction = {
      safeTxHash: faker.string.hexadecimal({ length: 64 }),
      nonce: 3,
      confirmations: 1,
      confirmationsRequired: 2,
      proposedAt: 1_800_100_000,
      proposer: null,
    }

    const { active, added } = mergeDelayedGuardRequests(
      [makeRequest(live.safe, { status: 'application-in-signing', transaction })],
      [live],
      resolveToken,
    )

    expect(active).toEqual([live])
    expect(added).toEqual([expect.objectContaining({ status: 'pending', operation: 'update' })])
  })

  it('leaves other policies untouched', () => {
    const other = {
      ...mockActiveAllowlist(),
      id: 'other',
      safe: { chainId: '1', address: faker.finance.ethereumAddress() },
    }
    const policies: Policy[] = [other]

    expect(mergeDelayedGuardRequests([], policies, resolveToken).active).toEqual(policies)
  })
})
