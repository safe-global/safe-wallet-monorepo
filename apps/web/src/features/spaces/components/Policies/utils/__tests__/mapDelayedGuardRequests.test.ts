import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PendingDelayedGuardPoliciesDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import { encodeErc20TransferPolicyData } from '@/features/policy-guard/services/allowlistConfigurations'
import { getApplyAllowlistRequest, mapDelayedGuardRequest } from '../mapDelayedGuardRequests'

const resolveToken = (address: string): PolicyTokenInfo => ({ address, symbol: 'TKN', decimals: 18, logoUri: null })

const token = faker.finance.ethereumAddress()
const recipients = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
const nativeRecipient = faker.finance.ethereumAddress()

const makeRequest = (overrides: Partial<PendingDelayedGuardPoliciesDto> = {}): PendingDelayedGuardPoliciesDto => ({
  kind: 'delayed-guard-policies',
  status: 'pending-application',
  safe: { chainId: '11155111', address: faker.finance.ethereumAddress() },
  guard: faker.finance.ethereumAddress(),
  root: faker.string.hexadecimal({ length: 64 }),
  configurations: [
    {
      target: token,
      selector: '0xa9059cbb',
      operation: 0,
      policy: faker.finance.ethereumAddress(),
      data: encodeErc20TransferPolicyData(recipients),
    },
    {
      target: nativeRecipient,
      selector: '0x00000000',
      operation: 0,
      policy: faker.finance.ethereumAddress(),
      data: '0x',
    },
  ],
  readyAt: 1_800_000_000,
  expiresAt: 1_800_604_800,
  transaction: null,
  createdAt: 1_799_900_000,
  ...overrides,
})

describe('mapDelayedGuardRequest', () => {
  it('maps a requested root to an allowlist waiting out or past its delay, with its apply window', () => {
    const policy = mapDelayedGuardRequest(makeRequest(), { operation: 'create', resolveToken })

    expect(policy).toMatchObject({
      status: 'active',
      scheduledChange: { operation: 'create', appliesAt: 1_800_000_000, expiresAt: 1_800_604_800 },
    })
  })

  it('decodes the stored configurations into one entry per token, native included', () => {
    const policy = mapDelayedGuardRequest(makeRequest(), { operation: 'create', resolveToken })

    expect(policy?.data.entries).toEqual([
      {
        token: resolveToken(token),
        recipients: recipients.map((account) => ({
          account: expect.stringMatching(new RegExp(account, 'i')),
          permission: 'ALWAYS',
        })),
      },
      { token: resolveToken(ZERO_ADDRESS), recipients: [{ account: nativeRecipient, permission: 'ALWAYS' }] },
    ])
  })

  it('keeps an expired request as a scheduled change, which the drawer reports as expired', () => {
    expect(
      mapDelayedGuardRequest(makeRequest({ status: 'expired' }), { operation: 'update', resolveToken }),
    ).toMatchObject({ status: 'active', scheduledChange: { operation: 'update' } })
  })

  it('maps a queued apply to a pending allowlist with its signatures, reusing the pending panel', () => {
    const transaction = {
      safeTxHash: faker.string.hexadecimal({ length: 64 }),
      nonce: 7,
      confirmations: 1,
      confirmationsRequired: 2,
      proposedAt: 1_800_100_000,
      proposer: null,
    }

    expect(
      mapDelayedGuardRequest(makeRequest({ status: 'application-in-signing', transaction }), {
        operation: 'create',
        resolveToken,
      }),
    ).toMatchObject({
      status: 'pending',
      operation: 'create',
      safeTxHash: transaction.safeTxHash,
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })
  })

  it.each(['draft', 'configuration-in-signing'] as const)('leaves a %s request to the setup flow', (status) => {
    expect(mapDelayedGuardRequest(makeRequest({ status }), { operation: 'create', resolveToken })).toBeUndefined()
  })

  it('skips a root requested outside the wallet, whose configurations CGW does not know', () => {
    expect(
      mapDelayedGuardRequest(makeRequest({ configurations: null }), { operation: 'create', resolveToken }),
    ).toBeUndefined()
  })
})

describe('getApplyAllowlistRequest', () => {
  it('returns the guard and the configurations to replay in applyConfiguration', () => {
    const request = makeRequest()

    expect(getApplyAllowlistRequest(request)).toEqual({
      chainId: request.safe.chainId,
      safeAddress: request.safe.address,
      guardAddress: request.guard,
      configurations: request.configurations,
    })
  })

  it('returns nothing without the configurations', () => {
    expect(getApplyAllowlistRequest(makeRequest({ configurations: null }))).toBeUndefined()
  })
})
