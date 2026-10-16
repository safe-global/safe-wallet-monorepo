export type NestedSafeWithStatus = {
  address: string
  /** Whether this safe was deployed by a trusted deployer (owner/parent/parent-deployer) */
  isValid: boolean
  /** Whether this safe is curated (selected by user) */
  isCurated: boolean
}
