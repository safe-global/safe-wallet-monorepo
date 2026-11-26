import { AbiCoder } from 'ethers'
import { OperationType } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { POLICY_LABELS } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import {
  getPolicyEngineAddress,
  type PolicyEngineContract,
} from '@/features/policy-guard/public/services/policyEngineDeployments'
import { isFallbackAccess } from '@/features/policy-guard/public/services/fallbackAccess'
import { isRejectAccess } from '@/features/policy-guard/public/services/rejectAccess'

export type RuleKind = keyof typeof POLICY_LABELS

const RULE_POLICIES: [RuleKind, PolicyEngineContract][] = [
  ['erc20', 'ERC20TransferPolicy'],
  ['native', 'NativeTransferPolicy'],
  ['allow', 'AllowPolicy'],
  ['deny', 'DenyPolicy'],
  ['multiSend', 'MultiSendPolicy'],
]

const PERMISSION_NONE = 0n

/** Whether ERC-20 transfer policy data revokes every recipient it names, as a removal does before unbinding the rule. */
const revokesEveryRecipient = (data: string): boolean => {
  let entries: Array<[string, bigint]>
  try {
    entries = AbiCoder.defaultAbiCoder().decode(['tuple(address recipient, uint8 permission)[]'], data)[0]
  } catch {
    return false
  }
  return entries.length > 0 && entries.every(([, permission]) => permission === PERMISSION_NONE)
}

const getPolicyKind = (chainId: string, policy: string): RuleKind =>
  RULE_POLICIES.find(([, contract]) => sameAddress(getPolicyEngineAddress(chainId, contract), policy))?.[0] ?? 'unknown'

export const getRuleKind = (chainId: string, configuration: PolicyConfiguration, safeAddress: string): RuleKind => {
  if (sameAddress(configuration.policy, ZERO_ADDRESS)) return 'removal'

  const kind = getPolicyKind(chainId, configuration.policy)
  if (kind === 'allow' && isRejectAccess(configuration, safeAddress)) return 'reject'
  if (kind === 'allow' && !isFallbackAccess(configuration)) return 'allowCall'
  if (kind === 'erc20' && revokesEveryRecipient(configuration.data)) return 'erc20Revoke'
  return kind
}

export type InstalledFallback = 'allow' | 'deny'

/** The CALL fallback the setup installs; undefined when it installs none, as on a Safe that already has the guard. */
export const getInstalledFallback = (
  chainId: string,
  configurations: PolicyConfiguration[],
): InstalledFallback | undefined => {
  const fallback = configurations.find(
    (configuration) => isFallbackAccess(configuration) && configuration.operation === OperationType.Call,
  )
  if (!fallback) return undefined
  const kind = getPolicyKind(chainId, fallback.policy)
  return kind === 'allow' || kind === 'deny' ? kind : undefined
}
