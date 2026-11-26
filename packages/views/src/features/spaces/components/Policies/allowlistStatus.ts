import { formatTimeUntil, formatUtcDayTime } from '@safe-global/utils/utils/date'
import type { PolicyStatusVariant } from './components/PolicyStatusChip'

/** The states of a recipient allowlist that have a status of their own. */
export type AllowlistState =
  | 'setup-pending'
  | 'setup-ready-to-execute'
  | 'processing'
  | 'active'
  | 'edit-pending'
  | 'edit-ready-to-execute'
  | 'edit-in-delay'
  | 'edit-ready-to-apply'
  | 'edit-apply-pending'
  | 'edit-apply-ready-to-execute'
  | 'edit-expired'
  | 'removal-pending'
  | 'removal-ready-to-execute'
  | 'removal-in-delay'
  | 'removal-ready-to-apply'
  | 'removal-apply-pending'
  | 'removal-apply-ready-to-execute'
  | 'removal-expired'
  | 'guard-removal-pending'
  | 'guard-removal-ready-to-execute'
  | 'unenforced'
  | 'failed'

/** The change the allowlist is in: the first of the two tags of its status. */
export type AllowlistChange = 'setup' | 'edit' | 'removal' | 'guard-removal'

export const ALLOWLIST_CHANGE_LABEL: Record<AllowlistChange, string> = {
  setup: 'Setup',
  edit: 'Edit',
  removal: 'Removal',
  'guard-removal': 'Guard removal',
}

type AllowlistStatusCopy = {
  /** The status of the change, the second tag; the only tag of an allowlist that is in no change. */
  label: string
  variant: PolicyStatusVariant
  /** The label ends in `n/m` once the number of signatures is known. */
  countsSignatures?: true
}

const PENDING: AllowlistStatusCopy = { label: 'Pending', variant: 'warning', countsSignatures: true }
const READY_TO_EXECUTE: AllowlistStatusCopy = { label: 'Ready to execute', variant: 'info' }
const IN_DELAY: AllowlistStatusCopy = { label: 'In delay', variant: 'warning' }
const READY_TO_APPLY: AllowlistStatusCopy = { label: 'Ready to apply', variant: 'info' }
const APPLY_PENDING: AllowlistStatusCopy = { label: 'Apply pending', variant: 'warning', countsSignatures: true }
const APPLY_READY_TO_EXECUTE: AllowlistStatusCopy = { label: 'Apply ready to execute', variant: 'info' }
const EXPIRED: AllowlistStatusCopy = { label: 'Expired', variant: 'secondary' }

export const ALLOWLIST_STATUS: Record<AllowlistState, AllowlistStatusCopy> = {
  'setup-pending': PENDING,
  'setup-ready-to-execute': READY_TO_EXECUTE,
  processing: { label: 'Processing', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
  'edit-pending': PENDING,
  'edit-ready-to-execute': READY_TO_EXECUTE,
  'edit-in-delay': IN_DELAY,
  'edit-ready-to-apply': READY_TO_APPLY,
  'edit-apply-pending': APPLY_PENDING,
  'edit-apply-ready-to-execute': APPLY_READY_TO_EXECUTE,
  'edit-expired': EXPIRED,
  'removal-pending': PENDING,
  'removal-ready-to-execute': READY_TO_EXECUTE,
  'removal-in-delay': IN_DELAY,
  'removal-ready-to-apply': READY_TO_APPLY,
  'removal-apply-pending': APPLY_PENDING,
  'removal-apply-ready-to-execute': APPLY_READY_TO_EXECUTE,
  'removal-expired': EXPIRED,
  'guard-removal-pending': PENDING,
  'guard-removal-ready-to-execute': READY_TO_EXECUTE,
  unenforced: { label: 'Not enforced', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
}

export type AllowlistSignatures = { signed: number; required: number }

export type AllowlistStatusBadge = {
  state: AllowlistState
  /** Unset while the allowlist is in no change, which shows the status alone. */
  change?: AllowlistChange
  label: string
  variant: PolicyStatusVariant
  /** What the allowlist waits for; unset when it waits for nothing. */
  tooltip?: string
}

/** `Pending · 1/2`. */
export const formatAllowlistStatus = (state: AllowlistState, signatures?: AllowlistSignatures): string => {
  const { label, countsSignatures } = ALLOWLIST_STATUS[state]

  return countsSignatures && signatures ? `${label} · ${signatures.signed}/${signatures.required}` : label
}

export const awaitingSignaturesTooltip = ({ signed, required }: AllowlistSignatures): string =>
  `Waiting for signatures: ${signed} of ${required}.`

export const AWAITING_EXECUTION_TOOLTIP = 'All signatures are in. Waiting for execution.'

/** Takes unix SECONDS. */
export const executeByTooltip = (expiresAt: number): string => `Execute it by ${formatUtcDayTime(expiresAt)}.`

/** `Can be applied in 9 minutes, from Oct 13, 13:02 UTC. Expires on Oct 20, 13:02 UTC.` Takes unix SECONDS. */
export const inDelayTooltip = (appliesAt: number, expiresAt: number | undefined, nowMs: number): string => {
  const from = `Can be applied in ${formatTimeUntil(appliesAt, nowMs)}, from ${formatUtcDayTime(appliesAt)}.`

  return expiresAt === undefined ? from : `${from} Expires on ${formatUtcDayTime(expiresAt)}.`
}

/** Takes unix SECONDS. */
export const readyToApplyTooltip = (expiresAt: number | undefined): string =>
  expiresAt === undefined
    ? 'A signer must apply it. Nothing happens by itself.'
    : `A signer must apply it by ${formatUtcDayTime(expiresAt)}. Nothing happens by itself.`

export const EXPIRED_TOOLTIP = 'It was not applied in time. The current rules stay in force.'

export const SIGNING_EXPIRED_TOOLTIP = 'It can no longer be signed. The current rules stay in force.'

export const GUARD_REMOVAL_TOOLTIP =
  "Waiting for a signer to remove the guard. Until then, this Safe account can't send anything."

export const PROCESSING_TOOLTIP = 'The transaction is executed. It can take a moment to show here.'

export const FAILED_TOOLTIP = 'The transaction failed. Nothing changed on this account.'
