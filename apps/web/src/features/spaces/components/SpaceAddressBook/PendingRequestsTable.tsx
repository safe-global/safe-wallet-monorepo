import { useMemo } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@safe-global/views/components/ui/tooltip'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import Identicon from '@safe-global/views/components/common/Identicon'
import NetworkLogosPill from '@/components/common/NetworkLogosPill'
import NetworkLogosTooltip from '@/components/common/NetworkLogosTooltip'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useGetSpaceAddressBook from '../../public/hooks/useGetSpaceAddressBook'
import { useIsAdmin } from '../../public/hooks/useSpaceMembers'
import useChains from '@/hooks/useChains'
import { Check, X } from 'lucide-react'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import { cn } from '@safe-global/views/utils/cn'
import AddressCell from './AddressCell'
import { useAddressBookRequestActions } from '../../hooks/useAddressBookRequestActions'

type PendingRequestsTableProps = {
  requests: AddressBookRequestItemDto[]
}

function RequestedBy({ requestedBy }: { requestedBy: string }) {
  if (isAddress(requestedBy)) {
    return (
      <div className="text-[0.8em] font-mono">
        <EthHashInfo
          address={requestedBy}
          shortAddress={false}
          showPrefix={false}
          showName={false}
          highlight4bytes
          showCopyButton={false}
          avatarSize={20}
        />
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="shrink-0">
              <Identicon address={requestedBy} size={20} />
            </span>
            <span className="min-w-0 truncate text-left">{requestedBy}</span>
          </span>
        }
      />
      <TooltipContent side="bottom">{requestedBy}</TooltipContent>
    </Tooltip>
  )
}

function PendingRequestsTable({ requests }: PendingRequestsTableProps) {
  const chains = useChains()
  const isAdmin = useIsAdmin()
  const spaceAddressBook = useGetSpaceAddressBook()
  const { approve, reject, reviewingId } = useAddressBookRequestActions()

  // Approving a request for an address that is already in the workspace book
  // overwrites the existing entry, so admins get a warning badge.
  const spaceAddresses = useMemo(
    () => new Set(spaceAddressBook.map((item) => item.address.toLowerCase())),
    [spaceAddressBook],
  )

  // The "All" badge stands on its own; logo stacks get the standard grey pill.
  const renderChains = (req: AddressBookRequestItemDto) =>
    chains.configs.length === req.chainIds.length ? (
      <NetworkLogosTooltip
        networks={req.chainIds.map((chainId) => ({ chainId }))}
        maxVisible={3}
        trigger={<Badge variant="secondary">All</Badge>}
      />
    ) : (
      <NetworkLogosPill networks={req.chainIds.map((chainId) => ({ chainId }))} />
    )

  const columns: DataTableColumn<AddressBookRequestItemDto>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '15%',
      sticky: true,
      minWidth: 120,
      emphasis: 'strong',
      // Compact drops the address column, so the address rides under the name and a long name
      // wraps into the width that frees up instead of truncating.
      cell: (req, { isCompact }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 overflow-hidden">
            <span className={cn('min-w-0', !isCompact && 'truncate')}>{req.name}</span>
            {spaceAddresses.has(req.address.toLowerCase()) && (
              <Tooltip>
                <TooltipTrigger render={<Badge variant="outline">Already in Workspace</Badge>} />
                <TooltipContent>Approving replaces the existing Workspace entry for this address.</TooltipContent>
              </Tooltip>
            )}
          </span>
          {isCompact && <AddressCell address={req.address} isCompact />}
        </div>
      ),
    },
    {
      id: 'address',
      header: 'Address',
      width: '30%',
      minWidth: 240,
      priority: 'secondary',
      cell: (req) => <AddressCell address={req.address} />,
    },
    {
      id: 'chains',
      header: 'Chains',
      width: '15%',
      priority: 'secondary',
      minWidth: 90,
      cell: renderChains,
    },
    {
      id: 'requestedBy',
      header: 'Requested by',
      width: '30%',
      priority: 'secondary',
      minWidth: 140,
      cell: (req) => (req.requestedBy ? <RequestedBy requestedBy={req.requestedBy} /> : null),
    },
    {
      id: 'actions',
      width: '10%',
      align: 'end',
      minWidth: 80,
      cell: (req) =>
        isAdmin ? (
          <span className="inline-flex items-center justify-end gap-1">
            {reviewingId === req.id ? (
              <Spinner className="size-5" />
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-testid="approve-request-btn"
                      onClick={() => approve(req.id)}
                    >
                      <Check className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Accept</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-testid="reject-request-btn"
                      onClick={() => reject(req.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Decline</TooltipContent>
                </Tooltip>
              </>
            )}
          </span>
        ) : (
          <Badge variant="secondary">Pending</Badge>
        ),
    },
  ]

  // Surfaces the columns hidden on mobile (chains, requested-by)
  const renderRowDetail = (req: AddressBookRequestItemDto) => (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-24 shrink-0">Chains</span>
        <div className="flex flex-wrap gap-1">
          {req.chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} />
          ))}
        </div>
      </div>
      {req.requestedBy && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0">Requested by</span>
          <RequestedBy requestedBy={req.requestedBy} />
        </div>
      )}
    </div>
  )

  if (requests.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">No pending requests.</p>
  }

  return (
    <PaginatedDataTable
      columns={columns}
      rows={requests}
      getRowKey={(req) => String(req.id)}
      renderRowDetail={renderRowDetail}
    />
  )
}

export default PendingRequestsTable
