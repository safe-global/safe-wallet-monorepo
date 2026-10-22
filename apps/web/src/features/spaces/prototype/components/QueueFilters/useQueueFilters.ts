import { useState } from 'react'
import {
  knownAccounts,
  getAccount,
  getConflicts,
  getTransactionLabel,
  getTypeLabel,
  matchesFilter,
} from '../../services/model'
import type { Account, Filter, Persona, Proposal } from '../../types'
import { FLAG_META, FLAGS, RECOVERY_TYPE, STATUS_META, type Flag } from '../shared'
import { getRecoveryHeadline, type Recovery } from '../Recovery/recoveryData'
import { isStale } from '../../services/fleet'

export type FilterSection = 'accounts' | 'networks' | 'types' | 'statuses' | 'flags'
export type QueueFilterValues = {
  accounts: string[]
  networks: string[]
  types: string[]
  statuses: Filter[]
  search: string
}

export const inSelection = <T>(selection: T[], value: T) => selection.length === 0 || selection.includes(value)
export const toggled = <T>(selection: T[], value: T) =>
  selection.includes(value) ? selection.filter((item) => item !== value) : [...selection, value]
const summarise = (values: string[]) => (values.length === 0 ? undefined : String(values.length))

export const matchesFlag = (tx: Proposal, flag: Flag, items: Proposal[]) =>
  flag === 'conflicting' ? getConflicts(tx, items).length > 0 : isStale(tx)

export function useQueueFilters(
  items: Proposal[],
  accounts: Account[],
  persona: Persona,
  initial: Partial<QueueFilterValues> = {},
  recoveries: Recovery[] = [],
  exclusive = false,
) {
  const [accountFilter, setAccountFilter] = useState<string[]>(initial.accounts ?? [])
  const [networkFilter, setNetworkFilter] = useState<string[]>(initial.networks ?? [])
  const [typeFilter, setTypeFilter] = useState<string[]>(initial.types ?? [])
  const [stateFilter, setStateFilter] = useState<Filter[]>(initial.statuses ?? [])
  const [flags, setFlags] = useState<Flag[]>([])
  const [search, setSearch] = useState(initial.search ?? '')
  const networks = [...new Set(accounts.map((account) => account.network))]

  // An empty selection means the section isn't filtering.
  // Flags narrow the statuses. A transaction needs any one of the checked flags.
  const passes = (tx: Proposal, skip: FilterSection[] = []) =>
    (skip.includes('accounts') || inSelection(accountFilter, tx.account)) &&
    (skip.includes('networks') || inSelection(networkFilter, getAccount(tx).network)) &&
    (skip.includes('types') || inSelection(typeFilter, getTypeLabel(tx))) &&
    (skip.includes('statuses') ||
      !stateFilter.length ||
      stateFilter.some((status) => matchesFilter(tx, status, persona, exclusive))) &&
    (skip.includes('flags') || !flags.length || flags.some((flag) => matchesFlag(tx, flag, items))) &&
    `${getTransactionLabel(tx)} ${tx.recipient} ${tx.amount} ${tx.nonce} ${getAccount(tx).name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  const optionCount = (skip: FilterSection | FilterSection[], match: (tx: Proposal) => boolean) =>
    items.filter((tx) => passes(tx, [skip].flat()) && match(tx)).length

  // Recoveries are outside the nonce queue. They match only Ready to execute, never a flag.
  const recoveryPasses = (recovery: Recovery, skip?: FilterSection) => {
    const account = knownAccounts.find((candidate) => candidate.id === recovery.accountId)!
    return (
      (skip === 'accounts' || inSelection(accountFilter, account.id)) &&
      (skip === 'networks' || inSelection(networkFilter, account.network)) &&
      (skip === 'types' || inSelection(typeFilter, RECOVERY_TYPE)) &&
      (skip === 'statuses' ||
        !stateFilter.length ||
        (stateFilter.includes('ready') && recovery.state === 'executable' && !recovery.malicious)) &&
      !flags.length &&
      `${getRecoveryHeadline(recovery)} account recovery ${account.name}`.toLowerCase().includes(search.toLowerCase())
    )
  }

  const statusLabels = [
    ...stateFilter.map((status) => STATUS_META[status].label),
    ...FLAGS.filter((flag) => flags.includes(flag)).map((flag) => FLAG_META[flag].short),
  ]
  const accountNames = accounts.filter((account) => accountFilter.includes(account.id)).map((account) => account.name)
  const applied = [
    {
      section: 'accounts' as const,
      title: 'Safe',
      values: accountNames,
      clear: () => setAccountFilter([]),
    },
    { section: 'networks' as const, title: 'Network', values: networkFilter, clear: () => setNetworkFilter([]) },
    { section: 'types' as const, title: 'Type', values: typeFilter, clear: () => setTypeFilter([]) },
    {
      section: 'statuses' as const,
      title: 'Status',
      values: statusLabels,
      clear: () => {
        setStateFilter([])
        setFlags([])
      },
    },
  ].filter((filter) => filter.values.length > 0)

  const reset = () => {
    setAccountFilter([])
    setNetworkFilter([])
    setTypeFilter([])
    setSearch('')
    setStateFilter([])
    setFlags([])
  }

  return {
    accountFilter,
    networkFilter,
    typeFilter,
    stateFilter,
    flags,
    search,
    networks,
    items,
    matches: (tx: Proposal, status: Filter) => matchesFilter(tx, status, persona, exclusive),
    toggleAccount: (id: string) => setAccountFilter(toggled(accountFilter, id)),
    toggleNetwork: (network: string) => setNetworkFilter(toggled(networkFilter, network)),
    toggleType: (type: string) => setTypeFilter(toggled(typeFilter, type)),
    toggleStatus: (status: Filter) => setStateFilter(toggled(stateFilter, status)),
    toggleFlag: (flag: Flag) => setFlags(toggled(flags, flag)),
    setFlags,
    setSearch,
    visible: items.filter((tx) => passes(tx)),
    visibleRecoveries: recoveries.filter((recovery) => recoveryPasses(recovery)),
    recoveryCount: recoveries.filter((recovery) => recoveryPasses(recovery, 'types')).length,
    optionCount,
    applied,
    summaries: {
      accounts: summarise(accountNames),
      networks: summarise(networkFilter),
      types: summarise(typeFilter),
      statuses: summarise(statusLabels),
    },
    reset,
  }
}

export type QueueFilterState = ReturnType<typeof useQueueFilters>
