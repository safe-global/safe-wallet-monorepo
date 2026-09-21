import { PolicyStatus } from './variants/types'

export type PolicyStatusColor = 'success' | 'warning' | 'destructive'

const STATUS_LABELS: Record<PolicyStatus, string> = {
  [PolicyStatus.ACTIVE]: 'Active',
  [PolicyStatus.PENDING]: 'Pending',
  [PolicyStatus.NOT_ACTIVATED]: 'Not activated',
}

const STATUS_COLORS: Record<PolicyStatus, PolicyStatusColor> = {
  [PolicyStatus.ACTIVE]: 'success',
  [PolicyStatus.PENDING]: 'warning',
  [PolicyStatus.NOT_ACTIVATED]: 'destructive',
}

export const getPolicyStatusLabel = (status: PolicyStatus): string => STATUS_LABELS[status]

export const getPolicyStatusColor = (status: PolicyStatus): PolicyStatusColor => STATUS_COLORS[status]
