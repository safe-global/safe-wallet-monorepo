import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import EmailInfo from '@/components/common/EmailInfo'
import { NetworkLogosList } from '@/features/multichain'
import ChainIndicator from '@/components/common/ChainIndicator'
import { HardDrive } from 'lucide-react'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceAddressBookActions from './SpaceAddressBookActions'
import LocalContactActions from './LocalContactActions'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/utils/cn'
import { formatDate } from '@/features/spaces/utils'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'
import PaginatedDataTable, { type DataTableColumn } from '../PaginatedDataTable'

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
  renderExtraAction?: (entry: AddressBookEntry) => React.ReactNode
}

function SpaceAddressBookTable({
  entries,
  showAddedBy = true,
  showLastUpdated = false,
  renderExtraAction,
}: SpaceAddressBookTableProps) {
  const isMobile = useIsMobile()
  const resolveMemberName = useMemberNameResolver()
  const hasMiddleColumn = showAddedBy || showLastUpdated

  const columns: DataTableColumn<AddressBookEntry>[] = [
    {
      id: 'name',
      header: 'Name',
      className: 'md:w-[20%]',
      sticky: true,
      minWidth: 140,
      cellClassName: 'font-bold',
      sortValue: (e) => e.name,
    },
    { id: 'address', header: 'Address', className: 'md:w-[30%]', minWidth: 200, sortValue: (e) => e.address },
    {
      id: 'chains',
      header: 'Chains',
      className: 'md:w-[15%]',
      priority: 'secondary',
      minWidth: 100,
      sortValue: (e) => e.chainIds.length,
    },
    ...(hasMiddleColumn
      ? [
          {
            id: 'middle',
            header: showAddedBy ? 'Added by' : 'Last updated',
            className: 'md:w-[20%]',
            priority: 'secondary' as const,
            minWidth: 140,
            sortValue: (e: AddressBookEntry) => (showAddedBy ? e.createdBy : e.updatedAt || e.createdAt),
          },
        ]
      : []),
    {
      id: 'actions',
      className: hasMiddleColumn ? 'md:w-[15%]' : 'md:w-[35%]',
      cellClassName: 'text-right',
      minWidth: 80,
    },
  ]

  // Chain logo cluster — used in the desktop "Chains" cell
  const renderChains = (entry: AddressBookEntry) => (
    <Tooltip>
      <TooltipTrigger>
        <span className="inline-flex origin-left scale-85">
          <NetworkLogosList networks={entry.chainIds.map((chainId) => ({ chainId }))} showHasMore maxVisible={3} />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-1">
          {entry.chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} />
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )

  // Added-by / Last-updated content — used in the desktop column and the mobile detail row.
  // Resolution order: space member name → wallet address → email.
  const renderAddedBy = (entry: AddressBookEntry) =>
    showAddedBy && entry.createdBy ? (
      <AddedBy createdBy={entry.createdBy} memberName={resolveMemberName(entry.createdByUserId)} />
    ) : showLastUpdated ? (
      <span className="text-muted-foreground text-xs">{formatDate(entry.updatedAt || entry.createdAt)}</span>
    ) : null

  const renderCell = (entry: AddressBookEntry, column: DataTableColumn<AddressBookEntry>) => {
    switch (column.id) {
      case 'name':
        return (
          <div className={cn('flex items-center gap-1.5 overflow-hidden', entry.isDuplicate && 'line-through')}>
            {entry.isLocal && <HardDrive className="text-muted-foreground size-4 flex-shrink-0" />}
            <span className="min-w-0 truncate">{entry.name}</span>
          </div>
        )

      case 'address':
        return (
          <div className="text-[0.8em] font-mono">
            <EthHashInfo
              address={entry.address}
              shortAddress={isMobile}
              showPrefix={false}
              showName={false}
              highlight4bytes
              hasExplorer
              showCopyButton
              avatarSize={24}
            />
          </div>
        )

      case 'chains':
        return renderChains(entry)

      case 'middle':
        return renderAddedBy(entry)

      case 'actions':
        return (
          <span className="inline-flex items-center justify-end gap-1">
            {renderExtraAction?.(entry)}
            {entry.isLocal ? <LocalContactActions entry={entry} /> : <SpaceAddressBookActions entry={entry} />}
          </span>
        )

      default:
        return null
    }
  }

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
      renderCell={renderCell}
      renderRowDetail={renderRowDetail}
    />
  )
}

export default SpaceAddressBookTable
