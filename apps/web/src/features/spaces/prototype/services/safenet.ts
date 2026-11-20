import type { Proposal } from '../types'
import { getWarnings } from './model'

// Mock Safenet checks, with the states of the Safenet checks prototype: they start at the first signature.
export type SafenetCheck = 'notStarted' | 'checking' | 'passed' | 'risk'

export const SAFENET_LABELS: Record<SafenetCheck, string> = {
  notStarted: 'Starts after the first signature',
  checking: 'Checking…',
  passed: 'No issues found',
  risk: 'Risk found',
}

export const SAFENET_URL = 'https://safefoundation.org/safenet'

export const getSafenetCheck = (tx: Proposal): SafenetCheck => {
  if (tx.signers.length === 0) return 'notStarted'
  if (getWarnings(tx).some((warning) => ['delegateCall', 'unverifiedContract', 'unknownNetwork'].includes(warning)))
    return 'risk'
  // Proposed in the last hour: still checking.
  return /^\d+m ago$/.test(tx.age) ? 'checking' : 'passed'
}
