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

type AllowlistStatusCopy = {
  label: string
  variant: PolicyStatusVariant
  /** The label ends in `n/m` once the number of signatures is known. */
  countsSignatures?: true
}

export const ALLOWLIST_STATUS: Record<AllowlistState, AllowlistStatusCopy> = {
  'setup-pending': { label: 'Setup pending', variant: 'warning', countsSignatures: true },
  'setup-ready-to-execute': { label: 'Setup ready to execute', variant: 'info' },
  processing: { label: 'Processing', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
  'edit-pending': { label: 'Edit pending', variant: 'warning', countsSignatures: true },
  'edit-ready-to-execute': { label: 'Edit ready to execute', variant: 'info' },
  'edit-in-delay': { label: 'Edit in delay', variant: 'warning' },
  'edit-ready-to-apply': { label: 'Edit ready to apply', variant: 'info' },
  'edit-apply-pending': { label: 'Edit apply pending', variant: 'warning', countsSignatures: true },
  'edit-apply-ready-to-execute': { label: 'Edit apply ready to execute', variant: 'info' },
  'edit-expired': { label: 'Edit expired', variant: 'secondary' },
  'removal-pending': { label: 'Removal pending', variant: 'warning', countsSignatures: true },
  'removal-ready-to-execute': { label: 'Removal ready to execute', variant: 'info' },
  'removal-in-delay': { label: 'Removal in delay', variant: 'warning' },
  'removal-ready-to-apply': { label: 'Removal ready to apply', variant: 'info' },
  'removal-apply-pending': { label: 'Removal apply pending', variant: 'warning', countsSignatures: true },
  'removal-apply-ready-to-execute': { label: 'Removal apply ready to execute', variant: 'info' },
  'removal-expired': { label: 'Removal expired', variant: 'secondary' },
  'guard-removal-pending': { label: 'Guard removal pending', variant: 'warning', countsSignatures: true },
  'guard-removal-ready-to-execute': { label: 'Guard removal ready to execute', variant: 'info' },
  unenforced: { label: 'Not enforced', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
}

export type AllowlistSignatures = { signed: number; required: number }

export type AllowlistStatusBadge = {
  state: AllowlistState
  label: string
  variant: PolicyStatusVariant
  /** What the allowlist waits for; unset when it waits for nothing. */
  tooltip?: string
}

/** `Edit pending · 1/2`. */
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

export const GUARD_REMOVAL_TOOLTIP =
  "Waiting for a signer to remove the guard. Until then, this Safe account can't send anything."

export const PROCESSING_TOOLTIP = 'The transaction is executed. It can take a moment to show here.'

export const FAILED_TOOLTIP = 'The transaction failed. Nothing changed on this account.'
