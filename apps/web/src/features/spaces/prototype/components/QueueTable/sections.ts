import { clusterByNonce, getCreatedAt } from '../../services/model'
import type { Account, Persona, Proposal } from '../../types'
import { inSelection } from '../QueueFilters/useQueueFilters'
import { getStepKind, STEP_RANK } from '../../services/nextSteps'

export type QueueSectionData = {
  id: string
  label: string
  account: Account
  items: Proposal[]
  // The most urgent step in this Safe, and when its oldest actionable transaction was proposed.
  urgency?: Urgency
}

type Urgency = { rank: number; oldest: number }

const byNonce = (a: Proposal, b: Proposal) => a.nonce - b.nonce

export function buildSections({
  visible,
  accounts,
  accountFilter,
  persona,
  order,
}: {
  visible: Proposal[]
  accounts: Account[]
  accountFilter: string[]
  persona: Persona
  // Account ids in a fixed order, so acting on a transaction doesn't move its Safe.
  order?: string[]
}): QueueSectionData[] {
  const ranked = accounts
    .filter((account) => inSelection(accountFilter, account.id))
    .map((account) => {
      const items = clusterByNonce(visible.filter((tx) => tx.account === account.id).sort(byNonce))
      return { id: `safe-${account.id}`, label: account.name, account, items, urgency: getUrgency(items, persona) }
    })
  if (order) {
    const position = (section: QueueSectionData) => {
      const index = order.indexOf(section.account.id)
      return index < 0 ? order.length : index
    }
    return ranked.sort((a, b) => position(a) - position(b))
  }
  // Array sort is stable, so ties keep the workspace order.
  return ranked.sort((a, b) => compareUrgency(a.urgency, b.urgency))
}

// Safes you can act on come first: most urgent step, then the one waiting longest. Other Safes keep their order.
export const rankAccounts = (accounts: Account[], items: Proposal[], persona: Persona) =>
  accounts
    .map((account) => ({
      account,
      urgency: getUrgency(
        items.filter((tx) => tx.account === account.id),
        persona,
      ),
    }))
    .sort((a, b) => compareUrgency(a.urgency, b.urgency))
    .map(({ account }) => account)

// Nonces are per Safe, so age, not nonce, breaks ties between Safes.
const getUrgency = (items: Proposal[], persona: Persona): Urgency | undefined => {
  const steps = items.flatMap((tx) => {
    const kind = getStepKind(tx, persona)
    return kind ? [{ rank: STEP_RANK.indexOf(kind), created: getCreatedAt(tx) }] : []
  })
  if (!steps.length) return undefined
  const rank = Math.min(...steps.map((step) => step.rank))
  return { rank, oldest: Math.min(...steps.filter((step) => step.rank === rank).map((step) => step.created)) }
}

const compareUrgency = (a?: Urgency, b?: Urgency) => {
  if (!a || !b) return a ? -1 : b ? 1 : 0
  return a.rank - b.rank || a.oldest - b.oldest
}

// The Safe header already names the Safe and its chain.
// Option C gives the other party its own column, so it lines up from row to row.
export const getColumns = (isWide: boolean, alignTo = false) => [
  'Nonce',
  'Transaction',
  ...(alignTo ? ['To'] : []),
  // A chain column instead of splitting the queue by chain (Oct 22 review).
  'Chain',
  'Proposed',
  ...(isWide ? ['Note'] : []),
  'Signatures',
  'Status',
  'Action',
]
