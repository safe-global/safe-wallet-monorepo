import type { PolicyId } from './PolicyCatalogue/catalogue'

/** How many of the workspace's Safe accounts have a policy. What is counted is open in WA-3552. */
export type PolicyAccountCount = {
  applied: number
  total: number
}

/** The workspace's plan does not include policies: the page shows the upgrade banner and gates every policy tile. */
export type PolicyLock = {
  /** The plan the workspace is on, for example `Starter`. */
  planName: string
  workspaceName: string
  accountCounts: Record<PolicyId, PolicyAccountCount>
  onUpgrade: () => void
}
