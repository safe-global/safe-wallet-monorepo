import { useEffect, useState } from 'react'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import EmailInfo from '@/components/common/EmailInfo'
import { NetworkLogosList } from '@/features/multichain'
import ChainIndicator from '@/components/common/ChainIndicator'
import { HardDrive, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceAddressBookActions from './SpaceAddressBookActions'
import LocalContactActions from './LocalContactActions'
import { cn } from '@/utils/cn'
import { formatDate } from '@/features/spaces/utils'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'

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

const PAGE_SIZE = 25

function SpaceAddressBookTable({
  entries,
  showAddedBy = true,
  showLastUpdated = false,
  renderExtraAction,
}: SpaceAddressBookTableProps) {
  const [page, setPage] = useState(0)
  const resolveMemberName = useMemberNameResolver()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'))

  useEffect(() => {
    setPage(0)
  }, [entries])

  const hasMiddleColumn = showAddedBy || showLastUpdated
  const totalPages = Math.ceil(entries.length / PAGE_SIZE)
  const paginatedEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%]">Name</TableHead>
            <TableHead className="w-[30%]">Address</TableHead>
            <TableHead className="w-[15%]">Chains</TableHead>
            {hasMiddleColumn && <TableHead className="w-[20%]">{showAddedBy ? 'Added by' : 'Last updated'}</TableHead>}
            <TableHead className={hasMiddleColumn ? 'w-[15%]' : 'w-[35%]'} />
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedEntries.map((entry) => (
            <TableRow key={entry.address} className={entry.isDuplicate ? 'opacity-50' : ''}>
              {/* Name */}
              <TableCell className="font-bold">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div
                        className={cn('flex items-center gap-1.5 overflow-hidden', entry.isDuplicate && 'line-through')}
                      />
                    }
                  >
                    {entry.isLocal && <HardDrive className="text-muted-foreground size-4 flex-shrink-0" />}
                    <span className="min-w-0 truncate">{entry.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>{entry.name}</TooltipContent>
                </Tooltip>
              </TableCell>

              {/* Address */}
              <TableCell>
                <div className="text-[0.8em] font-mono">
                  <EthHashInfo
                    address={entry.address}
                    shortAddress={isSmallScreen}
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

              {/* 4th column: Added by / Last updated (only if applicable) */}
              {hasMiddleColumn && (
                <TableCell>
                  {showAddedBy && entry.createdBy ? (
                    <AddedBy createdBy={entry.createdBy} memberName={resolveMemberName(entry.createdByUserId)} />
                  ) : showLastUpdated ? (
                    <span className="text-muted-foreground text-xs">
                      {formatDate(entry.updatedAt || entry.createdAt)}
                    </span>
                  ) : null}
                </TableCell>
              )}

              {/* Actions */}
              <TableCell className="text-right">
                <span className="inline-flex items-center gap-1">
                  {renderExtraAction?.(entry)}
                  {entry.isLocal ? <LocalContactActions entry={entry} /> : <SpaceAddressBookActions entry={entry} />}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 pr-16">
          <p className="text-muted-foreground text-sm">
            {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, entries.length)} of {entries.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default SpaceAddressBookTable
