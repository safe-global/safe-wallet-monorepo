import type { ActivePolicyProps } from './ActivePolicy'
import type { PendingPolicyProps } from './PendingPolicy'

export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  NOT_ACTIVATED = 'NOT_ACTIVATED',
}

/** Content props per status — the not-activated variant carries no data yet. */
export type PolicyVariantContentProps =
  | ({ status: PolicyStatus.ACTIVE } & ActivePolicyProps)
  | ({ status: PolicyStatus.PENDING } & PendingPolicyProps)
  | { status: PolicyStatus.NOT_ACTIVATED }
