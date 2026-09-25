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
import type { Viewer } from '../SpendingLimitDrawer/resolveState'

/** Policies as the table renders them. The stories and the unit tests share these; the wire shape is in activePolicies.ts. */

const DAY = 86_400
/** Allowance periods are minutes, matching the allowance module and the CGW response. */
const DAY_MINUTES = 1_440
/** 2026-10-01T00:00:00Z, in unix minutes. */
const RESETS_AT_MINUTE = 29_846_880

export const MOCK_SAFES = {
  treasury: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', chainId: '1' },
  payroll: { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A', chainId: '137' },
  grants: { address: '0xa77d7c8B23A2E4d1E6a1a49E57b1e0Dc7b8fC2B1', chainId: '11155111' },
} as const satisfies Record<string, PolicySafe>

export const MOCK_TOKENS = {
  usdc: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
  },
  usdt: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    decimals: 6,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xdAC17F958D2ee523a2206206994597C13D831ec7.png',
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
  unresolved: '0xDeaD00000000000000000000000000000000BEEf',
} as const

const ALLOWANCE_MODULE = '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'
const DELAY_MODULE = '0xd54895B1121A2eE3f37b502F507631FA1331BED6'

const allowance = (
  token: PolicyTokenInfo,
  amount: string,
  spent: string,
  resetPeriodMinutes: number,
  resetsAtMinute: number | null = RESETS_AT_MINUTE,
) => ({
  token,
  amount,
  spent,
  remaining: (BigInt(amount) - BigInt(spent)).toString(),
  resetPeriodMinutes,
  resetsAtMinute: resetPeriodMinutes === 0 ? null : resetsAtMinute,
})

export const mockSpendingLimitPolicy = (overrides: Partial<SpendingLimitPolicy> = {}): SpendingLimitPolicy => ({
  id: '0xspending-limit-treasury',
  type: 'spending-limit',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'module', moduleAddress: ALLOWANCE_MODULE },
  enabled: true,
  data: {
    spenders: [
      {
        spender: MOCK_ADDRESSES.alice,
        allowances: [
          allowance(MOCK_TOKENS.usdc, '1500000000', '1000000000', DAY_MINUTES * 30),
          allowance(MOCK_TOKENS.usdt, '1000000000', '750000000', DAY_MINUTES * 30),
        ],
      },
    ],
  },
  ...overrides,
})

export const mockMultiSpenderPolicy = (): SpendingLimitPolicy =>
  mockSpendingLimitPolicy({
    id: '0xspending-limit-multi',
    data: {
      spenders: [
        {
          spender: MOCK_ADDRESSES.alice,
          allowances: [
            allowance(MOCK_TOKENS.usdc, '1500000000', '1000000000', DAY_MINUTES * 30),
            allowance(MOCK_TOKENS.usdt, '1000000000', '750000000', DAY_MINUTES * 30),
          ],
        },
        {
          spender: MOCK_ADDRESSES.bob,
          allowances: [allowance(MOCK_TOKENS.usdc, '5000000000', '0', DAY_MINUTES * 7)],
        },
        {
          spender: MOCK_ADDRESSES.unresolved,
          allowances: [allowance(MOCK_TOKENS.unknown, '2000000000000000000', '2000000000000000000', DAY_MINUTES)],
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
  data: {
    proposers: [{ proposer: MOCK_ADDRESSES.bob, delegatedBy: [{ delegator: MOCK_ADDRESSES.alice, label: 'Bob' }] }],
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

export const asActivePolicy = <T extends ActivePolicy>(policy: T): T & { status: 'active' } => ({
  ...policy,
  status: 'active',
})

/** The treasury's spending limit as deployed on Polygon. */
export const mockPolygonSpendingLimitPolicy = (): SpendingLimitPolicy =>
  mockSpendingLimitPolicy({ id: '0xspending-limit-treasury-polygon', safe: { ...MOCK_SAFES.treasury, chainId: '137' } })

export const mockPolicies = (): Policy[] => [
  asActivePolicy(mockMultiSpenderPolicy()),
  asActivePolicy(mockPolygonSpendingLimitPolicy()),
  mockPendingPolicy(),
  asActivePolicy(mockRecoveryPolicy()),
  asActivePolicy(mockProposerPolicy()),
  asActivePolicy(mockUnenforcedPolicy()),
]

export const mockLongPolicyList = (count = 30): Policy[] =>
  Array.from({ length: count }, (_, index) =>
    asActivePolicy(
      mockSpendingLimitPolicy({
        id: `0xspending-limit-${index}`,
        safe: [MOCK_SAFES.treasury, MOCK_SAFES.payroll, MOCK_SAFES.grants][index % 3],
      }),
    ),
  )

/** The Safe the drawer's copy names when it asks for a signer wallet. */
export const MOCK_SAFE_NAME = 'Treasury'

export const mockActiveSpendingLimit = (): SpendingLimitPolicy & { status: 'active' } =>
  asActivePolicy(mockSpendingLimitPolicy())

export const mockPendingRemoval = (): PendingSpendingLimitPolicy =>
  mockPendingPolicy({
    id: '0xspending-limit-pending-remove',
    operation: 'remove',
    supersedesId: '0xspending-limit-treasury',
  })

export const mockPendingUpdate = (): PendingSpendingLimitPolicy =>
  mockPendingPolicy({
    id: '0xspending-limit-pending-update',
    operation: 'update',
    supersedesId: '0xspending-limit-treasury',
  })

/** Every signature collected; the transaction is waiting only for execution. */
export const mockFullySignedPending = (): PendingSpendingLimitPolicy =>
  mockPendingPolicy({
    id: '0xspending-limit-pending-full',
    confirmationsSubmitted: 2,
    confirmationsRequired: 2,
    missingSigners: [],
  })

/** A token CGW has no logo for — the row falls back to the symbol. */
export const mockMissingMetadataPolicy = (): SpendingLimitPolicy & { status: 'active' } =>
  asActivePolicy(
    mockSpendingLimitPolicy({
      id: '0xspending-limit-unknown-token',
      data: {
        spenders: [
          {
            spender: MOCK_ADDRESSES.alice,
            allowances: [allowance(MOCK_TOKENS.unknown, '2000000000000000000', '500000000000000000', DAY_MINUTES * 30)],
          },
        ],
      },
    }),
  )

/** The viewer's relationship to the Safe. Derived from the connected wallet once wired. */
export const MOCK_VIEWERS = {
  signer: { address: MOCK_ADDRESSES.alice, isSigner: true, hasSigned: false },
  signerWhoSigned: { address: MOCK_ADDRESSES.alice, isSigner: true, hasSigned: true },
  nonSigner: { address: MOCK_ADDRESSES.unresolved, isSigner: false, hasSigned: false },
  disconnected: { isSigner: false, hasSigned: false },
} as const satisfies Record<string, Viewer>
