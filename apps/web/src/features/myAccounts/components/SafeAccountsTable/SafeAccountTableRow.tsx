import { useCallback, useMemo, type MouseEvent, type ReactNode } from 'react'
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import type { LinkProps } from 'next/link'
import { useRouter } from 'next/router'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useRowOverviews } from './useRowOverviews'
import { SimilarityWarningIcon } from './SimilarityBand'
import type { SimilarWarning } from '@/features/address-poisoning'
import Identicon from '@/components/common/Identicon'
import { SafeInfoDisplay } from '@/components/common/AccountRow'
import MultiAccountContextMenu from '@/components/common/SafeListContextMenu/MultiAccountContextMenu'
import FiatBalance from '@/components/common/FiatBalance'
import { useChain } from '@/hooks/useChains'
import { useAddressBookWriteScope } from '@/features/spaces'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { AccountItem as BaseAccountItem } from '../AccountItem'
import { NetworkLogosPill } from '@/features/multichain'
import { getContextMenuChainIds, type AccountLine } from './useSafeAccountRows'
import type { SafeAccountColumn } from '@views/features/myAccounts/components/SafeAccountsTable/columns'
import {
  SafeAccountNameCellView,
  SafeAccountNameContentView,
  SafeAccountTableRowView,
  type RowCheckbox,
} from '@views/features/myAccounts/components/SafeAccountsTable/SafeAccountTableRowView'

export type { RowCheckbox }

type SafeAccountTableRowProps = {
  line: AccountLine
  columns: SafeAccountColumn[]
  expanded?: boolean
  /** Draw a bottom divider — only true at the boundary between top-level accounts, not within a group. */
  showDivider?: boolean
  /** When set, shows the inline look-alike ⚠️ (with a peers tooltip) after the name — cross-list only. */
  warning?: SimilarWarning
  /** Tints the row (warning background) as a member of an address-poisoning similarity group. */
  highlighted?: boolean
  /** Replaces the default context-menu actions cell (e.g. an "Add to workspace" button). */
  renderActions?: (line: AccountLine) => ReactNode
  /** Replaces the identity cell; the cell stops clipping so a field can overhang its padding. */
  renderName?: (line: AccountLine) => ReactNode
  /** When set, adds the hover rename pencil to the identity cell (non-modal surfaces). */
  onRename?: (line: AccountLine) => void
  /** When set, a leading checkbox cell is rendered in selection mode. */
  checkbox?: RowCheckbox
  onSelectToggle?: (nextChecked: boolean) => void
  onToggle?: () => void
  onLinkClick?: (line: AccountLine) => void
  /** Drag-and-drop wiring from @hello-pangea/dnd — set only on the draggable parent row. */
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  rowRef?: (element: HTMLElement | null) => void
  rowDraggableProps?: DraggableProvidedDraggableProps
  isDragging?: boolean
  /** Reports this row's lazily-fetched Safe overviews up to the table so it can fill balance/threshold. */
  onOverviewsLoaded: (overviews: SafeOverview[]) => void
}

// Shares the dropdown's row identity cell: clip-gated name/address tooltips and copy/explorer icons
// revealed on row hover. Single/parent rows lead with the blockie identicon; per-chain child rows
// carry no icon (the chain is already named beside them) — a blank icon-width spacer keeps their name
// aligned under the parent's. `onRename`, when set, adds the hover rename pencil (non-modal surfaces).
const NameCellContent = ({
  line,
  warning,
  onRename,
  nameLink,
}: {
  line: AccountLine
  warning?: SimilarWarning
  onRename?: () => void
  /** When set, only the name text becomes a navigation link — see SafeInfoDisplay's `nameLink`. */
  nameLink?: { href: LinkProps['href']; onClick?: () => void; testId?: string }
}) => {
  const chainConfig = useChain(line.chainId)
  const { canRename } = useAddressBookWriteScope(line.address, getContextMenuChainIds(line.contextMenu))
  // Explorer links are per-chain, so only single safes and per-chain child rows get one — never the
  // multi-chain parent, whose chainId is just the first network's. On child rows (address hidden) the
  // link rides next to the chain name; SafeInfoDisplay places it there.
  const explorerLink =
    line.variant !== 'group' && chainConfig ? getBlockExplorerLink(chainConfig, line.address) : undefined

  // Empty spacer for child rows keeps their name aligned under the parent's (which fills it with the
  // blockie identicon).
  const leading = line.variant === 'child' ? null : <Identicon address={line.address} />

  return (
    <SafeAccountNameContentView
      identicon={leading}
      warningIcon={warning ? <SimilarityWarningIcon warning={warning} /> : undefined}
      renderSafeInfoDisplay={(props) => (
        <SafeInfoDisplay
          name={line.displayName}
          address={line.address}
          hideAddress={!line.showAddress}
          explorerLink={explorerLink}
          onRename={canRename ? onRename : undefined}
          nameLink={nameLink}
          {...props}
        />
      )}
    />
  )
}

