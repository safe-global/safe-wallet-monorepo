import { useEffect, useState } from 'react'
import { Box, Chip, Tooltip } from '@mui/material'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import EthHashInfo from '@/components/common/EthHashInfo'
import { NetworkLogosList } from '@/features/multichain'
import ChainIndicator from '@/components/common/ChainIndicator'
import { SvgIcon } from '@mui/material'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceAddressBookActions from './SpaceAddressBookActions'
import useChains from '@/hooks/useChains'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
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

const PAGE_SIZE = 25

function SpaceAddressBookTable({
  entries,
  showAddedBy = true,
  showLastUpdated = false,
  renderExtraAction,
}: SpaceAddressBookTableProps) {
  const chains = useChains()
  const [page, setPage] = useState(0)

  // Reset to first page when entries change (tab switch, search)
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
                <Tooltip title={entry.name} arrow>
                  <div className={cn('flex items-center gap-1.5 overflow-hidden', entry.isDuplicate && 'line-through')}>
                    {entry.isLocal && (
                      <SvgIcon
                        component={AddressBookIcon}
                        inheritViewBox
                        sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }}
                      />
                    )}
                    <span className="min-w-0 truncate">{entry.name}</span>
                  </div>
                </Tooltip>
              </TableCell>

              {/* Address */}
              <TableCell>
                <div style={{ fontSize: '0.8em' }}>
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
                <Tooltip
                  title={
                    <Box>
                      {entry.chainIds.map((chainId) => (
                        <Box key={chainId} sx={{ p: '4px 0px' }}>
                          <ChainIndicator chainId={chainId} />
                        </Box>
                      ))}
                    </Box>
                  }
                  arrow
                >
                  <span className="inline-flex" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                    {chains.configs.length === entry.chainIds.length ? (
                      <Chip label="All" size="small" />
                    ) : (
                      <NetworkLogosList networks={entry.chainIds.map((chainId) => ({ chainId }))} />
                    )}
                  </span>
                </Tooltip>
              </TableCell>

              {/* 4th column: Added by / Last updated (only if applicable) */}
              {hasMiddleColumn && (
                <TableCell>
                  {showAddedBy && entry.createdBy ? (
                    <EthHashInfo
                      address={entry.createdBy}
                      avatarSize={20}
                      onlyName
                      showPrefix={false}
                      showCopyButton={false}
                    />
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
                  {!entry.isLocal && !entry.isPrivate && <SpaceAddressBookActions entry={entry} />}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 pr-16">
          <p className="text-muted-foreground text-sm">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, entries.length)} of {entries.length}
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
