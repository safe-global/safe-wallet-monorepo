import type { PendingPolicyProps } from './PendingPolicy'

export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  NOT_ACTIVATED = 'NOT_ACTIVATED',
}

/** Content props per status — only the pending variant carries data so far. */
export type PolicyVariantContentProps =
  | ({ status: PolicyStatus.PENDING } & PendingPolicyProps)
  | { status: PolicyStatus.ACTIVE }
  | { status: PolicyStatus.NOT_ACTIVATED }
