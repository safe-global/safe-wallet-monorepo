import { useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Loader2, Plus, SearchX, Users, type LucideIcon } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { ThresholdBadge } from '@safe-global/views/components/common/AccountBadges'
import ChainIndicator from '@/components/common/ChainIndicator'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Badge, BadgeDot, badgeVariants } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
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
import { getAccountTokens, POPULAR_TOKENS, PREFILLED_RECIPIENTS } from './m2SetupFlow'
import { CollapseAllButton, PolicyToolbar, type FilterSection, type GroupByOption } from './m2PolicyToolbar'
import Identicon from '@/components/common/Identicon'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@safe-global/views/components/ui/avatar'
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

/** M2 adds one type, the allowlist. */
export type M2PolicyType = 'allowlist' | 'spending-limit' | 'proposer'

/** M2 types next to the M1 types they share the list with; M1 keeps its own icons. */
export const POLICY_TYPES: Record<M2PolicyType, { name: string; chip: string; Icon: LucideIcon }> = {
  allowlist: { name: 'Allowlist', chip: 'Allowlist', Icon: Users },
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
  allowlist: 'Allowlist',
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

export type Person = { name: string; address: string }

/** Who is looking at the panel, the four viewers M1's SpendingLimitDrawer stories cover. */
export type PanelViewer = 'signer' | 'signer-signed' | 'non-signer' | 'disconnected'

/** What the queued transaction does to the allowlist (M1's PendingPolicyOperation). */
export type PanelOperation =
  'create' | 'update' | 'update-apply' | 'update-cancel' | 'remove' | 'remove-apply' | 'remove-cancel'

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
  /** Spending limit only: active, but the allowlist stops it being edited. */
  locked?: boolean
  /** Spending limit only: the spender's limit its side panel shows. */
  spendingLimit?: SpendingLimitMock
  /** Blocked spending limit only: the tokens the allowlist blocks; Payments' come from the prototype's setup instead. */
  blockedTokens?: string[]
  /** Only there to show a spec 5.7 tag: it doesn't block the create flow. */
  isExample?: boolean
  /** A spec 5.7 example: its tag and tooltip replace the ones the status gives. */
  example?: { tag: StatusTag; tooltip: string; change: SpecChange; stage: SpecStage }
  /** Allowlist rows other than the setup: who the side panel shows it to; the "already signed" signer unless set. */
  viewer?: PanelViewer
  /** See all side panels: what became of its transaction, shown instead of the pending state. */
  panelOutcome?: 'executed' | 'failed' | 'replaced' | 'deleted'
  /** See all side panels: the case this row opens, under the policy name, and the tag it shows. */
  caseLabel?: string
  caseGroup?: CaseGroup
  tag?: StatusTag
}

/** See all side panels: the five groups the cases are banded in. */
export const CASE_GROUPS = [
  'Setup pending',
  'Active',
  'Change request',
  'Change cancellation',
  'Remove allowlist',
] as const
export type CaseGroup = (typeof CASE_GROUPS)[number]

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

// Examples stay on Ethereum: allowlists only run on Ethereum, Polygon and Sepolia.
const EXAMPLE_ACCOUNTS: { account: M2Account; people: Person[] }[] = [
  { account: PAYMENTS, people: TRADING_RECIPIENTS },
  { account: TREASURY, people: OPERATIONS_RECIPIENTS },
]

/** What each stage waits for, as the tag's tooltip says it. */
const getExampleTooltip = (stage: SpecStage, required: number): string => {
  if (stage.endsWith('pending')) return `1 of ${required} signatures`
  if (stage.endsWith('ready to execute')) return 'Ready to execute'
  if (stage === 'in delay') return 'Applies in 18h · Oct 13, 20:00'
  if (stage === 'ready to apply') return 'Apply before Oct 20, 20:00'
  return "Wasn't applied within 7 days"
}

/** The change a spec 5.7 tag names, and where it stands; "Guard" is the guard found missing (5.6.10). */
export type SpecChange = 'Edit' | 'Removal' | 'Guard removal' | 'Guard'
export type SpecStage =
  | 'pending'
  | 'ready to execute'
  | 'in delay'
  | 'ready to apply'
  | 'apply pending'
  | 'apply ready to execute'
  | 'expired'
  | 'cancel pending'
  | 'cancel ready to execute'
  | 'missing'

const EXAMPLE_STAGES: { stage: SpecStage; tone: TagTone }[] = [
  { stage: 'pending', tone: 'waiting' },
  { stage: 'ready to execute', tone: 'ready' },
  { stage: 'in delay', tone: 'waiting' },
  { stage: 'ready to apply', tone: 'ready' },
  { stage: 'apply pending', tone: 'waiting' },
  { stage: 'apply ready to execute', tone: 'ready' },
  { stage: 'expired', tone: 'expired' },
  { stage: 'cancel pending', tone: 'waiting' },
  { stage: 'cancel ready to execute', tone: 'ready' },
]

