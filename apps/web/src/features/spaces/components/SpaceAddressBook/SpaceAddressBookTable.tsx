import { TableCell } from '@/components/ui/table'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import EmailInfo from '@/components/common/EmailInfo'
import { NetworkLogosList } from '@/features/multichain'
import ChainIndicator from '@/components/common/ChainIndicator'
import { BookUser } from 'lucide-react'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceAddressBookActions from './SpaceAddressBookActions'
import { cn } from '@/utils/cn'
import { formatDate } from './ActivityLog'
import PaginatedDataTable, { type DataTableColumn } from '../PaginatedDataTable'

export type AddressBookEntry = SpaceAddressBookItemDto & {
  isLocal: boolean
  isPrivate?: boolean
  isDuplicate?: boolean
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
  const hasMiddleColumn = showAddedBy || showLastUpdated

  const columns: DataTableColumn<AddressBookEntry>[] = [
    { id: 'name', header: 'Name', className: 'w-[20%]', sortValue: (entry) => entry.name },
    { id: 'address', header: 'Address', className: 'w-[30%]', sortValue: (entry) => entry.address },
    { id: 'chains', header: 'Chains', className: 'w-[15%]', sortValue: (entry) => entry.chainIds.length },
    ...(hasMiddleColumn
      ? [
          {
            id: 'middle',
            header: showAddedBy ? 'Added by' : 'Last updated',
            className: 'w-[20%]',
            sortValue: (entry: AddressBookEntry) =>
              showAddedBy ? entry.createdBy : entry.updatedAt || entry.createdAt,
          },
        ]
      : []),
    { id: 'actions', className: hasMiddleColumn ? 'w-[15%]' : 'w-[35%]' },
  ]

  return (
    <PaginatedDataTable
      columns={columns}
      rows={entries}
      getRowKey={(entry) => entry.address}
      getRowClassName={(entry) => (entry.isDuplicate ? 'opacity-50' : '')}
      renderRow={(entry) => (
        <>
          {/* Name */}
          <TableCell className="font-bold">
            <div className={cn('flex items-center gap-1.5 overflow-hidden', entry.isDuplicate && 'line-through')}>
              {entry.isLocal && <BookUser className="text-muted-foreground size-4 flex-shrink-0" />}
              <span className="min-w-0 truncate">{entry.name}</span>
            </div>
          </TableCell>

          {/* Address */}
          <TableCell>
            <div className="text-[0.8em]">
              <EthHashInfo
                address={entry.address}
                shortAddress={false}
                showPrefix={false}
                showName={false}
                highlight4bytes
                hasExplorer
                showCopyButton
                avatarSize={24}
              />
            </div>
          </TableCell>

          {/* Chains */}
          <TableCell>
            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex origin-left scale-85">
                  <NetworkLogosList
                    networks={entry.chainIds.map((chainId) => ({ chainId }))}
                    showHasMore
                    maxVisible={3}
                  />
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
          </TableCell>

          {/* Added by / Last updated (only if applicable) */}
          {hasMiddleColumn && (
            <TableCell>
              {showAddedBy && entry.createdBy ? (
                isAddress(entry.createdBy) ? (
                  <EthHashInfo
                    address={entry.createdBy}
                    avatarSize={20}
                    onlyName
                    showPrefix={false}
                    showCopyButton={false}
                  />
                ) : (
                  <EmailInfo email={entry.createdBy} size="xsmall" />
                )
              ) : showLastUpdated ? (
                <span className="text-muted-foreground text-xs">{formatDate(entry.updatedAt || entry.createdAt)}</span>
              ) : null}
            </TableCell>
          )}

          {/* Actions */}
          <TableCell className="text-right">
            <span className="inline-flex items-center gap-1">
              {renderExtraAction?.(entry)}
              {!entry.isLocal && !entry.isPrivate && <SpaceAddressBookActions entry={entry} />}
            </span>
          </TableCell>
        </>
      )}
    />
  )
}

export default SpaceAddressBookTable
