import { OperationType } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { POLICY_LABELS } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '@/features/policy-guard'
import { getPolicyEngineAddress, isFallbackAccess, type PolicyEngineContract } from '@/features/policy-guard/services'

export type RuleKind = keyof typeof POLICY_LABELS

const RULE_POLICIES: [RuleKind, PolicyEngineContract][] = [
  ['erc20', 'ERC20TransferPolicy'],
  ['native', 'NativeTransferPolicy'],
  ['allow', 'AllowPolicy'],
  ['deny', 'DenyPolicy'],
  ['multiSend', 'MultiSendPolicy'],
]

export const getRuleKind = (chainId: string, { policy }: PolicyConfiguration): RuleKind =>
  RULE_POLICIES.find(([, contract]) => sameAddress(getPolicyEngineAddress(chainId, contract), policy))?.[0] ?? 'unknown'

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
  const kind = getRuleKind(chainId, fallback)
  return kind === 'allow' || kind === 'deny' ? kind : undefined
}
