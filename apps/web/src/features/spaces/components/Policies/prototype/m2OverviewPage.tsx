import { useId, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListFilter,
  ListTree,
  Plus,
  SearchX,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { ThresholdBadge } from '@safe-global/views/components/common/AccountBadges'
import ChainIndicator from '@/components/common/ChainIndicator'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Badge, BadgeDot, badgeVariants } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@safe-global/views/components/ui/field'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import PolicyStatusChip from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'
import { PoliciesNoSearchResults } from '@safe-global/views/features/spaces/components/Policies/PoliciesTable/components/PoliciesTableStates'
import type { PolicyStatus } from '@safe-global/views/features/spaces/components/Policies/types'
import { POLICY_ICONS } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import { NetworkLogosPill } from '@/features/multichain'
import {
  getStatusPill,
  PAYMENTS_LIMIT,
  StatusChip,
  TRADING_DESK_SPENDING_LIMITS,
  type AccountState,
  type SpendingLimitMock,
  type StatusPill,
} from './m2AccountPanel'
import { PREFILLED_RECIPIENTS } from './m2SetupFlow'
import {
  getAccountKey,
  getAllowlistSettings,
  OPERATIONS,
  PageHeading,
  PAYMENTS,
  PAYMENTS_ARBITRUM,
  PolicyPage,
  SafeAddress,
  TRADING_DESK,
  TREASURY,
  TREASURY_BASE,
  VAULT_3,
  type M2Account,
} from './m2Prototype'

/** The Ops bot's limit next to a live Payments allowlist; locked: the allowlist applies to it, so it can't be edited. */
export type SpendingLimitState = 'normal' | 'blocked' | 'locked'

/** Where Payments on Ethereum is in its setup; every other account has a fixed state. */
export type PaymentsSnapshot = {
  state: AccountState
  signedCount: number
  pendingChange: boolean
  /** The setup transaction failed and can no longer be executed. */
  failed?: boolean
  /** The account the setup is for; the account view only tracks Payments. */
  account?: M2Account
  recipients?: Person[]
  spendingLimit?: SpendingLimitState
}

const DEFAULT_PAYMENTS: PaymentsSnapshot = { state: 'waiting', signedCount: 1, pendingChange: false }

/** M2 adds one type, the recipient allowlist. */
export type M2PolicyType = 'allowlist' | 'spending-limit' | 'proposer'

/** M2 types next to the M1 types they share the list with; M1 keeps its own icons. */
export const POLICY_TYPES: Record<M2PolicyType, { name: string; chip: string; Icon: LucideIcon }> = {
  allowlist: { name: 'Recipient allowlist', chip: 'Recipient allowlist', Icon: Users },
  'spending-limit': { name: 'Spending limit', chip: 'Spending limit', Icon: POLICY_ICONS['spending-limit'] },
  proposer: { name: 'Proposer role', chip: 'Proposer', Icon: POLICY_ICONS.proposer },
}

const POLICY_TYPE_ORDER: M2PolicyType[] = ['allowlist', 'spending-limit', 'proposer']

type StatusFilter = 'needs-action' | 'active' | 'change-pending' | 'not-protected'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'needs-action', label: 'Needs action' },
  { value: 'active', label: 'Active' },
  { value: 'change-pending', label: 'Change pending' },
  { value: 'not-protected', label: 'Not protected' },
]

/** Matches the chip a row shows: a signed setup awaiting signatures or execution reads "Change pending". */
const toStatusFilter = (state: AccountState, pendingChange: boolean): StatusFilter => {
  if (state === 'not-set-up') return 'not-protected'
  if (state === 'enforcing') return pendingChange ? 'change-pending' : 'active'
  if (state === 'waiting' || state === 'ready') return 'change-pending'
  return 'needs-action'
}

/** The account view's policies, which only decide each network's policy icons. */
type M2Policy = {
  type: M2PolicyType
  account: M2Account
  status: 'active' | 'pending'
}

const getPolicies = (payments: PaymentsSnapshot): M2Policy[] => {
  const isPaymentsSetup = !payments.account || getAccountKey(payments.account) === getAccountKey(PAYMENTS)
  const paymentsM2: M2Policy[] =
    payments.state === 'not-set-up' || !isPaymentsSetup
      ? []
      : [{ type: 'allowlist', account: PAYMENTS, status: payments.state === 'enforcing' ? 'active' : 'pending' }]

  return [
    { type: 'allowlist', account: TREASURY, status: 'active' },
    { type: 'proposer', account: TREASURY, status: 'active' },
    { type: 'allowlist', account: TRADING_DESK, status: 'active' },
    // Blocked or locked by the allowlist, each limit is still set on the account.
    ...TRADING_DESK_SPENDING_LIMITS.map(({ account }): M2Policy => ({
      type: 'spending-limit',
      account,
      status: 'active',
    })),
    // The allowlist setup never removes M1's Ops bot limit.
    { type: 'spending-limit', account: PAYMENTS, status: 'active' },
    ...paymentsM2,
  ]
}

type NetworkEntry = {
  account: M2Account
  state: AccountState
  signedCount: number
  pendingChange: boolean
  /** Active policies only; a pending setup adds none until it executes. */
  policyTypes: M2PolicyType[]
}

type SafeEntry = {
  name: string
  address: string
  networks: NetworkEntry[]
}

const getSafes = (payments: PaymentsSnapshot, policies: M2Policy[]): SafeEntry[] => {
  const network = (account: M2Account, state: AccountState, extra: Partial<NetworkEntry> = {}): NetworkEntry => ({
    account,
    state,
    signedCount: 0,
    pendingChange: false,
    policyTypes: POLICY_TYPE_ORDER.filter((type) =>
      policies.some(
        (policy) =>
          getAccountKey(policy.account) === getAccountKey(account) &&
          policy.type === type &&
          policy.status === 'active',
      ),
    ),
    ...extra,
  })

  return [
    {
      name: PAYMENTS.name,
      address: PAYMENTS.address,
      networks: [
        network(PAYMENTS, payments.state, {
          signedCount: payments.signedCount,
          pendingChange: payments.pendingChange,
        }),
        network(PAYMENTS_ARBITRUM, 'not-set-up'),
      ],
    },
    {
      name: TREASURY.name,
      address: TREASURY.address,
      networks: [network(TREASURY, 'enforcing'), network(TREASURY_BASE, 'not-set-up')],
    },
    { name: TRADING_DESK.name, address: TRADING_DESK.address, networks: [network(TRADING_DESK, 'enforcing')] },
    { name: VAULT_3.name, address: VAULT_3.address, networks: [network(VAULT_3, 'not-set-up')] },
    // The setup failed, so nothing changed on the account.
    { name: OPERATIONS.name, address: OPERATIONS.address, networks: [network(OPERATIONS, 'not-set-up')] },
  ]
}

