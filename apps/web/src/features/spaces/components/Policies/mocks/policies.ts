import type {
  ActivePolicy,
  PendingSpendingLimitPolicy,
  Policy,
  PolicySafe,
  PolicyTokenInfo,
  ProposerPolicy,
  RecoveryPolicy,
  SpendingLimitPolicy,
} from '../types'

/**
 * Fixtures shaped like the CGW response agreed in WA-3218. The stories and the unit tests share
 * them so both use the same shapes. WA-3451 replaces the data source, not these shapes.
 */

const DAY = 86_400

export const MOCK_SAFES = {
  treasury: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', chainId: '1' },
  payroll: { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A', chainId: '137' },
  grants: { address: '0xA77D7c8B23A2E4d1E6A1a49e57B1e0dC7b8Fc2b1', chainId: '11155111' },
} as const satisfies Record<string, PolicySafe>

export const MOCK_TOKENS = {
  usdc: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/USDC.png',
  },
  usdt: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    decimals: 6,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/USDT.png',
  },
  /** CGW can return a token it has no logo or full metadata for. */
  unknown: {
    address: '0x0d8775840f2a4b0b3ecbca9b6e0a4c8f0f0f0f0f',
    symbol: 'UNKNOWN',
    decimals: 18,
    logoUri: null,
  },
} as const satisfies Record<string, PolicyTokenInfo>

export const MOCK_ADDRESSES = {
  /** Has an entry in the space address book. */
  alice: '0x0000000000000000000000000000000000000A11',
  bob: '0x0000000000000000000000000000000000000B0b',
  /** Has no address book entry, so it renders as a shortened, copyable address. */
  unresolved: '0xdEAD00000000000000000000000000000000bEEF',
} as const

const ALLOWANCE_MODULE = '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'
const DELAY_MODULE = '0xd54895B1121A2eE3f37b502F507631FA1331BED6'

const allowance = (
  token: PolicyTokenInfo,
  amount: string,
  spent: string,
  resetPeriodSeconds: number,
  resetsAt: number | null = 1_790_812_800,
) => ({
  token,
  amount,
  spent,
  remaining: (BigInt(amount) - BigInt(spent)).toString(),
  resetPeriodSeconds,
  resetsAt: resetPeriodSeconds === 0 ? null : resetsAt,
})

export const mockSpendingLimitPolicy = (overrides: Partial<SpendingLimitPolicy> = {}): SpendingLimitPolicy => ({
  id: '0xspending-limit-treasury',
  type: 'spending-limit',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'module', moduleAddress: ALLOWANCE_MODULE },
  enabled: true,
  createdBy: MOCK_ADDRESSES.alice,
  createdAt: 1_781_000_100,
  data: {
    spenders: [
      {
        spender: MOCK_ADDRESSES.alice,
        allowances: [
          allowance(MOCK_TOKENS.usdc, '1500000000', '1000000000', DAY * 30),
          allowance(MOCK_TOKENS.usdt, '1000000000', '750000000', DAY * 30),
        ],
      },
    ],
  },
  ...overrides,
})

/** One policy holding three spenders. */
export const mockMultiSpenderPolicy = (): SpendingLimitPolicy =>
  mockSpendingLimitPolicy({
    id: '0xspending-limit-multi',
    data: {
      spenders: [
        {
          spender: MOCK_ADDRESSES.alice,
          allowances: [
            allowance(MOCK_TOKENS.usdc, '1500000000', '1000000000', DAY * 30),
            allowance(MOCK_TOKENS.usdt, '1000000000', '750000000', DAY * 30),
          ],
        },
        {
          spender: MOCK_ADDRESSES.bob,
          allowances: [allowance(MOCK_TOKENS.usdc, '5000000000', '0', DAY * 7)],
        },
        {
          spender: MOCK_ADDRESSES.unresolved,
          allowances: [allowance(MOCK_TOKENS.unknown, '2000000000000000000', '2000000000000000000', DAY)],
        },
      ],
    },
  })

