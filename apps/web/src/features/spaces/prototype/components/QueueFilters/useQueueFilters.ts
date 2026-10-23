import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  knownAccounts,
  getAccount,
  getConflicts,
  getSignerName,
  getTransactionLabel,
  getTypeLabel,
  matchesFilter,
  TYPE_LABELS,
} from '../../services/model'
import type { Account, Filter, Persona, Proposal } from '../../types'
import { FLAG_META, FLAGS, RECOVERY_TYPE, STATUS_META, STATUS_ORDER, type Flag } from '../shared'
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

const add = <T>(set: Dispatch<SetStateAction<T[]>>, value: T) =>
  set((current) => (current.includes(value) ? current : [...current, value]))

export type SearchOption = {
  title: string
  label: string
  names: (string | undefined)[]
  apply: () => void
  // While the text names this filter, the table previews it.
  test: (tx: Proposal) => boolean
  testRecovery?: (recovery: Recovery, account: Account) => boolean
}

// Short names people type for statuses, besides their labels.
const STATUS_NAMES: Record<Filter, string[]> = {
  ready: ['Execute'],
  sign: ['Sign'],
  awaiting: ['Waiting'],
  waiting: [],
}
const FLAG_NAMES: Record<Flag, string[]> = { conflicting: [], stale: ['Stale'] }

// Enter in the search box turns text naming a Safe, network, type or status into that filter.
// An exact name wins. Otherwise 3 or more letters must start names of one kind only, so "Ready" adds both Ready statuses.
export const getSearchMatch = (search: string, options: SearchOption[]) => {
  const query = search.trim().toLowerCase()
  if (!query) return undefined
  const named = (exact: boolean) =>
    options.filter((option) =>
      option.names.some(
        (name) => name && (exact ? name.toLowerCase() === query : name.toLowerCase().startsWith(query)),
      ),
    )
  const exact = named(true)
  const matches = exact.length || query.length < 3 ? exact : named(false)
  const titles = new Set(matches.map((option) => option.title))
  if (titles.size !== 1) return undefined
  return {
    title: matches[0].title,
    labels: [...new Set(matches.map((option) => option.label))],
    apply: () => matches.forEach((option) => option.apply()),
    test: (tx: Proposal) => matches.some((option) => option.test(tx)),
    testRecovery: (recovery: Recovery, account: Account) =>
      matches.some((option) => option.testRecovery?.(recovery, account)),
  }
}

export function useQueueFilters(
  items: Proposal[],
  accounts: Account[],
  persona: Persona,
  initial: Partial<QueueFilterValues> = {},
  recoveries: Recovery[] = [],
  exclusive = false,
  // Filters the page keeps itself, such as Signer, that Enter in the search box can also apply.
  moreSearchOptions: SearchOption[] = [],
) {
  const [accountFilter, setAccountFilter] = useState<string[]>(initial.accounts ?? [])
  const [networkFilter, setNetworkFilter] = useState<string[]>(initial.networks ?? [])
  const [typeFilter, setTypeFilter] = useState<string[]>(initial.types ?? [])
  const [stateFilter, setStateFilter] = useState<Filter[]>(initial.statuses ?? [])
  const [flags, setFlags] = useState<Flag[]>([])
  const [search, setSearch] = useState(initial.search ?? '')
  const networks = [...new Set(accounts.map((account) => account.network))]

  const searchMatch = getSearchMatch(search, [
    ...accounts.map((account) => ({
      title: 'Safe',
      label: account.safeName ?? account.name,
      names: [account.name, account.safeName],
      apply: () => add(setAccountFilter, account.id),
      test: (tx: Proposal) => tx.account === account.id,
      testRecovery: (_: Recovery, owner: Account) => owner.id === account.id,
    })),
    ...networks.map((network) => ({
      title: 'Network',
      label: network,
      names: [network],
      apply: () => add(setNetworkFilter, network),
      test: (tx: Proposal) => getAccount(tx).network === network,
      testRecovery: (_: Recovery, owner: Account) => owner.network === network,
    })),
    ...[...TYPE_LABELS, RECOVERY_TYPE].map((type) => ({
      title: 'Type',
      label: type,
      names: [type],
      apply: () => add(setTypeFilter, type),
      test: (tx: Proposal) => getTypeLabel(tx) === type,
      testRecovery: () => type === RECOVERY_TYPE,
    })),
    ...STATUS_ORDER.map((status) => ({
      title: 'Status',
      label: STATUS_META[status].label,
      names: [STATUS_META[status].label, ...STATUS_NAMES[status]],
      apply: () => add(setStateFilter, status),
      test: (tx: Proposal) => matchesFilter(tx, status, persona, exclusive),
      testRecovery: (recovery: Recovery) =>
        status === 'ready' && recovery.state === 'executable' && !recovery.malicious,
    })),
    ...FLAGS.map((flag) => ({
      title: 'Status',
      label: FLAG_META[flag].short,
      names: [FLAG_META[flag].short, ...FLAG_NAMES[flag]],
      apply: () => add(setFlags, flag),
      test: (tx: Proposal) => matchesFlag(tx, flag, items),
    })),
    ...moreSearchOptions,
  ])

  // Text that names a filter previews it. Other text searches the transaction, its Safe and signers.
  const searchPasses = (tx: Proposal) =>
    searchMatch
      ? searchMatch.test(tx)
      : `${getTransactionLabel(tx)} ${tx.recipient} ${tx.amount} ${tx.nonce} ${getAccount(tx).name} ${getAccount(tx).owners.map(getSignerName).join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase())

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
    searchPasses(tx)
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
      (searchMatch
        ? searchMatch.testRecovery(recovery, account)
        : `${getRecoveryHeadline(recovery)} account recovery ${account.name}`
            .toLowerCase()
            .includes(search.toLowerCase()))
    )
  }

  const statusLabels = [
    ...stateFilter.map((status) => STATUS_META[status].label),
    ...FLAGS.filter((flag) => flags.includes(flag)).map((flag) => FLAG_META[flag].short),
  ]
  // A Safe on several networks is one option: the Network filter narrows the networks.
  const safes = [
    ...accounts
      .reduce((groups, account) => {
        const safe = groups.get(account.iconAddress) ?? { name: account.safeName ?? account.name, ids: [] as string[] }
        safe.ids.push(account.id)
        return groups.set(account.iconAddress, safe)
      }, new Map<string, { name: string; ids: string[] }>())
      .values(),
  ]
  const accountNames = safes
    .filter((safe) => safe.ids.some((id) => accountFilter.includes(id)))
    .map((safe) => safe.name)
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
    setAccounts: setAccountFilter,
    safes,
    accountNames,
    toggleSafe: (ids: string[]) =>
      setAccountFilter((current) =>
        ids.every((id) => current.includes(id))
          ? current.filter((id) => !ids.includes(id))
          : [...current, ...ids.filter((id) => !current.includes(id))],
      ),
    toggleNetwork: (network: string) => setNetworkFilter(toggled(networkFilter, network)),
    toggleType: (type: string) => setTypeFilter(toggled(typeFilter, type)),
    toggleStatus: (status: Filter) => setStateFilter(toggled(stateFilter, status)),
    toggleFlag: (flag: Flag) => setFlags(toggled(flags, flag)),
    setFlags,
    setSearch,
    searchMatch: searchMatch && {
      ...searchMatch,
      apply: () => {
        searchMatch.apply()
        setSearch('')
      },
    },
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
