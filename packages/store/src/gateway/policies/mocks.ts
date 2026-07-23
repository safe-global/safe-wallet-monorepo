import { faker } from '@faker-js/faker'
import {
  PolicyType,
  type PolicyContracts,
  type TokenInfo,
  type AvailablePolicy,
  type ActivePolicy,
  type GetPoliciesResponse,
  type GetActivePoliciesResponse,
  type PolicyQueryArg,
} from './types'

/**
 * Mocked CGW responses for the policy engine, returned by the slice's `queryFn`
 * while the real endpoint doesn't exist. Delete this file when the backend lands
 * and the endpoints switch to `query: { url }`.
 */

/** Chains we have policy-engine deployments for (mock). */
const SUPPORTED_CHAIN_IDS = ['1', '137', '11155111']

const address = () => faker.finance.ethereumAddress()
const weiString = () => faker.number.bigInt({ min: 1n, max: 10n ** 24n }).toString()

const tokenInfo = (symbol: string, decimals: number): TokenInfo => ({
  address: address(),
  symbol,
  decimals,
  logoUri: null,
})

const guardContracts = (): PolicyContracts => ({
  policyContract: address(),
  safePolicyGuard: address(),
})

const isSupportedChain = (chainId: string) => SUPPORTED_CHAIN_IDS.includes(chainId)

export const buildMockAvailablePolicies = (arg: PolicyQueryArg): GetPoliciesResponse => {
  const supported = isSupportedChain(arg.chainId)

  const items: AvailablePolicy[] = [
    {
      type: PolicyType.SpendingLimit,
      title: 'Spending limit',
      description: 'Let a spender withdraw up to a fixed amount per token.',
      // Module-enforced: enabling the AllowanceModule. No guard.
      enforcement: { via: 'module', moduleAddress: address() },
      available: true,
      configuredCount: faker.number.int({ min: 0, max: 3 }),
    },
    {
      type: PolicyType.Recovery,
      title: 'Account recovery',
      description: 'Nominate a recoverer who can recover the Safe after a delay.',
      // Module-enforced: enabling the Zodiac Delay Modifier. No guard.
      enforcement: { via: 'module', moduleAddress: address() },
      available: true,
      configuredCount: faker.number.int({ min: 0, max: 1 }),
    },
    {
      type: PolicyType.TokenWithdraw,
      title: 'Token withdraw allowlist',
      description: 'Restrict, per token, which addresses the Safe can send to.',
      // Guard-enforced: SafePolicyGuard in the transaction-guard slot.
      enforcement: { via: 'guard', guards: { transactionGuard: guardContracts() } },
      available: supported,
      configuredCount: faker.number.int({ min: 0, max: 2 }),
    },
    {
      type: PolicyType.Cosigner,
      title: 'Cosigner',
      description: 'Require a cosigner when a token transfer exceeds a threshold.',
      enforcement: { via: 'guard', guards: { transactionGuard: guardContracts() } },
      available: supported,
      configuredCount: faker.number.int({ min: 0, max: 1 }),
    },
  ]

  return { items }
}

export const buildMockActivePolicies = (): GetActivePoliciesResponse => {
  const usdc = tokenInfo('USDC', 6)
  const dai = tokenInfo('DAI', 18)

  const items: ActivePolicy[] = [
    {
      id: faker.string.uuid(),
      type: PolicyType.SpendingLimit,
      enabled: true,
      enforcement: { via: 'module', moduleAddress: address() },
      data: {
        beneficiary: address(),
        limits: [{ token: usdc, amount: weiString(), spent: weiString(), nonce: '0' }],
      },
    },
    {
      id: faker.string.uuid(),
      type: PolicyType.Recovery,
      enabled: true,
      enforcement: { via: 'module', moduleAddress: address() },
      data: { recoverers: [address()], cooldownSec: '2419200', expirySec: '0' },
    },
    {
      id: faker.string.uuid(),
      type: PolicyType.TokenWithdraw,
      enabled: true,
      enforcement: { via: 'guard', guards: { transactionGuard: guardContracts() } },
      data: {
        allowlist: [
          {
            token: usdc,
            recipients: [
              { address: address(), name: 'Payroll' },
              { address: address(), name: null },
            ],
          },
          { token: dai, recipients: [{ address: address(), name: 'Treasury' }] },
        ],
      },
    },
    {
      id: faker.string.uuid(),
      type: PolicyType.Cosigner,
      enabled: true,
      enforcement: { via: 'guard', guards: { transactionGuard: guardContracts() } },
      data: {
        rules: [{ token: usdc, cosigner: { address: address(), name: 'CFO' }, thresholdAmount: weiString() }],
      },
    },
  ]

  return { items }
}
