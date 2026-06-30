import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Search, Settings2, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { getFlaggedSimilarAddressSet } from '@safe-global/utils/utils/addressSimilarity'
import useWallet from '@/hooks/wallets/useWallet'
import {
  type AllSafeItems,
  type SafeItem,
  type MultiChainSafeItem,
  type SafeListSortColumn,
  type SafeListSortDirection,
  getSafeListComparator,
  isMultiChainSafeItem,
  useAllSafesGrouped,
  useSafesSearch,
} from '@/hooks/safes'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import ConnectWalletPrompt from '../ConnectWalletPrompt'
import MigrationPrompt from '../MigrationPrompt'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import useMigrationPrompt from '../../hooks/useMigrationPrompt'
import { buildAddressSet, groupSafesByPrecedence } from '../../utils/groupSafes'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import EntryDialog from '@/components/address-book/EntryDialog'
import SafeTableHeader from './SafeTableHeader'
import SafeTableRow from './SafeTableRow'
import MultiChainSafeTableRow from './MultiChainSafeTableRow'

const getChainIds = (item: SafeItem | MultiChainSafeItem): string[] =>
  isMultiChainSafeItem(item) ? item.safes.map((s) => s.chainId) : [item.chainId]

type SafeTab = 'workspace' | 'local'

/** Stable per-row key used to track each row's reported balance. */
const itemKey = (item: SafeItem | MultiChainSafeItem): string =>
  isMultiChainSafeItem(item) ? item.address.toLowerCase() : `${item.chainId}:${item.address}`.toLowerCase()

type SafesTableProps = {
  /** Safes belonging to the current workspace (passed in so this component doesn't import the spaces feature). */
  workspaceSafes?: AllSafeItems
  /** When true, workspace rows become multi-selectable for bulk removal. */
  manageMode?: boolean
  /** Called with the selected workspace safes when the user confirms removal. */
  onRemoveFromWorkspace?: (items: AllSafeItems) => void
  /** When true (admin), local rows show an "Add to Workspace" action. */
  canAddToWorkspace?: boolean
  /** Adds a single local safe (all its chains) to the current workspace. */
  onAddToWorkspace?: (item: SafeItem | MultiChainSafeItem) => void
  /**
   * Page-level action buttons rendered on the row beneath the tabs, alongside the search.
   * May be a render function receiving the active tab + a tab setter so callers can vary the
   * buttons per tab and switch tabs (e.g. jump to the Local tab).
   */
  headerActions?: ReactNode | ((tab: SafeTab, setTab: (tab: SafeTab) => void) => ReactNode)
  onLinkClick?: () => void
}

const TrustedSafesHeader = ({ onManage }: { onManage: () => void }) => (
  <div className="bg-muted/30 border-muted flex items-center gap-2 border-b px-4 py-2.5">
    <Tooltip>
      <TooltipTrigger render={<div className="flex w-fit cursor-help items-center gap-1.5" />}>
        <ShieldCheck className="size-4 text-green-600" />
        <Typography variant="paragraph-small-bold" color="muted">
          Trusted Safes
        </Typography>
      </TooltipTrigger>
      <TooltipContent>Verified Safe accounts you selected</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Manage trusted Safes"
            data-testid="add-more-safes-button"
            onClick={onManage}
            className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
          />
        }
      >
        <Settings2 className="size-4" />
      </TooltipTrigger>
      <TooltipContent>Manage trusted Safes</TooltipContent>
    </Tooltip>
  </div>
)

const EmptyRow = ({ children }: { children: ReactNode }) => (
  <Typography variant="paragraph-small" color="muted" align="center" className="py-4">
    {children}
  </Typography>
)

const TableShell = ({
  column,
  direction,
  onSort,
  children,
}: {
  column: SafeListSortColumn
  direction: SafeListSortDirection
  onSort: (column: SafeListSortColumn) => void
  children: ReactNode
}) => (
  <div className="bg-card border-border overflow-hidden rounded-2xl border">
    <SafeTableHeader column={column} direction={direction} onSort={onSort} />
    <div className="max-h-[640px] overflow-y-auto">{children}</div>
  </div>
)

