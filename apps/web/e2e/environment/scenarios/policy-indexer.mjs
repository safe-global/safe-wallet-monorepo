import { isAddress } from 'ethers'
import { runInLocalService } from './local-service.mjs'

/**
 * Makes the local policy indexer (infra/mocks/policy-indexer.ts) serve `state` for the Safe, in place of what it had;
 * the mock's Binding and Root types document the rows. The gateway caches the indexer's answer for 2 seconds.
 *
 * @param {{ SAFE_E2E_PROJECT?: string }} env
 * @param {{ chainId: number, safe: string }} target
 * @param {{ GuardPolicyBinding?: unknown[], ConfigurationRoot?: unknown[] }} state
 */
export async function registerGuardPolicies(
  env,
  { chainId, safe },
  { GuardPolicyBinding = [], ConfigurationRoot = [] },
) {
  if (!Number.isSafeInteger(chainId) || !isAddress(safe)) {
    throw new Error('Guard policies need a numeric chain ID and a Safe address')
  }
  await runInLocalService(
    env,
    'policy-indexer',
    ['node', '/mocks/policy-indexer.ts', 'register', String(chainId), safe],
    JSON.stringify({ GuardPolicyBinding, ConfigurationRoot }),
  )
}
