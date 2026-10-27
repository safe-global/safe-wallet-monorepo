import type { Address } from 'viem'
import type { MetaTransactionData } from '@safe-global/types-kit'
import type { GuardConfiguration, GuardSetup } from '@safe-global/views/features/spaces/components/Policies/types'
import { computeConfigureRoot, encodeApplyConfiguration, encodeRequestConfiguration } from '../shared/guardTx'
import { getPolicyDeployments } from '../shared/policyDeployments'

// False rather than a throw on a payload the ABI coder rejects: this runs during render.
const matchesRoot = (configurations: GuardConfiguration[], root: string): boolean => {
  try {
    return computeConfigureRoot(configurations).toLowerCase() === root.toLowerCase()
  } catch {
    return false
  }
}

/**
 * The transaction that moves a delayed guard change on: its request, or its apply once the delay has passed.
 *
 * Undefined when it cannot be built safely: without the configurations behind the root, or with ones that hash to
 * another root, the guard would revert the transaction.
 */
export const buildGuardSetupTx = (
  setup: GuardSetup,
  chainId: string,
  step: 'request' | 'apply',
): MetaTransactionData | undefined => {
  if (setup.flow !== 'delayed' || !setup.configurations?.length) return undefined
  if (!matchesRoot(setup.configurations, setup.root)) return undefined

  // A draft was never requested on a guard, so it goes to the chain's deployment.
  const guard = setup.guard ?? getPolicyDeployments(chainId)?.safePolicyGuard
  if (!guard) return undefined

  return step === 'apply'
    ? encodeApplyConfiguration(guard as Address, setup.configurations)
    : encodeRequestConfiguration(guard as Address, setup.configurations)
}