/** A policy whose module is configured but not enabled on the Safe. */
export const mockUnenforcedPolicy = (): SpendingLimitPolicy =>
  mockSpendingLimitPolicy({ id: '0xspending-limit-unenforced', safe: MOCK_SAFES.grants, enabled: false })

export const mockRecoveryPolicy = (overrides: Partial<RecoveryPolicy> = {}): RecoveryPolicy => ({
  id: '0xrecovery-payroll',
  type: 'recovery',
  safe: MOCK_SAFES.payroll,
  enforcement: { via: 'module', moduleAddress: DELAY_MODULE },
  enabled: true,
  createdBy: MOCK_ADDRESSES.bob,
  createdAt: 1_780_500_000,
  data: {
    recoverers: [MOCK_ADDRESSES.bob],
    reviewWindowSeconds: DAY * 28,
    proposalExpirySeconds: 0,
    pendingRecovery: null,
  },
  ...overrides,
})

/** Granted off chain, so no contract enforces it. */
export const mockProposerPolicy = (overrides: Partial<ProposerPolicy> = {}): ProposerPolicy => ({
  id: '0xproposer-treasury',
  type: 'proposer',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'offchain', source: 'delegates' },
  enabled: true,
  createdBy: MOCK_ADDRESSES.alice,
  createdAt: 1_781_200_000,
  data: {
    proposer: MOCK_ADDRESSES.bob,
    grantedBy: MOCK_ADDRESSES.alice,
    grantedAt: 1_781_200_000,
  },
  ...overrides,
})

export const mockPendingPolicy = (overrides: Partial<PendingSpendingLimitPolicy> = {}): PendingSpendingLimitPolicy => ({
  ...mockSpendingLimitPolicy({ id: '0xspending-limit-pending', safe: MOCK_SAFES.payroll }),
  status: 'pending',
  operation: 'create',
  safeTxHash: '0x9f3c1b7a2d4e5f60718293a4b5c6d7e8f9012345678990abcdef0123456789ab',
  nonce: 42,
  confirmationsSubmitted: 1,
  confirmationsRequired: 2,
  missingSigners: [MOCK_ADDRESSES.bob],
  proposedAt: 1_781_300_000,
  supersedesId: null,
  ...overrides,
})

/** Adds the status the table renders to an active policy. */
export const asActivePolicy = <T extends ActivePolicy>(policy: T): T & { status: 'active' } => ({
  ...policy,
  status: 'active',
})

/** One policy of each kind the table has to render. */
export const mockPolicies = (): Policy[] => [
  asActivePolicy(mockMultiSpenderPolicy()),
  mockPendingPolicy(),
  asActivePolicy(mockRecoveryPolicy()),
  asActivePolicy(mockProposerPolicy()),
  asActivePolicy(mockUnenforcedPolicy()),
]

/** Used only by the long-list story, to show the table's pagination. */
export const mockLongPolicyList = (count = 30): Policy[] =>
  Array.from({ length: count }, (_, index) =>
    asActivePolicy(
      mockSpendingLimitPolicy({
        id: `0xspending-limit-${index}`,
        safe: [MOCK_SAFES.treasury, MOCK_SAFES.payroll, MOCK_SAFES.grants][index % 3],
        createdAt: 1_781_000_000 + index * 3_600,
      }),
    ),
  )

/** Owners of the mock Safes, keyed as the panel looks them up. */
export const MOCK_SIGNERS_BY_SAFE: Record<string, string[]> = {
  [`${MOCK_SAFES.treasury.chainId}:${MOCK_SAFES.treasury.address}`]: [MOCK_ADDRESSES.alice, MOCK_ADDRESSES.bob],
  [`${MOCK_SAFES.payroll.chainId}:${MOCK_SAFES.payroll.address}`]: [MOCK_ADDRESSES.alice, MOCK_ADDRESSES.bob],
  [`${MOCK_SAFES.grants.chainId}:${MOCK_SAFES.grants.address}`]: [MOCK_ADDRESSES.alice],
}
