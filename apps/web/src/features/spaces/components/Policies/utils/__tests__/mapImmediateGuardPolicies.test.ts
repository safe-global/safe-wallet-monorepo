import { faker } from '@faker-js/faker'
import { AbiCoder } from 'ethers'
import type { PendingImmediateGuardPoliciesDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import { mapImmediateGuardPolicies } from '../mapImmediateGuardPolicies'

const resolveToken = (address: string): PolicyTokenInfo => ({ address, symbol: 'TKN', decimals: 18, logoUri: null })

const token = faker.finance.ethereumAddress()
const recipient = faker.finance.ethereumAddress()

const makeSetup = (overrides: Partial<PendingImmediateGuardPoliciesDto> = {}): PendingImmediateGuardPoliciesDto => ({
  kind: 'immediate-guard-policies',
  status: 'in-signing',
  safe: { chainId: '11155111', address: faker.finance.ethereumAddress() },
  guard: faker.finance.ethereumAddress(),
  configurations: [
    {
      target: token,
      selector: '0xa9059cbb',
      operation: 0,
      policy: faker.finance.ethereumAddress(),
      data: AbiCoder.defaultAbiCoder().encode(['tuple(address recipient, uint8 permission)[]'], [[[recipient, 2]]]),
    },
  ],
  transaction: {
    safeTxHash: faker.string.hexadecimal({ length: 64 }),
    nonce: 4,
    confirmations: 1,
    confirmationsRequired: 2,
    proposedAt: 1_800_000_000,
    proposer: null,
  },
  ...overrides,
})

describe('mapImmediateGuardPolicies', () => {
  it('maps a queued guard setup to a pending allowlist creation with its signatures', () => {
    const setup = makeSetup()

    expect(mapImmediateGuardPolicies(setup, resolveToken)).toMatchObject({
      id: `${setup.safe.chainId}:${setup.safe.address}:${setup.transaction.safeTxHash}`,
      type: 'allowlist',
      status: 'pending',
      operation: 'create',
      enforcement: { via: 'guard', guardAddress: setup.guard },
      safeTxHash: setup.transaction.safeTxHash,
      nonce: 4,
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
      proposedAt: 1_800_000_000,
    })
  })

  it('lists the recipients the setup binds per token', () => {
    expect(mapImmediateGuardPolicies(makeSetup(), resolveToken)?.data.entries).toEqual([
      {
        token: resolveToken(token),
        recipients: [{ account: expect.stringMatching(new RegExp(recipient, 'i')), permission: 'ALWAYS' }],
      },
    ])
  })

  it('skips a setup that binds no transfer policy, which is not an allowlist', () => {
    const setup = makeSetup({
      configurations: [
        {
          target: faker.finance.ethereumAddress(),
          selector: '0x095ea7b3',
          operation: 0,
          policy: faker.finance.ethereumAddress(),
          data: '0x',
        },
      ],
    })

    expect(mapImmediateGuardPolicies(setup, resolveToken)).toBeUndefined()
  })
})
