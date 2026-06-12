import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
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

type HeadCell = EnhancedTableProps['headCells'][number]
type Row = EnhancedTableProps['rows'][number]

function SpaceAddressBookTable({
  entries,
  showAddedBy = true,
  showLastUpdated = false,
  renderExtraAction,
}: SpaceAddressBookTableProps) {
  const hasMiddleColumn = showAddedBy || showLastUpdated

  const headCells: HeadCell[] = [
    { id: 'name', label: 'Name', width: '20%', disableSort: true },
    { id: 'address', label: 'Address', width: '30%', disableSort: true },
    { id: 'chains', label: 'Chains', width: '15%', disableSort: true },
    ...(hasMiddleColumn
      ? [{ id: 'info', label: showAddedBy ? 'Added by' : 'Last updated', width: '20%', disableSort: true }]
      : []),
    { id: 'actions', label: '', width: hasMiddleColumn ? '15%' : '35%', sticky: true, disableSort: true },
  ]

  const rows: Row[] = entries.map((entry) => {
    const dim = entry.isDuplicate ? 'opacity-50' : undefined

    const cells: Row['cells'] = {
      name: {
        rawValue: entry.name,
        content: (
          <Tooltip>
            <TooltipTrigger
              render={
                <div
                  className={cn('flex items-center gap-1.5 overflow-hidden', dim, entry.isDuplicate && 'line-through')}
                />
              }
            >
              {entry.isLocal && <BookUser className="text-muted-foreground size-4 flex-shrink-0" />}
              <span className="min-w-0 truncate">{entry.name}</span>
            </TooltipTrigger>
            <TooltipContent>{entry.name}</TooltipContent>
          </Tooltip>
        ),
      },
      address: {
        rawValue: entry.address,
        content: (
          <div className={cn('text-[0.8em]', dim)}>
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
        ),
      },
      chains: {
        rawValue: entry.chainIds.length,
        content: (
          <Tooltip>
            <TooltipTrigger>
              <span className={cn('inline-flex origin-left scale-85', dim)}>
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
        ),
      },
      ...(hasMiddleColumn
        ? {
            info: {
              rawValue: showAddedBy ? (entry.createdBy ?? '') : entry.updatedAt || entry.createdAt,
              content: (
                <span className={dim}>
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
                    <span className="text-muted-foreground text-xs">
                      {formatDate(entry.updatedAt || entry.createdAt)}
                    </span>
                  ) : null}
                </span>
              ),
            },
          }
        : {}),
      actions: {
        rawValue: '',
        sticky: true,
        content: (
          <div className={cn(tableCss.actions, dim)}>
            {renderExtraAction?.(entry)}
            {!entry.isLocal && !entry.isPrivate && <SpaceAddressBookActions entry={entry} />}
          </div>
        ),
      },
    }

    return { key: entry.address, cells }
  })

  return <EnhancedTable rows={rows} headCells={headCells} fixedLayout />
}

export default SpaceAddressBookTable
