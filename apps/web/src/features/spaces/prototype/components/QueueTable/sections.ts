import { clusterByNonce, getPrimaryStatus, getState } from '../../services/model'
import type { Account, Direction, Filter, Persona, Proposal } from '../../types'
import { CONFLICTING_META, STATUS_META, STATUS_ORDER, type GroupBy } from '../shared'
import { inSelection } from '../QueueFilters/useQueueFilters'
import { getStepKind, STEP_RANK } from '../../services/nextSteps'

export type QueueSectionData = {
  id: string
  category: 'safe' | 'all' | Filter | 'conflicting'
  label: string
  account?: Account
  items: Proposal[]
  // Next steps: rank of the most urgent step in this Safe. Lower is more urgent.
  urgency?: number
}

const byNonce = (a: Proposal, b: Proposal) => a.nonce - b.nonce

// Safe queues and next steps use nonce order. The action inbox sorts by what you can do.
const orderForDirection = (visible: Proposal[], accounts: Account[], persona: Persona, direction: Direction) => {
  if (direction !== 'inbox')
    return accounts.flatMap((account) => visible.filter((tx) => tx.account === account.id).sort(byNonce))
  const state = (tx: Proposal) => getState(tx, persona)
  return [
    ...visible.filter((tx) => state(tx).ready || state(tx).finalSignature),
    ...visible.filter((tx) => state(tx).canSign && !state(tx).finalSignature),
    ...visible.filter((tx) => !state(tx).canSign && !state(tx).ready),
  ]
}

export function buildSections({
  visible,
  accounts,
  accountFilter,
  persona,
  direction,
  groupBy,
}: {
  visible: Proposal[]
  accounts: Account[]
  accountFilter: string[]
  persona: Persona
  direction: Direction
  groupBy: GroupBy
}): QueueSectionData[] {
  const ordered = orderForDirection(visible, accounts, persona, direction)
  // Next steps: options at a conflicting nonce go to their own section.
  const nonceKey = (tx: Proposal) => `${tx.account}:${tx.nonce}`
  const conflictKeys = new Set(
    visible.map(nonceKey).filter((key, index, keys) => keys.indexOf(key) !== keys.lastIndexOf(key)),
  )
  const isConflicting = (tx: Proposal) => direction === 'steps' && conflictKeys.has(nonceKey(tx))
  const accountOrder = (tx: Proposal) => accounts.findIndex((account) => account.id === tx.account)
  const sections: QueueSectionData[] =
    groupBy === 'safe'
      ? accounts
          .filter((account) => inSelection(accountFilter, account.id))
          .map((account) => ({
            id: `safe-${account.id}`,
            category: 'safe',
            label: account.name,
            account,
            items: visible.filter((tx) => tx.account === account.id).sort(byNonce),
          }))
      : groupBy === 'none'
        ? [{ id: 'ungrouped', category: 'all', label: 'Pending', items: ordered }]
        : STATUS_ORDER.flatMap((status) => [
            {
              id: `status-${status}`,
              category: status,
              label: STATUS_META[status].label,
              items: ordered.filter((tx) => !isConflicting(tx) && getPrimaryStatus(tx, persona) === status),
            },
            ...(direction === 'steps' && status === 'sign'
              ? [
                  {
                    id: 'status-conflicting',
                    category: 'conflicting' as const,
                    label: CONFLICTING_META.label,
                    items: visible
                      .filter(isConflicting)
                      .sort((a, b) => accountOrder(a) - accountOrder(b) || byNonce(a, b)),
                  },
                ]
              : []),
          ])
  const clustered = sections.map((section) => ({ ...section, items: clusterByNonce(section.items) }))
  if (direction === 'steps' && groupBy === 'status') return clustered.filter((section) => section.items.length > 0)
  if (direction !== 'steps' || groupBy !== 'safe') return clustered
  const ranked = clustered.map((section) => ({ ...section, urgency: getUrgency(section.items, persona) }))
  return ranked.sort((a, b) => (a.urgency ?? STEP_RANK.length) - (b.urgency ?? STEP_RANK.length))
}

// Safes that need you come first, by most urgent step. Other Safes keep their order.
export const rankAccounts = (accounts: Account[], items: Proposal[], persona: Persona) =>
  accounts
    .map((account) => ({
      account,
      urgency: getUrgency(
        items.filter((tx) => tx.account === account.id),
        persona,
      ),
    }))
    .sort((a, b) => (a.urgency ?? STEP_RANK.length) - (b.urgency ?? STEP_RANK.length))
    .map(({ account }) => account)

const getUrgency = (items: Proposal[], persona: Persona) => {
  const ranks = items.flatMap((tx) => {
    const kind = getStepKind(tx, persona)
    return kind ? [STEP_RANK.indexOf(kind)] : []
  })
  return ranks.length ? Math.min(...ranks) : undefined
}

const safeColumns = (groupBy: GroupBy, isWide: boolean) => [
  ...(groupBy !== 'safe' ? ['Safe'] : []),
  ...(groupBy !== 'safe' && isWide ? ['Network'] : []),
]

export const getColumns = (groupBy: GroupBy, isWide: boolean, steps = false) =>
  steps
    ? [
        'Nonce',
        'Transaction',
        ...(groupBy !== 'safe' ? ['Safe'] : []),
        'With',
        'Chain',
        'Proposed',
        ...(isWide ? ['Note'] : []),
        'Signatures',
        'Status',
        'Action',
      ]
    : [
        'Type',
        'Nonce',
        ...safeColumns(groupBy, isWide),
        'Signatures',
        ...(isWide ? ['Note'] : []),
        'Status',
        'Proposed',
        'Action',
      ]
