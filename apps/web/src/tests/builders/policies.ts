import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import {
  PolicyType,
  PolicyKind,
  type Enforcement,
  type TokenInfo,
  type PolicyContracts,
  type SpendingLimitPolicy,
  type RecoveryPolicy,
  type TokenWithdrawPolicy,
  type CosignerPolicy,
  type ActivePolicy,
  type AvailablePolicy,
} from '@safe-global/store/gateway/policies/types'

import { Builder, type IBuilder } from '../Builder'

const address = () => checksumAddress(faker.finance.ethereumAddress())
/** A decimal wei string, matching the CGW uint256-as-string convention. */
const weiString = () => faker.number.bigInt({ min: 1n, max: 10n ** 24n }).toString()

export const tokenInfoBuilder = (): IBuilder<TokenInfo> =>
  Builder.new<TokenInfo>().with({
    address: address(),
    symbol: faker.finance.currencyCode(),
    decimals: faker.helpers.arrayElement([6, 8, 18]),
    logoUri: faker.image.url(),
  })

export const policyContractsBuilder = (): IBuilder<PolicyContracts> =>
  Builder.new<PolicyContracts>().with({
    policyContract: address(),
    safePolicyGuard: address(),
  })

/** Module-enforced policies (spending limit, recovery): a Safe module is enabled, no guard. */
const moduleEnforced = (): Enforcement => ({ via: 'module', moduleAddress: address() })
/** Guard-enforced policies (token withdraw, cosigner): a SafePolicyGuard in the tx-guard slot. */
const guardEnforced = (): Enforcement => ({
  via: 'guard',
  guards: { transactionGuard: policyContractsBuilder().build() },
})

export const spendingLimitPolicyBuilder = (): IBuilder<SpendingLimitPolicy> =>
  Builder.new<SpendingLimitPolicy>().with({
    id: faker.string.uuid(),
    type: PolicyType.SpendingLimit,
    enabled: true,
    enforcement: moduleEnforced(),
    data: {
      beneficiary: address(),
      limits: [{ token: tokenInfoBuilder().build(), amount: weiString(), spent: weiString(), nonce: '0' }],
    },
  })

export const recoveryPolicyBuilder = (): IBuilder<RecoveryPolicy> =>
  Builder.new<RecoveryPolicy>().with({
    id: faker.string.uuid(),
    type: PolicyType.Recovery,
    enabled: true,
    enforcement: moduleEnforced(),
    data: { recoverers: [address()], cooldownSec: '2419200', expirySec: '0' },
  })

export const tokenWithdrawPolicyBuilder = (): IBuilder<TokenWithdrawPolicy> =>
  Builder.new<TokenWithdrawPolicy>().with({
    id: faker.string.uuid(),
    type: PolicyType.TokenWithdraw,
    enabled: true,
    enforcement: guardEnforced(),
    data: {
      allowlist: [
        {
          token: tokenInfoBuilder().build(),
          recipients: [{ address: address(), name: faker.person.firstName() }],
        },
      ],
    },
  })

export const cosignerPolicyBuilder = (): IBuilder<CosignerPolicy> =>
  Builder.new<CosignerPolicy>().with({
    id: faker.string.uuid(),
    type: PolicyType.Cosigner,
    enabled: true,
    enforcement: guardEnforced(),
    data: {
      rules: [
        {
          token: tokenInfoBuilder().build(),
          cosigner: { address: address(), name: faker.person.firstName() },
          thresholdAmount: weiString(),
        },
      ],
    },
  })

export const activePolicyBuilder = (): IBuilder<ActivePolicy> => tokenWithdrawPolicyBuilder()

export const availablePolicyBuilder = (): IBuilder<AvailablePolicy> =>
  Builder.new<AvailablePolicy>().with({
    type: PolicyType.TokenWithdraw,
    title: 'Token withdraw allowlist',
    description: faker.lorem.sentence(),
    guardKinds: [PolicyKind.TransactionGuard],
    available: true,
    configuredCount: faker.number.int({ min: 0, max: 5 }),
    contracts: policyContractsBuilder().build(),
  })
