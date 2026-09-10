import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import EmailInfo from '@/components/common/EmailInfo'
import { NetworkLogosPill } from '@/features/multichain'
import ChainIndicator from '@/components/common/ChainIndicator'
import { HardDrive } from 'lucide-react'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceAddressBookActions from './SpaceAddressBookActions'
import LocalContactActions from './LocalContactActions'
import { formatDate } from '@/features/spaces/utils'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'
import PaginatedDataTable, { type DataTableColumn, type ColumnWidth } from '@/components/common/PaginatedDataTable'
import { cn } from '@/utils/cn'
import AddressCell from './AddressCell'

export type AddressBookEntry = SpaceAddressBookItemDto & {
  isLocal: boolean
  isDuplicate?: boolean
}

// Resolution order: space member name → wallet address → email. Shared
// address-book names are member-editable and are deliberately not used here.
function AddedBy({ createdBy, memberName }: { createdBy: string; memberName?: string }) {
  if (memberName) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <InitialsAvatar name={memberName} size="xsmall" rounded />
        <span className="min-w-0 truncate text-sm">{memberName}</span>
      </span>
    )
  }

  if (isAddress(createdBy)) {
    return (
      <EthHashInfo address={createdBy} avatarSize={20} showName={false} showPrefix={false} showCopyButton={false} />
    )
  }

  return <EmailInfo email={createdBy} size="xsmall" />
}

type SpaceAddressBookTableProps = {
  entries: AddressBookEntry[]
  showAddedBy?: boolean
  showLastUpdated?: boolean
  renderExtraAction?: (entry: AddressBookEntry, context: { isCompact: boolean }) => React.ReactNode
}

function SpaceAddressBookTable({
  entries,
  showAddedBy = true,
  showLastUpdated = false,
  renderExtraAction,
}: SpaceAddressBookTableProps) {
  const resolveMemberName = useMemberNameResolver()
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
      <AddedBy createdBy={entry.createdBy} memberName={resolveMemberName(entry.createdByUserId)} />
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
          {isCompact && <AddressCell address={entry.address} isCompact />}
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
      cell: (entry) => <AddressCell address={entry.address} />,
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
          {entry.isLocal ? (
            <LocalContactActions entry={entry} />
          ) : (
            <SpaceAddressBookActions entry={entry} isCompact={isCompact} />
          )}
        </span>
      ),
    },
  ]

  // Surfaces the columns hidden on mobile (chains, added-by / last-updated)
  const renderRowDetail = (entry: AddressBookEntry) => (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-20 shrink-0">Chains</span>
        <div className="flex flex-wrap gap-1">
          {entry.chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} />
          ))}
        </div>
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

export default SpaceAddressBookTable
