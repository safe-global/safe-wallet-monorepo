import type {
  ActivePolicyDto,
  Erc20TokenMetadataDto,
  GuardSlotsDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MOCK_ADDRESSES, MOCK_SAFES, MOCK_TOKENS } from './policies'

/** Shaped like the CGW `policies/active` response. */

const ALLOWANCE_MODULE = '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'

export const mockSpendingLimitDto = (overrides: Partial<ActivePolicyDto> = {}): ActivePolicyDto => ({
  type: 'spending-limit',
  enforcement: { via: 'module', moduleAddress: ALLOWANCE_MODULE },
  enabled: true,
  safe: MOCK_SAFES.treasury,
  data: {
    module: ALLOWANCE_MODULE,
    spenders: [
      {
        spender: MOCK_ADDRESSES.alice,
        isActive: true,
        allowances: [
          {
            tokenAddress: MOCK_TOKENS.usdc.address,
            tokenMetadata: mockUsdcMetadata(),
            amount: '1500000000',
            spent: '1000000000',
            resetPeriodMinutes: 43_200,
            resetsAtMinute: 29_846_880,
            resetBoundaryIsExact: true,
            isDelegateActive: true,
            createdAt: 1_790_000_000,
            updatedAt: 1_790_000_000,
          },
        ],
      },
    ],
  },
  ...overrides,
})

export const mockProposerDto = (overrides: Partial<ActivePolicyDto> = {}): ActivePolicyDto => ({
  type: 'proposer',
  enforcement: { via: 'offchain', source: 'delegates' },
  enabled: true,
  safe: MOCK_SAFES.treasury,
  data: {
    proposers: [{ proposer: MOCK_ADDRESSES.bob, delegatedBy: [{ delegator: MOCK_ADDRESSES.alice, label: 'Bob' }] }],
  },
  ...overrides,
})

const POLICY_CONTRACTS = {
  policyContract: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
  safePolicyGuard: '0x5202B1ebE100812437d47eae769e155945fbba6a',
}

const GUARD_SLOTS = { transactionGuard: POLICY_CONTRACTS, moduleGuard: POLICY_CONTRACTS }

const TRANSFER_SELECTOR = '0xa9059cbb'

export const mockErc20TransferDto = (overrides: Partial<ActivePolicyDto> = {}): ActivePolicyDto => ({
  type: 'erc20-transfer',
  enforcement: {
    via: 'guard',
    guards: GUARD_SLOTS,
    access: { target: MOCK_TOKENS.usdc.address, selector: TRANSFER_SELECTOR, operation: 'CALL' },
  },
  enabled: true,
  safe: MOCK_SAFES.treasury,
  data: {
    tokenAddress: MOCK_TOKENS.usdc.address,
    recipients: [
      { account: MOCK_ADDRESSES.alice, permission: 'ALWAYS' },
      { account: MOCK_ADDRESSES.bob, permission: 'ONCE' },
    ],
  },
  ...overrides,
})

/** One allowed ETH recipient per policy, held in `access.target`. */
export const mockNativeTransferDto = (
  recipient: string = MOCK_ADDRESSES.alice,
  overrides: Partial<ActivePolicyDto> = {},
): ActivePolicyDto => ({
  type: 'native-transfer',
  enforcement: {
    via: 'guard',
    guards: GUARD_SLOTS,
    access: { target: recipient, selector: '0x00000000', operation: 'CALL' },
  },
  enabled: true,
  safe: MOCK_SAFES.treasury,
  data: {},
  ...overrides,
})

/** The guard in the transaction slot only, so the allowlist reads "Not enforced". */
export const TRANSACTION_GUARD_ONLY: GuardSlotsDto = { transactionGuard: POLICY_CONTRACTS }

const withGuards = (dto: ActivePolicyDto, guards: GuardSlotsDto): ActivePolicyDto =>
  dto.enforcement.via === 'guard' ? { ...dto, enforcement: { ...dto.enforcement, guards } } : dto

/** The treasury's allowlist: USDC and USDT, plus two ETH recipients. */
export const mockTreasuryAllowlistDtos = (guards: GuardSlotsDto = GUARD_SLOTS): ActivePolicyDto[] =>
  [
    mockErc20TransferDto(),
    mockErc20TransferDto({
      enforcement: {
        via: 'guard',
        guards: GUARD_SLOTS,
        access: { target: MOCK_TOKENS.usdt.address, selector: TRANSFER_SELECTOR, operation: 'CALL' },
      },
      data: {
        tokenAddress: MOCK_TOKENS.usdt.address,
        recipients: [{ account: MOCK_ADDRESSES.alice, permission: 'ALWAYS' }],
      },
    }),
    mockNativeTransferDto(MOCK_ADDRESSES.alice),
    mockNativeTransferDto(MOCK_ADDRESSES.bob),
  ].map((dto) => withGuards(dto, guards))

export const mockUsdcMetadata = (): Erc20TokenMetadataDto => ({
  type: 'ERC20',
  address: MOCK_TOKENS.usdc.address,
  symbol: MOCK_TOKENS.usdc.symbol,
  decimals: MOCK_TOKENS.usdc.decimals,
  logoUri: MOCK_TOKENS.usdc.logoUri,
  name: 'USD Coin',
  trusted: true,
})