/** One row per spec 5.7 tag the main rows don't already show, so every tag can be seen in the table. */
export const getExampleRows = (): PolicyRow[] => {
  const changes = [
    ...(['Edit', 'Removal'] as const).flatMap((change) => EXAMPLE_STAGES.map((stage) => ({ change, ...stage }))),
  ]
  const setup: PolicyRow[] = [
    {
      id: 'example-setup-ready',
      type: 'allowlist',
      account: TREASURY,
      summary: countLabel(OPERATIONS_RECIPIENTS.length, 'recipient'),
      status: 'pending',
      signatures: { signed: TREASURY.threshold, required: TREASURY.threshold },
      people: OPERATIONS_RECIPIENTS,
      isExample: true,
    },
    {
      id: 'example-setup-processing',
      type: 'allowlist',
      account: PAYMENTS,
      summary: countLabel(TRADING_RECIPIENTS.length, 'recipient'),
      status: 'activating',
      statusNote: 'Waiting for the transaction to show up',
      people: TRADING_RECIPIENTS,
      isExample: true,
    },
  ]
  return [
    ...setup,
    ...changes.map(({ change, stage, tone }, index): PolicyRow => {
      const { account, people } = EXAMPLE_ACCOUNTS[index % EXAMPLE_ACCOUNTS.length]
      const signatures = stage.endsWith('pending') ? ` · 1/${account.threshold}` : ''
      return {
        id: `example-${change}-${stage}`.toLowerCase().replaceAll(' ', '-'),
        type: 'allowlist',
        account,
        summary: countLabel(people.length, 'recipient'),
        status: tone === 'expired' ? 'active' : 'change-pending',
        people,
        isExample: true,
        example: {
          tag: { label: `${change} ${stage}${signatures}`, tone },
          tooltip: getExampleTooltip(stage, account.threshold),
          change,
          stage,
        },
      }
    }),
    // Spec 5.6.10: the guard was taken off outside Safe{Wallet}, so the allowlist no longer applies.
    {
      id: 'example-guard-missing',
      type: 'allowlist',
      account: TREASURY,
      summary: countLabel(OPERATIONS_RECIPIENTS.length, 'recipient'),
      status: 'active',
      people: OPERATIONS_RECIPIENTS,
      isExample: true,
      example: {
        tag: { label: 'Not applied', tone: 'failed' },
        tooltip: 'Removed from this Safe account outside the app',
        change: 'Guard',
        stage: 'missing',
      },
    },
  ]
}

