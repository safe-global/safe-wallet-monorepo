import type {
  NativeTokenMetadataDto,
  PendingDelayedGuardPoliciesDto,
  PendingImmediateGuardPoliciesDto,
  PendingPolicyDto,
  PendingTransactionDto,
  PolicyConfigurationDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MOCK_SAFES } from './policies'

/** Shaped like the CGW `policies/pending` response. */

const ALLOWANCE_MODULE = '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'

export const PENDING_MOCK_DELEGATE = '0x91033E6fE839AEbBfEB7900cf802218DdB579859'

export const mockPendingDto = (overrides: Partial<PendingPolicyDto> = {}): PendingPolicyDto => ({
  kind: 'queued-transaction',
  type: 'spending-limit',
  enforcement: { via: 'module', moduleAddress: ALLOWANCE_MODULE },
  safeTxHash: '0xc11256ba0538b5f2fad7fc351385b5e87fd926712956de138a5edcfb99eaeead',
  nonce: 2,
  confirmations: 1,
  confirmationsRequired: 2,
  proposedAt: 1_790_342_985,
  proposer: null,
  data: {
    module: ALLOWANCE_MODULE,
    changes: [
      { kind: 'add-delegate', delegate: PENDING_MOCK_DELEGATE },
      {
        kind: 'set-allowance',
        delegate: PENDING_MOCK_DELEGATE,
        token: '0x0000000000000000000000000000000000000000',
        tokenMetadata: mockEthMetadata(),
        amount: '100000000000000000',
        resetPeriodMinutes: 0,
      },
    ],
  },
  safe: MOCK_SAFES.treasury,
  ...overrides,
})

export const mockEthMetadata = (): NativeTokenMetadataDto => ({
  type: 'NATIVE_TOKEN',
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'ETH',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
  name: 'Ether',
  trusted: true,
})

export const MOCK_POLICY_GUARD = '0x0000000000000000000000000000000000000Ab1'

/** An ERC20 transfer binding of a token allowlist, as a guard change carries it. */
export const mockAllowlistConfiguration = (
  overrides: Partial<PolicyConfigurationDto> = {},
): PolicyConfigurationDto => ({
  target: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  selector: '0xa9059cbb',
  operation: 0,
  policy: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
  data: '0x',
  ...overrides,
})

export const mockPendingTransactionDto = (overrides: Partial<PendingTransactionDto> = {}): PendingTransactionDto => ({
  safeTxHash: '0x5b4a1a0c9e3f2d7b8a6c4e1f0d9b8a7c6e5f4d3c2b1a0f9e8d7c6b5a4f3e2d1c',
  nonce: 7,
  confirmations: 1,
  confirmationsRequired: 2,
  proposedAt: 1_790_342_985,
  proposer: null,
  ...overrides,
})

export const mockDelayedGuardDto = (
  overrides: Partial<PendingDelayedGuardPoliciesDto> = {},
): PendingDelayedGuardPoliciesDto & { kind: 'delayed-guard-policies' } => ({
  kind: 'delayed-guard-policies',
  status: 'pending-application',
  safe: MOCK_SAFES.grants,
  guard: MOCK_POLICY_GUARD,
  root: `0x${'ab'.repeat(32)}`,
  configurations: [mockAllowlistConfiguration()],
  readyAt: 1_790_400_000,
  expiresAt: 1_791_000_000,
  transaction: null,
  createdAt: 1_790_342_985,
  ...overrides,
})

export const mockImmediateGuardDto = (
  overrides: Partial<PendingImmediateGuardPoliciesDto> = {},
): PendingImmediateGuardPoliciesDto & { kind: 'immediate-guard-policies' } => ({
  kind: 'immediate-guard-policies',
  status: 'in-signing',
  safe: MOCK_SAFES.grants,
  guard: MOCK_POLICY_GUARD,
  configurations: [mockAllowlistConfiguration()],
  transaction: mockPendingTransactionDto(),
  ...overrides,
})
