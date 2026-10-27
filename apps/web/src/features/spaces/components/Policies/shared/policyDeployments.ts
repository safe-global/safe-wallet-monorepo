import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { getPolicyEngineAddress, getPolicyGuardAddress } from '@/features/policy-guard/services'

/**
 * Policy-engine deployments for the guard policies built here, on top of `features/policy-guard`.
 *
 * That feature owns the guard and the ERC20 policies the indexer watches, and so which chains have a policy
 * engine at all. Only the policies it does not know (allow, deny, cosigner, multisend, native transfer) are
 * listed here.
 */
export type PolicyDeployments = {
  safePolicyGuard: Address
  /** The guard's configuration DELAY, which is fixed per deployment. */
  delaySeconds: number
  policies: Partial<Record<PolicyType, Address>>
}

/** The delay of the guard `features/policy-guard` installs. */
export const GUARD_DELAY_SECONDS = 60

/** The policy contracts `features/policy-guard` has no entry for. Source: safe-research/policy-engine. */
const EXTRA_POLICY_CONTRACTS: Partial<Record<PolicyType, Address>> = {
  [PolicyType.Allow]: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
  [PolicyType.Deny]: '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436',
  [PolicyType.Cosigner]: '0xd9f2A31C5C68422a466754cd4F4965Be2b6024FB',
  [PolicyType.MultiSend]: '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c',
  [PolicyType.NativeTransfer]: '0x01b792988be451C5F6327b6e2D215Ff1d4cc7246',
}

/** Undefined on a chain without a policy engine, where no guard-based policy can be configured. */
export const getPolicyDeployments = (chainId: string): PolicyDeployments | undefined => {
  const safePolicyGuard = getPolicyGuardAddress(chainId)
  if (!safePolicyGuard) return undefined

  const erc20Transfer = getPolicyEngineAddress(chainId, 'ERC20TransferPolicy')

  return {
    safePolicyGuard: safePolicyGuard as Address,
    delaySeconds: GUARD_DELAY_SECONDS,
    policies: {
      ...EXTRA_POLICY_CONTRACTS,
      ...(erc20Transfer ? { [PolicyType.TokenWithdraw]: erc20Transfer as Address } : {}),
    },
  }
}

/** Whether guard-based policies can be configured on this chain at all. */
export const isPolicyEngineChain = (chainId: string): boolean => getPolicyDeployments(chainId) !== undefined

/**
 * The policy contract behind each type, for error messages and for reading a configuration
 * back. PolicyType carries CGW's wire vocabulary, which does not name the contract.
 */
export const POLICY_CONTRACT_NAME: Partial<Record<PolicyType, string>> = {
  [PolicyType.Allow]: 'AllowPolicy',
  [PolicyType.Deny]: 'DenyPolicy',
  [PolicyType.NativeTransfer]: 'NativeTransferPolicy',
  [PolicyType.TokenWithdraw]: 'ERC20TransferPolicy',
  [PolicyType.Cosigner]: 'CoSignerPolicy',
  [PolicyType.MultiSend]: 'MultiSendPolicy',
}

export const policyContractName = (type: PolicyType): string => POLICY_CONTRACT_NAME[type] ?? type
