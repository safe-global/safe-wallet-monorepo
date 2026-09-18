import type { PolicyCatalogueLock } from '../PolicyCatalogue'
import type { PolicyUpsellPlan } from '../PolicyUpsellBanner'

/** A workspace on a plan that does not include policies, as the Starter story and tests render it. */
export const mockStarterPlan: PolicyUpsellPlan & Pick<PolicyCatalogueLock, 'accountCounts'> = {
  planName: 'Starter',
  workspaceName: 'Acme Inc',
  accountCounts: {
    'spending-limit': { applied: 0, total: 6 },
    proposer: { applied: 0, total: 6 },
    'account-recovery': { applied: 0, total: 6 },
  },
}
