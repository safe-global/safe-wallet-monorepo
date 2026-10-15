import { clusterByNonce, getPrimaryStatus, getState } from '../../services/model'
import type { Account, Direction, Filter, Persona, Proposal } from '../../types'
import { STATUS_META, STATUS_ORDER, type GroupBy } from '../shared'
import { inSelection } from '../QueueFilters/useQueueFilters'

export type QueueSectionData = {
  id: string
  category: 'safe' | 'all' | Filter
  label: string
  account?: Account
  items: Proposal[]
}

const byNonce = (a: Proposal, b: Proposal) => a.nonce - b.nonce

// Direction is the legacy A/B design switch: Safe queues keep nonce order, the action inbox sorts by what you can do.
const orderForDirection = (visible: Proposal[], accounts: Account[], persona: Persona, direction: Direction) => {
  if (direction === 'queues')
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
        : STATUS_ORDER.map((status) => ({
            id: `status-${status}`,
            category: status,
            label: STATUS_META[status].label,
            items: ordered.filter((tx) => getPrimaryStatus(tx, persona) === status),
          }))
  return sections.map((section) => ({ ...section, items: clusterByNonce(section.items) }))
}

export const getColumns = (groupBy: GroupBy, isWide: boolean) => [
  'Type',
  ...(groupBy !== 'safe' ? ['Safe'] : []),
  ...(groupBy !== 'safe' && isWide ? ['Network'] : []),
  'Signatures',
  ...(isWide ? ['Note'] : []),
  'Status',
  'Action',
]
