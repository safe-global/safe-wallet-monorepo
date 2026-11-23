import { getPolicyLabel } from './policyLabel'
import { getPolicyStatus, isAllowlistPolicy, type Policy, type PolicySafe } from '../types'
import type { AllowlistState } from '../allowlistStatus'

export const POLICY_SORT_OPTIONS = [
  { value: 'rule', label: 'Rule A–Z' },
  { value: 'appliesTo', label: 'Applies to' },
  { value: 'network', label: 'Network' },
  { value: 'status', label: 'Status' },
] as const

export type PolicySortOption = (typeof POLICY_SORT_OPTIONS)[number]['value']

/** The order used while the user has not picked a sort. */
export const DEFAULT_POLICY_SORT: PolicySortOption = 'status'

/** Names live in the address book and the chain configs, not on the policy. */
export type PolicySortContext = {
  getSafeName: (safe: PolicySafe) => string
  getChainName: (chainId: string) => string
  getAllowlistState: (policy: Extract<Policy, { type: 'allowlist' }>) => AllowlistState
}

// Pending and blocking are first because they are where the user has something to do.
const STATUS_ORDER = {
  pending: 0,
  blocking: 0,
  activating: 1,
  'change-pending': 1,
  unenforced: 2,
  'not-activated': 2,
  failed: 2,
  expired: 2,
  active: 3,
} as const

const ALLOWLIST_STATE_ORDER: Record<AllowlistState, number> = {
  'setup-pending': 0,
  'setup-ready-to-execute': 0,
  'edit-pending': 0,
  'edit-ready-to-execute': 0,
  'edit-ready-to-apply': 0,
  'edit-apply-pending': 0,
  'edit-apply-ready-to-execute': 0,
  'removal-pending': 0,
  'removal-ready-to-execute': 0,
  'removal-ready-to-apply': 0,
  'removal-apply-pending': 0,
  'removal-apply-ready-to-execute': 0,
  'guard-removal-pending': 0,
  'guard-removal-ready-to-execute': 0,
  'edit-in-delay': 1,
  'removal-in-delay': 1,
  processing: 1,
  'edit-expired': 2,
  'removal-expired': 2,
  unenforced: 2,
  failed: 2,
  active: 3,
}

// A named Safe is listed before an unnamed one, which only has its address to sort by.
const compareSafes = (a: PolicySafe, b: PolicySafe, getSafeName: PolicySortContext['getSafeName']): number => {
  const nameA = getSafeName(a)
  const nameB = getSafeName(b)

  if (nameA && nameB) return nameA.localeCompare(nameB)
  if (nameA || nameB) return nameA ? -1 : 1
  return a.address.toLowerCase().localeCompare(b.address.toLowerCase())
}

const getComparator = (
  sort: PolicySortOption,
  { getSafeName, getChainName, getAllowlistState }: PolicySortContext,
): ((a: Policy, b: Policy) => number) => {
  const getStatusOrder = (policy: Policy): number =>
    isAllowlistPolicy(policy) ? ALLOWLIST_STATE_ORDER[getAllowlistState(policy)] : STATUS_ORDER[getPolicyStatus(policy)]

  switch (sort) {
    case 'rule':
      return (a, b) => getPolicyLabel(a).localeCompare(getPolicyLabel(b))
    case 'appliesTo':
      return (a, b) => compareSafes(a.safe, b.safe, getSafeName)
    case 'network':
      return (a, b) => getChainName(a.safe.chainId).localeCompare(getChainName(b.safe.chainId))
    case 'status':
      return (a, b) => getStatusOrder(a) - getStatusOrder(b)
  }
}

export const sortPolicies = (policies: Policy[], sort: PolicySortOption, context: PolicySortContext): Policy[] =>
  [...policies].sort(getComparator(sort, context))
