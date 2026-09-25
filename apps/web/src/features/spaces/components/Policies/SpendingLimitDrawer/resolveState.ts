import type { PendingPolicyOperation, PendingSpendingLimitPolicy, SpendingLimitPolicy } from '../types'
import {
  ACTIVE_CONNECT_HELPER,
  CONNECT_TO_SIGN_LINE,
  NOT_A_SIGNER_HELPER,
  PENDING_BANNER_TITLE,
  connectHelper,
  executeLine,
  signedAndWaitingLine,
  signAndExecuteLine,
} from './copy'

export type Viewer = {
  address?: string
  isSigner: boolean
  hasSigned: boolean
}

export type ActiveDrawerState = {
  kind: 'active'
  action: 'manage' | 'connect'
  disabled: boolean
  helper?: string
}

export type PendingDrawerState = {
  kind: 'pending'
  operation: PendingPolicyOperation
  action: 'review' | 'connect' | 'copy-link'
  bannerTitle: string
  bannerLine2?: string
  helper?: string
  signed: number
  required: number
}

export type SpendingLimitDrawerState = ActiveDrawerState | PendingDrawerState

export type DrawerPolicy = (SpendingLimitPolicy & { status: 'active' }) | PendingSpendingLimitPolicy

const resolveActive = (viewer: Viewer): ActiveDrawerState => {
  if (!viewer.address) return { kind: 'active', action: 'connect', disabled: false, helper: ACTIVE_CONNECT_HELPER }
  if (!viewer.isSigner) return { kind: 'active', action: 'manage', disabled: true, helper: NOT_A_SIGNER_HELPER }

  return { kind: 'active', action: 'manage', disabled: false }
}

const resolvePending = (policy: PendingSpendingLimitPolicy, viewer: Viewer, safeName: string): PendingDrawerState => {
  const base = {
    kind: 'pending',
    operation: policy.operation,
    bannerTitle: PENDING_BANNER_TITLE[policy.operation],
    signed: policy.confirmationsSubmitted,
    required: policy.confirmationsRequired,
  } as const

  if (!viewer.address) {
    return { ...base, action: 'connect', bannerLine2: CONNECT_TO_SIGN_LINE, helper: connectHelper(safeName) }
  }

  // Anyone can execute a fully signed Safe transaction, so this outranks the signer checks below.
  if (policy.confirmationsSubmitted >= policy.confirmationsRequired) {
    return { ...base, action: 'review', bannerLine2: executeLine(policy.operation) }
  }

  if (!viewer.isSigner) return { ...base, action: 'copy-link' }

  if (viewer.hasSigned) {
    const missing = policy.confirmationsRequired - policy.confirmationsSubmitted

    return { ...base, action: 'copy-link', bannerLine2: signedAndWaitingLine(missing) }
  }

  return { ...base, action: 'review', bannerLine2: signAndExecuteLine(policy.operation) }
}

export const resolveSpendingLimitDrawerState = (
  policy: DrawerPolicy,
  viewer: Viewer,
  safeName: string,
): SpendingLimitDrawerState =>
  policy.status === 'pending' ? resolvePending(policy, viewer, safeName) : resolveActive(viewer)