const NETWORK_OPTIONS = [PAYMENTS, TRADING_DESK, VAULT_3].map(({ chainId }) => chainId)

type Filters = {
  query: string
  statuses: StatusFilter[]
  networks: string[]
  policyTypes: M2PolicyType[]
}

const NO_FILTERS: Filters = { query: '', statuses: [], networks: [], policyTypes: [] }

const hasPillFilter = ({ statuses, networks, policyTypes }: Filters): boolean =>
  statuses.length > 0 || networks.length > 0 || policyTypes.length > 0

const matchesPills = (
  filters: Filters,
  { status, chainId, policyTypes }: { status: StatusFilter; chainId: string; policyTypes: M2PolicyType[] },
): boolean =>
  (filters.statuses.length === 0 || filters.statuses.includes(status)) &&
  (filters.networks.length === 0 || filters.networks.includes(chainId)) &&
  (filters.policyTypes.length === 0 || policyTypes.some((type) => filters.policyTypes.includes(type)))

const matchesQuery = (query: string, values: string[]): boolean => {
  const needle = query.trim().toLowerCase()
  return !needle || values.some((value) => value.toLowerCase().includes(needle))
}

const toggle = <T,>(values: T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

type FilterOption<T extends string> = { value: T; label: string; icon?: ReactNode }

/** A dropdown pill styled like M1's policy type filter badges. */
const FilterPill = <T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: FilterOption<T>[]
  selected: T[]
  onChange: (selected: T[]) => void
}): ReactElement => {
  const selectedLabels = options.filter(({ value }) => selected.includes(value)).map((option) => option.label)
  const text =
    selectedLabels.length === 0
      ? label
      : selectedLabels.length === 1
        ? `${label}: ${selectedLabels[0]}`
        : `${label} · ${selectedLabels.length}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={badgeVariants({ variant: selected.length > 0 ? 'default' : 'card', size: 'chip' })}
          />
        }
      >
        {text}
        <ChevronDown aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => onChange(toggle(selected, option.value))}
          >
            {option.icon}
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const CHAIN_NAMES: Record<string, string> = { '1': 'Ethereum', '42161': 'Arbitrum', '8453': 'Base' }

const FilterBar = ({
  filters,
  onChange,
  searchPlaceholder,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  searchPlaceholder: string
}): ReactElement => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center" data-m2-new="New · Search and filter pills">
    <SearchInput
      variant="surface"
      value={filters.query}
      onChange={(event) => onChange({ ...filters, query: event.target.value })}
      onClear={() => onChange({ ...filters, query: '' })}
      placeholder={searchPlaceholder}
      aria-label={searchPlaceholder}
      autoComplete="off"
      className="flex-1"
    />

    <div className="flex flex-wrap items-center gap-2">
      <FilterPill
        label="Status"
        options={STATUS_FILTERS}
        selected={filters.statuses}
        onChange={(statuses) => onChange({ ...filters, statuses })}
      />
      <FilterPill
        label="Network"
        options={NETWORK_OPTIONS.map((chainId) => ({
          value: chainId,
          label: CHAIN_NAMES[chainId] ?? chainId,
          icon: <ChainIndicator chainId={chainId} onlyLogo imageSize={16} />,
        }))}
        selected={filters.networks}
        onChange={(networks) => onChange({ ...filters, networks })}
      />
      <FilterPill
        label="Policy"
        options={POLICY_TYPE_ORDER.map((type) => ({ value: type, label: POLICY_TYPES[type].chip }))}
        selected={filters.policyTypes}
        onChange={(policyTypes) => onChange({ ...filters, policyTypes })}
      />

      {hasPillFilter(filters) && (
        <Button
          variant="ghost-muted"
          size="xs"
          onClick={() => onChange({ ...filters, statuses: [], networks: [], policyTypes: [] })}
        >
          Clear all
        </Button>
      )}
    </div>
  </div>
)

/** M1's no-results layout, with a way out. */
const NoMatches = ({ title, onClear }: { title: string; onClear: () => void }): ReactElement => (
  <TableCard>
    <div className="flex flex-col items-center gap-3 py-10 text-center" data-m2-new="New · No matches">
      <SearchX className="size-6 text-muted-foreground" aria-hidden />
      <Typography variant="paragraph-bold">{title}</Typography>
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  </TableCard>
)

const MAX_VISIBLE_ICONS = 4

/** One icon per policy type, named in a tooltip; the icon tile is M1's rule icon at row size. */
const PolicyIcons = ({ types }: { types: M2PolicyType[] }): ReactElement => {
  if (types.length === 0) {
    return (
      <Typography variant="paragraph-small" color="muted">
        —
      </Typography>
    )
  }

  const visible = types.slice(0, MAX_VISIBLE_ICONS)
  const overflow = types.slice(MAX_VISIBLE_ICONS)

  return (
    <div
      className="flex flex-nowrap items-center justify-center gap-1"
      data-m2-new="New · Policy icons"
      data-m2-new-compact=""
    >
      {visible.map((type) => {
        const { name, Icon } = POLICY_TYPES[type]

        return (
          <Tooltip key={type}>
            <TooltipTrigger
              render={
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card" />
              }
              aria-label={name}
            >
              <Icon className="size-3.5 text-muted-foreground" aria-hidden />
            </TooltipTrigger>
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        )
      })}

      {overflow.length > 0 && (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
            <Typography variant="paragraph-small" color="muted">
              +{overflow.length}
            </Typography>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              {overflow.map((type) => (
                <span key={type}>{POLICY_TYPES[type].name}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

/** ThresholdBadge's look with the multiple-users icon, for a Safe that spans several networks. */
const MultiNetworkThreshold = ({ networks }: { networks: NetworkEntry[] }): ReactElement => {
  const [first] = networks
  const isShared = networks.every(
    ({ account }) => account.threshold === first.account.threshold && account.owners === first.account.owners,
  )

  const badge = (
    <span
      className="bg-foreground/5 text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
      data-m2-new="New · Multi-network threshold"
      data-m2-new-compact=""
    >
      <Users className="size-3.5" aria-hidden />
      {isShared ? `${first.account.threshold}/${first.account.owners}` : null}
    </span>
  )

  if (isShared) return badge

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />} aria-label="Threshold differs per network">
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-1">
          {networks.map(({ account }) => (
            <span key={account.chainId}>
              {CHAIN_NAMES[account.chainId] ?? account.chainId} · {account.threshold}/{account.owners}
            </span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

const getNetworkPill = ({ state, pendingChange }: NetworkEntry): StatusPill => getStatusPill(state, pendingChange)

/** A chip for several networks: the shared status, or a count per status when they differ. */
const getAggregatePill = (networks: NetworkEntry[]): StatusPill => {
  const pills = networks.map(getNetworkPill)
  if (pills.every((pill) => pill.label === pills[0].label)) return pills[0]

  const summary = STATUS_FILTERS.map(({ value, label }) => {
    const count = networks.filter(({ state, pendingChange }) => toStatusFilter(state, pendingChange) === value).length
    return count > 0 ? `${count} ${label.toLowerCase()}` : null
  })
    .filter(Boolean)
    .join(' · ')

  return { label: summary, variant: 'subtle' }
}

type AccountRow =
  | { kind: 'safe'; safe: SafeEntry; networks: NetworkEntry[]; expanded: boolean }
  | { kind: 'network'; safe: SafeEntry; network: NetworkEntry; isChild: boolean }

const getRowKey = (row: AccountRow): string =>
  row.kind === 'safe' ? `safe:${row.safe.address}` : getAccountKey(row.network.account)

const unionPolicyTypes = (networks: NetworkEntry[]): M2PolicyType[] =>
  POLICY_TYPE_ORDER.filter((type) => networks.some(({ policyTypes }) => policyTypes.includes(type)))

/** Rows open the panel or toggle on click, so the only chevron left is the expand state of a multi-network Safe. */
const accountColumns: DataTableColumn<AccountRow>[] = [
  {
    id: 'account',
    header: 'SAFE ACCOUNT',
    width: '20%',
    sticky: true,
    minWidth: 240,
    cell: (row) => {
      if (row.kind === 'safe') return <SafeAddress name={row.safe.name} address={row.safe.address} />

      if (row.isChild) {
        // min-h-10 matches the two-line name and address of the other rows.
        return (
          <div className="flex min-h-10 items-center pl-8">
            <ChainIndicator chainId={row.network.account.chainId} />
          </div>
        )
      }

      return <SafeAddress name={row.safe.name} address={row.safe.address} />
    },
  },
  {
    id: 'network',
    header: 'NETWORK',
    width: '15%',
    minWidth: 120,
    align: 'center',
    priority: 'secondary',
    cell: (row) => {
      if (row.kind === 'network' && row.isChild) return null
      const networks = row.kind === 'safe' ? row.networks : [row.network]

      return <NetworkLogosPill networks={networks.map(({ account }) => ({ chainId: account.chainId }))} />
    },
  },
  {
    id: 'threshold',
    header: 'THRESHOLD',
    width: '15%',
    minWidth: 120,
    align: 'center',
    priority: 'secondary',
    cell: (row) =>
      row.kind === 'safe' ? (
        <MultiNetworkThreshold networks={row.networks} />
      ) : (
        <ThresholdBadge threshold={row.network.account.threshold} owners={row.network.account.owners} />
      ),
  },
  {
    id: 'status',
    header: 'STATUS',
    width: '15%',
    minWidth: 120,
    align: 'center',
    cell: (row) => (
      <StatusChip pill={row.kind === 'safe' ? getAggregatePill(row.networks) : getNetworkPill(row.network)} />
    ),
  },
  {
    id: 'policies',
    header: 'POLICIES',
    width: '15%',
    minWidth: 120,
    align: 'center',
    cell: (row) => (
      <PolicyIcons types={row.kind === 'safe' ? unionPolicyTypes(row.networks) : row.network.policyTypes} />
    ),
  },
  {
    id: 'expand',
    header: '',
    align: 'end',
    width: 'fit',
    minWidth: 64,
    cell: (row) =>
      row.kind === 'safe' ? (
        <div className="flex justify-end">
          {row.expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" aria-label={`Collapse ${row.safe.name}`} />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" aria-label={`Expand ${row.safe.name}`} />
          )}
        </div>
      ) : null,
  },
]

const OverviewHeading = ({ onAddPolicy }: { onAddPolicy?: () => void }): ReactElement => (
  <PageHeading
    title="Policies"
    subtitle={
      <Typography variant="paragraph-small" color="muted">
        Limits that apply to every transaction from an account.
      </Typography>
    }
    action={
      <Button onClick={onAddPolicy} className="shrink-0">
        <Plus className="size-4 text-green-500" aria-hidden />
        New
      </Button>
    }
  />
)

export type PoliciesOverviewPageProps = {
  payments?: PaymentsSnapshot
  /** Safe addresses whose networks start expanded. */
  defaultExpanded?: string[]
  onAddPolicy?: () => void
  onSelectAccount?: (account: M2Account) => void
}

/** One row per Safe; a Safe on several networks expands into one row per network. */
export const PoliciesOverviewPage = ({
  payments = DEFAULT_PAYMENTS,
  defaultExpanded = [],
  onAddPolicy,
  onSelectAccount,
}: PoliciesOverviewPageProps): ReactElement => {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [expanded, setExpanded] = useState<string[]>(defaultExpanded)
  const isFiltering = hasPillFilter(filters)

  const rows = useMemo(() => {
    const safes = getSafes(payments, getPolicies(payments))

    return safes.flatMap((safe): AccountRow[] => {
      if (!matchesQuery(filters.query, [safe.name, safe.address])) return []

      const networks = safe.networks.filter((network) =>
        matchesPills(filters, {
          status: toStatusFilter(network.state, network.pendingChange),
          chainId: network.account.chainId,
          policyTypes: network.policyTypes,
        }),
      )
      if (networks.length === 0) return []

      if (safe.networks.length === 1) return [{ kind: 'network', safe, network: networks[0], isChild: false }]

      const isExpanded = isFiltering || expanded.includes(safe.address)

      return [
        { kind: 'safe', safe, networks, expanded: isExpanded },
        ...(isExpanded
          ? networks.map((network): AccountRow => ({ kind: 'network', safe, network, isChild: true }))
          : []),
      ]
    })
  }, [payments, filters, expanded, isFiltering])

  return (
    <PolicyPage header={<OverviewHeading onAddPolicy={onAddPolicy} />}>
      <div className="flex flex-col gap-4">
        <FilterBar filters={filters} onChange={setFilters} searchPlaceholder="Search accounts or addresses" />

        {rows.length === 0 ? (
          <NoMatches title="No accounts match these filters" onClear={() => setFilters(NO_FILTERS)} />
        ) : (
          <TableCard className="pb-0">
            <PaginatedDataTable
              columns={accountColumns}
              rows={rows}
              getRowKey={getRowKey}
              onRowClick={(row) =>
                row.kind === 'safe'
                  ? setExpanded((current) => toggle(current, row.safe.address))
                  : onSelectAccount?.(row.network.account)
              }
            />
          </TableCard>
        )}
      </div>
    </PolicyPage>
  )
}

/** By-policy names: M1's labels for its types, the setup's wording for the M2 ones. */
export const POLICY_ROW_LABELS: Record<M2PolicyType, string> = {
  'spending-limit': 'Spending limit',
  proposer: 'Proposer',
  allowlist: 'Recipient allowlist',
}

const POLICY_ROW_TYPE_ORDER: M2PolicyType[] = ['spending-limit', 'proposer', 'allowlist']

/** M1's statuses plus M2's: a change waiting out the delay, a failed setup, a spending limit the allowlist blocks. */
export type RowStatus = PolicyStatus | 'change-pending' | 'failed' | 'blocked'

export const ROW_STATUS_LABELS: Record<RowStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  activating: 'Activating',
  unenforced: 'Not enforced',
  'not-activated': 'Not activated',
  // Badges read "Pending" for both; the tooltip and the side panel say which kind.
  'change-pending': 'Pending',
  failed: 'Failed',
  blocked: 'Blocked',
}

/** The Status filter treats a pending change and the post-execution delay as Pending, as the badges do. */
const toStatusOption = (status: RowStatus): RowStatus =>
  status === 'change-pending' || status === 'activating' ? 'pending' : status

export type Person = { name: string; address: string }

/** Who is looking at the panel, the four viewers M1's SpendingLimitDrawer stories cover. */
export type PanelViewer = 'signer' | 'signer-signed' | 'non-signer' | 'disconnected'

/** What the queued transaction does to the allowlist (M1's PendingPolicyOperation). */
export type PanelOperation = 'create' | 'update' | 'remove'

export type PolicyRow = {
  id: string
  type: M2PolicyType
  account: M2Account
  /** The muted line under the policy name. */
  summary: string
  status: RowStatus
  /** Change pending: how long until it applies, e.g. "Applies in 18h". */
  statusNote?: string
  /** Change pending: when it applies, e.g. "Oct 13, 14:00". */
  appliesAt?: string
  /** Spender, proposer or recipients, matched by search. */
  people: Person[]
  /** Pending rows: signatures collected on the setup transaction. */
  signatures?: { signed: number; required: number }
  /** Allowlist rows once executed: the side panel's "Last updated". */
  lastUpdated?: string
  /** Spending limit only: active, but the recipient allowlist stops it being edited. */
  locked?: boolean
  /** Spending limit only: the spender's limit its side panel shows. */
  spendingLimit?: SpendingLimitMock
  /** Blocked spending limit only: the tokens the allowlist blocks; Payments' come from the prototype's setup instead. */
  blockedTokens?: string[]
  /** Allowlist rows other than the setup: who the side panel shows it to; the "already signed" signer unless set. */
  viewer?: PanelViewer
}

/** The row id of the allowlist the prototype's setup flow creates. */
export const SETUP_ROW_ID = 'setup-allowlist'

export const TOM_ADDRESS = '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2'

const TRADING_RECIPIENTS: Person[] = [
  { name: 'Exchange deposit', address: '0x9d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7' },
  { name: 'Market maker', address: '0xae5f60718293a4b5c6d7e8f901a2b3c4d5e6f708' },
  { name: 'Ops wallet', address: '0x1f8e2a3b4c5d6e7f8091a2b3c4d5e6f708195517' },
]

const TREASURY_BASE_RECIPIENTS: Person[] = [
  { name: 'Payments', address: PAYMENTS.address },
  { name: 'Grants multisig', address: '0x6b2e9a4c1d3f5e7a8b9c0d1e2f3a4b5c6d7e8f90' },
]

const OPERATIONS_RECIPIENTS: Person[] = [
  { name: 'Ops wallet', address: '0x1f8e2a3b4c5d6e7f8091a2b3c4d5e6f708195517' },
  { name: 'Cloud hosting', address: '0x4e6a8c0b2d4f6e8a0c2b4d6f8a0e2c4b6d8f9e36' },
]

const countLabel = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`

const toSpendingLimitRow = (limit: SpendingLimitMock): PolicyRow => ({
  id: limit.id,
  type: 'spending-limit',
  account: limit.account,
  summary: limit.label,
  status: 'active',
  people: [{ name: limit.spenderName, address: limit.policy.data.spenders[0].spender }],
  spendingLimit: limit,
})

/** Unaffected when the allowlist leaves existing permissions alone, blocked without the limit's token, else locked. */
const withAllowlist = (row: PolicyRow, limit: SpendingLimitMock): PolicyRow => {
  const { excludedTokens, applyToSpendingLimits } = getAllowlistSettings(limit.account)
  if (!applyToSpendingLimits) return row
  if (excludedTokens.includes(limit.token)) return { ...row, status: 'blocked', blockedTokens: [limit.token] }
  return { ...row, locked: true }
}

/** The new allowlist's row follows the prototype's setup state. */
const getPaymentsSetupStatus = ({
  state,
  signedCount,
  pendingChange,
  account,
  failed,
}: PaymentsSnapshot): Pick<PolicyRow, 'status' | 'statusNote' | 'appliesAt' | 'signatures'> => {
  const required = (account ?? PAYMENTS).threshold

  if (failed) return { status: 'failed' }

  switch (state) {
    // Executed: the guard waits out its 24-hour delay before the allowlist applies.
    case 'executing':
      return { status: 'activating', statusNote: 'Applies in 24h', appliesAt: 'Oct 13, 13:02' }
    case 'execution-failed':
      return { status: 'pending', statusNote: 'Ready to execute', signatures: { signed: required, required } }
    case 'enforcing':
      return pendingChange
        ? { status: 'change-pending', statusNote: 'Applies in 24h', appliesAt: 'Oct 13, 20:00' }
        : { status: 'active' }
    default:
      return {
        status: 'pending',
        statusNote: `${signedCount} of ${required} signatures`,
        signatures: { signed: signedCount, required },
      }
  }
}

export const getPolicyRows = (payments: PaymentsSnapshot = DEFAULT_PAYMENTS): PolicyRow[] => {
  const setupRecipients = payments.recipients ?? PREFILLED_RECIPIENTS.map(({ name, address }) => ({ name, address }))

  return [
    // M1's Ops bot limit: the allowlist setup never removes it, so its row always shows.
    {
      ...toSpendingLimitRow(PAYMENTS_LIMIT),
      status: payments.spendingLimit === 'blocked' ? 'blocked' : 'active',
      locked: payments.spendingLimit === 'locked',
    },
    {
      id: 'treasury-proposer',
      type: 'proposer',
      account: TREASURY,
      summary: 'Tom Reyes',
      status: 'active',
      people: [{ name: 'Tom Reyes', address: TOM_ADDRESS }],
    },
    ...(payments.state === 'not-set-up'
      ? []
      : [
          {
            id: SETUP_ROW_ID,
            type: 'allowlist' as const,
            account: payments.account ?? PAYMENTS,
            summary: countLabel(setupRecipients.length, 'recipient'),
            ...getPaymentsSetupStatus(payments),
            people: setupRecipients,
            lastUpdated: 'Oct 12, 2026 · 13:02 UTC',
          },
        ]),
    {
      id: 'trading-allowlist',
      type: 'allowlist',
      account: TRADING_DESK,
      summary: countLabel(TRADING_RECIPIENTS.length, 'recipient'),
      status: 'active',
      people: TRADING_RECIPIENTS,
      lastUpdated: 'Aug 30, 2026 · 11:20 UTC',
    },
    ...TRADING_DESK_SPENDING_LIMITS.map((limit) => withAllowlist(toSpendingLimitRow(limit), limit)),
    {
      id: 'treasury-base-allowlist',
      type: 'allowlist',
      account: TREASURY_BASE,
      summary: countLabel(TREASURY_BASE_RECIPIENTS.length, 'recipient'),
      status: 'pending',
      signatures: { signed: 1, required: TREASURY_BASE.threshold },
      viewer: 'signer-signed',
      people: TREASURY_BASE_RECIPIENTS,
      lastUpdated: 'Sep 12, 2026 · 09:40 UTC',
    },
    {
      id: 'operations-allowlist',
      type: 'allowlist',
      account: OPERATIONS,
      summary: countLabel(OPERATIONS_RECIPIENTS.length, 'recipient'),
      status: 'failed',
      people: OPERATIONS_RECIPIENTS,
      lastUpdated: 'Oct 9, 2026 · 17:30 UTC',
    },
  ]
}

/** Accounts that already have a recipient allowlist, keyed like getAccountKey: the create flow disables them. */
export const getAllowlistAccountKeys = (payments: PaymentsSnapshot = DEFAULT_PAYMENTS): string[] =>
  getPolicyRows(payments)
    // A failed setup left nothing on the account, so it can be set up again.
    .filter(({ type, status }) => type === 'allowlist' && status !== 'failed')
    .map(({ account }) => getAccountKey(account))

/** M1's PolicyRule markup: icon tile, policy name, muted one-line summary. */
const PolicyCell = ({ type, summary }: { type: M2PolicyType; summary: string }): ReactElement => {
  const { Icon } = POLICY_TYPES[type]

  return (
    <div className="flex items-center gap-3" data-m2-new="M1 copy · Policy cell" data-m2-new-compact="">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-col">
        <Typography variant="paragraph-bold" className="truncate">
          {POLICY_ROW_LABELS[type]}
        </Typography>
        <Typography variant="paragraph-small" className="truncate text-muted-foreground">
          {summary}
        </Typography>
      </div>
    </div>
  )
}

/** Shared by the chip's tooltip and the side panel, so they match. */
export const getStatusDetail = ({
  status,
  statusNote,
  appliesAt,
  signatures,
  locked,
}: PolicyRow): string | undefined => {
  if (status === 'change-pending' || status === 'activating') return [statusNote, appliesAt].filter(Boolean).join(' · ')
  if (status === 'pending' && signatures) {
    const { signed, required } = signatures
    return signed >= required ? 'Ready to execute' : `${signed} of ${required} signatures`
  }
  if (status === 'failed') return 'The transaction failed. Nothing changed on this account.'
  if (status === 'active' && locked) return 'Locked by the recipient allowlist'
  return undefined
}

/** M1's PolicyStatusChip; M2's statuses are the same Badge with M2's labels. With `tooltip`, hovering shows it. */
export const RowStatusChip = ({ status, tooltip }: { status: RowStatus; tooltip?: string }): ReactElement => {
  const chip =
    status === 'change-pending' || status === 'failed' || status === 'blocked' ? (
      <Badge variant={status === 'change-pending' ? 'warning' : 'destructive'} size="status" shape="status">
        <BadgeDot />
        {ROW_STATUS_LABELS[status]}
      </Badge>
    ) : (
      // Executed but still in its 24-hour delay: it isn't applying yet, so it reads Pending, not Activating.
      <PolicyStatusChip status={status === 'activating' ? 'pending' : status} />
    )

  if (!tooltip) return chip

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex" data-m2-new="M1 copy · Status chip with tooltip" data-m2-new-compact="" />
        }
      >
        {chip}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

/** Every cell sits in a box the height of the two-line Policy and Safe account cells, so rows line up. */
const ROW_CELL_JUSTIFY = { start: '', center: ' justify-center', end: ' justify-end' } as const

const RowCell = ({
  children,
  justify = 'start',
}: {
  children: ReactNode
  justify?: keyof typeof ROW_CELL_JUSTIFY
}): ReactElement => <div className={`flex min-h-10 min-w-0 items-center${ROW_CELL_JUSTIFY[justify]}`}>{children}</div>

/** The table is fixed-layout, so the spacers split what the `fit` columns leave equally: even gaps between columns. */
const spacerColumn = (id: string): DataTableColumn<PolicyRow> => ({
  id,
  header: '',
  priority: 'secondary',
  cell: () => null,
})

// Widest content plus the table's cell padding: 16px on the table's outer edges, 8px elsewhere.
const POLICY_COLUMN_WIDTH = 16 + 224 + 8
const SAFE_ACCOUNT_COLUMN_WIDTH = 8 + 136 + 8
// Room for the group-by button on both sides of the centred header label.
const NETWORK_COLUMN_WIDTH = 8 + 120 + 8
const STATUS_COLUMN_WIDTH = 8 + 128 + 16

/** Policy at the left padding, Status at the right padding, Safe account and Network spaced evenly between them. */
const policyRowColumns: DataTableColumn<PolicyRow>[] = [
  {
    id: 'policy',
    header: 'POLICY',
    width: 'fit',
    sticky: true,
    minWidth: POLICY_COLUMN_WIDTH,
    cell: ({ type, summary }) => (
      <RowCell>
        <PolicyCell type={type} summary={summary} />
      </RowCell>
    ),
  },
  spacerColumn('gap-policy-account'),
  {
    id: 'appliesTo',
    header: 'SAFE ACCOUNT',
    width: 'fit',
    minWidth: SAFE_ACCOUNT_COLUMN_WIDTH,
    cell: ({ account }) => (
      <RowCell>
        <SafeAddress name={account.name} address={account.address} chainId={account.chainId} />
      </RowCell>
    ),
  },
  spacerColumn('gap-account-network'),
  {
    id: 'network',
    header: 'NETWORK',
    width: 'fit',
    minWidth: NETWORK_COLUMN_WIDTH,
    priority: 'secondary',
    // The header and the logo share the column's centre line.
    align: 'center',
    cell: ({ account }) => (
      <RowCell justify="center">
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <ChainIndicator chainId={account.chainId} onlyLogo showUnknown imageSize={24} />
          </TooltipTrigger>
          <TooltipContent>{CHAIN_NAMES[account.chainId] ?? account.chainId}</TooltipContent>
        </Tooltip>
      </RowCell>
    ),
  },
  spacerColumn('gap-network-status'),
  {
    id: 'status',
    header: 'STATUS',
    width: 'fit',
    minWidth: STATUS_COLUMN_WIDTH,
    // Right-aligned, so the chip sits as far from the right edge as the Policy icon from the left.
    align: 'end',
    cell: (row) => (
      <RowCell justify="end">
        <RowStatusChip status={row.status} tooltip={getStatusDetail(row)} />
      </RowCell>
    ),
  },
]

type Grouping = 'account' | 'network' | 'status'

const rank = <T,>(order: T[], value: T): number => {
  const index = order.indexOf(value)
  return index === -1 ? order.length : index
}

const STATUS_GROUP_ORDER: RowStatus[] = ['active', 'pending', 'blocked', 'failed', 'unenforced', 'not-activated']

const GROUPINGS: Record<
  Grouping,
  {
    columnId: string
    name: string
    getKey: (row: PolicyRow) => string
    compare: (a: PolicyRow, b: PolicyRow) => number
  }
> = {
  account: {
    columnId: 'appliesTo',
    name: 'safe account',
    getKey: ({ account }) => getAccountKey(account),
    compare: (a, b) =>
      a.account.name.localeCompare(b.account.name) ||
      rank(NETWORK_OPTIONS, a.account.chainId) - rank(NETWORK_OPTIONS, b.account.chainId),
  },
  network: {
    columnId: 'network',
    name: 'network',
    getKey: ({ account }) => account.chainId,
    compare: (a, b) => rank(NETWORK_OPTIONS, a.account.chainId) - rank(NETWORK_OPTIONS, b.account.chainId),
  },
  status: {
    columnId: 'status',
    name: 'status',
    // Grouped as the Status filter and the badges read them: a pending change is Pending.
    getKey: ({ status }) => toStatusOption(status),
    compare: (a, b) =>
      rank(STATUS_GROUP_ORDER, toStatusOption(a.status)) - rank(STATUS_GROUP_ORDER, toStatusOption(b.status)),
  },
}

const GROUPING_ORDER: Grouping[] = ['account', 'network', 'status']

type GroupHeadingRow = { kind: 'group'; id: string; grouping: Grouping; first: PolicyRow; count: number }

type ByPolicyTableRow = { kind: 'policy'; row: PolicyRow } | GroupHeadingRow

const toTableRows = (rows: PolicyRow[], grouping: Grouping | null): ByPolicyTableRow[] => {
  if (!grouping) return rows.map((row): ByPolicyTableRow => ({ kind: 'policy', row }))

  const { getKey, compare } = GROUPINGS[grouping]
  const groups = new Map<string, PolicyRow[]>()
  rows.forEach((row) => groups.set(getKey(row), [...(groups.get(getKey(row)) ?? []), row]))

  return [...groups.values()]
    .sort((a, b) => compare(a[0], b[0]))
    .flatMap((group): ByPolicyTableRow[] => [
      { kind: 'group', id: `group:${getKey(group[0])}`, grouping, first: group[0], count: group.length },
      ...group.map((row): ByPolicyTableRow => ({ kind: 'policy', row })),
    ])
}

/** A muted band that doesn't take the rows' hover, pointer or divider: it isn't clickable. */
const GROUP_ROW_CLASS =
  'cursor-default! bg-none! [&>td]:bg-muted/60! [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg'

/** The group's value as its column shows it: the account with its network, the chain logo, or the status chip. */
const GroupValue = ({ grouping, row }: { grouping: Grouping; row: PolicyRow }): ReactElement => {
  const networkName = CHAIN_NAMES[row.account.chainId] ?? row.account.chainId

  switch (grouping) {
    case 'account':
      return (
        <SafeAddress
          name={row.account.name}
          address={row.account.address}
          chainId={row.account.chainId}
          nameSuffix={
            <Typography variant="paragraph-small" color="muted" className="shrink-0">
              · {networkName}
            </Typography>
          }
        />
      )
    case 'network':
      return (
        <div className="flex items-center gap-2">
          <ChainIndicator chainId={row.account.chainId} onlyLogo showUnknown imageSize={24} />
          <Typography variant="paragraph-small-medium">{networkName}</Typography>
        </div>
      )
    case 'status':
      return <RowStatusChip status={toStatusOption(row.status)} />
  }
}

const GroupRowCell = ({ columnId, group }: { columnId: string; group: GroupHeadingRow }): ReactElement | null => {
  if (columnId === 'policy') return <GroupValue grouping={group.grouping} row={group.first} />
  if (columnId !== 'status') return null

  return (
    <div className="flex justify-end" data-m2-new="New · Group band row" data-m2-new-compact="">
      <Typography variant="paragraph-small" color="muted">
        {group.count} {group.count === 1 ? 'policy' : 'policies'}
      </Typography>
    </div>
  )
}

/** The header label with its group-by toggle beside it, positioned so the label keeps the column's alignment. */
const GroupByHeader = ({
  label,
  name,
  side,
  isActive,
  onToggle,
}: {
  label: ReactNode
  name: string
  side: 'before' | 'after'
  isActive: boolean
  onToggle: () => void
}): ReactElement => (
  <span className="relative inline-flex items-center" data-m2-new="New · Group by button" data-m2-new-compact="">
    {label}
    <span
      className={`absolute top-1/2 inline-flex -translate-y-1/2 ${side === 'before' ? 'right-full mr-1' : 'left-full ml-1'}`}
    >
      <Button
        variant={isActive ? 'surface' : 'ghost-muted'}
        size="icon-xs"
        aria-pressed={isActive}
        aria-label={`Group by ${name}`}
        onClick={onToggle}
      >
        <ListTree aria-hidden />
      </Button>
    </span>
  </span>
)

const getByPolicyColumns = (
  grouping: Grouping | null,
  onToggle: (grouping: Grouping) => void,
): DataTableColumn<ByPolicyTableRow>[] =>
  policyRowColumns.map(
    ({ id, header, cell, width, sticky, minWidth, priority, align }): DataTableColumn<ByPolicyTableRow> => {
      const columnGrouping = GROUPING_ORDER.find((option) => GROUPINGS[option].columnId === id)

      return {
        id,
        width,
        sticky,
        minWidth,
        priority,
        align,
        header: columnGrouping ? (
          <GroupByHeader
            label={header}
            name={GROUPINGS[columnGrouping].name}
            side={align === 'end' ? 'before' : 'after'}
            isActive={grouping === columnGrouping}
            onToggle={() => onToggle(columnGrouping)}
          />
        ) : (
          header
        ),
        cell: (row, context) =>
          row.kind === 'policy' ? cell(row.row, context) : <GroupRowCell columnId={id} group={row} />,
      }
    },
  )

export type PolicyFilters = {
  query: string
  accounts: string[]
  networks: string[]
  types: M2PolicyType[]
  statuses: RowStatus[]
}

const NO_POLICY_FILTERS: PolicyFilters = { query: '', accounts: [], networks: [], types: [], statuses: [] }

const matchesPolicyFilters = (filters: PolicyFilters, row: PolicyRow): boolean =>
  (filters.accounts.length === 0 || filters.accounts.includes(row.account.address)) &&
  (filters.networks.length === 0 || filters.networks.includes(row.account.chainId)) &&
  (filters.types.length === 0 || filters.types.includes(row.type)) &&
  (filters.statuses.length === 0 || filters.statuses.includes(toStatusOption(row.status))) &&
  matchesQuery(filters.query, [
    POLICY_ROW_LABELS[row.type],
    row.account.name,
    row.account.address,
    ...row.people.flatMap(({ name, address }) => [name, address]),
  ])

const unique = <T,>(values: T[]): T[] => [...new Set(values)]

const NO_PILL_FILTERS: Omit<PolicyFilters, 'query'> = { accounts: [], networks: [], types: [], statuses: [] }

type FilterGroup = {
  label: string
  options: FilterOption<string>[]
  selected: string[]
  onChange: (selected: string[]) => void
}

/** One filter in the popover: a collapsed row (name, selection count, chevron) that opens to its checkbox list. */
const FilterSection = ({ label, options, selected, onChange }: FilterGroup): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const idPrefix = useId()
  const Chevron = isOpen ? ChevronDown : ChevronRight

  return (
    // py-2: the hover fill stops 8px short of the divider lines, as it does of the popover's sides.
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="py-2">
      {/* -mx-2 puts the hover fill 8px inside the popover's edges while the text stays on its 16px padding. */}
      <CollapsibleTrigger className="group/filter -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-2 rounded-md p-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <Typography variant="paragraph-small-medium">
          {selected.length > 0 ? `${label} · ${selected.length}` : label}
        </Typography>
        <Chevron
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/filter:text-foreground"
          aria-hidden
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col gap-2 pt-2">
          {options.map((option) => {
            const id = `${idPrefix}-${option.value}`

            return (
              <Field key={option.value} orientation="horizontal">
                <Checkbox
                  id={id}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => onChange(toggle(selected, option.value))}
                />
                <FieldLabel htmlFor={id}>
                  {option.icon}
                  {option.label}
                </FieldLabel>
              </Field>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** The Filters button next to search: a count when any are on; the popover applies each change at once. */
const FiltersPopover = ({ groups, onClearAll }: { groups: FilterGroup[]; onClearAll: () => void }): ReactElement => {
  const activeCount = groups.reduce((count, { selected }) => count + selected.length, 0)

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="shrink-0" />}>
        <ListFilter data-icon="inline-start" />
        {activeCount > 0 ? `Filters · ${activeCount}` : 'Filters'}
      </PopoverTrigger>

      {/* pt-2.5 + the 32px header row = 16px above "Filters"; no bottom padding, the last row brings its own 8px. */}
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={4}
        collisionAvoidance={{ side: 'none' }}
        className="w-64 gap-2 pt-2.5 pb-0"
        data-m2-new="New · Filters popover"
      >
        <div className="flex items-center justify-between gap-2">
          <PopoverTitle>Filters</PopoverTitle>
          <Button variant="ghost-muted" size="xs" disabled={activeCount === 0} onClick={onClearAll}>
            Clear all
          </Button>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {groups.map((group) => (
            <FilterSection key={group.label} {...group} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** One removable chip per active filter value, then Clear all; nothing at all when no filter is on. */
const ActiveFilterChips = ({
  groups,
  onClearAll,
}: {
  groups: FilterGroup[]
  onClearAll: () => void
}): ReactElement | null => {
  const chips = groups.flatMap(({ options, selected, onChange }) =>
    options
      .filter(({ value }) => selected.includes(value))
      .map(({ value, label }) => ({
        key: value,
        label,
        onRemove: () => onChange(selected.filter((item) => item !== value)),
      })),
  )

  if (chips.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Active filters"
      data-m2-new="New · Active filter chips"
    >
      {chips.map(({ key, label, onRemove }) => (
        <Badge
          key={key}
          variant="card"
          size="chip"
          render={<button type="button" />}
          onClick={onRemove}
          aria-label={`Remove ${label} filter`}
          className="cursor-pointer"
        >
          {label}
          <X className="size-3" aria-hidden />
        </Badge>
      ))}

      <Button variant="ghost-muted" size="xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  )
}

/** M1's policies page heading (Policies/index.tsx): title, then the intro line with its help link. */
const ByPolicyHeading = (): ReactElement => (
  <PageHeading
    title="Policies"
    subtitle={
      <Typography variant="paragraph-medium">
        Policies are rules that help you manage your Safe accounts. Set them up once and they will run onchain,
        automatically.{' '}
        <ExternalLink noIcon href={HelpCenterArticle.POLICIES}>
          Learn more
        </ExternalLink>
      </Typography>
    }
  />
)

export type PoliciesByPolicyPageProps = Pick<
  PoliciesOverviewPageProps,
  'payments' | 'onAddPolicy' | 'onSelectAccount'
> & {
  /** Opens that one policy's drawer, as M1's table does; without it a row opens the account panel. */
  onSelectPolicy?: (row: PolicyRow) => void
  /** Search and filters to start from, e.g. for the All states canvas. */
  initialFilters?: Partial<PolicyFilters>
}

/** M1's policy list (PoliciesList + PoliciesTable), one row per policy, with the M2 types and the account view's filter pills. */
export const PoliciesByPolicyPage = ({
  payments = DEFAULT_PAYMENTS,
  onAddPolicy,
  onSelectAccount,
  onSelectPolicy,
  initialFilters,
}: PoliciesByPolicyPageProps): ReactElement => {
  const [filters, setFilters] = useState<PolicyFilters>({ ...NO_POLICY_FILTERS, ...initialFilters })
  const allRows = useMemo(() => getPolicyRows(payments), [payments])
  const rows = useMemo(() => allRows.filter((row) => matchesPolicyFilters(filters, row)), [allRows, filters])
  const [grouping, setGrouping] = useState<Grouping | null>(null)
  const tableRows = useMemo(() => toTableRows(rows, grouping), [rows, grouping])
  const columns = getByPolicyColumns(grouping, (next) => setGrouping((current) => (current === next ? null : next)))

  const accountOptions = unique(allRows.map(({ account }) => account.address)).map((address) => ({
    value: address,
    label: allRows.find(({ account }) => account.address === address)?.account.name ?? address,
  }))
  const networkOptions = unique(allRows.map(({ account }) => account.chainId)).map((chainId) => ({
    value: chainId,
    label: CHAIN_NAMES[chainId] ?? chainId,
    icon: <ChainIndicator chainId={chainId} onlyLogo imageSize={16} />,
  }))
  const statusOptions = unique(allRows.map(({ status }) => toStatusOption(status))).map((status) => ({
    value: status,
    label: ROW_STATUS_LABELS[status],
  }))
  const selectRow = (row: PolicyRow) => (onSelectPolicy ? onSelectPolicy(row) : onSelectAccount?.(row.account))
  // Clears the filters only; the search stays.
  const clearFilters = () => setFilters({ ...filters, ...NO_PILL_FILTERS })

  const filterGroups: FilterGroup[] = [
    {
      label: 'Safe account',
      options: accountOptions,
      selected: filters.accounts,
      onChange: (accounts) => setFilters({ ...filters, accounts }),
    },
    {
      label: 'Network',
      options: networkOptions,
      selected: filters.networks,
      onChange: (networks) => setFilters({ ...filters, networks }),
    },
    {
      label: 'Policy type',
      options: POLICY_ROW_TYPE_ORDER.map((type) => ({ value: type, label: POLICY_ROW_LABELS[type] })),
      selected: filters.types,
      onChange: (types) =>
        setFilters({ ...filters, types: POLICY_ROW_TYPE_ORDER.filter((type) => types.includes(type)) }),
    },
    {
      label: 'Status',
      options: statusOptions,
      selected: filters.statuses,
      onChange: (statuses) =>
        setFilters({
          ...filters,
          statuses: statusOptions.map(({ value }) => value).filter((value) => statuses.includes(value)),
        }),
    },
  ]

  return (
    <PolicyPage header={<ByPolicyHeading />}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            variant="surface"
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            onClear={() => setFilters({ ...filters, query: '' })}
            placeholder="Search"
            aria-label="Search policies"
            autoComplete="off"
            className="flex-1"
          />

          <FiltersPopover groups={filterGroups} onClearAll={clearFilters} />

          <Button onClick={onAddPolicy} className="shrink-0">
            <Plus className="size-4 text-green-500" aria-hidden />
            New
          </Button>
        </div>

        <ActiveFilterChips groups={filterGroups} onClearAll={clearFilters} />

        {/* A 4px bottom border in place of the card's padding, so the last row's hover ends 4px inside, like the sides. */}
        <TableCard className="pb-0 [&_tbody_tr:last-child_td]:border-b-4">
          {rows.length === 0 ? (
            <PoliciesNoSearchResults query={filters.query} />
          ) : (
            <PaginatedDataTable
              columns={columns}
              rows={tableRows}
              getRowKey={(row) => (row.kind === 'policy' ? row.row.id : row.id)}
              getRowClassName={(row) => (row.kind === 'group' ? GROUP_ROW_CLASS : '')}
              onRowClick={(row) => {
                if (row.kind === 'policy') selectRow(row.row)
              }}
              // Grouped, everything sits on one page so no group is split across pages.
              pageSize={grouping ? tableRows.length : undefined}
            />
          )}
        </TableCard>
      </div>
    </PolicyPage>
  )
}
