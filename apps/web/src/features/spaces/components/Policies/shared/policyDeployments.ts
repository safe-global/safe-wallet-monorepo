import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
// One source of truth: the guard check in the transaction Copilot recognises the same deployments.
import { SAFE_POLICY_GUARD_BY_DELAY } from '@safe-global/utils/services/policy-guard'

/**
 * Policy-engine deployments, as the source for addresses CGW cannot report.
 *
 * CGW is still preferred where it answers: its active-policy entries carry the guard and
 * policy a Safe is actually configured with. But it has no catalogue route, so a Safe with
 * nothing configured yet has no CGW answer to build against.
 *
 * The addresses are the ones safe-global/policy-indexer tracks (`config.yaml`), not the
 * deterministic set in safe-research/policy-engine `networks.json`. That distinction is
 * load-bearing: the indexer is what turns an on-chain `RootApplied` into something CGW can
 * report, so a configuration made against a guard it does not watch is invisible to the UI
 * even though it succeeded on-chain.
 */
export type PolicyDeployments = {
  safePolicyGuard: Address
  /** The guard's configuration DELAY, which is fixed per deployment. */
  delaySeconds: number
  policies: Partial<Record<PolicyType, Address>>
}

export const GUARD_DELAY_SECONDS = 5

/**
 * The deployed policy contracts, one per type.
 *
 * The same deployment family the indexer watches — its ERC20ApprovePolicy and
 * ERC20TransferPolicy entries are these exact addresses, which is what ties the two lists
 * together. The indexer's `config.yaml` only names those two, so the rest come from the
 * policy-engine deployment list directly.
 */
const POLICY_CONTRACTS: Partial<Record<PolicyType, Address>> = {
  [PolicyType.Allow]: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
  [PolicyType.Deny]: '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436',
  [PolicyType.Cosigner]: '0xd9f2A31C5C68422a466754cd4F4965Be2b6024FB',
  [PolicyType.TokenWithdraw]: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
  [PolicyType.MultiSend]: '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c',
  [PolicyType.NativeTransfer]: '0x01b792988be451C5F6327b6e2D215Ff1d4cc7246',
}

/**
 * Deployed policies with no PolicyType yet, because no wizard configures them. Kept so the
 * addresses are not lost when one does.
 */
export const ERC20_APPROVE_POLICY: Address = '0xfF86DD4caf79672E55e0C3e3A5410746600d60F4'
export const ALLOWED_MODULE_POLICY: Address = '0x4736245188E315cB18b5DC2A9D7f92893D6e8CD7'

/**
 * Chains the indexer watches policy contracts on. Anything else has no guard-based
 * policies, which is why `useAvailablePolicies` offers nothing there.
 */
export const POLICY_ENGINE_DEPLOYMENTS: Record<string, PolicyDeployments> = {
  // Polygon
  '137': {
    safePolicyGuard: SAFE_POLICY_GUARD_BY_DELAY[GUARD_DELAY_SECONDS],
    delaySeconds: GUARD_DELAY_SECONDS,
    policies: { ...POLICY_CONTRACTS },
  },
  // Sepolia
  '11155111': {
    safePolicyGuard: SAFE_POLICY_GUARD_BY_DELAY[GUARD_DELAY_SECONDS],
    delaySeconds: GUARD_DELAY_SECONDS,
    policies: { ...POLICY_CONTRACTS },
  },
}

export const getPolicyDeployments = (chainId: string): PolicyDeployments | undefined =>
  POLICY_ENGINE_DEPLOYMENTS[chainId]

/** Whether guard-based policies can be configured on this chain at all. */
export const isPolicyEngineChain = (chainId: string): boolean => chainId in POLICY_ENGINE_DEPLOYMENTS

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
