import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { CosignerState } from '../types'
import { getCosignerStateMessage } from './cosignerState'

export type CosignerCheck = {
  severity: Severity
  status: string
  description: string
  details: { label: string; value: string }[]
}

const COSIGNER_NAMES: Record<string, string> = {
  SAFE: 'Safe',
  HYPERNATIVE: 'Hypernative',
  BLOCKAID: 'Blockaid',
}

const STATUS: Record<CosignerState['status'], { severity: Severity; status: string }> = {
  notRequired: { severity: Severity.OK, status: 'Not required for this transaction' },
  notProposed: { severity: Severity.INFO, status: 'Requested after you submit' },
  notFound: { severity: Severity.INFO, status: 'Requested once created' },
  pending: { severity: Severity.INFO, status: 'Waiting for the co-signer' },
  ready: { severity: Severity.OK, status: 'Signature available' },
  rejected: { severity: Severity.CRITICAL, status: 'Rejected' },
  failed: { severity: Severity.WARN, status: 'Review failed' },
  invalid: { severity: Severity.CRITICAL, status: 'Invalid signature' },
  unsupportedBatch: { severity: Severity.WARN, status: 'Not supported for this batch' },
  gasNotZero: { severity: Severity.WARN, status: 'Gas parameters not allowed' },
  unavailable: { severity: Severity.WARN, status: 'Co-signer unavailable' },
}

/** What Safe Shield shows for the co-signer: how severe, a short outcome, and the explanation */
export const getCosignerCheck = (state: CosignerState): CosignerCheck => {
  const details: CosignerCheck['details'] = []

  if ('cosigner' in state && state.cosigner) {
    details.push({ label: 'Co-signer', value: state.cosigner })
  }
  if ('cosignerName' in state) {
    details.push({ label: 'Reviewed by', value: COSIGNER_NAMES[state.cosignerName] ?? state.cosignerName })
  }
  if (state.status === 'rejected' && state.ruleId) {
    details.push({ label: 'Rule', value: state.ruleId })
  }

  return { ...STATUS[state.status], description: getCosignerStateMessage(state), details }
}
