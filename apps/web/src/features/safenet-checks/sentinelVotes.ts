import { CheckEventType, type SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'

/** Rule codes a denying sentinel reveals as its reason (Safenet `sentinel-engine` rules). */
const RULE_NAMES: Record<string, string> = {
  'R-4.1': 'Settings change',
  'R-4.2': 'Delegatecall integrity',
  'R-4.3': 'Value target',
  'R-4.4': 'Authorization target',
  'R-4.5': 'Excessive approval',
  'R-4.6': 'Known malicious target',
}

export type SentinelVote = {
  sentinel: string
  vote: 'committed' | 'approved' | 'denied'
  reason?: string
}

/**
 * One entry per sentinel that committed to the snapshot's active request, upgraded to its revealed
 * vote and reason once it reveals. Votes on older requests for the same transaction are ignored.
 */
export const sentinelVotes = (snapshot: SafenetCheckSnapshot | undefined): SentinelVote[] => {
  const requestId = snapshot?.requestId?.toLowerCase()
  if (!snapshot || !requestId) return []

  const votes = new Map<string, SentinelVote>()
  for (const event of snapshot.events) {
    if (event.type === CheckEventType.SENTINEL_COMMITTED && event.requestId.toLowerCase() === requestId) {
      votes.set(event.sentinel.toLowerCase(), { sentinel: event.sentinel, vote: 'committed' })
    }
    if (event.type === CheckEventType.SENTINEL_REVEALED && event.requestId.toLowerCase() === requestId) {
      const vote = event.approved ? 'approved' : 'denied'
      votes.set(event.sentinel.toLowerCase(), { sentinel: event.sentinel, vote, reason: event.reason || undefined })
    }
  }
  return [...votes.values()]
}

/** "R-4.5 Excessive approval" for a known rule code; any other reason as revealed. */
export const ruleLabel = (reason: string): string => (RULE_NAMES[reason] ? `${reason} ${RULE_NAMES[reason]}` : reason)
