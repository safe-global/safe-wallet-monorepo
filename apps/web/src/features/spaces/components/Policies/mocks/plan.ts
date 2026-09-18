import type { PolicyLock } from '../policyLock'

/** A workspace on a plan that does not include policies, as the Starter story and tests render it. */
export const mockStarterPlan: Omit<PolicyLock, 'onUpgrade'> = {
  planName: 'Starter',
  workspaceName: 'Acme Inc',
  accountCounts: {
    'spending-limit': { applied: 0, total: 6 },
    proposer: { applied: 0, total: 6 },
    'account-recovery': { applied: 0, total: 6 },
  },
}
