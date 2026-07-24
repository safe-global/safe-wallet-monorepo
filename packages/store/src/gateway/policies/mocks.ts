import {
  PolicyType,
  type TokenInfo,
  type AvailablePolicy,
  type ActivePolicy,
  type PendingPolicy,
  type GetPoliciesResponse,
  type GetActivePoliciesResponse,
  type GetPendingPoliciesResponse,
  type PolicyQueryArg,
} from './types'

/**
 * Mocked CGW responses for the policy engine, returned by the slice's `queryFn`
 * while the real endpoint doesn't exist. Plain hardcoded values (no faker) —
 * this whole file is deleted when the backend lands and the endpoints switch to
 * `query: { url }`.
 */

const SEPOLIA = '11155111'

/** Chains we have policy-engine deployments for (mock). */
const SUPPORTED_CHAIN_IDS = ['1', '137', SEPOLIA]

// Real Sepolia deployments; placeholders elsewhere until the backend lands.
const DEPLOYMENTS: Record<string, { safePolicyGuard: string; erc20TransferPolicy: string }> = {
  [SEPOLIA]: {
    safePolicyGuard: '0xde4c448904537EBBA654Ac3803E7D74A77C7a1a8',
    erc20TransferPolicy: '0xec399EE72199DBc1f7DCf8b69cFa0290d1e06Fb7',
  },
}
const PLACEHOLDER = {
  safePolicyGuard: '0x1111111111111111111111111111111111111111',
  erc20TransferPolicy: '0x4444444444444444444444444444444444444444',
}
const deploymentsFor = (chainId: string) => DEPLOYMENTS[chainId] ?? PLACEHOLDER

// Modules aren't deployed yet — stable placeholders so the mock is deterministic.
const SPENDING_LIMIT_MODULE = '0x2222222222222222222222222222222222222222'
const RECOVERY_MODULE = '0x3333333333333333333333333333333333333333'
const COSIGNER_POLICY = '0x5555555555555555555555555555555555555555'

const USDC: TokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
  logoUri: null,
}
const DAI: TokenInfo = {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  symbol: 'DAI',
  decimals: 18,
  logoUri: null,
}

const isSupportedChain = (chainId: string) => SUPPORTED_CHAIN_IDS.includes(chainId)

export const buildMockAvailablePolicies = (arg: PolicyQueryArg): GetPoliciesResponse => {
  const supported = isSupportedChain(arg.chainId)
  const { safePolicyGuard, erc20TransferPolicy } = deploymentsFor(arg.chainId)

  const items: AvailablePolicy[] = [
    {
      type: PolicyType.SpendingLimit,
      title: 'Spending limit',
      description: 'Let a spender withdraw up to a fixed amount per token.',
      // Module-enforced: enabling the AllowanceModule. No guard.
      enforcement: { via: 'module', moduleAddress: SPENDING_LIMIT_MODULE },
      available: true,
      configuredCount: 1,
    },
    {
      type: PolicyType.Recovery,
      title: 'Account recovery',
      description: 'Nominate a recoverer who can recover the Safe after a delay.',
      // Module-enforced: enabling the Zodiac Delay Modifier. No guard.
      enforcement: { via: 'module', moduleAddress: RECOVERY_MODULE },
      available: true,
      configuredCount: 0,
    },
    {
      type: PolicyType.TokenWithdraw,
      title: 'Token withdraw allowlist',
      description: 'Restrict, per token, which addresses the Safe can send to.',
      // Guard-enforced: SafePolicyGuard in the transaction-guard slot.
      enforcement: {
        via: 'guard',
        guards: { transactionGuard: { policyContract: erc20TransferPolicy, safePolicyGuard } },
      },
      available: supported,
      configuredCount: 1,
    },
    {
      type: PolicyType.Cosigner,
      title: 'Cosigner',
      description: 'Require a cosigner when a token transfer exceeds a threshold.',
      enforcement: {
        via: 'guard',
        guards: { transactionGuard: { policyContract: COSIGNER_POLICY, safePolicyGuard } },
      },
      available: supported,
      configuredCount: 0,
    },
  ]

  return { items }
}

export const buildMockActivePolicies = (arg: PolicyQueryArg): GetActivePoliciesResponse => {
  const { safePolicyGuard, erc20TransferPolicy } = deploymentsFor(arg.chainId)

  const items: ActivePolicy[] = [
    {
      id: 'pol_spending_limit_1',
      type: PolicyType.SpendingLimit,
      enabled: true,
      enforcement: { via: 'module', moduleAddress: SPENDING_LIMIT_MODULE },
      data: {
        beneficiary: '0xBEeF00000000000000000000000000000000BEEf',
        limits: [{ token: USDC, amount: '1000000000', spent: '250000000', nonce: '0' }],
      },
    },
    {
      id: 'pol_token_withdraw_1',
      type: PolicyType.TokenWithdraw,
      enabled: true,
      enforcement: {
        via: 'guard',
        guards: { transactionGuard: { policyContract: erc20TransferPolicy, safePolicyGuard } },
      },
      data: {
        allowlist: [
          {
            token: USDC,
            recipients: [
              { address: '0xDEeF00000000000000000000000000000000DE01', name: 'Payroll' },
              { address: '0xDEeF00000000000000000000000000000000DE02', name: null },
            ],
          },
          { token: DAI, recipients: [{ address: '0xDEeF00000000000000000000000000000000DE03', name: 'Treasury' }] },
        ],
      },
    },
  ]

  return { items }
}

// Fixed timestamps keep the mock deterministic (real CGW supplies live values).
const REQUESTED_AT = 1_753_000_000 // ~2025-07-20
const GUARD_DELAY_SEC = 86_400 // 24h — mirrors a typical SafePolicyGuard DELAY

export const buildMockPendingPolicies = (arg: PolicyQueryArg): GetPendingPoliciesResponse => {
  const { safePolicyGuard, erc20TransferPolicy } = deploymentsFor(arg.chainId)
  const readyAt = REQUESTED_AT + GUARD_DELAY_SEC

  const items: PendingPolicy[] = [
    {
      id: 'pol_token_withdraw_pending_1',
      type: PolicyType.TokenWithdraw,
      enabled: false, // requested, not yet applied
      enforcement: {
        via: 'guard',
        guards: { transactionGuard: { policyContract: erc20TransferPolicy, safePolicyGuard } },
      },
      // The requested change: add a new recipient to USDC's allowlist.
      data: {
        allowlist: [
          {
            token: USDC,
            recipients: [{ address: '0xDEeF00000000000000000000000000000000DE04', name: 'New vendor' }],
          },
        ],
      },
      configureRoot: '0x00000000000000000000000000000000000000000000000000000000c0f16007',
      requestedAt: REQUESTED_AT,
      readyAt,
      isReady: false,
    },
  ]

  return { items }
}
