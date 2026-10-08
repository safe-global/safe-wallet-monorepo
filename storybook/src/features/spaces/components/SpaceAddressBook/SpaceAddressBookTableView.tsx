import type { ReactNode } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import EmailInfo from '@/components/common/EmailInfo'
import NetworkLogosPill from '@/features/multichain/components/NetworkLogosPill'
import { HardDrive } from 'lucide-react'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import PaginatedDataTable, { type DataTableColumn, type ColumnWidth } from '@/components/common/PaginatedDataTable'
import { cn } from '@/utils/cn'

export type AddressBookEntry = SpaceAddressBookItemDto & {
  isLocal: boolean
  isDuplicate?: boolean
}

export type SpaceAddressBookTableViewProps = {
  entries: AddressBookEntry[]
  showAddedBy: boolean
  showLastUpdated: boolean
  renderExtraAction?: (entry: AddressBookEntry, context: { isCompact: boolean }) => ReactNode
  resolveMemberName: (userId: number) => string | undefined
  formatDate: (dateStr: string) => string
  isWalletAddress: (value: string) => boolean
  renderAddressCell: (address: string, isCompact?: boolean) => ReactNode
  renderCreatorHashInfo: (address: string) => ReactNode
  renderChainIndicator: (chainId: string) => ReactNode
  renderActions: (entry: AddressBookEntry, isCompact: boolean) => ReactNode
}

// Resolution order: space member name → wallet address → email. Shared
// address-book names are member-editable and are deliberately not used here.
function AddedBy({
  createdBy,
  memberName,
  isWalletAddress,
  renderCreatorHashInfo,
}: {
  createdBy: string
  memberName?: string
  isWalletAddress: (value: string) => boolean
  renderCreatorHashInfo: (address: string) => ReactNode
}) {
  if (memberName) {
    const label = isWalletAddress(memberName) ? shortenAddress(memberName) : memberName

    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <InitialsAvatar name={memberName} size="xsmall" rounded />
        <Tooltip>
          <TooltipTrigger render={<span className="min-w-0 truncate text-left text-sm" />}>{label}</TooltipTrigger>
          <TooltipContent align="start">{memberName}</TooltipContent>
        </Tooltip>
      </span>
    )
  }

  if (isWalletAddress(createdBy)) {
    return <>{renderCreatorHashInfo(createdBy)}</>
  }

  return <EmailInfo email={createdBy} size="xsmall" showTooltip />
}

export function SpaceAddressBookTableView({
  entries,
  showAddedBy,
  showLastUpdated,
  renderExtraAction,
  resolveMemberName,
  formatDate,
  isWalletAddress,
  renderAddressCell,
  renderCreatorHashInfo,
  renderChainIndicator,
  renderActions,
}: SpaceAddressBookTableViewProps) {
  const hasMiddleColumn = showAddedBy || showLastUpdated
  // The extra action is a text button that cannot shrink, so its layout hands the actions column a
  // bigger share and a minimum wide enough to hold it.
  const hasExtraAction = Boolean(renderExtraAction)

  // Chain logo cluster — used in the desktop "Chains" cell.
  const renderChains = (entry: AddressBookEntry) => (
    <NetworkLogosPill networks={entry.chainIds.map((chainId) => ({ chainId }))} />
  )

  // Added-by / Last-updated content — used in the desktop column and the mobile detail row.
  // Resolution order: space member name → wallet address → email.
  const renderAddedBy = (entry: AddressBookEntry) =>
    showAddedBy && entry.createdBy ? (
      <AddedBy
        createdBy={entry.createdBy}
        memberName={resolveMemberName(entry.createdByUserId)}
        isWalletAddress={isWalletAddress}
        renderCreatorHashInfo={renderCreatorHashInfo}
      />
    ) : showLastUpdated ? (
      <span className="text-muted-foreground text-xs">{formatDate(entry.updatedAt || entry.createdAt)}</span>
    ) : null

  const columns: DataTableColumn<AddressBookEntry>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '20%',
      sticky: true,
      minWidth: 120,
      emphasis: 'strong',
      sortValue: (e) => e.name,
      // Compact drops the address column, so the address rides under the name and a long name
      // wraps into the width that frees up instead of truncating.
      cell: (entry, { isCompact }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {entry.isLocal && <HardDrive className="text-muted-foreground size-4 flex-shrink-0" />}
            <Tooltip>
              <TooltipTrigger className={cn('min-w-0 text-left', !isCompact && 'truncate')}>
                {entry.name}
              </TooltipTrigger>
              <TooltipContent>{entry.name}</TooltipContent>
            </Tooltip>
          </div>
          {isCompact && renderAddressCell(entry.address, true)}
        </div>
      ),
    },
    {
      id: 'address',
      header: 'Address',
      width: hasMiddleColumn || hasExtraAction ? '30%' : '40%',
      minWidth: 240,
      priority: 'secondary',
      sortValue: (e) => e.address,
      cell: (entry) => renderAddressCell(entry.address),
    },
    {
      id: 'chains',
      header: 'Chains',
      width: hasExtraAction ? '15%' : '20%',
      priority: 'secondary',
      minWidth: 90,
      sortValue: (e) => e.chainIds.length,
      cell: renderChains,
    },
    ...(hasMiddleColumn
      ? [
          {
            id: 'middle',
            header: showAddedBy ? 'Added by' : 'Last updated',
            width: '15%' as const,
            priority: 'secondary' as const,
            minWidth: 120,
            sortValue: (e: AddressBookEntry) => (showAddedBy ? e.createdBy : e.updatedAt || e.createdAt),
            cell: renderAddedBy,
          },
        ]
      : []),
    {
      id: 'actions',
      width: (hasExtraAction ? '35%' : hasMiddleColumn ? '15%' : '20%') as ColumnWidth,
      align: 'end',
      minWidth: hasExtraAction ? 240 : 80,
      cell: (entry, { isCompact }) => (
        <span className="inline-flex items-center justify-end gap-1">
          {renderExtraAction?.(entry, { isCompact })}
          {renderActions(entry, isCompact)}
        </span>
      ),
    },
  ]

  // Surfaces the columns hidden on mobile (chains, added-by / last-updated)
  const renderRowDetail = (entry: AddressBookEntry) => (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-20 shrink-0">Chains</span>
        <div className="flex flex-wrap gap-1">{entry.chainIds.map((chainId) => renderChainIndicator(chainId))}</div>
      </div>
      {hasMiddleColumn && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-20 shrink-0">{showAddedBy ? 'Added by' : 'Last updated'}</span>
          {renderAddedBy(entry)}
        </div>
      )}
    </div>
  )

  return (
    <PaginatedDataTable
      columns={columns}
      rows={entries}
      getRowKey={(entry) => entry.address}
      getRowClassName={(entry) => (entry.isDuplicate ? 'opacity-50' : '')}
      renderRowDetail={renderRowDetail}
    />
  )
}
