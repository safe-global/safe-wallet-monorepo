import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TokenMetadata } from '@/store/api/gateway/policyTokenInfos'
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
            amount: '1500000000',
            spent: '1000000000',
            resetPeriodMinutes: 43_200,
            resetsAtMinute: 29_846_880,
            resetBoundaryIsExact: true,
            isDelegateActive: true,
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

export const mockUsdcMetadata = (): TokenMetadata => ({
  type: 'ERC20',
  address: MOCK_TOKENS.usdc.address,
  symbol: MOCK_TOKENS.usdc.symbol,
  decimals: MOCK_TOKENS.usdc.decimals,
  logoUri: MOCK_TOKENS.usdc.logoUri,
  name: 'USD Coin',
  trusted: true,
})
