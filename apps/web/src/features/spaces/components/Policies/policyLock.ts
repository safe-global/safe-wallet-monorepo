import type { PolicyId } from './PolicyCatalogue/catalogue'

/** How many of the workspace's Safe accounts have a policy. What is counted is open in WA-3552. */
export type PolicyAccountCount = {
  applied: number
  total: number
}

/** The workspace's plan does not include some policies: the page shows the upgrade banner and gates those tiles. */
export type PolicyLock = {
  /** The plan the workspace is on, for example `Starter`. */
  planName: string
  workspaceName: string
  /** The policies the plan does not include. Setting one up leads to the upgrade. */
  lockedPolicies: PolicyId[]
  /** Without it the locked tiles show no counter. */
  accountCounts?: Record<PolicyId, PolicyAccountCount>
  onUpgrade: () => void
}