const NameCell = ({
  line,
  expanded,
  warning,
  disableLink,
  onToggle,
  onLinkClick,
  onRename,
}: {
  line: AccountLine
  expanded?: boolean
  warning?: SimilarWarning
  /** In selection mode the row itself toggles the checkbox, so the name never navigates. */
  disableLink?: boolean
  onToggle?: () => void
  onLinkClick?: () => void
  onRename?: () => void
}) => {
  // Only the name text is the navigation link — never a wrapper around the whole cell — so the row's
  // explorer/copy/rename controls stay outside it (a nested <a> is invalid HTML). Expandable group
  // rows render inside a <button>, so they never get a link (an <a> inside a <button> is invalid too);
  // selection mode (disableLink) makes the whole row toggle the checkbox instead of navigating.
  const nameLink =
    line.href && !line.expandable && !disableLink
      ? { href: line.href, onClick: onLinkClick, testId: 'account-row-link' }
      : undefined

  // `warning` replaces the old boolean `isFlagged`: it carries the look-alike peers, so the cell can
  // render the ⚠️ adornment with them listed rather than just tinting the row.
  const content = <NameCellContent line={line} warning={warning} onRename={onRename} nameLink={nameLink} />

  return (
    <SafeAccountNameCellView expandable={line.expandable} expanded={expanded} onToggle={onToggle} content={content} />
  )
}

const ContextMenuCell = ({ line }: { line: AccountLine }) =>
  line.contextMenu.type === 'single' ? (
    <BaseAccountItem.ContextMenu
      address={line.contextMenu.address}
      chainId={line.contextMenu.chainId}
      name={line.contextMenu.name}
      isReplayable={line.contextMenu.addNetwork}
      undeployedSafe={line.contextMenu.undeployedSafe}
      hideNestedSafes
      onClose={undefined}
    />
  ) : (
    <MultiAccountContextMenu
      name={line.contextMenu.name}
      address={line.contextMenu.address}
      chainIds={line.contextMenu.chainIds}
      addNetwork={line.contextMenu.addNetwork}
    />
  )

const SafeAccountTableRow = ({
  line,
  columns,
  expanded,
  showDivider,
  warning,
  highlighted,
  renderActions,
  renderName,
  onRename,
  checkbox,
  onSelectToggle,
  onToggle,
  onLinkClick,
  dragHandleProps,
  rowRef,
  rowDraggableProps,
  isDragging,
  onOverviewsLoaded,
}: SafeAccountTableRowProps) => {
  const router = useRouter()

  // A group parent covers its per-chain safes, a single/child its own. Children don't fetch — the
  // parent already loaded them (enabled = variant !== 'child').
  const rowSafes = useMemo<SafeItem[]>(
    () => (line.variant === 'group' ? (line.networks ?? []) : [line.source as SafeItem]),
    [line],
  )
  const observerRef = useRowOverviews(rowSafes, line.variant !== 'child', onOverviewsLoaded)
  // Compose the visibility observer ref (an object ref) with the drag-and-drop callback ref
  // (only set in reorder mode) — replaces MUI's useForkRef.
  const setRowRef = useCallback(
    (element: HTMLTableRowElement | null) => {
      observerRef.current = element
      if (typeof rowRef === 'function') rowRef(element)
    },
    [observerRef, rowRef],
  )

  // In selection mode a leaf row is one big checkbox — clicking anywhere on it toggles selection
  // (except affordances that stop propagation: the checkbox, actions, copy and explorer link).
  const rowSelectable = Boolean(checkbox) && !line.expandable && !checkbox?.disabled

  // Outside selection mode the whole row is a click target: leaf rows navigate to the safe, group rows
  // toggle their per-chain children. The name keeps its real <a> (for keyboard focus and modifier-clicks
  // that open a new tab) and the other affordances — copy, explorer, rename, the actions menu — keep
  // their own behaviour, so the row handler bails when the click lands on any of them.
  const rowNavigable = !checkbox && !renderName && (line.expandable || line.href != null)

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a, button, [role="button"]')) return
    if (line.expandable) onToggle?.()
    else if (line.href != null) {
      onLinkClick?.(line)
      router.push(line.href)
    }
  }

  // In reorder mode the row can be lifted to `position: fixed`, detaching it from the table's
  // fixed layout — pin each cell's width so the floating row keeps its column alignment.
  const reorderable = Boolean(rowDraggableProps)

  const nameCell = renderName ? (
    renderName(line)
  ) : (
    <NameCell
      line={line}
      expanded={expanded}
      warning={warning}
      // Per-chain child rows can't be renamed on their own — only the whole safe (single/group).
      onRename={onRename && line.variant !== 'child' ? () => onRename(line) : undefined}
      disableLink={Boolean(checkbox)}
      onToggle={onToggle}
      onLinkClick={onLinkClick ? () => onLinkClick(line) : undefined}
    />
  )

  return (
    <SafeAccountTableRowView
      line={line}
      columns={columns}
      showDivider={showDivider}
      highlighted={highlighted}
      isDragging={isDragging}
      checkbox={checkbox}
      clickable={rowSelectable || rowNavigable}
      onRowClick={
        rowSelectable ? () => onSelectToggle?.(!checkbox?.checked) : rowNavigable ? handleRowClick : undefined
      }
      rowRef={setRowRef}
      rowDraggableProps={rowDraggableProps}
      dragHandleProps={dragHandleProps}
      reorderable={reorderable}
      nameCell={nameCell}
      nameOverflows={Boolean(renderName)}
      onSelectToggle={onSelectToggle}
      renderActions={renderActions}
      networksCell={
        <NetworkLogosPill>
          {line.networks ? (
            <BaseAccountItem.ChainBadge safes={line.networks} />
          ) : (
            <BaseAccountItem.ChainBadge chainId={line.chainId} />
          )}
        </NetworkLogosPill>
      }
      fiatBalance={<FiatBalance value={line.balance} />}
      contextMenu={<ContextMenuCell line={line} />}
    />
  )
}

export default SafeAccountTableRow