const SafesTable = ({
  workspaceSafes = [],
  manageMode = false,
  onRemoveFromWorkspace,
  canAddToWorkspace = false,
  onAddToWorkspace,
  headerActions,
  onLinkClick,
}: SafesTableProps) => {
  const wallet = useWallet()
  const isConnected = Boolean(wallet)

  // Page-scoped search lives on the actions row beneath the tabs (matches the Address book).
  const [searchQuery, setSearchQuery] = useState('')

  const modal = useTrustedSafesModal()
  const migration = useMigrationPrompt()

  // Workspace (current Space) safes form the top group and are excluded from the others.
  const workspaceAddresses = useMemo(() => buildAddressSet(workspaceSafes), [workspaceSafes])

  // The complete personal list (pinned + owned + undeployed + watched), grouped multi/single.
  const grouped = useAllSafesGrouped()
  const globalSafes = useMemo<AllSafeItems>(
    () => [...(grouped.allMultiChainSafes ?? []), ...(grouped.allSingleSafes ?? [])],
    [grouped.allMultiChainSafes, grouped.allSingleSafes],
  )

  const { trusted, owned, local } = useMemo(
    () => groupSafesByPrecedence(globalSafes, workspaceAddresses, isConnected),
    [globalSafes, workspaceAddresses, isConnected],
  )

  const allItems = useMemo<AllSafeItems>(
    () => [...workspaceSafes, ...trusted, ...owned, ...local],
    [workspaceSafes, trusted, owned, local],
  )

  // Each row reports the balance it actually displays; we sort on that so the order always
  // matches what the user sees (keyed by the row's stable itemKey).
  const [balances, setBalances] = useState<Record<string, number>>({})
  const reportBalance = useCallback(
    (key: string) => (value: number | undefined) =>
      setBalances((prev) => (value === undefined || prev[key] === value ? prev : { ...prev, [key]: value })),
    [],
  )

  const [sort, setSort] = useState<{ column: SafeListSortColumn; direction: SafeListSortDirection }>({
    column: 'name',
    direction: 'asc',
  })
  const comparator = useMemo(() => {
    if (sort.column === 'balance') {
      return (a: SafeItem | MultiChainSafeItem, b: SafeItem | MultiChainSafeItem) => {
        const diff = (balances[itemKey(a)] ?? 0) - (balances[itemKey(b)] ?? 0)
        return sort.direction === 'desc' ? -diff : diff
      }
    }
    return getSafeListComparator(sort.column, sort.direction)
  }, [sort, balances])
  const toggleSort = (column: SafeListSortColumn) =>
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: column === 'balance' ? 'desc' : 'asc' },
    )

  const sortedWorkspace = useMemo(() => [...workspaceSafes].sort(comparator), [workspaceSafes, comparator])
  const sortedTrusted = useMemo(() => [...trusted].sort(comparator), [trusted, comparator])

  // "Local" tab lists only your Trusted (pinned) safes — owned/other are managed via the modal.
  const localCount = trusted.length

  // Search filters within each tab independently.
  const filteredWorkspace = useSafesSearch(workspaceSafes, searchQuery)
  const filteredLocal = useSafesSearch(trusted, searchQuery)
  const sortedFilteredWorkspace = useMemo(
    () => [...filteredWorkspace].sort(comparator),
    [filteredWorkspace, comparator],
  )
  const sortedFilteredLocal = useMemo(() => [...filteredLocal].sort(comparator), [filteredLocal, comparator])

  const [tab, setTab] = useState<SafeTab>('workspace')

  // Risky look-alike addresses are hidden by default and only shown on demand.
  const flaggedSet = useMemo(() => getFlaggedSimilarAddressSet(allItems.map((item) => item.address)), [allItems])
  const isFlagged = (item: SafeItem | MultiChainSafeItem) => flaggedSet.has(item.address.toLowerCase())
  const [showFlagged, setShowFlagged] = useState(false)

  // Inline rename target (opens EntryDialog across all the safe's chains).
  const [renameTarget, setRenameTarget] = useState<SafeItem | MultiChainSafeItem | null>(null)

  // Multi-select state for manage mode (keyed by lowercased address).
  const [selected, setSelected] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!manageMode) setSelected(new Set())
  }, [manageMode])

  const toggleSelect = (address: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      const key = address.toLowerCase()
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const handleRemoveSelected = () => {
    const items = sortedWorkspace.filter((item) => selected.has(item.address.toLowerCase()))
    if (items.length === 0) return
    onRemoveFromWorkspace?.(items)
    setSelected(new Set())
  }

  const renderRow = (item: SafeItem | MultiChainSafeItem, { isSpaceSafe }: { isSpaceSafe: boolean }) => {
    const selectable = isSpaceSafe && manageMode
    const isSelected = selected.has(item.address.toLowerCase())
    const onRename = () => setRenameTarget(item)
    // "Add to Workspace" only applies to local (non-workspace) safes, admin-gated.
    const onAdd = !isSpaceSafe && canAddToWorkspace && onAddToWorkspace ? () => onAddToWorkspace(item) : undefined
    const onBalanceResolved = reportBalance(itemKey(item))

    return isMultiChainSafeItem(item) ? (
      <MultiChainSafeTableRow
        key={item.address}
        multiSafeAccountItem={item}
        onLinkClick={onLinkClick}
        isSpaceSafe={isSpaceSafe}
        selectable={selectable}
        selected={isSelected}
        onToggleSelect={() => toggleSelect(item.address)}
        onRename={onRename}
        onAddToWorkspace={onAdd}
        onBalanceResolved={onBalanceResolved}
      />
    ) : (
      <SafeTableRow
        key={`${item.chainId}:${item.address}`}
        safeItem={item}
        onLinkClick={onLinkClick}
        isSpaceSafe={isSpaceSafe}
        selectable={selectable}
        selected={isSelected}
        onToggleSelect={() => toggleSelect(item.address)}
        onRename={onRename}
        onAddToWorkspace={onAdd}
        onBalanceResolved={onBalanceResolved}
      />
    )
  }

  const renderFlaggedSection = (items: AllSafeItems, isSpaceSafe: boolean) => {
    if (items.length === 0) return null
    const plural = items.length === 1 ? '' : 's'
    return (
      <section data-testid="flagged-safes-section">
        <button
          type="button"
          onClick={() => setShowFlagged((prev) => !prev)}
          className="border-muted hover:bg-muted/40 flex w-full items-center gap-2 border-b px-4 py-2 text-left text-sm font-medium text-amber-700 transition-colors"
          data-testid="toggle-flagged-safes"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {items.length} Safe{plural} hidden — flagged as possible look-alike{plural}
          <span className="text-muted-foreground ml-auto font-normal">{showFlagged ? 'Hide' : 'Show'}</span>
        </button>
        {showFlagged && items.map((item) => renderRow(item, { isSpaceSafe }))}
      </section>
    )
  }

  // Nothing to show and no wallet — guide the user to connect.
  if (!isConnected && allItems.length === 0) {
    return <ConnectWalletPrompt />
  }

  // Search shows raw matches; otherwise flagged look-alikes are pulled out into a hidden group.
  const workspaceRows = searchQuery ? sortedFilteredWorkspace : sortedWorkspace
  const workspaceVisible = searchQuery ? workspaceRows : workspaceRows.filter((i) => !isFlagged(i))
  const workspaceFlagged = searchQuery ? [] : workspaceRows.filter(isFlagged)
  const trustedRows = searchQuery ? sortedFilteredLocal : sortedTrusted
  const trustedVisible = searchQuery ? trustedRows : trustedRows.filter((i) => !isFlagged(i))
  const trustedFlagged = searchQuery ? [] : trustedRows.filter(isFlagged)

  return (
    <>
      {migration.shouldShowPrompt && <MigrationPrompt onProceed={modal.open} />}

      <Tabs value={tab} onValueChange={(value) => setTab(value as 'workspace' | 'local')}>
        {/* Tabs on top — like the Address book. */}
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="workspace" className="cursor-pointer" data-testid="workspace-safes-tab">
            Workspace Safe accounts ({sortedWorkspace.length})
          </TabsTrigger>
          <TabsTrigger value="local" className="cursor-pointer" data-testid="local-safes-tab">
            Local Safe accounts ({localCount})
          </TabsTrigger>
        </TabsList>

        {/* Buttons + search on the row beneath the tabs. */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {typeof headerActions === 'function' ? headerActions(tab, setTab) : headerActions}
          <div className="w-full max-w-xs">
            <InputGroup className="bg-card rounded-lg px-3">
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                id="safe-accounts-search"
                placeholder="Search this page"
                aria-label="Search Safe accounts on this page"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>

        <TabsContent value="workspace">
          {manageMode && (
            <div
              className="border-border bg-muted/40 mb-3 flex items-center justify-between gap-3 rounded-lg border px-4 py-2"
              data-testid="workspace-manage-bar"
            >
              <Typography variant="paragraph-small" color="muted">
                {selected.size} selected
              </Typography>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selected.size === 0}
                  onClick={handleRemoveSelected}
                  data-testid="remove-from-workspace-btn"
                >
                  <Trash2 className="size-4" />
                  Remove from workspace ({selected.size})
                </Button>
              </div>
            </div>
          )}
          <TableShell column={sort.column} direction={sort.direction} onSort={toggleSort}>
            <section data-testid="workspace-safes-section">
              {workspaceVisible.length > 0 ? (
                workspaceVisible.map((item) => renderRow(item, { isSpaceSafe: true }))
              ) : workspaceFlagged.length === 0 ? (
                <EmptyRow>{searchQuery ? 'No results' : 'No Safes in this workspace yet'}</EmptyRow>
              ) : null}
            </section>
            {renderFlaggedSection(workspaceFlagged, true)}
          </TableShell>
        </TabsContent>

        <TabsContent value="local">
          <TableShell column={sort.column} direction={sort.direction} onSort={toggleSort}>
            <section data-testid="trusted-safes-section">
              <TrustedSafesHeader onManage={modal.open} />
              {trustedVisible.length > 0 ? (
                trustedVisible.map((item) => renderRow(item, { isSpaceSafe: false }))
              ) : trustedFlagged.length === 0 ? (
                <EmptyRow>
                  {searchQuery ? 'No results' : 'No trusted Safes yet — use “Manage trusted Safes” to add some.'}
                </EmptyRow>
              ) : null}
            </section>
            {renderFlaggedSection(trustedFlagged, false)}
          </TableShell>
        </TabsContent>
      </Tabs>

      <TrustedSafesModal modal={modal} />

      {renameTarget && (
        <EntryDialog
          handleClose={() => setRenameTarget(null)}
          defaultValues={{ name: renameTarget.name ?? '', address: renameTarget.address }}
          chainIds={getChainIds(renameTarget)}
          disableAddressInput
        />
      )}
    </>
  )
}

export default SafesTable
