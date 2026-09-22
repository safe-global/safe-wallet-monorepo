import { getPolicyLabel } from './policyLabel'
import { getPolicyStatus, type Policy } from '../types'

export const POLICY_SORT_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'rule', label: 'Rule A–Z' },
] as const

export type PolicySortOption = (typeof POLICY_SORT_OPTIONS)[number]['value']

export const DEFAULT_POLICY_SORT: PolicySortOption = 'status'

// Pending is first because it is the only status where the user has something to do.
const STATUS_ORDER = { pending: 0, unenforced: 1, active: 2 } as const

const COMPARATORS: Record<PolicySortOption, (a: Policy, b: Policy) => number> = {
  rule: (a, b) => getPolicyLabel(a).localeCompare(getPolicyLabel(b)),
  status: (a, b) => STATUS_ORDER[getPolicyStatus(a)] - STATUS_ORDER[getPolicyStatus(b)],
}

export const sortPolicies = (policies: Policy[], sort: PolicySortOption): Policy[] =>
  [...policies].sort(COMPARATORS[sort])
