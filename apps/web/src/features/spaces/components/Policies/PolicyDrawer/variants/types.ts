import type { ActivePolicyProps } from './ActivePolicy'
import type { NotActivatedPolicyProps } from './NotActivatedPolicy'
import type { PendingPolicyProps } from './PendingPolicy'

export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  NOT_ACTIVATED = 'NOT_ACTIVATED',
}

/** Content props per status. */
export type PolicyVariantContentProps =
  | ({ status: PolicyStatus.ACTIVE } & ActivePolicyProps)
  | ({ status: PolicyStatus.PENDING } & PendingPolicyProps)
  | ({ status: PolicyStatus.NOT_ACTIVATED } & NotActivatedPolicyProps)