const VIEWER_CASES: { viewer: PanelViewer; label: string }[] = [
  { viewer: 'signer', label: 'your signature needed' },
  { viewer: 'signer-signed', label: "you've signed" },
  { viewer: 'non-signer', label: 'not a signer' },
  { viewer: 'disconnected', label: 'no wallet' },
]
const LOOKING_VIEWERS: { viewer: PanelViewer; label: string }[] = [
  { viewer: 'signer', label: 'signer' },
  { viewer: 'non-signer', label: 'not a signer' },
  { viewer: 'disconnected', label: 'no wallet' },
]
const OUTCOMES = ['executed', 'failed', 'replaced', 'deleted'] as const
type CaseOutcome = (typeof OUTCOMES)[number]
const OUTCOME_LABEL: Record<CaseOutcome, string> = {
  executed: 'processing',
  failed: 'failed',
  replaced: 'replaced',
  deleted: 'deleted',
}
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/** See all side panels: one row per side panel case, banded in the five case groups. */
export const getAllPanelRows = (): PolicyRow[] => {
  const required = TREASURY.threshold
  const row = (caseGroup: CaseGroup, caseLabel: string, patch: Partial<PolicyRow>): PolicyRow => ({
    id: `case-${caseGroup}-${caseLabel}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    type: 'allowlist',
    account: TREASURY,
    summary: countLabel(OPERATIONS_RECIPIENTS.length, 'recipient'),
    status: 'active',
    people: OPERATIONS_RECIPIENTS,
    isExample: true,
    caseGroup,
    caseLabel: capitalize(caseLabel),
    ...patch,
  })
  const failedTag = (prefix: string, outcome: CaseOutcome): StatusTag =>
    outcome === 'executed'
      ? { label: 'Processing', tone: 'processing' }
      : { label: `${prefix} ${OUTCOME_LABEL[outcome]}`, tone: 'failed' }
  const example = (change: 'Edit' | 'Removal', stage: SpecStage, tone: TagTone) => ({
    tag: { label: `${change} ${stage}${stage.endsWith('pending') ? ` · 1/${required}` : ''}`, tone },
    tooltip: getExampleTooltip(stage, required),
    change,
    stage,
  })

  /** A transaction's cases: each viewer while it waits, fully signed, then what became of it once sent. */
  const transaction = (
    group: CaseGroup,
    step: string,
    change: 'Edit' | 'Removal',
    pending: SpecStage,
    ready: SpecStage,
  ): PolicyRow[] => [
    ...VIEWER_CASES.map(({ viewer, label }) =>
      row(group, `${step} · ${label}`, {
        status: 'change-pending',
        viewer,
        example: example(change, pending, 'waiting'),
      }),
    ),
    row(group, `${step} · ready to execute`, { status: 'change-pending', example: example(change, ready, 'ready') }),
    ...OUTCOMES.map((outcome) =>
      row(group, `${step} · ${OUTCOME_LABEL[outcome]}`, {
        status: 'change-pending',
        panelOutcome: outcome,
        tag: failedTag(`${change}${step === 'apply' ? ' apply' : step === 'cancellation' ? ' cancel' : ''}`, outcome),
        example: example(change, pending, 'waiting'),
      }),
    ),
  ]
  /** A stage with no transaction waiting: only who is looking changes the panel. */
  const stage = (group: CaseGroup, name: string, change: 'Edit' | 'Removal', spec: SpecStage, tone: TagTone) =>
    LOOKING_VIEWERS.map(({ viewer, label }) =>
      row(group, `${name} · ${label}`, {
        status: tone === 'expired' ? 'active' : 'change-pending',
        viewer,
        example: example(change, spec, tone),
      }),
    )
  /** Request, review window, apply and expiry: the same steps for a change and for a removal. */
  const lifecycle = (group: CaseGroup, change: 'Edit' | 'Removal'): PolicyRow[] => [
    ...transaction(group, 'request', change, 'pending', 'ready to execute'),
    ...stage(group, 'in review window', change, 'in delay', 'waiting'),
    ...stage(group, 'ready to apply', change, 'ready to apply', 'ready'),
    ...transaction(group, 'apply', change, 'apply pending', 'apply ready to execute'),
    ...stage(group, 'expired', change, 'expired', 'expired'),
  ]

  const setupPending: PolicyRow[] = [
    ...VIEWER_CASES.map(({ viewer, label }) =>
      row('Setup pending', `waiting for signatures · ${label}`, {
        status: 'pending',
        signatures: { signed: 1, required },
        viewer,
      }),
    ),
    row('Setup pending', 'ready to execute', { status: 'pending', signatures: { signed: required, required } }),
    ...OUTCOMES.map((outcome) =>
      row('Setup pending', OUTCOME_LABEL[outcome], {
        status: outcome === 'executed' ? 'activating' : 'pending',
        signatures: { signed: required, required },
        panelOutcome: outcome === 'executed' ? undefined : outcome,
        tag: failedTag('Setup', outcome),
      }),
    ),
  ]
  const missing = getExampleRows().find(({ id }) => id === 'example-guard-missing')
  const active: PolicyRow[] = [
    ...LOOKING_VIEWERS.map(({ viewer, label }) => row('Active', label, { viewer })),
    ...(missing ? [{ ...missing, caseGroup: 'Active' as const, caseLabel: 'Not applied' }] : []),
  ]

  return [
    ...setupPending,
    ...active,
    ...lifecycle('Change request', 'Edit'),
    ...transaction('Change cancellation', 'cancellation', 'Edit', 'cancel pending', 'cancel ready to execute'),
    ...lifecycle('Remove allowlist', 'Removal'),
    ...transaction('Remove allowlist', 'cancellation', 'Removal', 'cancel pending', 'cancel ready to execute'),
  ]
}

/** Spec 5.4: rows that need someone to act come first, then ones waiting on time, then settled ones. */
const ACTION_RANK: Record<TagTone, number> = { ready: 0, waiting: 1, failed: 2, expired: 3, processing: 4, active: 5 }

const getActionRank = (row: PolicyRow): number => {
  if (row.type === 'allowlist') {
    const tag = getAllowlistTag(row)
    // Waiting on signatures is an action; waiting out the delay isn't.
    if (tag.tone === 'waiting' && !tag.label.includes('pending')) return ACTION_RANK.processing
    return ACTION_RANK[tag.tone]
  }
  if (row.status === 'blocked' || row.status === 'failed') return ACTION_RANK.failed
  if (row.status === 'pending') return ACTION_RANK.waiting
  return ACTION_RANK.active
}

export const sortByAction = (rows: PolicyRow[]): PolicyRow[] =>
  rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => getActionRank(a.row) - getActionRank(b.row) || a.index - b.index)
    .map(({ row }) => row)

/** Accounts that already have an allowlist, keyed like getAccountKey: the create flow disables them. */
export const getAllowlistAccountKeys = (payments: PaymentsSnapshot = DEFAULT_PAYMENTS): string[] =>
  getPolicyRows(payments)
    // A failed setup left nothing on the account, so it can be set up again.
    .filter(({ type, status, isExample }) => type === 'allowlist' && status !== 'failed' && !isExample)
    .map(({ account }) => getAccountKey(account))

/** M1's PolicyRule markup: icon tile and policy name; the Details column says what it covers. */
const PolicyCell = ({ type, caseLabel }: { type: M2PolicyType; caseLabel?: string }): ReactElement => {
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
        {caseLabel && (
          <Typography variant="paragraph-small" color="muted" className="max-w-52 truncate" title={caseLabel}>
            {caseLabel}
          </Typography>
        )}
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
  example,
}: PolicyRow): string | undefined => {
  if (example) return example.tooltip
  if (status === 'change-pending' || status === 'activating') return [statusNote, appliesAt].filter(Boolean).join(' · ')
  if (status === 'pending' && signatures) {
    const { signed, required } = signatures
    return signed >= required ? 'Ready to execute' : `${signed} of ${required} signatures`
  }
  if (status === 'failed') return 'The transaction failed. Nothing changed on this account.'
  if (status === 'active' && locked) return 'Locked by the allowlist'
  return undefined
}

/** Spec 5.7's colours: yellow waiting, blue ready, green active, grey expired. Red and processing aren't in the spec. */
type TagTone = 'waiting' | 'ready' | 'active' | 'expired' | 'processing' | 'failed'

const TAG_BADGES: Record<
  TagTone,
  { variant: 'warning' | 'info' | 'success' | 'subtle' | 'destructive'; dot?: string }
> = {
  waiting: { variant: 'warning' },
  ready: { variant: 'info', dot: 'bg-[var(--color-info-main)]' },
  active: { variant: 'success' },
  expired: { variant: 'subtle' },
  processing: { variant: 'subtle' },
  failed: { variant: 'destructive' },
}

export type StatusTag = { label: string; tone: TagTone }

/** Spec 5.7's tags: what the change is, then where it stands. */
export const SPEC_STATUS_TAGS: { group: string; tags: StatusTag[] }[] = [
  {
    group: 'Setup',
    tags: [
      { label: 'Setup pending · 1/3', tone: 'waiting' },
      { label: 'Setup ready to execute', tone: 'ready' },
      { label: 'Processing', tone: 'processing' },
      { label: 'Active', tone: 'active' },
    ],
  },
  ...['Edit', 'Removal'].map((change) => ({
    group: change,
    tags: [
      { label: `${change} pending · 1/3`, tone: 'waiting' as const },
      { label: `${change} ready to execute`, tone: 'ready' as const },
      { label: `${change} in delay`, tone: 'waiting' as const },
      { label: `${change} ready to apply`, tone: 'ready' as const },
      { label: `${change} apply pending · 1/3`, tone: 'waiting' as const },
      { label: `${change} apply ready to execute`, tone: 'ready' as const },
      { label: `${change} expired`, tone: 'expired' as const },
      { label: `${change} cancel pending · 1/3`, tone: 'waiting' as const },
      { label: `${change} cancel ready to execute`, tone: 'ready' as const },
    ],
  })),
]

/** An allowlist row's spec tag; spending limits and proposers keep M1's chips. */
export const getAllowlistTag = ({ status, signatures, example, tag }: PolicyRow): StatusTag => {
  if (tag) return tag
  if (example) return example.tag
  if (status === 'pending' && signatures) {
    const { signed, required } = signatures
    return signed >= required
      ? { label: 'Setup ready to execute', tone: 'ready' }
      : { label: `Setup pending · ${signed}/${required}`, tone: 'waiting' }
  }
  if (status === 'activating') return { label: 'Processing', tone: 'processing' }
  if (status === 'change-pending') return { label: 'Edit in delay', tone: 'waiting' }
  if (status === 'failed') return { label: 'Setup failed', tone: 'failed' }
  return { label: 'Active', tone: 'active' }
}

export const StatusTagChip = ({ tag, tooltip }: { tag: StatusTag; tooltip?: string }): ReactElement => {
  const { variant, dot } = TAG_BADGES[tag.tone]
  const chip = (
    <Badge variant={variant} size="status" shape="status" data-m2-new="Spec 5.7 · Status tag" data-m2-new-compact="">
      {tag.tone === 'processing' ? <Loader2 className="animate-spin" aria-hidden /> : <BadgeDot className={dot} />}
      {tag.label}
    </Badge>
  )
  if (!tooltip) return chip
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{chip}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

const STACK_PREVIEW = 3

/** The design system's AvatarGroup at its 24px size: the first three, then +n; hovering lists them all. */
const Stack = ({
  items,
  tooltip,
}: {
  items: { key: string; src?: string; fallback: string }[]
  tooltip: string
}): ReactElement => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" />}>
      <AvatarGroup>
        {items.slice(0, STACK_PREVIEW).map(({ key, src, fallback }) => (
          <Avatar key={key} size="xs">
            {src && <AvatarImage src={src} alt="" />}
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        ))}
        {items.length > STACK_PREVIEW && <AvatarGroupCount>+{items.length - STACK_PREVIEW}</AvatarGroupCount>}
      </AvatarGroup>
    </TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
)

const findToken = (account: M2Account, symbol: string) =>
  [...getAccountTokens(account), ...POPULAR_TOKENS].find((token) => token.symbol === symbol)

const TokenStack = ({ tokens }: { tokens: { symbol: string; logoUri: string }[] }): ReactElement => (
  <Stack
    tooltip={tokens.map(({ symbol }) => symbol).join(', ')}
    items={tokens.map(({ symbol, logoUri }) => ({ key: symbol, src: logoUri, fallback: symbol.charAt(0) }))}
  />
)

const PeopleStack = ({ people }: { people: Person[] }): ReactElement => (
  <Stack
    tooltip={people.map(({ name }) => name).join(', ')}
    items={people.map(({ name, address }) => ({ key: address, fallback: name.charAt(0).toUpperCase() }))}
  />
)

/** What the policy covers at a glance: tokens, then recipients or the spender; a proposer shows who. */
const ContextCell = ({ row }: { row: PolicyRow }): ReactElement | null => {
  if (row.type === 'allowlist') {
    const { excludedTokens } = getAllowlistSettings(row.account)
    const tokens = getAccountTokens(row.account).filter(({ symbol }) => !excludedTokens.includes(symbol))
    return (
      <div className="flex items-center gap-4" data-m2-new="New · Details column" data-m2-new-compact="">
        <TokenStack tokens={tokens} />
        <span className="h-4 w-px bg-border" aria-hidden />
        <PeopleStack people={row.people} />
      </div>
    )
  }
  if (row.type === 'spending-limit' && row.spendingLimit) {
    const tokenInfo = findToken(row.account, row.spendingLimit.token)
    return (
      <div className="flex items-center gap-4" data-m2-new="New · Details column" data-m2-new-compact="">
        {tokenInfo && <TokenStack tokens={[tokenInfo]} />}
        <span className="h-4 w-px bg-border" aria-hidden />
        <PeopleStack people={row.people} />
      </div>
    )
  }
  return <PeopleStack people={row.people} />
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
// Three 24px tokens and three recipients, overlapping, with the divider between.
const DETAILS_COLUMN_WIDTH = 8 + 160 + 8
// Room for the group-by button on both sides of the centred header label.
const NETWORK_COLUMN_WIDTH = 8 + 120 + 8
const STATUS_COLUMN_WIDTH = 8 + 176 + 16

/** Policy at the left padding, Status at the right padding, Safe account, Network and Details spaced evenly between. */
const policyRowColumns: DataTableColumn<PolicyRow>[] = [
  {
    id: 'policy',
    header: 'POLICY',
    width: 'fit',
    sticky: true,
    minWidth: POLICY_COLUMN_WIDTH,
    cell: ({ type, caseLabel }) => (
      <RowCell>
        <PolicyCell type={type} caseLabel={caseLabel} />
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
  spacerColumn('gap-network-details'),
  {
    id: 'details',
    header: 'DETAILS',
    width: 'fit',
    minWidth: DETAILS_COLUMN_WIDTH,
    priority: 'secondary',
    cell: (row) => (
      <RowCell>
        <ContextCell row={row} />
      </RowCell>
    ),
  },
  spacerColumn('gap-details-status'),
  {
    id: 'status',
    header: 'STATUS',
    width: 'fit',
    minWidth: STATUS_COLUMN_WIDTH,
    // Right-aligned, so the chip sits as far from the right edge as the Policy icon from the left.
    align: 'end',
    cell: (row) => (
      <RowCell justify="end">
        {row.type === 'allowlist' ? (
          <StatusTagChip tag={getAllowlistTag(row)} tooltip={getStatusDetail(row)} />
        ) : (
          <RowStatusChip status={row.status} tooltip={getStatusDetail(row)} />
        )}
      </RowCell>
    ),
  },
]

type Grouping = 'urgency' | 'type' | 'account' | 'network' | 'case'

const rank = <T,>(order: T[], value: T): number => {
  const index = order.indexOf(value)
  return index === -1 ? order.length : index
}

/** The queue's Group by options: one list by urgency, or bands. */
const GROUP_BY_OPTIONS: GroupByOption<Grouping>[] = [
  { value: 'urgency', label: 'Urgency', hint: 'Policies listed by what needs action first' },
  { value: 'type', label: 'Policy type', hint: 'Grouped by allowlist, spending limit and proposer' },
  { value: 'account', label: 'Safe account', hint: 'Grouped by Safe account and network' },
  { value: 'network', label: 'Network', hint: 'Grouped by network' },
]

const CASE_GROUP_OPTION: GroupByOption<Grouping> = {
  value: 'case',
  label: 'Side panel case',
  hint: 'Setup pending, active, change request, cancellation and removal',
}

const GROUPINGS: Record<
  Exclude<Grouping, 'urgency'>,
  { getKey: (row: PolicyRow) => string; compare: (a: PolicyRow, b: PolicyRow) => number }
> = {
  type: {
    getKey: ({ type }) => type,
    compare: (a, b) => rank(POLICY_ROW_TYPE_ORDER, a.type) - rank(POLICY_ROW_TYPE_ORDER, b.type),
  },
  account: {
    getKey: ({ account }) => getAccountKey(account),
    compare: (a, b) =>
      a.account.name.localeCompare(b.account.name) ||
      rank(NETWORK_OPTIONS, a.account.chainId) - rank(NETWORK_OPTIONS, b.account.chainId),
  },
  network: {
    getKey: ({ account }) => account.chainId,
    compare: (a, b) => rank(NETWORK_OPTIONS, a.account.chainId) - rank(NETWORK_OPTIONS, b.account.chainId),
  },
  case: {
    getKey: ({ caseGroup }) => caseGroup ?? '',
    compare: (a, b) =>
      rank<string>([...CASE_GROUPS], a.caseGroup ?? '') - rank<string>([...CASE_GROUPS], b.caseGroup ?? ''),
  },
}

type GroupHeadingRow = {
  kind: 'group'
  id: string
  grouping: Exclude<Grouping, 'urgency'>
  first: PolicyRow
  count: number
  collapsed: boolean
}

type ByPolicyTableRow = { kind: 'policy'; row: PolicyRow } | GroupHeadingRow

const getGroups = (rows: PolicyRow[], grouping: Exclude<Grouping, 'urgency'>): PolicyRow[][] => {
  const { getKey, compare } = GROUPINGS[grouping]
  const groups = new Map<string, PolicyRow[]>()
  rows.forEach((row) => groups.set(getKey(row), [...(groups.get(getKey(row)) ?? []), row]))
  // The case groups follow the lifecycle, not urgency.
  if (grouping === 'case') return [...groups.values()].sort((a, b) => compare(a[0], b[0]))
  // Rows arrive by urgency, so a group's first row is its most urgent: groups needing action come first.
  return [...groups.values()].sort((a, b) => getActionRank(a[0]) - getActionRank(b[0]) || compare(a[0], b[0]))
}

const getGroupId = (grouping: Exclude<Grouping, 'urgency'>, row: PolicyRow): string =>
  `group:${GROUPINGS[grouping].getKey(row)}`

/** Rows keep their urgency order inside each band; a collapsed band hides its rows. */
const toTableRows = (rows: PolicyRow[], grouping: Grouping, collapsed: string[]): ByPolicyTableRow[] => {
  if (grouping === 'urgency') return rows.map((row): ByPolicyTableRow => ({ kind: 'policy', row }))

  return getGroups(rows, grouping).flatMap((group): ByPolicyTableRow[] => {
    const id = getGroupId(grouping, group[0])
    const isCollapsed = collapsed.includes(id)
    return [
      { kind: 'group', id, grouping, first: group[0], count: group.length, collapsed: isCollapsed },
      ...(isCollapsed ? [] : group.map((row): ByPolicyTableRow => ({ kind: 'policy', row }))),
    ]
  })
}

/** The queue's band: a light fill that darkens on hover, the whole row toggling the group. */
const GROUP_ROW_CLASS =
  'group/band cursor-pointer bg-none! [&>td]:bg-foreground/[0.03]! hover:[&>td]:bg-foreground/[0.06]! [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg'

/** The band's title, as its column shows it: the account with its network, the chain logo, or the policy type. */
const GroupValue = ({ group: { grouping, first: row } }: { group: GroupHeadingRow }): ReactElement => {
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
    case 'case':
      return <Typography variant="paragraph-small-medium">{row.caseGroup}</Typography>
    case 'type': {
      const { Icon } = POLICY_TYPES[row.type]
      return (
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          <Typography variant="paragraph-small-medium">{POLICY_ROW_LABELS[row.type]}</Typography>
        </div>
      )
    }
  }
}

/** The queue's QueueGroupRow: chevron, title and count in the first cell. */
const GroupRowCell = ({ columnId, group }: { columnId: string; group: GroupHeadingRow }): ReactElement | null => {
  if (columnId !== 'policy') return null

  return (
    <div className="flex min-h-10 items-center gap-3" data-m2-new="Queue copy · Group band" data-m2-new-compact="">
      <ChevronDown
        className={`size-4 shrink-0 text-muted-foreground transition-transform ${group.collapsed ? '-rotate-90' : ''}`}
        aria-hidden
      />
      <GroupValue group={group} />
      <span className="text-sm text-muted-foreground tabular-nums">{group.count}</span>
    </div>
  )
}

/** The column whose values name the groups: collapse-all sits next to its title. */
const GROUPED_COLUMN: Record<Exclude<Grouping, 'urgency'>, string> = {
  type: 'policy',
  account: 'appliesTo',
  network: 'network',
  case: 'policy',
}

const getByPolicyColumns = (collapseAll?: {
  columnId: string
  allCollapsed: boolean
  count: number
  onToggle: () => void
}): DataTableColumn<ByPolicyTableRow>[] =>
  policyRowColumns.map(
    ({ id, header, cell, width, sticky, minWidth, priority, align }): DataTableColumn<ByPolicyTableRow> => ({
      id,
      width,
      sticky,
      minWidth,
      priority,
      align,
      header:
        collapseAll && id === collapseAll.columnId ? (
          <span className="inline-flex items-center gap-1">
            {header}
            <CollapseAllButton {...collapseAll} />
          </span>
        ) : (
          header
        ),
      cell: (row, context) =>
        row.kind === 'policy' ? cell(row.row, context) : <GroupRowCell columnId={id} group={row} />,
    }),
  )

/** What a row asks of the viewer, the Status filter's options, in the table's order. */
type ActionBucket = 'ready' | 'signatures' | 'attention' | 'expired' | 'waiting' | 'active'

const ACTION_BUCKETS: ActionBucket[] = ['ready', 'signatures', 'attention', 'expired', 'waiting', 'active']

const BUCKET_LABELS: Record<ActionBucket, { menu: string; chip: string; dot: string }> = {
  ready: { menu: 'Ready', chip: 'Ready to execute or apply', dot: 'bg-[var(--color-info-main)]' },
  signatures: { menu: 'Needs signatures', chip: 'Needs signatures', dot: 'bg-badge-dot-warning' },
  attention: { menu: 'Blocked or failed', chip: 'Blocked or failed', dot: 'bg-destructive' },
  expired: { menu: 'Expired', chip: 'Expired', dot: 'bg-muted-foreground' },
  waiting: { menu: 'In delay or processing', chip: 'In delay or processing', dot: 'bg-badge-dot-warning' },
  active: { menu: 'Active', chip: 'Active', dot: 'bg-badge-dot-success' },
}

const getActionBucket = (row: PolicyRow): ActionBucket => ACTION_BUCKETS[getActionRank(row)]

export type PolicyFilters = {
  query: string
  accounts: string[]
  networks: string[]
  types: M2PolicyType[]
  statuses: ActionBucket[]
}

const NO_POLICY_FILTERS: PolicyFilters = { query: '', accounts: [], networks: [], types: [], statuses: [] }

const matchesPolicyFilters = (filters: PolicyFilters, row: PolicyRow): boolean =>
  (filters.accounts.length === 0 || filters.accounts.includes(row.account.address)) &&
  (filters.networks.length === 0 || filters.networks.includes(row.account.chainId)) &&
  (filters.types.length === 0 || filters.types.includes(row.type)) &&
  (filters.statuses.length === 0 || filters.statuses.includes(getActionBucket(row))) &&
  matchesQuery(filters.query, [
    POLICY_ROW_LABELS[row.type],
    row.account.name,
    row.account.address,
    ...row.people.flatMap(({ name, address }) => [name, address]),
  ])

const unique = <T,>(values: T[]): T[] => [...new Set(values)]

const NO_PILL_FILTERS: Omit<PolicyFilters, 'query'> = { accounts: [], networks: [], types: [], statuses: [] }

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
  /** See all side panels: one row per side panel case instead of the prototype's own rows. */
  showAllPanels?: boolean
}

/** M1's policy list, one row per policy, with the Workspace queue's toolbar, grouping and collapsible bands. */
export const PoliciesByPolicyPage = ({
  payments = DEFAULT_PAYMENTS,
  onAddPolicy,
  onSelectAccount,
  onSelectPolicy,
  initialFilters,
  showAllPanels = false,
}: PoliciesByPolicyPageProps): ReactElement => {
  const [filters, setFilters] = useState<PolicyFilters>({ ...NO_POLICY_FILTERS, ...initialFilters })
  const [grouping, setGrouping] = useState<Grouping>(showAllPanels ? 'case' : 'urgency')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const allRows = useMemo(
    () => (showAllPanels ? getAllPanelRows() : sortByAction(getPolicyRows(payments))),
    [payments, showAllPanels],
  )
  const rows = useMemo(() => allRows.filter((row) => matchesPolicyFilters(filters, row)), [allRows, filters])
  const tableRows = useMemo(() => toTableRows(rows, grouping, collapsed), [rows, grouping, collapsed])
  const groupIds =
    grouping === 'urgency' ? [] : getGroups(rows, grouping).map((group) => getGroupId(grouping, group[0]))
  const allCollapsed = groupIds.length > 0 && groupIds.every((id) => collapsed.includes(id))
  const columns = getByPolicyColumns(
    groupIds.length > 0 && grouping !== 'urgency'
      ? {
          columnId: GROUPED_COLUMN[grouping],
          allCollapsed,
          count: groupIds.length,
          onToggle: () => setCollapsed(allCollapsed ? [] : groupIds),
        }
      : undefined,
  )

  // Counts follow the rows the other filters leave, as the queue's do.
  const countFor = (key: keyof Omit<PolicyFilters, 'query'>, matches: (row: PolicyRow) => boolean): number =>
    allRows.filter((row) => matchesPolicyFilters({ ...filters, [key]: [] }, row) && matches(row)).length
  const toggleFilter =
    <K extends keyof Omit<PolicyFilters, 'query'>>(key: K) =>
    (value: string) =>
      setFilters((current) => ({ ...current, [key]: toggle(current[key] as string[], value) }))
  const selectRow = (row: PolicyRow) => (onSelectPolicy ? onSelectPolicy(row) : onSelectAccount?.(row.account))

  const sections: FilterSection[] = [
    {
      key: 'statuses',
      label: 'Status',
      chipLabels: Object.fromEntries(ACTION_BUCKETS.map((bucket) => [bucket, BUCKET_LABELS[bucket].chip])),
      options: ACTION_BUCKETS.map((bucket) => ({
        value: bucket,
        label: BUCKET_LABELS[bucket].menu,
        icon: (
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
            <span className={`size-2 rounded-full ${BUCKET_LABELS[bucket].dot}`} />
          </span>
        ),
        count: countFor('statuses', (row) => getActionBucket(row) === bucket),
      })),
      separatorAfter: ['attention'],
      selected: filters.statuses,
      onToggle: toggleFilter('statuses'),
    },
    {
      key: 'types',
      label: 'Policy type',
      options: POLICY_ROW_TYPE_ORDER.map((type) => {
        const { Icon } = POLICY_TYPES[type]
        return {
          value: type,
          label: POLICY_ROW_LABELS[type],
          icon: <Icon className="size-4 text-muted-foreground" aria-hidden />,
          count: countFor('types', (row) => row.type === type),
        }
      }),
      selected: filters.types,
      onToggle: toggleFilter('types'),
    },
    {
      key: 'accounts',
      label: 'Safe account',
      options: unique(allRows.map(({ account }) => account.address))
        .map((address) => ({
          value: address,
          label: allRows.find(({ account }) => account.address === address)?.account.name ?? address,
          icon: <Identicon address={address} size={16} />,
          count: countFor('accounts', (row) => row.account.address === address),
        }))
        .sort((a, b) => b.count - a.count),
      note: 'Sorted by number of policies',
      selected: filters.accounts,
      onToggle: toggleFilter('accounts'),
    },
    {
      key: 'networks',
      label: 'Network',
      options: unique(allRows.map(({ account }) => account.chainId)).map((chainId) => ({
        value: chainId,
        label: CHAIN_NAMES[chainId] ?? chainId,
        icon: <ChainIndicator chainId={chainId} onlyLogo imageSize={16} />,
        count: countFor('networks', (row) => row.account.chainId === chainId),
      })),
      selected: filters.networks,
      onToggle: toggleFilter('networks'),
    },
  ]

  return (
    <PolicyPage header={<ByPolicyHeading />}>
      <div className="flex flex-col gap-4">
        <PolicyToolbar
          search={
            <SearchInput
              variant="surface"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              onClear={() => setFilters({ ...filters, query: '' })}
              placeholder="Search"
              aria-label="Search policies"
              autoComplete="off"
              className="min-w-48 flex-1"
            />
          }
          groupBy={{
            options: showAllPanels ? [...GROUP_BY_OPTIONS, CASE_GROUP_OPTION] : GROUP_BY_OPTIONS,
            value: grouping,
            onChange: (next) => {
              setGrouping(next)
              setCollapsed([])
            },
          }}
          sections={sections}
          onClear={() => setFilters({ ...filters, ...NO_PILL_FILTERS })}
          action={
            <Button onClick={onAddPolicy} className="shrink-0">
              <Plus className="size-4 text-green-500" aria-hidden />
              New
            </Button>
          }
        />

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
                else setCollapsed((current) => toggle(current, row.id))
              }}
              // Grouped, everything sits on one page so no group is split across pages.
              pageSize={grouping === 'urgency' ? undefined : tableRows.length}
            />
          )}
        </TableCard>
      </div>
    </PolicyPage>
  )
}
